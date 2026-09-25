## ADDED Requirements

### Requirement: Labeled patient and doctor workspaces
The system SHALL present patient and doctor experiences as separately labeled workspaces in primary navigation so the active role context is visible without inspecting destination URLs.

#### Scenario: Patient workspace label
- **WHEN** a patient-authenticated user views the primary navigation chrome
- **THEN** the navigation SHALL identify the workspace as patient-facing (e.g. a "Patient" label or equivalent) and SHALL NOT present doctor clinical destinations

#### Scenario: Doctor workspace label
- **WHEN** a doctor-authenticated user views the primary navigation chrome
- **THEN** the navigation SHALL identify the workspace as doctor-facing (e.g. a "Doctor" label or equivalent) and SHALL NOT present patient health-form or patient-records destinations as primary links

#### Scenario: Pending elevated role stays patient-labeled
- **WHEN** a user with a pending elevated-role request (effective patient roles only) views primary navigation
- **THEN** the workspace label and destinations SHALL remain patient, not doctor

## MODIFIED Requirements

### Requirement: Role-Specific Navigation
The system SHALL render navigation and default landing destinations based on the authenticated user's role so that patients, doctors, national admins, and maintainers see only role-appropriate destinations. Patient and doctor primary navigation SHALL be dedicated, non-overlapping link sets (separate nav bars / workspaces), not a single mixed menu of both personal-health and clinical destinations.

#### Scenario: Patient nav
- **WHEN** a patient is authenticated
- **THEN** navigation SHALL include patient dashboard, health form, records, profile, and messaging inbox destinations, and SHALL NOT include the doctor dashboard as a primary destination

#### Scenario: Doctor nav
- **WHEN** a doctor is authenticated
- **THEN** navigation SHALL include the doctor dashboard, profile, and messaging inbox destinations, and SHALL NOT expose the patient's health-form flow, patient dashboard, or patient records list as primary destinations

#### Scenario: Wrong-role route
- **WHEN** an authenticated user navigates to a route belonging to another role
- **THEN** the system SHALL redirect them to their role home
