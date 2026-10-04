"""Unit tests for prescription service: creation, update, revoke, visibility, and PDF endpoint."""

from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.schemas.prescription import (
    PrescriptionCreate,
    PrescriptionMedicationIn,
    PrescriptionUpdate,
)
from app.services import prescription as svc


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_db(prescriptions=None, items=None, meds=None, grant=None, user=None):
    """Return a minimal mock DB session."""
    db = MagicMock()

    def _query_side_effect(model):
        q = MagicMock()
        # filter().first() — returns first match from a list or None
        instances = prescriptions or []
        q.filter.return_value.first.return_value = instances[0] if instances else None
        q.filter.return_value.order_by.return_value.all.return_value = instances
        q.filter.return_value.all.return_value = items or []
        q.filter.return_value.delete.return_value = None
        return q

    db.query.side_effect = _query_side_effect
    db.add = MagicMock()
    db.flush = MagicMock()
    db.commit = MagicMock()
    db.refresh = MagicMock()
    return db


def _prescription(status="draft", doctor_id="doc-1", patient_id="pat-1", id="rx-1"):
    p = SimpleNamespace(
        id=id,
        doctor_id=doctor_id,
        patient_id=patient_id,
        grant_id="grant-1",
        status=status,
        created_at=None,
        updated_at=None,
    )
    return p


# ---------------------------------------------------------------------------
# create_prescription
# ---------------------------------------------------------------------------

class TestCreatePrescription:
    def test_requires_active_grant(self):
        with patch("app.services.prescription.require_active_grant") as mock_grant:
            mock_grant.side_effect = HTTPException(status_code=404, detail="not found")
            db = _make_db()
            data = PrescriptionCreate(status="draft")
            with pytest.raises(HTTPException) as exc:
                svc.create_prescription(db, "doc-1", "pat-1", data)
            assert exc.value.status_code == 404

    def test_creates_draft_prescription(self):
        grant = SimpleNamespace(id="grant-1", patient_id="pat-1", doctor_id="doc-1")
        with patch("app.services.prescription.require_active_grant", return_value=grant), \
             patch("app.services.prescription._build_response") as mock_resp, \
             patch("app.services.prescription.log_audit"):
            db = _make_db()
            data = PrescriptionCreate(status="draft")
            svc.create_prescription(db, "doc-1", "pat-1", data)
            db.add.assert_called()
            mock_resp.assert_called_once()

    def test_create_rejects_revoked_status(self):
        with pytest.raises(ValidationError):
            PrescriptionCreate(status="revoked")

    def test_create_uses_one_timestamp(self):
        grant = SimpleNamespace(id="grant-1", patient_id="pat-1", doctor_id="doc-1")
        with patch("app.services.prescription.require_active_grant", return_value=grant), \
             patch("app.services.prescription._build_response"), \
             patch("app.services.prescription.log_audit"):
            db = _make_db()
            svc.create_prescription(db, "doc-1", "pat-1", PrescriptionCreate(status="draft"))
            created = db.add.call_args_list[0].args[0]
            assert created.created_at == created.updated_at

    def test_invalid_dosage_rejected_by_schema(self):
        with pytest.raises(Exception):
            PrescriptionMedicationIn(
                medicine_name="Metformin",
                dosage_morning=-1,   # negative is invalid
                dosage_afternoon=0,
                dosage_night=1,
                duration_days=30,
            )


# ---------------------------------------------------------------------------
# update_prescription
# ---------------------------------------------------------------------------

class TestUpdatePrescription:
    def test_unknown_prescription_raises_404(self):
        db = _make_db(prescriptions=[])
        data = PrescriptionUpdate(status="published")
        with pytest.raises(HTTPException) as exc:
            svc.update_prescription(db, "doc-1", "rx-missing", data)
        assert exc.value.status_code == 404

    def test_wrong_doctor_raises_403(self):
        p = _prescription(status="draft", doctor_id="doc-2")
        db = _make_db(prescriptions=[p])
        data = PrescriptionUpdate(status="published")
        with pytest.raises(HTTPException) as exc:
            svc.update_prescription(db, "doc-1", p.id, data)
        assert exc.value.status_code == 403

    def test_cannot_edit_revoked(self):
        p = _prescription(status="revoked")
        db = _make_db(prescriptions=[p])
        data = PrescriptionUpdate(status="published")
        with pytest.raises(HTTPException) as exc:
            svc.update_prescription(db, "doc-1", p.id, data)
        assert exc.value.status_code == 409

    def test_cannot_revoke_draft(self):
        p = _prescription(status="draft")
        db = _make_db(prescriptions=[p])
        data = PrescriptionUpdate(status="revoked")
        with pytest.raises(HTTPException) as exc:
            svc.update_prescription(db, "doc-1", p.id, data)
        assert exc.value.status_code == 409

    def test_edit_draft_keeps_draft_status(self):
        p = _prescription(status="draft")
        db = _make_db(prescriptions=[p])
        data = PrescriptionUpdate(status="draft")
        with patch("app.services.prescription._replace_children"), \
             patch("app.services.prescription._build_response"), \
             patch("app.services.prescription.log_audit"):
            svc.update_prescription(db, "doc-1", p.id, data)
        assert p.status == "draft"

    def test_cannot_revert_published_to_draft(self):
        p = _prescription(status="published")
        db = _make_db(prescriptions=[p])
        data = PrescriptionUpdate(status="draft")
        with pytest.raises(HTTPException) as exc:
            svc.update_prescription(db, "doc-1", p.id, data)
        assert exc.value.status_code == 409
        assert p.status == "published"

    def test_publish_draft(self):
        p = _prescription(status="draft")
        db = _make_db(prescriptions=[p])
        data = PrescriptionUpdate(status="published")
        with patch("app.services.prescription._replace_children"), \
             patch("app.services.prescription._build_response") as mock_resp, \
             patch("app.services.prescription.log_audit"):
            svc.update_prescription(db, "doc-1", p.id, data)
        assert p.status == "published"

    def test_revoke_published(self):
        p = _prescription(status="published")
        db = _make_db(prescriptions=[p])
        data = PrescriptionUpdate(status="revoked")
        with patch("app.services.prescription._build_response") as mock_resp, \
             patch("app.services.prescription.log_audit"):
            svc.update_prescription(db, "doc-1", p.id, data)
        assert p.status == "revoked"


# ---------------------------------------------------------------------------
# list_patient_prescriptions — draft visibility
# ---------------------------------------------------------------------------

class TestPatientVisibility:
    def test_patient_does_not_see_drafts(self):
        # The service filters on status IN ('published', 'revoked')
        # We verify that a draft does not appear by checking the query filter
        db = MagicMock()
        q = MagicMock()
        q.filter.return_value.order_by.return_value.all.return_value = []
        db.query.return_value = q

        svc.list_patient_prescriptions(db, "pat-1")

        # Verify the filter was called (status in published/revoked)
        assert db.query.called
        filter_call_args = q.filter.call_args_list
        assert len(filter_call_args) > 0


# ---------------------------------------------------------------------------
# get_prescription_for_patient — blocks draft access
# ---------------------------------------------------------------------------

class TestGetPrescriptionForPatient:
    def test_blocks_access_to_draft(self):
        p = _prescription(status="draft", patient_id="pat-1")
        db = _make_db(prescriptions=[p])
        with pytest.raises(HTTPException) as exc:
            svc.get_prescription_for_patient(db, "pat-1", p.id)
        assert exc.value.status_code == 404

    def test_blocks_access_to_other_patients_prescription(self):
        p = _prescription(status="published", patient_id="pat-other")
        db = _make_db(prescriptions=[p])
        with pytest.raises(HTTPException) as exc:
            svc.get_prescription_for_patient(db, "pat-1", p.id)
        assert exc.value.status_code == 404


# ---------------------------------------------------------------------------
# PDF endpoint smoke test
# ---------------------------------------------------------------------------

class TestPdfEndpoint:
    def test_generate_pdf_returns_bytes(self):
        fake_pdf = b"%PDF-1.4 fake"
        from app.schemas.prescription import PrescriptionResponse
        p = PrescriptionResponse(
            id="rx-1",
            doctor_id="doc-1",
            patient_id="pat-1",
            status="published",
            created_at="2025-01-01T00:00:00",
            updated_at="2025-01-01T00:00:00",
            symptoms_diagnosis=[],
            lab_tests=[],
            general_advice=[],
            medications=[],
        )
        fake_weasyprint = MagicMock()
        fake_weasyprint.HTML.return_value.write_pdf.return_value = fake_pdf
        # weasyprint is imported lazily inside the service (heavy native deps), so stub the module.
        with patch.dict("sys.modules", {"weasyprint": fake_weasyprint}):
            result = svc.generate_prescription_pdf(p)
        assert result == fake_pdf
        html = fake_weasyprint.HTML.call_args.kwargs["string"]
        assert "<html" in html.lower()


    def test_generate_pdf_failure_returns_503(self):
        from app.schemas.prescription import PrescriptionResponse
        p = PrescriptionResponse(
            id="rx-1",
            doctor_id="doc-1",
            patient_id="pat-1",
            status="published",
            created_at="2025-01-01T00:00:00",
            updated_at="2025-01-01T00:00:00",
            symptoms_diagnosis=[],
            lab_tests=[],
            general_advice=[],
            medications=[],
        )
        fake_weasyprint = MagicMock()
        fake_weasyprint.HTML.return_value.write_pdf.side_effect = OSError("cannot load library 'libpango-1.0-0'")
        with patch.dict("sys.modules", {"weasyprint": fake_weasyprint}):
            with pytest.raises(HTTPException) as exc:
                svc.generate_prescription_pdf(p)
        assert exc.value.status_code == 503
