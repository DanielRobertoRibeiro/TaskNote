from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Query, Response, status

from app.api.dependencies import CurrentUser, DbSession
from app.core.config import get_settings
from app.schemas.common import Page
from app.schemas.note import NoteCreate, NoteResponse, NoteUpdate
from app.services.notes import NoteService

router = APIRouter(prefix="/notes", tags=["Anotações"])
settings = get_settings()


@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def create_note(data: NoteCreate, db: DbSession, current_user: CurrentUser) -> NoteResponse:
    return NoteResponse.model_validate(NoteService(db).create(data, current_user.id))


@router.get("", response_model=Page[NoteResponse])
def list_notes(
    db: DbSession,
    current_user: CurrentUser,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[
        int, Query(ge=1, le=settings.pagination_max_size)
    ] = settings.pagination_default_size,
    task_id: UUID | None = None,
    unlinked: bool | None = None,
    tag: Annotated[str | None, Query(min_length=1, max_length=50)] = None,
    query: Annotated[str | None, Query(alias="q", min_length=1, max_length=200)] = None,
) -> Page[NoteResponse]:
    return NoteService(db).list(
        user_id=current_user.id,
        page=page,
        page_size=page_size,
        task_id=task_id,
        unlinked=unlinked,
        tag=tag,
        query=query,
    )


@router.get("/{note_id}", response_model=NoteResponse)
def get_note(note_id: UUID, db: DbSession, current_user: CurrentUser) -> NoteResponse:
    return NoteResponse.model_validate(NoteService(db).get(note_id, current_user.id))


@router.patch("/{note_id}", response_model=NoteResponse)
def update_note(
    note_id: UUID, data: NoteUpdate, db: DbSession, current_user: CurrentUser
) -> NoteResponse:
    return NoteResponse.model_validate(NoteService(db).update(note_id, data, current_user.id))


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(note_id: UUID, db: DbSession, current_user: CurrentUser) -> Response:
    NoteService(db).delete(note_id, current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
