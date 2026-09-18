from fastapi import APIRouter, status

from app.api.dependencies import AppSettings, DbSession
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar conta",
)
def register(data: RegisterRequest, db: DbSession, settings: AppSettings) -> UserResponse:
    return UserResponse.model_validate(AuthService(db, settings).register(data))


@router.post("/login", response_model=TokenResponse, summary="Autenticar e emitir JWT")
def login(data: LoginRequest, db: DbSession, settings: AppSettings) -> TokenResponse:
    return AuthService(db, settings).login(data)
