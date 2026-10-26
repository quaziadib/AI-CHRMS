## 1. Backend — restrict public signup

- [x] 1.1 In `backend/app/schemas/user.py` add `PublicSignupRole = Literal["user", "doctor"]`, use it for `UserCreate.role`; keep `SignupRole`/`ELEVATED_SIGNUP_ROLES`/`roles_for_approved_signup` unchanged. Verify `UserCreate(role="admin", ...)` raises a validation error and `role="doctor"` with profile still validates.
- [x] 1.2 Update `backend/tests/test_signup_role_approval.py`: change `test_user_create_accepts_elevated_roles` to doctor only, add parametrized test that `national_admin` and `admin` are rejected at signup, keep `test_roles_for_approved_signup` and approve/reject dep tests green. Verify with `pytest tests/test_signup_role_approval.py`.
- [x] 1.3 Add a DB-backed test (pattern from `test_doctor_profile_db.py`) that a user seeded with `requested_role="national_admin", role_request_status="pending"` can still be approved via `services/admin.approve_role_request` and ends with `roles == ["national_admin"]`. Verify with pytest.

## 2. Backend — admin user provisioning

- [x] 2.1 Add `AdminUserCreate` schema in `schemas/user.py` (email normalised, password min 8, full_name 2–255, phone optional, `role: SignupRole`, `doctor_profile` optional with the same doctor/non-doctor cross-validation as `UserCreate`). Verify with unit tests: doctor without profile → error, patient with profile → error, valid admin payload → ok.
- [x] 2.2 Implement `services/admin.create_user(db, admin_id, data) -> UserResponse`: duplicate email → 400 "Email already registered"; roles from `roles_for_approved_signup`; `is_active=True`, `is_verified=True`, no pending fields; attach `DoctorProfile` for doctor; `log_audit(db, admin_id, "admin_user_created", "user", new_id)`. Verify with DB test asserting roles, flags, profile row and audit row.
- [x] 2.3 Add `POST /v1/admin/users` (201, `response_model=UserResponse`, `AdminUser` dep) in `api/v1/admin.py`. Verify: admin → 201; doctor/patient token → 403; no token → 401; duplicate → 400; login with the new credentials returns a token whose roles include the granted role.
- [x] 2.4 Confirm `GET /v1/doctors` (patient doctor search) lists an admin-created doctor. Verify with existing doctor search test extended by one case.

## 3. Backend — prescription PDF speed

- [x] 3.1 Add timing/diagnostic logs in `generate_prescription_pdf` and the route: import ms, render ms, bytes, cache hit/miss. Deploy or run locally in the Render image (`docker build -f deploy/render/Dockerfile .`) and record baseline cold and warm timings in the PR description. Verify log lines appear on a download.
- [x] 3.2 Move Jinja `Environment` creation to module level; add `warm_pdf_renderer()` (import WeasyPrint, render `<p>warm</p>`, log duration, swallow and log exceptions). Verify unit test calls it and it returns without raising even if WeasyPrint is unavailable (monkeypatch import failure).
- [x] 3.3 Start `warm_pdf_renderer` in a daemon thread from the `main.py` lifespan after seeding. Verify `/health` responds before the thread finishes (test with a patched slow warm-up) and app startup logs show the warm-up duration.
- [x] 3.4 Add `fc-cache -f` after font install in `backend/Dockerfile` and `deploy/render/Dockerfile`. Verify `docker run <img> fc-list | head` returns instantly and the first render log shows no multi-second font scan.
- [x] 3.5 Add an in-process bounded cache (OrderedDict + lock, max 64) keyed by `(prescription_id, updated_at)` in `services/prescription.py`; `generate_prescription_pdf` checks it before rendering and stores after. Verify tests: second call with same key does not invoke renderer (mock), changed `updated_at` re-renders, cache evicts beyond 64.
- [x] 3.6 Change the route to return `Response(content=bytes, media_type="application/pdf")` with `Content-Length` and the existing `Content-Disposition`. Verify `test_prescriptions.py` asserts both headers and that `prescription_viewed` audit is still written on a cache hit.
- [x] 3.7 Re-measure on the Render image after 3.2–3.6: warm download ≤ 2 s at the API, first download after process start does not log a WeasyPrint import. Record numbers in the PR. Verify against the baseline from 3.1.

## 4. Frontend — signup page

- [x] 4.1 In `features/auth/role-selector.tsx` remove the national_admin and admin options, narrow `SignupRole` to `'user' | 'doctor'`, render the single doctor card full-width with the "Approval required" badge kept, and update the helper copy. Verify page renders only two cards.
- [x] 4.2 In `app/(auth)/register/page.tsx` narrow the Zod `role` enum and `ROLE_LABELS`; update `CardDescription` copy ("Start as a patient, or request a doctor account…"). Narrow the `role` type in `lib/api/auth.ts`. Verify `npm run lint` and `npx tsc --noEmit` pass with no references to the removed roles in signup code.
- [x] 4.3 Manually verify: patient signup → dashboard; doctor signup → pending toast; direct `POST /v1/auth/register` with `role: "admin"` → 422.

## 5. Frontend — admin create user

- [x] 5.1 Add `adminApi.createUser(payload)` in `lib/api/admin.ts` typed to the new schema (`AdminUserCreate` TS type in `lib/api/types.ts`). Verify type-checks.
- [x] 5.2 Build `features/admin/components/create-user-dialog.tsx`: shadcn Dialog, react-hook-form + Zod (full name, email, phone, role select of four roles, password with hint "Share securely; ask the user to change it after first login"), `DoctorDetailsSection` shown only for doctor, inline field errors, server error banner, submit spinner. Verify dialog opens/closes, doctor fields toggle, and invalid submit shows errors without a request.
- [x] 5.3 Wire `createUser` into `features/admin/hooks/use-admin.ts` (optimistic prepend to `users`, refresh stats) and add the "Create user" button to the admin page header when the Users tab is active. Verify creating a national admin shows a success toast and the new row with the National Admin badge without reload; duplicate email keeps the dialog open with the server message.

## 6. Frontend — PDF download feedback

- [x] 6.1 In `features/prescriptions/patient-prescription-detail.tsx` add a busy state: button disabled with spinner and label "Preparing PDF…" while downloading; guard against double click with a ref. Verify clicking twice fires one request and the button re-enables on success and on error toast.

## 7. Frontend — type scale

- [x] 7.1 In `app/globals.css` `@theme inline`, add `--text-xs/sm/base/lg/xl/2xl` size and `--text-*--line-height` overrides per design.md decision 5. Verify computed font-size of a `text-base` paragraph is 17 px and `text-xs` is 13 px in DevTools; `html` stays 16 px.
- [x] 7.2 Visual QA at 320 px and 1280 px on: signup page, 8-step health form (step header + review), records list/detail, admin Users table, doctor patient page with prescription panel, national dashboard cards. Fix overflow with wrapping/truncation only. Save screenshots under `.context/` and verify no clipped or overlapping text.
- [x] 7.3 Verify prescription PDF output is byte-identical (or visually identical) before and after the CSS change by regenerating one PDF.

## 8. Validation

- [x] 8.1 Run full backend suite `cd backend && pytest` and frontend `npm run lint && npm run build`; verify all green.
- [x] 8.2 End-to-end smoke on docker compose: admin creates a doctor and a national admin → both log in and reach their role home; patient signup shows no admin options; patient downloads prescription PDF twice and second is served from cache (log shows hit). Verify by screenshots/logs recorded in the PR.
- [x] 8.3 Run `openspec validate admin-user-provisioning-pdf-speed-type-scale --strict` and verify it passes.
