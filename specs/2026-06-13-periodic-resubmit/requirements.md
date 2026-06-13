# Requirements — Periodic Health Assessment Resubmit

## What We're Building

Patients submit a new health assessment every **N months** (admin-configurable, default 6). Each submission creates a **new** `PatientRecord` — prior submissions are retained for longitudinal trends. The UI shows resubmit eligibility, due dates, and multi-submission charts on the dashboard.

---

## Context: What Already Exists

- Single-record model: one `PatientRecord` per patient with create/update flow
- Health form at `/health-form` with 8-step wizard + risk scoring
- Patient dashboard and records list showing latest assessment
- Admin dashboard with user/record management

This feature replaces the implicit “one record per patient” assumption with **periodic re-assessment** while preserving full history.

---

## Scope

### In Scope

- **`system_settings` table** — singleton row (`id=1`) storing `resubmit_interval_months` (1–36)
- **Admin API** — `GET/PATCH /v1/admin/settings` to read/update interval
- **Resubmit status API** — `GET /v1/records/resubmit-status` for patient eligibility
- **Health trends API** — `GET /v1/records/history/trends` returning all submissions ascending by date
- **Backend enforcement** — `POST /v1/records` returns **400** when resubmit is not due (except first submission)
- **Multi-record retention** — no deletion of prior records; latest drives due-date calculation
- **Frontend: ResubmitBanner** — states: `initial`, `current`, `upcoming` (≤14 days), `due`
- **Frontend: HealthHistoryCharts** — Recharts for glucose, BMI, BP, risk across submissions
- **Frontend: Admin Settings tab** — interval picker (1–36 months)
- **Frontend: Health form gate** — blocks new submission when `can_submit_new=false`
- **Seed** — `RESUBMIT_INTERVAL_MONTHS_DEFAULT=6` on first startup

### Out of Scope

- Email/push reminders before due date
- Per-user interval overrides (global setting only)
- Automatic archival or deletion of old records
- Doctor-initiated resubmit on behalf of patient
- National-level resubmit policy analytics (Phase 3)

---

## Key Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Interval storage | DB singleton `SystemSetting` | Admin can change without redeploy |
| Default interval | 6 months | Clinical follow-up cadence for chronic care |
| Due calculation | `latest.created_at + interval_months` | Simple calendar-month addition |
| `can_submit_new` | `true` only when due or zero submissions | Prevents duplicate assessments within window |
| Status `upcoming` | ≤14 days before due | Gives patient advance notice in banner |
| New record on resubmit | Always `POST /records` (create) | Clean audit trail; each submission has own risk score |
| Doctor assignment | Copy `doctor_id` from previous record | Maintains care continuity |
| Trends endpoint | All user records, ascending | Dashboard charts need full history |

---

## API Contract

```
GET /v1/records/resubmit-status
Authorization: Bearer <patient token>
Response: {
  interval_months: int,
  latest_submission_at: datetime | null,
  next_due_at: datetime | null,
  is_due: bool,
  days_until_due: int | null,
  submission_count: int,
  can_submit_new: bool,
  status: "initial" | "current" | "upcoming" | "due"
}

GET /v1/records/history/trends
Authorization: Bearer <patient token>
Response: {
  submissions: [{
    record_id, pid, submitted_at,
    blood_glucose, bmi, bp_systolic, bp_diastolic,
    risk_level, risk_score  // 1=low, 2=moderate, 3=high
  }]
}

GET /v1/admin/settings
Authorization: Bearer <admin token>
Response: { resubmit_interval_months, updated_at, updated_by }

PATCH /v1/admin/settings
Request: { resubmit_interval_months: int (1–36) }
Response: updated settings

POST /v1/records
→ 400 { detail: "..." } when can_submit_new=false
```

---

## Data Model

```python
class SystemSetting(Base):
    id: int = 1  # singleton
    resubmit_interval_months: int  # 1–36
    updated_at: datetime
    updated_by: UUID | null  # admin user id
```

No change to `PatientRecord` schema — multiple rows per `user_id` are now valid.

---

## Constraints

- Interval change applies globally to all patients immediately
- Existing patients with old submissions: due date recalculated from latest submission + new interval
- Audit log: settings changes should be traceable via `updated_by` / `updated_at`
- Frontend must not rely solely on client-side gating — backend enforces on create
