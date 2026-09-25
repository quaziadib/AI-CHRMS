## Context

See proposal.md for motivation. Doctor workspace already lists accessible patients on `/doctor` via `PatientList` → `/doctor/patients/{id}`, backed by `GET /v1/doctor/patients`. Nav (`NAV_DOCTOR`) has Dashboard, Messages, Profile only—no dedicated Patients item. Access is grant-based (`patient_sharing`), not a global patient census.

## Goals / Non-Goals

**Goals:**
- First-class **Patients** nav tab under doctor workspace.
- Dedicated list page with summary columns and click-through to existing detail route.
- Reuse existing doctor APIs and list UI where practical.

**Non-Goals:**
- Expanding visibility to patients without a grant.
- New backend list endpoints unless the current one is insufficient (it is sufficient).
- Dual-role or patient-nav changes.

## Decisions

### 1. Route: `/doctor/patients` for the list
- **Choice:** Add `frontend/app/(dashboard)/doctor/patients/page.tsx` as the list; keep `patients/[id]/page.tsx` for detail.
- **Why:** Matches REST-ish doctor API and existing detail URLs; nav href is obvious.
- **Alternatives:** `/doctor/patient-list` — rejected (worse alignment with API).

### 2. Nav item in `NAV_DOCTOR`
- **Choice:** Insert `{ name: "Patients", href: "/doctor/patients", icon: Users }` between Doctor Dashboard and Messages; update exclusivity assert so `/doctor/patients` is doctor-clinical (allowed on doctor nav; not on patient nav).
- **Why:** Separate tab as requested; Users icon is clear.

### 3. Dashboard vs Patients tab content
- **Choice:** Move the full filterable `PatientList` (+ risk filter) to the Patients page. Doctor Dashboard keeps AccessRequests and a brief “View all patients” link (and optional count), not a second full list.
- **Why:** Avoid duplicate heavy lists; dashboard stays for requests/overview.
- **Alternatives:** Duplicate list on both — rejected (confusing).

### 4. Active link highlighting
- **Choice:** Treat `/doctor/patients` and `/doctor/patients/*` as active for the Patients nav item; keep `/doctor` (exact or non-patients child) for Doctor Dashboard.
- **Why:** Detail pages should keep Patients tab highlighted.

### 5. Scope of “all patients”
- **Choice:** All patients with an active access relationship for the logged-in doctor (existing `list_doctor_profiles` behavior).
- **Why:** Privacy; matches current product. Recorded as intentional vs system-wide directory.

## Risks / Trade-offs

- [Next.js route conflict: `patients/page.tsx` vs `patients/[id]/page.tsx`] → Standard App Router pattern; list is `page`, detail is `[id]/page`.
- [Active-state bugs if `/doctor` uses `startsWith`] → Tighten dashboard active check to exclude `/doctor/patients`.
- [Users expect every patient in DB] → Empty-state copy clarifies access/grants; non-goal documented.

## Migration Plan

1. Frontend-only: nav + new list page + slim dashboard.
2. Smoke: doctor sees Patients tab → list → click → detail; non-doctor hitting `/doctor/patients` redirects.
3. Rollback: revert nav and pages.

## Open Questions

- None blocking; dashboard deep-link copy can be tuned at apply time.
