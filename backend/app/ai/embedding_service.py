import logging

from langchain_openai import OpenAIEmbeddings
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.embedding import RecordEmbedding
from app.models.record import PatientRecord

logger = logging.getLogger(__name__)

VALID_CHUNK_TYPES = frozenset({"vitals", "risk_explanation", "recommendations", "ehr_summary"})


def _embeddings_client() -> OpenAIEmbeddings:
    if not settings.OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is required for RAG embeddings")
    return OpenAIEmbeddings(model=settings.EMBEDDING_MODEL, api_key=settings.OPENAI_API_KEY)


def _format_recommendations(recs: dict | list | None) -> str | None:
    if not recs:
        return None
    if isinstance(recs, dict):
        lines: list[str] = []
        if summary := recs.get("summary"):
            lines.append(f"Summary: {summary}")
        categories = recs.get("categories") or {}
        for category in ("diet", "exercise", "lifestyle", "monitoring"):
            items = categories.get(category) or []
            if items:
                lines.append(f"{category.title()}: " + "; ".join(items))
        return "\n".join(lines) if lines else None
    return str(recs)


def build_chunks(record: PatientRecord) -> list[tuple[str, str]]:
    """Return (chunk_type, text) pairs for non-empty record fields."""
    chunks: list[tuple[str, str]] = []

    vitals = (
        f"Demographics: age {record.age}, gender {record.gender}, district {record.district}\n"
        f"Vital signs: BP {record.bp_systolic}/{record.bp_diastolic} mmHg, "
        f"BMI {record.bmi:.1f}, pulse {record.pulse_rate} bpm, "
        f"height {record.height} cm, weight {record.weight} kg\n"
        f"Lab results: blood glucose {record.blood_glucose or 'not recorded'} mg/dL, "
        f"cholesterol {record.cholesterol or 'not recorded'} mg/dL, "
        f"hemoglobin {record.hemoglobin or 'not recorded'} g/dL, "
        f"creatinine {record.creatinine or 'not recorded'} mg/dL, "
        f"ECG {record.ecg_result or 'not recorded'}\n"
        f"Medical history: diabetes {record.diabetes_history}, hypertension {record.hypertension}, "
        f"CVD {record.cvd}, stroke {record.stroke}\n"
        f"Family history: diabetes {record.family_diabetes}, hypertension {record.family_hypertension}, "
        f"CVD {record.family_cvd}, stroke {record.family_stroke}\n"
        f"Lifestyle: smoking {record.smoking}, alcohol {record.alcohol}, "
        f"activity {record.physical_activity}, sleep {record.sleep_hours}h/night\n"
        f"Risk level: {record.risk_level or 'not yet assessed'}"
    )
    chunks.append(("vitals", vitals))

    if record.risk_explanation:
        chunks.append(("risk_explanation", record.risk_explanation))

    recs_text = _format_recommendations(record.recommendations)
    if recs_text:
        chunks.append(("recommendations", recs_text))

    if record.ehr_summary:
        chunks.append(("ehr_summary", record.ehr_summary))

    return [(t, c) for t, c in chunks if t in VALID_CHUNK_TYPES and c.strip()]


def build_record_text_context(record: PatientRecord) -> str:
    """Plain-text context from record fields (no vector search)."""
    chunks = build_chunks(record)
    if not chunks:
        return "No patient record data available yet."
    return "\n\n---\n\n".join(content for _, content in chunks)


def get_latest_record(db: Session, user_id: str) -> PatientRecord | None:
    return (
        db.query(PatientRecord)
        .filter(PatientRecord.user_id == user_id)
        .order_by(PatientRecord.created_at.desc())
        .first()
    )


def ensure_embeddings_for_user(user_id: str, db: Session) -> None:
    """Backfill embeddings for records that were scored before RAG or when embed failed."""
    # Chat can use the latest record as plain-text context without vector search.
    # Do not retry OpenAI-only embeddings when the app is configured with another LLM provider.
    if not settings.ENABLE_RAG or not settings.OPENAI_API_KEY:
        return
    records = db.query(PatientRecord).filter(PatientRecord.user_id == user_id).all()
    for record in records:
        exists = (
            db.query(RecordEmbedding)
            .filter(RecordEmbedding.record_id == record.id)
            .first()
        )
        if not exists:
            embed_record(record, db)


def embed_record(record: PatientRecord, db: Session) -> None:
    """Embed record chunks into pgvector. Replaces prior embeddings for this record."""
    # Embeddings are an optional RAG enhancement and currently require OpenAI credentials.
    if not settings.ENABLE_RAG or not settings.OPENAI_API_KEY:
        return

    chunks = build_chunks(record)
    if not chunks:
        return

    try:
        vectors = _embeddings_client().embed_documents([content for _, content in chunks])
    except Exception:
        logger.exception("Embedding API failed for record %s", record.id)
        return

    db.query(RecordEmbedding).filter(RecordEmbedding.record_id == record.id).delete()
    for (chunk_type, content), embedding in zip(chunks, vectors):
        db.add(
            RecordEmbedding(
                record_id=record.id,
                chunk_type=chunk_type,
                content=content,
                embedding=embedding,
            )
        )
    db.commit()
