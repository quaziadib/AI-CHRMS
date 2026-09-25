## Context

See proposal.md for motivation. Today `frontend/app/(dashboard)/layout.tsx` already selects `NAV_PATIENT` vs `NAV_DOCTOR` via `getNavItems(roles)` and redirects doctors off patient-only prefixes. The shared sidebar still shows a generic "Health Project" header with no workspace label, so the two roles feel like one shell. Pending elevated signups (signup-role-approval) must keep patient chrome until approval.

## Goals / Non-Goals

**Goals:**
- Make patient vs doctor primary nav feel like separate workspaces (label + dedicated link sets).
- Keep existing route guards and role homes intact.
- Avoid regressing admin / national nav and messaging unread badge behavior.

**Non-Goals:**
- Dual-role mode switcher or changing `roles_for_approved_signup` so doctors retain `user`.
- New routes or backend APIs.
- Full visual redesign of doctor/patient pages.

## Decisions

### 1. Workspace label in sidebar header (not a second layout tree)
- **Choice:** Keep one dashboard layout; add a role-derived workspace label under/beside the product name (Patient / Doctor / National / Admin).
- **Why:** Lowest risk; matches current architecture; still reads as a separate nav bar per role.
- **Alternatives:** Separate layout route groups per role — clearer isolation but more duplication and churn for this UX polish.

### 2. Strict non-overlapping patient vs doctor link sets
- **Choice:** Keep `NAV_PATIENT` and `NAV_DOCTOR` mutually exclusive; doctor never gets health-form / patient dashboard / records links.
- **Why:** Spec and current guards already enforce this; labeling alone is not enough if links mix.
- **Alternatives:** Merge menus with section headers — rejected (confusing for the stated goal).

### 3. Pending elevated role = patient workspace
- **Choice:** Derive workspace from effective JWT `roles` only (same as `getNavItems`); ignore `requested_role`.
- **Why:** Aligns with signup-role-approval pending-nav requirement.

### 4. Visual differentiation stays light
- **Choice:** Workspace text label + role-appropriate header icon (Heart vs Stethoscope); reuse existing card/sidebar tokens.
- **Why:** User-friendly clarity without a new design system pass.
- **Alternatives:** Color-themed sidebars per role — deferred to avoid purple/theme churn and inconsistency with admin/national.

## Risks / Trade-offs

- [Doctors lose personal health form access] → Already true today; out of scope; document if users ask for a switcher later.
- [Label copy i18n] → English labels only for now, consistent with rest of UI.
- [Admin who also has other roles] → Existing precedence (`admin` > `doctor` > `national_admin` > patient) unchanged; admin workspace label when admin wins.

## Migration Plan

1. Ship frontend-only layout change; no DB/API migration.
2. Smoke: login as patient → Patient label + patient links; login as doctor → Doctor label + doctor links; pending doctor request → Patient; wrong-role URL still redirects.
3. Rollback: revert layout.tsx (and any small extracted helper) only.

## Open Questions

- None that block implementation; dual-role switcher deferred intentionally.
