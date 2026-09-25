## Why

Doctors currently find their patient list only on the Doctor Dashboard, mixed with access requests and other chrome. A dedicated **Patients** nav tab makes browsing and opening a specific patient faster and clearer (Phase 2 clinical UX).

## What Changes

- Add a primary doctor nav destination **Patients** (separate from Doctor Dashboard).
- Patients tab shows a list of that doctor’s accessible patients with key summary info (name, risk, last record, vitals as available).
- Each list row is a clickable link to the existing patient detail/EHR explore page (`/doctor/patients/{id}`).
- Keep access scoped to patients the doctor may already view (active share/grant)—not a system-wide patient directory.
- Optionally slim the Doctor Dashboard so the full list primarily lives on the Patients tab (dashboard may keep a short summary or deep-link).

## Non-goals

- No directory of all patients in the database without an access relationship.
- No new clinical edit capabilities (read-only EHR remains).
- No changes to patient, admin, or national primary nav beyond not regressing them.
- No messaging redesign.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `role-navigation`: Doctor primary nav includes a dedicated Patients destination; patient list + click-through explore is a first-class nav tab, not only embedded on the dashboard.

## Impact

- Frontend: `NAV_DOCTOR` / dashboard-nav, new or relocated `/doctor/patients` list page, reuse of `PatientList` + `useDoctorPatients`.
- Backend: reuse existing `GET /v1/doctor/patients` and patient profile routes (no API change expected).
- Specs: `openspec/specs/role-navigation`.
- Phase: Phase 2 clinician workflow clarity.
