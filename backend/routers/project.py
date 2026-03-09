"""Router for project save/load endpoints."""

from pathlib import Path

from fastapi import APIRouter, HTTPException

from models import CanvasData

router = APIRouter()

PROJECTS_DIR = Path(__file__).parent.parent / "projects"
LATEST_FILE = PROJECTS_DIR / "latest.json"


@router.post("/project/save")
def save_project(data: CanvasData) -> dict:
    PROJECTS_DIR.mkdir(exist_ok=True)
    LATEST_FILE.write_text(data.model_dump_json(), encoding="utf-8")
    return {"status": "saved"}


@router.get("/project/load", response_model=CanvasData)
def load_project() -> CanvasData:
    if not LATEST_FILE.exists():
        raise HTTPException(status_code=404, detail="No saved project found")
    raw = LATEST_FILE.read_text(encoding="utf-8")
    return CanvasData.model_validate_json(raw)
