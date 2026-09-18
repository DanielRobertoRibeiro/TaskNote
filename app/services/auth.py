from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import create_access_token, hash_password, verify_password
from app.db.models import User
from app.repositories.users import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse


class AuthService:
    def __init__(self, db: Session, settings: Settings) -> None:
        self.db = db
        self.settings = settings
        self.users = UserRepository(db)

    @staticmethod
    def normalize_email(email: str) -> str:
        return email.strip().casefold()

    def register(self, data: RegisterRequest) -> User:
        email = self.normalize_email(str(data.email))
        if self.users.get_by_email(email):
            raise ConflictError("Já existe uma conta com este e-mail.")
        try:
            return self.users.create(
                name=data.name,
                email=email,
                password_hash=hash_password(data.password),
            )
        except IntegrityError as exc:
            self.db.rollback()
            raise ConflictError("Já existe uma conta com este e-mail.") from exc

    def login(self, data: LoginRequest) -> TokenResponse:
        user = self.users.get_by_email(self.normalize_email(str(data.email)))
        if user is None or not verify_password(data.password, user.password_hash):
            raise UnauthorizedError("E-mail ou senha inválidos.")
        token, expires_in = create_access_token(user.id, self.settings)
        return TokenResponse(access_token=token, expires_in=expires_in, user=user)
