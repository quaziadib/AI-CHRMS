# AI-CHRMS

AI-assisted Chronic Health Risk Management System — role-based dashboards for patients, doctors, and national administrators, with LLM risk scoring, RAG chatbot, forecasting, and anonymized population analytics.

**Stack:** Next.js 16 + FastAPI + PostgreSQL 16 (pgvector) + Redis/Celery + LangChain

---

## How to run

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose v2)
- For local (non-Docker) development: Python 3.12+, Node.js 20+, [pnpm](https://pnpm.io/) (`corepack enable pnpm`)

### Quick start (Docker Compose)

This is the recommended way to run the full stack.

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env — at minimum set a unique JWT_SECRET_KEY (≥32 characters).
# Optionally add ANTHROPIC_API_KEY / OPENAI_API_KEY / GOOGLE_API_KEY for LLM features.

# 2. Build and start all services
docker compose up --build
```

| Service        | URL / port              | Notes                                      |
|----------------|-------------------------|--------------------------------------------|
| Frontend       | http://localhost:3000   | Next.js app                                |
| Backend API    | http://localhost:8000   | FastAPI                                    |
| API docs       | http://localhost:8000/docs | Swagger UI                              |
| Health check   | http://localhost:8000/health |                                     |
| PostgreSQL     | `localhost:5433`        | Mapped from container port 5432            |
| Redis          | `localhost:6379`        | Used by Celery workers                     |

If 3000/8000/6379 are already in use, set `FRONTEND_PORT`, `BACKEND_PORT`, and `REDIS_PORT` in `.env`.

Stop with `Ctrl+C`, or run detached with `docker compose up --build -d` and stop with `docker compose down`.

Optional production reverse proxy (Nginx on ports 80/443):

```bash
docker compose --profile production up --build
```

### Seed accounts (dev)

Created automatically on first backend startup:

| Role            | Email                   | Password      |
|-----------------|-------------------------|---------------|
| Admin           | `admin@health.local`    | `admin123`    |
| Patient (demo)  | `demo@health.local`     | `demo123`     |
| Doctor          | `doctor@health.local`   | `doctor123`   |
| National admin  | `national@health.local` | `national123` |

With `SEED_SYNTHETIC_DATA=true` (default in Compose), **50 synthetic patients** are also seeded:

| Role | Email pattern | Password |
|------|---------------|----------|
| Patients 001–050 | `patient001@health.local` … `patient050@health.local` | `patient123` |

Each patient has 10 health assessments + chat history. Full roster: [docs/demo-users/README.md](docs/demo-users/README.md).

### Environment variables

Root `.env` (used by Docker Compose). Start from `.env.example`:

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET_KEY` | **Yes** | ≥32 characters; must not be a known weak default |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | No | DB credentials (defaults match `.env.example`) |
| `LLM_PROVIDER` | No | `anthropic` (default), `openai`, or `google` |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GOOGLE_API_KEY` | For AI features | Key matching `LLM_PROVIDER` |
| `ENABLE_*` feature flags | No | Toggle RAG, plans, forecasting, national analytics, etc. |

Without an LLM API key, auth and CRUD still work; risk scoring, chatbot, and related AI endpoints will fail until a key is set.

---

## Local development (without full Docker)

You can run services individually. Typical hybrid setup: Postgres + Redis via Compose, backend and frontend on the host.

### 1. Infrastructure only

```bash
cp .env.example .env   # set JWT_SECRET_KEY
docker compose up db redis
```

Postgres is on **host port 5433**.

### 2. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -e .

# Create backend/.env (or export env vars). Example:
# JWT_SECRET_KEY=<same-as-root-.env-or-another-32+-char-secret>
# DATABASE_URL=postgresql://healthadmin:healthpass123@localhost:5433/healthdb
# REDIS_URL=redis://localhost:6379/0
# LLM_PROVIDER=anthropic
# ANTHROPIC_API_KEY=<your-key>

uvicorn app.main:app --reload --port 8000
```

Optional Celery worker (forecasting / async jobs):

```bash
cd backend && source .venv/bin/activate
celery -A app.celery_app worker --loglevel=info
```

### 3. Frontend

```bash
cd frontend
corepack enable pnpm
pnpm install

# Point Next.js rewrites at the local API (default is the Docker hostname `backend`)
BACKEND_URL=http://localhost:8000 pnpm dev
```

App: http://localhost:3000 — browser calls go to `/api/v1/*`, which Next.js proxies to the backend.

---

## Project layout

```
├── frontend/          # Next.js 16 (App Router), pnpm
├── backend/           # FastAPI, SQLAlchemy, LangChain, Celery
├── nginx/             # Optional reverse proxy (production profile)
├── docker-compose.yml # db, redis, backend, celery_worker, frontend [, nginx]
├── .env.example       # Template for root Compose env
├── docs/              # Additional API notes
└── specs/             # Feature specs and plans
```

More detail: [frontend/README.md](frontend/README.md), [backend/README.md](backend/README.md).

---

## Input from stakeholders

- Iqbal is a Principal Investigator. His requirement is to produce a dashboard for paitents based on the EHR of that paitents. So, that paitent can know about the current health status about him/her. Also, based on data of that paitent. ML/LLM model will predict his/her probability of having serious diseases. Like:
    - i) Risk Prediction Model: A visual representation of the user's risk level (low, moderate, high).
    - ii) AI Recommendations: After generating a risk score, offer personalized lifestyle, diet, or exercise recommendations.
    - iii) Predict the future progression of blood sugar levels, insulin resistance, etc., based on current data.
    - iv) A time-series model to predict how the patient’s health might evolve (using LSTM or ARIMA models).
    - v) Use LLMs for analyzing text input from users about their symptoms or health concerns.

       
- Fahim in Conversional AI Product lead. His concerns are mostly evolve around communcation with the paitents using chatbot systems.
    - i) AI-powered Content Generation: Use the LLM to generate personalized content, such as articles, FAQs, or tips based on the user’s condition.
    - ii) Chatbot Assistance: An AI-powered chatbot to answer common health-related questions, provide advice, and recommend resources.
    - iii) Integrate NLP to generate real-time responses based on health data input by the user (e.g., asking "What should I do if my sugar level is high?"
    - iv) Use AI to provide personalized meal plans, exercise routines, and lifestyle changes based on the user’s unique profile.
 

- Sabbir's interst is in national health from nation grade policy level. He is more focused on 
    - i) Public Health Monitoring and Insights
    - ii) AI models can analyze large-scale population health data to predict diabetes prevalence trends - present in the Bangladesh map
    - iii) Forecast healthcare needs (e.g., number of diabetes cases) to aid in resource allocation and policy-making.
    - iv) AI models can predict areas with high diabetes incidence, allowing for targeted distribution of medical resources (e.g., clinics, medicines, testing kits).
    - iv) AI can analyze anonymized clinical data to identify new patterns or trends in diabetes development (e.g., genetic factors, lifestyle correlations


- Adib is the techincal backbone of this project. His interests are:
    - i) Developing the model with current widely use industry grade tools like langchain, langraph, vllm.
    - ii) for MVP he wants to use GPT, GEMINI, Claude type solutions. Later He has plan to SFT a small LLM (i.e., gemma-4-e4b-it)
    - iii) Create models to assess diabetes risk by region, age group, socioeconomic status, etc.
    - iv) Want to take health information from paitents and also for create dashboard for doctor, national policy administrators, paitents, project maintainer. 
    - v) Backend stack should be FastAPI (python). Frontend should be Next.js
    - vi) scalability is a core issue. 
    - vii)Use AI to flag any abnormalities in lab results (e.g., blood sugar levels, HbA1c values) that might indicate an increased risk of diabetes or complications
    - viii)AI can help doctors quickly analyze and extract relevant information from electronic health records (EHR), making it easier to track a patient’s history and recommend the best course of action.
    - ix) Train an AI assistant that helps patients manage their diabetes day-to-day, answering questions, reminding them of medication, and suggesting lifestyle changes

- Steve in marketing wants an attractive site that works well with a modern browser.
