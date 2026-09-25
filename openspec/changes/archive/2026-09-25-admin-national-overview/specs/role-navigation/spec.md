## MODIFIED Requirements

### Requirement: Role-Specific Navigation
The system SHALL render navigation and default landing destinations based on the authenticated user's role so that patients, doctors, national admins, and maintainers see only role-appropriate destinations. Administrators SHALL have an additional “National Overview” destination linking to the national dashboard while retaining their admin dashboard as their default landing page.

#### Scenario: Patient nav
- **WHEN** a patient is authenticated
- **THEN** navigation SHALL include patient dashboard, health form, records, and profile destinations

#### Scenario: Doctor nav
- **WHEN** a doctor is authenticated
- **THEN** navigation SHALL include the doctor dashboard and profile, and SHALL NOT expose the patient's health-form flow as a primary destination

#### Scenario: Admin nav includes national overview
- **WHEN** an administrator is authenticated
- **THEN** navigation SHALL include Admin Dashboard, National Overview, and Profile destinations

#### Scenario: Admin national overview destination
- **WHEN** an administrator selects National Overview
- **THEN** the system SHALL open the existing national dashboard without changing the administrator's default post-login landing page

#### Scenario: Wrong-role route
- **WHEN** an authenticated user navigates to a route belonging to another role, except a national dashboard route explicitly authorized for administrators
- **THEN** the system SHALL redirect them to their role home
