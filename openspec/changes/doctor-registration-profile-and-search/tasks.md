## 1. Backend data model

- [x] 1.1 Add `DoctorProfile` model (`models/doctor_profile.py`, register in `models/__init__.py`) with 1:1 FK to users, cascade delete, indexes; verify table created on startup against local Postgres
- [x] 1.2 Add idempotent backfill with random placeholder values to `_run_migrations`; verify with pytest that running twice yields one profile per doctor and patients get none

## 2. Registration

- [x] 2.1 Extend `UserCreate` with `doctor_profile` schema and validator (required iff doctor, forbidden otherwise, `id_pic` size cap); verify unit tests for all four combinations
- [x] 2.2 Update `register_user` to create user + profile in one transaction; verify tests extend `test_signup_role_approval.py` (profile stored, none for patient, rollback on failure)
- [x] 2.3 Include `doctor_profile` in admin role-request list response; verify admin test and 403 for non-admin

## 3. Doctor search API

- [x] 3.1 Implement search service (q, search_by, filters, pagination, escaping, active+approved doctors only); verify tests per scenario in spec
- [x] 3.2 Update `GET /v1/sharing/doctors` and add `GET /v1/sharing/doctors/filters`; verify patient-only access and 422 on invalid `search_by`

## 4. Frontend

- [x] 4.1 Add conditional doctor fields (specialization, affiliations, division, district, location, ID pic) to register form with Zod conditional validation; verify manually switching roles shows/hides fields and submit payload is correct
- [x] 4.2 Show doctor profile in `role-requests-tab.tsx`; verify visually with a pending doctor
- [x] 4.3 Update `lib/api` sharing types and client for new search params/response; verify `npm run build` type-checks
- [x] 4.4 Rebuild `patient-sharing-panel.tsx` doctor picker: search box (debounced), search-by select, specialization/division/district filters, result list with summary and empty state; verify in browser all filters and grant flow still works

## 5. Validation

- [x] 5.1 Run `pytest` in `backend/` and `npm run lint && npm run build` in `frontend/`; all pass
- [x] 5.2 End-to-end manual: register doctor → admin approves → patient searches and grants → doctor accepts
