"""DB-backed tests for doctor profiles, backfill and doctor search.

Skipped when no PostgreSQL is reachable at DATABASE_URL.
"""

from __future__ import annotations

import uuid

import pytest
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.base import engine
from app.db.init_db import create_tables
from app.models.doctor_profile import DoctorProfile
from app.models.user import User
from app.schemas.user import DoctorProfileCreate, UserCreate
from app.services import patient_sharing as sharing
from app.services.auth import register_user


def _db_available() -> bool:
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


pytestmark = pytest.mark.skipif(not _db_available(), reason="PostgreSQL not available")


@pytest.fixture()
def db():
    create_tables()
    with Session(engine) as session:
        yield session
        session.rollback()
        session.query(User).filter(User.email.like("%@dp-test.example.com")).delete(synchronize_session=False)
        session.commit()


def _email(tag: str) -> str:
    return f"{tag}-{uuid.uuid4().hex[:8]}@dp-test.example.com"


def _profile(**kw) -> DoctorProfileCreate:
    base = dict(
        specialization="Endocrinology",
        affiliations=["BIRDEM General Hospital"],
        division="Dhaka Division",
        district="Dhaka",
        location="Shahbag, Dhaka",
    )
    base.update(kw)
    return DoctorProfileCreate(**base)


def _make_doctor(db, name: str, **profile_kw) -> User:
    user = User(
        email=_email("doc"), password_hash="x", full_name=name, roles=["doctor"],
        is_active=True,
    )
    user.doctor_profile = DoctorProfile(**_profile(**profile_kw).model_dump())
    db.add(user)
    db.commit()
    return user


def test_register_doctor_stores_profile_and_stays_pending(db):
    data = UserCreate(
        email=_email("reg"), password="password1", full_name="Dr Reg", role="doctor",
        doctor_profile=_profile(),
    )
    resp = register_user(db, data)
    user = db.query(User).filter(User.id == resp.user.id).one()
    assert user.roles == ["user"] and user.role_request_status == "pending"
    assert user.doctor_profile.specialization == "Endocrinology"


def test_register_patient_has_no_profile(db):
    resp = register_user(db, UserCreate(email=_email("pat"), password="password1", full_name="Pat Ient"))
    assert db.query(DoctorProfile).filter(DoctorProfile.user_id == resp.user.id).first() is None


def test_deleting_user_cascades_profile(db):
    doc = _make_doctor(db, "Dr Gone")
    uid = doc.id
    db.delete(doc)
    db.commit()
    assert db.query(DoctorProfile).filter(DoctorProfile.user_id == uid).first() is None


def test_backfill_creates_placeholder_once_and_skips_patients(db):
    legacy = User(email=_email("legacy"), password_hash="x", full_name="Dr Legacy", roles=["doctor"])
    pending = User(
        email=_email("pend"), password_hash="x", full_name="Dr Pending", roles=["user"],
        requested_role="doctor", role_request_status="pending",
    )
    patient = User(email=_email("p"), password_hash="x", full_name="Patient P", roles=["user"])
    rejected = User(
        email=_email("rej"), password_hash="x", full_name="Dr Rejected", roles=["user"],
        requested_role="doctor", role_request_status="rejected",
    )
    db.add_all([legacy, pending, patient, rejected])
    db.commit()
    legacy_id, pending_id, patient_id, rejected_id = legacy.id, pending.id, patient.id, rejected.id
    db.rollback()  # release locks: create_tables runs ALTER TABLE

    create_tables()
    p1 = db.get(DoctorProfile, legacy_id)
    assert p1 and p1.specialization and p1.division and p1.district
    assert p1.location.startswith("Placeholder:")
    assert db.get(DoctorProfile, pending_id) is not None
    assert db.get(DoctorProfile, patient_id) is None
    assert db.get(DoctorProfile, rejected_id) is None

    snapshot = (p1.specialization, p1.division, p1.district, p1.location)
    db.rollback()
    create_tables()
    db.expire_all()
    p2 = db.get(DoctorProfile, legacy_id)
    assert (p2.specialization, p2.division, p2.district, p2.location) == snapshot


def _names(res):
    return {i.full_name for i in res.items}


def test_search_by_field_and_all(db):
    a = _make_doctor(db, "Dr Zzrahman", specialization="Zzcardio", affiliations=["Zzsquare Hospitals"])
    b = _make_doctor(db, "Dr Zzkarim", specialization="Zzendo", division="Khulna Division",
                     district="Khulna", location="Zzsonadanga", affiliations=["Zzkhulna Medical College"])
    assert _names(sharing.search_doctors(db, q="zzrahman", search_by="name")) == {a.full_name}
    assert _names(sharing.search_doctors(db, q="ZZCARDIO", search_by="specialization")) == {a.full_name}
    assert _names(sharing.search_doctors(db, q="zzkhulna medical", search_by="affiliation")) == {b.full_name}
    assert _names(sharing.search_doctors(db, q="zzsonadanga", search_by="location")) == {b.full_name}
    assert _names(sharing.search_doctors(db, q=b.email, search_by="email")) == {b.full_name}
    # all: matches via affiliation text
    assert _names(sharing.search_doctors(db, q="zzsquare hosp", search_by="all")) >= {a.full_name}
    assert b.full_name not in _names(sharing.search_doctors(db, q="zzsquare hosp", search_by="all"))
    # name search must not match specialization
    assert sharing.search_doctors(db, q="Zzcardio", search_by="name").total == 0


def test_search_filters_combine_and_hide_ineligible(db):
    a = _make_doctor(db, "Dr Yyone", specialization="Nephrology", division="Sylhet Division", district="Sylhet")
    _make_doctor(db, "Dr Yytwo", specialization="Nephrology", division="Dhaka Division", district="Dhaka")
    inactive = _make_doctor(db, "Dr Yyinactive", specialization="Nephrology",
                            division="Sylhet Division", district="Sylhet")
    inactive.is_active = False
    pending = User(email=_email("pd"), password_hash="x", full_name="Dr Yypending", roles=["user"],
                   requested_role="doctor", role_request_status="pending")
    pending.doctor_profile = DoctorProfile(**_profile(specialization="Nephrology",
                                                      division="Sylhet Division", district="Sylhet").model_dump())
    db.add(pending)
    db.commit()
    res = sharing.search_doctors(db, q="Yy", search_by="name",
                                 specialization="nephrology", division="Sylhet Division")
    assert _names(res) == {a.full_name}
    assert res.items[0].affiliations == ["BIRDEM General Hospital"]


def test_search_escapes_wildcards_and_paginates(db):
    _make_doctor(db, "Dr Wwone")
    _make_doctor(db, "Dr Wwtwo")
    assert sharing.search_doctors(db, q="%", search_by="name").total == 0
    assert sharing.search_doctors(db, q="Dr Ww_ne", search_by="name").total == 0
    page = sharing.search_doctors(db, q="Dr Ww", search_by="name", limit=1, offset=1)
    assert page.total == 2 and [i.full_name for i in page.items] == ["Dr Wwtwo"]
    assert sharing.search_doctors(db, q="no-such-doctor-xyz").items == []


def test_filter_options_only_searchable_values(db):
    _make_doctor(db, "Dr Opt", specialization="Zzopt-Spec", division="Zzopt Division", district="Zzopt")
    gone = _make_doctor(db, "Dr OptOff", specialization="Zzoff-Spec")
    gone.is_active = False
    db.commit()
    opts = sharing.doctor_filter_options(db)
    assert "Zzopt-Spec" in opts.specializations and "Zzoff-Spec" not in opts.specializations
    assert "Zzopt Division" in opts.divisions and "Zzopt" in opts.districts


def test_admin_role_requests_include_doctor_profile(db):
    from app.services.admin import list_role_requests

    resp = register_user(db, UserCreate(
        email=_email("rr"), password="password1", full_name="Dr RR", role="doctor",
        doctor_profile=_profile(id_pic="https://example.com/id.png"),
    ))
    rows = {r.id: r for r in list_role_requests(db, limit=1000)}
    assert rows[resp.user.id].doctor_profile.id_pic == "https://example.com/id.png"


def test_search_api_validation_and_patient_only(db):
    from fastapi.testclient import TestClient

    from app.api.deps import get_current_user
    from app.db.session import get_db
    from app.main import app

    patient = db.query(User).filter(User.id == register_user(db, UserCreate(
        email=_email("api"), password="password1", full_name="Api Patient")).user.id).one()
    app.dependency_overrides[get_current_user] = lambda: patient
    try:
        client = TestClient(app)
        assert client.get("/v1/sharing/doctors", params={"search_by": "bogus"}).status_code == 422
        ok = client.get("/v1/sharing/doctors", params={"q": "x", "search_by": "name"})
        assert ok.status_code == 200 and set(ok.json()) == {"items", "total"}
        assert client.get("/v1/sharing/doctors/filters").status_code == 200
        for item in client.get("/v1/sharing/doctors").json()["items"]:
            assert "id_pic" not in item
    finally:
        app.dependency_overrides.clear()
