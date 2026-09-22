## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Forecast Drives Resource Estimates
Resource-allocation estimates, when used, SHALL consume anonymized forecast outputs or current high-risk burden rather than individual patient identifiers. Resource allocation remains secondary to the RSGI national home forecast panel.

#### Scenario: Resources update after forecast
- **WHEN** a new population forecast job completes successfully
- **THEN** resource-allocation views SHALL reflect the updated district projections on refresh

#### Scenario: Resources use anonymized projections
- **WHEN** resource estimates are computed after a forecast exists
- **THEN** they SHALL use anonymized district or national projections without patient identifiers
