## Why

Doctors can filter accessible patients by risk level, but not by geography. Clinics often work a local catchment; location filtering on the doctor Patients list (and related patient sections) makes triage faster without scrolling the full roster (Phase 2 clinician UX).

## What Changes

- Add location filtering on doctor patient-list surfaces (Patients tab primary; same filters if the list appears elsewhere under doctor routes).
- Filter by **district** from each patient’s latest health record (field already stored on records).
- Combine location filter with existing risk filter (AND semantics).
- API: extend `GET /v1/doctor/patients` with optional location query params; return only accessible patients matching filters.
- UI: district (and optional division) control(s) next to the risk filter; clear/reset to show all accessible patients.
- Patients with no record / no district remain visible only when no location filter is applied (or under an explicit “Unknown location” option if included).

## Non-goals

- No expansion of who the doctor can see (still active-grant patients only).
- No GPS / live geolocation; no map widget on the doctor list.
- No national-admin choropleth changes.
- No requiring every patient to have a district before they appear when unfiltered.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `role-navigation`: Doctor patient list SHALL support location-based filtering in addition to risk filtering, scoped to accessible patients.

## Impact

- Backend: `list_assigned_patients` / `list_doctor_profiles`, doctor API query params, possibly district option list derived from accessible patients’ latest records.
- Frontend: doctor Patients page filters, `useDoctorPatients`, `doctorApi.getPatients`.
- Specs: `openspec/specs/role-navigation`.
- Phase: Phase 2 clinician workflow.
