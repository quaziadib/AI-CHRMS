# Requirements — Health Assessment Report UI

## What We're Building

A unified, visual **Health Assessment Report** that distills LLM output into scannable summaries: risk gauge, vital highlights, truncated insight, and categorized action cards. Replaces the previous wall-of-text risk widget across dashboard, records, and post-submit flow.

---

## Context: What Already Exists

- `risk_chain.py` → `risk_level`, `risk_explanation`, `risk_scored_at`
- `recommendations_chain.py` → structured `{ summary, categories: { diet, exercise, lifestyle, monitoring } }`
- `risk-widget.tsx`, `risk-result.tsx` — full LLM text rendered inline
- `specs/2026-05-12-llm-recommendations/` — categorized recs spec (backend); UI now centralized in new component

This feature is **frontend-only** — no new API endpoints. It changes how existing record fields are presented.

---

## Scope

### In Scope

- **`HealthAssessmentReport` component** — shared report used everywhere risk is shown
- **`assessment-utils.ts`** — text truncation, vital tone logic, risk metadata
- **Risk hero** — icon, label, progress bar (25/55/85 index per level)
- **Vital highlights** — 4 tiles: glucose, BMI, BP, pulse with good/warn/alert coloring
- **Insight section** — first 1–2 sentences of `risk_explanation`; "Read more" expands full text
- **Action grid** — Eat / Move / Habits / Track cards from structured recommendations; shortened tips
- **Compact mode** — fewer tips, no expand-all; used on dashboard
- **Legacy fallback** — flat `string[]` recommendations render as card grid with expand
- **`risk-widget.tsx`** — thin wrapper delegating to report (compact)
- **`risk-result.tsx`** — post-submit page uses full report
- **`personalized-plan-widget.tsx`** — aligned UX: essence summaries, week scroll, expandable detail

### Out of Scope

- Changing LLM prompts or backend output shape
- PDF/print export of report
- Doctor-specific report layout (uses same patient view)
- Real-time re-fetch while LLM still scoring (existing flow unchanged)

---

## Key Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Text truncation | Client-side `essence()` / `shortenTip()` | No second LLM call for summaries |
| Risk index bar | Fixed scores 25/55/85 | Visual consistency; not a clinical score |
| Vital thresholds | Hardcoded clinical cutoffs | Immediate color feedback without extra API |
| Expand pattern | Inline toggle, not modal | Keeps user on same page |
| Single component | `HealthAssessmentReport` | DRY across 3+ surfaces |
| Docker fonts | System font stack (no Google Fonts at build) | Docker build must not fetch external fonts |

---

## Vital Tone Thresholds

| Vital | Good | Warn | Alert |
|-------|------|------|-------|
| Glucose | <100 mg/dL | 100–125 | ≥126 |
| BMI | <25 | 25–29.9 | ≥30 |
| BP systolic | <130 | 130–139 | ≥140 |
| BP diastolic | <90 | — | ≥90 |
| Pulse | 60–100 | <60 or >100 | — |

---

## Component Props

```tsx
interface HealthAssessmentReportProps {
  record: PatientRecord
  compact?: boolean      // default false — dashboard uses true
  showTitle?: boolean    // default !compact
}
```

---

## Integration Points

| Surface | Mode | File |
|---------|------|------|
| Post-submit | Full | `features/health-form/components/risk-result.tsx` |
| Records page | Full | `app/(dashboard)/records/page.tsx` |
| Dashboard | Compact | `app/(dashboard)/dashboard/page.tsx` |
| Legacy import | Compact + title | `features/records/components/risk-widget.tsx` |

`record-detail.tsx` retains categorized recommendations in expanded record view (detailed EHR context).

---

## Constraints

- Must handle `recommendations: null` without crash
- Must handle legacy `string[]` recommendations
- Must handle missing `blood_glucose` (show "Not recorded", neutral tone)
- No raw `fetch` — data already on `PatientRecord` from existing API client
