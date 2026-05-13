# Validation — Doctor UI + Role-Gated Nav

How to know the implementation is correct and ready to merge.

---

## Doctor Dashboard: Assigned Patients

- [ ] Doctor logs in → lands on `/doctor` → sees only patients assigned to them (not all records)
- [ ] Risk filter: selecting "High" shows only high-risk assigned patients; "All" restores full list
- [ ] Each row shows: patient name, risk badge (color-coded Low/Moderate/High), last record date, HbA1c value
- [ ] Empty state: doctor with no assigned patients sees a clear "No patients assigned" message (not a blank screen or error)
- [ ] Doctor with 1+ assigned patients: list loads without error, SWR revalidates on focus

---

## Read-Only EHR View

- [ ] Doctor clicks "View EHR" on a patient row → navigates to `/doctor/patients/{id}`
- [ ] Full health record fields are visible (all 8-step form data, risk score, recommendations)
- [ ] Edit and Delete buttons are absent — only read-only banner visible
- [ ] Doctor attempting `PATCH /v1/records/{id}` directly (e.g., via curl) → 403 Forbidden
- [ ] Doctor attempting `GET /v1/doctor/patients/{id}` for a record NOT assigned to them → 404 (not 403, to not leak existence)

---

## Admin Doctor Assignment

- [ ] Admin opens records-tab → each record row has "Assign Doctor" control
- [ ] Dropdown lists only users with `role == "doctor"` (not all users)
- [ ] Selecting a doctor and confirming → record updates, assigned doctor name shows immediately
- [ ] Setting to "Unassigned" clears `doctor_id` → record disappears from that doctor's dashboard
- [ ] Audit log: `SELECT * FROM audit_logs WHERE action = 'doctor_assigned'` returns one row per assignment
- [ ] `doctor_id` in DB is a valid UUID referencing a real doctor user, or NULL

---

## Role-Gated Nav

- [ ] Patient user: sees Dashboard, Health Form, Records, Profile — no Doctor or Admin nav items
- [ ] Doctor user: sees Doctor Dashboard, Profile — no Health Form, Records, Admin items
- [ ] National admin user: sees National Dashboard (placeholder), Profile — no other nav items
- [ ] Maintainer/admin user: sees existing Admin nav (Dashboard, Users, Records, Audit Logs, Profile) — unchanged
- [ ] Patient navigating to `/doctor` manually → redirected to `/dashboard`
- [ ] Doctor navigating to `/admin` manually → redirected to `/doctor`
- [ ] National admin navigating to `/dashboard` → redirected to `/national`
- [ ] Unauthenticated user hitting any protected route → redirected to `/login` (existing behavior, must still work)

---

## National Admin Placeholder

- [ ] National admin user sees `/national` page with a clear "Coming in Phase 3" message
- [ ] Page renders without errors, no broken imports or missing components

---

## Auth: Role in Token/Context

- [ ] `GET /v1/auth/me` response includes `role` field
- [ ] JWT token payload includes `role` claim (verify via jwt.io decode)
- [ ] `useAuth()` `user.role` is populated after login — no extra fetch needed to get role
- [ ] Changing a user's role in DB → user must re-login to get updated role (no stale role from old token — expected behavior, document if needed)

---

## Data Integrity

- [ ] `patient_records.doctor_id` is nullable UUID — `NULL` is valid and common
- [ ] Deleting a doctor user: `doctor_id` on their records SET NULL (ON DELETE SET NULL), records remain
- [ ] `PatientRecordResponse` includes `doctor_id: UUID | null` in API response

---

## Non-Regression

- [ ] Patient health form submit → risk score → recommendations → all still work (unchanged flow)
- [ ] Admin existing features (user list, record list, audit log) unchanged
- [ ] `npm run build` — zero TypeScript errors
- [ ] `npm run lint` — zero ESLint errors

---

## Merge Criteria

All role-gated nav checks pass (tested as each of the 4 role types). Doctor dashboard loads assigned patients and read-only EHR works. Admin can assign/unassign doctor and audit row appears. National admin placeholder renders. No regression in patient or admin flows. Build and lint clean.
