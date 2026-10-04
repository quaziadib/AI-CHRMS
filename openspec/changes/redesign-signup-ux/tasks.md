## 1. Shared UI primitives (frontend)

- [x] 1.1 Add `frontend/components/ui/radio-group.tsx` (shadcn/Radix style, `@radix-ui/react-radio-group` already installed) and verify `npm run lint` passes
- [x] 1.2 Extend `components/ui/form-field.tsx` `FieldWrapper` to link error/hint text to the input via `aria-describedby` without breaking existing callers; verify `npx tsc --noEmit` passes and existing users of `FieldWrapper` still compile
- [x] 1.3 Add a small `PasswordInput` (show/hide toggle) in `features/auth/` and verify it toggles type and keeps `aria-label` text

## 2. Signup feature components (frontend)

- [x] 2.1 Create `features/auth/role-selector.tsx`: patient primary card plus approval-required group with text badges; verify arrow-key selection and announced selection in the browser
- [x] 2.2 Create `features/auth/id-pic-dropzone.tsx` keeping the 1 MB / `image/*` checks and FileReader base64 logic; verify oversize and non-image files show the error toast and valid files show name with a remove action
- [x] 2.3 Create `features/auth/doctor-details-section.tsx` with the 2-col grid, Division select and dropzone; verify required-field errors appear inline for each doctor field

## 3. Page assembly (frontend)

- [x] 3.1 Rewrite `app/(auth)/register/page.tsx` JSX: role-first, grouped sections (Account, Role, Doctor details), 2-col grid at `md+`, role-driven width; keep `registerSchema`, `defaultValues`, and `onSubmit` payload unchanged; verify diff shows no change to schema/payload code
- [x] 3.2 Show pending-approval explanation inline when an elevated role is selected; clear `id_pic` state when leaving doctor; verify switching doctor to patient submits no `doctor_profile`

## 4. Validation

- [x] 4.1 Run `npm run lint`, `npx tsc --noEmit` and `npm run build` in `frontend/` and verify all pass
- [x] 4.2 Browser check at 320 px, 768 px and 1280 px for patient and doctor: no horizontal scroll, no layout jump, tab order correct; save screenshots under `.context/`
- [ ] 4.3 End-to-end: register as patient and as doctor against local backend; verify patient lands on its home and doctor sees the pending toast and `/dashboard`
- [x] 4.4 Run `openspec validate redesign-signup-ux --strict` and verify it passes
