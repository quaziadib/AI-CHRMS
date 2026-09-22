## Purpose

Ensure no personally identifiable information leaves patient-scoped storage when feeding national aggregates, forecasts, exports, or LLM pattern analysis.

## ADDED Requirements

### Requirement: PII Exclusion From National Pipelines
The system MUST exclude patient identifiers and contact fields (including name, email, user id, and free-text fields that may contain identifying content) from any dataset used for national analytics, population forecasting, analytics export, or pattern discovery.

#### Scenario: Aggregate request uses anonymized rows only
- **WHEN** a national-admin analytics or map request is processed
- **THEN** the response SHALL contain only district-level (or coarser) counters and rates with no patient identifiers

#### Scenario: Export contains no PII
- **WHEN** a national admin downloads an analytics export
- **THEN** the file MUST NOT include name, email, user id, or other direct identifiers

### Requirement: Minimum Cell Size Suppression
The system SHALL suppress or coarsen any district metric whose underlying record count is below a configured minimum cell size so that small cohorts cannot be re-identified.

#### Scenario: Sparse district suppressed
- **WHEN** a district has fewer contributing records than the configured minimum
- **THEN** the API SHALL omit or mark that district's detailed rates as suppressed rather than returning raw small counts that enable re-identification

### Requirement: Anonymization Auditable
The system SHALL record an audit event when national aggregates are exported or when pattern discovery runs against anonymized data.

#### Scenario: Export audited
- **WHEN** a national admin successfully exports analytics
- **THEN** an audit log entry SHALL record the actor, action, and timestamp without storing the export file contents as PII
