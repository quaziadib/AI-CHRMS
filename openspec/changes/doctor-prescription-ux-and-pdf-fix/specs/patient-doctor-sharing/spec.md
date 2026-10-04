## MODIFIED Requirements

### Requirement: Longitudinal Patient Profile Contents
For each active grant, the system SHALL present the doctor with the patient's prior health records in a longitudinal profile. The profile UI SHALL NOT display patient-reported medication history or documented doctor interactions sections; the underlying data remains stored and available through the API.

#### Scenario: Doctor views complete shared history
- **WHEN** a doctor with an active grant opens a patient's profile
- **THEN** the doctor SHALL see the patient's prior health records and SHALL NOT see "Medication history" or "Doctor interactions" sections

#### Scenario: Doctor has no active grant
- **WHEN** a doctor without an active grant requests a patient's profile or any longitudinal history
- **THEN** the system SHALL deny access without returning patient profile data

### Requirement: Patient-Reported Medication History
The system SHALL retain patient-reported medication history data, including medication name and available dosage and start/end date details, as patient-reported history that SHALL NOT constitute a prescription or medication order. The doctor profile UI SHALL NOT display it.

#### Scenario: Patient adds medication history
- **WHEN** a patient records a medication entry
- **THEN** the system SHALL associate it with that patient's profile and make it visible to doctors only while they have an active grant

#### Scenario: Doctor views medication history
- **WHEN** an authorized doctor opens the patient's profile
- **THEN** no medication history section SHALL be rendered, and medication data SHALL NOT be presented as prescriptions issued by the system

### Requirement: Documented Doctor Interactions
The system SHALL retain existing doctor interaction records (append-only after creation) and their audit trail. Neither the doctor patient profile nor the patient Doctor-access page SHALL display interaction history or offer a form to add interactions.

#### Scenario: Doctor records an interaction
- **WHEN** a doctor with an active grant records an interaction through the API
- **THEN** the system SHALL associate the entry with the patient, doctor, and interaction date, with no UI surface required

#### Scenario: Doctor without active access records an interaction
- **WHEN** a doctor without an active grant attempts to add an interaction
- **THEN** the system SHALL deny the request and SHALL NOT create an interaction entry

#### Scenario: Patient views interaction history
- **WHEN** a patient opens the Doctor access page
- **THEN** no "Doctor interactions" card SHALL be shown
