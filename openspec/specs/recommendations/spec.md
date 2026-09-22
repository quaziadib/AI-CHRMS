# Recommendations Specification

## Purpose
Generate rich, categorized lifestyle recommendations (diet, exercise, lifestyle, monitoring) for a scored health record via a dedicated, feature-flagged LLM chain.

## Requirements

### Requirement: Categorized Recommendations Output
The system SHALL produce structured recommendations with a summary and categories for diet, exercise, lifestyle, and monitoring, and SHALL store them on the patient record for display in patient and admin views.

#### Scenario: Successful generation
- **WHEN** recommendations are generated for a record with a risk assessment context
- **THEN** the record's recommendations field SHALL contain a summary plus categorized tip lists suitable for UI section rendering

### Requirement: Dedicated Recommendations Endpoint
The system SHALL expose `POST /v1/records/{id}/recommendations` so recommendations can be generated independently of risk scoring, and SHALL also allow the service layer to trigger generation after successful risk scoring.

#### Scenario: Standalone refresh
- **WHEN** an authorized owner or admin calls the recommendations endpoint for a valid record
- **THEN** the system SHALL regenerate and persist categorized recommendations on that record

#### Scenario: Unauthorized caller
- **WHEN** a user without ownership or admin rights calls the endpoint
- **THEN** the system SHALL deny the request

### Requirement: Feature Flag Gate
When `ENABLE_RECOMMENDATIONS` is false, the system MUST reject recommendations generation with HTTP 503 and MUST NOT overwrite the record with new categorized recommendations.

#### Scenario: Feature disabled
- **WHEN** `ENABLE_RECOMMENDATIONS` is false and a client calls the recommendations endpoint
- **THEN** the response SHALL be 503 with a clear disabled detail message

### Requirement: Non-Blocking Failure
Recommendations generation failure SHALL NOT fail the underlying risk score or record save; on chain failure the recommendations field MAY remain null while risk fields remain stored.

#### Scenario: Chain fails after risk score
- **WHEN** risk scoring succeeds but the recommendations chain errors
- **THEN** the record SHALL retain the risk assessment and SHALL leave recommendations unset or unchanged rather than failing the whole submission

### Requirement: Auditability
The system SHALL record an audit action when recommendations are successfully generated for a record.

#### Scenario: Successful call audited
- **WHEN** recommendations generation completes successfully
- **THEN** an audit entry for recommendations generation SHALL be written with actor and entity identifiers
