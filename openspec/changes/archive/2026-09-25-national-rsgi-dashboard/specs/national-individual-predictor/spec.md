## Purpose

Let national admins run a what-if individual diabetes risk prediction from clinical inputs, scored by an LLM rather than classical ML models such as XGBoost.

## ADDED Requirements

### Requirement: Individual Predictor Form
The national dashboard SHALL provide an Individual Risk Predictor form accepting age, gender, BMI, fasting glucose, family history, and physical activity level, restricted to national-admin (or admin) users.

#### Scenario: Submit valid inputs
- **WHEN** a national admin submits valid predictor inputs
- **THEN** the system SHALL return a structured prediction for display on the national page

#### Scenario: Unauthorized denied
- **WHEN** a patient or doctor calls the individual predictor endpoint
- **THEN** the system SHALL deny the request (403)

### Requirement: LLM-Based Prediction Output
Individual predictions MUST be produced via the configured LLM provider and MUST NOT use XGBoost or other classical ensemble ML models. The response SHALL include at least probability percent, risk category/badge, confidence indicator, and top contributing factor labels.

#### Scenario: High-risk profile
- **WHEN** inputs indicate elevated age, BMI, glucose, family history, and low activity
- **THEN** the returned risk category SHALL be elevated (moderate or high) with factor labels naming dominant inputs

#### Scenario: Feature disabled
- **WHEN** the individual predictor feature flag is off
- **THEN** the endpoint SHALL return 503

### Requirement: No EHR Persistence
Submitting the individual predictor MUST NOT create or modify patient health records.

#### Scenario: Predict without record write
- **WHEN** a prediction completes successfully
- **THEN** no new patient record SHALL be created from that request alone
