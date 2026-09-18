from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient


def test_task_crud_status_and_tags(client: TestClient, auth_headers) -> None:
    headers = auth_headers()
    tag = client.post("/api/v1/tags", headers=headers, json={"name": "Faculdade"}).json()
    due_at = (datetime.now(UTC) + timedelta(days=3)).isoformat()

    created = client.post(
        "/api/v1/tasks",
        headers=headers,
        json={
            "title": " Preparar apresentação ",
            "description": "Revisar conteúdo",
            "priority": "alta",
            "due_at": due_at,
            "tag_ids": [tag["id"]],
        },
    )
    assert created.status_code == 201
    task_id = created.json()["id"]
    assert created.json()["title"] == "Preparar apresentação"
    assert created.json()["status"] == "pendente"
    assert created.json()["tags"][0]["name"] == "Faculdade"

    updated = client.patch(f"/api/v1/tasks/{task_id}", headers=headers, json={"priority": "media"})
    assert updated.status_code == 200
    assert updated.json()["priority"] == "media"

    completed = client.patch(
        f"/api/v1/tasks/{task_id}/status",
        headers=headers,
        json={"status": "concluida"},
    )
    assert completed.status_code == 200
    assert completed.json()["completed_at"] is not None

    reopened = client.patch(
        f"/api/v1/tasks/{task_id}/status",
        headers=headers,
        json={"status": "em_andamento"},
    )
    assert reopened.json()["completed_at"] is None

    assert client.delete(f"/api/v1/tasks/{task_id}", headers=headers).status_code == 204
    assert client.get(f"/api/v1/tasks/{task_id}", headers=headers).status_code == 404


def test_user_cannot_access_another_users_task(client: TestClient, auth_headers) -> None:
    owner = auth_headers("owner")
    other = auth_headers("other")
    task = client.post(
        "/api/v1/tasks", headers=owner, json={"title": "Segredo", "priority": "alta"}
    ).json()

    assert client.get(f"/api/v1/tasks/{task['id']}", headers=other).status_code == 404
    assert (
        client.patch(
            f"/api/v1/tasks/{task['id']}", headers=other, json={"title": "Invadida"}
        ).status_code
        == 404
    )
    assert client.delete(f"/api/v1/tasks/{task['id']}", headers=other).status_code == 404


def test_filters_search_overdue_and_pagination(client: TestClient, auth_headers) -> None:
    headers = auth_headers()
    tag = client.post("/api/v1/tags", headers=headers, json={"name": "Trabalho"}).json()
    yesterday = (datetime.now(UTC) - timedelta(days=1)).isoformat()
    tomorrow = (datetime.now(UTC) + timedelta(days=1)).isoformat()
    tasks = [
        {
            "title": "Relatório trimestral",
            "description": "Reunir métricas",
            "priority": "alta",
            "due_at": yesterday,
            "tag_ids": [tag["id"]],
        },
        {"title": "Comprar café", "priority": "baixa", "due_at": tomorrow},
        {"title": "Revisar relatório", "priority": "media", "due_at": tomorrow},
    ]
    for task in tasks:
        assert client.post("/api/v1/tasks", headers=headers, json=task).status_code == 201

    filtered = client.get(
        "/api/v1/tasks?priority=alta&tag=TRABALHO&overdue=true&q=m%C3%A9tricas",
        headers=headers,
    )
    assert filtered.status_code == 200
    assert filtered.json()["total"] == 1
    assert filtered.json()["items"][0]["title"] == "Relatório trimestral"

    page = client.get("/api/v1/tasks?page=2&page_size=2", headers=headers).json()
    assert page["total"] == 3
    assert page["pages"] == 2
    assert len(page["items"]) == 1

    invalid_range = client.get(
        "/api/v1/tasks?due_after=2026-10-01&due_before=2026-09-01", headers=headers
    )
    assert invalid_range.status_code == 422


def test_task_rejects_foreign_tag_and_naive_deadline(client: TestClient, auth_headers) -> None:
    owner = auth_headers("owner")
    other = auth_headers("other")
    foreign_tag = client.post("/api/v1/tags", headers=other, json={"name": "Privada"}).json()

    foreign = client.post(
        "/api/v1/tasks",
        headers=owner,
        json={"title": "Tarefa", "tag_ids": [foreign_tag["id"]]},
    )
    naive = client.post(
        "/api/v1/tasks",
        headers=owner,
        json={"title": "Tarefa", "due_at": "2026-09-25T18:00:00"},
    )

    assert foreign.status_code == 422
    assert naive.status_code == 422
