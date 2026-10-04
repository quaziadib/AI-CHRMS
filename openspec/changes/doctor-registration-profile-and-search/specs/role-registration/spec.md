## ADDED Requirements

### Requirement: Doctor details collected at signup
When the selected signup role is doctor, the system SHALL require doctor profile data (specialization, division, district, location; affiliations and ID picture optional) and SHALL store it with the pending role request. The registration form SHALL show these fields only when doctor is selected.

#### Scenario: Doctor signup with profile
- **WHEN** a user registers as doctor with all required profile fields
- **THEN** the account SHALL be created with a pending doctor request and the profile stored

#### Scenario: Doctor signup missing required field
- **WHEN** a doctor registration omits a required profile field
- **THEN** the API SHALL reject it with a client error and create no user or profile

#### Scenario: Non-doctor role with profile data
- **WHEN** a registration for any role other than doctor includes doctor profile data
- **THEN** the API SHALL reject it with a client error and create no user

#### Scenario: Fields hidden for other roles
- **WHEN** the user selects a role other than doctor on the registration form
- **THEN** the doctor fields SHALL NOT be shown or submitted

### Requirement: Admin reviews doctor profile
Administrators reviewing a pending doctor request SHALL be able to see the submitted doctor profile, including the ID picture reference.

#### Scenario: Admin views pending doctor
- **WHEN** an admin lists pending role requests
- **THEN** each doctor request SHALL include its profile data

#### Scenario: Non-admin denied
- **WHEN** a non-admin requests pending role requests
- **THEN** the API SHALL return 403
