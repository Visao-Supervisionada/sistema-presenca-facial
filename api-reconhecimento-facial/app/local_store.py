import os
from typing import Any, Dict, List
from uuid import uuid4

import firebase_admin
from firebase_admin import credentials, firestore


FACE_COLLECTION = os.getenv("FACE_EMBEDDINGS_COLLECTION", "face_embeddings")
MODEL_NAME = os.getenv("FACE_MODEL_NAME", "insightface/buffalo_s")

_db = None


def get_db():
    global _db

    if _db is not None:
        return _db

    if not firebase_admin._apps:
        credential_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

        if not credential_path or not os.path.exists(credential_path):
            raise RuntimeError(
                "GOOGLE_APPLICATION_CREDENTIALS não foi definida ou o arquivo não existe."
            )

        cred = credentials.Certificate(credential_path)
        firebase_admin.initialize_app(cred)

    _db = firestore.client()
    return _db


def _collection():
    return get_db().collection(FACE_COLLECTION)


def _normalizar_matricula(valor: str) -> str:
    return str(valor or "").strip()


def _normalizar_nome(valor: str) -> str:
    return str(valor or "").strip()


def _buscar_face_id_por_matricula(matricula: str) -> str | None:
    matricula = _normalizar_matricula(matricula)

    if not matricula:
        return None

    docs = (
        _collection()
        .where("matricula", "==", matricula)
        .limit(1)
        .stream()
    )

    for doc in docs:
        data = doc.to_dict() or {}
        return data.get("faceId") or data.get("id")

    return None


def load_people() -> List[Dict[str, Any]]:
    docs = (
        _collection()
        .where("ativo", "==", True)
        .stream()
    )

    pessoas_por_matricula: dict[str, Dict[str, Any]] = {}

    for doc in docs:
        data = doc.to_dict() or {}

        embedding = data.get("embedding")

        if not embedding:
            continue

        matricula = _normalizar_matricula(
            data.get("matricula") or data.get("registration")
        )

        face_id = str(data.get("faceId") or data.get("id") or doc.id)
        nome = _normalizar_nome(data.get("nome") or data.get("name"))

        chave = matricula or face_id

        if chave not in pessoas_por_matricula:
            pessoas_por_matricula[chave] = {
                "id": face_id,
                "name": nome,
                "registration": matricula,
                "embeddings": [],
            }

        pessoas_por_matricula[chave]["embeddings"].append(embedding)

    return list(pessoas_por_matricula.values())


def add_person(name: str, registration: str, embedding: List[float]) -> Dict[str, Any]:
    nome = _normalizar_nome(name)
    matricula = _normalizar_matricula(registration)

    face_id_existente = _buscar_face_id_por_matricula(matricula)
    face_id = face_id_existente or str(uuid4())

    doc_ref = _collection().document()

    doc_ref.set(
        {
            "id": doc_ref.id,
            "faceId": face_id,
            "nome": nome,
            "name": nome,
            "matricula": matricula,
            "registration": matricula,
            "ativo": True,
            "modelo": MODEL_NAME,
            "embedding": embedding,
            "criadoEm": firestore.SERVER_TIMESTAMP,
            "atualizadoEm": firestore.SERVER_TIMESTAMP,
        }
    )

    return {
        "id": face_id,
        "name": nome,
        "registration": matricula,
        "embeddings": [embedding],
    }


def list_people_without_embeddings() -> List[Dict[str, str]]:
    people = load_people()

    return [
        {
            "id": person["id"],
            "name": person["name"],
            "registration": person.get("registration", ""),
        }
        for person in people
    ]


def clear_people() -> None:
    docs = _collection().stream()

    for doc in docs:
        doc.reference.delete()


def delete_person_by_registration(registration: str) -> bool:
    matricula = _normalizar_matricula(registration)

    if not matricula:
        return False

    docs = list(
        _collection()
        .where("matricula", "==", matricula)
        .stream()
    )

    if not docs:
        return False

    for doc in docs:
        doc.reference.delete()

    return True


def save_people(_people: List[Dict[str, Any]]) -> None:
    # mantido apenas por compatibilidade
    return