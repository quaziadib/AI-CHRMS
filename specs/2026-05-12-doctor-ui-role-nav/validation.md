# Validation — Doctor UI + Role-Gated Nav

How to know the implementation is correct and ready to merge.

---

## Doctor Dashboard: Assigned Patients

- [x] Doctor logs in → lands on `/doctor` → sees only patients assigned to them (not all records)
- [x] Risk filter: selecting "High" shows only high-risk assigned patients; "All" restores full list
- [x] Each row shows: patient name, risk badge (color-coded Low/Moderate/High), last record date, HbA1c value
- [x] Empty state: doctor with no assigned patients sees a clear "No patients assigned" message (not a blank screen or error)
- [x] Doctor with 1+ assigned patients: list loads without error, SWR revalidates on focus

---

## Read-Only EHR View

- [x] Doctor clicks "View EHR" on a patient row → navigates to `/doctor/patients/{id}`
- [x] Full health record fields are visible (all 8-step form data, risk score, recommendations)
- [x] Edit and Delete buttons are absent — only read-only banner visible
- [x] Doctor attempting `PATCH /v1/records/{id}` directly (e.g., via curl) → 403 Forbidden
- [x] Doctor attempting `GET /v1/doctor/patients/{id}` for a record NOT assigned to them → 404 (not 403, to not leak existence)

---

## Admin Doctor Assignment

- [x] Admin opens records-tab → each record row has "Assign Doctor" control
- [x] Dropdown lists only users with `role == "doctor"` (not all users)
- [x] Selecting a doctor and confirming → record updates, assigned doctor name shows immediately
- [x] Setting to "Unassigned" clears `doctor_id` → record disappears from that doctor's dashboard
- [x] Audit log: `SELECT * FROM audit_logs WHERE action = 'doctor_assigned'` returns one row per assignment
- [x] `doctor_id` in DB is a valid UUID referencing a real doctor user, or NULL (FK constraint `fk_patient_records_doctor_id` enforces this)

---

## Role-Gated Nav

- [x] Patient user: sees Dashboard, Health Form, Records, Profile — no Doctor or Admin nav items
- [x] Doctor user: sees Doctor Dashboard, Profile — no Health Form, Records, Admin items
- [x] National admin user: sees National Dashboard (placeholder), Profile — no other nav items
- [x] Maintainer/admin user: sees existing Admin nav (Dashboard, Users, Records, Audit Logs, Profile) — unchanged
- [x] Patient navigating to `/doctor` manually → redirected to `/dashboard`
- [x] Doctor navigating to `/admin` manually → redirected to `/doctor`
- [x] National admin navigating to `/dashboard` → redirected to `/national`
- [x] Unauthenticated user hitting any protected route → redirected to `/login` (existing behavior, must still work)

---

## National Admin Placeholder

- [x] National admin user sees `/national` page with a clear "Coming in Phase 3" message
- [x] Page renders without errors, no broken imports or missing components

---

## Auth: Role in Token/Context

> **Design note:** Implementation uses `roles: string[]` (array) on the User model — supports multi-role users.
> Both `roles` (array) and `role` (primary role string) are returned from `/me` and included in the JWT.
> Frontend uses `user.roles.includes(...)` for guards and `user.role` for display.

- [x] `GET /v1/auth/me` response includes `role` field (computed from `roles` array — primary role)
- [x] JWT token payload includes `role` claim (alongside `roles` array — verify via jwt.io decode)
- [x] `useAuth()` `user.role` is populated after login — no extra fetch needed to get role
- [x] Changing a user's role in DB → user must re-login to get updated role (no stale role from old token — expected behavior)

---

## Data Integrity

- [x] `patient_records.doctor_id` is nullable UUID — `NULL` is valid and common
- [x] Deleting a doctor user: `doctor_id` on their records SET NULL (ON DELETE SET NULL enforced via `fk_patient_records_doctor_id` constraint added in `_run_migrations`)
- [x] `PatientRecordResponse` includes `doctor_id: UUID | null` in API response

---

## Non-Regression

- [x] Patient health form submit → risk score → recommendations → all still work (unchanged flow)
- [x] Admin existing features (user list, record list, audit log) unchanged
- [x] `npm run build` — zero TypeScript errors (`tsc --noEmit` clean)
- [x] `npm run lint` — zero ESLint errors (exit 0; ESLint v9 flat config, `eslint-config-next` installed)

---

## Seed Credentials (dev only)

| Role | Email | Password |
|------|-------|----------|
| admin/maintainer | `admin@health.local` | `admin123` |
| patient | `demo@health.local` | `demo123` |
| doctor | `doctor@health.local` | `doctor123` |
| national_admin | `national@health.local` | `national123` |

---

## Merge Criteria

All role-gated nav checks pass (tested as each of the 4 role types). Doctor dashboard loads assigned patients and read-only EHR works. Admin can assign/unassign doctor and audit row appears. National admin placeholder renders. No regression in patient or admin flows. Build and lint clean.
