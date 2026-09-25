## Why

Signup currently always creates a patient (`roles: ["user"]`). Doctors, national admins, and admins must be promoted manually. Stakeholders need self-service signup with a chosen role, while privileged roles stay gated behind admin approval so the platform is not open to unvetted clinical or national accounts (Phase 1–2 auth / role model).

## What Changes

- Registration UI and API accept a selected role: patient, doctor, national_admin, or admin.
- Patient signup remains immediately usable (auto-approved).
- Non-patient signup creates an account whose **requested** elevated role stays pending until an admin approves or rejects it.
- Until approval, the account MUST NOT receive elevated privileges (effective access stays patient-level or an explicit pending state with no privileged nav).
- Admin UI gains a pending-role approval queue (approve → grant role; reject → clear request, keep patient).
- Audit log entries for role request, approval, and rejection.

## Non-goals

- Email verification / magic-link identity proofing for role claims.
- Multi-role requests in one signup (one requested role only).
- Changing the existing admin manual role dropdown for already-active users (it remains; approval queue is additive).
- Automatic approval workflows or external IdP role mapping.

## Capabilities

### New Capabilities
- `role-registration`: Signup role selection, pending elevated-role state, and admin approve/reject of role requests.

### Modified Capabilities
- `role-navigation`: Pending elevated users MUST NOT land on doctor/national/admin homes until approved; navigation follows effective (approved) roles only.

## Impact

- Backend: `UserCreate` schema, `register_user`, User model (requested role + approval status), admin APIs, login/token roles, audit actions.
- Frontend: register form role picker, post-register messaging for pending roles, admin pending-approvals UI.
- Auth/JWT: tokens reflect **effective** roles only (never unapproved elevated roles).
