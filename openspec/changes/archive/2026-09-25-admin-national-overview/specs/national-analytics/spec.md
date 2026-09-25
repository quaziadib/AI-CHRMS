## MODIFIED Requirements

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
