# Requirements — LLM Recommendations

## What We're Building

A dedicated LangChain recommendations chain, separate from the risk scoring chain, that generates rich, categorized lifestyle and dietary advice from a patient's health profile. Triggered after risk scoring, served via its own endpoint, feature-flagged, and stored on the record.

---

## Context: What Already Exists

The risk chain (`app/ai/risk_chain.py`) already returns `recommendations: list[str]` (3–5 plain tips) as part of the `RiskAssessment` struct. These are stored in `PatientRecord.recommendations` (JSONB) and rendered in `risk-result.tsx` and `risk-widget.tsx`.

This feature replaces those brief tips with a richer, independently-callable output while keeping the existing field as storage target.

---

## Scope

### In Scope

- New `app/ai/recommendations_chain.py` — dedicated chain with richer structured output (categorized advice: diet, exercise, lifestyle, monitoring)
- New `POST /v1/records/{id}/recommendations` endpoint — callable independently of risk scoring
- Feature flag: `ENABLE_RECOMMENDATIONS` env var (default `true`). When `false`, endpoint returns 503 and risk chain tips remain the stored value
- DB: enrich stored recommendations from flat `list[str]` to structured JSONB (`{diet: [], exercise: [], lifestyle: [], monitoring: []}`)
- Frontend: update `risk-widget.tsx` and `record-detail.tsx` to render categorized sections
- Admin panel: recommendations visible on any patient record in admin view
- Audit log: `recommendations_generated` action on every successful call

### Out of Scope

- Meal plan generation (Phase 2 — requires longitudinal data)
- Exercise routine scheduling (Phase 2)
- RAG over patient history (Phase 2 — requires vector store)
- Email/push delivery of recommendations
- Re-generation UI button (can be added later — endpoint exists, just no frontend trigger in this phase)

---

## Key Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Separate chain | Yes — `recommendations_chain.py` | Independent prompt tuning; risk chain stays lean |
| Feature flag | `ENABLE_RECOMMENDATIONS: bool = True` in config | Zero-downtime disable if LLM costs spike or provider degrades |
| Storage | Overwrite existing `PatientRecord.recommendations` JSONB | No schema migration needed; enrich the value shape |
| Trigger | Called by service layer after risk scoring succeeds; also callable standalone | Ensures recs always follow a scored record; allows refresh without re-scoring |
| Output shape | Categorized dict, not flat list | Enables richer frontend rendering and future per-category actions |
| Graceful degradation | If chain fails: record saves, risk score saves, recommendations set to `null` — no 500 | LLM availability must not block record saves |

---

## LLM Output Contract

```python
class RecommendationCategory(BaseModel):
    diet: list[str]        # 2-3 specific food/nutrition tips
    exercise: list[str]    # 2-3 physical activity tips
    lifestyle: list[str]   # 2-3 sleep/stress/habit tips
    monitoring: list[str]  # 1-2 measurement/check-up reminders

class RecommendationsOutput(BaseModel):
    categories: RecommendationCategory
    summary: str           # 1-sentence overall guidance
```

---

## Feature Flag Behaviour

| `ENABLE_RECOMMENDATIONS` | Behaviour |
|--------------------------|-----------|
| `true` (default) | Recommendations chain runs after risk scoring; endpoint active |
| `false` | `POST /recommendations` returns HTTP 503 with `{"detail": "Recommendations disabled"}`. Risk chain's brief tips NOT stored — `recommendations` field remains `null` |

---

## Data Model

No migration needed. Existing `PatientRecord.recommendations` is JSONB — shape changes from `list[str]` to:

```json
{
  "summary": "Focus on reducing refined carbohydrates and increasing daily movement.",
  "categories": {
    "diet": ["...", "..."],
    "exercise": ["...", "..."],
    "lifestyle": ["...", "..."],
    "monitoring": ["..."]
  }
}
```

---

## Constraints (from mission.md + tech-stack.md)

- Same provider-agnostic LLM pattern as risk chain — `get_llm()` from `llm_factory.py`
- No patient PII in application logs
- Chain lives in `backend/app/ai/` — no separate service
- Structured output via Pydantic (no string parsing)
- Risk scoring must not fail if recommendations chain fails — decouple error handling
