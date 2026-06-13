# Requirements — Personalized Meal & Exercise Plans

## What We're Building

After risk scoring, an LLM generates a **7-day meal plan** and **weekly exercise routine** tailored to the patient's health profile, risk level, and Bangladesh-appropriate foods. Plans are stored on the record and surfaced in a compact, scannable widget on the records page.

---

## Context: What Already Exists

- `recommendations_chain.py` — categorized diet/exercise/lifestyle tips (not full meal schedules)
- `PatientRecord` with `risk_level`, `risk_explanation`, full health form fields
- Risk scoring auto-runs on record create/update
- Records page with risk assessment display

This feature adds **actionable weekly plans** — specific meals per day and exercise sessions — distinct from brief recommendation bullets.

---

## Scope

### In Scope

- **`plans_chain.py`** — LangChain structured output: 7-day meals + exercises
- **DB fields** — `personalized_plan` (JSONB), `personalized_plan_at` (timestamp) on `PatientRecord`
- **`POST /v1/records/{id}/personalized-plan`** — manual generate/refresh
- **Auto-trigger** — after successful risk scoring on create/update (non-fatal on failure)
- **Feature flag** — `ENABLE_PERSONALIZED_PLANS` (default `true`); **503** when disabled
- **Audit** — `personalized_plan_generated` action logged
- **Frontend widget** — summary cards, week-at-a-glance scroll, expandable full plan
- **Bangladesh context** — prompt references rice, lentils, fish, roti, district foods

### Out of Scope

- Grocery lists or calorie/macronutrient breakdowns
- Integration with external fitness trackers
- Doctor approval workflow before showing plan
- Email/PDF export of plan
- Per-day plan editing by patient

---

## Key Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Storage | JSONB on same `PatientRecord` | No new table; plan tied to assessment snapshot |
| Trigger | Auto after risk score + manual refresh | Plan always reflects current risk context |
| Failure mode | Log exception; record save succeeds | LLM outage must not block assessment |
| Prerequisite | `risk_level` required | Plan needs risk context |
| Output length | 5–7 days meals + exercises | Full week without overwhelming UI |
| UI truncation | `essence()` / `shortenTip()` helpers | Scannable summaries; full detail on expand |

---

## LLM Output Contract

```python
class MealDay(BaseModel):
    day: str
    breakfast: str
    lunch: str
    dinner: str
    snack: str

class ExerciseDay(BaseModel):
    day: str
    activity: str
    duration_minutes: int  # 10–120
    notes: str

class PersonalizedPlanOutput(BaseModel):
    meal_plan_summary: str      # 2–3 sentences
    meals: list[MealDay]        # 5–7 items
    exercise_summary: str       # 2–3 sentences
    exercises: list[ExerciseDay]  # 5–7 items
```

Stored JSON shape matches `PersonalizedPlanOutput.model_dump()`.

---

## API Contract

```
POST /v1/records/{id}/personalized-plan
Authorization: Bearer <patient (owner) or admin>
Response: PatientRecord (with personalized_plan populated)

Errors:
  400 — no risk_level on record
  403 — not owner
  404 — record not found
  503 — ENABLE_PERSONALIZED_PLANS=false
  502 — LLM unavailable
```

---

## Constraints

- Same provider-agnostic LLM pattern as other chains (`get_llm()`)
- Plan regeneration overwrites prior `personalized_plan` on same record
- Resubmit creates new record → new plan generated on that record's risk score
- No patient PII in application logs
