## MODIFIED Requirements

### Requirement: Role-Specific Navigation
The system SHALL render navigation and default landing destinations based on the authenticated user's role so that patients, doctors, national admins, and maintainers see only role-appropriate destinations.

#### Scenario: Patient nav
- **WHEN** a patient is authenticated
- **THEN** navigation SHALL include patient dashboard, health form, records, profile, and a messaging inbox destination

#### Scenario: Doctor nav
- **WHEN** a doctor is authenticated
- **THEN** navigation SHALL include the doctor dashboard, profile, and a messaging inbox destination, and SHALL NOT expose the patient's health-form flow as a primary destination

#### Scenario: Wrong-role route
- **WHEN** an authenticated user navigates to a route belonging to another role
- **THEN** the system SHALL redirect them to their role home
