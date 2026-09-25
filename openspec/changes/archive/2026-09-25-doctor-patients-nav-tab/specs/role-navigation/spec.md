## ADDED Requirements

### Requirement: Doctor Patients navigation tab
The system SHALL provide doctors a dedicated primary-navigation destination for browsing their accessible patients, separate from the doctor dashboard home.

#### Scenario: Patients tab in doctor nav
- **WHEN** a doctor is authenticated and views primary navigation
- **THEN** navigation SHALL include a Patients destination distinct from Doctor Dashboard, Messages, and Profile

#### Scenario: Patients tab lists accessible patients
- **WHEN** a doctor opens the Patients destination
- **THEN** the system SHALL list patients the doctor is permitted to view (active access relationship), including identifying and clinical summary information sufficient to choose a patient (at minimum name and latest risk or “no assessment” state)

#### Scenario: Click patient to explore
- **WHEN** a doctor activates a patient row in the Patients list
- **THEN** the system SHALL navigate to that patient’s doctor explore/detail view for the same patient

#### Scenario: No system-wide directory
- **WHEN** a doctor opens the Patients destination
- **THEN** the list SHALL NOT include patients without an access relationship to that doctor

#### Scenario: Non-doctor cannot use Patients tab
- **WHEN** a non-doctor authenticated user navigates to the doctor Patients destination
- **THEN** the system SHALL redirect them to their role home and SHALL NOT expose the patient list

## MODIFIED Requirements

### Requirement: Role-Specific Navigation
The system SHALL render navigation and default landing destinations based on the authenticated user's role so that patients, doctors, national admins, and maintainers see only role-appropriate destinations.

#### Scenario: Patient nav
- **WHEN** a patient is authenticated
- **THEN** navigation SHALL include patient dashboard, health form, records, and profile destinations

#### Scenario: Doctor nav
- **WHEN** a doctor is authenticated
- **THEN** navigation SHALL include the doctor dashboard, a Patients list destination, and profile, and SHALL NOT expose the patient's health-form flow as a primary destination

#### Scenario: Wrong-role route
- **WHEN** an authenticated user navigates to a route belonging to another role
- **THEN** the system SHALL redirect them to their role home

### Requirement: Doctor Assigned Patient List
The system SHALL provide a Patients list experience for the current doctor showing only patients/records they are permitted to access, with risk badge, last record date, and key vitals when available, filterable or sortable by risk level. Each listed patient SHALL be reachable via a clickable navigation link to that patient’s doctor detail view.

#### Scenario: Doctor views assigned list
- **WHEN** a doctor opens the Patients list destination
- **THEN** only patients with an access relationship to that doctor SHALL be listed

#### Scenario: Doctor cannot see unassigned others
- **WHEN** a doctor requests patient data not assigned to them
- **THEN** the API SHALL return 403 or 404 and SHALL NOT expose the record

#### Scenario: List row opens patient detail
- **WHEN** a doctor selects a patient from the Patients list
- **THEN** they SHALL land on the doctor patient detail page for that patient
