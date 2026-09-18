from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.tag import TagSummary
from app.schemas.task import clean_required_text


class NoteCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1, max_length=20000)
    task_id: UUID | None = None
    tag_ids: list[UUID] = Field(default_factory=list, max_length=50)

    @field_validator("title")
    @classmethod
    def clean_title(cls, value: str) -> str:
        return clean_required_text(value, "O título")

    @field_validator("content")
    @classmethod
    def clean_content(cls, value: str) -> str:
        return clean_required_text(value, "O conteúdo")


class NoteUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    content: str | None = Field(default=None, min_length=1, max_length=20000)
    task_id: UUID | None = None
    tag_ids: list[UUID] | None = Field(default=None, max_length=50)

    @field_validator("title")
    @classmethod
    def clean_title(cls, value: str | None) -> str | None:
        return clean_required_text(value, "O título") if value is not None else None

    @field_validator("content")
    @classmethod
    def clean_content(cls, value: str | None) -> str | None:
        return clean_required_text(value, "O conteúdo") if value is not None else None


class NoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    task_id: UUID | None
    title: str
    content: str
    created_at: datetime
    updated_at: datetime
    tags: list[TagSummary]
