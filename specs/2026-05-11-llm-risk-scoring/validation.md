# Validation — LLM Risk Scoring

How to know the implementation is correct and ready to merge.

---

## Functional Checks

### Backend

- [ ] `POST /v1/records/{id}/risk-score` returns HTTP 200 with `risk_level`, `risk_explanation`, `recommendations`, `risk_scored_at` populated
- [ ] `risk_level` value is one of: `"low"`, `"moderate"`, `"high"` — no other values accepted
- [ ] `recommendations` contains 3–5 items (list of strings)
- [ ] Calling the endpoint twice on the same record overwrites and returns updated `risk_scored_at`
- [ ] A patient cannot score another patient's record — returns HTTP 403
- [ ] A doctor or admin can score any record — returns HTTP 200
- [ ] Each call appends one row to `audit_logs` with action `risk_scored`
- [ ] Provider swap: change `LLM_PROVIDER=openai` → restart → endpoint still returns valid structured output

### Frontend — Inline

- [ ] Submitting health form triggers risk score call automatically (no extra button click)
- [ ] Loading spinner visible while awaiting LLM response
- [ ] `RiskResult` component renders badge, explanation paragraph, and recommendations list
- [ ] Badge color: green for low, amber for moderate, red for high
- [ ] "View Dashboard" button navigates to `/dashboard`

### Frontend — Dashboard Widget

- [ ] `RiskWidget` visible on patient dashboard after first form submission
- [ ] Widget shows same risk level, explanation, and recommendations as inline result
- [ ] `risk_scored_at` timestamp displayed in human-readable format
- [ ] Widget shows "No assessment yet" state for a patient with no records or no score
- [ ] Widget does not appear on doctor/admin/maintainer dashboards

---

## Performance

- [ ] LLM call completes in ≤5 seconds P95 (measure 10 consecutive calls, all under 5s)
- [ ] If LLM call exceeds 10s, endpoint returns HTTP 504 (not a hanging connection)

---

## Error States

- [ ] Invalid `LLM_PROVIDER` env var → server logs a clear error at startup, does not silently fall back
- [ ] LLM API key missing → endpoint returns HTTP 500 with `"LLM provider not configured"` (not a stack trace)
- [ ] LLM returns malformed output → chain retries once, then returns HTTP 502 with `"Risk scoring unavailable"`
- [ ] Record ID does not exist → HTTP 404

---

## Data Integrity

- [ ] No patient PII appears in backend application logs at INFO level or below
- [ ] `recommendations` stored as valid JSON array in DB (not a serialized string)
- [ ] `risk_scored_at` is UTC timestamp

---

## Merge Criteria

All functional checks pass via manual walkthrough. Performance check passes. Error states verified by temporarily misconfiguring env vars. No TypeScript build errors introduced (check `npm run build`). No new ESLint errors (`npm run lint`).
