# Validation — Chatbot with RAG

How to know the implementation is correct and ready to merge.

**Branch:** `feature/chatbot-rag` (implemented locally; not yet merged to `main`)

**Env required for full vector RAG:** `OPENAI_API_KEY` in `.env` (embeddings use `text-embedding-3-small` even when `LLM_PROVIDER=anthropic`). Without it, chat falls back to plain-text record context from the DB.

---

## DB + pgvector Setup

- [x] `docker compose up` completes without error; pgvector extension present: `SELECT * FROM pg_extension WHERE extname = 'vector';` returns one row
- [x] `record_embeddings` table exists with `embedding vector(1536)` column and `ivfflat` index
- [x] `conversation_messages` table exists with `user_id`, `role`, `content`, `created_at` columns
- [ ] `ON DELETE CASCADE` verified: deleting a `PatientRecord` cascades to its `record_embeddings` rows

---

## Embedding Pipeline

- [x] Submit a health form as `demo@health.local` → `record_embeddings` table contains 2–4 rows for that record (vitals + risk_explanation + recommendations; ehr_summary only if generated) — requires `OPENAI_API_KEY`
- [x] `chunk_type` values are exactly one of: `vitals`, `risk_explanation`, `recommendations`, `ehr_summary`
- [x] `embedding` column is non-null and has dimension 1536 for each row — when embeddings succeed
- [x] Update an existing record (re-trigger risk score) → old embeddings for that record deleted, new ones inserted (no duplicates)
- [x] Patient with no records → `record_embeddings` is empty for that user; chatbot still responds without error
- [x] Lazy backfill: patient with record but no embeddings → first chat message triggers `ensure_embeddings_for_user()`

---

## RAG Chain

- [x] Patient asks "What was my last glucose reading?" → reply references actual glucose value from their record (vector or text fallback)
- [x] Patient asks "What diet advice do I have?" → reply references content from their recommendations chunk
- [x] Patient with `risk_level="high"` asks "Am I at risk?" → reply acknowledges high risk with specific context
- [x] Patient with EHR summary asks about clinical findings → reply references EHR summary content
- [ ] Cosine similarity search returns chunks ranked by relevance, not insertion order — requires `OPENAI_API_KEY` + rows in `record_embeddings`; manual verify

---

## Conversation Persistence

- [x] `GET /v1/chat/history` on fresh account returns `{ "messages": [] }`
- [x] Send 3 messages → `GET /v1/chat/history` returns 6 rows (3 user + 3 assistant), ordered ascending by `created_at`
- [x] Page refresh → reopen widget → history loads from API, shows prior conversation
- [ ] Second browser session with same account → history visible (cross-session persistence confirmed)
- [x] `DELETE /v1/chat/history` → returns `{ "deleted": 6 }` (or actual count) → `GET /v1/chat/history` returns empty
- [x] Clear history in widget → confirm dialog appears → confirm → history clears in UI

---

## API Contracts

- [x] `POST /v1/chat` unauthenticated → 401
- [x] `POST /v1/chat` with empty `message` → 422
- [x] `POST /v1/chat` with 501-char message → 422
- [x] `ENABLE_RAG=false` in env → `POST /v1/chat` returns 503 `{"detail": "Chatbot is currently disabled"}`
- [x] `GET /v1/chat/history` unauthenticated → 401
- [x] `DELETE /v1/chat/history` unauthenticated → 401

---

## Patient Isolation

- [x] Two patients (demo + a second test account) each send messages and have records → `GET /v1/chat/history` for each returns only their own messages — enforced by `user_id` filter in API
- [x] RAG retrieval for Patient A never returns chunks from Patient B's records — enforced by `PatientRecord.user_id` join in `retrieve_patient_context()`

---

## Frontend

- [x] Patient logs in → opens chat widget → skeleton shows briefly → prior messages load
- [x] History-loaded messages display correctly (user bubbles right, assistant bubbles left)
- [x] Send new message → appended to existing history in UI
- [x] "Clear history" button visible in panel header (trash icon)
- [x] Click "Clear history" → confirm dialog → confirm → messages cleared in UI
- [x] Dismiss confirm dialog → messages unchanged
- [x] Admin logs in → chat widget NOT visible (unchanged from Phase 1)
- [x] Doctor logs in → chat widget NOT visible (unchanged from Phase 1)

---

## Non-Regression

- [x] Health form submit → risk score + recommendations generated — unchanged flow
- [x] EHR summarization endpoint still works and triggers re-embedding
- [x] Abnormality flagging endpoint — unchanged
- [x] Doctor dashboard loads assigned patients — unchanged
- [x] Admin panel loads — unchanged
- [ ] `npm run build` — zero TypeScript errors
- [x] `npm run lint` — zero ESLint errors

---

## Seed Credentials (dev only)

| Role | Email | Password | Chat visible? | History persists? |
|------|-------|----------|---------------|-------------------|
| patient | `demo@health.local` | `demo123` | Yes | Yes |
| doctor | `doctor@health.local` | `doctor123` | No | — |
| admin | `admin@health.local` | `admin123` | No | — |
| national_admin | `national@health.local` | `national123` | No | — |

---

## Merge Criteria

pgvector extension active; `record_embeddings` populated after risk scoring (when `OPENAI_API_KEY` set); RAG replies reference patient's actual record content (vector search or text fallback); conversation history persists across sessions and clears on demand; patient isolation enforced; no regression in existing flows; build and lint clean.

**Remaining before merge:** manual CASCADE delete test, cross-browser session test, `npm run build`, optional cosine-ranking verify with embeddings populated.
