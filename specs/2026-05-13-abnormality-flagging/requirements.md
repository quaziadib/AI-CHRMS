# Requirements — Abnormality Flagging

## What We're Building

Rule-based detection of out-of-range lab values and vitals on every patient record. Flags are computed automatically on record create and update (no LLM call — pure Python thresholds). Results stored as JSONB on the record and surfaced on the doctor EHR view, patient records page, and admin panel.

---

## Context: What Already Exists

- `PatientRecord` stores blood_glucose (mg/dL), cholesterol (mg/dL), hemoglobin (g/dL), creatinine (mg/dL), bp_systolic, bp_diastolic, bmi, pulse_rate, gender
- `services/record.py` already hooks `create_record` and `update_record` — flag computation slots in here
- `PatientRecordResponse` schema is additive — new nullable fields don't break existing clients
- Doctor EHR view at `/doctor/patients/[id]` already shows full record detail
- Patient records page at `/records` shows record cards

---

## Scope

### In Scope

- `backend/app/services/flagging.py` — pure Python rule engine; takes a `PatientRecord`, returns `list[dict]`
- DB migration: `flags JSONB` column on `patient_records`
- Auto-trigger on `create_record`, `update_record`, and `score_record` in `services/record.py`
- `AbnormalityFlag` Pydantic schema; `flags` field added to `PatientRecordResponse`
- Frontend `FlagsPanel` component — renders flag badges by severity
- Flags visible on: doctor EHR view, patient record detail

### Out of Scope

- ML-based flagging (rule-based only in Phase 2; ML model requires longitudinal data — Phase ∞)
- HbA1c threshold (field not in current model — add when form is extended)
- Admin-configurable thresholds (hardcoded clinical standards for now)
- Per-flag audit log entries (too noisy; flag recomputation is a side-effect of record save)
- Push notifications on new flags

---

## Clinical Thresholds (ADA / WHO Guidelines)

| Field | Condition | Threshold | Severity |
|-------|-----------|-----------|----------|
| blood_glucose | Pre-diabetic | 100–125 mg/dL fasting | warning |
| blood_glucose | Diabetic range | ≥ 126 mg/dL fasting | critical |
| bp_systolic/diastolic | Hypertension Stage 1 | ≥ 130 systolic OR ≥ 80 diastolic | warning |
| bp_systolic/diastolic | Hypertension Stage 2 | ≥ 140 systolic OR ≥ 90 diastolic | critical |
| bmi | Underweight | < 18.5 kg/m² | warning |
| bmi | Overweight | 25–29.9 kg/m² | warning |
| bmi | Obese | ≥ 30 kg/m² | critical |
| cholesterol | Borderline high | 200–239 mg/dL | warning |
| cholesterol | High | ≥ 240 mg/dL | critical |
| hemoglobin | Anemia (female) | < 12.0 g/dL | warning |
| hemoglobin | Anemia (male) | < 13.5 g/dL | warning |
| creatinine | Elevated | > 1.2 mg/dL | warning |
| pulse_rate | Bradycardia | < 60 bpm | warning |
| pulse_rate | Tachycardia | > 100 bpm | warning |

---

## Flag Data Shape

```json
{
  "field": "blood_glucose",
  "label": "Diabetic range",
  "value": 145.0,
  "unit": "mg/dL",
  "severity": "critical",
  "reference": "Fasting glucose ≥ 126 mg/dL"
}
```

Stored as `flags: list[Flag] | null` in JSONB column. Empty list `[]` means all values normal.

---

## Key Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Rule-based only | Yes — pure Python thresholds | No training data; thresholds are established clinical standards |
| Auto-trigger | On every record save | Flags are free to compute (no LLM); always up to date |
| Storage | JSONB on `patient_records` | Consistent with recommendations; queryable; no join needed |
| Severity levels | `warning` / `critical` only | Enough signal for clinical triage; avoids over-engineering |
| Thresholds | Hardcoded from ADA/WHO | No admin UI needed yet; change via code review which forces deliberation |

---

## Constraints

- No LLM calls — pure computation, zero extra cost
- Flags recomputed on every save — stale flags not possible
- `PatientRecordResponse` change is additive (nullable field) — backwards compatible
- No patient PII in flag labels (values are clinical measurements, not names)
