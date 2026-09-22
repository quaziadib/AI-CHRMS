# National Analytics Specification

## Purpose
Give national admins a privacy-safe dashboard with district prevalence views, resource allocation insights, and downloadable aggregate reports for policy use.

## Requirements

### Requirement: National Admin Access Control
National analytics APIs and the national dashboard MUST be available only to authenticated users with the `national_admin` role (and system maintainers/admins if explicitly granted). Other roles MUST be denied.

#### Scenario: National admin loads dashboard data
- **WHEN** a national admin requests national analytics endpoints
- **THEN** the system SHALL return aggregate payloads

#### Scenario: Unauthorized role denied
- **WHEN** a patient or doctor calls a national analytics endpoint
- **THEN** the system SHALL deny the request (403)

### Requirement: District Aggregate Metrics
The system SHALL expose anonymized per-district metrics including at least record count, high/moderate/low risk counts or rates, and latest available period, suitable for map and table views.

#### Scenario: District summary returned
- **WHEN** a national admin requests district metrics
- **THEN** the response SHALL include one entry per known district (subject to suppression rules) with aggregate risk distribution and no patient rows

### Requirement: District Choropleth Map
The national dashboard SHALL display a Bangladesh district choropleth (or equivalent district heat map) driven by anonymized prevalence or risk-rate metrics, loadable in one primary navigation action from the national home.

#### Scenario: Map visible from national home
- **WHEN** a national admin opens the national dashboard
- **THEN** they SHALL see a district heat map reflecting current aggregate metrics without further navigation beyond the national home

#### Scenario: Empty data state
- **WHEN** no scored records exist yet
- **THEN** the map SHALL render an empty or zero-data state without erroring

### Requirement: Resource Allocation View
The system SHALL present resource-allocation estimates by district (clinics, medicines, testing kits) derived from population forecasts or current high-risk burden using documented conversion rules.

#### Scenario: Resource table shown
- **WHEN** a national admin opens the resource allocation section
- **THEN** each district with available forecast or burden data SHALL show estimated clinic, medicine, and testing-kit needs

### Requirement: Analytics Export
The system SHALL allow national admins to download anonymized analytics as CSV within 10 seconds for the default district summary export under normal load. PDF MAY be offered as an additional format.

#### Scenario: CSV export succeeds
- **WHEN** a national admin requests a CSV export of district analytics
- **THEN** the system SHALL return a downloadable CSV of anonymized aggregates within 10 seconds under normal load

#### Scenario: Feature disabled
- **WHEN** national analytics is disabled via feature flag
- **THEN** national analytics and export endpoints SHALL return 503
