from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.exceptions import UnauthorizedError
from app.core.security import decode_access_token
from app.db.models import User
from app.db.session import get_db
from app.repositories.users import UserRepository

DbSession = Annotated[Session, Depends(get_db)]
AppSettings = Annotated[Settings, Depends(get_settings)]

bearer_scheme = HTTPBearer(auto_error=False, description="Token JWT obtido em /auth/login")


def get_current_user(
    db: DbSession,
    settings: AppSettings,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> User:
    if credentials is None or credentials.scheme.casefold() != "bearer":
        raise UnauthorizedError("Token de acesso ausente.")
    user_id = decode_access_token(credentials.credentials, settings)
    if user_id is None:
        raise UnauthorizedError("Token de acesso inválido ou expirado.")
    user = UserRepository(db).get_by_id(user_id)
    if user is None:
        raise UnauthorizedError("Usuário do token não existe.")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
