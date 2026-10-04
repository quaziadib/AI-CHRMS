## Why

Doctors register with only name/email/phone, so patients granting access cannot tell doctors apart, and admins approving a doctor role have nothing to verify. Patients also pick a doctor from one unfiltered dropdown, which does not scale. Phase 2 stakeholder need: clinicians discoverable by patients; admins able to vet clinicians.

## What Changes

- New 1:1 doctor profile (specialization, affiliations, division, district, location, ID picture) stored apart from the shared account. Name, email, phone, password, active and verified flags stay on the existing account, so only doctors carry the new fields.
- Registration page shows the extra doctor fields only when role "doctor" is selected; they are required then and rejected for other roles.
- Admin role-request review shows the submitted doctor profile.
- Existing doctor accounts are backfilled with randomly generated placeholder profile data (idempotent, startup migration).
- Doctor search for patient access provision: search box, search-by selector (name, email, specialization, affiliation, location, or all), and filters (specialization, division, district). Result is paginated.
- Doctor options returned to patients include profile summary fields.

## Capabilities

### New Capabilities
- `doctor-profile`: doctor-only professional profile captured at registration, its storage separation from the account, and backfill of existing doctors.

### Modified Capabilities
- `role-registration`: doctor signup requires and records doctor profile data; admins see it when approving.
- `patient-doctor-sharing`: patients search and filter doctors when choosing whom to grant access.

## Impact

- Backend: new `doctor_profiles` model/table, startup migration + backfill (`db/init_db.py`), `schemas/user.py`, `services/auth.py`, `services/admin.py`, `services/patient_sharing.py`, `api/v1/sharing.py`.
- Frontend: `app/(auth)/register/page.tsx`, `features/sharing/components/patient-sharing-panel.tsx`, `features/admin/components/role-requests-tab.tsx`, `lib/api` types.
- API: `POST /v1/auth/register` gains optional `doctor_profile` object; `GET /v1/sharing/doctors` gains query params and a richer response; new filter-options endpoint.
- No new dependencies.

## Non-goals

- Separate `doctors` table duplicating account/credential fields (no second login identity).
- Real ID-picture upload/storage pipeline or automated verification of credentials.
- Doctor self-edit of profile after registration, patient-side doctor reviews/ratings.
- Making `users.phone` unique.
