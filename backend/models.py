"""Pydantic models for request/response validation."""

from typing import Optional

from pydantic import BaseModel


class FieldSchema(BaseModel):
    name: str
    type: str
    length: Optional[int] = None
    primary_key: bool = False
    nullable: bool = True


class EntitySchema(BaseModel):
    id: str
    name: str
    fields: list[FieldSchema] = []


class RelationType(str):
    pass


class RelationSchema(BaseModel):
    id: str
    type: str  # one_to_one | one_to_many | many_to_many
    source: str
    target: str
    source_field: str
    target_field: str


class CanvasData(BaseModel):
    entities: list[EntitySchema] = []
    relations: list[RelationSchema] = []


class GenerateRequest(CanvasData):
    pass


class GenerateResponse(BaseModel):
    code: str


class DBConnectRequest(BaseModel):
    host: str
    port: int = 3306
    user: str
    password: str
    database: str


class ParseResponse(CanvasData):
    pass
