## Context

See proposal.md. Observed today:

- `/national` implements Phase 3 panels: choropleth tiles, resources, CSV export, pattern discovery (`frontend/features/national/`).
- Design mock `rsgi.html` defines the target **flow**: geo hierarchy → predictor + spatial matrix → division/demo charts → multi-year forecast + risk cards.
- User requirement: keep **current AI-CHRMS design scheme**; take **functionality** from the mock; use **LLM** for predictions (not XGBoost / mock heuristics / ARIMAX).
- Patient records store `district` only — no upazilla/thana columns yet.
- LLM factory and national anonymization services already exist.

## Goals / Non-Goals

**Goals:**
- Rebuild national page IA to RSGI section order with existing shadcn/card styling
- Curated BD geo tree + LLM individual predictor + LLM epidemic forecast
- Charts from anonymized aggregates where possible; honest empty/synthesis states at finer grain

**Non-Goals:**
- Visual clone of the mock portal header/telemetry claims
- Classical ML training pipelines
- Persisting predictor runs into EHR

## Decisions

### 1. UI chrome
- **Choice:** Rebuild sections inside current dashboard layout/cards; reuse Recharts (already in app) instead of Chart.js CDN.
- **Why:** Matches “current design scheme” constraint.
- **Alt:** Embed mock HTML — rejected.

### 2. Geo hierarchy data
- **Choice:** Static JSON tree (8 divisions → districts → sample upazillas/thanas) shared FE/BE; filter APIs return children; spatial hotspots for sub-district levels use curated baselines + optional LLM narrative when no record grain exists.
- **Why:** Records lack upazilla/thana; full BD GIS out of scope.
- **Alt:** Add DB columns now — deferred.

### 3. Individual predictor
- **Choice:** `POST /v1/national/predict-individual` with Pydantic structured LLM output: `probability_percent`, `risk_level`, `category_label`, `confidence_percent`, `top_factors[]`. Flag `ENABLE_NATIONAL_INDIVIDUAL_PREDICTOR`.
- **Why:** Explicit anti-XGBoost requirement; aligns with `risk_chain` patterns.
- **Alt:** Client-side heuristic from mock — rejected.

### 4. Charts
- **Choice:** `GET /v1/national/charts/divisions` and `.../demographics` built from anonymized record aggregates grouped by district→division mapping; fallback synthesis labeled as illustrative when data sparse (respect min cell size).
- **Why:** Privacy + usable MVP.

### 5. Epidemic forecast
- **Choice:** LLM structured output for urban/rural yearly series + three risk-group shares; store latest job result like existing population forecast jobs; UI shows line chart + cards. Do not call statsmodels ARIMA for this panel.
- **Why:** User asked LLM not classical engines for predictions.
- **Alt:** Keep ARIMA district jobs for old resources API only (secondary).

### 6. Demoting prior panels
- **Choice:** Remove pattern discovery and resource table from default national page; leave endpoints intact behind flags for later.
- **Why:** RSGI flow replaces primary UX.

## Risks / Trade-offs

- [LLM latency on predictor] → Loading state; optional short timeout with clear error
- [Hallucinated spatial rates at thana level] → Label synthesis; prefer real district aggregates when mapping exists
- [Division mapping from free-text district] → Maintain explicit district→division dictionary; unknown → “Other”
- [Users confuse predictor with patient EHR] → Copy: “What-if simulation — not saved to records”

## Migration Plan

1. Ship geo tree + RSGI page shell with empty/loading states
2. Wire LLM predictor + chart endpoints
3. Wire LLM epidemic forecast + cards
4. Hide old primary panels; keep APIs
5. Rollback via feature flags / revert page composition

## Open Questions

- Exact default curated hotspot percentages for empty-data demos (product can tune without spec change)
