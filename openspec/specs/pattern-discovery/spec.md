# Pattern Discovery Specification

## Purpose
Surface LLM-generated insights about anonymized diabetes risk patterns and correlations for national admins without exposing patient-level data.

## Requirements

### Requirement: Anonymized-Only LLM Input
Pattern discovery MUST send only anonymized aggregate statistics (and optional coarse categorical breakdowns that pass minimum cell-size rules) to the LLM. It MUST NOT send names, emails, user ids, or free-text clinical notes.

#### Scenario: Pattern run uses aggregates
- **WHEN** a national admin requests pattern discovery
- **THEN** the system SHALL build the LLM prompt exclusively from anonymized aggregates that passed suppression rules

### Requirement: On-Demand Pattern Insights
The system SHALL provide an on-demand pattern discovery action that returns a structured set of insight statements (and optional confidence/caveat text) for display on the national dashboard.

#### Scenario: Successful insight generation
- **WHEN** anonymized aggregates exist and pattern discovery is enabled
- **THEN** the system SHALL return one or more insight statements suitable for national-admin display

#### Scenario: No aggregate data
- **WHEN** there is insufficient anonymized data to analyze
- **THEN** the system SHALL return a clear empty/insufficient-data response without calling the LLM unnecessarily

### Requirement: Feature Flag And Audit
Pattern discovery SHALL be gated by a feature flag and SHALL write an audit event on each successful run.

#### Scenario: Disabled returns 503
- **WHEN** pattern discovery is disabled
- **THEN** the endpoint SHALL return 503

#### Scenario: Successful run audited
- **WHEN** pattern discovery completes successfully
- **THEN** an audit log entry SHALL record the actor and action
