## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: District Choropleth Map
The national dashboard SHALL display a spatial risk matrix / prevalence visualization for the selected Bangladesh administrative scope (driven by anonymized rates where available), loadable as part of the national home without requiring a separate route.

#### Scenario: Map visible from national home
- **WHEN** a national admin opens the national dashboard
- **THEN** they SHALL see the spatial risk visualization reflecting current or selected-scope aggregate metrics

#### Scenario: Empty data state
- **WHEN** no scored records exist yet
- **THEN** the spatial visualization SHALL render an empty or zero-data state without erroring

### Requirement: Resource Allocation View
The system MAY continue to expose resource-allocation estimates via API, but the national home MUST NOT present resource allocation as a primary RSGI panel; if shown, it SHALL be secondary to the RSGI forecast and spatial sections. When shown, each district with available forecast or burden data SHALL show estimated clinic, medicine, and testing-kit needs.

#### Scenario: Resource table shown
- **WHEN** a national admin opens the resource allocation section
- **THEN** each district with available forecast or burden data SHALL show estimated clinic, medicine, and testing-kit needs

#### Scenario: Primary home is RSGI
- **WHEN** a national admin opens the national dashboard
- **THEN** resource allocation SHALL NOT displace the RSGI spatial, chart, or forecast sections as the main content
