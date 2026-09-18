from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


def clean_tag_name(value: str) -> str:
    value = " ".join(value.split())
    if not value:
        raise ValueError("O nome da tag não pode ser vazio.")
    return value


class TagCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)

    @field_validator("name")
    @classmethod
    def normalize_spaces(cls, value: str) -> str:
        return clean_tag_name(value)


class TagResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    created_at: datetime


class TagSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
