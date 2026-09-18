from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError, ValidationError
from app.db.models import Note
from app.repositories.notes import NoteRepository
from app.repositories.tasks import TaskRepository
from app.schemas.common import Page
from app.schemas.note import NoteCreate, NoteResponse, NoteUpdate
from app.services.tags import TagService


class NoteService:
    def __init__(self, db: Session) -> None:
        self.notes = NoteRepository(db)
        self.tasks = TaskRepository(db)
        self.tag_service = TagService(db)

    def _validate_task(self, task_id: UUID | None, user_id: UUID) -> None:
        if task_id is not None and self.tasks.get_owned(task_id, user_id) is None:
            raise ValidationError("A tarefa informada não existe ou não pertence ao usuário.")

    def create(self, data: NoteCreate, user_id: UUID) -> Note:
        self._validate_task(data.task_id, user_id)
        tags = self.tag_service.resolve_owned(data.tag_ids, user_id)
        note = Note(
            user_id=user_id,
            task_id=data.task_id,
            title=data.title,
            content=data.content,
            tags=tags,
        )
        return self.notes.create(note)

    def get(self, note_id: UUID, user_id: UUID) -> Note:
        note = self.notes.get_owned(note_id, user_id)
        if note is None:
            raise NotFoundError("Anotação")
        return note

    def list(
        self,
        *,
        user_id: UUID,
        page: int,
        page_size: int,
        task_id: UUID | None,
        unlinked: bool | None,
        tag: str | None,
        query: str | None,
    ) -> Page[NoteResponse]:
        items, total = self.notes.list_owned(
            user_id=user_id,
            page=page,
            page_size=page_size,
            task_id=task_id,
            unlinked=unlinked,
            tag=tag,
            query=query,
        )
        return Page[NoteResponse].create(
            [NoteResponse.model_validate(item) for item in items], total, page, page_size
        )

    def update(self, note_id: UUID, data: NoteUpdate, user_id: UUID) -> Note:
        note = self.get(note_id, user_id)
        changes = data.model_dump(exclude_unset=True, exclude={"tag_ids", "task_id"})
        for field, value in changes.items():
            if field in {"title", "content"} and value is None:
                raise ValidationError(f"{field} não pode ser nulo.")
            setattr(note, field, value)
        if "task_id" in data.model_fields_set:
            self._validate_task(data.task_id, user_id)
            note.task_id = data.task_id
        if "tag_ids" in data.model_fields_set:
            note.tags = self.tag_service.resolve_owned(data.tag_ids, user_id)
        return self.notes.save(note)

    def delete(self, note_id: UUID, user_id: UUID) -> None:
        self.notes.delete(self.get(note_id, user_id))
