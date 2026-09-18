from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Tag


class TagRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_owned(self, tag_id: UUID, user_id: UUID) -> Tag | None:
        return self.db.scalar(select(Tag).where(Tag.id == tag_id, Tag.user_id == user_id))

    def get_by_normalized_name(self, normalized_name: str, user_id: UUID) -> Tag | None:
        return self.db.scalar(
            select(Tag).where(
                Tag.user_id == user_id,
                Tag.normalized_name == normalized_name,
            )
        )

    def get_many_owned(self, tag_ids: set[UUID], user_id: UUID) -> Sequence[Tag]:
        if not tag_ids:
            return []
        return self.db.scalars(
            select(Tag).where(Tag.user_id == user_id, Tag.id.in_(tag_ids)).order_by(Tag.name)
        ).all()

    def list_owned(self, user_id: UUID) -> Sequence[Tag]:
        return self.db.scalars(
            select(Tag).where(Tag.user_id == user_id).order_by(Tag.normalized_name)
        ).all()

    def create(self, *, user_id: UUID, name: str, normalized_name: str) -> Tag:
        tag = Tag(user_id=user_id, name=name, normalized_name=normalized_name)
        self.db.add(tag)
        self.db.commit()
        self.db.refresh(tag)
        return tag

    def delete(self, tag: Tag) -> None:
        self.db.delete(tag)
        self.db.commit()
