## Context

See proposal.md for motivation and specs for required behavior. Patient health history currently consists of multiple `PatientRecord` rows linked by `user_id`; a record's nullable `doctor_id` is set by an administrator and is the authorization source for the doctor dashboard and EHR endpoints. Resubmission copies that assignment. The admin API already lists all records and audit logs, while the shared audit log identifies one acting user per event.

Medication history and clinical interaction entries do not currently have dedicated models or views. Doctor APIs address assigned record IDs rather than a patient-wide profile.

## Goals / Non-Goals

**Goals:**
- Enforce patient consent for every doctor profile and record read, including existing assigned records.
- Present records, medication history, and interaction notes as one patient-centered history.
- Keep administrator record oversight and provide an auditable view of sharing and profile access.
- Make revocation effective on the next API request.

**Non-Goals:**
- Turn admin assignment metadata into consent or auto-create grants for existing assignments.
- Build medication prescribing, secure messaging, or external EHR connections.
- Change national analytics access or export behavior.

## Decisions

1. **Use a patient-doctor grant as the sole doctor authorization source.** Store a grant against patient and doctor user IDs with pending, active, declined, and revoked states and lifecycle timestamps. Enforce one pending or active grant per patient-doctor pair; a patient may issue a new request after decline or revocation. Active access continues until the patient revokes it. Keep `PatientRecord.doctor_id` and the admin assignment workflow as administrative metadata, but remove them from doctor authorization and patient-list queries. This avoids silently treating old administrative assignments as consent. It means previously assigned doctors lose access at rollout until patients grant it and those doctors accept.

2. **Authorize at the patient profile boundary on every request.** Doctor list, profile, record detail, summary, medication, and interaction endpoints must all check that the requesting doctor has an active grant for the owning patient. Use patient user ID as the profile identity and return the patient's complete record history. Avoid relying on UI hiding or a previously loaded grant state; after revocation, the next API request must fail. Admin record APIs remain separate and retain their existing admin-role authorization.

3. **Keep medication history and clinical interactions as separate patient-linked data.** Add medication history entries linked to the patient, marked as patient-reported, with medication name and optional dosage and date details. Add append-only doctor interaction entries linked to patient, doctor, and interaction date. Doctors may add interactions only with active access; patients can view their own interaction history. Separate tables preserve multiple entries over time without changing submitted health assessments or implying a medication order.

4. **Use a patient-aware access event history.** Add append-only access events linked to both patient and doctor, with actor, event type, and timestamp. Record grant creation, accept/decline, revoke, and successful doctor profile access. Do not copy clinical notes or medication details into access events. The existing audit log has only one user identity per event, so a dedicated access-event record supports reliable admin filtering by patient and doctor.

5. **Expose the profile as a patient-centric doctor view.** The doctor dashboard lists active shared patients rather than assigned record rows. A patient's view groups all submitted records chronologically and shows medication and interaction histories alongside them. Keep health assessment records read-only; interaction entry is a separate append-only action. Patient screens show pending, active, declined, and revoked grant status and provide grant/revoke actions.

6. **Preserve admin oversight without granting doctor access.** Retain admin access to all patient records and existing assignment metadata. Add access-event history to the admin patient/record workflow, including the patient, doctor, event, actor, and time. Admin assignment or record viewing never creates or activates a consent grant.

## Risks / Trade-offs

- [Existing doctors lose access when consent enforcement ships] → Preserve assignment data for admin visibility, but require patients to grant access and doctors to accept before profiles reappear in doctor views.
- [A doctor endpoint may accidentally keep an assignment-only check] → Audit every doctor endpoint and centralize active-grant authorization; cover each route with authorization tests.
- [Revoked data can remain in an already-open browser view] → Deny subsequent API requests immediately and clear client-side patient data when access status changes or a request is rejected; already viewed or downloaded information cannot be recalled.
- [Access events add sensitive relationship metadata] → Restrict event history to administrators, avoid clinical content in event rows, and log only the fields required to identify the access event.
- [Patient-reported medication details may be incomplete] → Label them as patient-reported and allow missing dosage/date values; do not represent entries as prescriptions.

## Migration Plan

1. Add grant, medication-history, interaction, and access-event tables with indexes and constraints through the existing additive database initialization/migration path.
2. Deploy backend authorization and APIs so doctor access requires an active grant; preserve existing assignment values as metadata and do not convert them into grants.
3. Deploy patient grant/status controls, doctor request and profile views, and admin access-history views.
4. At rollout, inform users that previous doctor assignments no longer authorize viewing and that patients must grant access for a doctor to see their profile.
5. Roll back application code only with care: reverting to assignment-only authorization would bypass the newly chosen consent requirement. Keep the additive data tables and require a deliberate product decision before any authorization rollback.

