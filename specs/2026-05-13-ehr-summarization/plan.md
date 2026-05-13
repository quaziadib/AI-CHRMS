# Plan — EHR Summarization

Numbered task groups in execution order. Each group is independently committable.

---

## Group 1 — DB: Add Summary Columns

1.1 Add to `_run_migrations()` in `backend/app/db/init_db.py`:
```sql
ALTER TABLE patient_records ADD COLUMN IF NOT EXISTS ehr_summary TEXT;
ALTER TABLE patient_records ADD COLUMN IF NOT EXISTS ehr_summary_at TIMESTAMPTZ;
```

1.2 Add fields to `PatientRecord` model (`backend/app/models/record.py`):
```python
ehr_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
ehr_summary_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
```

1.3 Add fields to `PatientRecordResponse` schema (`backend/app/schemas/record.py`):
```python
ehr_summary: str | None = None
ehr_summary_at: datetime | None = None
```

---

## Group 2 — Backend: EHR Summary Chain

2.1 Create `backend/app/ai/ehr_summary_chain.py`:
- System prompt: clinical briefing assistant, plain prose, ~150 words, no markdown
- Human prompt: serialize full `PatientRecord` into structured text (same field mapping pattern as `risk_chain.py`)
- `run_ehr_summary_chain(record: PatientRecord) -> str`
- Uses `get_llm()` + `StrOutputParser`

---

## Group 3 — Backend: Summarize Endpoint

3.1 Add `POST /v1/doctor/patients/{record_id}/summarize` to `backend/app/api/v1/doctor.py`:
- Requires `DoctorUser` dep (doctor must be assigned to this record)
- 503 if `settings.ENABLE_EHR_SUMMARY` is `False`
- Calls `run_ehr_summary_chain(record)`
- Sets `record.ehr_summary = summary` and `record.ehr_summary_at = datetime.now(UTC)`
- Calls `log_audit(db, doctor.id, "ehr_summary_generated", "patient_record", record_id)`
- Commits and returns `PatientRecordResponse`
- 502 on chain exception

3.2 Add `ENABLE_EHR_SUMMARY: bool = True` to `backend/app/core/config.py`.

---

## Group 4 — Frontend: Summary Panel + Button

4.1 Update `frontend/app/(dashboard)/doctor/patients/[id]/page.tsx`:
- Add "Generate Summary" button (or "Regenerate Summary" if `record.ehr_summary` exists)
- On click: call `POST /api/v1/doctor/patients/{id}/summarize` via `api.post()`
- Show loading spinner on the button while awaiting response
- On success: mutate SWR cache to show updated record (or `router.refresh()`)
- On error: show toast error

4.2 Add summary display panel to the EHR view (below risk widget, above record fields):
- Only render when `record.ehr_summary` is not null
- Show summary text in a Card with "Clinical Summary" heading
- Show `ehr_summary_at` formatted as "Generated on [date] at [time]"
- Subtle "Regenerate" link/button next to timestamp

---

## Group 5 — Spec + Roadmap Update

5.1 Update `specs/roadmap.md` — mark EHR summarization as `[x]`.

5.2 Fill in `specs/2026-05-13-ehr-summarization/validation.md` post-implementation checks.
