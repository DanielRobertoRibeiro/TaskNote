from datetime import datetime
from uuid import UUID

from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.core.enums import TaskPriority, TaskStatus
from app.core.text import normalize_tag_name
from app.db.models import Tag, Task


class TaskRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_owned(self, task_id: UUID, user_id: UUID) -> Task | None:
        return self.db.scalar(
            select(Task)
            .options(selectinload(Task.tags))
            .where(Task.id == task_id, Task.user_id == user_id)
        )

    def list_owned(
        self,
        *,
        user_id: UUID,
        page: int,
        page_size: int,
        status: TaskStatus | None = None,
        priority: TaskPriority | None = None,
        tag: str | None = None,
        overdue: bool | None = None,
        due_before: datetime | None = None,
        due_after: datetime | None = None,
        query: str | None = None,
        now: datetime,
    ) -> tuple[list[Task], int]:
        filters = [Task.user_id == user_id]
        if status is not None:
            filters.append(Task.status == status)
        if priority is not None:
            filters.append(Task.priority == priority)
        if tag is not None:
            filters.append(
                Task.tags.any(
                    and_(Tag.user_id == user_id, Tag.normalized_name == normalize_tag_name(tag))
                )
            )
        if overdue is True:
            filters.extend(
                [Task.due_at.is_not(None), Task.due_at < now, Task.status != TaskStatus.COMPLETED]
            )
        elif overdue is False:
            filters.append(
                or_(
                    Task.due_at.is_(None),
                    Task.due_at >= now,
                    Task.status == TaskStatus.COMPLETED,
                )
            )
        if due_before is not None:
            filters.append(Task.due_at <= due_before)
        if due_after is not None:
            filters.append(Task.due_at >= due_after)
        if query:
            pattern = f"%{query.strip()}%"
            filters.append(or_(Task.title.ilike(pattern), Task.description.ilike(pattern)))

        total = self.db.scalar(select(func.count(Task.id)).where(*filters)) or 0
        statement = (
            select(Task)
            .options(selectinload(Task.tags))
            .where(*filters)
            .order_by(Task.created_at.desc(), Task.id)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list(self.db.scalars(statement).all()), total

    def create(self, task: Task) -> Task:
        self.db.add(task)
        self.db.commit()
        return self.get_owned(task.id, task.user_id) or task

    def save(self, task: Task) -> Task:
        self.db.add(task)
        self.db.commit()
        return self.get_owned(task.id, task.user_id) or task

    def delete(self, task: Task) -> None:
        self.db.delete(task)
        self.db.commit()
