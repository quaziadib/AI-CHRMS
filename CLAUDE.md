# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui, SWR, react-hook-form + Zod
- **Backend:** FastAPI (Python 3.12), SQLAlchemy 2.0, Pydantic v2, PostgreSQL 16
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
```

## Architecture

### Request flow
Browser → Next.js (`/api/v1/*` rewrite) → `http://backend:8000/v1/*` → FastAPI

Next.js proxies all API calls via `next.config.mjs` rewrites — frontend never exposes backend origin to the browser.

### Backend layout
```
backend/app/
├── main.py          # FastAPI app factory, lifespan (table create + seed), CORS
├── core/
│   ├── config.py    # Pydantic BaseSettings (reads .env)
│   └── security.py  # JWT encode/decode, bcrypt helpers
├── db/
│   ├── base.py      # SQLAlchemy engine, DeclarativeBase, TimestampMixin
│   ├── session.py   # get_db() dependency
│   └── init_db.py   # create tables + seed users on startup
├── models/          # SQLAlchemy ORM: user.py, record.py, audit.py
├── schemas/         # Pydantic request/response schemas (same domain split)
└── api/v1/
    ├── router.py    # aggregates all routers under /v1
    ├── auth.py      # login, register, refresh, logout, me
    ├── users.py     # profile get/update, change-password
    ├── records.py   # CRUD patient health records
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
│   ├── health-form/
│   ├── records/
│   └── admin/
└── lib/
    └── api/                     # Typed ApiClient — never throws, returns { data?, error?, status }
```

### Key patterns

**API calls:** Always use `lib/api/` client. It returns `{ data?, error?, status }` — never throws. Do not add raw `fetch`/`axios` calls.

**Auth:** `useAuth()` hook from `components/auth/auth-provider.tsx` provides `user`, `login()`, `logout()`, `isLoading`. Token refresh is automatic.

**Role gating:** Frontend guards in `(dashboard)/layout.tsx`; backend enforces via FastAPI dependency injection. Admin endpoints require `is_admin=True` on the User model.

**Forms:** react-hook-form + Zod schema validation. The 8-step health form uses localStorage for draft persistence between steps.

**Audit log:** All record mutations auto-append to `audit_logs` (immutable). Never delete from this table.

**DB pool:** `pool_size=10, max_overflow=20` — don't add a second engine instance.

## Deployment

Backend Dockerfile: `backend/Dockerfile` — built and deployed to Render.com (`render.yaml`). Health check endpoint: `GET /health`.

TypeScript build errors are suppressed (`ignoreBuildErrors: true` in `next.config.mjs`). Fix the type error; don't rely on this.
