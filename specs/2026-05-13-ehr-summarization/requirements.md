# Requirements — EHR Summarization

## What We're Building

An on-demand LLM-generated clinical summary of a patient's full health record, triggered by a doctor clicking "Generate Summary" on the read-only EHR view. The summary is stored on the record and displayed with a timestamp. Doctors can regenerate at any time.

---

## Context: What Already Exists

- Doctor dashboard (`/doctor`) lists assigned patients
- Read-only EHR view (`/doctor/patients/{id}`) shows all record fields — no edit/delete
- `PatientRecord` model already contains full health data (demographics, vitals, labs, lifestyle, risk level, recommendations)
- `DoctorUser` FastAPI dependency ensures only assigned doctor can access a record
- LLM factory (`get_llm()`) used by risk and recommendations chains — same pattern applies here
- Audit log pattern established: `log_audit(db, user_id, action, entity_type, entity_id)`

---

## Scope

### In Scope

- `backend/app/ai/ehr_summary_chain.py` — LangChain chain: full patient record context → clinical prose summary
- `POST /v1/doctor/patients/{record_id}/summarize` — DoctorUser-gated; stores result; returns updated record
- DB migration: add `ehr_summary TEXT` and `ehr_summary_at TIMESTAMPTZ` to `patient_records`
- Schema: `PatientRecordResponse` gains `ehr_summary: str | None` and `ehr_summary_at: datetime | None`
- Feature flag: `ENABLE_EHR_SUMMARY: bool = True` in config
- Frontend: "Generate Summary" button on `/doctor/patients/[id]`; summary panel with timestamp; "Regenerate" if already present
- Audit log: `ehr_summary_generated` action per call

### Out of Scope

- Admin triggering summarization (doctor-only in Phase 2; admin can be added later)
- Patient seeing their own summary (clinical language; not patient-facing)
- Batch summarization of all records
- Summary diff / version history (Phase ∞)
- Streaming the summary token-by-token (future enhancement)

---

## Key Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Trigger | On-demand (doctor clicks) | Avoids LLM cost on every record save; doctor controls when summary is needed |
| Scope | Assigned doctor only | Matches existing `DoctorUser` access control — doctor can only view assigned patients |
| Storage | `ehr_summary TEXT` + `ehr_summary_at TIMESTAMPTZ` on `PatientRecord` | No new table; consistent with how risk/recommendations are stored |
| Output | Plain prose (1–2 paragraphs, ~150 words) | Clinical summary is a narrative, not structured JSON |
| Regeneration | Allowed anytime — overwrites previous value | Doctor may want a fresh summary after new data is entered |
| Feature flag | `ENABLE_EHR_SUMMARY: bool = True` | Consistent with `ENABLE_RECOMMENDATIONS` pattern; allows cost control |

---

## LLM Output Contract

```
System: Clinical EHR assistant. Given a full patient health profile, write a concise clinical 
        summary (1–2 paragraphs, ~150 words) as if briefing a doctor before a consultation.
        Plain prose — no markdown, no bullet points, no headers.
        Include: key demographics, significant medical history, current vitals, notable lab values,
        risk level and explanation, and top lifestyle factors. Conclude with the top 1–2 clinical
        concerns for this patient.

Output: str  (plain text, ~150 words)
```

---

## API Contract

```
POST /v1/doctor/patients/{record_id}/summarize
Authorization: Bearer <doctor-token>

Response 200: PatientRecordResponse (with ehr_summary and ehr_summary_at populated)
Response 403: not a doctor
Response 404: record not assigned to this doctor
Response 503: ENABLE_EHR_SUMMARY=false
Response 502: LLM chain failure
```

---

## DB Changes

```sql
ALTER TABLE patient_records ADD COLUMN IF NOT EXISTS ehr_summary TEXT;
ALTER TABLE patient_records ADD COLUMN IF NOT EXISTS ehr_summary_at TIMESTAMPTZ;
```

Added via `_run_migrations()` in `init_db.py` — same pattern as `doctor_id`.

---

## Constraints (from mission.md + tech-stack.md)

- Same `get_llm()` factory — no new LLM provider setup
- No patient PII in application logs (summary content not logged, only action metadata)
- Feature flag must allow zero-downtime disable
- Doctor access control enforced at API level via `DoctorUser` dep — not just UI
- `PatientRecordResponse` schema change is additive (nullable fields) — backwards compatible
