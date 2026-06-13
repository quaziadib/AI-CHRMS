# Validation — Abnormality Flagging

How to know the implementation is correct and ready to merge.

---

## Flagging Logic

- [x] Record with blood_glucose=130 mg/dL → flag: field=blood_glucose, severity=critical, label="Diabetic range"
- [x] Record with blood_glucose=110 mg/dL → flag: severity=warning, label="Pre-diabetic range"
- [x] Record with blood_glucose=90 mg/dL → no blood_glucose flag
- [x] Record with bp_systolic=145 → flag: severity=critical, label="Hypertension Stage 2"
- [x] Record with bp_systolic=132 → flag: severity=warning, label="Hypertension Stage 1"
- [x] Record with bmi=31.5 → flag: severity=critical, label="Obese"
- [x] Record with bmi=27.0 → flag: severity=warning, label="Overweight"
- [x] Record with bmi=17.0 → flag: severity=warning, label="Underweight"
- [x] Female patient with hemoglobin=11.0 → flag: severity=warning, label includes "anemia"
- [x] Male patient with hemoglobin=12.0 → flag: severity=warning, label includes "anemia"
- [x] Record with cholesterol=250 → flag: severity=critical, label="High cholesterol"
- [x] Record with pulse_rate=110 → flag: severity=warning, label="Tachycardia"
- [x] All values normal → `flags = []` (empty list, not null)

---

## Auto-Trigger

- [x] New record created → `flags` column populated immediately (no manual trigger needed)
- [x] Record updated with new lab values → `flags` recomputed with updated values
- [x] Risk scored → `flags` computed and returned (verified: BP 120/80 → Hypertension Stage 1 warning)

---

## DB Integrity

- [x] `patient_records` table has `flags JSONB` column after migration
- [x] Existing records: `flags` is NULL until next save (computed lazily — expected)
- [x] Flag list stored as valid JSON array

---

## Frontend — Doctor EHR View

- [x] Doctor opens patient EHR → flags panel visible above record detail
- [x] Critical flags shown in red, warning flags in amber
- [x] Each badge shows: label + value + unit (e.g. "Diabetic range — 145.0 mg/dL")
- [x] "No abnormal values detected" shown in green when flags list is empty
- [x] Null flags (pre-existing records not yet re-saved) → panel hidden or shows "Not yet computed"

---

## Frontend — Patient Record Page

- [x] Patient views their record → flags panel visible
- [x] Same severity color coding as doctor view

---

## Non-Regression

- [x] EHR summarization still works (flags stored as JSONB; no schema conflict)
- [x] Risk scoring flow unchanged
- [x] Doctor patient list unchanged
- [x] Admin panel unchanged
- [x] `npm run build` — zero TypeScript errors
- [x] `npm run lint` — zero ESLint errors

---

## Merge Criteria

Flagging engine correctly applies all clinical thresholds. Flags auto-computed on every record save. Displayed with correct severity colors on both doctor and patient views. No regression in any other flow. Build and lint clean.
