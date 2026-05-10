# Requirements — LLM Risk Scoring

## What We're Building

A LangChain-powered risk scoring chain that takes a patient's 8-step health form data, calls an LLM, and returns a structured diabetes risk assessment. Result shown inline after form submit and persisted to the patient's dashboard widget.

---

## Scope

### In Scope
- Backend: LangChain chain (provider-agnostic `ChatModel`) that accepts health form data and returns structured risk output
- Backend: `POST /v1/records/{id}/risk-score` endpoint that invokes the chain and stores the result
- Backend: DB schema additions to store risk score output alongside the patient record
- Frontend: Inline result display shown immediately after health form submission
- Frontend: Persistent risk widget on patient dashboard (loads from stored result)

### Out of Scope
- Chatbot (separate Phase 1 deliverable)
- Doctor dashboard (separate deliverable)
- Async job queue (not needed — LLM call is synchronous at MVP scale)
- RAG / patient history retrieval (Phase 2)

---

## LLM Output Contract

Single LLM call returns all three fields. Parsed via Pydantic structured output.

```python
class RiskAssessment(BaseModel):
    risk_level: Literal["low", "moderate", "high"]
    explanation: str   # 2-3 sentences, plain language, names top contributing factors
    recommendations: list[str]  # 3-5 personalised diet/lifestyle tips
```

---

## LLM Provider Strategy

Provider-agnostic: configured via `LLM_PROVIDER` env var (`openai` | `anthropic` | `google`). LangChain `ChatModel` interface — swap provider without changing chain logic.

| Env Var | Purpose |
|---------|---------|
| `LLM_PROVIDER` | Which provider to instantiate (`openai` / `anthropic` / `google`) |
| `OPENAI_API_KEY` | Required if provider = openai |
| `ANTHROPIC_API_KEY` | Required if provider = anthropic |
| `GOOGLE_API_KEY` | Required if provider = google |
| `LLM_MODEL` | Optional model override (e.g. `claude-sonnet-4-6`, `gpt-4o`) |

---

## UX Decisions

- **Trigger:** Risk score computed synchronously on form submission. Patient waits on the health form confirmation screen (target: ≤5s).
- **Inline display:** After form submit, show risk badge + explanation + recommendations on a results screen before redirecting to dashboard.
- **Dashboard widget:** Risk score and recommendations fetched from stored DB result. Always reflects the most recent record's assessment.
- **Latency budget:** 5 seconds P95 for the LLM call. Show a loading spinner while in-flight; do not block form submission response.

---

## Data Model Changes

New fields on `PatientRecord` (or separate `RiskAssessment` table — see plan.md Task Group 2):

```
risk_level        VARCHAR(10)    nullable  -- "low" | "moderate" | "high"
risk_explanation  TEXT           nullable  -- LLM-generated plain-language explanation
recommendations   JSONB          nullable  -- list[str]
risk_scored_at    TIMESTAMP      nullable  -- when the score was last computed
```

---

## Constraints (from tech-stack.md)

- LLM via API only (no self-hosting at MVP)
- Chain lives in `backend/app/ai/` — no separate service
- Structured output via Pydantic (not string parsing)
- Must be swappable to a different provider via env var, no code change
- Patient health data must not be logged to external services beyond the LLM API call
