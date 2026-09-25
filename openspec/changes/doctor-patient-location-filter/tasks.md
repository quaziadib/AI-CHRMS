## 1. Backend API

- [x] 1.1 Extend `GET /v1/doctor/patients` and `list_doctor_profiles` to accept optional `district` (exact match on latest record district) and apply it with existing `risk_level` as AND; verify filtered SQL/list results for matching and non-matching districts
- [x] 1.2 Confirm patients without a latest record or without district are excluded when `district` is set, and still appear when no location filter is set; verify with a quick API or unit assertion

## 2. Frontend Patients filters

- [x] 2.1 Extend `doctorApi.getPatients` and `useDoctorPatients` to pass `district` (and keep `risk_level`); verify the request query string includes both when set
- [x] 2.2 Add a district location control on `/doctor/patients` (options derived from accessible patients’ latest districts) beside the risk filter, including clear/all; verify selecting a district updates the list and clearing restores the broader set
- [x] 2.3 Ensure empty filtered state copy remains clear and rows still link to `/doctor/patients/{id}`; verify click-through after filtering

## 3. Validation

- [ ] 3.1 Smoke as doctor: filter by district only, risk only, both, and clear; confirm no patients outside active grants appear
- [x] 3.2 Confirm non-doctor cannot use the patients list API/UI (existing 403/redirect still holds)
