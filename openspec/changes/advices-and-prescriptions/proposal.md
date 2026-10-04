## Why

Doctors currently communicate with patients via free-text messaging only — there is no structured clinical workflow for issuing formal prescriptions or advice. This gap means care instructions live in unstructured chat, are hard to act on, and cannot be exported or audited as clinical documents. Phase 2 added EHR summarization and messaging; this change closes the loop by giving doctors a prescription/advice tool that produces a structured, shareable, printable clinical document.

## What Changes

- New **"Advices & Prescriptions"** tab added to the doctor nav and a patient-facing read view in the patient nav.
- Doctors compose a prescription with four structured sections: **Symptoms & Diagnosis**, **Medications**, **Lab Tests**, **General Advice** — each with diabetes-context suggestions.
- Medications section supports structured sub-fields: name, dosage schedule (X+Y+Z morning/afternoon/night), duration in days, instructions.
- Each prescription is persisted as a clinical document linked to a patient-doctor grant; doctors can edit or revoke it after submission.
- Doctors can save prescriptions as drafts (not visible to the patient) and publish when ready.
- Patients receive a clean web view of published prescriptions and can download a PDF in prescription format.
- A new backend model (`Prescription`) and API endpoints under `/v1/doctor/patients/{patient_id}/prescriptions`.

## Capabilities

### New Capabilities
- `advices-and-prescriptions`: Structured prescription/advice authoring by doctors — including draft/publish lifecycle, post-submission editing, revocation, patient-facing display, and PDF export.

### Modified Capabilities
*(none — existing messaging and sharing specs are unchanged)*

## Impact

- **Backend:** New `Prescription`, `PrescriptionMedication`, `PrescriptionLabTest` models; new service `services/prescription.py`; new routes in `api/v1/doctor.py`; PDF generation via `weasyprint` or `reportlab`.
- **Frontend:** New `features/prescriptions/` module (doctor compose form + patient view); new nav tab in `(dashboard)/layout.tsx` for both roles; PDF download triggered from patient view.
- **Auth/permissions:** Doctor-only write; patient read-only restricted to their own prescriptions under active or historical grant.
- **Audit log:** `prescription_created`, `prescription_updated`, `prescription_revoked`, `prescription_viewed` events added.
- **No breaking changes** to existing APIs or models.

## Non-goals

- E-prescribing / pharmacy integration.
- AI auto-generation of prescription content (out of scope for this change).
- Patient-side editing or deletion of prescriptions.
