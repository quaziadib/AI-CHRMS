# Population Forecasting Specification

## Purpose
Forecast district-level diabetes case counts over 6- and 12-month horizons so national admins can plan capacity from anonymized trends.

## Requirements

### Requirement: District Case Forecasts
The system SHALL produce anonymized district-level forecasts of diabetes-relevant case counts for 6-month and 12-month horizons, based on historical anonymized aggregates (not raw patient rows).

#### Scenario: Forecast available for a district with history
- **WHEN** a national admin requests population forecasts and a district has sufficient historical aggregate points
- **THEN** the response SHALL include projected counts for 6- and 12-month horizons for that district

#### Scenario: Insufficient history fallback
- **WHEN** a district lacks enough historical points for a statistical model
- **THEN** the system SHALL return a documented fallback (for example flat or linear trend) or an explicit unavailable status for that district without failing the whole response

### Requirement: Async Forecast Jobs
Population forecast computation SHALL run asynchronously when enabled, with a pollable job status, and MUST fall back to in-process execution if the job queue cannot accept work.

#### Scenario: Job completes and results readable
- **WHEN** a national admin enqueues a population forecast job and it completes
- **THEN** subsequent read APIs SHALL return the latest completed forecast results for the dashboard

#### Scenario: Feature flag off
- **WHEN** population forecasting is disabled
- **THEN** enqueue endpoints SHALL return 503

### Requirement: Multi-Year Urban Rural Forecast
The national dashboard SHALL present a multi-year epidemic trajectory chart with urban and rural risk projection series for a documented horizon (covering recent history through a future planning year such as 2035).

#### Scenario: Forecast chart visible
- **WHEN** a national admin views the epidemic forecast section and forecasting is enabled
- **THEN** urban and rural projection series SHALL be displayed for the documented years

### Requirement: Population Risk Group Cards
The national dashboard SHALL show population share cards for low-risk, prediabetes/at-risk, and high-risk/active type-2 groups with short guidance text suitable for policy readers.

#### Scenario: Cards render with shares
- **WHEN** forecast or aggregate synthesis is available
- **THEN** three risk-group cards SHALL display population share percentages and brief recommendations

### Requirement: LLM Forecast Generation
National epidemic forecast generation MUST use the configured LLM (structured output) over anonymized inputs and MUST NOT use XGBoost or ARIMAX/ARIMA as the primary prediction engine for this national forecast panel.

#### Scenario: LLM forecast request
- **WHEN** a national admin requests (or the dashboard loads) an epidemic forecast while forecasting is enabled
- **THEN** the system SHALL return structured urban/rural series and risk-group shares produced via LLM

#### Scenario: Forecasting disabled
- **WHEN** population forecasting is disabled
- **THEN** forecast generation endpoints SHALL return 503

### Requirement: Division Forecast Explorer
The national dashboard SHALL let authorized national admins view a forecast for one Bangladesh division or compare all divisions, with the same annual forecast data available in chart and table form through 2035. Division selection from the burden map or ranking table SHALL update the forecast scope.

#### Scenario: View one division forecast
- **WHEN** a national admin selects one division and a forecast is available
- **THEN** the explorer SHALL show sourced historical observations when available and future urban/rural projections through 2035 when supported by stratified inputs, and SHALL identify the selected division and forecast horizon

#### Scenario: Compare all divisions
- **WHEN** a national admin selects the all-divisions comparison
- **THEN** the explorer SHALL show comparable series for divisions with sufficient aggregate inputs and mark unavailable or suppressed divisions without exposing small-cell values

#### Scenario: Switch chart and table views
- **WHEN** a national admin switches between chart and table
- **THEN** both views SHALL present the same years, values, division scope, and observed-versus-projected labels

#### Scenario: Historical years are unavailable
- **WHEN** no validated historical aggregate exists for one or more years in the requested range
- **THEN** the explorer SHALL leave those observations unavailable and SHALL NOT ask the LLM to invent historical values

#### Scenario: Urban/rural inputs are unavailable
- **WHEN** anonymized inputs do not contain a validated urban/rural stratification
- **THEN** the explorer SHALL mark the split as unavailable or use a clearly labeled aggregate series; it SHALL NOT present an unsupported split as observed data

#### Scenario: Insufficient forecast baseline
- **WHEN** a division does not have enough unsuppressed aggregate history to support a projection
- **THEN** the explorer SHALL show an unavailable state and the forecast job SHALL NOT return invented projections for that division

### Requirement: Division Forecast Provenance and Privacy
Division forecast jobs MUST use anonymized, suppression-aware aggregate inputs and the configured LLM for future projections. Results MUST distinguish sourced observations from generated projections and MUST NOT expose patient-level data or claim population prevalence without a validated denominator.

#### Scenario: Forecast job completes
- **WHEN** a national admin requests a division forecast while population forecasting is enabled
- **THEN** the job SHALL return scoped, structured series with observation/projection provenance and the projection horizon

#### Scenario: Forecast job is disabled
- **WHEN** population forecasting is disabled
- **THEN** division forecast request endpoints SHALL return 503

#### Scenario: Unauthorized forecast request
- **WHEN** a patient or doctor requests a division forecast
- **THEN** the system SHALL deny the request with 403

#### Scenario: Sparse data for a division
- **WHEN** a division's inputs do not meet the minimum-cell-size requirement
- **THEN** its forecast SHALL be omitted or marked unavailable without exposing the underlying small-cell values

### Requirement: Forecast Drives Resource Estimates
Resource-allocation estimates, when used, SHALL consume anonymized forecast outputs or current high-risk burden rather than individual patient identifiers. Resource allocation remains secondary to the RSGI national home forecast panel.

#### Scenario: Resources update after forecast
- **WHEN** a new population forecast job completes successfully
- **THEN** resource-allocation views SHALL reflect the updated district projections on refresh

#### Scenario: Resources use anonymized projections
- **WHEN** resource estimates are computed after a forecast exists
- **THEN** they SHALL use anonymized district or national projections without patient identifiers
