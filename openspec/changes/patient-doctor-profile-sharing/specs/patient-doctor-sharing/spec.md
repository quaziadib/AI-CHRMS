## Purpose

Let patients control which doctors can see their longitudinal health profile, including prior health records, medication history, and documented clinical interactions, while preserving an auditable access history for administrators.

## ADDED Requirements

### Requirement: Patient-Initiated Doctor Access
The system SHALL allow an authenticated patient to grant a specific doctor access to their profile. A new grant SHALL begin in a pending state and SHALL NOT expose patient data to the doctor before the doctor accepts it. Only users with the doctor role may receive a grant.

#### Scenario: Patient grants a doctor access
- **WHEN** a patient selects a valid doctor and grants profile access
- **THEN** the system SHALL create a pending access request visible to that doctor and patient, without exposing the patient profile to the doctor

#### Scenario: Patient selects a non-doctor
- **WHEN** a patient attempts to grant profile access to a user without the doctor role
- **THEN** the system SHALL reject the request and SHALL NOT create an access grant

#### Scenario: Duplicate active or pending grant
- **WHEN** a patient attempts to create another grant for a doctor with a pending or active grant
- **THEN** the system SHALL reject the duplicate and preserve the existing grant state

### Requirement: Doctor Accepts or Declines Access
Only the doctor named in a pending patient grant SHALL be able to accept or decline it. Acceptance SHALL activate profile access; declining SHALL leave profile data inaccessible.

#### Scenario: Doctor accepts a pending grant
- **WHEN** the named doctor accepts a pending patient grant
- **THEN** the grant SHALL become active and the doctor SHALL be able to view that patient's profile

#### Scenario: Doctor declines a pending grant
- **WHEN** the named doctor declines a pending patient grant
- **THEN** the grant SHALL become declined and the doctor SHALL NOT be able to view the patient's profile

#### Scenario: Another doctor responds to a grant
- **WHEN** a doctor other than the named recipient attempts to accept or decline a pending grant
- **THEN** the system SHALL deny the action and SHALL preserve the pending grant

### Requirement: Patient Revokes Doctor Access
A patient SHALL be able to revoke an active grant at any time. Revocation SHALL immediately end the doctor's profile access while retaining the grant history for audit.

#### Scenario: Patient revokes active access
- **WHEN** a patient revokes an active doctor grant
- **THEN** the grant SHALL become revoked and subsequent doctor requests for that profile SHALL be denied

#### Scenario: Doctor attempts access after revocation
- **WHEN** a doctor requests a patient's profile after the patient revoked the grant
- **THEN** the system SHALL return an authorization failure without exposing profile data

### Requirement: Longitudinal Patient Profile Contents
For each active grant, the system SHALL present the doctor with the patient's prior health records, patient-reported medication history, and documented doctor interactions in a longitudinal profile. Medication history SHALL distinguish current from previous medication entries when that information is available.

#### Scenario: Doctor views complete shared history
- **WHEN** a doctor with an active grant opens a patient's profile
- **THEN** the doctor SHALL see the patient's prior health records, medication history, and documented doctor interactions

#### Scenario: Doctor has no active grant
- **WHEN** a doctor without an active grant requests a patient's profile or any longitudinal history
- **THEN** the system SHALL deny access without returning patient profile data

### Requirement: Patient-Reported Medication History
The system SHALL allow a patient to record and maintain their medication history, including medication name and available dosage and start/end date details. These entries SHALL be presented as patient-reported history and SHALL NOT constitute a prescription or medication order.

#### Scenario: Patient adds medication history
- **WHEN** a patient records a medication entry
- **THEN** the system SHALL associate it with that patient's profile and make it visible to doctors only while they have an active grant

#### Scenario: Doctor views medication history
- **WHEN** an authorized doctor views the patient's profile
- **THEN** the medication entries SHALL be identified as patient-reported and SHALL NOT be presented as prescriptions issued by the system

### Requirement: Documented Doctor Interactions
A doctor with active access SHALL be able to record a dated clinical interaction for the patient. The system SHALL retain interaction history and make it visible to the patient and to doctors with active access. Interaction entries SHALL be append-only after creation.

#### Scenario: Doctor records an interaction
- **WHEN** a doctor with an active grant records a clinical interaction
- **THEN** the system SHALL associate the entry with the patient, doctor, and interaction date and make it visible in the patient's interaction history

#### Scenario: Doctor without active access records an interaction
- **WHEN** a doctor without an active grant attempts to add an interaction
- **THEN** the system SHALL deny the request and SHALL NOT create an interaction entry

#### Scenario: Patient views interaction history
- **WHEN** a patient opens their profile history
- **THEN** the patient SHALL see their documented doctor interactions

### Requirement: Patient-Doctor Access Audit
The system SHALL retain an audit history of patient grants, doctor acceptances and declines, patient revocations, and doctor profile access events. Administrators SHALL be able to review these events. Audit entries SHALL identify the patient, doctor, event, actor, and timestamp without copying clinical profile contents into the audit entry.

#### Scenario: Administrator reviews access history
- **WHEN** an administrator views the patient-doctor access audit
- **THEN** the administrator SHALL see grant lifecycle and profile access events for the selected patient

#### Scenario: Doctor access is recorded
- **WHEN** a doctor successfully opens a patient's shared profile
- **THEN** the system SHALL record a profile access event in the audit history

#### Scenario: Patient revocation remains auditable
- **WHEN** a patient revokes a grant
- **THEN** the system SHALL retain the prior grant and access events for administrator review
