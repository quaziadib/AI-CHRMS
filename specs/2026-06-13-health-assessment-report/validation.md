# Validation — Health Assessment Report UI

How to know the implementation is correct and ready to merge.

**Branch:** `feature/chatbot-rag` (implemented locally; not yet merged to `main`)

---

## Risk Hero

- [ ] Low / Moderate / High each show correct icon, label, and color
- [ ] Progress bar reflects risk index (25 / 55 / 85)
- [ ] Assessed date shown when `risk_scored_at` present

---

## Vital Highlights

- [ ] Four tiles: glucose, BMI, BP, pulse
- [ ] Glucose ≥126 → alert styling; 100–125 → warn; <100 → good
- [ ] BMI ≥30 → alert; 25–29.9 → warn
- [ ] Missing glucose shows "Not recorded" with neutral tone

---

## Insight Truncation

- [ ] Long `risk_explanation` shows first 1–2 sentences by default
- [ ] "Read more" expands full text
- [ ] "Show less" collapses back
- [ ] Short explanation (≤2 sentences) hides expand control

---

## Action Grid (Structured Recommendations)

- [ ] Four category cards render when `categories` populated
- [ ] Tips truncated to readable length (not full paragraph walls)
- [ ] Summary line shows first sentence only
- [ ] Full mode: "Show all tips" expands to 3 per category
- [ ] Compact mode (dashboard): 1 tip per category, no expand-all

---

## Legacy Fallback

- [ ] Record with `recommendations: string[]` renders card grid
- [ ] "Show all N tips" works for arrays >4 items
- [ ] `recommendations: null` — no crash; action section omitted

---

## Surface Integration

- [ ] Post-submit (`/health-form`) — full report before "View My Records"
- [ ] Records page — full report above personalized plan widget
- [ ] Dashboard — compact report when latest record has risk
- [ ] `RiskWidget` import sites still work via wrapper

---

## Personalized Plan Widget (Aligned UX)

- [ ] Summary cards show essence of meal/exercise plans
- [ ] Week-at-a-glance horizontal scroll renders
- [ ] Full plan expandable without page navigation

---

## Docker Build

- [ ] `docker compose up --build` frontend stage succeeds
- [ ] No `Failed to fetch Inter/Geist Mono from Google Fonts` error
- [ ] App renders with system fonts (no broken layout)

---

## Merge Criteria

All three surfaces show condensed visual report; expand controls work; Docker build passes; legacy data shapes handled.
