## 1. Config, auth, and anonymization foundation

- [x] 1.1 Add `ENABLE_NATIONAL_ANALYTICS`, `ENABLE_POPULATION_FORECASTING`, `ENABLE_PATTERN_DISCOVERY`, and `NATIONAL_MIN_CELL_SIZE` (default 5) to backend settings and verify they load from env
- [x] 1.2 Add `require_national_admin` dependency (allow `national_admin` or `admin` roles) in `app/api/deps.py` and verify unauthorized roles receive 403 in a focused test or manual call
- [x] 1.3 Implement anonymized district aggregation service (allowlisted columns only, cell-size suppression) and verify unit tests cover suppression and absence of name/email/user_id fields

## 2. National analytics API

- [x] 2.1 Create `/v1/national` router with `GET /districts/summary` gated by flags + role; verify national_admin succeeds and patient/doctor get 403; flag-off returns 503
- [x] 2.2 Add `GET /v1/national/resources` using deterministic conversion constants from config; verify response shape has clinic/medicine/kit estimates per non-suppressed district
- [x] 2.3 Add `GET /v1/national/export.csv` streaming anonymized district summary; verify CSV has no PII columns and completes under normal load within 10s for seed-scale data
- [x] 2.4 Emit audit events for successful exports; verify an audit row is written with actor and action

## 3. Population forecasting backend

- [x] 3.1 Add population forecast job model/storage for district time-series results and verify migrations/table create on startup
- [x] 3.2 Implement Celery task + sync fallback to compute 6/12-month district forecasts from anonymized monthly aggregates; verify fallback path when enqueue fails
- [x] 3.3 Expose `POST /v1/national/forecasts` and `GET /v1/national/forecasts/latest`; verify 503 when `ENABLE_POPULATION_FORECASTING=false` and completed jobs populate resources endpoint on refresh

## 4. Pattern discovery backend

- [x] 4.1 Implement LLM pattern chain that accepts only anonymized aggregate JSON and returns structured insight statements; verify prompt builder rejects/omits PII fields in unit tests
- [x] 4.2 Add `POST /v1/national/patterns` with feature flag + audit; verify 503 when disabled, empty-data short-circuit without LLM call, and successful run writes audit

## 5. National dashboard frontend

- [x] 5.1 Replace `/national` placeholder with dashboard shell + API hooks under `frontend/features/national/`; verify national_admin no longer sees "Coming in Phase 3"
- [x] 5.2 Build district choropleth (static GeoJSON/SVG for MVP district labels) bound to summary API; verify empty-data state and color scale for risk/prevalence
- [x] 5.3 Add resource allocation table/section and CSV export button; verify download triggers and table updates after forecast completion (poll or refresh)
- [x] 5.4 Add pattern discovery panel (trigger + insight list) hidden/disabled when flag off; verify insights render from API response

## 6. Validation and docs

- [x] 6.1 Add backend tests for auth, suppression, export PII absence, and flag gating; verify test suite for new modules passes
- [x] 6.2 Manually verify role isolation: national_admin can use `/national`; patient/doctor cannot call `/v1/national/*`; national nav still excludes health form
- [x] 6.3 Update `docs/API.md` with `/v1/national` endpoints and env flags; verify documented paths match the router
