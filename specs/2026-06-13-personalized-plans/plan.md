# Plan — Personalized Meal & Exercise Plans

Numbered task groups in execution order.

---

## Group 1 — Config & Model

1.1 Add `ENABLE_PERSONALIZED_PLANS: bool = True` to `backend/app/core/config.py`.

1.2 Add to `PatientRecord` model:
- `personalized_plan: JSONB | null`
- `personalized_plan_at: datetime | null`

1.3 Add `ADD COLUMN IF NOT EXISTS` migration in `init_db.py`.

1.4 Document flag in `backend/.env.example` and `docker-compose.yml`.

---

## Group 2 — Plans Chain

2.1 Create `backend/app/ai/plans_chain.py`:
- Pydantic models: `MealDay`, `ExerciseDay`, `PersonalizedPlanOutput`
- System prompt: Bangladesh nutrition coach; district-appropriate foods
- Human prompt: full patient profile + risk level/explanation
- `run_personalized_plan_chain(record) -> PersonalizedPlanOutput`

---

## Group 3 — Service Layer

3.1 In `backend/app/services/record.py`:
- `_maybe_generate_plan(db, record, user_id)` — called after risk score if flag enabled
- `generate_plan_record(db, record_id, user_id, roles)` — manual endpoint handler
- try/except: failure sets plan null, logs error, does not rollback risk score

3.2 Audit: `log_audit(..., "personalized_plan_generated", ...)`.

---

## Group 4 — API

4.1 Add `POST /v1/records/{id}/personalized-plan` to `records.py`:
- Check `ENABLE_PERSONALIZED_PLANS`
- Verify ownership (patient own record or admin)
- Require `risk_level`
- Return updated `RecordResponse`

4.2 Include `personalized_plan` and `personalized_plan_at` in response schema.

---

## Group 5 — Frontend

5.1 Add `PersonalizedPlan`, `MealDay`, `ExerciseDay` types to `frontend/lib/api/types.ts`.

5.2 Add `recordsApi.generatePlan(id)` to `frontend/lib/api/records.ts`.

5.3 Create `frontend/features/records/components/personalized-plan-widget.tsx`:
- Empty state with "Generate Plan" CTA
- Meal/exercise summary cards (essence text)
- Horizontal week-at-a-glance day pills
- Expandable full 7-day `<details>` meals + exercise list
- "Refresh" button

5.4 Mount widget on `frontend/app/(dashboard)/records/page.tsx` below assessment report.

---

## Group 6 — Validation & Roadmap

6.1 Manual E2E: submit form → plan auto-generates (or manual trigger) → widget shows summaries → expand full plan.

6.2 Test `ENABLE_PERSONALIZED_PLANS=false` → 503 on endpoint; record save still works.

6.3 Mark Phase 2 personalized plans deliverable in `specs/roadmap.md`.
