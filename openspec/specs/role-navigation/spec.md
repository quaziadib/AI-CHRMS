# Role Navigation Specification

## Purpose
Give each authenticated role (patient, doctor, national admin, maintainer) distinct navigation and landing views, including a doctor dashboard for assigned patients with read-only EHR access.

## Requirements

### Requirement: Role-Specific Navigation
The system SHALL render navigation and default landing destinations based on the authenticated user's role so that patients, doctors, national admins, and maintainers see only role-appropriate destinations.

#### Scenario: Patient nav
- **WHEN** a patient is authenticated
- **THEN** navigation SHALL include patient dashboard, health form, records, and profile destinations

#### Scenario: Doctor nav
- **WHEN** a doctor is authenticated
- **THEN** navigation SHALL include the doctor dashboard and profile, and SHALL NOT expose the patient's health-form flow as a primary destination

#### Scenario: Wrong-role route
- **WHEN** an authenticated user navigates to a route belonging to another role
- **THEN** the system SHALL redirect them to their role home

### Requirement: Doctor Assigned Patient List
The system SHALL provide a doctor dashboard listing only patients/records assigned to the current doctor, with risk badge, last record date, and key vitals, filterable or sortable by risk level.

#### Scenario: Doctor views assigned list
- **WHEN** a doctor opens the doctor dashboard
- **THEN** only records with that doctor's assignment SHALL be listed

#### Scenario: Doctor cannot see unassigned others
- **WHEN** a doctor requests patient data not assigned to them
- **THEN** the API SHALL return 403 or 404 and SHALL NOT expose the record

### Requirement: Read-Only Doctor EHR
Doctors SHALL view full assigned record detail in a read-only EHR view and MUST NOT edit records or change risk scores through the doctor UI or doctor APIs.

#### Scenario: Open patient EHR
- **WHEN** a doctor opens an assigned patient record detail page
- **THEN** all clinical fields SHALL be visible and edit/delete actions SHALL be absent

### Requirement: Admin Doctor Assignment
Administrators SHALL be able to assign or unassign a doctor to a patient record via the admin records workflow, storing a nullable doctor assignment on the record.

#### Scenario: Admin assigns doctor
- **WHEN** an admin sets a doctor on a record
- **THEN** that doctor SHALL subsequently see the record in their assigned list

#### Scenario: Unassigned records
- **WHEN** a record has no doctor assigned
- **THEN** no doctor SHALL see it in their assigned patient list

### Requirement: National Admin Placeholder
National admin users SHALL reach a live National Health Dashboard at their role home that presents Phase 3 national analytics (district map, forecasts, resource allocation, exports, and pattern insights when enabled), without access to patient-owned health form submission flows.

#### Scenario: National admin lands
- **WHEN** a national admin authenticates and opens their home
- **THEN** they SHALL see the National Health Dashboard (not a Phase 3 placeholder) and profile navigation

#### Scenario: No patient form in national nav
- **WHEN** a national admin views primary navigation
- **THEN** patient health-form submission SHALL NOT appear as a primary destination
