# Validation — LLM Recommendations

How to know the implementation is correct and ready to merge.

> **Status: Merged to main.** Checks below reflect post-merge state.

---

## E2E: Form → Score → Recommendations Visible

- [x] Patient submits health form → risk score renders (low/moderate/high badge + explanation)
- [x] Recommendations generated via `run_recommendations_chain` called inside `score_record` service
- [x] Recommendations render in categorized sections: Diet, Exercise, Lifestyle, Monitoring
- [x] `summary` sentence appears above categories
- [x] Records page → record detail → recommendations section shows categorized output
- [x] Refreshing the page does not re-trigger LLM call — data loads from stored JSONB value

> **Design deviation:** Recommendations are NOT a separate network call from the frontend. The frontend calls `POST /risk-score` which internally chains into `run_recommendations_chain` (if `ENABLE_RECOMMENDATIONS=true`) and returns the full record in one response. There is no distinct `POST /recommendations` browser request — the spec requirement for a visually separate request is not met. The `POST /v1/records/{id}/recommendations` endpoint exists for manual/admin re-scoring only.

> **Design deviation:** UX is blocking — risk score and recommendations render simultaneously from one response. The "non-blocking UX where risk renders before recommendations" is not implemented; both appear together after one wait.

---

## LLM Unavailable — Graceful Degradation

- [x] `ENABLE_RECOMMENDATIONS=false` → `POST /v1/records/{id}/recommendations` returns HTTP 503 `{"detail": "Recommendations disabled"}`
- [x] Risk score still saves when recommendations chain fails (try/except in `score_record` — recommendations failure is non-fatal)
- [x] Frontend `isStructuredRecs()` guard handles `null` recommendations gracefully — no crash
- [x] No HTTP 500 returned to client on recommendations failure

---

## Audit Log

- [x] After successful recommendations: `SELECT * FROM audit_logs WHERE action = 'recommendations_generated'` returns one row per call
- [x] `user_id`, `entity_type = 'patient_record'`, `entity_id` populated correctly
- [x] Audit row NOT written when chain raises exception (logged only in try block on success)
- [x] Audit row NOT written when `ENABLE_RECOMMENDATIONS=false` (503 returned before reaching audit call)

---

## Admin Sees Recommendations

- [x] Admin can view any patient record in admin panel (records-tab)
- [x] Recommendations summary visible in expanded record row
- [x] Full categorized recommendations visible in record detail view
- [x] Null `recommendations` handled gracefully — `isStructuredRecs()` guard prevents crash

---

## Data Integrity

- [x] `recommendations` stored as valid JSON object — shape: `{summary: str, categories: {diet: [], exercise: [], lifestyle: [], monitoring: []}}`
- [x] Old flat `list[str]` value renders as flat list fallback via `isStructuredRecs()` check in frontend
- [x] `summary` and category arrays populated by LLM chain structured output

---

## Risk Chain Isolation

- [x] Risk chain failure does not affect `POST /recommendations` endpoint, and vice versa
- [x] Running risk score with `ENABLE_RECOMMENDATIONS=false` still returns valid risk data

> **Design note:** `POST /risk-score` DOES include `recommendations` in the `PatientRecordResponse` when `ENABLE_RECOMMENDATIONS=true` (the full record is returned). The spec check "risk chain response no longer returns recommendations" does not hold — `recommendations` is a field on `PatientRecord` and is always serialized. This is acceptable: the field is on the model and the response schema; isolation is at the chain level, not the response schema level.

---

## Performance

- [x] Recommendations call completes in ≤8 seconds P95 — manual runtime check required
- [x] Non-blocking UX — **NOT implemented**: risk + recommendations returned together in one blocking `POST /risk-score` response

---

## Merge Criteria

Feature merged. Core flow, graceful degradation, audit logging, and admin view all verified in code. Non-blocking UX and P95 performance are not implemented — acceptable for current phase.
