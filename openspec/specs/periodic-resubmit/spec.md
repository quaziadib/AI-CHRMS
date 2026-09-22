# Periodic Resubmit Specification

## Purpose
Require patients to resubmit health assessments on an admin-configurable N-month interval, retain full multi-record history, and surface due status plus longitudinal trend charts.

## Requirements

### Requirement: Configurable Resubmit Interval
The system SHALL store a global `resubmit_interval_months` setting (1–36, default 6) in system settings and SHALL allow admins to read and update it via admin settings APIs.

#### Scenario: Admin updates interval
- **WHEN** an admin PATCHes a valid interval
- **THEN** the new interval SHALL apply globally and due dates SHALL recalculate from each patient's latest submission

#### Scenario: Non-admin blocked
- **WHEN** a non-admin calls admin settings update
- **THEN** the API SHALL deny the request

### Requirement: Eligibility and Enforcement
Patients SHALL learn eligibility via `GET /v1/records/resubmit-status`, and `POST /v1/records` MUST return 400 when a new submission is not yet due (except the first submission).

#### Scenario: First submission allowed
- **WHEN** a patient has zero prior records
- **THEN** `can_submit_new` SHALL be true and create SHALL succeed

#### Scenario: Too early to resubmit
- **WHEN** the patient already submitted within the interval window
- **THEN** create SHALL be rejected with 400 and the health form UI SHALL block submission

### Requirement: Status Banner States
Resubmit status SHALL distinguish `initial`, `current`, `upcoming` (within 14 days of due), and `due`, and the patient UI SHALL present a banner reflecting that state.

#### Scenario: Upcoming window
- **WHEN** the next due date is within 14 days and not yet past
- **THEN** status SHALL be `upcoming` and the banner SHALL warn the patient

### Requirement: Multi-Record Retention and Continuity
Each resubmit SHALL create a new patient record (prior records retained). When a prior record had a doctor assignment, the new record SHOULD copy that assignment for care continuity.

#### Scenario: History preserved
- **WHEN** a patient successfully resubmits after due
- **THEN** both old and new records SHALL remain queryable for trends

### Requirement: Longitudinal Trends
The system SHALL expose `GET /v1/records/history/trends` returning all submissions ascending with key vitals and risk, and the dashboard SHALL chart glucose, BMI, BP, and risk across submissions.

#### Scenario: Trends for charts
- **WHEN** a patient with multiple submissions opens the dashboard trends view
- **THEN** charts SHALL plot values from every retained submission in chronological order
