import numpy as np


class FaceIndex:
    def __init__(self) -> None:
        self.embeddings = np.empty((0, 0), dtype=np.float32)
        self.people: list[dict] = []

    def rebuild(self, stored_people: list[dict]) -> None:
        embeddings = []
        people = []

        for person in stored_people:
            stored_embeddings = person.get("embeddings", [])

            # compatibilidade com registros antigos
            if not stored_embeddings and person.get("embedding"):
                stored_embeddings = [person["embedding"]]

            for embedding in stored_embeddings:
                if not embedding:
                    continue

                vetor = np.array(embedding, dtype=np.float32)
                norma = np.linalg.norm(vetor)

                if norma == 0:
                    continue

                embeddings.append(vetor / norma)
                people.append(person)

        if not embeddings:
            self.embeddings = np.empty((0, 0), dtype=np.float32)
            self.people = []
            return

        self.embeddings = np.vstack(embeddings).astype(np.float32)
        self.people = people

    def search(self, query_embedding: list[float]) -> tuple[dict | None, float, list[float]]:
        if len(self.people) == 0:
            return None, 0.0, []

        query = np.array(query_embedding, dtype=np.float32)
        norma = np.linalg.norm(query)

        if norma == 0:
            return None, 0.0, []

        query = query / norma

        scores = self.embeddings @ query
        best_index = int(np.argmax(scores))

        return (
            self.people[best_index],
            float(scores[best_index]),
            self.embeddings[best_index].tolist(),
        )