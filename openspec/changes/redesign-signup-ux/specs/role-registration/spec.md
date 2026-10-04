## ADDED Requirements

### Requirement: Role choice presented first with approval status
The signup form SHALL present the role choice before account detail fields, SHALL preselect patient, and SHALL indicate for each elevated role (doctor, national_admin, admin) that admin approval is required, using text and not colour alone.

#### Scenario: Default role
- **WHEN** a user opens the signup page
- **THEN** patient SHALL be selected and no elevated-role detail fields SHALL be shown

#### Scenario: Approval requirement visible before submit
- **WHEN** a user views or selects an elevated role
- **THEN** the form SHALL state that the role needs admin approval and that the account works as a patient until approved

#### Scenario: Keyboard role selection
- **WHEN** a user navigates the role choice with the keyboard only
- **THEN** they SHALL be able to select exactly one role and the selection SHALL be announced to assistive technology

### Requirement: Doctor details entered in a distinct section
When the doctor role is selected, the signup form SHALL show a separate, labelled doctor-details section, and SHALL hide it when another role is selected. Existing doctor validation rules and the submitted data SHALL be unchanged.

#### Scenario: Doctor section shown
- **WHEN** a user selects doctor
- **THEN** specialization, affiliations, division, district, practice location and ID picture inputs SHALL appear in a labelled section

#### Scenario: Doctor section hidden on role change
- **WHEN** a user switches from doctor to another role
- **THEN** the doctor-details section SHALL be hidden and its values SHALL NOT be submitted

#### Scenario: Missing required doctor field
- **WHEN** a doctor submits without a required doctor field
- **THEN** the form SHALL show an inline error on that field and SHALL NOT submit

### Requirement: ID picture upload feedback
The signup form SHALL tell the user, before they choose a file, that the ID picture is optional, visible only to reviewing admins, and limited to 1 MB, and SHALL show the chosen file name afterwards with a way to remove it.

#### Scenario: Valid image chosen
- **WHEN** a user picks an image under 1 MB
- **THEN** the file name SHALL be shown and the image SHALL be submitted with the doctor profile

#### Scenario: Oversized or non-image file
- **WHEN** a user picks a non-image file or one over 1 MB
- **THEN** the form SHALL reject it with an error message and SHALL NOT attach it

#### Scenario: File removed
- **WHEN** a user removes the chosen file
- **THEN** no ID picture SHALL be submitted

### Requirement: Accessible field errors and responsive layout
Each signup field error and hint SHALL be programmatically associated with its input, invalid inputs SHALL be flagged as invalid, and the form SHALL remain usable at 320 px viewport width without horizontal scrolling.

#### Scenario: Error association
- **WHEN** validation fails on a field
- **THEN** the field SHALL be marked invalid and its error text SHALL be associated with the input for assistive technology

#### Scenario: Narrow viewport
- **WHEN** the signup page is viewed at 320 px width
- **THEN** all fields SHALL be single-column, fully visible, and operable without horizontal scrolling
