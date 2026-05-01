import json
import os
from typing import Any, Dict, List
from uuid import uuid4


DATA_PATH = "/app/data/embeddings.json"


def ensure_data_file() -> None:
    os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)

    if not os.path.exists(DATA_PATH):
        with open(DATA_PATH, "w", encoding="utf-8") as file:
            json.dump([], file, ensure_ascii=False, indent=2)


def load_people() -> List[Dict[str, Any]]:
    ensure_data_file()

    with open(DATA_PATH, "r", encoding="utf-8") as file:
        try:
            people = json.load(file)
        except json.JSONDecodeError:
            return []

    normalized_people: List[Dict[str, Any]] = []

    for person in people:
        normalized_person = {
            "id": person.get("id", str(uuid4())),
            "name": person.get("name", ""),
            "registration": person.get("registration", ""),
            "embeddings": [],
        }

        if "embeddings" in person and isinstance(person["embeddings"], list):
            normalized_person["embeddings"] = person["embeddings"]
        elif "embedding" in person and isinstance(person["embedding"], list):
            normalized_person["embeddings"] = [person["embedding"]]

        normalized_people.append(normalized_person)

    return normalized_people


def save_people(people: List[Dict[str, Any]]) -> None:
    ensure_data_file()

    with open(DATA_PATH, "w", encoding="utf-8") as file:
        json.dump(people, file, ensure_ascii=False, indent=2)


def add_person(name: str, registration: str, embedding: List[float]) -> Dict[str, Any]:
    people = load_people()

    normalized_name = name.strip()
    normalized_registration = registration.strip()

    existing_person = None

    for person in people:
        if normalized_registration and person.get("registration", "").strip() == normalized_registration:
            existing_person = person
            break

    if existing_person is None:
        existing_person = {
            "id": str(uuid4()),
            "name": normalized_name,
            "registration": normalized_registration,
            "embeddings": [],
        }
        people.append(existing_person)

    existing_person["name"] = normalized_name
    existing_person["registration"] = normalized_registration
    existing_person.setdefault("embeddings", [])
    existing_person["embeddings"].append(embedding)

    save_people(people)

    return existing_person


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
    save_people([])


def delete_person_by_registration(registration: str) -> bool:
    people = load_people()

    normalized_registration = registration.strip()

    filtered_people = [
        person
        for person in people
        if person.get("registration", "").strip() != normalized_registration
    ]

    if len(filtered_people) == len(people):
        return False

    save_people(filtered_people)
    return True