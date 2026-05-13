# Plan — Abnormality Flagging

Numbered task groups in execution order. Each group is independently committable.

---

## Group 1 — DB + Model + Schema

1.1 Add to `_run_migrations()` in `backend/app/db/init_db.py`:
```sql
ALTER TABLE patient_records ADD COLUMN IF NOT EXISTS flags JSONB;
```

1.2 Add to `PatientRecord` model (`backend/app/models/record.py`):
```python
flags: Mapped[list | None] = mapped_column(JSONB, nullable=True)
```

1.3 Add `AbnormalityFlag` schema and `flags` field to `backend/app/schemas/record.py`:
```python
class AbnormalityFlag(BaseModel):
    field: str
    label: str
    value: float
    unit: str
    severity: Literal["warning", "critical"]
    reference: str

# In PatientRecordResponse:
flags: Optional[list[AbnormalityFlag]] = None
```

---

## Group 2 — Flagging Service

2.1 Create `backend/app/services/flagging.py`:
- `compute_flags(record: PatientRecord) -> list[dict]`
- Pure Python — no DB calls, no LLM calls
- Rules for: blood_glucose, bp, bmi, cholesterol, hemoglobin, creatinine, pulse_rate
- Returns list of flag dicts (empty list when all values normal)

---

## Group 3 — Auto-Trigger in Record Service

3.1 Import `compute_flags` in `backend/app/services/record.py`.

3.2 Call `compute_flags` and store result after each record mutation:
- `create_record`: after `db.commit()` / `db.refresh()`
- `update_record`: after the update commit (before risk scoring)
- `score_record`: after risk level is saved (flags can reference risk level context)

Pattern:
```python
record.flags = compute_flags(record)
db.commit()
```

---

## Group 4 — Frontend: FlagsPanel + Integration

4.1 Create `frontend/features/records/components/flags-panel.tsx`:
- Props: `flags: AbnormalityFlag[]`
- Renders severity-colored badges: critical = red, warning = amber
- Each badge: label + value + unit
- Tooltip or expandable row showing `reference` range
- Empty state: "No abnormal values detected" in green

4.2 Add `AbnormalityFlag` type to `frontend/lib/api/types.ts`.

4.3 Render `FlagsPanel` on:
- Doctor EHR view (`/doctor/patients/[id]/page.tsx`) — above RecordDetail
- Patient record detail (`features/records/components/record-detail.tsx`) — near top

---

## Group 5 — Spec + Roadmap Update

5.1 Update `specs/roadmap.md` — mark Abnormality flagging as `[x]`.

5.2 Fill in `specs/2026-05-13-abnormality-flagging/validation.md` post-implementation checks.
