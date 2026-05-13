# Validation — Abnormality Flagging

How to know the implementation is correct and ready to merge.

---

## Flagging Logic

- [ ] Record with blood_glucose=130 mg/dL → flag: field=blood_glucose, severity=critical, label="Diabetic range"
- [ ] Record with blood_glucose=110 mg/dL → flag: severity=warning, label="Pre-diabetic range"
- [ ] Record with blood_glucose=90 mg/dL → no blood_glucose flag
- [ ] Record with bp_systolic=145 → flag: severity=critical, label="Hypertension Stage 2"
- [ ] Record with bp_systolic=132 → flag: severity=warning, label="Hypertension Stage 1"
- [ ] Record with bmi=31.5 → flag: severity=critical, label="Obese"
- [ ] Record with bmi=27.0 → flag: severity=warning, label="Overweight"
- [ ] Record with bmi=17.0 → flag: severity=warning, label="Underweight"
- [ ] Female patient with hemoglobin=11.0 → flag: severity=warning, label includes "anemia"
- [ ] Male patient with hemoglobin=12.0 → flag: severity=warning, label includes "anemia"
- [ ] Record with cholesterol=250 → flag: severity=critical, label="High cholesterol"
- [ ] Record with pulse_rate=110 → flag: severity=warning, label="Tachycardia"
- [ ] All values normal → `flags = []` (empty list, not null)

---

## Auto-Trigger

- [ ] New record created → `flags` column populated immediately (no manual trigger needed)
- [ ] Record updated with new lab values → `flags` recomputed with updated values
- [x] Risk scored → `flags` computed and returned (verified: BP 120/80 → Hypertension Stage 1 warning)

---

## DB Integrity

- [x] `patient_records` table has `flags JSONB` column after migration
- [x] Existing records: `flags` is NULL until next save (computed lazily — expected)
- [x] Flag list stored as valid JSON array

---

## Frontend — Doctor EHR View

- [ ] Doctor opens patient EHR → flags panel visible above record detail
- [ ] Critical flags shown in red, warning flags in amber
- [ ] Each badge shows: label + value + unit (e.g. "Diabetic range — 145.0 mg/dL")
- [ ] "No abnormal values detected" shown in green when flags list is empty
- [ ] Null flags (pre-existing records not yet re-saved) → panel hidden or shows "Not yet computed"

---

## Frontend — Patient Record Page

- [ ] Patient views their record → flags panel visible
- [ ] Same severity color coding as doctor view

---

## Non-Regression

- [ ] EHR summarization still works (flags stored as JSONB; no schema conflict)
- [ ] Risk scoring flow unchanged
- [ ] Doctor patient list unchanged
- [ ] Admin panel unchanged
- [ ] `npm run build` — zero TypeScript errors
- [ ] `npm run lint` — zero ESLint errors

---

## Merge Criteria

Flagging engine correctly applies all clinical thresholds. Flags auto-computed on every record save. Displayed with correct severity colors on both doctor and patient views. No regression in any other flow. Build and lint clean.
