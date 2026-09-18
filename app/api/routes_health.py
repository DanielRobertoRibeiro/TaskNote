from fastapi import APIRouter, Response, status
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.api.dependencies import AppSettings, DbSession
from app.schemas.health import HealthResponse

router = APIRouter(tags=["Saúde"])


@router.get("/health", response_model=HealthResponse, summary="Verificar API e banco")
def health(db: DbSession, settings: AppSettings, response: Response) -> HealthResponse:
    try:
        db.execute(text("SELECT 1"))
        return HealthResponse(status="ok", database="ok", version=settings.app_version)
    except SQLAlchemyError:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return HealthResponse(
            status="degraded", database="unavailable", version=settings.app_version
        )
