## Purpose

Lets administrators download the doctor and patient datasets as CSV for review, backup, or re-import, without leaking credentials.

## ADDED Requirements

### Requirement: Doctor export
The system SHALL provide an administrator-only endpoint that returns all doctors (account plus profile) as a CSV download using the same column names as the doctor import file, except that the password hash column MUST NOT be present. Affiliations SHALL be joined with semicolons.

#### Scenario: Admin exports doctors
- **WHEN** an administrator requests the doctor export
- **THEN** the response SHALL be a CSV attachment with one row per doctor and no password hash

#### Scenario: Non-admin denied
- **WHEN** a patient, doctor, or unauthenticated client requests the export
- **THEN** the system SHALL respond 403 (authenticated) or 401 (unauthenticated) and return no data

### Requirement: Patient record export
The system SHALL provide an administrator-only endpoint that returns all patient records as a CSV download using the same column names and value formats as the patient import file, so an exported file can be re-ingested. Large exports SHALL be streamed rather than built fully in memory.

#### Scenario: Admin exports patients
- **WHEN** an administrator requests the patient export
- **THEN** the response SHALL be a CSV attachment with one row per record

#### Scenario: Round trip
- **WHEN** the exported patient CSV is ingested into an empty database
- **THEN** the resulting records SHALL equal the originals on all imported fields

#### Scenario: Cells beginning with a formula character
- **WHEN** a text value starts with =, +, - or @
- **THEN** the export SHALL neutralize it so spreadsheet software does not execute it

### Requirement: Export auditing
Every export request that succeeds SHALL append an audit log entry naming the administrator and the dataset exported. A denied request MUST NOT produce an export entry.

#### Scenario: Audited export
- **WHEN** an administrator exports patients
- **THEN** an audit entry for that export SHALL exist with the administrator's id
