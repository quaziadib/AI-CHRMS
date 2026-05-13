# Requirements — Chatbot (Basic)

## What We're Building

An FAQ-style LangChain chain that answers common diabetes questions, embedded as a floating chat widget in the patient dashboard. No conversation memory in Phase 1. Patient health context (risk level, key vitals from most recent record) is injected into the system prompt for personalized answers.

---

## Context: What Already Exists

- LLM factory (`app/ai/llm_factory.py`) — provider-agnostic `get_llm()` used by risk and recommendations chains
- Patient health records stored in DB with risk level, vitals, glucose, BMI
- Auth system with role-aware `CurrentUser` dependency
- `ENABLE_RECOMMENDATIONS` feature flag pattern in config

---

## Scope

### In Scope

- `backend/app/ai/chat_chain.py` — LangChain chain: system prompt (diabetes assistant) + optional patient context + user message → plain string reply
- `POST /v1/chat` — authenticated endpoint; fetches patient's latest record for context; calls chain; returns `{reply: str}`
- Feature flag: `ENABLE_CHATBOT: bool = True` in config; endpoint returns 503 when false
- Frontend floating chat widget — fixed bottom-right, patient role only
- Client-side message history (no DB persistence in Phase 1)

### Out of Scope

- Conversation memory / multi-turn context passed to LLM (Phase 2 — requires RAG)
- Chat history persistence in DB (Phase 2)
- Doctor or admin chatbot access (Phase 1 is patient-only)
- Streaming responses (future enhancement)
- Audit logging per message (too noisy; add in Phase 2 if needed)

---

## Key Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Plain string output | `StrOutputParser` | Chat needs natural prose, not structured JSON |
| Patient context | Latest record vitals injected at system prompt level | Personalized without requiring conversation history |
| Client-side history | `useState` only | No DB schema needed; history resets on page reload — acceptable for Phase 1 |
| Role restriction | Patient only (`roles.includes("user")`) | Mission scope; doctors/admins don't need FAQ chat |
| Message max length | 500 chars | Prevent abuse; LLM context stays lean |
| Error handling | 502 on chain failure; 503 when feature disabled | Matches pattern from recommendations endpoint |

---

## LLM Behaviour Contract

- System prompt: diabetes health assistant, Bangladesh context, non-diagnostic, non-prescriptive
- Inject patient context when available: risk level, age, BMI, BP, blood glucose
- Response length: 2–4 sentences unless more detail is clearly needed
- No PII in logs (vitals injected to LLM prompt only, not logged)

---

## API Contract

```
POST /v1/chat
Authorization: Bearer <token>

Request:  { "message": "string (1–500 chars)" }
Response: { "reply": "string" }

Errors:
  401 — unauthenticated
  422 — message too long / empty
  503 — ENABLE_CHATBOT=false
  502 — LLM chain failure
```

---

## Constraints

- Same `get_llm()` factory as other chains — no new provider setup
- No patient PII in application logs
- Chain lives in `backend/app/ai/` — no separate service
- Feature flag must match `ENABLE_RECOMMENDATIONS` pattern in `config.py`
