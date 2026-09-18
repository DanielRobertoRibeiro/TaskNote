from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Query, Response, status

from app.api.dependencies import CurrentUser, DbSession
from app.core.config import get_settings
from app.core.enums import TaskPriority, TaskStatus
from app.schemas.common import Page
from app.schemas.task import TaskCreate, TaskResponse, TaskStatusUpdate, TaskUpdate
from app.services.tasks import TaskService

router = APIRouter(prefix="/tasks", tags=["Tarefas"])
settings = get_settings()


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(data: TaskCreate, db: DbSession, current_user: CurrentUser) -> TaskResponse:
    return TaskResponse.model_validate(TaskService(db).create(data, current_user.id))


@router.get("", response_model=Page[TaskResponse])
def list_tasks(
    db: DbSession,
    current_user: CurrentUser,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[
        int, Query(ge=1, le=settings.pagination_max_size)
    ] = settings.pagination_default_size,
    status_filter: Annotated[TaskStatus | None, Query(alias="status")] = None,
    priority: TaskPriority | None = None,
    tag: Annotated[str | None, Query(min_length=1, max_length=50)] = None,
    overdue: bool | None = None,
    due_before: date | None = None,
    due_after: date | None = None,
    query: Annotated[str | None, Query(alias="q", min_length=1, max_length=200)] = None,
) -> Page[TaskResponse]:
    return TaskService(db).list(
        user_id=current_user.id,
        page=page,
        page_size=page_size,
        status=status_filter,
        priority=priority,
        tag=tag,
        overdue=overdue,
        due_before=due_before,
        due_after=due_after,
        query=query,
    )


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: UUID, db: DbSession, current_user: CurrentUser) -> TaskResponse:
    return TaskResponse.model_validate(TaskService(db).get(task_id, current_user.id))


@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: UUID, data: TaskUpdate, db: DbSession, current_user: CurrentUser
) -> TaskResponse:
    return TaskResponse.model_validate(TaskService(db).update(task_id, data, current_user.id))


@router.patch("/{task_id}/status", response_model=TaskResponse)
def update_task_status(
    task_id: UUID, data: TaskStatusUpdate, db: DbSession, current_user: CurrentUser
) -> TaskResponse:
    return TaskResponse.model_validate(
        TaskService(db).update_status(task_id, data, current_user.id)
    )


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: UUID, db: DbSession, current_user: CurrentUser) -> Response:
    TaskService(db).delete(task_id, current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
