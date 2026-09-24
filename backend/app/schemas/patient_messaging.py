from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class ConversationOpen(BaseModel):
    participant_id: str


class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=4000)

    @field_validator("content")
    @classmethod
    def non_whitespace(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Message cannot be empty")
        return value


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationSummary(BaseModel):
    conversation_id: str | None = None
    patient_id: str
    doctor_id: str
    participant_id: str
    participant_name: str
    grant_status: str
    can_send: bool
    unread_count: int
    last_message: str | None = None
    last_message_at: datetime | None = None


class ConversationThread(BaseModel):
    conversation_id: str
    patient_id: str
    doctor_id: str
    participant_id: str
    participant_name: str
    grant_status: str
    can_send: bool
    unread_count: int
    messages: list[MessageResponse]


class ConversationReadResponse(BaseModel):
    unread_count: int
