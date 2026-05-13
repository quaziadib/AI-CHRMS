# Validation — Chatbot (Basic)

How to know the implementation is correct and ready to merge.

---

## Backend API

- [x] `POST /v1/chat` with valid token and `{"message": "What is diabetes?"}` → 200 with non-empty `reply` string
- [ ] Unauthenticated request → 401
- [ ] `message` field empty or missing → 422
- [ ] `message` longer than 500 chars → 422
- [ ] `ENABLE_CHATBOT=false` in env → 503 with `{"detail": "Chatbot is currently disabled"}`
- [x] Patient with a submitted health record → reply references their health context (blood glucose 69.0 mg/dL referenced in response)
- [ ] Patient with no records → reply is generic (no crash, no empty response)

---

## Patient Context Injection

- [ ] Patient has record with `risk_level="high"` → ask "Am I at risk?" → reply acknowledges high risk
- [ ] Patient has record with high blood glucose → ask "What should I eat?" → reply references glucose/diet
- [ ] Doctor or admin token → endpoint still responds (no role restriction at API level — UI-only restriction)

---

## Frontend Widget

- [ ] Patient logs in → floating chat button visible bottom-right on dashboard and records pages
- [ ] Admin logs in → chat button NOT visible
- [ ] Doctor logs in → chat button NOT visible
- [ ] Click button → panel opens with welcome message
- [ ] Type message + Enter → user bubble appears immediately, loading dots show, assistant reply appears
- [ ] Shift+Enter → newline in input (does not send)
- [ ] Panel close button → panel closes, messages preserved in session
- [ ] Reopen panel → messages still there
- [ ] Page refresh → messages cleared (expected — no persistence)

---

## Feature Flag

- [ ] `ENABLE_CHATBOT=true` (default) → widget functional
- [ ] `ENABLE_CHATBOT=false` → widget sends message → shows error "Chatbot is currently disabled"

---

## Non-Regression

- [ ] Patient health form submit → risk score → recommendations still work (unchanged flow)
- [ ] Doctor dashboard loads assigned patients — unchanged
- [ ] Admin panel loads — unchanged
- [ ] `npm run build` — zero TypeScript errors
- [ ] `npm run lint` — zero ESLint errors

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
