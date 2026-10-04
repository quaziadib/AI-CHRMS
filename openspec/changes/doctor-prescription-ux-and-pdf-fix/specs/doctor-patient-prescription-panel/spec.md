## Purpose

Lets a doctor view and write prescriptions for a patient without leaving the patient's profile, using a right-side panel.

## ADDED Requirements

### Requirement: View Prescription Action
The doctor patient profile SHALL show a "View prescription" button only when the doctor has at least one prescription for that patient. WHEN no prescription exists the button SHALL NOT be shown.

#### Scenario: Prescription exists
- **WHEN** a doctor opens a patient profile and a prescription exists for that patient
- **THEN** the profile SHALL show a "View prescription" button

#### Scenario: No prescription
- **WHEN** no prescription exists for the patient
- **THEN** the button SHALL NOT be shown, and the "Write prescription" action SHALL remain available

### Requirement: Write Prescription Action
The doctor patient profile SHALL offer a "Write prescription" action for patients with an active grant, opening the compose form in the side panel.

#### Scenario: Doctor composes in panel
- **WHEN** the doctor opens the panel via "Write prescription" and saves a draft or publishes
- **THEN** the prescription SHALL be persisted for that patient and the panel SHALL show the result and refresh the button state

#### Scenario: Grant lost
- **WHEN** the grant is revoked while the panel is open and the doctor saves
- **THEN** the system SHALL reject the save with an authorization error and the panel SHALL show it

### Requirement: Right Side Panel Layout
WHEN the panel is open, it SHALL occupy the right side of the viewport and the patient profile content SHALL reflow into a narrower column beside it rather than being covered. WHEN closed, the profile SHALL use the full width. On narrow viewports the panel MAY present full-width over the profile.

#### Scenario: Open and close
- **WHEN** the doctor opens the panel
- **THEN** profile content SHALL shrink to a column and the panel SHALL appear on the right; closing it SHALL restore full width

#### Scenario: Unsaved changes
- **WHEN** the doctor closes the panel with unsaved compose edits
- **THEN** the system SHOULD confirm before discarding

### Requirement: Doctor Prescriptions Page Usability
The `/doctor/prescriptions` area SHALL present patients and prescriptions in a searchable, scannable layout with clear primary actions and explicit loading, empty, and error states.

#### Scenario: No prescriptions
- **WHEN** the doctor has none
- **THEN** the page SHALL show an empty state with a call to action to pick a patient and write one
