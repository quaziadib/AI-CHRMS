# Plan — Chatbot with RAG

Numbered task groups in execution order. Each group is independently committable.

**Status:** All groups implemented on `feature/chatbot-rag` (uncommitted). Post-implementation: added text fallback + lazy embed backfill (see `requirements.md`).

---

## Group 1 — DB: pgvector Extension + New Tables ✅

1.1 Update `backend/app/db/init_db.py`:
- Add `CREATE EXTENSION IF NOT EXISTS vector` via raw SQL **before** `Base.metadata.create_all`

1.2 Create `backend/app/models/embedding.py`:
- `RecordEmbedding(id, record_id FK→patient_records, chunk_type: str, content: str, embedding: Vector(1536), created_at)`
- `chunk_type` values: `"vitals"` | `"risk_explanation"` | `"recommendations"` | `"ehr_summary"`
- Add `ivfflat` index on `embedding` column using `vector_cosine_ops` (in `init_db.py` migration)

1.3 Create `backend/app/models/conversation.py`:
- `ConversationMessage(id, user_id FK→users, role: str, content: str, created_at)`
- `role` values: `"user"` | `"assistant"`
- FK columns use `UUID(as_uuid=False)` to match parent tables

1.4 Register both models in `backend/app/models/__init__.py` so `create_all` picks them up.

1.5 Update `docker-compose.yml`: Postgres image → `pgvector/pgvector:pg16`

---

## Group 2 — Backend: Embedding Pipeline ✅

2.1 Add deps to `backend/pyproject.toml`:
- `pgvector >= 0.3`
- ~~`langchain-postgres >= 0.0.12`~~ — not used; retrieval via SQLAlchemy + pgvector cosine distance

2.2 Add to `backend/app/core/config.py`:
- `ENABLE_RAG: bool = True`
- `EMBEDDING_MODEL: str = "text-embedding-3-small"`

2.3 Create `backend/app/ai/embedding_service.py`:
- `build_chunks(record)` → `list[tuple[str, str]]`
- `build_record_text_context(record)` → plain-text fallback
- `embed_record(record, db)` → OpenAI Embeddings API, replace prior rows
- `ensure_embeddings_for_user(user_id, db)` → lazy backfill on chat

2.4 Wire `embed_record` into:
- `backend/app/services/record.py` — after risk score + recommendations
- `backend/app/api/v1/doctor.py` — after EHR summary save

---

## Group 3 — Backend: RAG Chain ✅

3.1 Create `backend/app/ai/rag_chain.py`:

- `retrieve_patient_context(user_id, query, db, k=4)` — vector search with text fallback
- `run_rag_chat_chain(message, user_id, db)` — last 20 messages + context + LLM

---

## Group 4 — Backend: Chat API Update ✅

4.1 Update `backend/app/api/v1/chat.py`:
- `GET /v1/chat/history`, `DELETE /v1/chat/history`
- `POST /v1/chat` → persist messages, `ensure_embeddings_for_user()`, `run_rag_chat_chain()`
- 503 when `ENABLE_RAG=false`; 502 on exception

4.2 Router registration in `backend/app/api/v1/router.py` — prefix `/chat` unchanged.

---

## Group 5 — Frontend: History-aware Chat ✅

5.1 Update `frontend/features/chatbot/hooks/use-chat.ts`:
- Load history on mount, `isLoadingHistory`, `clearHistory()`

5.2 Update `frontend/features/chatbot/components/chat-widget.tsx`:
- Skeleton while loading, trash icon + confirm dialog for clear history

---

## Group 6 — Spec + Roadmap ✅

6.1 Update `specs/roadmap.md` — mark `[x] Chatbot with RAG`.

6.2 Write `specs/2026-05-15-chatbot-rag/validation.md`.

6.3 Update `specs/tech-stack.md` — reflect pgvector + RAG as implemented.
