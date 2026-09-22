# EHR Summarization Specification

## Purpose
Allow assigned doctors to generate an on-demand LLM clinical summary of a patient's health record, store it with a timestamp, and regenerate it when needed.

## Requirements

### Requirement: On-Demand Doctor Summary
The system SHALL let an assigned doctor generate a concise clinical prose summary (about 1–2 paragraphs) for a patient record via `POST /v1/doctor/patients/{record_id}/summarize`, and SHALL store `ehr_summary` and `ehr_summary_at` on the record.

#### Scenario: Generate summary
- **WHEN** an assigned doctor triggers summarization on an assigned record
- **THEN** the API SHALL return the updated record with summary text and timestamp populated

#### Scenario: Regenerate overwrites
- **WHEN** a doctor regenerates a summary for a record that already has one
- **THEN** the new summary and timestamp SHALL replace the previous values

### Requirement: Assignment and Role Enforcement
Only the assigned doctor (doctor role) SHALL be able to summarize a record; other roles or unassigned doctors MUST be denied.

#### Scenario: Not a doctor
- **WHEN** a non-doctor calls the summarize endpoint
- **THEN** the API SHALL return 403

#### Scenario: Record not assigned
- **WHEN** a doctor requests summarization for a record not assigned to them
- **THEN** the API SHALL return 404 (or equivalent denial without leaking the record)

### Requirement: Feature Flag Gate
When `ENABLE_EHR_SUMMARY` is false, summarization MUST return HTTP 503 and MUST NOT generate a new summary.

#### Scenario: Feature disabled
- **WHEN** EHR summary is disabled and a doctor clicks generate
- **THEN** the API SHALL respond 503 with a disabled detail

### Requirement: Doctor UI Affordance
The doctor read-only EHR view SHALL provide Generate Summary / Regenerate controls and SHALL display the stored summary with its timestamp when present.

#### Scenario: Summary visible after generation
- **WHEN** a summary exists on the record
- **THEN** the doctor EHR view SHALL show the summary text and when it was generated

### Requirement: Audit and Privacy
Successful summarization SHALL write an audit action, and application logs MUST NOT include the full summary body or unnecessary patient PII.

#### Scenario: Audited success
- **WHEN** summarization succeeds
- **THEN** an `ehr_summary_generated` (or equivalent) audit entry SHALL be recorded for the actor and record
