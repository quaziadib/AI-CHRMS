## ADDED Requirements

### Requirement: Doctor search when granting access
When choosing a doctor to grant access, a patient SHALL be able to search by free text and narrow results by filters. Search-by SHALL support name, email, specialization, affiliation, location, or all of these. Filters SHALL support specialization, division and district, and combine with the text query using AND. Matching SHALL be case-insensitive. Only active accounts with the approved doctor role SHALL appear. Results SHALL be ordered by name and paginated.

#### Scenario: Search by name
- **WHEN** a patient searches "rahman" with search-by name
- **THEN** only doctors whose name contains "rahman" SHALL be returned

#### Scenario: Search across all fields
- **WHEN** a patient searches "cardio" with search-by all
- **THEN** doctors matching in name, email, specialization, affiliation or location SHALL be returned

#### Scenario: Combined filters
- **WHEN** a patient filters division Dhaka and specialization Endocrinology
- **THEN** only doctors satisfying both SHALL be returned

#### Scenario: No match
- **WHEN** no doctor matches
- **THEN** the API SHALL return an empty list and the UI SHALL show an empty state

#### Scenario: Invalid search-by
- **WHEN** an unsupported search-by value is supplied
- **THEN** the API SHALL return a client error

#### Scenario: Pending or inactive doctor hidden
- **WHEN** an account has a pending doctor request or is deactivated
- **THEN** it SHALL NOT appear in results

#### Scenario: Non-patient denied
- **WHEN** a caller without patient access queries doctor search
- **THEN** the API SHALL deny the request

### Requirement: Doctor filter options
The system SHALL provide patients the distinct specialization, division and district values present among searchable doctors to populate filters.

#### Scenario: Options reflect searchable doctors
- **WHEN** a patient opens the doctor search
- **THEN** filter options SHALL list only values held by at least one searchable doctor

### Requirement: Doctor choice shows profile summary
Each search result SHALL show name, specialization, affiliations, district and division so the patient can choose, and SHALL leave the existing grant flow (pending until the doctor accepts) unchanged.

#### Scenario: Grant from result
- **WHEN** a patient selects a result and grants access
- **THEN** a pending grant SHALL be created exactly as before
