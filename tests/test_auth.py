from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import User


def test_register_login_and_password_is_hashed(client: TestClient, db: Session) -> None:
    payload = {
        "name": "Daniel Ribeiro",
        "email": "DANIEL@Example.com",
        "password": "minha-senha-segura",
    }
    created = client.post("/api/v1/auth/register", json=payload)

    assert created.status_code == 201
    assert created.json()["email"] == "daniel@example.com"
    assert "password" not in created.json()

    user = db.scalar(select(User).where(User.email == "daniel@example.com"))
    assert user is not None
    assert user.password_hash != payload["password"]
    assert user.password_hash.startswith("$argon2")

    logged_in = client.post(
        "/api/v1/auth/login",
        json={"email": payload["email"], "password": payload["password"]},
    )
    assert logged_in.status_code == 200
    assert logged_in.json()["token_type"] == "bearer"
    assert logged_in.json()["expires_in"] == 3600


def test_duplicate_email_and_invalid_credentials_return_consistent_errors(
    client: TestClient,
) -> None:
    payload = {
        "name": "Usuário Teste",
        "email": "user@example.com",
        "password": "senha-segura-123",
    }
    assert client.post("/api/v1/auth/register", json=payload).status_code == 201

    duplicate = client.post("/api/v1/auth/register", json=payload)
    invalid_login = client.post(
        "/api/v1/auth/login", json={"email": payload["email"], "password": "errada"}
    )

    assert duplicate.status_code == 409
    assert duplicate.json()["error"]["code"] == "resource_conflict"
    assert invalid_login.status_code == 401
    assert invalid_login.json()["error"]["code"] == "unauthorized"
    assert invalid_login.headers["www-authenticate"] == "Bearer"


def test_protected_endpoint_requires_valid_token(client: TestClient) -> None:
    missing = client.get("/api/v1/tasks")
    invalid = client.get("/api/v1/tasks", headers={"Authorization": "Bearer token-invalido"})

    assert missing.status_code == 401
    assert invalid.status_code == 401


def test_validation_error_has_consistent_shape(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={"name": "A", "email": "invalido", "password": "123"},
    )

    assert response.status_code == 422
    body = response.json()
    assert body["error"]["code"] == "validation_error"
    assert body["error"]["details"]
    assert body["request_id"]
