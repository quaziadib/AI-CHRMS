# Plan — LLM Recommendations

Numbered task groups in execution order. Each group is independently committable.

---

## Group 1 — Config & Feature Flag

1.1 Add to `backend/app/core/config.py`:
```python
ENABLE_RECOMMENDATIONS: bool = True
```

1.2 Update `backend/.env.example` with:
```
ENABLE_RECOMMENDATIONS=true
```

1.3 Update `CLAUDE.md` env vars section to document the flag.

---

## Group 2 — Recommendations Chain

2.1 Create `backend/app/ai/recommendations_chain.py`:

- Define `RecommendationCategory(BaseModel)` — `diet`, `exercise`, `lifestyle`, `monitoring` (each `list[str]`)
- Define `RecommendationsOutput(BaseModel)` — `categories: RecommendationCategory`, `summary: str`
- Write `_SYSTEM_PROMPT` — role: diabetes health coach; instruction to produce categorized, specific, patient-value-referenced advice (cite actual values e.g. "Your HbA1c of 7.1%..."); no generic disclaimers
- Write `_HUMAN_PROMPT` — same patient profile serialization pattern as `risk_chain.py`; include risk level and explanation as additional context
- Implement `run_recommendations_chain(record: PatientRecord) -> RecommendationsOutput` — calls `get_llm().with_structured_output(RecommendationsOutput)`; propagates `LLMError` / `ValidationError` to caller

2.2 Risk chain cleanup: remove `recommendations` field from `RiskAssessment` in `risk_chain.py`. The risk chain now returns only `risk_level` and `explanation`. Update callers in `services/record.py` accordingly.

---

## Group 3 — Service Layer

3.1 In `backend/app/services/record.py`, update the post-risk-score flow:

```python
# After risk fields saved:
if settings.ENABLE_RECOMMENDATIONS:
    try:
        recs = run_recommendations_chain(record)
        record.recommendations = recs.model_dump()
        log_audit(db, user_id, "recommendations_generated", "patient_record", record_id)
    except Exception:
        record.recommendations = None  # non-fatal — risk score already saved
```

3.2 Ensure `record.recommendations = None` path does not rollback the risk score transaction.

---

## Group 4 — API Endpoint

4.1 Add `POST /v1/records/{id}/recommendations` to `backend/app/api/v1/records.py`:
- Auth: patient (own record only), doctor, or admin
- Check `settings.ENABLE_RECOMMENDATIONS` — return HTTP 503 if false
- Fetch record, verify ownership/role
- Call `run_recommendations_chain(record)` 
- Write `record.recommendations = result.model_dump()`
- Log `recommendations_generated` to audit_logs
- Return updated `RecordResponse`
- On `LLMError`: HTTP 502 `"Recommendations unavailable"`
- On record not found: HTTP 404

4.2 Update `PatientRecordResponse` schema in `backend/app/schemas/record.py`:
- `recommendations: Optional[dict] = None` (was `Optional[list[str]]`) — accepts both old shape and new dict shape during transition

---

## Group 5 — Frontend: Categorized Display

5.1 Update `features/records/components/risk-widget.tsx`:
- Detect recommendations shape: if `dict` with `categories` key → render categorized sections (Diet, Exercise, Lifestyle, Monitoring tabs or accordion); if `list` → render as flat list (backwards compat during rollout)
- Show `summary` sentence above categories
- Show "Recommendations unavailable" if `null`

5.2 Update `features/records/components/record-detail.tsx`:
- Add recommendations section below risk info (same categorized layout as widget)

5.3 Update `features/health-form/components/risk-result.tsx`:
- After form submit, trigger `POST /api/v1/records/{id}/recommendations` (separate call after risk score)
- Show loading state for recommendations independently from risk score (risk score can render first)
- Render categorized recommendations once available

---

## Group 6 — Admin View

6.1 Update `features/admin/components/records-tab.tsx`:
- Show recommendations summary sentence in expanded record row
- Full categorized view accessible via record detail modal/drawer

---

## Group 7 — Smoke Test & Docs

7.1 Manual end-to-end: submit form → risk score appears → recommendations load (separate call visible in network tab) → categories render → record-detail shows same → admin record view shows summary.

7.2 Test feature flag: set `ENABLE_RECOMMENDATIONS=false`, restart backend → form submit works, risk score appears, recommendations show null/unavailable state, no 500.

7.3 Verify audit log: check `audit_logs` table for `recommendations_generated` row after successful call.

7.4 Update `specs/roadmap.md` — mark LLM recommendations deliverable as `[x]`.
