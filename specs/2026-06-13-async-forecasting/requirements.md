# Requirements — Async Time-Series Forecasting

## What We're Building

Background jobs forecast a patient's **blood glucose trajectory** 6 months forward using historical snapshots. Jobs run via **Celery + Redis** with synchronous fallback. Results display in a **ProgressionChart** on the records page and dashboard.

---

## Context: What Already Exists

- `PatientRecord` with `blood_glucose`, `risk_level`, timestamps
- Multi-record history from periodic resubmit feature
- Patient dashboard with health trend charts (actual values only)
- Docker Compose with Postgres backend

This feature adds **predictive** glucose forecasting as an async ML job, separate from descriptive trend charts.

---

## Scope

### In Scope

- **`ForecastJob` model** — status lifecycle: `pending` → `running` → `completed` | `failed`
- **`HealthSnapshot` model** — glucose snapshots captured on record create/update/score
- **`forecast_service.py`** — ARIMA(1,1,1) when ≥4 data points; linear trend fallback; synthetic series when <3 snapshots
- **Celery task** — `app.tasks.forecast.run_forecast_job`
- **Redis broker** — `REDIS_URL` env var; Redis service in `docker-compose.yml`
- **Celery worker** — separate container running `celery -A app.celery_app worker`
- **API** — enqueue, poll job, get latest forecast
- **Feature flag** — `ENABLE_FORECASTING` (default `true`)
- **Sync fallback** — if Celery enqueue fails, run job in-process
- **Frontend `ProgressionChart`** — Recharts line chart; polls every 2s while pending/running

### Out of Scope

- LSTM / deep learning models (roadmap mentioned LSTM; implementation uses statsmodels ARIMA)
- Forecasting BMI, BP, or other vitals (glucose only)
- WebSocket push notifications on job completion
- Doctor dashboard forecast view (patient records page only)
- Population-level forecasting (Phase 3)

---

## Key Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Model | statsmodels ARIMA(1,1,1) | Lightweight; no GPU; fits Docker worker |
| Fallback | Linear trend | Works with sparse data |
| Synthetic data | Generated from baseline glucose + risk trend | Enables demo with single submission |
| Job storage | `ForecastJob.result` JSONB | Poll-friendly; no separate results table |
| Async transport | Celery + Redis | Standard Python task queue; Docker-friendly |
| Enqueue failure | Sync execution in API process | Dev resilience when Redis unavailable |
| Horizon | 6 monthly forecast points | Matches clinical review cadence |
| Prerequisite | `risk_level` required | Ties forecast to assessed record |

---

## Forecast Result Shape

```json
{
  "model": "arima" | "trend" | "synthetic",
  "summary": "One paragraph interpretation for patient",
  "points": [
    { "date": "2026-01-01", "glucose_mg_dl": 110.5, "kind": "actual" },
    { "date": "2026-07-01", "glucose_mg_dl": 118.2, "kind": "forecast" }
  ]
}
```

---

## API Contract

```
POST /v1/records/{id}/forecast
→ 202 ForecastJob { id, status: "pending", ... }

GET /v1/records/{id}/forecast/latest
→ 200 ForecastJob | 404

GET /v1/records/{id}/forecast/{job_id}
→ 200 ForecastJob

Errors:
  400 — no risk_level
  403 — not owner
  503 — ENABLE_FORECASTING=false
```

---

## Infrastructure

| Service | Port | Purpose |
|---------|------|---------|
| `redis` | 6379 | Celery broker + result backend |
| `celery_worker` | — | Executes `run_forecast_job` |
| `backend` | 8000 | Enqueues jobs via `REDIS_URL` |

Env: `REDIS_URL=redis://redis:6379/0` in Docker; `redis://localhost:6379/0` locally.

---

## Constraints

- Forecast job failure must not affect record CRUD
- Multiple jobs per record allowed; UI shows latest completed
- Snapshots are append-only per record lifecycle event
- No PHI in Celery task logs beyond record/job IDs
