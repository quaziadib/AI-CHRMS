## MODIFIED Requirements

### Requirement: National Admin Placeholder
National admin users SHALL reach a live National Health Dashboard at their role home that presents Phase 3 national analytics (district map, forecasts, resource allocation, exports, and pattern insights when enabled), without access to patient-owned health form submission flows.

#### Scenario: National admin lands
- **WHEN** a national admin authenticates and opens their home
- **THEN** they SHALL see the National Health Dashboard (not a Phase 3 placeholder) and profile navigation

#### Scenario: No patient form in national nav
- **WHEN** a national admin views primary navigation
- **THEN** patient health-form submission SHALL NOT appear as a primary destination
