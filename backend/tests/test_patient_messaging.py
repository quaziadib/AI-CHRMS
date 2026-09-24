from datetime import datetime, timezone
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.models.patient_messaging import PatientDoctorConversation, PatientDoctorMessage
from app.models.patient_sharing import PatientAccessEvent, PatientDoctorGrant
from app.models.user import User
from app.schemas.patient_messaging import MessageCreate
from app.services.patient_messaging import (
    get_conversation,
    mark_conversation_read,
    send_message,
)


class _Query:
    def __init__(self, results):
        self.results = results

    def filter(self, *_args):
        return self

    def with_for_update(self):
        return self

    def order_by(self, *_args):
        return self

    def first(self):
        value = self.results.pop(0)
        return value

    def all(self):
        return self.results.pop(0)

    def count(self):
        return self.results.pop(0)


class _DB:
    def __init__(self, results):
        self.results = {model: list(rows) for model, rows in results.items()}
        self.added = []
        self.commits = 0

    def query(self, model):
        return _Query(self.results[model])

    def add(self, item):
        self.added.append(item)

    def commit(self):
        self.commits += 1

    def refresh(self, item):
        if isinstance(item, PatientDoctorMessage):
            item.id = item.id or "message-1"
            item.created_at = item.created_at or datetime.now(timezone.utc)


def _conversation():
    return SimpleNamespace(
        id="conversation-1",
        patient_id="patient-1",
        doctor_id="doctor-1",
        patient_last_read_at=None,
        doctor_last_read_at=None,
        updated_at=None,
    )


def _grant(status="active", grant_id="grant-1"):
    return SimpleNamespace(id=grant_id, patient_id="patient-1", doctor_id="doctor-1", status=status)


def test_message_content_must_be_nonempty_and_within_limit():
    with pytest.raises(ValidationError):
        MessageCreate(content="   ")
    with pytest.raises(ValidationError):
        MessageCreate(content="x" * 4001)
    assert MessageCreate(content="  hello  ").content == "hello"


def test_doctor_cannot_send_after_grant_revocation():
    db = _DB({
        PatientDoctorConversation: [_conversation()],
        PatientDoctorGrant: [None],
    })
    doctor = SimpleNamespace(id="doctor-1", roles=["doctor"])

    with pytest.raises(HTTPException) as exc:
        send_message(db, doctor, "conversation-1", MessageCreate(content="Hello"))

    assert exc.value.status_code == 404
    assert db.commits == 0
    assert db.added == []


def test_missing_active_grant_cannot_send_message():
    db = _DB({
        PatientDoctorConversation: [_conversation()],
        PatientDoctorGrant: [None],
    })
    patient = SimpleNamespace(id="patient-1", roles=["user"])

    with pytest.raises(HTTPException):
        send_message(db, patient, "conversation-1", MessageCreate(content="Hello"))

    assert db.commits == 0


def test_active_participant_message_is_persisted_and_audited_without_content_copy():
    db = _DB({
        PatientDoctorConversation: [_conversation(), _conversation()],
        PatientDoctorGrant: [_grant()],
    })
    patient = SimpleNamespace(id="patient-1", roles=["user"])

    message = send_message(db, patient, "conversation-1", MessageCreate(content="Please call me"))

    assert message.content == "Please call me"
    assert message.sender_id == "patient-1"
    assert db.commits == 1
    event = next(item for item in db.added if isinstance(item, PatientAccessEvent))
    assert event.event_type == "message_sent"
    assert event.actor_id == "patient-1"
    assert not hasattr(event, "content")


def test_patient_can_read_conversation_history_after_revocation():
    sent_at = datetime.now(timezone.utc)
    prior_message = SimpleNamespace(
        id="message-1",
        conversation_id="conversation-1",
        sender_id="doctor-1",
        content="Your appointment is confirmed",
        created_at=sent_at,
    )
    doctor = SimpleNamespace(id="doctor-1", full_name="Dr. Example")
    db = _DB({
        PatientDoctorConversation: [_conversation()],
        PatientDoctorGrant: [_grant("revoked")],
        User: [doctor],
        PatientDoctorMessage: [[prior_message], 1],
    })
    patient = SimpleNamespace(id="patient-1", roles=["user"])

    thread = get_conversation(db, patient, "conversation-1")

    assert thread.messages[0].content == "Your appointment is confirmed"
    assert thread.can_send is False
    assert thread.unread_count == 1


def test_active_participant_can_read_conversation_history():
    doctor = SimpleNamespace(id="doctor-1", full_name="Dr. Example")
    message = SimpleNamespace(
        id="message-1",
        conversation_id="conversation-1",
        sender_id="doctor-1",
        content="Please bring your latest results",
        created_at=datetime.now(timezone.utc),
    )
    db = _DB({
        PatientDoctorConversation: [_conversation()],
        PatientDoctorGrant: [_grant()],
        User: [doctor],
        PatientDoctorMessage: [[message], 1],
    })
    patient = SimpleNamespace(id="patient-1", roles=["user"])

    thread = get_conversation(db, patient, "conversation-1")

    assert thread.can_send is True
    assert thread.messages[0].content == "Please bring your latest results"


def test_doctor_cannot_read_conversation_after_revocation():
    db = _DB({
        PatientDoctorConversation: [_conversation()],
        PatientDoctorGrant: [None],
    })
    doctor = SimpleNamespace(id="doctor-1", roles=["doctor"])

    with pytest.raises(HTTPException) as exc:
        get_conversation(db, doctor, "conversation-1")

    assert exc.value.status_code == 404


def test_regrant_resumes_existing_conversation_and_audits_new_grant():
    conversation = _conversation()
    db = _DB({
        PatientDoctorConversation: [conversation, conversation],
        PatientDoctorGrant: [_grant("active", "grant-2")],
    })
    patient = SimpleNamespace(id="patient-1", roles=["user"])

    message = send_message(db, patient, "conversation-1", MessageCreate(content="Following up"))

    assert message.conversation_id == "conversation-1"
    assert message.content == "Following up"
    event = next(item for item in db.added if isinstance(item, PatientAccessEvent))
    assert event.grant_id == "grant-2"


def test_reading_a_message_logs_metadata_only():
    conversation = _conversation()
    prior_message = SimpleNamespace(grant_id="grant-1")
    db = _DB({
        PatientDoctorConversation: [conversation, conversation],
        PatientDoctorGrant: [_grant("revoked")],
        PatientDoctorMessage: [1, prior_message],
    })
    patient = SimpleNamespace(id="patient-1", roles=["user"])

    assert mark_conversation_read(db, patient, "conversation-1") == 0

    event = next(item for item in db.added if isinstance(item, PatientAccessEvent))
    assert event.event_type == "conversation_read"
    assert event.grant_id == "grant-1"
    assert not hasattr(event, "content")
    assert conversation.patient_last_read_at is not None
    assert db.commits == 1
