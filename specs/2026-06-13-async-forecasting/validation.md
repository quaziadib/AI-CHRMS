# Validation — Async Time-Series Forecasting

How to know the implementation is correct and ready to merge.

**Branch:** `feature/chatbot-rag` (implemented locally; not yet merged to `main`)

**Infra required:** `docker compose up` with `redis` + `celery_worker` services running.

---

## Infrastructure

- [ ] `redis` container healthy on port 6379
- [ ] `celery_worker` container running without import errors
- [ ] Backend `REDIS_URL=redis://redis:6379/0` in Docker Compose
- [ ] `forecast_jobs` and `health_snapshots` tables exist after startup

---

## Snapshot Capture

- [ ] New record create inserts `health_snapshot` row with glucose value
- [ ] Record update/score adds or updates snapshot data
- [ ] Multiple resubmissions accumulate snapshots for same user

---

## Job Lifecycle

- [ ] `POST /v1/records/{id}/forecast` returns **202** with `status=pending`
- [ ] Celery worker picks up job → `status=running` → `status=completed`
- [ ] `result` JSONB contains `model`, `summary`, `points[]`
- [ ] Points include both `kind=actual` and `kind=forecast` entries
- [ ] Failed job sets `status=failed` with `error_message` (simulate bad data if needed)

---

## Sync Fallback

- [ ] Stop `celery_worker` → enqueue still completes (sync in API process)
- [ ] Job reaches `completed` without worker running

---

## Feature Flag & Auth

- [ ] `ENABLE_FORECASTING=false` → **503** on enqueue
- [ ] Record without `risk_level` → **400**
- [ ] Non-owner → **403**
- [ ] `GET /forecast/latest` returns most recent job for record

---

## Frontend ProgressionChart

- [ ] Chart loads latest completed forecast on mount
- [ ] "Generate Forecast" enqueues new job
- [ ] Loading state shown while `pending`/`running`
- [ ] Poll stops when job completes or fails
- [ ] Summary text displayed below chart
- [ ] Actual and forecast lines visually distinct in Recharts

---

## Model Behaviour (Manual)

- [ ] ≥4 snapshots → `model=arima` in result
- [ ] Single submission with risk score → synthetic/trend path still produces 6 forecast points
- [ ] Forecast glucose values within plausible range (not negative, not >600)

---

## Merge Criteria

Full async path works with Redis + worker; chart polls to completion; sync fallback verified; feature flag tested.
