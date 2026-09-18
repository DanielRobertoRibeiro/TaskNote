from typing import Any


class AppError(Exception):
    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        details: Any | None = None,
    ) -> None:
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details
        super().__init__(message)


class NotFoundError(AppError):
    def __init__(self, resource: str) -> None:
        super().__init__(404, "resource_not_found", f"{resource} não encontrado.")


class ConflictError(AppError):
    def __init__(self, message: str) -> None:
        super().__init__(409, "resource_conflict", message)


class UnauthorizedError(AppError):
    def __init__(self, message: str = "Credenciais inválidas.") -> None:
        super().__init__(401, "unauthorized", message)


class ValidationError(AppError):
    def __init__(self, message: str, details: Any | None = None) -> None:
        super().__init__(422, "validation_error", message, details)
