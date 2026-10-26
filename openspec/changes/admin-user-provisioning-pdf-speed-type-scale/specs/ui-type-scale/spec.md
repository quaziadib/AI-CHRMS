## Purpose

Defines minimum readable text sizes for the web UI so that patients, clinicians and administrators can read forms, tables and cards comfortably on desktop and mobile.

## ADDED Requirements

### Requirement: Larger default type scale
The web UI SHALL render body text at no less than 17 px, secondary/helper text at no less than 15 px, and the smallest labels, badges and captions at no less than 13 px, across all authenticated and public pages. The scale SHALL be applied centrally so that every page and shared component inherits it without per-page overrides, and spacing between elements SHALL NOT scale with it.

#### Scenario: Body text size
- **WHEN** any page renders default paragraph or form-field text
- **THEN** its computed font size SHALL be at least 17 px

#### Scenario: Smallest text size
- **WHEN** a page renders captions, badges, table meta text or hint text using the smallest text style
- **THEN** its computed font size SHALL be at least 13 px

#### Scenario: Layout remains intact
- **WHEN** the 8-step health form, the records list, the admin users table and the doctor patient page are viewed at 320 px and 1280 px widths
- **THEN** no text SHALL be clipped, overlapping, or require horizontal scrolling

### Requirement: Prescription PDF typography unchanged
The increased UI type scale SHALL NOT change the typography of the generated prescription PDF.

#### Scenario: PDF unaffected
- **WHEN** a prescription PDF is generated after this change
- **THEN** its text sizes SHALL match those produced before the change
