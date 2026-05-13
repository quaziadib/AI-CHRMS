# Plan — Doctor UI + Role-Gated Nav

Numbered task groups in execution order. Each group is independently committable.

---

## Group 1 — DB: Add `doctor_id` to `PatientRecord`

1.1 Add `doctor_id` nullable UUID FK to `PatientRecord` model in `backend/app/models/record.py`:
```python
doctor_id: Mapped[uuid.UUID | None] = mapped_column(
    UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
)
doctor: Mapped["User | None"] = relationship("User", foreign_keys=[doctor_id], lazy="select")
```

1.2 Add Alembic migration (or rely on `create_all` in dev): `ALTER TABLE patient_records ADD COLUMN doctor_id UUID REFERENCES users(id) ON DELETE SET NULL;`

1.3 Update `PatientRecordResponse` schema (`backend/app/schemas/record.py`) — add `doctor_id: UUID | None = None`.

1.4 Update `PatientRecordUpdateRequest` — add `doctor_id: UUID | None = None` (admin-only write, validated in endpoint).

---

## Group 2 — Backend: Doctor Router

2.1 Create `backend/app/api/v1/doctor.py`:

- `GET /v1/doctor/patients` — requires `role == "doctor"` dep; returns `list[PatientRecordResponse]` where `doctor_id == current_user.id`; supports `?risk_level=low|moderate|high` filter
- `GET /v1/doctor/patients/{record_id}` — same dep; returns single record if `doctor_id == current_user.id`, else 404

2.2 Create FastAPI dep `require_doctor` in `backend/app/api/v1/deps.py`:
```python
def require_doctor(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "doctor":
        raise HTTPException(403)
    return current_user
```

2.3 Register `doctor.router` in `backend/app/api/v1/router.py`.

---

## Group 3 — Backend: Admin Assignment Endpoint

3.1 Add `PATCH /v1/admin/records/{record_id}/assign-doctor` to `backend/app/api/v1/admin.py`:
- Requires `require_admin` dep (already exists)
- Body: `{ "doctor_id": UUID | null }`
- Validates that `doctor_id` (if provided) belongs to a user with `role == "doctor"`
- Updates `PatientRecord.doctor_id`
- Logs `doctor_assigned` to audit_logs
- Returns updated `PatientRecordResponse`

3.2 Update `AdminRecordListResponse` (if exists) or `PatientRecordResponse` to include `doctor_id` and `doctor_name` (joined from `users.full_name`).

---

## Group 4 — Backend: User Role Field

4.1 Verify `User` model has `role: str` column (patient/doctor/national_admin/maintainer). If missing, add with default `"patient"`.

4.2 Ensure JWT payload includes `role` claim — update `core/security.py` `create_access_token` to embed `role`.

4.3 Update `UserResponse` schema to include `role: str`.

4.4 Update `auth.py` `/me` endpoint to return `role` in response so frontend `useAuth()` has it.

---

## Group 5 — Frontend: Role-Gated Nav

5.1 Update `frontend/app/(dashboard)/layout.tsx`:
- Read `user.role` from `useAuth()`
- Render nav items conditionally by role:
  - `patient`: Dashboard, Health Form, Records, Profile
  - `doctor`: Doctor Dashboard (`/doctor`), Profile
  - `national_admin`: National Dashboard (`/national`, placeholder), Profile
  - `is_admin / maintainer`: Admin, Users, Records, Audit Logs, Profile (existing)
- Redirect: if user hits `/doctor/*` but `role !== "doctor"` → redirect to their home

5.2 Create placeholder `frontend/app/(dashboard)/national/page.tsx` — "National Health Dashboard — Coming in Phase 3" with appropriate styling.

5.3 Update `frontend/components/auth/auth-provider.tsx` — ensure `role` is read from token or `/me` response and exposed on `user` object.

---

## Group 6 — Frontend: Doctor Dashboard

6.1 Create `frontend/app/(dashboard)/doctor/page.tsx` — server-guarded by role check in layout.

6.2 Create `frontend/features/doctor/` directory with:
- `components/patient-list.tsx` — table of assigned patients: Name, Risk badge, Last Record date, HbA1c, action "View EHR"
- `components/risk-filter.tsx` — filter bar: All / Low / Moderate / High (updates query param)
- `hooks/use-doctor-patients.ts` — SWR hook calling `GET /api/v1/doctor/patients?risk_level=...`

6.3 Wire `patient-list.tsx` into `doctor/page.tsx` with `risk-filter.tsx`.

---

## Group 7 — Frontend: Read-Only EHR View

7.1 Create `frontend/app/(dashboard)/doctor/patients/[id]/page.tsx` — fetches `GET /api/v1/doctor/patients/{id}`.

7.2 Add `readOnly?: boolean` prop to `frontend/features/records/components/record-detail.tsx`:
- When `readOnly=true`: hide Edit button, hide Delete button, show "Read-only — assigned patient record" banner

7.3 Reuse `record-detail.tsx` with `readOnly={true}` in the doctor patient page.

7.4 Add `hooks/use-doctor-patient.ts` — SWR hook for single record fetch as doctor.

---

## Group 8 — Frontend: Admin Doctor Assignment UI

8.1 Update `frontend/features/admin/components/records-tab.tsx`:
- Add "Assign Doctor" column/action per record row
- Dropdown populated from `GET /api/v1/admin/users?role=doctor` (new or existing endpoint)
- On select, calls `PATCH /api/v1/admin/records/{id}/assign-doctor`
- Show current assigned doctor name (or "Unassigned")

8.2 Ensure admin users-tab shows `role` badge per user (patient / doctor / national_admin / maintainer).

---

## Group 9 — Smoke Test & Roadmap Update

9.1 Manual walkthrough: admin assigns a doctor to a patient record → doctor logs in → sees patient in list → opens EHR → cannot edit.

9.2 Test role nav isolation: patient cannot reach `/doctor`, doctor cannot reach `/admin`, national_admin sees placeholder.

9.3 Verify audit log: `doctor_assigned` action row appears after admin assignment.

9.4 `npm run build` + `npm run lint` — zero errors.

9.5 Update `specs/roadmap.md` — mark Doctor role UI and Role-gated nav deliverables as `[x]`.
