# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui, SWR, react-hook-form + Zod
- **Backend:** FastAPI (Python 3.12), SQLAlchemy 2.0, Pydantic v2, PostgreSQL 16
- **AI:** LangChain + LLM risk scoring (Anthropic Claude / OpenAI / Google) — provider-switchable via env
- **Auth:** JWT (HS256) — 15m access tokens + 7d refresh tokens, bcrypt passwords
- **Infra:** Docker Compose (dev), Nginx (prod profile), Render.com deployment

## Commands

### Frontend (`frontend/`)
```bash
npm run dev      # dev server on :3000
npm run build    # production build
npm run lint     # ESLint
```

### Backend (`backend/`)
```bash
uvicorn app.main:app --reload --port 8000   # dev server
pip install -e .                             # install deps
```

### Full stack (Docker)
```bash
docker compose up                            # starts db(:5433), backend(:8000), frontend(:3000)
docker compose --profile production up       # adds nginx(:80/:443)
```

### Backend env setup
Create `backend/.env` with at minimum:
```
JWT_SECRET_KEY=<32+ char secret>
DATABASE_URL=postgresql://health_user:health_pass@localhost:5433/health_db

# LLM risk scoring (pick one provider)
LLM_PROVIDER=anthropic          # "openai" | "anthropic" | "google"
LLM_MODEL=                      # optional override; defaults to claude-sonnet-4-6
ANTHROPIC_API_KEY=<key>
# OPENAI_API_KEY=<key>
```

## Architecture

### Request flow
Local browser → Next.js (`/v1/*` rewrite) → `http://backend:8000/v1/*` → FastAPI

On Vercel, the root `vercel.json` routes `/v1/*` to the FastAPI service. The browser uses the same `/v1/*` origin in both environments.

### Backend layout
```
backend/app/
├── main.py          # FastAPI app factory, lifespan (table create + seed), CORS
├── core/
│   ├── config.py    # Pydantic BaseSettings (reads .env); LLM_PROVIDER/LLM_MODEL/API keys
│   └── security.py  # JWT encode/decode, bcrypt helpers
├── db/
│   ├── base.py      # SQLAlchemy engine, DeclarativeBase, TimestampMixin
│   ├── session.py   # get_db() dependency
│   └── init_db.py   # create tables + seed users on startup
├── models/          # SQLAlchemy ORM: user.py, record.py (has risk_level/risk_explanation/risk_scored_at), audit.py
├── schemas/         # Pydantic request/response schemas; base.py has shared types
├── services/        # Business logic layer: auth.py, user.py, record.py, audit.py, admin.py
├── ai/
│   ├── llm_factory.py   # get_llm() — returns LangChain BaseChatModel for configured provider
│   └── risk_chain.py    # run_risk_chain(record) → RiskAssessment(risk_level, explanation, recommendations)
└── api/v1/
    ├── router.py    # aggregates all routers under /v1
    ├── deps.py      # FastAPI dependencies (get_current_user, require_admin, etc.)
    ├── auth.py      # login, register, refresh, logout, me
    ├── users.py     # profile get/update, change-password
    ├── records.py   # CRUD patient health records + POST /{id}/risk-score (triggers LLM scoring)
    └── admin.py     # stats, user mgmt, all-records, audit-logs
```

Seed credentials (dev only — hardcoded in `config.py`):
- Admin: `admin@health.local` / `admin123`
- Demo: `demo@health.local` / `demo123`

### Frontend layout
```
frontend/
├── app/
│   ├── layout.tsx               # Root: AuthProvider, Toaster, Analytics
│   ├── (auth)/                  # Public routes: login, register, forgot-password
│   └── (dashboard)/             # Protected routes; layout.tsx enforces auth + role guards
│       ├── dashboard/           # User home
│       ├── health-form/         # 8-step assessment form
│       ├── records/             # User's own records
│       ├── profile/             # Profile edit
│       └── admin/               # Admin-only dashboard
├── components/
│   ├── auth/auth-provider.tsx   # React context: auth state, login/logout actions
│   └── ui/                      # shadcn/ui components (don't hand-write these)
├── features/                    # Domain modules — each has components + hooks co-located
│   ├── health-form/             # step-*.tsx (8 steps), form-review.tsx, risk-result.tsx (shows LLM output post-submit)
│   ├── records/                 # record-card, record-detail, record-edit-form, risk-widget.tsx (risk badge on record)
│   └── admin/                   # stats-cards, users-tab, records-tab
└── lib/
    └── api/                     # Typed ApiClient — never throws, returns { data?, error?, status }
```

### Key patterns

**API calls:** Always use `lib/api/` client. It returns `{ data?, error?, status }` — never throws. Do not add raw `fetch`/`axios` calls.

**Auth:** `useAuth()` hook from `components/auth/auth-provider.tsx` provides `user`, `login()`, `logout()`, `isLoading`. Token refresh is automatic.

**Role gating:** Frontend guards in `(dashboard)/layout.tsx`; backend enforces via FastAPI dependency injection. Admin endpoints require `is_admin=True` on the User model.

**Forms:** react-hook-form + Zod schema validation. The 8-step health form uses localStorage for draft persistence between steps.

**Audit log:** All record mutations auto-append to `audit_logs` (immutable). Never delete from this table. `risk_scored` action also logged.

**LLM risk scoring:** `POST /v1/records/{id}/risk-score` triggers `run_risk_chain()`. Returns `risk_level` ("low"/"moderate"/"high"), `risk_explanation`, and `recommendations`. Auto-runs on record create and update via `services/record.py`. Results stored on `PatientRecord` model.

**DB pool:** `pool_size=10, max_overflow=20` — don't add a second engine instance.

## Deployment

Backend Dockerfile: `backend/Dockerfile` — built and deployed to Render.com (`render.yaml`). Health check endpoint: `GET /health`.

TypeScript build errors are suppressed (`ignoreBuildErrors: true` in `next.config.mjs`). Fix the type error; don't rely on this.

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
