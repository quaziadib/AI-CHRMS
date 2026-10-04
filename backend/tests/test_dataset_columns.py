"""Column spec: parsing, formatting and round-trip over the committed seed files."""

import csv
from pathlib import Path

import pytest

from app.services import dataset_columns as dc

SEED = Path(__file__).resolve().parent.parent / "app" / "data" / "seed"


def _rows(name):
    with open(SEED / name, encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        return reader.fieldnames, list(reader)


def test_seed_headers_match_spec():
    h, _ = _rows("patients_1000.csv")
    assert dc.check_header(dc.PATIENT_COLUMNS, h) == []
    assert [c.name for c in dc.PATIENT_COLUMNS] == h
    h, _ = _rows("doctors_100.csv")
    assert dc.check_header(dc.DOCTOR_IMPORT_COLUMNS, h) == []


def test_every_seed_row_parses_cleanly():
    _, patients = _rows("patients_1000.csv")
    _, doctors = _rows("doctors_100.csv")
    assert len(patients) == 1000 and len(doctors) == 100
    for r in patients:
        _, errs = dc.parse_row(dc.PATIENT_COLUMNS, r)
        assert errs == [], r["pid"]
    for r in doctors:
        _, errs = dc.parse_row(dc.DOCTOR_IMPORT_COLUMNS, r)
        assert errs == [], r["email"]


def test_patient_format_round_trips_to_same_values():
    _, patients = _rows("patients_1000.csv")
    names = [c.name for c in dc.PATIENT_COLUMNS]
    for r in patients:
        vals, _ = dc.parse_row(dc.PATIENT_COLUMNS, r)
        out = dict(zip(names, dc.format_row(dc.PATIENT_COLUMNS, vals)))
        again, errs = dc.parse_row(dc.PATIENT_COLUMNS, out)
        assert errs == [] and again == vals, r["pid"]


def test_blank_optionals_become_none():
    _, patients = _rows("patients_1000.csv")
    blank = next(r for r in patients if r["allergies"] == "" and r["pregnancies"] == "")
    vals, _ = dc.parse_row(dc.PATIENT_COLUMNS, blank)
    assert vals["allergies"] is None and vals["pregnancies"] is None


def test_bad_values_report_column_and_reason():
    _, patients = _rows("patients_1000.csv")
    bad = dict(patients[0], age="abc", pid="", sound_sleep="maybe")
    _, errs = dc.parse_row(dc.PATIENT_COLUMNS, bad)
    assert {e.split(":")[0] for e in errs} == {"age", "pid", "sound_sleep"}


def test_doctor_division_and_affiliations():
    assert dc.division_to_app("Dhaka") == "Dhaka Division"
    assert dc.division_to_app("Chattogram") == "Chittagong Division"
    assert dc.division_to_app("Barishal") == "Barisal Division"
    assert dc.division_to_app("Dhaka Division") == "Dhaka Division"
    for csv_name in ["Dhaka", "Chattogram", "Barishal", "Khulna", "Sylhet"]:
        assert dc.division_to_csv(dc.division_to_app(csv_name)) == csv_name
    assert dc.parse_affiliations("A; B;;C") == ["A", "B", "C"]
    assert dc.fmt_affiliations(["A", "B"]) == "A; B"


def test_doctor_export_has_no_password_hash():
    assert "password_hash" not in [c.name for c in dc.DOCTOR_EXPORT_COLUMNS]


def test_doctor_round_trip_semantics():
    _, doctors = _rows("doctors_100.csv")
    for r in doctors:
        vals, _ = dc.parse_row(dc.DOCTOR_IMPORT_COLUMNS, r)
        out = dict(zip([c.name for c in dc.DOCTOR_EXPORT_COLUMNS],
                       dc.format_row(dc.DOCTOR_EXPORT_COLUMNS, vals)))
        again, errs = dc.parse_row(dc.DOCTOR_EXPORT_COLUMNS, out)
        assert errs == []
        assert again == {k: v for k, v in vals.items() if k != "password_hash"}


@pytest.mark.parametrize("text", ["=SUM(A1)", "+1", "-1x", "@cmd", "plain", "it's"])
def test_formula_guard_round_trip(text):
    guarded = dc.fmt_text(text)
    if text[0] in "=+-@":
        assert guarded.startswith("'")
    assert dc.parse_str(guarded) == text


def test_numbers_are_not_guarded():
    assert dc.fmt_plain(-3.5) == "-3.5"
