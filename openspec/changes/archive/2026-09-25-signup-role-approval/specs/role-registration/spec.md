## Purpose

Allows signup with a chosen application role and requires admin approval before elevated roles (doctor, national admin, admin) take effect, while patients remain immediately usable.

## ADDED Requirements

### Requirement: Role selection at signup
The system SHALL allow a registering user to select exactly one role from: patient (`user`), doctor, national_admin, or admin.

#### Scenario: Patient signup selects patient
- **WHEN** a user registers with role patient
- **THEN** the account SHALL be created with effective patient privileges and no pending elevated-role request

#### Scenario: Elevated role selected
- **WHEN** a user registers with doctor, national_admin, or admin
- **THEN** the system SHALL record that requested role as pending approval and MUST NOT grant the elevated role until an admin approves

#### Scenario: Invalid role rejected
- **WHEN** registration supplies an unsupported role value
- **THEN** the API SHALL reject the request with a client error and create no user

### Requirement: Effective roles exclude unapproved elevation
Until an admin approves a pending elevated-role request, the system SHALL treat the account’s effective roles as patient-only for authentication tokens, authorization checks, and navigation.

#### Scenario: Pending doctor cannot use doctor APIs
- **WHEN** a user with a pending doctor request authenticates
- **THEN** doctor-only endpoints SHALL deny access and JWT/session roles SHALL NOT include `doctor`

#### Scenario: Pending user can use patient features
- **WHEN** a user with a pending elevated-role request is authenticated
- **THEN** they SHALL retain patient-level access (login and patient destinations) unless the account is otherwise deactivated

### Requirement: Admin approval of role requests
Administrators SHALL be able to list pending elevated-role requests and approve or reject each request.

#### Scenario: Admin approves request
- **WHEN** an admin approves a pending role request
- **THEN** the user’s effective roles SHALL become the requested elevated role (or admin’s dual role set where applicable) and the request SHALL no longer be pending

#### Scenario: Admin rejects request
- **WHEN** an admin rejects a pending role request
- **THEN** the pending request SHALL be cleared, the user SHALL remain a patient, and elevated privileges SHALL NOT be granted

#### Scenario: Non-admin cannot approve
- **WHEN** a non-admin attempts to approve or reject a role request
- **THEN** the API SHALL return 403

### Requirement: Signup and approval are audited
The system SHALL append immutable audit entries for registration with requested role, role-request approval, and role-request rejection.

#### Scenario: Pending registration audited
- **WHEN** a user registers requesting an elevated role
- **THEN** an audit entry SHALL record the registration and the requested role

#### Scenario: Approval audited
- **WHEN** an admin approves or rejects a role request
- **THEN** an audit entry SHALL record the actor, target user, decision, and role involved

### Requirement: Pending-state visibility to the registrant
After elevated-role signup, the system SHALL inform the user that access to the requested role awaits admin approval.

#### Scenario: Post-register pending message
- **WHEN** registration completes with a pending elevated role
- **THEN** the client SHALL show that the requested role is pending admin approval and SHALL NOT navigate as if that elevated role were already active
