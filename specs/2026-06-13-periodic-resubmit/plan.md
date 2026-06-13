# Plan — Periodic Health Assessment Resubmit

Numbered task groups in execution order. Each group is independently committable.

---

## Group 1 — Model & Seed

1.1 Create `backend/app/models/system_setting.py` — singleton `SystemSetting` with `resubmit_interval_months`, `updated_at`, `updated_by`.

1.2 Add `RESUBMIT_INTERVAL_MONTHS_DEFAULT: int = 6` to `backend/app/core/config.py`.

1.3 Add `seed_system_settings(db)` in `backend/app/db/init_db.py` — insert row `id=1` if missing.

1.4 Call seed from `main.py` lifespan.

---

## Group 2 — Services

2.1 Create `backend/app/services/settings.py`:
- `get_resubmit_interval_months(db) -> int`
- `update_system_settings(db, interval, admin_id) -> SystemSetting`
- `_add_months(dt, months) -> datetime` helper

2.2 Create `backend/app/services/resubmit.py`:
- `get_resubmit_status(db, user_id) -> ResubmitStatusResponse`
- `get_health_trends(db, user_id) -> HealthTrendsResponse`

2.3 Update `backend/app/services/record.py`:
- Before create: call resubmit check; raise 400 if not due
- On create: copy `doctor_id` from patient's previous record if exists
- Remove any single-record-per-user constraint

---

## Group 3 — API & Schemas

3.1 Create `backend/app/schemas/resubmit.py` — `SystemSettingsResponse`, `SystemSettingsUpdate`, `ResubmitStatusResponse`, `HealthTrendPoint`, `HealthTrendsResponse`.

3.2 Add to `backend/app/api/v1/records.py`:
- `GET /resubmit-status`
- `GET /history/trends`

3.3 Add to `backend/app/api/v1/admin.py`:
- `GET /settings`
- `PATCH /settings`

---

## Group 4 — Frontend API Client

4.1 Add types to `frontend/lib/api/types.ts`: `ResubmitStatus`, `SystemSettings`, `HealthTrends`, `HealthTrendPoint`.

4.2 Add to `frontend/lib/api/records.ts`: `getResubmitStatus()`, `getHealthTrends()`.

4.3 Add to `frontend/lib/api/admin.ts`: `getSettings()`, `updateSettings()`.

---

## Group 5 — Frontend UI

5.1 Create `frontend/features/dashboard/components/resubmit-banner.tsx` — four visual states + CTA to `/health-form`.

5.2 Create `frontend/features/dashboard/components/health-history-charts.tsx` — Recharts line charts (glucose, BMI, BP, risk).

5.3 Create `frontend/features/admin/components/settings-tab.tsx` — interval input 1–36, save button.

5.4 Update `frontend/app/(dashboard)/dashboard/page.tsx` — load resubmit status + trends; render banner + charts.

5.5 Update `frontend/app/(dashboard)/records/page.tsx` — resubmit banner + resubmit CTA when due.

5.6 Update `frontend/features/health-form/hooks/use-health-form.ts` — fetch resubmit status; block submit when `can_submit_new=false`.

5.7 Wire Settings tab into admin page.

---

## Group 6 — Docs & Roadmap

6.1 Update `specs/roadmap.md` — add periodic resubmit deliverable under Phase 2.

6.2 Manual E2E: admin sets interval → patient sees banner states → blocked mid-window → due → new record created → trends show 2+ points.
