import os
import cv2
import joblib
import numpy as np
from insightface.app import FaceAnalysis

from app.face_index import FaceIndex


class FaceService:
    def __init__(self) -> None:
        self.model_name = os.getenv("FACE_MODEL_NAME", "buffalo_s")
        self.model_root = os.getenv("INSIGHTFACE_HOME", "/root/.insightface")
        self.model_classifier_path = self._resolver_caminho_modelo(
            os.getenv(
                "FACE_CLASSIFIER_PATH",
                "/app/modelos/classificador_match_embeddings_buffalo_s.pkl",
            )
        )

        self.app = FaceAnalysis(
            name=self.model_name,
            root=self.model_root,
        )

        ctx_id = int(os.getenv("FACE_CTX_ID", "0"))
        det_size = int(os.getenv("FACE_DET_SIZE", "320"))

        # ctx_id 0 usa gpu; ctx_id -1 usa cpu
        self.app.prepare(ctx_id=ctx_id, det_size=(det_size, det_size))

        self.match_classifier = None

        # thresholds principais
        self.match_threshold = self._env_float("FACE_MATCH_THRESHOLD", 0.50)
        self.unknown_threshold = self._env_float("FACE_UNKNOWN_THRESHOLD", 0.45)
        self.min_cosine_threshold = self._env_float("FACE_MIN_COSINE_THRESHOLD", 0.35)

        # mantidos por compatibilidade com rotas antigas
        self.threshold_balanceado = self.match_threshold
        self.threshold_estrito = self._env_float("FACE_STRICT_THRESHOLD", 0.65)
        self.threshold_sensivel = self._env_float("FACE_SENSITIVE_THRESHOLD", 0.55)

        self.face_index = FaceIndex()

        self._load_match_classifier()

    def _env_float(self, name: str, default: float) -> float:
        value = os.getenv(name)

        if value is None:
            return default

        try:
            return float(value)
        except ValueError:
            return default

    def _resolver_caminho_modelo(self, caminho: str) -> str:
        if os.path.exists(caminho):
            return caminho

        caminho_local = os.path.join(
            os.getcwd(),
            "modelos",
            "classificador_match_embeddings_buffalo_s.pkl",
        )

        if os.path.exists(caminho_local):
            return caminho_local

        return caminho

    def _load_match_classifier(self) -> None:
        if not os.path.exists(self.model_classifier_path):
            print(f"[WARN] Modelo auxiliar não encontrado em: {self.model_classifier_path}")
            self.match_classifier = None
            return

        payload = joblib.load(self.model_classifier_path)

        if isinstance(payload, dict):
            self.match_classifier = payload.get("classifier")

            self.match_threshold = self._env_float(
                "FACE_MATCH_THRESHOLD",
                float(
                    payload.get(
                        "threshold_match",
                        payload.get("threshold_balanceado", self.match_threshold),
                    )
                ),
            )

            self.unknown_threshold = self._env_float(
                "FACE_UNKNOWN_THRESHOLD",
                float(payload.get("threshold_open_set", self.unknown_threshold)),
            )

            self.threshold_balanceado = self.match_threshold
            self.threshold_estrito = float(
                payload.get("threshold_estrito", self.threshold_estrito)
            )
            self.threshold_sensivel = float(
                payload.get("threshold_sensivel", self.threshold_sensivel)
            )
        else:
            self.match_classifier = payload

        if self.match_classifier is None:
            print("[WARN] Artefato carregado, mas classificador não encontrado.")
            return

        print("[INFO] Modelo auxiliar carregado com sucesso.")
        print(f"[INFO] Match threshold: {self.match_threshold}")
        print(f"[INFO] Unknown threshold: {self.unknown_threshold}")

    def rebuild_index(self, stored_people: list[dict]) -> None:
        self.face_index.rebuild(stored_people)

    def image_bytes_to_bgr(self, image_bytes: bytes) -> np.ndarray:
        image_array = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

        if image is None:
            raise ValueError("Imagem inválida ou não suportada.")

        return image

    def _normalizar_embedding(self, embedding: np.ndarray) -> np.ndarray:
        embedding = embedding.astype(np.float32)
        norma = np.linalg.norm(embedding)

        if norma == 0:
            return embedding

        return embedding / norma

    def extract_embedding(self, image_bytes: bytes) -> list[float]:
        image = self.image_bytes_to_bgr(image_bytes)
        faces = self.app.get(image)

        if len(faces) == 0:
            raise ValueError("Nenhum rosto detectado na imagem.")

        if len(faces) > 1:
            raise ValueError("Mais de um rosto detectado. Envie uma imagem com apenas uma pessoa.")

        face = faces[0]
        embedding = self._normalizar_embedding(face.embedding)

        return embedding.astype(float).tolist()

    def cosine_similarity(self, emb1: list[float], emb2: list[float]) -> float:
        a = np.array(emb1, dtype=np.float32)
        b = np.array(emb2, dtype=np.float32)

        denominator = np.linalg.norm(a) * np.linalg.norm(b)

        if denominator == 0:
            return 0.0

        return float(np.dot(a, b) / denominator)

    def pair_features(self, emb1: list[float], emb2: list[float]) -> list[float]:
        a = np.array(emb1, dtype=np.float32)
        b = np.array(emb2, dtype=np.float32)

        cos_sim = self.cosine_similarity(emb1, emb2)
        l2_dist = float(np.linalg.norm(a - b))
        abs_diff = np.abs(a - b)

        return [
            cos_sim,
            l2_dist,
            float(np.mean(abs_diff)),
            float(np.max(abs_diff)),
            float(np.min(abs_diff)),
            float(np.std(abs_diff)),
        ]

    def compare_embeddings(
        self,
        emb1: list[float],
        emb2: list[float],
        threshold: float | None = None,
    ) -> tuple[bool, float]:
        if threshold is None:
            threshold = self.match_threshold

        if self.match_classifier is not None:
            features = np.array([self.pair_features(emb1, emb2)], dtype=np.float32)
            score = float(self.match_classifier.predict_proba(features)[0][1])
            return score >= threshold, score

        score = self.cosine_similarity(emb1, emb2)
        return score >= threshold, score

    def compare_two_images(
        self,
        image_1_bytes: bytes,
        image_2_bytes: bytes,
        threshold: float | None = None,
    ) -> tuple[bool, float]:
        if threshold is None:
            threshold = self.match_threshold

        embedding_1 = self.extract_embedding(image_1_bytes)
        embedding_2 = self.extract_embedding(image_2_bytes)

        return self.compare_embeddings(embedding_1, embedding_2, threshold)

    def find_best_match_fast(
        self,
        query_embedding: list[float],
        threshold: float | None = None,
        min_cosine_threshold: float | None = None,
    ) -> tuple[dict | None, float, float]:
        if threshold is None:
            threshold = self.match_threshold

        if min_cosine_threshold is None:
            min_cosine_threshold = self.min_cosine_threshold

        person, cosine_score, stored_embedding = self.face_index.search(query_embedding)

        if person is None:
            return None, 0.0, 0.0

        limite_desconhecido = max(min_cosine_threshold, self.unknown_threshold)

        # rejeição rápida de desconhecidos
        if cosine_score < limite_desconhecido:
            return None, 0.0, cosine_score

        # caso fácil: similaridade alta aceita direto
        if cosine_score >= threshold:
            return person, cosine_score, cosine_score

        # caso intermediário: usa classificador auxiliar
        if self.match_classifier is None:
            return None, cosine_score, cosine_score

        features = np.array(
            [self.pair_features(query_embedding, stored_embedding)],
            dtype=np.float32,
        )

        model_score = float(self.match_classifier.predict_proba(features)[0][1])

        if model_score < self.match_threshold:
            return None, model_score, cosine_score

        return person, model_score, cosine_score

    def recognize(
        self,
        image_bytes: bytes,
        stored_people: list[dict],
        threshold: float | None = None,
        min_cosine_threshold: float | None = None,
    ) -> dict:
        if threshold is None:
            threshold = self.match_threshold

        if min_cosine_threshold is None:
            min_cosine_threshold = self.min_cosine_threshold

        if len(self.face_index.people) == 0 and stored_people:
            self.rebuild_index(stored_people)

        query_embedding = self.extract_embedding(image_bytes)

        person, model_score, cosine_score = self.find_best_match_fast(
            query_embedding=query_embedding,
            threshold=threshold,
            min_cosine_threshold=min_cosine_threshold,
        )

        if person is None:
            return {
                "matched": False,
                "person": None,
                "confidence": model_score,
                "cosine_confidence": cosine_score,
                "threshold": threshold,
                "unknown_threshold": self.unknown_threshold,
            }

        return {
            "matched": True,
            "person": {
                "id": person["id"],
                "name": person["name"],
                "registration": person.get("registration", ""),
            },
            "confidence": model_score,
            "cosine_confidence": cosine_score,
            "threshold": threshold,
            "unknown_threshold": self.unknown_threshold,
        }

    def recognize_multiple(
        self,
        image_bytes: bytes,
        stored_people: list[dict],
        threshold: float | None = None,
        min_cosine_threshold: float | None = None,
    ) -> dict:
        if threshold is None:
            threshold = self.match_threshold

        if min_cosine_threshold is None:
            min_cosine_threshold = self.min_cosine_threshold

        if len(self.face_index.people) == 0 and stored_people:
            self.rebuild_index(stored_people)

        image = self.image_bytes_to_bgr(image_bytes)
        faces = self.app.get(image)

        results = []

        for face in faces:
            embedding = self._normalizar_embedding(face.embedding)
            embedding = embedding.astype(float).tolist()

            person, model_score, cosine_score = self.find_best_match_fast(
                query_embedding=embedding,
                threshold=threshold,
                min_cosine_threshold=min_cosine_threshold,
            )

            bbox = face.bbox.astype(int).tolist()

            if person is None:
                results.append(
                    {
                        "bbox": bbox,
                        "matched": False,
                        "name": "Desconhecido",
                        "registration": "",
                        "confidence": model_score,
                        "cosine_confidence": cosine_score,
                    }
                )
            else:
                results.append(
                    {
                        "bbox": bbox,
                        "matched": True,
                        "name": person["name"],
                        "registration": person.get("registration", ""),
                        "confidence": model_score,
                        "cosine_confidence": cosine_score,
                    }
                )

        return {
            "total_faces": len(results),
            "results": results,
            "threshold": threshold,
            "unknown_threshold": self.unknown_threshold,
            "min_cosine_threshold": min_cosine_threshold,
            "classifier_loaded": self.match_classifier is not None,
            "model": self.model_name,
        }


face_service = FaceService()