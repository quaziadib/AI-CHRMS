# Health Forecasting Specification

## Purpose
Forecast a patient's blood glucose trajectory up to six months ahead via background jobs (Celery/Redis with sync fallback) and display results on the patient progression chart.

## Requirements

### Requirement: Async Forecast Jobs
The system SHALL enqueue blood-glucose forecast jobs with status lifecycle `pending` → `running` → `completed` | `failed`, and SHALL return job metadata for polling without blocking the HTTP request on model fit when the queue is available.

#### Scenario: Enqueue forecast
- **WHEN** an authorized owner requests a forecast for a scored record
- **THEN** the API SHALL accept the job (202) with a pending/running status suitable for polling

#### Scenario: Sync fallback
- **WHEN** Celery enqueue fails (e.g. broker unavailable)
- **THEN** the system SHALL run the forecast in-process so development and degraded environments still obtain a result

### Requirement: Forecast Result Content
Completed jobs SHALL store a result including model type (`arima` | `trend` | `synthetic`), a patient-facing summary, and time series points labeled actual vs forecast spanning a six-month horizon.

#### Scenario: Enough history for ARIMA
- **WHEN** sufficient glucose snapshots exist
- **THEN** the job SHOULD prefer an ARIMA-based forecast and mark points accordingly

#### Scenario: Sparse data
- **WHEN** historical points are insufficient for ARIMA
- **THEN** the job SHALL fall back to linear trend or synthetic series rather than failing solely for sparse data

### Requirement: Latest Forecast APIs
The system SHALL expose endpoints to start a forecast, fetch a job by id, and fetch the latest forecast for a record, requiring ownership and a present risk level.

#### Scenario: Get latest completed
- **WHEN** at least one completed job exists for the record
- **THEN** the latest endpoint SHALL return that job's result for charting

#### Scenario: Feature disabled or unauthorized
- **WHEN** `ENABLE_FORECASTING` is false, or the caller is not the owner
- **THEN** the API SHALL return 503 or 403 respectively

### Requirement: Progression Chart Polling
The patient UI SHALL display a progression chart and poll while a job is pending/running so results appear without a full page reload.

#### Scenario: Chart updates after completion
- **WHEN** a forecast job transitions to completed
- **THEN** the chart SHALL render actual and forecast glucose points from the job result

### Requirement: Isolation and Privacy
Forecast job failures MUST NOT affect record CRUD. Task logs MUST avoid PHI beyond record/job identifiers.

#### Scenario: Failed job does not corrupt record
- **WHEN** a forecast job fails
- **THEN** the patient record SHALL remain intact and the job SHALL be marked failed with an error suitable for UI/debug
