## Why

The national `/national` dashboard currently follows a Phase 3 ops layout (district summary map, resource table, CSV export, pattern discovery). Stakeholders want the **RSGI spatial-intelligence flow** from `rsgi.html`: hierarchical Bangladesh geography filters, an individual risk predictor beside a spatial prevalence matrix, division/demographic charts, and a multi-year epidemic forecast. Predictions must use the project's **LLM stack**, not XGBoost / heuristic / ARIMAX engines shown in the mock.

## What Changes

- Rebuild `/national` information architecture to match RSGI sections while keeping the **existing AI-CHRMS design system** (shadcn cards, current nav/layout — not the mock's dark glass portal chrome)
- Add cascading **Division → District → Upazilla → Thana** filters that drive spatial panels
- Add **Individual Risk Predictor** (age, gender, BMI, fasting glucose, family history, activity) returning probability %, risk category, confidence, and top factor labels via **LLM structured output**
- Replace the simple choropleth-first layout with a **spatial risk matrix** (hotspots for the selected geo scope) plus regional metric strip
- Add **division-wise prevalence** and **gender×age demographic** charts fed by anonymized aggregates (and LLM-assisted synthesis where grain is finer than stored data)
- Evolve national epidemic forecast UI to a **multi-year urban/rural trajectory** with low / prediabetes / high risk population cards — forecast generation via **LLM** (feature-flagged), not XGBoost
- Demote current resource-allocation / pattern-discovery panels from primary flow (APIs may remain behind feature flags; not the default national home)

## Non-goals

- Porting the mock's Tailwind glass/dark aesthetic wholesale
- Training or serving XGBoost, ResNet-Spatial, ARIMAX, or real SHAP
- Storing individual predictor runs as patient EHR records
- Live satellite telemetry or claiming 1.4M citizen sample size
- Changing patient/doctor dashboards or the patient health-form risk flow
- Full official BD GIS polygons for every thana (MVP: curated hierarchy + stylized spatial matrix)

## Capabilities

### New Capabilities
- `national-geo-hierarchy`: Cascading BD admin filters (division/district/upazilla/thana) for the national dashboard
- `national-individual-predictor`: LLM-based individual diabetes risk prediction widget for national admins

### Modified Capabilities
- `national-analytics`: Restructure national home to RSGI flow — spatial matrix, regional metrics, division & demographic charts; keep anonymization and role gates
- `population-forecasting`: Multi-year urban/rural epidemic forecast + risk-group cards driven by LLM (not classical ML models)

## Impact

- **Frontend:** `frontend/app/(dashboard)/national/page.tsx`, `frontend/features/national/*` rebuilt around RSGI sections; Recharts for charts
- **Backend:** New/extended `/v1/national` endpoints for geo tree, LLM individual predict, chart series, LLM epidemic forecast; reuse anonymization + LLM factory
- **Flags:** `ENABLE_NATIONAL_ANALYTICS`, add `ENABLE_NATIONAL_INDIVIDUAL_PREDICTOR`; keep forecasting flag
- **Privacy:** Individual predictor is synthetic what-if (no PII persistence); charts/forecasts remain anonymized aggregates
