from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.core.text import normalize_tag_name
from app.db.models import Tag
from app.repositories.tags import TagRepository
from app.schemas.tag import TagCreate


class TagService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.tags = TagRepository(db)

    def resolve_owned(self, tag_ids: list[UUID] | None, user_id: UUID) -> list[Tag]:
        unique_ids = set(tag_ids or [])
        tags = list(self.tags.get_many_owned(unique_ids, user_id))
        if len(tags) != len(unique_ids):
            raise ValidationError("Uma ou mais tags não existem ou não pertencem ao usuário.")
        return tags

    def create(self, data: TagCreate, user_id: UUID) -> Tag:
        normalized_name = normalize_tag_name(data.name)
        if self.tags.get_by_normalized_name(normalized_name, user_id):
            raise ConflictError("Já existe uma tag com este nome.")
        try:
            return self.tags.create(
                user_id=user_id,
                name=data.name,
                normalized_name=normalized_name,
            )
        except IntegrityError as exc:
            self.db.rollback()
            raise ConflictError("Já existe uma tag com este nome.") from exc

    def list(self, user_id: UUID) -> list[Tag]:
        return list(self.tags.list_owned(user_id))

    def delete(self, tag_id: UUID, user_id: UUID) -> None:
        tag = self.tags.get_owned(tag_id, user_id)
        if tag is None:
            raise NotFoundError("Tag")
        self.tags.delete(tag)
