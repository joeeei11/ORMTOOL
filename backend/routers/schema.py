"""Router for MySQL reverse-engineering (parse) endpoint."""

from fastapi import APIRouter, HTTPException

from models import DBConnectRequest, ParseResponse
from services.parser import parse_mysql

router = APIRouter()


@router.post("/parse", response_model=ParseResponse)
def parse_schema(body: DBConnectRequest) -> ParseResponse:
    try:
        canvas_data = parse_mysql(
            host=body.host,
            port=body.port,
            user=body.user,
            password=body.password,
            database=body.database,
        )
        return ParseResponse(entities=canvas_data.entities, relations=canvas_data.relations)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"连接失败: {exc}") from exc
