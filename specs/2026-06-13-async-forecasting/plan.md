# Plan — Async Time-Series Forecasting

Numbered task groups in execution order.

---

## Group 1 — Dependencies & Config

1.1 Add to `backend/pyproject.toml`: `celery>=5.4`, `redis>=5.0`, `statsmodels>=0.14`.

1.2 Add to `backend/app/core/config.py`:
- `ENABLE_FORECASTING: bool = True`
- `REDIS_URL: str = "redis://localhost:6379/0"`

1.3 Create `backend/app/celery_app.py` — Celery app bound to `REDIS_URL`.

---

## Group 2 — Models

2.1 Create `backend/app/models/forecast_job.py`:
- `id`, `record_id`, `user_id`, `status`, `result` (JSONB), `error_message`, timestamps

2.2 Create `backend/app/models/health_snapshot.py`:
- `record_id`, `user_id`, `blood_glucose`, `captured_at`

2.3 Create `backend/app/services/snapshot.py` — capture snapshot on record events.

2.4 Register models in `init_db.py`.

---

## Group 3 — Forecast Logic

3.1 Create `backend/app/services/forecast.py`:
- Load snapshots for user/record
- ≥4 points → ARIMA(1,1,1) via statsmodels
- 3 points → linear trend
- <3 → synthetic monthly series from baseline + risk-level drift
- Return `{ model, summary, points[] }`

3.2 Create `backend/app/tasks/forecast.py`:
- `@celery_app.task` `run_forecast_job(job_id: str)`
- Update status `running` → `completed` | `failed`
- Store result JSONB or error message

---

## Group 4 — Job Orchestration & API

4.1 Create `backend/app/services/forecast_job.py`:
- `enqueue_forecast()` — create job, `delay()`, sync fallback on exception
- `get_forecast_job()`, `get_latest_forecast()`

4.2 Create `backend/app/schemas/forecast.py` — `ForecastJobResponse`, `ForecastResult`.

4.3 Add to `backend/app/api/v1/records.py`:
- `POST /{id}/forecast` → 202
- `GET /{id}/forecast/latest`
- `GET /{id}/forecast/{job_id}`

4.4 Wire snapshot capture in `services/record.py` on create/update/score.

---

## Group 5 — Docker

5.1 Add `redis` service to `docker-compose.yml` (port 6379).

5.2 Add `celery_worker` service:
```yaml
command: celery -A app.celery_app worker --loglevel=info
environment:
  REDIS_URL: redis://redis:6379/0
```

5.3 Set `REDIS_URL` on `backend` service.

---

## Group 6 — Frontend

6.1 Add `ForecastJob`, `ForecastResult`, `ForecastPoint` types to `frontend/lib/api/types.ts`.

6.2 Add forecast methods to `frontend/lib/api/records.ts`.

6.3 Create `frontend/features/records/components/progression-chart.tsx`:
- Load latest job on mount
- Poll every 2s while `pending` | `running`
- Recharts line: actual vs forecast points (different styling)
- "Generate Forecast" / "Refresh Forecast" button
- Show `summary` text when completed

6.4 Mount on records page and dashboard (below assessment report).

---

## Group 7 — Validation & Docs

7.1 Manual: enqueue job → worker logs → chart updates without full page reload.

7.2 Test Redis down: sync fallback completes job in API process.

7.3 Update `specs/roadmap.md` and `specs/tech-stack.md`.
