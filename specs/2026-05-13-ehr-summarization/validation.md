# Validation — EHR Summarization

How to know the implementation is correct and ready to merge.

---

## Backend API

- [x] `POST /v1/doctor/patients/{id}/summarize` with valid doctor token for assigned patient → 200, `ehr_summary` non-empty string, `ehr_summary_at` populated
- [x] Same endpoint with admin token → 403 (admin is not a doctor)
- [x] Same endpoint with unauthenticated request → 401
- [ ] Same endpoint with patient token → 403
- [ ] Doctor token but record not assigned to this doctor → 404
- [ ] `ENABLE_EHR_SUMMARY=false` → 503 `{"detail": "EHR summarization is currently disabled"}`
- [ ] Calling twice → second call overwrites `ehr_summary` and updates `ehr_summary_at`
- [x] Audit log: `ehr_summary_generated` action row appears after call

---

## Summary Quality

- [x] Summary is plain prose (no markdown symbols, no bullet points, no headers)
- [x] Summary is ~150 words (not a one-liner, not a wall of text)
- [x] Summary references actual patient values: blood glucose 2.78 mmol/L, BMI 31.1, BP 120/80
- [x] Summary concludes with 1–2 clinical concerns (CVD + glycaemic status)
- [x] Summary is clinical in tone (doctor-to-doctor briefing)

---

## DB Integrity

- [x] `patient_records` table has `ehr_summary TEXT` and `ehr_summary_at TIMESTAMPTZ` columns after migration
- [x] Existing records unaffected (both columns nullable, defaulting to NULL)

---

## Frontend

- [ ] Doctor opens `/doctor/patients/{id}` → "Generate Summary" button visible (no existing summary)
- [ ] Clicking button → spinner shows on button, panel absent during load
- [ ] On success → summary panel appears with text and "Generated on [date]" timestamp
- [ ] "Regenerate" control visible when summary already exists
- [ ] Clicking "Regenerate" → new summary replaces old, timestamp updates
- [ ] Error state: LLM down → toast error shown, no crash

---

## Access Control

- [ ] Patient navigating to `/doctor/patients/{id}` manually → redirected (layout guard)
- [ ] Doctor can only summarize their assigned patients — unassigned → 404
- [ ] Summary text NOT visible to patients on their own record pages

---

## Feature Flag

- [ ] `ENABLE_EHR_SUMMARY=true` (default) → summarize endpoint and button functional
- [ ] `ENABLE_EHR_SUMMARY=false` → button sends request → shows error toast "EHR summarization is currently disabled"

---

## Non-Regression

- [ ] Doctor patient list still loads
- [ ] Doctor EHR read-only view still shows all fields
- [ ] Patient risk score and recommendations flow unchanged
- [ ] Admin panel unchanged
- [ ] `npm run build` — zero TypeScript errors
- [ ] `npm run lint` — zero ESLint errors

---

## Merge Criteria

Summarize endpoint returns coherent clinical prose referencing actual patient values. Doctor-only access enforced at API level. Summary stored and displayed with timestamp. Regeneration works. Audit row written per call. Feature flag disables cleanly. No regression in any other flow. Build and lint clean.
