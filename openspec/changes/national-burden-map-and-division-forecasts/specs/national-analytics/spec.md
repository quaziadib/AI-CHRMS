## MODIFIED Requirements

### Requirement: District Choropleth Map
The national dashboard SHALL display an interactive Bangladesh burden map with division-level and district-level boundaries, driven by suppression-aware anonymized aggregate metrics. The map SHALL be available from the national home and support division-to-district drill-down and return to the division overview. After a division is selected, its responsive in-map district legend SHALL list only districts represented by stored records. Mapped metrics SHALL be identified as rates among submitted health records unless a validated population denominator is available.

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

## ADDED Requirements

### Requirement: Map Aggregate Privacy and Provenance
National map and ranking payloads MUST contain only allowlisted, anonymized aggregate fields. They MUST NOT imply national population prevalence, diagnosed-patient counts, sample sizes, or official statistics unless those values come from a validated and identified source.

#### Scenario: Aggregate payload returned
- **WHEN** a national admin requests map or ranking data
- **THEN** the response SHALL exclude patient identifiers and fields and SHALL identify the metric basis and suppression threshold

#### Scenario: Population denominator unavailable
- **WHEN** no validated population denominator exists for a map region
- **THEN** the dashboard SHALL show submitted-record metrics or an unavailable state and SHALL NOT show population estimates derived from mock values
