from fastapi.testclient import TestClient


def test_root_and_health(client: TestClient) -> None:
    root = client.get("/")
    health = client.get("/api/v1/health")

    assert root.status_code == 200
    assert root.json()["docs"] == "/docs"
    assert health.status_code == 200
    assert health.json() == {"status": "ok", "database": "ok", "version": "1.0.0"}


def test_openapi_is_available(client: TestClient) -> None:
    response = client.get("/openapi.json")

    assert response.status_code == 200
    assert response.json()["info"]["title"] == "TaskNote"
    assert "/api/v1/tasks" in response.json()["paths"]
