## Why

Public signup currently offers National Admin and Admin as self-service roles. Those are internal, trusted roles that should be provisioned by an existing admin, not requested by anonymous visitors. At the same time, patients report that the prescription PDF download takes many seconds on the Render deployment, and clinicians and patients find the UI text too small to read comfortably. Phase 1–2 features are done; this change tightens operational control and polishes two everyday pain points for all stakeholders (patient, doctor, national admin, admin).

## What Changes

- **BREAKING** Public signup page offers only Patient and Doctor. National Admin and Admin cards are removed. The register API rejects `national_admin` and `admin` so the restriction cannot be bypassed by calling the endpoint directly. Existing pending requests for those roles are untouched and can still be approved/rejected.
- New admin capability: an admin can create an account on behalf of another person with role Doctor, National Admin, or Admin (Patient also allowed for completeness). The account is active immediately with the chosen role (no approval round-trip), requires a doctor profile when the role is doctor, and is audited. The admin dashboard Users tab gets a "Create user" action.
- Prescription PDF download is made fast: the PDF renderer is warmed at API startup instead of on the first request, the rendered bytes are cached per prescription version so repeat downloads do not re-render, the response carries a content length, and the client shows an explicit "Preparing PDF…" state. Target: warm download under 2 seconds on Render; first download after a cold start not blocked on renderer import.
- Global UI type scale increased one step across the app (smallest body text moves from 12 px to 13 px, secondary from 14 px to 15 px, body from 16 px to 17 px, headings proportionally), via the design tokens so every page picks it up without per-component edits. Layout spacing is not scaled.

## Capabilities

### New Capabilities
- `admin-user-provisioning`: admin creates active accounts for elevated roles on behalf of a person, with audit.
- `ui-type-scale`: minimum readable text sizes for the web UI.

### Modified Capabilities
- `role-registration`: self-service signup restricted to patient and doctor; national_admin/admin only via admin provisioning.
- `prescription-pdf-export`: adds latency and caching requirements to the delta already proposed in change `doctor-prescription-ux-and-pdf-fix` (not yet archived). This change's delta is written against that delta's requirement names and must be merged with it at archive time.

Note: change `redesign-signup-ux` (unarchived) carries a `role-registration` delta describing three professional role cards. That delta stays valid for doctor; archive must reconcile the removed national_admin/admin cards with this change.

## Impact

- Backend: `schemas/user.py` (signup role literal, new admin create schema), `services/auth.py` (reject non-public roles), `services/admin.py` + `api/v1/admin.py` (new `POST /v1/admin/users`), `services/prescription.py` + `api/v1/prescriptions.py` + `main.py` lifespan (warm-up, cache, response headers), Dockerfiles (font cache). Tests in `backend/tests/`.
- Frontend: `app/(auth)/register/page.tsx`, `features/auth/role-selector.tsx`, `lib/api/auth.ts`, `lib/api/admin.ts`, `features/admin/components/users-tab.tsx` + new create-user dialog, `lib/api/prescriptions.ts`, `features/prescriptions/patient-prescription-detail.tsx`, `app/globals.css` (type tokens).
- No data migration. No new dependencies.

## Non-goals

- Email invitations or password-reset links for admin-created users (admin shares the temporary password out of band).
- Redesigning the prescription PDF layout or changing its fonts.
- Per-user font-size preference or accessibility settings panel.
- Removing already-pending national_admin/admin requests.
