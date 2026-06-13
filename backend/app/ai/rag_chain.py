import logging

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.embedding_service import (
    _embeddings_client,
    build_record_text_context,
    get_latest_record,
)
from app.ai.llm_factory import get_llm
from app.core.config import settings
from app.models.conversation import ConversationMessage
from app.models.embedding import RecordEmbedding
from app.models.record import PatientRecord

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """\
You are a friendly diabetes health assistant for AI-CHRMS, serving patients in Bangladesh. \
Help patients understand diabetes, their health metrics, risk factors, and lifestyle changes.

Guidelines:
- Write in plain conversational prose — no markdown, no headers, no bullet symbols, no asterisks, no dashes, no emojis
- If listing items, write them as a numbered list on separate lines (1. ... 2. ... etc.)
- Answer in 2-4 sentences for simple questions; use short numbered lists when genuinely needed
- Be warm, clear, and non-technical
- The patient record context below is their submitted health form data — always reference it when answering health questions
- If patient record context is provided (not "No patient record data available yet."), never say you cannot see their record
- Do NOT diagnose conditions, prescribe medications, or recommend specific dosages
- Always recommend consulting their doctor for any medical decision
- If asked about unrelated topics, politely redirect to health questions

Patient record context (from their health history):
{patient_context}

Prior conversation:
{conversation_history}"""


def _record_text_fallback(user_id: str, db: Session) -> str:
    record = get_latest_record(db, user_id)
    if not record:
        return "No patient record data available yet."
    return build_record_text_context(record)


def retrieve_patient_context(user_id: str, query: str, db: Session, k: int = 4) -> str:
    fallback = _record_text_fallback(user_id, db)
    if fallback == "No patient record data available yet.":
        return fallback

    if not settings.ENABLE_RAG or not settings.OPENAI_API_KEY:
        return fallback

    has_embeddings = (
        db.query(RecordEmbedding)
        .join(PatientRecord, PatientRecord.id == RecordEmbedding.record_id)
        .filter(PatientRecord.user_id == user_id)
        .first()
    )
    if not has_embeddings:
        return fallback

    try:
        query_vector = _embeddings_client().embed_query(query)
    except Exception:
        logger.exception("Query embedding failed for user %s", user_id)
        return fallback

    distance = RecordEmbedding.embedding.cosine_distance(query_vector)
    stmt = (
        select(RecordEmbedding.content)
        .join(PatientRecord, PatientRecord.id == RecordEmbedding.record_id)
        .where(PatientRecord.user_id == user_id)
        .order_by(distance)
        .limit(k)
    )
    chunks = db.execute(stmt).scalars().all()
    if not chunks:
        return fallback
    return "\n\n---\n\n".join(chunks)


def _format_history(messages: list[ConversationMessage]) -> str:
    if not messages:
        return "(No prior messages)"
    lines = []
    for msg in messages:
        label = "Patient" if msg.role == "user" else "Assistant"
        lines.append(f"{label}: {msg.content}")
    return "\n".join(lines)


def run_rag_chat_chain(message: str, user_id: str, db: Session) -> str:
    recent = (
        db.query(ConversationMessage)
        .filter(ConversationMessage.user_id == user_id)
        .order_by(ConversationMessage.created_at.desc())
        .limit(21)
        .all()
    )
    recent.reverse()

    if recent and recent[-1].role == "user" and recent[-1].content == message:
        recent = recent[:-1]
    history = recent[-20:]

    patient_context = retrieve_patient_context(user_id, message, db)
    conversation_history = _format_history(history)

    prompt = ChatPromptTemplate.from_messages([
        ("system", _SYSTEM_PROMPT),
        ("human", "{message}"),
    ])
    chain = prompt | get_llm() | StrOutputParser()
    return chain.invoke({
        "message": message,
        "patient_context": patient_context,
        "conversation_history": conversation_history,
    })
