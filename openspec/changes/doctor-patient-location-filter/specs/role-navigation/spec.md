## ADDED Requirements

### Requirement: Doctor patient list location filter
The system SHALL let doctors filter their accessible Patients list by location derived from each patient’s latest health record district, independently of and combinable with risk filtering. Location filtering MUST NOT expose patients without an active access grant.

#### Scenario: Filter by district
- **WHEN** a doctor selects a district location filter on the Patients list
- **THEN** the list SHALL include only accessible patients whose latest health record district matches that selection

#### Scenario: Combine location and risk filters
- **WHEN** a doctor applies both a district filter and a risk-level filter
- **THEN** the list SHALL include only accessible patients matching both criteria

#### Scenario: Clear location filter
- **WHEN** a doctor clears the location filter (or selects “all locations”)
- **THEN** the list SHALL no longer restrict by district (risk filter, if any, remains)

#### Scenario: No matching location
- **WHEN** a doctor applies a location filter that matches no accessible patients
- **THEN** the list SHALL be empty and SHALL NOT fall back to patients outside the doctor’s active grants

#### Scenario: Patient without district when filtered
- **WHEN** a location filter is active and a patient has no latest record or no district on that record
- **THEN** that patient SHALL NOT appear in the filtered list

## MODIFIED Requirements

### Requirement: Doctor Assigned Patient List
The system SHALL provide a Patients list experience for the current doctor showing only patients who have an active patient-granted access relationship with the current doctor, with risk badge, last record date, and key vitals when available, filterable by risk level and by location (district from the latest health record). Each listed patient SHALL be reachable via a clickable navigation link to that patient’s doctor detail view.

#### Scenario: Doctor views assigned list
- **WHEN** a doctor opens the Patients list destination
- **THEN** only patients with an active grant to that doctor SHALL be listed

#### Scenario: Doctor cannot see patients without active access
- **WHEN** a doctor requests a patient list or patient data without an active grant
- **THEN** the API SHALL return 403 or 404 and SHALL NOT expose the patient or record

#### Scenario: List row opens patient detail
- **WHEN** a doctor selects a patient from the Patients list
- **THEN** they SHALL land on the doctor patient detail page for that patient

#### Scenario: Administrator assignment does not grant doctor access
- **WHEN** an administrator assigns a doctor to a patient record but the patient has not granted that doctor active access
- **THEN** the doctor SHALL NOT see that patient in the Patients list or access the patient's data

#### Scenario: Doctor filters by risk level
- **WHEN** a doctor applies a risk-level filter on the Patients list
- **THEN** only accessible patients whose latest record matches that risk level SHALL be listed
