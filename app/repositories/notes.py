from uuid import UUID

from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.core.text import normalize_tag_name
from app.db.models import Note, Tag


class NoteRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_owned(self, note_id: UUID, user_id: UUID) -> Note | None:
        return self.db.scalar(
            select(Note)
            .options(selectinload(Note.tags))
            .where(Note.id == note_id, Note.user_id == user_id)
        )

    def list_owned(
        self,
        *,
        user_id: UUID,
        page: int,
        page_size: int,
        task_id: UUID | None = None,
        unlinked: bool | None = None,
        tag: str | None = None,
        query: str | None = None,
    ) -> tuple[list[Note], int]:
        filters = [Note.user_id == user_id]
        if task_id is not None:
            filters.append(Note.task_id == task_id)
        if unlinked is True:
            filters.append(Note.task_id.is_(None))
        elif unlinked is False:
            filters.append(Note.task_id.is_not(None))
        if tag is not None:
            filters.append(
                Note.tags.any(
                    and_(Tag.user_id == user_id, Tag.normalized_name == normalize_tag_name(tag))
                )
            )
        if query:
            pattern = f"%{query.strip()}%"
            filters.append(or_(Note.title.ilike(pattern), Note.content.ilike(pattern)))

        total = self.db.scalar(select(func.count(Note.id)).where(*filters)) or 0
        statement = (
            select(Note)
            .options(selectinload(Note.tags))
            .where(*filters)
            .order_by(Note.updated_at.desc(), Note.id)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list(self.db.scalars(statement).all()), total

    def create(self, note: Note) -> Note:
        self.db.add(note)
        self.db.commit()
        return self.get_owned(note.id, note.user_id) or note

    def save(self, note: Note) -> Note:
        self.db.add(note)
        self.db.commit()
        return self.get_owned(note.id, note.user_id) or note

    def delete(self, note: Note) -> None:
        self.db.delete(note)
        self.db.commit()
