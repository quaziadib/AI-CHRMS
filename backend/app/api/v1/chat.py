import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.ai.chat_chain import run_chat_chain
from app.api.deps import CurrentUser, DB
from app.core.config import settings
from app.models.record import PatientRecord

logger = logging.getLogger(__name__)
router = APIRouter()


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=500)


class ChatResponse(BaseModel):
    reply: str


@router.post("", response_model=ChatResponse)
def chat(body: ChatRequest, current_user: CurrentUser, db: DB):
    if not settings.ENABLE_CHATBOT:
        raise HTTPException(status_code=503, detail="Chatbot is currently disabled")

    latest = (
        db.query(PatientRecord)
        .filter(PatientRecord.user_id == current_user.id)
        .order_by(PatientRecord.created_at.desc())
        .first()
    )

    patient_context = ""
    if latest:
        patient_context = (
            f"Risk level: {latest.risk_level or 'not yet assessed'}, "
            f"Age: {latest.age}, BMI: {latest.bmi:.1f}, "
            f"BP: {latest.bp_systolic}/{latest.bp_diastolic} mmHg, "
            f"Blood glucose: {f'{latest.blood_glucose} mg/dL' if latest.blood_glucose else 'not recorded'}"
        )

    try:
        reply = run_chat_chain(body.message, patient_context)
    except Exception:
        logger.exception("Chat chain failed for user %s", current_user.id)
        raise HTTPException(status_code=502, detail="Chatbot unavailable. Please try again.")

    return ChatResponse(reply=reply)
