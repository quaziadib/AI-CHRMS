## MODIFIED Requirements

### Requirement: Doctor Assigned Patient List
The system SHALL provide a doctor dashboard listing only patients who have an active patient-granted access relationship with the current doctor, with risk badge, last record date, and key vitals, filterable or sortable by risk level.

#### Scenario: Doctor views patients who granted access
- **WHEN** a doctor opens the doctor dashboard
- **THEN** only patients with an active grant to that doctor SHALL be listed

#### Scenario: Doctor cannot see patients without active access
- **WHEN** a doctor requests a patient list or patient data without an active grant
- **THEN** the API SHALL return 403 or 404 and SHALL NOT expose the patient or record

#### Scenario: Administrator assignment does not grant doctor access
- **WHEN** an administrator assigns a doctor to a patient record but the patient has not granted that doctor active access
- **THEN** the doctor SHALL NOT see that patient in the dashboard or access the patient's data

### Requirement: Read-Only Doctor EHR
Doctors SHALL view the complete shared longitudinal profile only while the patient has granted active access, and MUST NOT edit or delete patient health records or change risk scores through the doctor UI or doctor APIs. Doctors MAY append documented clinical interactions as defined by the patient-doctor-sharing capability.

#### Scenario: Open shared patient profile
- **WHEN** a doctor opens a profile for a patient with an active grant
- **THEN** all available health records and profile history SHALL be visible and health record edit/delete actions SHALL be absent

#### Scenario: Access is revoked while doctor has a profile open
- **WHEN** a patient revokes access and the doctor makes a subsequent profile or record request
- **THEN** the API SHALL deny the request and SHALL NOT return further patient data

#### Scenario: Doctor cannot change health records or risk scores
- **WHEN** a doctor attempts to edit or delete a patient health record or change its risk score
- **THEN** the system SHALL deny the action

### Requirement: Admin Doctor Assignment
Administrators SHALL be able to assign or unassign a doctor to a patient record as administrative metadata. An assignment MUST NOT grant the doctor access to that patient's data without an active patient-granted access relationship.

#### Scenario: Admin assigns a doctor
- **WHEN** an administrator sets a doctor on a patient record
- **THEN** the assignment SHALL be stored for administrative oversight and SHALL NOT by itself expose the patient record to that doctor

#### Scenario: Admin unassigns a doctor
- **WHEN** an administrator removes a doctor assignment
- **THEN** the assignment SHALL be cleared and any existing patient-granted access SHALL remain governed by its own status

### Requirement: Admin Patient Record Oversight
Administrators SHALL retain access to patient records through the administrative records workflow and SHALL be able to review the patient-doctor access audit history.

#### Scenario: Admin reviews patient records and access history
- **WHEN** an administrator opens a patient's administrative record view
- **THEN** the administrator SHALL be able to view the patient's records and patient-doctor access history

#### Scenario: Administrator record access does not imply doctor authorization
- **WHEN** an administrator views or assigns a patient record
- **THEN** that administrative action SHALL NOT activate a patient-doctor grant
