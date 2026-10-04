## Why

The signup page is a single `max-w-md` card with 7 stacked fields, growing to 13 when "Doctor" is chosen. Role, which decides the whole form, is a plain dropdown buried mid-form, and the approval caveat is hidden in option text. The doctor fieldset is a card inside a card. Result: a cramped, long form that hides the key decision (Phase 2 role-based onboarding; stakeholders: patients registering, doctors requesting access, admins reviewing requests).

## What Changes

- Role chosen first, as a keyboard-accessible radio-card group. Patient is the default and primary; Doctor, National Admin, Admin are shown as approval-required options with a visible badge and one-line description.
- Wider container that adapts to role: compact for patient, wider for doctor.
- Short fields in a two-column grid at `md+` (name/phone, password/confirm, division/district, specialization/affiliations); single column on mobile.
- Doctor details become a labelled section (not a bordered box) that animates in, with a dropzone-style ID picture control showing file name, size limit and the "only shown to admins" privacy note.
- Fields grouped under headings (Account, Role, Doctor details).
- Accessibility: radiogroup semantics, `aria-describedby` linking errors and hints to inputs, visible focus, approval state not conveyed by colour alone.
- Pending-role explanation shown on the form before submit (not only a post-submit toast).
- No change to validation (`registerSchema`), the `registerUser()` payload, the FileReader base64 upload, or backend.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `role-registration`: signup role selection and doctor-details entry gain presentation requirements (role choice visible first, approval requirement shown before submit, accessible grouping/errors). Underlying role semantics unchanged.

## Impact

- `frontend/app/(auth)/register/page.tsx` (rewrite of layout/JSX only).
- Possibly small new presentational components under `frontend/features/auth/` (role card group, file dropzone) and a minor extension of `components/ui/form-field.tsx` for `aria-describedby`.
- No API, DB, dependency, or backend changes.

## Non-goals

- Multi-step wizard.
- Removing or invite-gating admin/national_admin from public signup (product/security decision; needs backend agreement; tracked as an open question).
- Changing ID picture storage (base64 in JSON, 1 MB cap); presigned upload is a future production hardening.
- Login/forgot-password redesign, dark-mode rework, i18n/Bangla copy.

## Assumptions

- Layout: wider centered card rather than a split-screen brand panel (earlier open question, unanswered). Brand panel can be added later without form changes.
- All four roles remain publicly selectable, matching the existing `role-registration` spec.
