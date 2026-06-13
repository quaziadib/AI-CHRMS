# Plan — Health Assessment Report UI

Numbered task groups in execution order.

---

## Group 1 — Utilities

1.1 Create `frontend/lib/assessment-utils.ts`:
- `RISK_META` — label, score, color classes per level
- `essence(text, maxSentences=2)` — sentence truncation
- `shortenTip(text, max=88)` — single-line bullet truncation
- `getVitalHighlights(record)` — 4 vitals with tone
- `isStructuredRecs(recs)` — type guard for categorized vs legacy array
- `TONE_STYLES` — CSS classes for good/warn/alert/neutral

---

## Group 2 — HealthAssessmentReport Component

2.1 Create `frontend/features/records/components/health-assessment-report.tsx`:

**Sections (top to bottom):**
1. Optional title + assessed date
2. Risk hero card (icon, label, Progress bar, risk index)
3. 4 vital highlight tiles (2×2 grid; 4-col on large screens)
4. "What this means" card — truncated explanation + Read more/less
5. Action grid — 4 category cards (Eat/Move/Habits/Track) with shortened tips
6. Legacy array fallback — 2-col card grid with Show all toggle

**Props:** `record`, `compact`, `showTitle`

**Empty state:** dashed card when no `risk_level`

2.2 Use Tailwind-safe Progress bar colors via `[&_[data-slot=progress-indicator]]:bg-*` classes (not dynamic string interpolation).

---

## Group 3 — Refactor Consumers

3.1 Update `risk-result.tsx` — render `<HealthAssessmentReport record={record} showTitle={false} />`; remove inline risk/recs rendering.

3.2 Update `risk-widget.tsx` — delegate to `<HealthAssessmentReport compact showTitle />`.

3.3 Update `app/(dashboard)/records/page.tsx` — replace `RiskWidget` with full `HealthAssessmentReport`.

3.4 Update `app/(dashboard)/dashboard/page.tsx` — use `<HealthAssessmentReport compact />`.

---

## Group 4 — Personalized Plan Widget Alignment

4.1 Refactor `personalized-plan-widget.tsx`:
- Meal/exercise essence summary cards
- Horizontal week-at-a-glance day pills
- Expandable full 7-day plan via toggle + `<details>`
- Reuse `essence()` and `shortenTip()` from `assessment-utils.ts`

---

## Group 5 — Docker Build Fix

5.1 Remove `next/font/google` from `app/layout.tsx` (Inter, Geist Mono fetch fails in Docker build).

5.2 Set system font stacks in `app/globals.css` `@theme inline`:
```css
--font-sans: system-ui, -apple-system, ...;
--font-mono: ui-monospace, SFMono-Regular, ...;
```

---

## Group 6 — Validation

6.1 Submit health form → report shows risk gauge + vitals + truncated insight + action cards.

6.2 Dashboard compact view shows 1 tip per category; records page shows 2 (expandable to 3).

6.3 `docker compose up --build` frontend stage completes without Google Fonts fetch error.

6.4 Legacy record with flat `recommendations: string[]` still renders.
