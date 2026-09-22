## Purpose

Forecast district-level diabetes case counts over 6- and 12-month horizons so national admins can plan capacity from anonymized trends.

## ADDED Requirements

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

### Requirement: Forecast Drives Resource Estimates
Resource-allocation estimates on the national dashboard SHALL consume the latest completed population forecast (or current high-risk burden when forecast is unavailable) rather than individual patient identifiers.

#### Scenario: Resources update after forecast
- **WHEN** a new population forecast job completes successfully
- **THEN** resource-allocation views SHALL reflect the updated district projections on refresh
