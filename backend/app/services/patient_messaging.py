from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.patient_messaging import PatientDoctorConversation, PatientDoctorMessage
from app.models.patient_sharing import PatientAccessEvent, PatientDoctorGrant
from app.models.user import User
from app.schemas.patient_messaging import (
    ConversationSummary,
    ConversationThread,
    MessageCreate,
    MessageResponse,
)


def _role(user: User) -> str:
    roles = set(user.roles or [])
    if "doctor" in roles and not roles.intersection({"admin", "national_admin"}):
        return "doctor"
    if roles.intersection({"user", "patient"}) and not roles.intersection(
        {"doctor", "admin", "national_admin"}
    ):
        return "patient"
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Messaging access required")


def _active_grant(
    db: Session, patient_id: str, doctor_id: str, *, lock: bool = False
) -> PatientDoctorGrant:
    query = db.query(PatientDoctorGrant).filter(
        PatientDoctorGrant.patient_id == patient_id,
        PatientDoctorGrant.doctor_id == doctor_id,
        PatientDoctorGrant.status == "active",
    )
    if lock:
        query = query.with_for_update()
    grant = query.first()
    if not grant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return grant


def _conversation_for_pair(
    db: Session, patient_id: str, doctor_id: str, *, lock: bool = False
) -> PatientDoctorConversation | None:
    query = db.query(PatientDoctorConversation).filter(
        PatientDoctorConversation.patient_id == patient_id,
        PatientDoctorConversation.doctor_id == doctor_id,
    )
    if lock:
        query = query.with_for_update()
    return query.first()


def _unread_count(db: Session, conversation: PatientDoctorConversation, user_id: str, role: str) -> int:
    read_at = conversation.patient_last_read_at if role == "patient" else conversation.doctor_last_read_at
    query = db.query(PatientDoctorMessage).filter(
        PatientDoctorMessage.conversation_id == conversation.id,
        PatientDoctorMessage.sender_id != user_id,
    )
    if read_at:
        query = query.filter(PatientDoctorMessage.created_at > read_at)
    return query.count()


def _summary(
    db: Session,
    user: User,
    role: str,
    patient_id: str,
    doctor_id: str,
    grant_status: str,
    conversation: PatientDoctorConversation | None,
) -> ConversationSummary:
    participant_id = doctor_id if role == "patient" else patient_id
    participant = db.query(User).filter(User.id == participant_id).first()
    last_message = None
    last_message_at = None
    unread_count = 0
    if conversation:
        latest = db.query(PatientDoctorMessage).filter(
            PatientDoctorMessage.conversation_id == conversation.id
        ).order_by(PatientDoctorMessage.created_at.desc(), PatientDoctorMessage.id.desc()).first()
        if latest:
            last_message = latest.content
            last_message_at = latest.created_at
        unread_count = _unread_count(db, conversation, user.id, role)
    return ConversationSummary(
        conversation_id=conversation.id if conversation else None,
        patient_id=patient_id,
        doctor_id=doctor_id,
        participant_id=participant_id,
        participant_name=participant.full_name if participant else "Participant",
        grant_status=grant_status,
        can_send=grant_status == "active",
        unread_count=unread_count,
        last_message=last_message,
        last_message_at=last_message_at,
    )


def list_inbox(db: Session, user: User) -> list[ConversationSummary]:
    role = _role(user)
    if role == "doctor":
        grants = db.query(PatientDoctorGrant).filter(
            PatientDoctorGrant.doctor_id == user.id,
            PatientDoctorGrant.status == "active",
        ).order_by(PatientDoctorGrant.created_at.desc()).all()
    else:
        grants = db.query(PatientDoctorGrant).filter(
            PatientDoctorGrant.patient_id == user.id,
        ).order_by(PatientDoctorGrant.created_at.desc()).all()

    seen: set[tuple[str, str]] = set()
    rows: list[ConversationSummary] = []
    for grant in grants:
        pair = (grant.patient_id, grant.doctor_id)
        if pair in seen:
            continue
        seen.add(pair)
        conversation = _conversation_for_pair(db, *pair)
        if role == "patient" and grant.status != "active" and not conversation:
            continue
        rows.append(_summary(db, user, role, *pair, grant.status, conversation))
    rows.sort(key=lambda row: row.last_message_at or datetime.min.replace(tzinfo=timezone.utc), reverse=True)
    return rows


def open_conversation(db: Session, user: User, participant_id: str) -> ConversationSummary:
    role = _role(user)
    patient_id, doctor_id = (user.id, participant_id) if role == "patient" else (participant_id, user.id)
    grant = _active_grant(db, patient_id, doctor_id, lock=True)
    conversation = _conversation_for_pair(db, patient_id, doctor_id, lock=True)
    if not conversation:
        conversation = PatientDoctorConversation(patient_id=patient_id, doctor_id=doctor_id)
        db.add(conversation)
        try:
            db.flush()
        except IntegrityError:
            db.rollback()
            grant = _active_grant(db, patient_id, doctor_id, lock=True)
            conversation = _conversation_for_pair(db, patient_id, doctor_id, lock=True)
            if not conversation:
                raise HTTPException(status_code=409, detail="Could not open conversation")
    db.commit()
    db.refresh(conversation)
    return _summary(db, user, role, patient_id, doctor_id, grant.status, conversation)


def _authorized_conversation(db: Session, user: User, conversation_id: str):
    role = _role(user)
    conversation = db.query(PatientDoctorConversation).filter(
        PatientDoctorConversation.id == conversation_id
    ).first()
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    if role == "patient":
        if conversation.patient_id != user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
        grant = db.query(PatientDoctorGrant).filter(
            PatientDoctorGrant.patient_id == user.id,
            PatientDoctorGrant.doctor_id == conversation.doctor_id,
        ).order_by(PatientDoctorGrant.created_at.desc(), PatientDoctorGrant.id.desc()).first()
        grant_status = grant.status if grant else "revoked"
        return role, conversation, grant, grant_status
    if conversation.doctor_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    grant = _active_grant(db, conversation.patient_id, user.id)
    return role, conversation, grant, grant.status


def get_conversation(db: Session, user: User, conversation_id: str) -> ConversationThread:
    role, conversation, _grant, grant_status = _authorized_conversation(db, user, conversation_id)
    participant_id = conversation.doctor_id if role == "patient" else conversation.patient_id
    participant = db.query(User).filter(User.id == participant_id).first()
    messages = db.query(PatientDoctorMessage).filter(
        PatientDoctorMessage.conversation_id == conversation.id
    ).order_by(PatientDoctorMessage.created_at.asc(), PatientDoctorMessage.id.asc()).all()
    return ConversationThread(
        conversation_id=conversation.id,
        patient_id=conversation.patient_id,
        doctor_id=conversation.doctor_id,
        participant_id=participant_id,
        participant_name=participant.full_name if participant else "Participant",
        grant_status=grant_status,
        can_send=grant_status == "active",
        unread_count=_unread_count(db, conversation, user.id, role),
        messages=[MessageResponse.model_validate(row) for row in messages],
    )


def send_message(
    db: Session, user: User, conversation_id: str, data: MessageCreate
) -> MessageResponse:
    role = _role(user)
    conversation = db.query(PatientDoctorConversation).filter(
        PatientDoctorConversation.id == conversation_id
    ).first()
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    if role == "patient":
        if conversation.patient_id != user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
        patient_id, doctor_id = user.id, conversation.doctor_id
    else:
        if conversation.doctor_id != user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
        patient_id, doctor_id = conversation.patient_id, user.id
    grant = _active_grant(db, patient_id, doctor_id, lock=True)
    # Keep lock order consistent with opening a conversation: grant first, then thread.
    conversation = db.query(PatientDoctorConversation).filter(
        PatientDoctorConversation.id == conversation_id
    ).with_for_update().first()
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    row = PatientDoctorMessage(
        conversation_id=conversation.id,
        grant_id=grant.id,
        sender_id=user.id,
        content=data.content,
    )
    db.add(row)
    conversation.updated_at = datetime.now(timezone.utc)
    db.add(PatientAccessEvent(
        grant_id=grant.id,
        patient_id=patient_id,
        doctor_id=doctor_id,
        actor_id=user.id,
        event_type="message_sent",
    ))
    db.commit()
    db.refresh(row)
    return MessageResponse.model_validate(row)


def mark_conversation_read(db: Session, user: User, conversation_id: str) -> int:
    role, conversation, _grant, _grant_status = _authorized_conversation(db, user, conversation_id)
    if role == "doctor":
        _active_grant(db, conversation.patient_id, user.id, lock=True)
    conversation = db.query(PatientDoctorConversation).filter(
        PatientDoctorConversation.id == conversation_id
    ).with_for_update().first()
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    unread_count = _unread_count(db, conversation, user.id, role)
    if unread_count == 0:
        return 0
    now = datetime.now(timezone.utc)
    if role == "patient":
        conversation.patient_last_read_at = now
    else:
        conversation.doctor_last_read_at = now
    latest_unread = db.query(PatientDoctorMessage).filter(
        PatientDoctorMessage.conversation_id == conversation.id,
        PatientDoctorMessage.sender_id != user.id,
    ).order_by(PatientDoctorMessage.created_at.desc(), PatientDoctorMessage.id.desc()).first()
    db.add(PatientAccessEvent(
        grant_id=latest_unread.grant_id if latest_unread else None,
        patient_id=conversation.patient_id,
        doctor_id=conversation.doctor_id,
        actor_id=user.id,
        event_type="conversation_read",
    ))
    db.commit()
    return 0
