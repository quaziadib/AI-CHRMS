## 1. Doctor navigation

- [x] 1.1 Add a **Patients** item to `NAV_DOCTOR` pointing at `/doctor/patients` (Users icon) and update `assertPatientDoctorNavExclusive` / doctor-clinical href handling so the new path is doctor-only; verify doctor nav renders four clinical destinations including Patients
- [x] 1.2 Fix sidebar active-state logic so `/doctor/patients` and `/doctor/patients/*` highlight Patients (not Doctor Dashboard); verify with path checks or UI

## 2. Patients list page

- [x] 2.1 Create `/doctor/patients` page that loads accessible patients via existing `useDoctorPatients` / doctor API, shows risk filter + summary info, and reuses clickable `PatientList` links to `/doctor/patients/{id}`; verify empty and non-empty states render
- [x] 2.2 Slim Doctor Dashboard (`/doctor`) to keep AccessRequests (and optional “View all patients” link) without duplicating the full patient list; verify dashboard no longer hosts the primary list UI

## 3. Validation

- [ ] 3.1 Smoke as doctor: open Patients tab → see list → click a patient → land on detail with back navigation working
- [x] 3.2 Smoke as patient (or other non-doctor): hit `/doctor/patients` and confirm redirect to role home with no list leakage
- [x] 3.3 Confirm Messages and Profile still appear for doctor and that patient nav remains without a Patients tab
