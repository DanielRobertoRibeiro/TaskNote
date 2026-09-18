from uuid import UUID

from fastapi import APIRouter, Response, status

from app.api.dependencies import CurrentUser, DbSession
from app.schemas.tag import TagCreate, TagResponse
from app.services.tags import TagService

router = APIRouter(prefix="/tags", tags=["Tags"])


@router.post("", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
def create_tag(data: TagCreate, db: DbSession, current_user: CurrentUser) -> TagResponse:
    return TagResponse.model_validate(TagService(db).create(data, current_user.id))


@router.get("", response_model=list[TagResponse])
def list_tags(db: DbSession, current_user: CurrentUser) -> list[TagResponse]:
    return [TagResponse.model_validate(tag) for tag in TagService(db).list(current_user.id)]


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tag(tag_id: UUID, db: DbSession, current_user: CurrentUser) -> Response:
    TagService(db).delete(tag_id, current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
