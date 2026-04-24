import os
import cv2
import joblib
import numpy as np
from insightface.app import FaceAnalysis


class FaceService:
    def __init__(self) -> None:
        self.model_name = "buffalo_l"
        self.model_root = "/root/.insightface"
        self.model_classifier_path = "/app/modelos/classificador_match_embeddings_final.pkl"

        self.app = FaceAnalysis(
            name=self.model_name,
            root=self.model_root,
        )

        # CPU
        # para GPU use ctx_id=0
        self.app.prepare(ctx_id=-1, det_size=(640, 640))

        self.match_classifier = None
        self.threshold_balanceado = 0.60
        self.threshold_estrito = 0.65
        self.threshold_sensivel = 0.55

        self._load_match_classifier()

    def _load_match_classifier(self) -> None:
        if not os.path.exists(self.model_classifier_path):
            print(f"[WARN] Modelo auxiliar não encontrado em: {self.model_classifier_path}")
            self.match_classifier = None
            return

        payload = joblib.load(self.model_classifier_path)

        self.match_classifier = payload.get("classifier")
        self.threshold_balanceado = payload.get("threshold_balanceado", 0.60)
        self.threshold_estrito = payload.get("threshold_estrito", 0.65)
        self.threshold_sensivel = payload.get("threshold_sensivel", 0.55)

        print("[INFO] Modelo auxiliar carregado com sucesso.")

    def image_bytes_to_bgr(self, image_bytes: bytes) -> np.ndarray:
        image_array = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

        if image is None:
            raise ValueError("Imagem inválida ou não suportada.")

        return image

    def extract_embedding(self, image_bytes: bytes) -> list[float]:
        image = self.image_bytes_to_bgr(image_bytes)
        faces = self.app.get(image)

        if len(faces) == 0:
            raise ValueError("Nenhum rosto detectado na imagem.")

        if len(faces) > 1:
            raise ValueError("Mais de um rosto detectado. Envie uma imagem com apenas uma pessoa.")

        face = faces[0]
        embedding = face.embedding
        embedding = embedding / np.linalg.norm(embedding)

        return embedding.astype(float).tolist()

    def cosine_similarity(self, emb1: list[float], emb2: list[float]) -> float:
        a = np.array(emb1, dtype=float)
        b = np.array(emb2, dtype=float)

        denominator = np.linalg.norm(a) * np.linalg.norm(b)

        if denominator == 0:
            return 0.0

        return float(np.dot(a, b) / denominator)

    def pair_features(self, emb1: list[float], emb2: list[float]) -> list[float]:
        a = np.array(emb1, dtype=float)
        b = np.array(emb2, dtype=float)

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
        threshold: float = 0.60,
    ) -> tuple[bool, float]:
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
            threshold = self.threshold_balanceado

        embedding_1 = self.extract_embedding(image_1_bytes)
        embedding_2 = self.extract_embedding(image_2_bytes)

        return self.compare_embeddings(embedding_1, embedding_2, threshold)

    def find_best_match(
        self,
        query_embedding: list[float],
        stored_people: list[dict],
        threshold: float | None = None,
        min_cosine_threshold: float = 0.0,
    ) -> tuple[dict | None, float, float]:
        if threshold is None:
            threshold = self.threshold_balanceado

        best_person = None
        best_model_score = -1.0
        best_cosine_score = -1.0

        for person in stored_people:
            stored_embeddings = person.get("embeddings", [])

            # compatibilidade com registros antigos
            if not stored_embeddings and person.get("embedding"):
                stored_embeddings = [person["embedding"]]

            for stored_embedding in stored_embeddings:
                if not stored_embedding:
                    continue

                cosine_score = self.cosine_similarity(query_embedding, stored_embedding)

                if cosine_score < min_cosine_threshold:
                    continue

                _, model_score = self.compare_embeddings(
                    query_embedding,
                    stored_embedding,
                    threshold=threshold,
                )

                if model_score > best_model_score:
                    best_model_score = model_score
                    best_cosine_score = cosine_score
                    best_person = person

        if best_person is None:
            return None, 0.0, 0.0

        if best_model_score < threshold:
            return None, best_model_score, best_cosine_score

        return best_person, best_model_score, best_cosine_score

    def recognize(
        self,
        image_bytes: bytes,
        stored_people: list[dict],
        threshold: float | None = None,
        min_cosine_threshold: float = 0.0,
    ) -> dict:
        if threshold is None:
            threshold = self.threshold_balanceado

        query_embedding = self.extract_embedding(image_bytes)

        person, model_score, cosine_score = self.find_best_match(
            query_embedding=query_embedding,
            stored_people=stored_people,
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
        }

    def recognize_multiple(
        self,
        image_bytes: bytes,
        stored_people: list[dict],
        threshold: float | None = None,
        min_cosine_threshold: float = 0.0,
    ) -> dict:
        if threshold is None:
            threshold = self.threshold_balanceado

        image = self.image_bytes_to_bgr(image_bytes)
        faces = self.app.get(image)

        results = []

        for face in faces:
            embedding = face.embedding
            embedding = embedding / np.linalg.norm(embedding)
            embedding = embedding.astype(float).tolist()

            person, model_score, cosine_score = self.find_best_match(
                query_embedding=embedding,
                stored_people=stored_people,
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
            "min_cosine_threshold": min_cosine_threshold,
            "classifier_loaded": self.match_classifier is not None,
        }


face_service = FaceService()