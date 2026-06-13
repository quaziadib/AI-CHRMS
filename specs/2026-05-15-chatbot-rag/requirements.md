# Requirements — Chatbot with RAG

## What We're Building

Upgrade the Phase 1 chatbot to use Retrieval-Augmented Generation (RAG): patient messages are answered by retrieving semantically relevant chunks from the patient's own record history (health form data, risk explanations, recommendations, EHR summaries) stored as vector embeddings in pgvector. Conversation history persists across sessions in the DB.

---

## Context: What Already Exists

- `POST /v1/chat` — functional basic chatbot (Phase 1), injects latest record vitals into system prompt
- `app/ai/chat_chain.py` — `run_chat_chain(message, patient_context) -> str` (kept; superseded by RAG chain in chat endpoint)
- `app/ai/llm_factory.py` — provider-agnostic `get_llm()`
- `PatientRecord` — stores `risk_level`, `risk_explanation`, `recommendations`, `ehr_summary`
- `app/ai/risk_chain.py`, `app/ai/ehr_summary_chain.py` — already write rich text to `PatientRecord`
- Chat widget in `frontend/features/chatbot/` — client-side history only (Phase 1)

---

## Scope

### In Scope

- **pgvector extension** — added to existing Postgres 16 via `pgvector/pgvector:pg16` Docker image
- **`record_embeddings` table** — 4 chunk types per record: vitals block, risk explanation, recommendations, EHR summary
- **`conversation_messages` table** — DB-persisted per user, cleared on demand
- **RAG chain** — pgvector retriever filters strictly to the authenticated patient's own records; top-k chunks injected into prompt
- **Text fallback** — when embeddings are missing or `OPENAI_API_KEY` unset, inject latest record as plain text via `build_record_text_context()`
- **Lazy embed backfill** — `ensure_embeddings_for_user()` on each chat message if record exists but no embeddings
- **Conversation memory** — last 20 messages loaded from DB and formatted into the system prompt
- **Updated `POST /v1/chat`** — persists user + assistant messages; calls `run_rag_chat_chain()` instead of basic chain
- **`GET /v1/chat/history`** — returns full message history for current user
- **`DELETE /v1/chat/history`** — clears all messages for current user
- **Frontend** — loads history from API on widget open; "Clear history" button in panel header

### Out of Scope

- Doctor or admin chatbot access (patient-only — unchanged from Phase 1)
- Streaming responses
- Async/background embedding (synchronous in request context; Celery is a separate roadmap item)
- Multiple embedding snapshots per record (re-embed on update replaces prior chunks)
- Audit logging per chat message (too noisy for Phase 2)

---

## Key Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Vector store | pgvector on existing Postgres 16 | No new service; fits current Docker Compose and Render infra |
| Embedded content | Vitals block + risk explanation + recommendations + EHR summary | All four selected — full clinical context per user decision |
| Embedding provider | OpenAI `text-embedding-3-small` (separate from LLM provider) | Anthropic has no embedding API; OpenAI embeddings are cheap and high-quality |
| Text fallback | `build_record_text_context()` when vector search unavailable | Ensures chat always sees patient data even without embeddings |
| Conversation persistence | DB-persisted `conversation_messages` table | User decision: history survives page reload and session expiry |
| History window passed to LLM | Last 20 messages | Prevents context bloat; full history still queryable in DB |
| RAG retrieval k | k=4 chunks | Enough clinical context without exceeding prompt budget |
| Re-embedding trigger | After risk-score save, recommendations save, EHR summary save, and lazy on chat | Embeddings reflect current record state |
| Patient isolation | Join `patient_records` filtered by `user_id` | Cross-patient retrieval is a hard requirement to prevent |
| FK column types | `UUID` (matches `patient_records.id`, `users.id`) | PostgreSQL native UUID columns; not VARCHAR |

---

## API Contract

```
GET /v1/chat/history
Authorization: Bearer <token>
Response: { "messages": [{ "id": int, "role": "user"|"assistant", "content": str, "created_at": str }] }

POST /v1/chat
Authorization: Bearer <token>
Request:  { "message": "string (1–500 chars)" }
Response: { "reply": "string" }

DELETE /v1/chat/history
Authorization: Bearer <token>
Response: { "deleted": int }

Errors (all endpoints):
  401 — unauthenticated
  422 — validation error
  503 — ENABLE_RAG=false
  502 — chain or embedding API failure
```

---

## New DB Schema

```sql
-- pgvector extension (added in init_db.py before create_all)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE record_embeddings (
    id          SERIAL PRIMARY KEY,
    record_id   UUID NOT NULL REFERENCES patient_records(id) ON DELETE CASCADE,
    chunk_type  VARCHAR(50) NOT NULL,  -- vitals | risk_explanation | recommendations | ehr_summary
    content     TEXT NOT NULL,
    embedding   vector(1536) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_record_embeddings_embedding_ivfflat
    ON record_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE TABLE conversation_messages (
    id          SERIAL PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role        VARCHAR(20) NOT NULL,  -- user | assistant
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Implementation Files

| File | Purpose |
|------|---------|
| `backend/app/models/embedding.py` | `RecordEmbedding` ORM model |
| `backend/app/models/conversation.py` | `ConversationMessage` ORM model |
| `backend/app/ai/embedding_service.py` | Chunk builder, embed pipeline, text fallback, lazy backfill |
| `backend/app/ai/rag_chain.py` | Vector retrieval + conversation history + LLM reply |
| `backend/app/api/v1/chat.py` | History endpoints + RAG-backed POST |
| `frontend/features/chatbot/hooks/use-chat.ts` | History load, clear, send |
| `frontend/features/chatbot/components/chat-widget.tsx` | Skeleton, clear-history UI |

---

## Constraints

- `OPENAI_API_KEY` required for vector embeddings even when `LLM_PROVIDER=anthropic` or `google`; chat still works without it via text fallback
- No patient PII in application logs (vitals injected to LLM prompt only — same rule as Phase 1 chatbot)
- Embedding runs synchronously after risk scoring; total record-submit p99 latency must remain under 5s
- Cross-patient isolation enforced at DB query level, not application logic level
