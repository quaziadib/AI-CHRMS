# Validation — LLM Recommendations

How to know the implementation is correct and ready to merge.

---

## E2E: Form → Score → Recommendations Visible

- [ ] Patient submits health form → risk score renders (low/moderate/high badge + explanation)
- [ ] Recommendations load as a separate network call after risk score (visible in browser devtools as distinct `POST /recommendations` request)
- [ ] Recommendations render in categorized sections: Diet, Exercise, Lifestyle, Monitoring
- [ ] `summary` sentence appears above categories
- [ ] Navigating to `/records` → record detail → recommendations section shows the same categorized output
- [ ] Refreshing the page does not re-trigger the LLM call — data loads from stored DB value

---

## LLM Unavailable — Graceful Degradation

- [ ] Set `ENABLE_RECOMMENDATIONS=false`, restart backend
  - Form submit succeeds
  - Risk score renders normally
  - Recommendations section shows "Recommendations unavailable" state (not a spinner, not an error toast)
  - No HTTP 500 anywhere in the flow
  - `POST /v1/records/{id}/recommendations` returns HTTP 503 with `{"detail": "Recommendations disabled"}`
- [ ] Temporarily revoke LLM API key, set `ENABLE_RECOMMENDATIONS=true`, restart
  - Risk score still saves (chain failure is non-fatal)
  - Recommendations field is `null` in DB
  - Frontend shows graceful unavailable state
  - No 500 returned to client

---

## Audit Log

- [ ] After successful recommendations call: `SELECT * FROM audit_logs WHERE action = 'recommendations_generated'` returns one row per call
- [ ] `user_id`, `resource_type = 'patient_record'`, `resource_id` all populated correctly
- [ ] Audit row NOT written when `ENABLE_RECOMMENDATIONS=false`
- [ ] Audit row NOT written when chain fails (no misleading success log on error)

---

## Admin Sees Recommendations

- [ ] Admin user can view any patient's record in the admin panel
- [ ] Recommendations summary sentence visible in records list (expanded row or preview)
- [ ] Full categorized recommendations visible in record detail view
- [ ] Admin record view handles `null` recommendations gracefully (no crash, no blank section)

---

## Data Integrity

- [ ] `recommendations` stored as valid JSON object in DB — shape: `{summary: str, categories: {diet: [], exercise: [], lifestyle: [], monitoring: []}}`
- [ ] Old flat `list[str]` value (from pre-feature risk chain) does not crash the frontend — renders as flat list fallback
- [ ] Each category list has ≥ 1 item; `summary` is non-empty
- [ ] No patient PII in backend application logs at INFO level or below

---

## Risk Chain Isolation

- [ ] Risk chain (`POST /v1/records/{id}/risk-score`) no longer returns `recommendations` field in response body
- [ ] Risk chain failure does not affect recommendations endpoint, and vice versa
- [ ] Running risk score endpoint with `ENABLE_RECOMMENDATIONS=false` still returns valid risk data

---

## Performance

- [ ] Recommendations call completes in ≤ 8 seconds P95 (richer prompt, allow slightly more than risk score)
- [ ] Risk score renders before recommendations are ready (non-blocking UX — user sees score immediately)

---

## Merge Criteria

All E2E checks pass via manual walkthrough. Graceful degradation verified with flag off AND key revoked. Audit log row confirmed in DB. Admin view tested with admin credentials. No TypeScript errors (`npm run build`). No ESLint errors (`npm run lint`). Risk chain response shape confirmed clean (no `recommendations` bleed).
