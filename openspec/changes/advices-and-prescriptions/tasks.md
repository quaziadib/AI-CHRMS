## 1. Backend — Data Models

- [x] 1.1 Add `Prescription` SQLAlchemy model in `backend/app/models/prescription.py` with fields: `id` (UUID PK), `doctor_id` (FK users), `patient_id` (FK users), `grant_id` (nullable FK patient_doctor_grants), `status` (string enum: `draft` | `published` | `revoked`, default `draft`), `created_at`, `updated_at`
- [x] 1.2 Add `PrescriptionItem` model (same file) for symptoms/lab_tests/general_advice list rows: `id`, `prescription_id` (FK), `section` (enum string), `content` (≤500 chars), `order` (int)
- [x] 1.3 Add `PrescriptionMedication` model (same file): `id`, `prescription_id` (FK), `medicine_name` (≤200), `dosage_morning/afternoon/night` (smallint ≥0), `duration_days` (positive int), `instructions` (nullable ≤500), `order` (int)
- [x] 1.4 Import and register the three new models in `backend/app/db/base.py` so Alembic picks them up
- [x] 1.5 Write and run Alembic migration creating the three tables; verify migration is idempotent

## 2. Backend — Pydantic Schemas

- [x] 2.1 Create `backend/app/schemas/prescription.py` with `PrescriptionItemIn`, `PrescriptionMedicationIn` (dosage schedule: each of morning/afternoon/night must be ≥0 int), `PrescriptionCreate` (optional lists per section + optional `status` defaulting to `draft`), `PrescriptionResponse`, `PrescriptionListItem`
- [x] 2.2 Add `PrescriptionMedicationResponse` and `PrescriptionItemResponse` nested schemas for read endpoints
- [x] 2.3 Add `PrescriptionUpdate` schema — all fields optional; `status` field accepts `published` or `revoked` only (cannot set to `draft` via update); validate that `revoked` cannot be set on a `draft` prescription

## 3. Backend — Service Layer

- [x] 3.1 Create `backend/app/services/prescription.py` with `create_prescription(db, doctor_id, patient_id, data)` — verifies active grant, persists models with initial status (`draft` or `published`), logs `prescription_created` audit event
- [x] 3.2 Add `update_prescription(db, doctor_id, prescription_id, data)` — validates doctor owns it and status is not `revoked`; replaces child rows (delete + reinsert in transaction) if content fields provided; transitions status if `status` field provided; logs `prescription_updated` or `prescription_revoked` accordingly; enforce draft-cannot-be-directly-revoked rule
- [x] 3.3 Add `list_doctor_prescriptions(db, doctor_id, patient_id)` — returns all statuses (draft/published/revoked) for the doctor in reverse-chronological order
- [x] 3.4 Add `get_prescription_for_doctor(db, doctor_id, prescription_id)` — validates doctor owns it
- [x] 3.5 Add `list_patient_prescriptions(db, patient_id)` — returns only `published` and `revoked` prescriptions (excludes drafts)
- [x] 3.6 Add `get_prescription_for_patient(db, patient_id, prescription_id)` — validates patient owns it and status is not `draft`; logs `prescription_viewed` audit event

## 4. Backend — API Endpoints

- [x] 4.1 Add doctor prescription routes to `backend/app/api/v1/doctor.py`: `POST /patients/{patient_id}/prescriptions`, `GET /patients/{patient_id}/prescriptions`, `GET /patients/{patient_id}/prescriptions/{id}`, `PATCH /patients/{patient_id}/prescriptions/{id}`
- [x] 4.2 Add patient prescription routes to `backend/app/api/v1/records.py` (or a new `prescriptions.py` registered in `router.py`): `GET /prescriptions`, `GET /prescriptions/{id}`, `GET /prescriptions/{id}/pdf`
- [x] 4.3 Register any new router in `backend/app/api/v1/router.py`

## 5. Backend — PDF Generation

- [x] 5.1 Add `weasyprint` to `backend/requirements.txt` (or `pyproject.toml`)
- [x] 5.2 Update `backend/Dockerfile` to install system packages required by weasyprint (`libpango-1.0-0`, `libcairo2`, `libgdk-pixbuf2.0-0`, fonts)
- [x] 5.3 Create `backend/app/templates/prescription.html` — Jinja2 HTML template with clinic header, doctor/patient info, issue date, and four section blocks styled for print/PDF
- [x] 5.4 Add `generate_prescription_pdf(prescription_data) -> bytes` in `backend/app/services/prescription.py` using weasyprint to render the template
- [x] 5.5 Wire the `/prescriptions/{id}/pdf` endpoint to call `generate_prescription_pdf` and return a `StreamingResponse` with `Content-Type: application/pdf` and `Content-Disposition: attachment`

## 6. Frontend — Constants & Hooks

- [x] 6.1 Create `frontend/features/prescriptions/suggestions.ts` with exported arrays: `SYMPTOM_SUGGESTIONS`, `LAB_TEST_SUGGESTIONS`, `GENERAL_ADVICE_SUGGESTIONS` — each containing 8–12 diabetes-relevant strings
- [x] 6.2 Add API client methods for prescriptions to `frontend/lib/api/` (doctor: create, list, get, update/publish/revoke; patient: list, get, pdf-download)
- [x] 6.3 Create `frontend/features/prescriptions/usePrescriptions.ts` with SWR hooks: `useDoctorPrescriptions(patientId)`, `usePatientPrescriptions()`, `usePrescription(id)`

## 7. Frontend — Doctor Compose UI

- [x] 7.1 Create `frontend/features/prescriptions/doctor-compose-form.tsx` — four-section form using react-hook-form + Zod; Symptoms & Diagnosis section uses tag-input with `SYMPTOM_SUGGESTIONS` suggestions panel
- [x] 7.2 Medications sub-form: dynamic list of rows, each with medicine name input, three numeric dosage fields (labeled Morning/Afternoon/Night), duration (number), and instructions textarea; "Add medication" button appends a row
- [x] 7.3 Lab Tests section: tag-input with `LAB_TEST_SUGGESTIONS` suggestions panel
- [x] 7.4 General Advice section: tag-input with `GENERAL_ADVICE_SUGGESTIONS` suggestions panel
- [x] 7.5 Form has two submit actions: "Save Draft" (creates/updates with `status: draft`) and "Publish" (creates/updates with `status: published`); on success show toast and redirect to doctor's prescription list for that patient
- [x] 7.6 Create `frontend/features/prescriptions/doctor-prescription-list.tsx` — table/list of prescriptions for the selected patient showing status badge (Draft / Published / Revoked), each row links to detail/edit view
- [x] 7.7 Create `frontend/features/prescriptions/doctor-prescription-detail.tsx` — shows prescription content with Edit button (opens compose form pre-filled) and Revoke button (only visible for `published`; triggers `PATCH` with `status: revoked` after confirmation dialog)

## 8. Frontend — Patient Prescription UI

- [x] 8.1 Create `frontend/features/prescriptions/patient-prescription-list.tsx` — card list of all received prescriptions sorted newest first, showing doctor name and issue date
- [x] 8.2 Create `frontend/features/prescriptions/patient-prescription-detail.tsx` — full structured view of one prescription with four labelled sections; PDF download button triggers `GET /prescriptions/{id}/pdf`; show a visible revocation notice banner when `status === "revoked"`
- [x] 8.3 Style the detail view to resemble a prescription document (clean card layout, doctor info header, date, status badge)

## 9. Frontend — Nav Tab & Routing

- [x] 9.1 Add "Advices & Prescriptions" tab to the doctor nav in `frontend/app/(dashboard)/layout.tsx` pointing to `/doctor/prescriptions`
- [x] 9.2 Add "Advices & Prescriptions" tab to the patient nav in `frontend/app/(dashboard)/layout.tsx` pointing to `/prescriptions`
- [x] 9.3 Create `frontend/app/(dashboard)/doctor/prescriptions/page.tsx` — doctor landing: lists their patients, selecting one shows the prescription list + compose button
- [x] 9.4 Create `frontend/app/(dashboard)/doctor/prescriptions/[patientId]/new/page.tsx` — renders `doctor-compose-form.tsx`
- [x] 9.5 Create `frontend/app/(dashboard)/prescriptions/page.tsx` — renders `patient-prescription-list.tsx`
- [x] 9.6 Create `frontend/app/(dashboard)/prescriptions/[id]/page.tsx` — renders `patient-prescription-detail.tsx`

## 10. Testing & Validation

- [x] 10.1 Write pytest tests in `backend/tests/` for prescription creation (success, no active grant, invalid dosage format, draft vs published visibility)
- [x] 10.2 Write pytest tests for PATCH: edit draft, publish draft, edit published, revoke published, attempt to revoke draft (should fail), attempt to edit revoked (should fail)
- [x] 10.3 Write pytest test for PDF endpoint returns binary with correct Content-Type
- [ ] 10.4 Manually test doctor compose flow end-to-end in dev (save draft → edit draft → publish → patient view → PDF download → revoke → patient sees revocation notice)
- [ ] 10.5 Verify audit log entries appear for `prescription_created`, `prescription_updated`, `prescription_revoked`, `prescription_viewed`
- [x] 10.6 Run `npm run build` in `frontend/` and resolve any TypeScript errors
