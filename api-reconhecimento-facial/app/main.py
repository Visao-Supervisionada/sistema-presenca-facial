from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.face_service import face_service
from app.local_store import (
    add_person,
    clear_people,
    delete_person_by_registration,
    list_people_without_embeddings,
    load_people,
)
from app.schemas import (
    RootResponse,
    HealthResponse,
    PeopleListResponse,
    EnrollResponse,
    RecognizeResponse,
    CompareResponse,
    DeletePeopleResponse,
    RecognizeMultipleResponse,
)


app = FastAPI(title="API de Presença Facial Local")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", response_model=RootResponse)
def root():
    return {
        "message": "API de Presença Facial Local",
        "docs": "/docs",
    }


@app.get("/health", response_model=HealthResponse)
def health():
    return {
        "status": "ok",
        "service": "api-presenca-facial",
        "model": "insightface/buffalo_l",
        "storage": "local-json",
        "classifier_loaded": face_service.match_classifier is not None,
    }


@app.get("/people", response_model=PeopleListResponse)
def get_people():
    people = list_people_without_embeddings()

    return {
        "total": len(people),
        "people": people,
    }


@app.post("/enroll", response_model=EnrollResponse)
async def enroll(
    name: str = Form(...),
    registration: str = Form(""),
    file: UploadFile = File(...),
):
    try:
        image_bytes = await file.read()
        embedding = face_service.extract_embedding(image_bytes)

        person = add_person(
            name=name,
            registration=registration,
            embedding=embedding,
        )

        return {
            "success": True,
            "message": "Pessoa cadastrada com sucesso.",
            "person": {
                "id": person["id"],
                "name": person["name"],
                "registration": person.get("registration", ""),
            },
        }

    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(error)}")


@app.post("/recognize", response_model=RecognizeResponse)
async def recognize(
    file: UploadFile = File(...),
    threshold: float = Form(0.60),
    min_cosine_threshold: float = Form(0.0),
):
    try:
        image_bytes = await file.read()
        stored_people = load_people()

        if len(stored_people) == 0:
            return {
                "matched": False,
                "message": "Nenhuma pessoa cadastrada.",
                "confidence": 0.0,
                "cosine_confidence": 0.0,
                "threshold": threshold,
                "person": None,
            }

        result = face_service.recognize(
            image_bytes=image_bytes,
            stored_people=stored_people,
            threshold=threshold,
            min_cosine_threshold=min_cosine_threshold,
        )

        if not result["matched"]:
            return {
                "matched": False,
                "message": "Pessoa não reconhecida.",
                "confidence": result["confidence"],
                "cosine_confidence": result["cosine_confidence"],
                "threshold": result["threshold"],
                "person": None,
            }

        return {
            "matched": True,
            "message": "Pessoa reconhecida.",
            "confidence": result["confidence"],
            "cosine_confidence": result["cosine_confidence"],
            "threshold": result["threshold"],
            "person": result["person"],
        }

    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(error)}")


@app.post("/recognize-multiple", response_model=RecognizeMultipleResponse)
async def recognize_multiple(
    file: UploadFile = File(...),
    threshold: float = Form(0.60),
    min_cosine_threshold: float = Form(0.0),
):
    try:
        image_bytes = await file.read()
        stored_people = load_people()

        result = face_service.recognize_multiple(
            image_bytes=image_bytes,
            stored_people=stored_people,
            threshold=threshold,
            min_cosine_threshold=min_cosine_threshold,
        )

        return result

    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(error)}")


@app.post("/compare", response_model=CompareResponse)
async def compare(
    file1: UploadFile = File(...),
    file2: UploadFile = File(...),
    threshold: float = Form(0.60),
):
    try:
        image_1_bytes = await file1.read()
        image_2_bytes = await file2.read()

        match, score = face_service.compare_two_images(
            image_1_bytes=image_1_bytes,
            image_2_bytes=image_2_bytes,
            threshold=threshold,
        )

        return {
            "match": match,
            "confidence": score,
            "threshold": threshold,
        }

    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(error)}")


@app.delete("/people", response_model=DeletePeopleResponse)
def delete_people():
    clear_people()

    return {
        "success": True,
        "message": "Todos os cadastros locais foram removidos.",
    }


@app.delete("/people/{registration}")
def delete_person(registration: str):
    deleted = delete_person_by_registration(registration)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Pessoa não encontrada na base facial.",
        )

    return {
        "success": True,
        "message": "Pessoa removida da base facial.",
        "registration": registration,
    }