## Context

See proposal.md for motivation. Doctor Patients UI (`/doctor/patients`) already filters by `risk_level` via `GET /v1/doctor/patients?risk_level=…` and `list_doctor_profiles`. Latest-record cards already show `district` from `PatientRecord.district`. No location query exists yet. Access remains grant-scoped.

## Goals / Non-Goals

**Goals:**
- Server-side district filter on the doctor patients list API.
- UI control(s) on the Patients page alongside risk filter.
- Keep grant scoping and empty-state behavior correct.

**Non-Goals:**
- Division cascading UI unless a reliable district→division map is already reusable without new data model work (prefer district-only for v1).
- Client-only filtering of a full unfiltered payload as the primary approach (server filter is source of truth).

## Decisions

### 1. Filter grain = latest-record `district`
- **Choice:** Match `PatientRecord.district` on the same latest record used for risk filtering.
- **Why:** Field already exists and is shown in the list; no schema change.
- **Alternatives:** Filter by any historical record’s district — rejected (ambiguous for clinicians).

### 2. Query param `district`
- **Choice:** `GET /v1/doctor/patients?district=<string>&risk_level=<optional>`.
- **Why:** Mirrors existing `risk_level` style; simple for FE.
- **Alternatives:** Nested `location[district]` — unnecessary complexity.

### 3. District options = distinct values from accessible patients
- **Choice:** Build the dropdown from districts present on the doctor’s currently accessible patients’ latest records (optionally a lightweight extra field on the list response or a separate small endpoint). Prefer computing options client-side from an unfiltered fetch **or** return `available_districts` alongside the filtered list from a dedicated helper — simplest path: when loading the page, fetch unfiltered once for options, then refetch with filters; or extend list response. **Preferred:** fetch list with filters for rows; separately derive options by requesting without district filter (risk optional) and uniquing districts on the client from that baseline, OR add `district` options in API response meta.
- **Practical v1:** Client keeps an “all patients for this doctor” SWR key (no district) to populate district options; filtered SWR key includes district+risk. Avoids new endpoint.
- **Alternatives:** Full BD district catalog — noisy and includes empty regions.

### 4. AND with risk filter
- **Choice:** Both filters applied together when set.
- **Why:** Matches clinician mental model (“high risk in Dhaka”).

### 5. Surfaces
- **Choice:** Wire filters on `/doctor/patients` (primary). Doctor dashboard deep-link already points there; no need to reintroduce full list on dashboard.

## Risks / Trade-offs

- [District string spelling variants] → Exact match on stored value; options come from live data so labels match stored spellings.
- [Large panels if many districts] → Use a select/dropdown, not a button chip row like risk.
- [Double fetch for options] → Acceptable on free-tier list sizes; can optimize later.

## Migration Plan

1. Backend query param + filter in `list_doctor_profiles`.
2. Frontend API + hook + LocationFilter UI on Patients page.
3. Smoke: filter district, combine with risk, clear filters, grant scoping unchanged.
4. Rollback: revert API param and UI; no DB migration.

## Open Questions

- None blocking; division filter deferred unless apply-time reveals an existing district→division helper worth wiring.
