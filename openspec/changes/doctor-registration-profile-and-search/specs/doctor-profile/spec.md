## Purpose

Defines the professional profile that only doctors carry, so patients can find the right clinician and admins can vet doctor role requests, without adding those fields to non-doctor accounts.

## ADDED Requirements

### Requirement: Doctor profile data
A doctor SHALL have exactly one profile consisting of specialization (required), affiliations (zero or more), division (required), district (required), location (required free text), and an optional ID picture reference. Name, email, phone, password, active and verified state SHALL remain properties of the account and MUST NOT be duplicated in the profile. Accounts that are not doctors and have no doctor request SHALL NOT have a profile.

#### Scenario: Profile created with doctor registration
- **WHEN** a user registers as a doctor with all required profile fields
- **THEN** the system SHALL store one profile linked to that account

#### Scenario: Patient account has no profile
- **WHEN** a user registers as a patient
- **THEN** the system SHALL NOT create a doctor profile

#### Scenario: Profile removed with account
- **WHEN** an account is deleted
- **THEN** its doctor profile SHALL be deleted too

### Requirement: Profile access control
Doctor profile details SHALL be visible to the owning doctor, to administrators, and (summary fields only: specialization, affiliations, division, district, location) to authenticated patients searching doctors. The ID picture reference MUST NOT be returned to patients or doctors other than the owner.

#### Scenario: Patient sees summary only
- **WHEN** a patient searches doctors
- **THEN** results SHALL include specialization, affiliations, division, district and location and SHALL NOT include the ID picture

#### Scenario: Unauthenticated access denied
- **WHEN** an unauthenticated client requests doctor profile data
- **THEN** the API SHALL return 401

### Requirement: Backfill of existing doctors
On rollout the system SHALL create a profile with placeholder values for every existing doctor account that lacks one, without altering existing profiles, and the operation SHALL be safe to run repeatedly.

#### Scenario: Existing doctor gets placeholder profile
- **WHEN** the migration runs and a doctor account has no profile
- **THEN** a profile SHALL be created with non-empty specialization, division, district and location values

#### Scenario: Rerun is a no-op
- **WHEN** the migration runs again
- **THEN** no profile SHALL be duplicated or overwritten

#### Scenario: Non-doctors untouched
- **WHEN** the migration runs
- **THEN** accounts without the doctor role and without a pending doctor request SHALL NOT receive a profile
