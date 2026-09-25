## Why

Patient and doctor already use different sidebar link lists, but they share the same unlabeled shell, so the clinical workspace does not feel distinct from personal health. Clearer, role-dedicated nav makes everyday use less confusing—especially after signup role approval lands users on doctor access.

## What Changes

- Treat patient and doctor as separate **workspaces** with dedicated primary navigation (not a mixed or admin-style mega-menu).
- Label the dashboard sidebar by workspace (e.g. Patient vs Doctor) so the active role context is obvious on every screen.
- Keep doctor nav clinical-only (dashboard, messages, profile); keep patient nav personal-health-only (dashboard, health form, records, messages, profile).
- Preserve existing route guards: wrong-role URLs still redirect to that role’s home.
- Light visual differentiation of the sidebar chrome for doctor vs patient (icon/title/badge)—same layout pattern, clearer identity.

## Non-goals

- No dual-role “mode switcher” (doctor ↔ personal patient) in this change; approved doctors remain doctor-primary as today.
- No changes to admin or national_admin nav IA beyond not regressing them.
- No backend API or JWT role-model changes.
- No redesign of doctor EHR pages or messaging beyond nav chrome.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `role-navigation`: Require distinct, labeled patient vs doctor primary navigation workspaces so each role’s nav is dedicated and user-friendly—not a shared unlabeled link list.

## Impact

- Frontend: `frontend/app/(dashboard)/layout.tsx` (nav lists, sidebar header/label, optional role badge).
- Specs: `openspec/specs/role-navigation` delta.
- Backend: none expected.
- Phase: Phase 2 UX polish on existing role navigation; stakeholder need is clinician vs patient clarity after elevated-role signup.
