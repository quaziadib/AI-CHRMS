## Context

The project already has `PatientDoctorConversation`/`PatientDoctorMessage` models, a `patient_doctor_grants` table, and a `doctor.py` API router with grant-checked patient access. The prescription feature reuses grant authorization patterns but adds new immutable clinical document models and a PDF generation dependency. Frontend already has `features/` domain modules with co-located components and hooks; the nav tab system in `(dashboard)/layout.tsx` already handles role-conditional tabs.

## Goals / Non-Goals

**Goals:**
- Structured prescription data model with four sections (symptoms/diagnosis, medications, lab tests, general advice)
- Draft/publish lifecycle — doctors save drafts (patient-invisible) and publish when ready
- Doctor can edit a published prescription (creates audit trail, patient sees latest content)
- Doctor can revoke a published prescription (patient sees revocation notice, PDF still downloadable)
- Doctor compose UI in a new "Advices & Prescriptions" nav tab
- Patient read UI in the same tab name, showing all received prescriptions
- Server-side PDF generation returning a formatted clinical document
- Audit events on create, update, revoke, and view

**Non-Goals:**
- AI-assisted content generation
- Pharmacy/e-prescribing integration
- Patient-side editing or deletion of prescriptions

## Decisions

### Data Model

Three new tables:
- **`prescriptions`** — top-level document: `id`, `doctor_id`, `patient_id`, `grant_id` (nullable FK), `status` (enum: `draft` | `published` | `revoked`), `created_at`, `updated_at`. Status transitions: `draft → published`, `published → revoked`; `draft` may be freely edited; `published` may be edited (content update) or revoked; `revoked` is terminal.
- **`prescription_items`** — list items for symptoms/lab_tests/general_advice: `id`, `prescription_id` (FK), `section` (enum: `symptoms_diagnosis` | `lab_tests` | `general_advice`), `content` (text ≤500 chars), `order` (int). On edit, existing items are replaced (delete-and-reinsert within a transaction).
- **`prescription_medications`** — structured medication entries: `id`, `prescription_id` (FK), `medicine_name` (≤200), `dosage_morning`, `dosage_afternoon`, `dosage_night` (smallint ≥0), `duration_days` (positive int), `instructions` (nullable text ≤500), `order` (int). Same replace-on-edit pattern.

Rationale: a `status` column on `prescriptions` supports the draft/publish/revoke lifecycle without a separate drafts table. Replace-on-edit (delete child rows + reinsert) is simpler than diffing ordered lists and sufficient for clinical prescriptions where the doctor replaces the whole set. Storing X+Y+Z as three integer columns (not a string) enables future dosage queries.

### API Endpoints (under `/v1/doctor/patients/{patient_id}/prescriptions`)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/v1/doctor/patients/{patient_id}/prescriptions` | doctor | Create prescription (draft or published) |
| GET | `/v1/doctor/patients/{patient_id}/prescriptions` | doctor | List prescriptions for patient |
| GET | `/v1/doctor/patients/{patient_id}/prescriptions/{id}` | doctor | Get single prescription |
| PATCH | `/v1/doctor/patients/{patient_id}/prescriptions/{id}` | doctor | Edit draft or published prescription; update status (publish/revoke) |

Patient-side (under `/v1/records/prescriptions` to keep patient routes separate):

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/v1/records/prescriptions` | patient | List all my prescriptions |
| GET | `/v1/records/prescriptions/{id}` | patient | Get single prescription |
| GET | `/v1/records/prescriptions/{id}/pdf` | patient | Download PDF |

### PDF Generation

Use **`weasyprint`** (Python, HTML→PDF) rather than `reportlab`. Rationale: HTML/CSS template is easier to maintain and produces better typography. A Jinja2 template in `app/templates/prescription.html` renders the prescription data; the PDF route streams the result with `Content-Disposition: attachment`. `weasyprint` added to `requirements.txt`.

### Suggestions Mechanism

Diabetes-related suggestions for each section are static lists defined in a frontend constants file (`features/prescriptions/suggestions.ts`). They are not persisted or returned by the API — they are UX affordances only, pre-populating the form. This keeps the backend simple and suggestions easy to update.

### Frontend Architecture

New `features/prescriptions/` module:
- `doctor-compose-form.tsx` — multi-section form with tag-input UI for list sections and structured rows for medications; uses react-hook-form + Zod
- `patient-prescription-list.tsx` — list of received prescriptions with expand/collapse
- `patient-prescription-detail.tsx` — full detail view with PDF download button
- `usePrescriptions.ts` — SWR hooks for both doctor and patient reads

Nav tab "Advices & Prescriptions" added for both doctor and patient roles in `(dashboard)/layout.tsx`.

### Authorization

Prescription creation uses `require_active_grant` (existing helper in `services/patient_sharing.py`). Patient read uses a new `require_prescription_owner` check — patient ID on the prescription must match the authenticated user. Doctor list uses `require_doctor_owns_prescription` — doctor ID must match. No cross-role reads.

## Risks / Trade-offs

- **`weasyprint` binary dependency**: adds ~50 MB to the Docker image and requires system-level font/library packages (`libpango`, `libcairo`). Mitigated by updating the backend `Dockerfile` explicitly; Render.com supports the packages.
- **Replace-on-edit child rows**: delete-and-reinsert within a transaction is simple but loses item-level history. Acceptable for clinical prescriptions where the doctor owns the content; full row history would require a separate audit/snapshot table.
- **Revoked prescriptions still PDF-downloadable**: a doctor may revoke a prescription but the patient retains historical access including PDF. This is intentional for audit purposes but should be clearly labeled in the UI.
- **Draft visibility**: only the authoring doctor sees drafts; the list endpoint for patients filters to `published` and `revoked` statuses only.
- **Static suggestions**: suggestions cannot be personalized by the AI yet. Acceptable for now; they are in a constants file and easy to extend.
