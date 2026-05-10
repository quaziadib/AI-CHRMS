# Mission

## Core Mission

AI-CHRMS is an AI-powered chronic disease management platform, starting with diabetes, that serves three concentric scopes — patient, clinical, and national — delivered in phases.

> **One sentence:** Give patients insight into their own health, give clinicians faster EHR analysis, and give Bangladesh's health system the data it needs to act at scale.

---

## Problem Statement

Bangladesh faces a growing diabetes epidemic with fragmented health data, limited clinical access outside urban centers, and no unified system for population-level forecasting. Patients lack actionable insight from their own records. Doctors lack tools to quickly surface risk from EHR history. Policy makers lack real-time regional data to allocate resources.

---

## Stakeholder Goals

| Stakeholder | Role | Primary Need |
|------------|------|-------------|
| **Iqbal** (Principal Investigator) | Research lead | Risk prediction models, disease progression forecasting (LSTM/ARIMA), AI recommendations from EHR data |
| **Fahim** (Conversational AI lead) | Product | LLM chatbot for patient Q&A, NLP-driven personalized advice, meal/exercise plans |
| **Sabbir** (National health) | Policy | Population-level diabetes trend maps, regional resource forecasting, anonymized aggregate analytics |
| **Adib** (Technical lead) | Engineering | Scalable FastAPI + Next.js stack, LangChain/LangGraph agents, GPT/Gemini/Claude for MVP, future SFT on Gemma |
| **Steve** (Marketing) | Growth | Modern, fast, visually attractive public-facing site |

---

## Mission Phases

### Phase 1 — Patient Empowerment (MVP)
All four user roles exist from day one with role-gated dashboards, but the primary value delivered is to **patients**: health data input → ML risk score → AI recommendations.

### Phase 2 — Clinical Decision Support
Doctor dashboard with EHR analysis, abnormality flagging, patient history summarization via LLM, and medication/treatment suggestions.

### Phase 3 — National Health Intelligence
Sabbir's scope: population-level aggregate analytics, Bangladesh district-level diabetes prevalence map, resource allocation forecasting.

---

## User Roles (All Present from Day One)

- **Patient** — self-service health form, personal risk dashboard, AI chatbot
- **Doctor** — patient list, EHR review, clinical insights (Phase 2 depth)
- **National Admin** — aggregate dashboards, regional maps (Phase 3 depth)
- **System Maintainer** — audit logs, user management, system health

---

## What Success Looks Like (MVP)

1. Patient completes 8-step health form
2. System returns a diabetes risk score (low / moderate / high)
3. LLM generates personalized lifestyle and dietary recommendations
4. Doctor can view flagged patient records
5. All actions are audit-logged and role-gated
