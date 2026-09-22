# Health Assessment Report Specification

## Purpose
Present risk scores, vital highlights, truncated LLM insight, and categorized action cards in a unified Health Assessment Report UI across dashboard, records, and post-submit flows.

## Requirements

### Requirement: Unified Report Component
The system SHALL render a shared Health Assessment Report from existing patient record fields (no new report API) on post-submit, records, and dashboard surfaces, with a compact mode for the dashboard.

#### Scenario: Full report after submit
- **WHEN** a patient finishes health-form submission with a scored record
- **THEN** the results view SHALL show the full report (risk hero, vitals, insight, actions)

#### Scenario: Compact dashboard
- **WHEN** the patient opens the dashboard
- **THEN** the report SHALL render in compact mode with fewer tips and without expand-all clutter

### Requirement: Risk Hero Visualization
The report SHALL show a clear risk label with a visual gauge/progress representation mapped to low/moderate/high (fixed visual indices), not a separate clinical score API.

#### Scenario: High risk presentation
- **WHEN** `risk_level` is `high`
- **THEN** the hero SHALL emphasize high risk with the corresponding visual index

### Requirement: Vital Highlights with Tone
The report SHALL highlight glucose, BMI, blood pressure, and pulse with good/warn/alert tones based on clinical cutoffs, and SHALL handle missing vitals without crashing (e.g. "Not recorded", neutral tone).

#### Scenario: Missing glucose
- **WHEN** blood glucose is absent on the record
- **THEN** the glucose tile SHALL show a neutral not-recorded state

### Requirement: Truncated Insight and Actions
The insight section SHALL show the first 1–2 sentences of `risk_explanation` with expand for full text. Action cards SHALL map categorized recommendations (Eat/Move/Habits/Track) with shortened tips, and SHALL support legacy flat string-array recommendations.

#### Scenario: Structured recommendations
- **WHEN** recommendations are categorized
- **THEN** action cards SHALL populate from diet/exercise/lifestyle/monitoring categories

#### Scenario: Null recommendations
- **WHEN** recommendations are null
- **THEN** the report SHALL render without error and omit or empty the action grid gracefully

### Requirement: Consistent Presentation Helpers
Client-side truncation and tone helpers SHALL be reused so dashboard, records, and post-submit stay visually consistent without additional LLM summarization calls.

#### Scenario: No second LLM call
- **WHEN** the report truncates explanation or tips
- **THEN** truncation SHALL be performed client-side from stored fields only
