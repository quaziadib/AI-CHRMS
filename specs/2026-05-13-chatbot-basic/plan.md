# Plan — Chatbot (Basic)

Numbered task groups in execution order. Each group is independently committable.

---

## Group 1 — Backend: Config + Chain

1.1 Add `ENABLE_CHATBOT: bool = True` to `backend/app/core/config.py`.

1.2 Create `backend/app/ai/chat_chain.py`:
- System prompt: diabetes assistant, Bangladesh context, non-diagnostic rules, optional patient context block
- `run_chat_chain(message: str, patient_context: str = "") -> str`
- Uses `get_llm()` + `StrOutputParser` (no structured output needed)

---

## Group 2 — Backend: Chat Endpoint

2.1 Create `backend/app/api/v1/chat.py`:
- `POST /v1/chat` — requires `CurrentUser` dep
- Body: `ChatRequest(message: str, min_length=1, max_length=500)`
- Fetches patient's latest `PatientRecord` from DB for context (risk_level, age, bmi, bp, blood_glucose)
- Calls `run_chat_chain(message, patient_context)`
- Returns `ChatResponse(reply: str)`
- 503 when `ENABLE_CHATBOT=false`; 502 on chain exception

2.2 Register `chat.router` in `backend/app/api/v1/router.py` under prefix `/chat`.

---

## Group 3 — Frontend: Hook + Widget

3.1 Create `frontend/features/chatbot/hooks/use-chat.ts`:
- `ChatMessage` type: `{ id: string; role: "user" | "assistant"; content: string }`
- `useChat()` hook: `messages`, `isLoading`, `sendMessage(content)`, `clearMessages()`
- `sendMessage`: appends user message → calls `apiClient.post("/chat", { message })` → appends assistant reply

3.2 Create `frontend/features/chatbot/components/chat-widget.tsx`:
- Fixed bottom-right floating button (MessageCircle icon)
- Click opens panel (380px wide, 480px tall): header "Health Assistant" + close button
- Message list: user bubbles (right, primary bg), assistant bubbles (left, muted bg)
- Loading state: animated dots in assistant bubble placeholder
- Input: textarea (Enter to send, Shift+Enter for newline) + send button
- Auto-scroll to latest message on update
- Welcome message on first open

3.3 Update `frontend/app/(dashboard)/layout.tsx`:
- Import `ChatWidget`
- Render `<ChatWidget />` at end of outermost div — only when `roles.includes("user")` and NOT `roles.includes("admin")`

---

## Group 4 — Spec + Roadmap Update

4.1 Update `specs/roadmap.md` — mark Chatbot (basic) as `[x]`.

4.2 Write `specs/2026-05-13-chatbot-basic/validation.md`.
