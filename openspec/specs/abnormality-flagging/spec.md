# Abnormality Flagging Specification

## Purpose
Automatically detect out-of-range labs and vitals on patient records using clinical threshold rules, store structured flags, and surface them to doctors, patients, and admins.

## Requirements

### Requirement: Automatic Rule-Based Flagging
On every record create, update, and risk score save, the system SHALL recompute abnormality flags using pure rule-based thresholds (no LLM) and SHALL persist the resulting flag list on the record.

#### Scenario: Critical glucose flagged
- **WHEN** a record is saved with fasting blood glucose ≥ 126 mg/dL
- **THEN** the stored flags SHALL include a critical blood glucose abnormality referencing the clinical threshold

#### Scenario: All values normal
- **WHEN** a record is saved with all monitored fields within normal ranges
- **THEN** flags SHALL be an empty list (not stale prior flags)

### Requirement: Structured Flag Payload
Each flag SHALL include field, label, value, unit, severity (`warning` | `critical`), and a human-readable reference range statement.

#### Scenario: Flag shape for UI
- **WHEN** flags are returned on a record response
- **THEN** clients SHALL be able to render severity badges without additional computation of thresholds

### Requirement: Clinical Threshold Coverage
The system SHALL flag at least blood glucose, blood pressure, BMI, cholesterol, hemoglobin (sex-aware), creatinine, and pulse rate using ADA/WHO-aligned cutoffs defined for warning and critical severities.

#### Scenario: Hypertension stage 2
- **WHEN** systolic BP ≥ 140 or diastolic BP ≥ 90
- **THEN** a critical blood-pressure flag SHALL be present

### Requirement: Multi-Surface Visibility
Computed flags SHALL be visible on the doctor EHR view and patient record detail (and admin record views where records are shown) via a shared flags presentation.

#### Scenario: Doctor sees flags
- **WHEN** a doctor opens an assigned patient's EHR that has critical flags
- **THEN** the UI SHALL highlight those flags by severity

### Requirement: Additive API Compatibility
Record API responses SHALL expose flags as an additive nullable field so existing clients remain compatible when flags are absent.

#### Scenario: Legacy client ignores flags
- **WHEN** a client does not read the flags field
- **THEN** other record fields SHALL continue to deserialize successfully
