## Purpose

Allows doctors to compose structured clinical prescriptions (symptoms/diagnosis, medications, lab tests, general advice) for their patients and delivers them as a readable web view and downloadable PDF.

## ADDED Requirements

### Requirement: Doctor Composes a Structured Prescription
The system SHALL allow a doctor with an active patient grant to create a prescription with four structured sections: Symptoms & Diagnosis, Medications, Lab Tests, and General Advice. The system SHALL accept each section independently; none SHALL be mandatory. A prescription MAY be created as a `draft` (not visible to the patient) or as `published` (immediately visible). The system SHALL persist the prescription linked to the patient and the doctor.

#### Scenario: Doctor creates a full prescription
- **WHEN** a doctor submits a prescription with at least one section populated for a patient with an active grant
- **THEN** the system SHALL persist the prescription and return it with an assigned ID, creation timestamp, and the doctor's identity

#### Scenario: Doctor creates a prescription with only one section
- **WHEN** a doctor submits a prescription with only the General Advice section populated
- **THEN** the system SHALL persist it successfully without requiring other sections

#### Scenario: Doctor attempts to create a prescription without an active grant
- **WHEN** a doctor submits a prescription for a patient whose grant is pending, declined, or revoked
- **THEN** the system SHALL reject the request with an authorization error and SHALL NOT persist the prescription

#### Scenario: Non-doctor attempts to create a prescription
- **WHEN** a user without the doctor role calls the create-prescription endpoint
- **THEN** the system SHALL deny the request without creating a prescription

### Requirement: Symptoms & Diagnosis Section
The Symptoms & Diagnosis section SHALL be a list of free-text items. Each item SHALL be at most 500 characters. The system SHALL provide diabetes-related suggestion strings that the doctor MAY select to pre-fill items.

#### Scenario: Doctor adds symptoms from suggestions
- **WHEN** a doctor selects one or more suggested symptoms (e.g., "Polyuria", "Excessive thirst", "Blurred vision")
- **THEN** the system SHALL include those items in the Symptoms & Diagnosis list on save

#### Scenario: Doctor adds a custom symptom
- **WHEN** a doctor types a free-text symptom not in the suggestions list
- **THEN** the system SHALL accept and persist the item

#### Scenario: Item exceeds character limit
- **WHEN** a doctor submits a Symptoms & Diagnosis item longer than 500 characters
- **THEN** the system SHALL reject the prescription and return a validation error identifying the field

### Requirement: Medications Section
The Medications section SHALL be a list of structured medication entries. Each entry SHALL contain: medicine name (required, ≤200 chars), dosage schedule expressed as X+Y+Z where X/Y/Z are non-negative integers representing morning/afternoon/night tablet counts, duration in days (positive integer), and free-text instructions (optional, ≤500 chars). The system SHALL allow adding multiple medication entries. The system SHALL validate that the dosage schedule contains exactly three numeric components.

#### Scenario: Doctor adds a medication with full fields
- **WHEN** a doctor enters medicine name "Metformin", schedule "1+0+1", duration 30, and instructions "Take after meals"
- **THEN** the system SHALL persist the entry with all fields

#### Scenario: Doctor omits optional instructions
- **WHEN** a doctor adds a medication without filling in the instructions field
- **THEN** the system SHALL persist the entry with a null/empty instruction value

#### Scenario: Invalid dosage schedule format
- **WHEN** a doctor submits a medication with a dosage schedule that is not in X+Y+Z integer format (e.g., "twice daily" or "1+0")
- **THEN** the system SHALL reject the prescription and return a validation error identifying the medication entry

#### Scenario: Doctor adds multiple medications
- **WHEN** a doctor adds three medication entries and submits
- **THEN** the system SHALL persist all three entries associated with the prescription

### Requirement: Lab Tests Section
The Lab Tests section SHALL be a list of free-text test names. Each item SHALL be at most 300 characters. The system SHALL provide diabetes-related lab test suggestions that the doctor MAY select to pre-fill items.

#### Scenario: Doctor selects a suggested lab test
- **WHEN** a doctor selects "HbA1c" from the suggestions list
- **THEN** the system SHALL include that item in the Lab Tests list on save

#### Scenario: Doctor adds a custom lab test
- **WHEN** a doctor types a test name not in the suggestions list
- **THEN** the system SHALL accept and persist the item

### Requirement: General Advice Section
The General Advice section SHALL be a list of free-text advisory items. Each item SHALL be at most 500 characters. The system SHALL provide diabetes-related general advice suggestions that the doctor MAY select.

#### Scenario: Doctor adds general advice from suggestions
- **WHEN** a doctor selects "Maintain a low-carbohydrate diet" from suggestions
- **THEN** the system SHALL include it in the General Advice list on save

### Requirement: Prescription Draft and Publish Lifecycle
A prescription SHALL have a `status` of `draft`, `published`, or `revoked`. A doctor SHALL be able to create a prescription in `draft` status and edit it freely. A draft SHALL NOT be visible to the patient. When the doctor publishes the prescription, status transitions to `published` and the prescription becomes visible to the patient. A `revoked` prescription is terminal; its status SHALL NOT be changed after revocation.

#### Scenario: Doctor saves a draft
- **WHEN** a doctor creates a prescription with status `draft`
- **THEN** the system SHALL persist it and return it without making it visible to the patient

#### Scenario: Doctor publishes a draft
- **WHEN** a doctor updates a `draft` prescription and sets status to `published`
- **THEN** the system SHALL transition the prescription to `published` and make it visible to the patient

#### Scenario: Patient cannot see drafts
- **WHEN** a patient requests their prescription list
- **THEN** the system SHALL return only `published` and `revoked` prescriptions, excluding any `draft` records

#### Scenario: Doctor edits a draft directly
- **WHEN** a doctor updates the clinical content of a `draft` prescription
- **THEN** the system SHALL persist the new content and retain `draft` status

### Requirement: Doctor Edits a Published Prescription
A doctor SHALL be able to update the clinical content of a `published` prescription they authored while it remains in `published` status. The system SHALL update the prescription's content and `updated_at` timestamp and log a `prescription_updated` audit event. The patient SHALL see the latest content on next view.

#### Scenario: Doctor edits a published prescription
- **WHEN** a doctor submits updated content for a `published` prescription they authored
- **THEN** the system SHALL replace the prescription's sections with the new content, update `updated_at`, and log `prescription_updated`

#### Scenario: Doctor attempts to edit another doctor's prescription
- **WHEN** a doctor submits an edit for a prescription authored by a different doctor
- **THEN** the system SHALL deny the request without modifying the prescription

#### Scenario: Doctor attempts to edit a revoked prescription
- **WHEN** a doctor calls the update endpoint for a `revoked` prescription
- **THEN** the system SHALL reject the request and SHALL NOT modify the prescription

### Requirement: Doctor Revokes a Published Prescription
A doctor SHALL be able to revoke a `published` prescription they authored. Revocation SHALL transition the prescription to `revoked` status (terminal). The patient SHALL still be able to view and download the prescription with a visible revocation notice. The system SHALL log a `prescription_revoked` audit event.

#### Scenario: Doctor revokes a published prescription
- **WHEN** a doctor sets a `published` prescription's status to `revoked`
- **THEN** the system SHALL transition it to `revoked`, record the timestamp, and log `prescription_revoked`

#### Scenario: Patient views a revoked prescription
- **WHEN** a patient opens a prescription with `revoked` status
- **THEN** the system SHALL display all clinical sections along with a visible notice that the prescription has been revoked, and SHALL still allow PDF download

#### Scenario: Doctor attempts to revoke a draft
- **WHEN** a doctor sets a `draft` prescription's status to `revoked`
- **THEN** the system SHALL reject the request; a draft MUST be published before it can be revoked

#### Scenario: Prescription creation logged
- **WHEN** a doctor successfully creates a prescription
- **THEN** the system SHALL append a `prescription_created` audit event with the doctor ID, patient ID, and prescription ID

### Requirement: Patient Receives Prescription as Web View
A patient SHALL be able to view all prescriptions issued to them by any doctor, regardless of current grant status. The patient view SHALL present each section in a structured, human-readable format. The system SHALL log a `prescription_viewed` audit event when a patient opens a prescription.

#### Scenario: Patient views an active prescription
- **WHEN** a patient opens a prescription in their "Advices & Prescriptions" tab
- **THEN** the system SHALL display all populated sections (symptoms, medications, lab tests, advice), the doctor's name, and the issue date/time

#### Scenario: Patient views a prescription after grant revocation
- **WHEN** a patient whose grant with a doctor has been revoked opens a prescription that doctor issued
- **THEN** the system SHALL still display the prescription (read-only historical access)

#### Scenario: Another patient attempts to access a prescription
- **WHEN** a patient requests a prescription that was not issued to them
- **THEN** the system SHALL deny access without exposing whether the prescription exists

### Requirement: PDF Export in Prescription Format
A patient SHALL be able to download any of their prescriptions as a PDF. The PDF SHALL include a clinic/system header, doctor name, patient name, issue date, and all four sections formatted as a clinical prescription document. The PDF SHALL be generated server-side and returned as a binary download.

#### Scenario: Patient downloads a prescription as PDF
- **WHEN** a patient clicks the download button for a prescription
- **THEN** the system SHALL return a PDF file with the correct Content-Type header and all clinical sections rendered

#### Scenario: PDF request for a non-existent or unauthorized prescription
- **WHEN** a patient requests a PDF for a prescription they do not own
- **THEN** the system SHALL return an authorization error and SHALL NOT return any PDF content

### Requirement: Doctor Views Issued Prescriptions per Patient
A doctor SHALL be able to list all prescriptions they have issued to a specific patient. The list SHALL be accessible while the grant is active or from the doctor's own historical records.

#### Scenario: Doctor lists prescriptions for an active patient
- **WHEN** a doctor requests the prescription list for a patient with an active grant
- **THEN** the system SHALL return all prescriptions issued by that doctor to that patient in reverse-chronological order

#### Scenario: Doctor lists prescriptions for a patient with a revoked grant
- **WHEN** a doctor requests prescriptions for a patient whose grant was revoked
- **THEN** the system SHALL still return the prescriptions that doctor issued (their own records only)
