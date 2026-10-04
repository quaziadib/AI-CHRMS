## Why

Prescription PDF download returns HTTP 500 in production (Render), blocking patients from the core deliverable of the Advices & Prescriptions feature. The doctor prescription screens are hard to use, the doctor patient profile has no way to view or write a prescription in context, and two sections (Medication history, Doctor interactions) add clutter. Phase 2 clinician workflow polish.

## What Changes

- **Fix PDF 500**: the single-container Render image (`deploy/render/Dockerfile`) installs no pango/cairo/gdk-pixbuf/fonts, so the PDF renderer fails at import/render time. Add the system libraries; make PDF endpoint return a clean, logged error instead of a bare 500 if rendering still fails.
- **Remove sections from UI** everywhere: "Medication history" and "Doctor interactions" cards on the doctor patient profile (`/doctor/patients/[id]`), and "Doctor interactions" card on the patient "Doctor access" page. UI-only removal; stored data, backend endpoints, and audit trail are untouched.
- **Redesign `/doctor/prescriptions`** (list, patient picker, compose, detail/edit flows) for clarity: scannable patient/prescription lists with search and status, clear primary actions, consistent layout, empty/loading/error states. Uses the frontend-design skill during apply.
- **Prescription side panel on patient profile** (`/doctor/patients/[id]`): a "View prescription" button (shown only when the patient has a visible prescription) and a "Write prescription" action open a right-side panel. When open, the profile content reflows into a narrower column layout so the panel does not overlay it.

## Capabilities

### New Capabilities
- `prescription-pdf-export`: reliable PDF download of a published prescription, with deploy-environment requirements and graceful failure.
- `doctor-patient-prescription-panel`: in-context prescription view/compose panel on the doctor's patient profile.

### Modified Capabilities
- `patient-doctor-sharing`: doctor patient profile and patient Doctor-access page no longer display medication history or doctor interactions.

## Impact

- Backend: `deploy/render/Dockerfile`, `backend/app/api/v1/prescriptions.py`, `backend/app/services/prescription.py` (error handling/logging).
- Frontend: `app/(dashboard)/doctor/patients/[id]/page.tsx`, `features/sharing/components/patient-sharing-panel.tsx`, `app/(dashboard)/doctor/prescriptions/**`, `features/prescriptions/**`.
- Deploy: Render image rebuild required (larger image from apt packages).

## Non-goals

- Deleting interaction/medication data, tables, API endpoints, or audit logs.
- Changing the prescription data model or patient-side prescription pages.
- New PDF layout/branding.
- Mobile-native or print stylesheet work.

## Assumptions

- "Remove everywhere" means UI removal only; backend data stays (append-only, audit-safe). Reverse if hard removal of endpoints is wanted.
- Local docker (`backend/Dockerfile`) already has the libs; only the Render image is broken. To be confirmed by reproducing against the Render image.
