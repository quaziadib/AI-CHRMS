## 1. Geo hierarchy & chart data APIs

- [x] 1.1 Add curated Bangladesh division→district→upazilla→thana JSON (or module) and `GET /v1/national/geo/...` children endpoints; verify cascading responses for Dhaka and one other division
- [x] 1.2 Add district→division mapping used by aggregates; verify unknown districts map to Other
- [x] 1.3 Implement `GET /v1/national/charts/divisions` and `GET /v1/national/charts/demographics` from anonymized aggregates with cell-size rules; verify no PII keys and empty-data responses

## 2. LLM individual predictor

- [x] 2.1 Add `ENABLE_NATIONAL_INDIVIDUAL_PREDICTOR` setting and LLM chain returning probability, risk level, category, confidence, top factors; verify unit test rejects classical-ML path and sanitizes input-only prompt
- [x] 2.2 Expose `POST /v1/national/predict-individual` for national_admin/admin; verify 403 for patient/doctor, 503 when flag off, and no PatientRecord insert

## 3. LLM epidemic forecast panel data

- [x] 3.1 Implement LLM structured epidemic forecast (urban/rural yearly series + three risk-group shares) and persist via population forecast job result shape (or dedicated result); verify XGBoost/ARIMA not invoked for this panel
- [x] 3.2 Expose load/enqueue endpoints used by the national forecast section; verify 503 when `ENABLE_POPULATION_FORECASTING=false`

## 4. National RSGI frontend

- [x] 4.1 Rebuild `/national` with RSGI section order using existing design-system cards: geo filters, predictor + spatial matrix, charts, forecast + risk cards; verify pattern discovery and resource table are not primary
- [x] 4.2 Wire cascading geo selectors + spatial matrix/hotspots/metrics strip to geo + summary APIs; verify reset and title updates
- [x] 4.3 Wire individual predictor form to LLM API with loading/error states and “not saved to records” copy; verify result badge/probability/factors render
- [x] 4.4 Add Recharts division prevalence and demographics charts; verify empty states
- [x] 4.5 Add multi-year urban/rural forecast chart + three risk-group cards; verify loading when forecast pending

## 5. Validation

- [x] 5.1 Add/extend backend tests for geo cascade, predictor auth/flags, chart PII absence, and LLM forecast flag gating; verify tests pass
- [x] 5.2 Manually verify national_admin RSGI flow on `/national` and that patient/doctor cannot call new national predictor endpoints
- [x] 5.3 Update `docs/API.md` for new national geo/predict/chart/forecast endpoints; verify paths match router
