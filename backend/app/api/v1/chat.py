import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.api.deps import CurrentUser, DB
from app.core.config import settings
from app.models.conversation import ConversationMessage

logger = logging.getLogger(__name__)
router = APIRouter()


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=500)


class ChatResponse(BaseModel):
    reply: str


class ChatMessageSchema(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatHistoryResponse(BaseModel):
    messages: list[ChatMessageSchema]


class ChatDeleteResponse(BaseModel):
    deleted: int


@router.get("/history", response_model=ChatHistoryResponse)
def get_chat_history(current_user: CurrentUser, db: DB):
    messages = (
        db.query(ConversationMessage)
        .filter(ConversationMessage.user_id == current_user.id)
        .order_by(ConversationMessage.created_at.asc())
        .all()
    )
    return ChatHistoryResponse(messages=messages)


@router.delete("/history", response_model=ChatDeleteResponse)
def delete_chat_history(current_user: CurrentUser, db: DB):
    deleted = (
        db.query(ConversationMessage)
        .filter(ConversationMessage.user_id == current_user.id)
        .delete()
    )
    db.commit()
    return ChatDeleteResponse(deleted=deleted)


@router.post("", response_model=ChatResponse)
def chat(body: ChatRequest, current_user: CurrentUser, db: DB):
    if not settings.ENABLE_RAG:
        raise HTTPException(status_code=503, detail="Chatbot is currently disabled")

    user_msg = ConversationMessage(
        user_id=current_user.id,
        role="user",
        content=body.message,
    )
    db.add(user_msg)
    db.commit()

    from app.ai.embedding_service import ensure_embeddings_for_user
    from app.ai.rag_chain import run_rag_chat_chain

    ensure_embeddings_for_user(current_user.id, db)

    try:
        reply = run_rag_chat_chain(body.message, current_user.id, db)
    except Exception:
        logger.exception("RAG chat chain failed for user %s", current_user.id)
        raise HTTPException(status_code=502, detail="Chatbot unavailable. Please try again.")

    assistant_msg = ConversationMessage(
        user_id=current_user.id,
        role="assistant",
        content=reply,
    )
    db.add(assistant_msg)
    db.commit()

    return ChatResponse(reply=reply)
