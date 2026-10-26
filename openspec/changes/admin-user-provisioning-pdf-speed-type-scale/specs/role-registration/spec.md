## MODIFIED Requirements

### Requirement: Role selection at signup
The system SHALL allow a self-registering user to select exactly one role from: patient (`user`) or doctor. The roles national_admin and admin SHALL NOT be offered on the public signup page and SHALL be rejected by the public registration API. Those roles are granted only through admin provisioning (see `admin-user-provisioning`) or admin approval of a previously created pending request.

#### Scenario: Patient signup selects patient
- **WHEN** a user registers with role patient
- **THEN** the account SHALL be created with effective patient privileges and no pending elevated-role request

#### Scenario: Elevated role selected
- **WHEN** a user registers with doctor (the only elevated role available at self-service signup)
- **THEN** the system SHALL record doctor as pending approval and MUST NOT grant the doctor role until an admin approves

#### Scenario: Signup page offers only patient and doctor
- **WHEN** a user opens the public signup page
- **THEN** the role choice SHALL show exactly Patient and Doctor, and SHALL NOT show National Admin or Admin

#### Scenario: Non-public role rejected by API
- **WHEN** a public registration request supplies role `national_admin` or `admin`
- **THEN** the API SHALL reject the request with a 4xx client error, SHALL create no user, and SHALL NOT record a pending request

#### Scenario: Invalid role rejected
- **WHEN** registration supplies an unsupported role value
- **THEN** the API SHALL reject the request with a client error and create no user

### Requirement: Admin approval of role requests
Administrators SHALL be able to list pending elevated-role requests and approve or reject each request, including national_admin and admin requests created before self-service signup for those roles was removed.

#### Scenario: Admin approves request
- **WHEN** an admin approves a pending role request
- **THEN** the user’s effective roles SHALL become the requested elevated role (or admin’s dual role set where applicable) and the request SHALL no longer be pending

#### Scenario: Admin rejects request
- **WHEN** an admin rejects a pending role request
- **THEN** the pending request SHALL be cleared, the user SHALL remain a patient, and elevated privileges SHALL NOT be granted

#### Scenario: Non-admin cannot approve
- **WHEN** a non-admin attempts to approve or reject a role request
- **THEN** the API SHALL return 403

#### Scenario: Legacy national_admin request still approvable
- **WHEN** a user holds a pending national_admin or admin request created before this change
- **THEN** an admin SHALL still be able to approve or reject it with the same outcome as before
