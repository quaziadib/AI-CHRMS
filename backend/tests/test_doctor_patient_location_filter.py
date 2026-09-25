from types import SimpleNamespace

from app.services.patient_sharing import matches_doctor_list_filters


def test_matches_doctor_list_filters_district_and_risk():
    latest = SimpleNamespace(risk_level="high", district="Dhaka")
    assert matches_doctor_list_filters(latest) is True
    assert matches_doctor_list_filters(latest, district="Dhaka") is True
    assert matches_doctor_list_filters(latest, district="Khulna") is False
    assert matches_doctor_list_filters(latest, risk_level="high", district="Dhaka") is True
    assert matches_doctor_list_filters(latest, risk_level="low", district="Dhaka") is False


def test_matches_doctor_list_filters_excludes_missing_district_when_filtered():
    assert matches_doctor_list_filters(None, district="Dhaka") is False
    assert matches_doctor_list_filters(SimpleNamespace(risk_level="high", district=None), district="Dhaka") is False
    assert matches_doctor_list_filters(None) is True
    assert matches_doctor_list_filters(SimpleNamespace(risk_level=None, district=None)) is True
