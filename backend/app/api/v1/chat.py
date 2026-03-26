"""AI Chatbot endpoints (OpenAI-backed)."""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.api.deps import CurrentUser, DB
from app.models.audit import AuditLog
from app.services import chatbot as chatbot_svc

router = APIRouter()


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str
    disclaimer: str
    model: str


@router.post("", response_model=ChatResponse)
def chat(
    body: ChatRequest,
    current_user: CurrentUser,
    db: DB,
):
    """Send a health question to the AI assistant.

    - Non-diagnostic: will not prescribe or interpret personal results.
    - Every response includes a medical disclaimer.
    - All conversations are audit-logged.
    """
    if not body.message.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="message must not be blank",
        )

    try:
        result = chatbot_svc.chat(body.message.strip())
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI chatbot is not configured on this server",
        ) from exc

    # Audit log every conversation
    log = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="chatbot_query",
        entity_type="chatbot",
        status="success",
    )
    db.add(log)
    db.commit()

    return ChatResponse(**result)
