## 1. Nav helper clarity

- [x] 1.1 Confirm `NAV_PATIENT` and `NAV_DOCTOR` in `frontend/app/(dashboard)/layout.tsx` remain mutually exclusive (no health-form/records/dashboard on doctor; no doctor dashboard on patient) and document any accidental overlap as a fix in the same file
- [x] 1.2 Add a small `getWorkspaceMeta(roles)` (or inline equivalent) returning workspace label + header icon using the same precedence as `getNavItems`, and verify TypeScript compiles for the helper

## 2. Sidebar workspace chrome

- [x] 2.1 Update the dashboard sidebar header to show the product name plus the active workspace label (Patient / Doctor / National / Admin) and role-appropriate icon; verify patient login shows "Patient" and doctor login shows "Doctor"
- [x] 2.2 Ensure pending elevated-role users (effective `roles` still patient-only) render the Patient workspace label and patient links; verify by inspecting nav with a pending `requested_role` user in UI or via mocked auth state

## 3. Guard regression check

- [ ] 3.1 Smoke patient: open `/dashboard`, confirm patient links only, then hit `/doctor` and confirm redirect to patient home
- [ ] 3.2 Smoke doctor: open `/doctor`, confirm doctor links only (no Health Form / My Records), then hit `/health-form` or `/records` and confirm redirect to doctor home
- [ ] 3.3 Smoke admin and national_admin briefly to confirm their nav/labels still resolve and are not broken by the patient/doctor chrome change
