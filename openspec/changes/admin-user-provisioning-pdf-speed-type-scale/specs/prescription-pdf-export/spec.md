## ADDED Requirements

### Requirement: Prescription PDF download latency
The system SHALL deliver a patient's prescription PDF promptly. On a warm API process the complete response for a typical prescription (up to 20 medications) SHALL arrive within 2 seconds measured at the API. The first download after an API process start SHALL NOT pay the cost of loading the PDF rendering engine inside the request; that cost SHALL be paid during API startup, off the request path, and API readiness SHALL NOT be blocked by it.

#### Scenario: Warm download is fast
- **WHEN** a patient downloads a prescription PDF and the API process has already served or warmed the renderer
- **THEN** the response SHALL complete within 2 seconds at the API and the client SHALL save the file without further waiting

#### Scenario: Cold process does not stall the first download on engine load
- **WHEN** the API process has just started and a patient requests a PDF
- **THEN** the renderer SHALL already be loaded (or loading in the background), and the request SHALL NOT trigger a fresh engine import or font cache rebuild

#### Scenario: Health check unaffected by warm-up
- **WHEN** the API starts and the renderer warm-up is in progress or fails
- **THEN** the health endpoint SHALL still report healthy and non-PDF requests SHALL be unaffected

### Requirement: Rendered PDF reuse
The system SHALL reuse a previously rendered PDF for the same prescription as long as the prescription has not changed, so that repeated downloads do not re-render. A change to the prescription SHALL invalidate the reused PDF.

#### Scenario: Repeat download reuses render
- **WHEN** a patient downloads the same unchanged prescription PDF a second time
- **THEN** the system SHALL serve bytes identical to the first download without invoking the renderer again

#### Scenario: Updated prescription re-renders
- **WHEN** a prescription is modified after a PDF was served
- **THEN** the next download SHALL reflect the modification

#### Scenario: Audit still recorded on reuse
- **WHEN** a cached PDF is served
- **THEN** the prescription-viewed audit entry SHALL still be recorded for that access

### Requirement: Download response and client feedback
The PDF response SHALL include a content length and attachment filename so browsers can show download progress. The client SHALL show a visible "preparing" state on the download control from click until the file is saved or an error is shown, and SHALL prevent duplicate concurrent downloads of the same prescription.

#### Scenario: Progress state shown
- **WHEN** a patient clicks Download PDF
- **THEN** the control SHALL show a busy state and be disabled until the download completes or fails

#### Scenario: Content length present
- **WHEN** the PDF response is returned
- **THEN** it SHALL carry a Content-Length header equal to the PDF byte size and a Content-Disposition attachment filename
