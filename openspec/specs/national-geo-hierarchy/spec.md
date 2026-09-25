# National Geo Hierarchy Specification

## Purpose

Provide cascading Bangladesh administrative geography selection (division, district, upazilla, thana) that scopes national dashboard spatial panels.

## Requirements

### Requirement: Cascading Geo Filters
The national dashboard SHALL present cascading selectors for Division, District (Zila), Upazilla/Area, and Thana, where changing a parent level resets and repopulates child levels from a curated Bangladesh hierarchy.

#### Scenario: Division change updates districts
- **WHEN** a national admin selects a different division
- **THEN** the district selector SHALL update to that division's districts and deeper selectors SHALL refresh accordingly

#### Scenario: Reset regions
- **WHEN** a national admin activates reset regions
- **THEN** filters SHALL return to a documented default (e.g. Dhaka division) and dependent panels SHALL refresh

### Requirement: Geo Scope Drives Spatial Panels
Selected geography SHALL scope the spatial risk matrix title and hotspot cards to the chosen administrative context.

#### Scenario: Map title reflects selection
- **WHEN** the national admin changes division or district filters
- **THEN** the spatial panel title/context SHALL reflect the selected region
