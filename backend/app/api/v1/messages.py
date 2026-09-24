from fastapi import APIRouter, status

from app.api.deps import CurrentUser, DB
from app.schemas.patient_messaging import (
    ConversationOpen,
    ConversationReadResponse,
    ConversationSummary,
    ConversationThread,
    MessageCreate,
    MessageResponse,
)
from app.services import patient_messaging as messaging_service

router = APIRouter()


@router.get("", response_model=list[ConversationSummary])
def get_inbox(user: CurrentUser, db: DB):
    return messaging_service.list_inbox(db, user)


@router.post("/conversations", response_model=ConversationSummary)
def open_conversation(body: ConversationOpen, user: CurrentUser, db: DB):
    return messaging_service.open_conversation(db, user, body.participant_id)


@router.get("/conversations/{conversation_id}", response_model=ConversationThread)
def get_conversation(conversation_id: str, user: CurrentUser, db: DB):
    return messaging_service.get_conversation(db, user, conversation_id)


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
)
def send_message(conversation_id: str, body: MessageCreate, user: CurrentUser, db: DB):
    return messaging_service.send_message(db, user, conversation_id, body)


@router.post("/conversations/{conversation_id}/read", response_model=ConversationReadResponse)
def mark_read(conversation_id: str, user: CurrentUser, db: DB):
    return ConversationReadResponse(
        unread_count=messaging_service.mark_conversation_read(db, user, conversation_id)
    )
