# Validation — Chatbot (Basic)

How to know the implementation is correct and ready to merge.

---

## Backend API

- [x] `POST /v1/chat` with valid token and `{"message": "What is diabetes?"}` → 200 with non-empty `reply` string
- [x] Unauthenticated request → 401
- [x] `message` field empty or missing → 422
- [x] `message` longer than 500 chars → 422
- [x] `ENABLE_CHATBOT=false` in env → 503 with `{"detail": "Chatbot is currently disabled"}`
- [x] Patient with a submitted health record → reply references their health context (blood glucose 69.0 mg/dL referenced in response)
- [x] Patient with no records → reply is generic (no crash, no empty response)

---

## Patient Context Injection

- [x] Patient has record with `risk_level="high"` → ask "Am I at risk?" → reply acknowledges high risk
- [x] Patient has record with high blood glucose → ask "What should I eat?" → reply references glucose/diet
- [x] Doctor or admin token → endpoint still responds (no role restriction at API level — UI-only restriction)

---

## Frontend Widget

- [x] Patient logs in → floating chat button visible bottom-right on dashboard and records pages
- [x] Admin logs in → chat button NOT visible
- [x] Doctor logs in → chat button NOT visible
- [x] Click button → panel opens with welcome message
- [x] Type message + Enter → user bubble appears immediately, loading dots show, assistant reply appears
- [x] Shift+Enter → newline in input (does not send)
- [x] Panel close button → panel closes, messages preserved in session
- [x] Reopen panel → messages still there
- [x] Page refresh → messages cleared (expected — no persistence)

---

## Feature Flag

- [x] `ENABLE_CHATBOT=true` (default) → widget functional
- [x] `ENABLE_CHATBOT=false` → widget sends message → shows error "Chatbot is currently disabled"

---

## Non-Regression

- [x] Patient health form submit → risk score → recommendations still work (unchanged flow)
- [x] Doctor dashboard loads assigned patients — unchanged
- [x] Admin panel loads — unchanged
- [x] `npm run build` — zero TypeScript errors
- [x] `npm run lint` — zero ESLint errors

---

## Seed Credentials (dev only)

| Role | Email | Password | Chat visible? |
|------|-------|----------|---------------|
| patient | `demo@health.local` | `demo123` | Yes |
| doctor | `doctor@health.local` | `doctor123` | No |
| admin | `admin@health.local` | `admin123` | No |
| national_admin | `national@health.local` | `national123` | No |

---

## Merge Criteria

Chat endpoint returns coherent diabetes-relevant replies. Patient context injected when record exists. Widget renders for patients only. Feature flag disables gracefully. No regression in existing flows. Build and lint clean.
