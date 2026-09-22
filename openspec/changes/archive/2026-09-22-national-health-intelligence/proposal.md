## Why

Phase 3 delivers Sabbir's national-policy needs: Bangladesh lacks a privacy-safe view of district-level diabetes burden, forward-looking case counts, and resource demand. Patient and clinical features (Phases 1–2) now produce district-tagged records; national admins still land on a "Coming in Phase 3" placeholder at `/national`.

## What Changes

- Replace the national-admin placeholder with a live National Health Dashboard
- Add a privacy-critical anonymization layer so aggregates and exports never include PII
- District choropleth of diabetes prevalence / risk distribution (anonymized counts)
- District-level population trend forecasts (6/12 months)
- Resource-allocation views (clinics, medicines, testing kits) derived from forecasts
- Downloadable analytics exports (CSV required; PDF optional if feasible)
- On-demand LLM pattern discovery over anonymized aggregates (feature-flagged)
- Role-gated APIs restricted to `national_admin` (and maintainer/admin as needed for ops)

## Non-goals

- Per-patient drill-down or re-identification from national views
- Real GIS basemap licensing / offline tile servers (use static district GeoJSON or SVG)
- LSTM/deep models for population forecast (reuse statistical approach like patient forecasting)
- Self-hosted LLMs, MLflow, or Kubernetes (Phase ∞)
- Email/push alerts for national admins
- Changing patient, doctor, or individual forecasting flows beyond shared district field usage

## Capabilities

### New Capabilities
- `data-anonymization`: Strip/exclude PII before any national aggregate, forecast input, export, or LLM pattern analysis
- `national-analytics`: District aggregates, choropleth map, resource-allocation dashboard, and analytics export for national admins
- `population-forecasting`: District-level case-count forecasts for 6/12 month horizons
- `pattern-discovery`: Feature-flagged LLM insights from anonymized clinical aggregates

### Modified Capabilities
- `role-navigation`: Replace national-admin placeholder requirement with the live national dashboard experience

## Impact

- **Frontend:** `frontend/app/(dashboard)/national/page.tsx` and new `frontend/features/national/` (map, charts, export, insights)
- **Backend:** New `/v1/national/*` routes, anonymization service, aggregate queries on `PatientRecord.district` / risk fields, Celery jobs for population forecasts, optional PDF/CSV export
- **Data:** District field already on records (`frontend/lib/health-form-schema.ts` district list — treat as MVP geography; document mapping to BD districts)
- **Auth:** Extend deps for `national_admin`; audit log national exports and pattern runs
- **Flags:** `ENABLE_NATIONAL_ANALYTICS`, `ENABLE_POPULATION_FORECASTING`, `ENABLE_PATTERN_DISCOVERY`
- **Deps:** Possible lightweight GeoJSON asset; reuse Celery/Redis and LangChain patterns from Phase 2
