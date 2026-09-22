## Context

See proposal.md for motivation. Observed today:

- `/national` is a Phase 3 placeholder; role guards already route `national_admin` there (`frontend/app/(dashboard)/layout.tsx`).
- `PatientRecord.district` and `risk_level` exist; district vocabulary is the MVP list in `frontend/lib/health-form-schema.ts` (not full BD admin districts).
- Patient forecasting already uses Celery + Redis with sync fallback (`ENABLE_FORECASTING`); reuse that pattern for population jobs.
- API routers are role-segmented under `/v1` (`admin`, `doctor`, `records`, `chat`); no `/v1/national` yet.
- Audit logging exists for sensitive actions; national exports and pattern runs must follow it.

## Goals / Non-Goals

**Goals:**
- Single anonymization path shared by aggregates, exports, forecasts, and LLM prompts
- National APIs that never return patient rows
- Dashboard UX replacing the placeholder without changing other roles' nav contracts beyond the modified national-home requirement

**Non-Goals:**
- Perfect official BD GIS topology (MVP map keyed to current district strings + static shapes for those labels)
- Separating national analytics into a microservice
- Guaranteeing PDF export in v1 (CSV is the acceptance bar)

## Decisions

### 1. Anonymization as a pure service layer (not a second database)
- **Choice:** `anonymization` service builds aggregate DTOs from SQL `GROUP BY district` (and time buckets) with allowlisted columns only; never SELECT name/email/user_id into national responses.
- **Why:** Simpler than ETL into a warehouse; matches current monolith.
- **Alternatives:** Materialized anonymized tables — deferred until volume justifies it.

### 2. Minimum cell size
- **Choice:** Config `NATIONAL_MIN_CELL_SIZE` (default 5). Districts below threshold return `suppressed: true` without raw counts (or with counts coarsened to a bucket).
- **Why:** Roadmap requires zero PII and small-n re-identification risk.
- **Alternatives:** Always show counts — rejected for privacy.

### 3. Geography
- **Choice:** Keep current district string list for MVP. Ship a static GeoJSON/SVG asset mapping those labels; unknown/"Other" renders in a table-only row.
- **Why:** Form already collects these values; remapping to official BD districts is a later data migration.
- **Alternatives:** Immediate official 64-district model — out of scope without form/data migration.

### 4. API surface
- **Choice:** New router `/v1/national/*` with `require_national_admin`:
  - `GET /districts/summary` — map + table metrics
  - `GET /resources` — allocation estimates
  - `GET /export.csv` — CSV download
  - `POST /forecasts` + `GET /forecasts/latest` — population jobs
  - `POST /patterns` — LLM insights
- **Why:** Mirrors `/doctor` and `/admin` segmentation.
- **Alternatives:** Stuff under `/admin` — rejected; national_admin is not maintainer.

### 5. Population forecast model
- **Choice:** Monthly anonymized district time series (record creates / high-risk counts). ARIMA or linear trend when ≥N points; otherwise flat/unavailable. Celery task + sync fallback; flag `ENABLE_POPULATION_FORECASTING`.
- **Why:** Aligns with patient `async-forecasting` without LSTM complexity.
- **Alternatives:** Always-sync only — risk of slow requests under load.

### 6. Resource conversion rules
- **Choice:** Deterministic formulas from forecasted high-risk / case counts (documented constants in config, e.g. kits per high-risk case). No ML.
- **Why:** Explainable for policy users; easy to tune.
- **Alternatives:** LLM-estimated resources — too opaque for allocation.

### 7. Map rendering
- **Choice:** Client-side choropleth (SVG/GeoJSON + simple color scale) in `frontend/features/national/`; data from summary API.
- **Why:** No tile server; fits Next.js dashboard.
- **Alternatives:** Leaflet + Mapbox — extra dependency and keys for little MVP gain.

### 8. Pattern discovery
- **Choice:** LangChain structured output over JSON aggregates only; `ENABLE_PATTERN_DISCOVERY`; audit on success.
- **Why:** Matches existing LLM factory pattern; privacy via anonymization gate.

### 9. Feature flags
- **Choice:** `ENABLE_NATIONAL_ANALYTICS` gates map/summary/export; nested flags for forecasting and patterns. When master flag is off, `/national` shows a disabled state (not the old "Coming in Phase 3" marketing placeholder).

## Risks / Trade-offs

- [Sparse early data] → Empty states + cell suppression; seed demo aggregates only in non-prod if needed
- [District label mismatch vs real BD map] → Document MVP geography; plan later remapping
- [Re-identification via cross-tabs] → Limit dimensions in v1 (district × risk only); no age×gender×district crosstabs until reviewed
- [LLM hallucinated “patterns”] → UI labels insights as exploratory; require aggregate caveats in prompt
- [Export latency vs 10s SLO] → Pre-aggregate in SQL; CSV only for v1 acceptance; cache latest summary optionally

## Migration Plan

1. Ship anonymization + summary + map behind `ENABLE_NATIONAL_ANALYTICS` (default on in dev)
2. Add forecast jobs + resource view behind `ENABLE_POPULATION_FORECASTING`
3. Add pattern discovery behind `ENABLE_PATTERN_DISCOVERY`
4. Replace placeholder page; update role-navigation main spec on archive
5. Rollback: disable flags; national page shows disabled state; no schema destructive changes required beyond dropping new forecast tables if needed

## Open Questions

- Exact default constants for kits/clinics/medicines per projected case (product can tune post-ship without spec change)
- Whether maintainer/admin dual-role users see national APIs by default (assume yes if roles include `national_admin` OR `admin` for ops debugging — confirm at apply if product prefers national-only)
