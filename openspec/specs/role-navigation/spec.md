# Role Navigation Specification

## Purpose
Give each authenticated role (patient, doctor, national admin, maintainer) distinct navigation and landing views, including a doctor Patients list for accessible patients with read-only EHR access.

## Requirements

### Requirement: Role-Specific Navigation
The system SHALL render navigation and default landing destinations based on the authenticated user's role so that patients, doctors, national admins, and maintainers see only role-appropriate destinations. Patient and doctor primary navigation SHALL be dedicated, non-overlapping link sets (separate nav bars / workspaces), not a single mixed menu of both personal-health and clinical destinations. Administrators SHALL have an additional “National Overview” destination linking to the national dashboard while retaining their admin dashboard as their default landing page.

#### Scenario: Patient nav
- **WHEN** a patient is authenticated
- **THEN** navigation SHALL include patient dashboard, health form, records, profile, and a messaging inbox destination, and SHALL NOT include the doctor dashboard as a primary destination

#### Scenario: Doctor nav
- **WHEN** a doctor is authenticated
- **THEN** navigation SHALL include the doctor dashboard, a Patients list destination, profile, and a messaging inbox destination, and SHALL NOT expose the patient's health-form flow, patient dashboard, or patient records list as primary destinations

#### Scenario: Admin nav includes national overview
- **WHEN** an administrator is authenticated
- **THEN** navigation SHALL include Admin Dashboard, National Overview, and Profile destinations

#### Scenario: Admin national overview destination
- **WHEN** an administrator selects National Overview
- **THEN** the system SHALL open the existing national dashboard without changing the administrator's default post-login landing page

#### Scenario: Wrong-role route
- **WHEN** an authenticated user navigates to a route belonging to another role, except a national dashboard route explicitly authorized for administrators
- **THEN** the system SHALL redirect them to their role home

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

### Requirement: Pending elevated role uses patient navigation
While an elevated-role request is pending, the system SHALL treat the user as a patient for navigation and role home routing, and MUST NOT expose doctor, national admin, or admin primary destinations based on the unapproved request.

#### Scenario: Pending doctor lands as patient
- **WHEN** a user with a pending doctor request authenticates and opens the app home
- **THEN** they SHALL be routed to the patient home and SHALL NOT see doctor-primary navigation

#### Scenario: After approval navigation updates
- **WHEN** an admin has approved the elevated role and the user refreshes their session
- **THEN** navigation and role home SHALL match the newly effective elevated role

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

### Requirement: Doctor Assigned Patient List
The system SHALL provide a Patients list experience for the current doctor showing only patients who have an active patient-granted access relationship with the current doctor, with risk badge, last record date, and key vitals when available, filterable or sortable by risk level. Each listed patient SHALL be reachable via a clickable navigation link to that patient’s doctor detail view.

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

### Requirement: Read-Only Doctor EHR
Doctors SHALL view the complete shared longitudinal profile only while the patient has granted active access, and MUST NOT edit or delete patient health records or change risk scores through the doctor UI or doctor APIs. Doctors MAY append documented clinical interactions as defined by the patient-doctor-sharing capability.

#### Scenario: Open shared patient profile
- **WHEN** a doctor opens a profile for a patient with an active grant
- **THEN** all available health records and profile history SHALL be visible and health record edit/delete actions SHALL be absent

#### Scenario: Access is revoked while doctor has a profile open
- **WHEN** a patient revokes access and the doctor makes a subsequent profile or record request
- **THEN** the API SHALL deny the request and SHALL NOT return further patient data

#### Scenario: Doctor cannot change health records or risk scores
- **WHEN** a doctor attempts to edit or delete a patient health record or change its risk score
- **THEN** the system SHALL deny the action

### Requirement: Admin Doctor Assignment
Administrators SHALL be able to assign or unassign a doctor to a patient record as administrative metadata. An assignment MUST NOT grant the doctor access to that patient's data without an active patient-granted access relationship.

#### Scenario: Admin assigns a doctor
- **WHEN** an administrator sets a doctor on a patient record
- **THEN** the assignment SHALL be stored for administrative oversight and SHALL NOT by itself expose the patient record to that doctor

#### Scenario: Admin unassigns a doctor
- **WHEN** an administrator removes a doctor assignment
- **THEN** the assignment SHALL be cleared and any existing patient-granted access SHALL remain governed by its own status

### Requirement: Admin Patient Record Oversight
Administrators SHALL retain access to patient records through the administrative records workflow and SHALL be able to review the patient-doctor access audit history.

#### Scenario: Admin reviews patient records and access history
- **WHEN** an administrator opens a patient's administrative record view
- **THEN** the administrator SHALL be able to view the patient's records and patient-doctor access history

#### Scenario: Administrator record access does not imply doctor authorization
- **WHEN** an administrator views or assigns a patient record
- **THEN** that administrative action SHALL NOT activate a patient-doctor grant

### Requirement: National Admin Placeholder
National admin users SHALL reach a live National Health Dashboard at their role home that presents Phase 3 national analytics (district map, forecasts, resource allocation, exports, and pattern insights when enabled), without access to patient-owned health form submission flows.

#### Scenario: National admin lands
- **WHEN** a national admin authenticates and opens their home
- **THEN** they SHALL see the National Health Dashboard (not a Phase 3 placeholder) and profile navigation

#### Scenario: No patient form in national nav
- **WHEN** a national admin views primary navigation
- **THEN** patient health-form submission SHALL NOT appear as a primary destination
