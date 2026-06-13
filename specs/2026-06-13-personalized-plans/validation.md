# Validation — Personalized Meal & Exercise Plans

How to know the implementation is correct and ready to merge.

**Branch:** `feature/chatbot-rag` (implemented locally; not yet merged to `main`)

**Env required:** LLM provider API key matching `LLM_PROVIDER` (default Anthropic).

---

## Chain & Storage

- [ ] `POST /v1/records/{id}/personalized-plan` returns record with populated `personalized_plan`
- [ ] JSON shape: `{ meal_plan_summary, meals[], exercise_summary, exercises[] }`
- [ ] Each meal day has breakfast, lunch, dinner, snack
- [ ] Each exercise day has activity, duration_minutes (10–120), notes
- [ ] `personalized_plan_at` set on successful generation
- [ ] Auto-generation runs after risk score on record create (check logs or DB)

---

## Feature Flag & Errors

- [ ] `ENABLE_PERSONALIZED_PLANS=false` → endpoint returns **503**
- [ ] Record without `risk_level` → **400**
- [ ] Non-owner patient → **403**
- [ ] LLM failure during auto-generate does not fail record save (plan remains null)

---

## Audit

- [ ] Successful manual generate writes `personalized_plan_generated` to `audit_logs`
- [ ] Failed generate does not write audit row

---

## Frontend Widget

- [ ] Empty state shows when `personalized_plan` is null
- [ ] "Generate Plan" disabled when record has no `risk_level`
- [ ] Summary cards show truncated meal/exercise overviews
- [ ] Week-at-a-glance horizontal scroll renders 7 day pills
- [ ] "View full 7-day plan" expands meal details and exercise list
- [ ] "Refresh" re-calls API and updates widget without page reload
- [ ] Toast on success/failure

---

## Content Quality (Manual)

- [ ] Meals reference Bangladesh-appropriate foods (not generic Western-only diet)
- [ ] Exercise intensity reasonable for stated physical activity level
- [ ] Plan references patient's risk level or lab values in summaries

---

## Merge Criteria

Plan generates end-to-end on demo patient record; widget renders compact and expanded views; feature flag and graceful degradation verified.
