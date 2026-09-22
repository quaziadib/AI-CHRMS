# Personalized Plans Specification

## Purpose
Generate Bangladesh-appropriate 7-day meal plans and weekly exercise routines from a patient's scored health profile, store them on the record, and show them in a scannable patient UI.

## Requirements

### Requirement: Structured Weekly Plan
The system SHALL generate a personalized plan containing meal-plan and exercise summaries plus day-level meals (breakfast/lunch/dinner/snack) and exercise sessions (activity, duration, notes), tailored to risk level and Bangladesh food context.

#### Scenario: Successful plan generation
- **WHEN** a plan is generated for a record that has a risk level
- **THEN** the record SHALL store a structured personalized plan and a generation timestamp

### Requirement: Auto and Manual Triggers
The system SHALL auto-generate a plan after successful risk scoring on create/update (non-fatal on failure) and SHALL expose `POST /v1/records/{id}/personalized-plan` for owner/admin refresh.

#### Scenario: Manual refresh
- **WHEN** the record owner calls the personalized-plan endpoint
- **THEN** a new plan SHALL overwrite the previous plan on that record

#### Scenario: Missing risk level
- **WHEN** the record has no `risk_level`
- **THEN** the API SHALL return 400 and SHALL NOT invent a plan

### Requirement: Feature Flag Gate
When `ENABLE_PERSONALIZED_PLANS` is false, plan generation MUST return HTTP 503.

#### Scenario: Feature disabled
- **WHEN** personalized plans are disabled
- **THEN** the personalized-plan endpoint SHALL respond 503

### Requirement: Authorization and Failure Isolation
Only the record owner or an admin SHALL generate plans; unauthorized callers MUST be denied. Plan LLM failures SHALL NOT block record save or risk scoring.

#### Scenario: Unauthorized user
- **WHEN** another patient attempts to generate a plan for someone else's record
- **THEN** the API SHALL return 403

#### Scenario: Chain failure after risk score
- **WHEN** risk scoring succeeds but plan generation fails
- **THEN** the record and risk assessment SHALL remain saved

### Requirement: Patient UI Presentation
The patient records UI SHALL present plan summaries with a week-at-a-glance view and expandable full detail rather than dumping the entire plan as unbroken prose.

#### Scenario: Compact scan then expand
- **WHEN** a patient views a record with a personalized plan
- **THEN** they SHALL see summary cards and be able to expand for full day-by-day content
