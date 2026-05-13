# Requirements — Doctor UI + Role-Gated Nav

## What We're Building

Doctor role dashboard (assigned patient list, read-only EHR view, risk-flag filtering) and distinct role-aware navigation for all four user roles. Admin assigns patients to doctors via the existing admin panel.

---

## Context: What Already Exists

- All four roles exist in the DB (`is_admin`, `role` field on `User` model) and are seeded
- Role-based FastAPI deps (`require_admin`, `get_current_user`) are in `api/v1/deps.py`
- Admin dashboard exists at `app/(dashboard)/admin/` with users-tab and records-tab
- Patient dashboard, health-form, records pages exist
- `PatientRecord` model has no `doctor_id` FK yet
- Nav is currently a single layout shared across all authed roles

---

## Scope

### In Scope

**Doctor UI**
- Doctor dashboard at `/doctor` — lists assigned patients, sortable/filterable by risk level
- Patient row shows: name, risk badge (Low/Moderate/High), last record date, HbA1c value
- Clicking a patient opens read-only EHR view (`/doctor/patients/[id]`) — full record detail, all fields visible, no edit capability
- Doctor cannot edit records or change risk scores
- Doctor sees only patients assigned to them (enforced server-side)

**Admin: Doctor Assignment**
- Add `doctor_id: UUID | null` FK on `PatientRecord` (nullable — unassigned is valid)
- Admin users-tab: assign/unassign a doctor to each patient record via dropdown in existing records-tab
- Seed: leave `doctor_id = null` for all existing records by default

**Role-Gated Nav**
- `patient` role: current nav (Dashboard, Health Form, Records, Profile)
- `doctor` role: nav shows Doctor Dashboard, Profile — no access to own health form
- `national_admin` role: nav shows National Dashboard (placeholder page), Profile
- `maintainer` / `is_admin=True`: nav shows Admin Dashboard, Users, Records, Audit Logs, Profile
- Redirect logic: authenticated user hitting wrong role's route → redirect to their home

### Out of Scope

- Doctor editing records (Phase 2)
- Doctor writing clinical notes (Phase 2)
- EHR summarization / LLM clinical insights (Phase 2)
- Abnormality flagging (Phase 2)
- National admin analytics / Bangladesh map (Phase 3)
- Chatbot (deferred to separate branch)
- Doctor registration flow — doctors are created by admin (user management already exists)

---

## Key Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Doctor-patient assignment | Admin assigns `doctor_id` on record | Matches existing admin panel pattern; no complex claiming UI needed for MVP |
| Assignment granularity | Per-record (not per-patient) | Records are the primary data unit; a patient may have records from different clinics |
| Doctor dashboard data source | `GET /v1/doctor/patients` — returns records where `doctor_id = current_user.id` | Enforced server-side; doctor cannot fetch others' records |
| Nav role detection | `useAuth()` `user.role` → conditional render in layout | Role already in JWT payload; no extra API call |
| National admin page | Placeholder with "Coming in Phase 3" | Role-gated nav required; content is Phase 3 scope |
| Read-only EHR | Reuse existing `RecordDetail` component, strip edit actions | Don't duplicate; conditional prop `readOnly` |

---

## Data Model Changes

### `PatientRecord` (SQLAlchemy)

```python
doctor_id: Mapped[uuid.UUID | None] = mapped_column(
    UUID(as_uuid=True),
    ForeignKey("users.id", ondelete="SET NULL"),
    nullable=True,
    index=True,
)
doctor: Mapped["User | None"] = relationship("User", foreign_keys=[doctor_id])
```

Migration: `ALTER TABLE patient_records ADD COLUMN doctor_id UUID REFERENCES users(id) ON DELETE SET NULL;`

### New API routes

```
GET  /v1/doctor/patients               # list assigned patients (doctor only)
GET  /v1/doctor/patients/{record_id}   # read-only record detail (doctor only)
PATCH /v1/admin/records/{id}/assign-doctor  # set doctor_id (admin only)
```

---

## Role Definitions (clarified)

| `role` value | `is_admin` | Access |
|---|---|---|
| `patient` | false | Own health data only |
| `doctor` | false | Assigned patients' records (read-only) |
| `national_admin` | false | Phase 3 aggregate data (placeholder now) |
| `maintainer` | true | Full admin panel (existing) |

---

## Constraints (from mission.md + tech-stack.md)

- Doctor endpoints enforce ownership at the FastAPI dep level — never return records not assigned to requesting doctor
- No PII exposed in audit logs beyond what already exists
- Reuse `lib/api/` client — no raw fetch
- Reuse `RecordDetail` component with `readOnly` prop — no duplicate EHR view
- Nav changes must not break existing patient or admin flows
