## Purpose

Lets operators load the doctor and patient datasets into any environment (local or production) repeatably and safely, without relying on startup seeding.

## ADDED Requirements

### Requirement: Doctor dataset ingestion
The system SHALL ingest each doctor row of the doctor CSV as one doctor account (name, email, phone, active and verified flags, doctor role) with one doctor profile (specialization, affiliations, division, district, location, optional ID picture path). Affiliations separated by semicolons SHALL become separate affiliation entries. The CSV row id SHALL be the account id. Ingested accounts MUST NOT be able to sign in with any password.

#### Scenario: New doctor loaded
- **WHEN** a doctor row whose id and email do not exist is ingested
- **THEN** the system SHALL create the account and its single profile with the row's values

#### Scenario: Multiple affiliations
- **WHEN** a row has affiliations "A; B"
- **THEN** the profile SHALL list two affiliations, A and B

#### Scenario: Ingested doctor cannot sign in
- **WHEN** anyone attempts to log in as an ingested doctor with any password
- **THEN** the system SHALL reject the attempt as invalid credentials, without error

#### Scenario: Email owned by another account
- **WHEN** a row's email already belongs to an account with a different id
- **THEN** the system SHALL reject that row, report it, and leave the existing account unchanged

### Requirement: Patient dataset ingestion
The system SHALL ingest each patient CSV row as one patient record with all demographic, history, vital, lab, clinical and lifestyle fields. Allergies and symptoms SHALL be stored verbatim as the free text the application already uses (including any semicolons). Each distinct user id in the file SHALL have a patient account (non-loginable) so records belong to an existing account. Abnormality flags SHALL be computed as for any saved record.

#### Scenario: New patient loaded
- **WHEN** a patient row with an unseen pid is ingested
- **THEN** the system SHALL create the record linked to a patient account for its user id

#### Scenario: Blank optional fields
- **WHEN** allergies or pregnancies are blank
- **THEN** the record SHALL store them as absent, not as empty text or zero

#### Scenario: Out-of-range or malformed value
- **WHEN** a row has a non-numeric age or a missing required field
- **THEN** the system SHALL reject that row with its line number and reason, and continue with remaining rows

### Requirement: Idempotent re-runs
Re-running ingestion on the same files SHALL NOT create duplicates. Rows are matched by id (doctors) and pid (patients); matched rows SHALL be updated to the file values, and rows no longer in the file SHALL NOT be deleted. Admin-assigned doctor links and risk-scoring results on existing records MUST NOT be overwritten.

#### Scenario: Second run
- **WHEN** ingestion runs twice on unchanged files
- **THEN** the second run SHALL report zero inserts and the row counts in the database SHALL be unchanged

#### Scenario: Assigned doctor preserved
- **WHEN** an existing patient record has an admin-assigned doctor and ingestion updates it
- **THEN** the assigned doctor SHALL be unchanged

### Requirement: Dry run and reporting
Ingestion SHALL support a dry-run that makes no database changes and reports what would be inserted, updated, or rejected. Every run SHALL print per-file counts and rejection reasons, and exit non-zero if any file cannot be read or the target database is unreachable. A real run SHALL be atomic per file: a failure mid-file MUST leave no partial file load.

#### Scenario: Dry run
- **WHEN** ingestion runs in dry-run mode
- **THEN** the database SHALL be unchanged and the report SHALL show planned counts

#### Scenario: Unreadable file
- **WHEN** the CSV path does not exist
- **THEN** ingestion SHALL exit with an error and change nothing

### Requirement: Environment-agnostic targeting
Ingestion SHALL run against whichever database the configured connection string points to, in local and production, and SHALL NOT depend on the startup seeding flags. It MUST echo the target database host (not credentials) before writing.

#### Scenario: Production run
- **WHEN** an operator runs ingestion with the production connection string
- **THEN** data SHALL load without enabling any seed flag, and output SHALL name the target host
