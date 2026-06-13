# Validation — Periodic Health Assessment Resubmit

How to know the implementation is correct and ready to merge.

**Branch:** `feature/chatbot-rag` (implemented locally; not yet merged to `main`)

---

## DB & Seed

- [ ] `system_settings` table exists with singleton row `id=1`
- [ ] Fresh startup seeds `resubmit_interval_months=6` when row missing
- [ ] `RESUBMIT_INTERVAL_MONTHS_DEFAULT` env var overrides seed default

---

## Resubmit Status API

- [ ] New patient (`submission_count=0`) → `status=initial`, `can_submit_new=true`
- [ ] Patient with recent submission → `status=current`, `can_submit_new=false`
- [ ] Patient within 14 days of due → `status=upcoming`
- [ ] Patient past due date → `status=due`, `can_submit_new=true`, `is_due=true`
- [ ] `next_due_at` equals `latest_submission_at + interval_months`

---

## Backend Enforcement

- [ ] `POST /v1/records` succeeds for first submission
- [ ] `POST /v1/records` returns **400** when resubmit not due
- [ ] Second submission after due creates new record with new `id`/`pid`
- [ ] Prior records remain queryable via `GET /v1/records`
- [ ] New record inherits `doctor_id` from previous record when set

---

## Health Trends API

- [ ] `GET /v1/records/history/trends` returns submissions in ascending date order
- [ ] Each point includes glucose, BMI, BP, risk_level, risk_score (1/2/3)
- [ ] Empty history returns `{ submissions: [] }`

---

## Admin Settings

- [ ] Admin can `GET /v1/admin/settings` — returns current interval
- [ ] Admin can `PATCH` interval to value 1–36
- [ ] Values outside 1–36 rejected with **422**
- [ ] Non-admin receives **403** on settings endpoints
- [ ] Settings tab in admin UI persists change and shows confirmation

---

## Frontend UX

- [ ] `ResubmitBanner` shows correct copy for each status
- [ ] Due/initial states link to `/health-form`
- [ ] Health form blocked with message when `can_submit_new=false`
- [ ] Dashboard shows `HealthHistoryCharts` when ≥1 submission exists
- [ ] Records page shows "Resubmit Assessment" button only when due
- [ ] After resubmit, submission count increments; charts show new data point

---

## Merge Criteria

All checks pass on a clean `docker compose up --build` stack with demo patient completing at least two assessments (second after interval forced short via admin settings).
