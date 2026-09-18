from enum import StrEnum


class TaskStatus(StrEnum):
    PENDING = "pendente"
    IN_PROGRESS = "em_andamento"
    COMPLETED = "concluida"


class TaskPriority(StrEnum):
    LOW = "baixa"
    MEDIUM = "media"
    HIGH = "alta"
