## ADDED Requirements

### Requirement: Pending elevated role uses patient navigation
While an elevated-role request is pending, the system SHALL treat the user as a patient for navigation and role home routing, and MUST NOT expose doctor, national admin, or admin primary destinations based on the unapproved request.

#### Scenario: Pending doctor lands as patient
- **WHEN** a user with a pending doctor request authenticates and opens the app home
- **THEN** they SHALL be routed to the patient home and SHALL NOT see doctor-primary navigation

#### Scenario: After approval navigation updates
- **WHEN** an admin has approved the elevated role and the user refreshes their session
- **THEN** navigation and role home SHALL match the newly effective elevated role
