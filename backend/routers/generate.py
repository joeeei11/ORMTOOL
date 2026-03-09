"""Router for code generation endpoints."""

from fastapi import APIRouter, HTTPException

from models import GenerateRequest, GenerateResponse
from services.codegen import generate_django, generate_sql, generate_sqlalchemy

router = APIRouter()


@router.post("/generate/sqlalchemy", response_model=GenerateResponse)
def generate_sqlalchemy_route(request: GenerateRequest) -> GenerateResponse:
    try:
        code = generate_sqlalchemy(request)
        return GenerateResponse(code=code)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/generate/django", response_model=GenerateResponse)
def generate_django_route(request: GenerateRequest) -> GenerateResponse:
    try:
        code = generate_django(request)
        return GenerateResponse(code=code)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/generate/sql", response_model=GenerateResponse)
def generate_sql_route(request: GenerateRequest) -> GenerateResponse:
    try:
        code = generate_sql(request)
        return GenerateResponse(code=code)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
