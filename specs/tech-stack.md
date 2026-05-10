# Tech Stack

## Current (Implemented)

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui |
| Backend | FastAPI (Python 3.12), SQLAlchemy 2.0, Pydantic v2 |
| Database | PostgreSQL 16 |
| Auth | JWT HS256 — 15m access + 7d refresh tokens, bcrypt |
| Infra | Docker Compose (dev), Nginx (prod), Render.com deployment |
| Data layer | SWR, react-hook-form + Zod |

---

## AI / ML Layer (Not Yet Built — Priority Order)

### Priority 1: Risk Scoring Model (LLM-based)
Diabetes risk classification from health form data (8-step form already captures inputs), powered by LLM reasoning rather than a traditional ML classifier.

- **Approach:** Structured prompt to GPT/Claude/Gemini — health form data serialized as context, LLM returns risk level + reasoning chain
- **Output:** Low / Moderate / High risk label + plain-language explanation of contributing factors
- **Orchestration:** LangChain chain — format inputs → call LLM → parse structured output (Pydantic)
- **Serving:** FastAPI endpoint, same LLM client used by recommendation and chatbot features
- **Advantage:** No training data required for MVP; reasoning is transparent and explainable to patients

### Priority 2: LLM Integration
Personalized recommendations, chatbot, EHR summarization.

- **MVP:** OpenAI GPT / Google Gemini / Anthropic Claude via API (no self-hosting)
- **Orchestration:** LangChain for prompt chains, LangGraph for multi-step agent flows
- **Future:** SFT on `gemma-4-e4b-it` (Adib's plan) for on-premise or cost reduction
- **Use cases:** Recommendation generation post-risk-score, patient Q&A chatbot, clinical EHR summarization

### Priority 3: Time-Series Forecasting
Health progression modeling (blood sugar trajectory, insulin resistance trends).

- **Approach:** LSTM or ARIMA on longitudinal patient record history
- **Requires:** Multiple records per patient over time (data accumulation precondition)
- **Serving:** Async background job, result stored back in DB

### Priority 4: Population Analytics (Phase 3)
National-level aggregate analysis.

- **Approach:** Aggregate queries + lightweight ML for regional trend forecasting
- **Visualization:** Bangladesh district map (choropleth) in admin dashboard
- **Data privacy:** All population analytics operate on anonymized/aggregated data only

---

## Gaps to Close

| Gap | What's Missing | When |
|-----|---------------|------|
| LLM risk scoring | No LangChain chain or structured output parser for risk | Phase 1 |
| LLM integration | No LangChain/LangGraph, no API client for GPT/Claude | Phase 1 |
| Vector store | Needed for chatbot memory / RAG over patient history | Phase 2 |
| Doctor dashboard | Role exists in DB, no clinical UI | Phase 2 |
| Time-series pipeline | No longitudinal model or async job runner | Phase 2 |
| National map | No aggregate analytics or geo-visualization | Phase 3 |
| Celery / task queue | Long-running ML jobs need async execution | Phase 2+ |
| LLM model hosting | vLLM for self-hosted inference (Adib's long-term plan) | Phase 3 |

---

## Constraints

- **Scalability is a core requirement** (Adib): stateless FastAPI services, DB connection pool already configured (`pool_size=10, max_overflow=20`)
- **Privacy:** Patient health data — apply field-level encryption or at minimum strict access controls before Phase 3 population data work
- **ML serving at MVP:** Keep model serving inside FastAPI (no separate MLflow/TorchServe needed until throughput demands it)
- **LLM cost:** API-based LLMs only for MVP; gate behind feature flag to allow model swap without code changes

---

## Recommended Additions to `pyproject.toml` (Phase 1 AI Work)

```toml
langchain >= 0.3
langchain-openai >= 0.2
openai >= 1.0
anthropic >= 0.40
joblib >= 1.4          # model serialization
```
