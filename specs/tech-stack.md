# Tech Stack

## Current (Implemented)

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui |
| Backend | FastAPI (Python 3.12), SQLAlchemy 2.0, Pydantic v2 |
| Database | PostgreSQL 16 + **pgvector** (`pgvector/pgvector:pg16` in Docker) |
| Auth | JWT HS256 — 15m access + 7d refresh tokens, bcrypt |
| Infra | Docker Compose (dev), Nginx (prod), Render.com deployment |
| Data layer | SWR, react-hook-form + Zod |

---

## AI / ML Layer (Implemented)

| Feature | Status | Stack |
|---------|--------|-------|
| LLM risk scoring | ✅ Phase 1 | LangChain + structured output → `risk_chain.py` |
| LLM recommendations | ✅ Phase 1 | LangChain → `recommendations_chain.py` |
| Basic chatbot | ✅ Phase 1 | LangChain → `chat_chain.py` (superseded by RAG in chat endpoint) |
| EHR summarization | ✅ Phase 2 | LangChain → `ehr_summary_chain.py` |
| Abnormality flagging | ✅ Phase 2 | Rule-based Python → `flagging.py` |
| **Chatbot RAG** | ✅ Phase 2 (branch) | pgvector + OpenAI embeddings + LangChain → `rag_chain.py`, `embedding_service.py` |
| Conversation memory | ✅ Phase 2 (branch) | `conversation_messages` table, last 20 turns in prompt |
| Personalized meal/exercise plans | ✅ Phase 2 (branch) | LLM → `plans_chain.py`; spec: `2026-06-13-personalized-plans/` |
| Time-series forecasting | ✅ Phase 2 (branch) | ARIMA via statsmodels + Celery; spec: `2026-06-13-async-forecasting/` |
| Health progression chart | ✅ Phase 2 (branch) | Recharts → `progression-chart.tsx` |
| Periodic resubmit | ✅ Phase 2 (branch) | `SystemSetting` + multi-record history; spec: `2026-06-13-periodic-resubmit/` |
| Health assessment report UI | ✅ Phase 2 (branch) | `health-assessment-report.tsx`; spec: `2026-06-13-health-assessment-report/` |
| Celery / task queue | ✅ Phase 2 (branch) | Redis + Celery worker in Docker Compose |

**LLM providers (MVP):** OpenAI / Anthropic / Google via `llm_factory.py` — env-switchable (`LLM_PROVIDER`).

**Embeddings:** OpenAI `text-embedding-3-small` via `OPENAI_API_KEY` — separate from chat LLM provider. Text fallback when key missing or embeddings absent.

---

## AI / ML Layer (Not Yet Built)

| Feature | Phase | Approach |
|---------|-------|----------|
| Population analytics | 3 | Aggregate queries + regional ML |
| Bangladesh district map | 3 | Choropleth in national admin dashboard |
| Self-hosted LLM (vLLM) | ∞ | Replace API calls; SFT on `gemma-4-e4b-it` |
| MLflow | ∞ | Experiment tracking |

---

## Gaps to Close

| Gap | Status | When |
|-----|--------|------|
| LLM risk scoring | ✅ Done | Phase 1 |
| LLM integration (recommendations, chat, EHR) | ✅ Done | Phase 1–2 |
| Vector store / RAG | ✅ Done (branch) | Phase 2 |
| Doctor dashboard | ✅ Done | Phase 2 |
| Conversation persistence | ✅ Done (branch) | Phase 2 |
| Time-series pipeline | ✅ Done (branch) | Phase 2 |
| Celery / task queue | ✅ Done (branch) | Phase 2 |
| Periodic resubmit | ✅ Done (branch) | Phase 2 |
| Health assessment report UI | ✅ Done (branch) | Phase 2 |
| Personalized plans | ✅ Done (branch) | Phase 2 |
| National map + aggregate analytics | ❌ Missing | Phase 3 |
| LLM model hosting (vLLM) | ❌ Missing | Phase ∞ |

---

## Constraints

- **Scalability is a core requirement** (Adib): stateless FastAPI services, DB connection pool configured (`pool_size=10, max_overflow=20`)
- **Privacy:** Patient health data — strict access controls; anonymization required before Phase 3 population analytics
- **ML serving at MVP:** Model serving inside FastAPI (no separate MLflow/TorchServe until throughput demands it)
- **LLM cost:** API-based LLMs for MVP; feature flags (`ENABLE_RAG`, `ENABLE_RECOMMENDATIONS`, etc.) allow model swap without code changes

---

## Backend Dependencies (`pyproject.toml`)

```toml
# Core
fastapi[standard]>=0.128.1
sqlalchemy>=2.0.0
psycopg2-binary>=2.9.9

# LLM
langchain>=0.3
langchain-openai>=0.2
langchain-anthropic>=0.3
langchain-google-genai>=2.0
openai>=1.0
anthropic>=0.40

# Vector store (Phase 2 RAG)
pgvector>=0.3

# Async ML jobs (Phase 2 forecasting)
celery>=5.4
redis>=5.0
statsmodels>=0.14
```
