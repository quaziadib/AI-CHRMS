## Purpose

Lets a patient download a published prescription as a PDF reliably in every supported deployment, and fail clearly when generation is impossible.

## ADDED Requirements

### Requirement: Patient Downloads Prescription PDF
The system SHALL return a valid `application/pdf` document for a published prescription belonging to the requesting patient, in every deployment target including the single-container Render image.

#### Scenario: Patient downloads own published prescription
- **WHEN** an authenticated patient requests the PDF of their own published prescription
- **THEN** the system SHALL respond 200 with a non-empty PDF attachment containing the prescription content

#### Scenario: Prescription not owned or still draft
- **WHEN** a patient requests the PDF of a prescription that is not theirs or is a draft
- **THEN** the system SHALL respond 404 and SHALL NOT generate a PDF

#### Scenario: Unauthenticated or non-patient caller
- **WHEN** an unauthenticated user or non-patient requests the PDF
- **THEN** the system SHALL deny the request with an auth error

### Requirement: Graceful PDF Failure
If PDF rendering fails, the system SHALL log the failure with the prescription id and cause, and SHALL return a structured error (503) with a human-readable message instead of an unhandled 500. The client SHALL show that message to the user.

#### Scenario: Renderer unavailable
- **WHEN** PDF rendering raises an error
- **THEN** the system SHALL return 503 with a detail message, and the failure SHALL be logged

### Requirement: Deploy Image Provides PDF Dependencies
Every deployable backend image SHALL include the system libraries and fonts required by the PDF renderer.

#### Scenario: Render image smoke check
- **WHEN** the Render image is built
- **THEN** a PDF render of a sample prescription SHALL succeed inside the container
