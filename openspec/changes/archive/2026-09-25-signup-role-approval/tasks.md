## 1. Data model and migration

- [x] 1.1 Add `requested_role` and `role_request_status` columns on `User` (ORM + `ADD COLUMN IF NOT EXISTS` in startup migrations) and verify app starts against a fresh/existing Postgres without error
- [x] 1.2 Extend `UserResponse` (and any admin list DTOs) with pending-request fields and verify OpenAPI/`/v1/auth/me` includes them for a seeded user

## 2. Backend registration and auth

- [x] 2.1 Extend `UserCreate` with optional/required `role` enum (`user` | `doctor` | `national_admin` | `admin`); reject invalid values with 422 and verify with a unit or API test
- [x] 2.2 Update `register_user` so patient signup sets `roles=["user"]` with no pending status; elevated signup sets pending fields and keeps `roles=["user"]`; verify register responses and DB rows for both paths
- [x] 2.3 Ensure JWT/`login_user` continue to use effective `roles` only; verify a pending-doctor token cannot pass doctor deps (403)
- [x] 2.4 Add audit actions for register-with-role, approve, and reject; verify rows appear in `audit_logs`

## 3. Backend admin approval APIs

- [x] 3.1 Add `GET /v1/admin/role-requests` (filter pending) and verify admin-only access (403 for non-admin)
- [x] 3.2 Add approve endpoint that applies elevated `roles`, clears pending, audits; verify subsequent login roles and doctor/national/admin access
- [x] 3.3 Add reject endpoint that clears pending, keeps patient roles, audits; verify user remains patient-only

## 4. Frontend signup

- [x] 4.1 Add role selector to register form + API client payload; verify UI validation and successful patient register still lands on patient home
- [x] 4.2 On elevated-role register success, show pending-approval message and route as patient (not elevated home); verify toast/banner copy
- [x] 4.3 Surface `requested_role` / pending status on profile or dashboard banner when pending; verify it disappears after approval + refresh

## 5. Frontend admin

- [x] 5.1 Add pending role-requests list (or Users tab filter) with Approve/Reject actions wired to new APIs; verify list updates after each action
- [x] 5.2 Confirm existing manual role dropdown still works for users without a pending request; verify no regression on activate/deactivate

## 6. Validation

- [x] 6.1 Add backend tests covering patient auto-approve, pending elevated register, approve, reject, and non-admin 403; run `pytest` for the new module and confirm pass
- [ ] 6.2 Manual smoke: register as doctor → login as patient nav → admin approve → re-login → doctor home; reject path stays patient
