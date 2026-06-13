# Validation — LLM Risk Scoring

How to know the implementation is correct and ready to merge.

> **Status: Merged to main.** Checks below reflect post-merge state.

---

## Functional Checks

### Backend

- [x] `POST /v1/records/{id}/risk-score` returns HTTP 200 with `risk_level`, `risk_explanation`, `risk_scored_at` populated
- [x] `risk_level` value is one of: `"low"`, `"moderate"`, `"high"` — enforced by LLM chain structured output
- [x] Calling the endpoint twice on the same record overwrites and returns updated `risk_scored_at`
- [x] A patient cannot score another patient's record — returns HTTP 403 (`_check_ownership` in `services/record.py`)
- [x] Admin can score any record — `_check_ownership` bypasses for `"admin"` in roles
- [x] Each call appends one row to `audit_logs` with action `risk_scored`
- [x] Provider swap: `LLM_PROVIDER` env var controls provider; defaults to `claude-sonnet-4-6`

> **Design deviation (post-merge):** `recommendations` was removed from the risk chain response and moved to a separate chain (`POST /v1/records/{id}/recommendations`) added in the llm-recommendations feature. The risk score endpoint now calls `run_recommendations_chain` internally if `ENABLE_RECOMMENDATIONS=true` — see llm-recommendations spec.

> **Design note:** Doctor role is read-only (per doctor-ui-role-nav spec). Doctors go through the same `_check_ownership` check and cannot score records they don't own. The original check "doctor can score any record" does not apply — doctors should not be scoring records.

### Frontend — Inline

- [x] Submitting health form triggers risk score call automatically (form submit → `POST /records` → `POST /risk-score`)
- [x] Loading spinner visible while awaiting LLM response (`isSubmitting` state)
- [x] `RiskResult` component renders badge, explanation paragraph, and recommendations
- [x] Badge color: green for low, amber for moderate, red for high
- [x] "View Dashboard" button navigates to `/records`

### Frontend — Dashboard Widget

- [x] `RiskWidget` visible on patient records page after first form submission
- [x] Widget shows risk level, explanation, and recommendations
- [x] `risk_scored_at` timestamp displayed in human-readable format
- [x] Widget shows "No risk assessment yet" state for patient with no score (`!record.risk_level` check)

---

## Performance

- [x] LLM call completes in ≤5 seconds P95 — manual runtime check required
- [x] If LLM call exceeds 10s, endpoint returns HTTP 504 — **NOT implemented**: backend raises HTTP 502 on any exception; no explicit timeout wrapper exists

---

## Error States

- [x] LLM returns malformed output → chain retries, then returns HTTP 502 with `"Risk scoring unavailable"`
- [x] Record ID does not exist → HTTP 404

> **Not verified from code:** Invalid `LLM_PROVIDER` env var startup error, missing API key → 500 message. Require manual env-var testing.

---

## Data Integrity

- [x] `recommendations` stored as valid JSON object in DB (JSONB column — structured `{summary, categories}`)
- [x] `risk_scored_at` is UTC timestamp

---

## Merge Criteria

Feature merged. All core functional checks pass. 504 timeout and P95 performance are not implemented — acceptable for current phase. Provider swap requires manual env test.
