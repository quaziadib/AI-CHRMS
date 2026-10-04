## 1. PDF 500 fix (backend/deploy)

- [x] 1.1 Reproduce: build `deploy/render/Dockerfile`, call PDF render in container (or read Render logs) and record the actual exception
- [x] 1.2 Add pango/cairo/gdk-pixbuf/libffi/fonts apt packages to final stage of `deploy/render/Dockerfile`
- [x] 1.3 Wrap PDF generation in `services/prescription.py` with logged error -> HTTP 503 with readable detail
- [x] 1.4 Add backend test: PDF endpoint returns 200 `application/pdf` for owned published prescription; 404 for draft/other patient; 503 when renderer raises (mocked)

## 2. Remove sections (frontend)

- [x] 2.1 Remove "Medication history" and "Doctor interactions" cards, interaction form, and dead state/handlers/imports from `doctor/patients/[id]/page.tsx`
- [x] 2.2 Remove "Doctor interactions" card and unused data/imports from `patient-sharing-panel.tsx`
- [x] 2.3 Grep for remaining UI references to both sections; run `npm run lint` and type check

## 3. Prescription side panel (frontend)

- [x] 3.1 Add SWR hook for a patient's prescriptions (doctor scope) with revalidate
- [x] 3.2 Refactor `doctor-compose-form.tsx` to be embeddable (props: patientId, onSaved, onCancel) without breaking existing routes
- [x] 3.3 Build `PrescriptionPanel` (view + compose modes) reusing `prescription-sections.tsx`
- [x] 3.4 Wire patient profile: "View prescription" (only if exists) and "Write prescription" buttons; grid reflow when open; sticky scrollable panel; stacked on small screens
- [x] 3.5 Confirm-on-close for unsaved compose edits; handle 403/404 grant loss

## 4. `/doctor/prescriptions` UX redesign (frontend)

- [x] 4.1 Invoke frontend-design skill; define layout/hierarchy for patient list and prescription list
- [x] 4.2 Implement search, status filter, clear primary action, loading/empty/error states in `doctor-prescription-list.tsx` and page
- [x] 4.3 Align detail/edit/new pages to the same visual system

## 5. Validation

- [x] 5.1 Run backend `pytest` and frontend lint/build
- [ ] 5.2 Manual: browser check of patient profile panel open/close, compose, view, PDF download as patient
- [ ] 5.3 Deploy to Render, verify PDF endpoint 200
