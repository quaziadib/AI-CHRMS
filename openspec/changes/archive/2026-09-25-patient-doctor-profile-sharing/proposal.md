## Why

Patients currently cannot grant doctors access to their longitudinal health profile; doctors see records through administrator assignment. Patient-approved sharing gives clinicians a fuller history while ensuring every doctor’s access depends on patient consent, with administrators retaining oversight.

## What Changes

- Let patients grant a specific doctor access; the doctor must accept before access becomes active, and the patient can revoke access.
- Give an accepting doctor a read-only longitudinal patient profile with past health records, medication history, and recorded doctor interactions.
- Require active patient consent for all doctor record access; administrator assignments alone do not authorize access.
- Let administrators retain record oversight and review the history of patient-doctor access decisions and access events.

## Capabilities

### New Capabilities
- `patient-doctor-sharing`: Patient-authorized doctor access requests, lifecycle, longitudinal profile contents, and access audit history.

### Modified Capabilities
- `role-navigation`: Limit doctor patient lists and EHR access to patients with active consent; retain admin record oversight and add visibility into sharing and access logs.

## Impact

Expected changes to backend access control, sharing and medication/interaction data models, audit logging, patient and doctor APIs, and patient, doctor, and admin views. Current administrator doctor assignments remain administrative metadata and do not grant doctor access. Phase 1–2 patient and clinician needs: longitudinal care access with explicit patient control and admin oversight.

## Non-goals

- Medication prescribing, dispensing, or pharmacy integration.
- Secure chat, appointment scheduling, or external EHR interoperability.
- Changes to national analytics or aggregate data access.
