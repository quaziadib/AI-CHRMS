# Roadmap

Timeline is phase-gated, not date-fixed. Phases unlock when their success criteria are met.

---

## Phase 1 — Patient Foundation (MVP)

**Goal:** A patient can submit health data, receive a diabetes risk score, and get AI-generated recommendations. All four user roles exist and are role-gated from day one.

### Deliverables

- [x] **LLM risk model** — LangChain chain serializes health form data → LLM returns structured risk level + explanation; served via `POST /v1/records/{id}/risk-score`
- [x] **Risk dashboard widget** — visual risk level (Low / Moderate / High) + confidence score on patient dashboard
- [x] **LLM recommendations** — post-risk-score call to GPT/Claude API generates personalized diet/lifestyle advice; stored with the record
- [x] **Doctor role UI** — doctor dashboard listing assigned patients with risk flags; read-only EHR view per patient
- [x] **Role-gated nav** — all four roles (patient, doctor, national admin, maintainer) have distinct nav and landing views
- [x] **Chatbot (basic)** — FAQ-style LangChain chain answering common diabetes questions; no memory yet

### Success Criteria
- Patient completes form → sees risk score + recommendations within 5 seconds
- Doctor can view patient record list filtered by risk level
- Admin sees user count and record count on existing dashboard

---

## Phase 2 — Clinical Depth + AI Memory

**Goal:** Doctors get genuine clinical decision support. LLM chatbot gains memory and accesses patient history. Long-running ML jobs run asynchronously.

### Deliverables

- [ ] **EHR summarization** — LLM generates a clinical summary of a patient's full record history; surfaced on doctor dashboard
- [ ] **Abnormality flagging** — rule-based + ML flags out-of-range lab values (HbA1c > 6.5%, fasting glucose > 126 mg/dL, etc.)
- [ ] **Chatbot with RAG** — patient chatbot retrieves from their own record history (vector store: pgvector or Chroma)
- [ ] **Personalized plans** — LLM-generated meal plan and exercise routine based on user profile + risk score
- [ ] **Async job runner** — Celery + Redis for time-series forecasting jobs (LSTM/ARIMA on longitudinal data)
- [ ] **Health progression chart** — time-series forecast of blood sugar trajectory displayed in patient dashboard

### Success Criteria
- Doctor can read a one-paragraph AI summary of any patient in under 3 seconds
- Chatbot answers reference patient's actual record data
- Forecasting job completes in background; result appears in dashboard without page refresh

---

## Phase 3 — National Health Intelligence

**Goal:** Sabbir's population-level analytics — aggregate trends, regional forecasting, resource allocation insights for Bangladesh.

### Deliverables

- [ ] **Bangladesh district map** — choropleth visualization of diabetes prevalence by region (anonymized aggregate)
- [ ] **Population trend forecasting** — ML model predicting district-level case counts for next 6/12 months
- [ ] **Resource allocation dashboard** — forecast of clinic/medicine/testing-kit needs by region
- [ ] **Anonymization pipeline** — data processing layer that strips PII before any aggregate analytics
- [ ] **Admin analytics export** — downloadable reports (CSV/PDF) for policy use
- [ ] **LLM for pattern discovery** — LLM analysis of anonymized clinical data to surface new diabetes risk correlations

### Success Criteria
- National admin can view district-level risk map with one click
- Forecast report downloadable in under 10 seconds
- Zero PII in any aggregate export (audited)

---

## Phase ∞ — Infrastructure Scale + Model Ownership

**Goal:** Self-hosted inference, reduced API costs, production-grade MLOps.

- [ ] SFT on `gemma-4-e4b-it` — fine-tune on diabetes domain data for on-premise chatbot
- [ ] vLLM serving — replace API-based LLM calls with self-hosted inference
- [ ] MLflow — experiment tracking and model versioning
- [ ] Kubernetes / auto-scaling — replace Docker Compose prod setup
- [ ] Multi-region deployment — for national-scale concurrent users

---

## Dependency Map

```
Phase 1 (risk model + LLM basics)
  └── Phase 2 (clinical depth requires longitudinal data from Phase 1 records)
        └── Phase 3 (population analytics requires aggregate data volume from Phase 1+2)
              └── Phase ∞ (self-hosted models require Phase 3 domain data for SFT)
```

Each phase builds the data foundation the next phase requires. Do not skip ahead.
