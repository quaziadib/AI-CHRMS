# Plan — LLM Risk Scoring

Numbered task groups in execution order. Each group is independently committable.

---

## Group 1 — Dependencies & Config

1.1 Add to `backend/pyproject.toml`:
```toml
langchain >= 0.3
langchain-openai >= 0.2
langchain-anthropic >= 0.3
langchain-google-genai >= 2.0
openai >= 1.0
anthropic >= 0.40
google-generativeai >= 0.8
```

1.2 Add to `backend/app/core/config.py`:
- `LLM_PROVIDER: str = "anthropic"`
- `LLM_MODEL: str | None = None`
- `OPENAI_API_KEY: str | None = None`
- `ANTHROPIC_API_KEY: str | None = None`
- `GOOGLE_API_KEY: str | None = None`

1.3 Update `backend/.env.example` with new vars.

---

## Group 2 — DB Schema

2.1 Add risk fields to `PatientRecord` model (`backend/app/models/record.py`):
```python
risk_level: Mapped[str | None]
risk_explanation: Mapped[str | None]
recommendations: Mapped[list[str] | None]  # JSONB
risk_scored_at: Mapped[datetime | None]
```

2.2 Add corresponding fields to `RecordResponse` schema (`backend/app/schemas/record.py`).

2.3 Add Alembic migration (or rely on `init_db` `create_all` if migrations not yet set up — confirm before writing).

---

## Group 3 — LLM Chain

3.1 Create `backend/app/ai/` package (`__init__.py`).

3.2 Create `backend/app/ai/llm_factory.py`:
- `get_llm() -> BaseChatModel` — reads `LLM_PROVIDER` from settings, instantiates correct LangChain model, respects `LLM_MODEL` override.

3.3 Create `backend/app/ai/risk_chain.py`:
- `RiskAssessment(BaseModel)` — `risk_level`, `explanation`, `recommendations`
- `build_risk_prompt(record: PatientRecord) -> str` — serializes health form fields into structured prompt context
- `run_risk_chain(record: PatientRecord) -> RiskAssessment` — calls `get_llm().with_structured_output(RiskAssessment)`

3.4 Write the system prompt in `risk_chain.py`. Include: role (diabetes risk specialist), input format, output format, instruction to name specific contributing factors in explanation.

---

## Group 4 — API Endpoint

4.1 Add `POST /v1/records/{id}/risk-score` to `backend/app/api/v1/records.py`:
- Auth: requires logged-in patient (own record only) or doctor/admin
- Calls `run_risk_chain(record)`
- Writes result fields back to `PatientRecord`
- Returns updated `RecordResponse`
- Logs to `audit_logs` (action: `risk_scored`)

4.2 Update `backend/app/api/v1/router.py` if needed (records router already included).

---

## Group 5 — Frontend: Inline Result

5.1 After health form final step submits (`features/health-form/`):
- Immediately call `POST /api/v1/records/{id}/risk-score`
- Show loading state while awaiting LLM response

5.2 Create `features/health-form/components/RiskResult.tsx`:
- Risk badge (color-coded: green/amber/red for low/moderate/high)
- Explanation paragraph
- Recommendations list
- "View Dashboard" CTA button

5.3 Wire result screen into health form flow (show `RiskResult` on completion, then route to dashboard).

---

## Group 6 — Frontend: Dashboard Widget

6.1 Create `features/dashboard/components/RiskWidget.tsx`:
- Fetches latest record's risk fields via existing `GET /api/v1/records` or new `GET /api/v1/records/latest`
- Shows same badge + explanation + recommendations as inline result
- Shows "No assessment yet" state if `risk_level` is null
- Shows `risk_scored_at` timestamp

6.2 Add `RiskWidget` to `app/(dashboard)/dashboard/page.tsx`.

---

## Group 7 — Smoke Test & Docs

7.1 Manual end-to-end: submit form → see inline result → navigate to dashboard → widget shows same data.

7.2 Update `backend/README.md` endpoint table with new `POST /v1/records/{id}/risk-score`.

7.3 Update `specs/roadmap.md` — mark LLM risk model deliverable as `[x]`.
