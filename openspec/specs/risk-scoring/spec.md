# Risk Scoring Specification

## Purpose
Provide patients with an LLM-generated diabetes risk assessment (level, explanation, and brief tips) after health form submission, persisted for the dashboard.

## Requirements

### Requirement: Structured Risk Assessment on Submit
The system SHALL compute a structured diabetes risk assessment when a patient submits a health record, returning risk level (`low` | `moderate` | `high`), a plain-language explanation, and brief recommendations, and SHALL persist the result on that record.

#### Scenario: Successful scoring after form submit
- **WHEN** an authenticated patient creates or updates a health record and risk scoring runs successfully
- **THEN** the record SHALL store `risk_level`, `risk_explanation`, recommendations tips, and `risk_scored_at`, and the client SHALL show the assessment inline after submit

#### Scenario: Dashboard reflects latest assessment
- **WHEN** the patient opens their dashboard after a scored record exists
- **THEN** the risk widget SHALL display the most recent record's stored risk level and explanation

### Requirement: Risk Score API
The system SHALL expose `POST /v1/records/{id}/risk-score` for authenticated record owners (or admins) to compute or refresh a risk assessment for an existing record.

#### Scenario: Owner requests score
- **WHEN** the record owner calls the risk-score endpoint with a valid record id
- **THEN** the system SHALL return the updated record including the new risk fields

#### Scenario: Unauthorized access
- **WHEN** a user who does not own the record and is not an admin calls the risk-score endpoint
- **THEN** the system SHALL deny the request (403 or 404 per API policy)

### Requirement: Provider-Agnostic LLM
The system SHALL invoke risk scoring through a configurable LLM provider (`LLM_PROVIDER`) without requiring code changes to swap providers, and SHALL use structured parsing (not free-form string scraping) for the assessment fields.

#### Scenario: Provider configured via environment
- **WHEN** `LLM_PROVIDER` is set to a supported value with the matching API key present
- **THEN** risk scoring SHALL complete using that provider and return a valid structured assessment

### Requirement: Scoring Failure Isolation
The system SHOULD isolate LLM failures so that record persistence is not blocked solely by a scoring outage; when scoring fails after save, the client SHALL surface a recoverable error for the score step without losing the submitted record data.

#### Scenario: LLM unavailable during score call
- **WHEN** the risk-score chain fails due to provider error
- **THEN** the API SHALL return a failure status for scoring (e.g. 502) and SHALL NOT invent a risk level
