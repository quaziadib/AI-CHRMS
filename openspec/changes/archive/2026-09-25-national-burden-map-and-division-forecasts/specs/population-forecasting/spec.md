## ADDED Requirements

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
