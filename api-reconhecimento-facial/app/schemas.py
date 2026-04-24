from pydantic import BaseModel
from typing import List, Optional


class RootResponse(BaseModel):
    message: str
    docs: str


class HealthResponse(BaseModel):
    status: str
    service: str
    model: str
    storage: str
    classifier_loaded: bool


class PersonResponse(BaseModel):
    id: str
    name: str
    registration: str = ""


class PeopleListResponse(BaseModel):
    total: int
    people: List[PersonResponse]


class EnrollResponse(BaseModel):
    success: bool
    message: str
    person: PersonResponse


class RecognizedPersonResponse(BaseModel):
    id: str
    name: str
    registration: str = ""


class RecognizeResponse(BaseModel):
    matched: bool
    message: str
    confidence: float
    cosine_confidence: float = 0.0
    threshold: Optional[float] = None
    person: Optional[RecognizedPersonResponse] = None


class CompareResponse(BaseModel):
    match: bool
    confidence: float
    threshold: float


class DeletePeopleResponse(BaseModel):
    success: bool
    message: str


class MultiFaceResult(BaseModel):
    bbox: List[int]
    matched: bool
    name: str
    registration: str = ""
    confidence: float
    cosine_confidence: float = 0.0


class RecognizeMultipleResponse(BaseModel):
    total_faces: int
    results: List[MultiFaceResult]
    threshold: float
    min_cosine_threshold: float
    classifier_loaded: bool