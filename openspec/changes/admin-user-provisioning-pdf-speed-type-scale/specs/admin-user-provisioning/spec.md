## Purpose

Lets an administrator create accounts on behalf of doctors, national admins, other admins (and patients) so that trusted roles are provisioned by staff rather than requested through public signup.

## ADDED Requirements

### Requirement: Admin creates a user with an active role
An admin SHALL be able to create a user account by supplying email, full name, initial password, role (one of patient, doctor, national_admin, admin), and optional phone. The created account SHALL be active immediately with the chosen role in effect, SHALL have no pending role request, and SHALL be able to log in with the supplied password.

#### Scenario: Admin creates a national admin
- **WHEN** an admin submits a create-user request with role national_admin and valid details
- **THEN** the system SHALL respond 201 with the new user whose effective roles include national_admin, with no pending request, and that user SHALL be able to log in and reach national-admin destinations

#### Scenario: Admin creates another admin
- **WHEN** an admin submits a create-user request with role admin
- **THEN** the new user SHALL receive the admin dual role set (admin and patient) immediately

#### Scenario: Admin creates a doctor with profile
- **WHEN** an admin submits a create-user request with role doctor and a complete doctor profile (specialization, division, district, practice location; affiliations and ID picture optional)
- **THEN** the system SHALL create the user with the doctor role active and the profile attached, and the doctor SHALL appear in patient-facing doctor search

#### Scenario: Doctor role without profile rejected
- **WHEN** an admin submits role doctor without a doctor profile, or supplies a doctor profile with a non-doctor role
- **THEN** the API SHALL reject the request with a 422 validation error and create no user

#### Scenario: Duplicate email rejected
- **WHEN** an admin submits a create-user request whose email already belongs to an account
- **THEN** the API SHALL respond 400 with a message stating the email is already registered and create no user

#### Scenario: Weak password rejected
- **WHEN** the supplied password is shorter than 8 characters
- **THEN** the API SHALL respond 422 and create no user

#### Scenario: Non-admin forbidden
- **WHEN** a non-admin (patient, doctor, national admin, or unauthenticated caller) calls the create-user endpoint
- **THEN** the API SHALL respond 403 (or 401 when unauthenticated) and create no user

### Requirement: Admin-created accounts are audited
The system SHALL append an immutable audit entry for every admin-created account recording the acting admin, the new user, and the role granted.

#### Scenario: Creation audited
- **WHEN** an admin successfully creates a user
- **THEN** an audit entry SHALL exist whose actor is the admin, whose target is the new user, and whose action identifies admin provisioning with the granted role

### Requirement: Create-user action in the admin dashboard
The admin dashboard Users view SHALL offer a "Create user" action that opens a form for the fields above, shows the doctor profile fields only when role doctor is selected, reports validation and server errors inline, and on success shows the new user in the list without a full page reload.

#### Scenario: Successful creation from dashboard
- **WHEN** an admin completes the create-user form with role national_admin and submits
- **THEN** the dialog SHALL close, a success message SHALL be shown, and the new user SHALL appear in the users list with the National Admin badge

#### Scenario: Server error surfaced
- **WHEN** the create-user request fails (for example duplicate email)
- **THEN** the form SHALL stay open and display the server's error message next to the relevant field or at the top of the form

#### Scenario: Doctor fields toggle
- **WHEN** the admin switches the role select between doctor and another role
- **THEN** the doctor profile fields SHALL appear only while doctor is selected and SHALL NOT be submitted for other roles
