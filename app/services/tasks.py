from datetime import UTC, date, datetime, time
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.enums import TaskPriority, TaskStatus
from app.core.exceptions import NotFoundError, ValidationError
from app.db.models import Task
from app.repositories.tasks import TaskRepository
from app.schemas.common import Page
from app.schemas.task import TaskCreate, TaskResponse, TaskStatusUpdate, TaskUpdate
from app.services.tags import TagService


class TaskService:
    def __init__(self, db: Session) -> None:
        self.tasks = TaskRepository(db)
        self.tag_service = TagService(db)

    def create(self, data: TaskCreate, user_id: UUID) -> Task:
        tags = self.tag_service.resolve_owned(data.tag_ids, user_id)
        task = Task(
            user_id=user_id,
            title=data.title,
            description=data.description,
            priority=data.priority,
            due_at=data.due_at,
            tags=tags,
        )
        return self.tasks.create(task)

    def get(self, task_id: UUID, user_id: UUID) -> Task:
        task = self.tasks.get_owned(task_id, user_id)
        if task is None:
            raise NotFoundError("Tarefa")
        return task

    def list(
        self,
        *,
        user_id: UUID,
        page: int,
        page_size: int,
        status: TaskStatus | None,
        priority: TaskPriority | None,
        tag: str | None,
        overdue: bool | None,
        due_before: date | None,
        due_after: date | None,
        query: str | None,
    ) -> Page[TaskResponse]:
        if due_before and due_after and due_after > due_before:
            raise ValidationError("due_after não pode ser posterior a due_before.")
        start = datetime.combine(due_after, time.min, tzinfo=UTC) if due_after else None
        end = datetime.combine(due_before, time.max, tzinfo=UTC) if due_before else None
        items, total = self.tasks.list_owned(
            user_id=user_id,
            page=page,
            page_size=page_size,
            status=status,
            priority=priority,
            tag=tag,
            overdue=overdue,
            due_before=end,
            due_after=start,
            query=query,
            now=datetime.now(UTC),
        )
        return Page[TaskResponse].create(
            [TaskResponse.model_validate(item) for item in items], total, page, page_size
        )

    def update(self, task_id: UUID, data: TaskUpdate, user_id: UUID) -> Task:
        task = self.get(task_id, user_id)
        changes = data.model_dump(exclude_unset=True, exclude={"tag_ids"})
        for field, value in changes.items():
            if field in {"title", "priority"} and value is None:
                raise ValidationError(f"{field} não pode ser nulo.")
            setattr(task, field, value)
        if "tag_ids" in data.model_fields_set:
            task.tags = self.tag_service.resolve_owned(data.tag_ids, user_id)
        return self.tasks.save(task)

    def update_status(self, task_id: UUID, data: TaskStatusUpdate, user_id: UUID) -> Task:
        task = self.get(task_id, user_id)
        task.status = data.status
        task.completed_at = datetime.now(UTC) if data.status == TaskStatus.COMPLETED else None
        return self.tasks.save(task)

    def delete(self, task_id: UUID, user_id: UUID) -> None:
        self.tasks.delete(self.get(task_id, user_id))
