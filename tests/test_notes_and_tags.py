from fastapi.testclient import TestClient


def test_note_can_be_linked_unlinked_and_searched(client: TestClient, auth_headers) -> None:
    headers = auth_headers()
    task = client.post("/api/v1/tasks", headers=headers, json={"title": "Projeto"}).json()
    tag = client.post("/api/v1/tags", headers=headers, json={"name": "Referência"}).json()

    note = client.post(
        "/api/v1/notes",
        headers=headers,
        json={
            "title": " Decisões ",
            "content": "Usar arquitetura em camadas",
            "task_id": task["id"],
            "tag_ids": [tag["id"]],
        },
    )
    assert note.status_code == 201
    note_id = note.json()["id"]

    search = client.get("/api/v1/notes?q=camadas&tag=refer%C3%AAncia", headers=headers)
    assert search.status_code == 200
    assert search.json()["total"] == 1

    linked = client.get("/api/v1/notes?unlinked=false", headers=headers)
    assert linked.json()["total"] == 1

    unlinked = client.patch(f"/api/v1/notes/{note_id}", headers=headers, json={"task_id": None})
    assert unlinked.status_code == 200
    assert unlinked.json()["task_id"] is None


def test_note_update_and_delete(client: TestClient, auth_headers) -> None:
    headers = auth_headers()
    note = client.post(
        "/api/v1/notes",
        headers=headers,
        json={"title": "Rascunho", "content": "Conteúdo inicial"},
    ).json()

    updated = client.patch(
        f"/api/v1/notes/{note['id']}",
        headers=headers,
        json={"title": "Versão final", "content": "Conteúdo revisado"},
    )
    assert updated.status_code == 200
    assert updated.json()["title"] == "Versão final"

    assert client.delete(f"/api/v1/notes/{note['id']}", headers=headers).status_code == 204
    assert client.get(f"/api/v1/notes/{note['id']}", headers=headers).status_code == 404


def test_deleting_task_preserves_note_and_removes_link(client: TestClient, auth_headers) -> None:
    headers = auth_headers()
    task = client.post("/api/v1/tasks", headers=headers, json={"title": "Temporária"}).json()
    note = client.post(
        "/api/v1/notes",
        headers=headers,
        json={
            "title": "Permanente",
            "content": "Esta nota deve permanecer",
            "task_id": task["id"],
        },
    ).json()

    assert client.delete(f"/api/v1/tasks/{task['id']}", headers=headers).status_code == 204
    preserved = client.get(f"/api/v1/notes/{note['id']}", headers=headers)
    assert preserved.status_code == 200
    assert preserved.json()["task_id"] is None


def test_tag_is_unique_case_insensitively_per_user(client: TestClient, auth_headers) -> None:
    first_user = auth_headers("first")
    second_user = auth_headers("second")

    assert (
        client.post("/api/v1/tags", headers=first_user, json={"name": "Urgente"}).status_code == 201
    )
    duplicate = client.post("/api/v1/tags", headers=first_user, json={"name": "  urgente  "})
    same_name_other_user = client.post(
        "/api/v1/tags", headers=second_user, json={"name": "URGENTE"}
    )

    assert duplicate.status_code == 409
    assert same_name_other_user.status_code == 201
    assert len(client.get("/api/v1/tags", headers=first_user).json()) == 1


def test_deleting_tag_only_removes_association(client: TestClient, auth_headers) -> None:
    headers = auth_headers()
    tag = client.post("/api/v1/tags", headers=headers, json={"name": "Remover"}).json()
    task = client.post(
        "/api/v1/tasks",
        headers=headers,
        json={"title": "Continua", "tag_ids": [tag["id"]]},
    ).json()

    assert client.delete(f"/api/v1/tags/{tag['id']}", headers=headers).status_code == 204
    kept_task = client.get(f"/api/v1/tasks/{task['id']}", headers=headers)
    assert kept_task.status_code == 200
    assert kept_task.json()["tags"] == []


def test_user_cannot_link_note_to_foreign_task(client: TestClient, auth_headers) -> None:
    owner = auth_headers("owner")
    other = auth_headers("other")
    task = client.post("/api/v1/tasks", headers=owner, json={"title": "Privada"}).json()

    response = client.post(
        "/api/v1/notes",
        headers=other,
        json={"title": "Nota", "content": "Conteúdo", "task_id": task["id"]},
    )

    assert response.status_code == 422
