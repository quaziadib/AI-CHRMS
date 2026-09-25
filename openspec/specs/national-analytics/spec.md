# National Analytics Specification

## Purpose
Give national admins a privacy-safe dashboard with district prevalence views, resource allocation insights, and downloadable aggregate reports for policy use.

## Requirements

### Requirement: National Admin Access Control
National analytics APIs and the national dashboard MUST be available only to authenticated users with the `national_admin` role or an authorized system `admin` role. Other roles MUST be denied.

#### Scenario: National admin loads dashboard data
- **WHEN** a national admin requests national analytics endpoints
- **THEN** the system SHALL return aggregate payloads

#### Scenario: System administrator loads dashboard data
- **WHEN** an authenticated system administrator opens the national dashboard or requests national analytics endpoints
- **THEN** the system SHALL return the same privacy-safe aggregate dashboard data available to a national admin

#### Scenario: Unauthorized role denied
- **WHEN** a patient or doctor calls a national analytics endpoint
- **THEN** the system SHALL deny the request (403)

### Requirement: District Aggregate Metrics
The system SHALL expose anonymized per-district metrics including at least record count, high/moderate/low risk counts or rates, and latest available period, suitable for map and table views.

#### Scenario: District summary returned
- **WHEN** a national admin requests district metrics
- **THEN** the response SHALL include one entry per known district (subject to suppression rules) with aggregate risk distribution and no patient rows

### Requirement: RSGI National Home Layout
The national home SHALL present the RSGI flow as primary content: hierarchical geo filters, individual predictor beside spatial risk matrix, division-wise prevalence chart, gender/age demographics chart, and multi-year epidemic forecast with risk-group cards — using the application's existing design system components (not a separate portal chrome).

#### Scenario: National admin opens home
- **WHEN** a national admin opens `/national`
- **THEN** they SHALL see the RSGI section order above rather than resource allocation and pattern discovery as the primary panels

### Requirement: Spatial Risk Matrix
The national dashboard SHALL display a spatial risk matrix for the selected geography showing hotspot cards with prevalence rates and severity labels (e.g. high / mid / safe bands), plus a short regional metrics strip (growth, diagnosis age, screening coverage or equivalents derived from available anonymized data / documented synthesis).

#### Scenario: Hotspots for selected scope
- **WHEN** a geography is selected and spatial data is available
- **THEN** the matrix SHALL show multiple hotspot cards scoped to that selection with rate and severity labeling

#### Scenario: Empty anonymized data
- **WHEN** no anonymized aggregates exist for the selected district grain
- **THEN** the spatial panel SHALL show an empty or synthesis-limited state without exposing PII

### Requirement: Division Prevalence Chart
The national dashboard SHALL show a division-wise prevalence comparison chart across Bangladesh divisions.

#### Scenario: Chart renders
- **WHEN** a national admin views the analytics charts section
- **THEN** a division prevalence chart SHALL render with one series per division (or empty state)

### Requirement: Demographics Chart
The national dashboard SHALL show prevalence stratified by age band and gender.

#### Scenario: Demographics render
- **WHEN** a national admin views the demographics chart
- **THEN** the chart SHALL present age-band categories with male and female series (or empty state)

### Requirement: District Choropleth Map
The national dashboard SHALL display an interactive Bangladesh burden map with division-level and district-level boundaries, driven by suppression-aware anonymized aggregate metrics. The map SHALL be available from the national home and support division-to-district drill-down and return to the division overview. After a division is selected, its responsive in-map district legend SHALL list only districts represented by stored records. Mapped metrics SHALL be identified as rates among submitted health records unless a validated population denominator is available. The spatial risk matrix / prevalence visualization for the selected Bangladesh administrative scope SHALL also be loadable as part of the national home without requiring a separate route.

#### Scenario: National map visible from the national home
- **WHEN** an authorized national admin opens `/national`
- **THEN** the dashboard SHALL show the division boundary view and map legend without requiring another route

#### Scenario: Map visible from national home
- **WHEN** a national admin opens the national dashboard
- **THEN** they SHALL see the district heat map reflecting current aggregate metrics without further navigation beyond the national home

#### Scenario: Drill into a division
- **WHEN** a national admin selects a division on the map
- **THEN** the map SHALL zoom to that division's districts, expose a breadcrumb and return action, and synchronize the selected division with the dashboard forecast and geography controls

#### Scenario: District metrics shown
- **WHEN** anonymized district aggregates are available for the selected division
- **THEN** the map and responsive in-map district legend SHALL show only districts represented by stored records, apply the minimum-cell-size rule, and identify metrics as submitted-record aggregates

#### Scenario: Suppressed or unknown district
- **WHEN** a district has too few records, lacks a known geography mapping, or has no aggregate data
- **THEN** the map SHALL render it as suppressed or unavailable without showing an exact count or inferred rate

#### Scenario: Empty map data
- **WHEN** no scored district aggregates exist
- **THEN** the map SHALL show unavailable regions without failing or presenting mock values as observed data, and the in-map district legend SHALL appear only after a division is selected

#### Scenario: Empty data state
- **WHEN** no scored records exist yet
- **THEN** the map SHALL render an empty or zero-data state without erroring

#### Scenario: Boundary source attribution
- **WHEN** the map renders administrative boundaries
- **THEN** it SHALL provide visible attribution to the boundary data source and license associated with the bundled asset

### Requirement: Map Aggregate Privacy and Provenance
National map and ranking payloads MUST contain only allowlisted, anonymized aggregate fields. They MUST NOT imply national population prevalence, diagnosed-patient counts, sample sizes, or official statistics unless those values come from a validated and identified source.

#### Scenario: Aggregate payload returned
- **WHEN** a national admin requests map or ranking data
- **THEN** the response SHALL exclude patient identifiers and fields and SHALL identify the metric basis and suppression threshold

#### Scenario: Population denominator unavailable
- **WHEN** no validated population denominator exists for a map region
- **THEN** the dashboard SHALL show submitted-record metrics or an unavailable state and SHALL NOT show population estimates derived from mock values

### Requirement: Resource Allocation View
The system MAY continue to expose resource-allocation estimates via API, but the national home MUST NOT present resource allocation as a primary RSGI panel; if shown, it SHALL be secondary to the RSGI forecast and spatial sections. When shown, each district with available forecast or burden data SHALL show estimated clinic, medicine, and testing-kit needs.

#### Scenario: Resource table shown
- **WHEN** a national admin opens the resource allocation section
- **THEN** each district with available forecast or burden data SHALL show estimated clinic, medicine, and testing-kit needs

#### Scenario: Primary home is RSGI
- **WHEN** a national admin opens the national dashboard
- **THEN** resource allocation SHALL NOT displace the RSGI spatial, chart, or forecast sections as the main content

### Requirement: Analytics Export
The system SHALL allow national admins to download anonymized analytics as CSV within 10 seconds for the default district summary export under normal load. PDF MAY be offered as an additional format.

#### Scenario: CSV export succeeds
- **WHEN** a national admin requests a CSV export of district analytics
- **THEN** the system SHALL return a downloadable CSV of anonymized aggregates within 10 seconds under normal load

#### Scenario: Feature disabled
- **WHEN** national analytics is disabled via feature flag
- **THEN** national analytics and export endpoints SHALL return 503
