import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_default_secret_is_rejected_in_production() -> None:
    with pytest.raises(ValidationError, match="SECRET_KEY deve ser alterada"):
        Settings(environment="production")

    settings = Settings(environment="production", secret_key="x" * 48)
    assert settings.environment == "production"
