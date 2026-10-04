# Backend — Health Project API

FastAPI backend with modular monolith architecture, PostgreSQL, and JWT authentication.

## Module Structure

```
backend/
├── app/
│   ├── main.py              # App factory, lifespan, CORS middleware
│   ├── core/
│   │   ├── config.py        # Pydantic Settings (reads from .env / environment)
│   │   └── security.py      # JWT creation/decoding, bcrypt, PID generation
│   ├── db/
│   │   ├── base.py          # SQLAlchemy engine + DeclarativeBase
│   │   ├── session.py       # Session factory + get_db dependency
│   │   └── init_db.py       # Table creation + declarative seed data
│   ├── models/              # SQLAlchemy ORM models
│   │   ├── __init__.py      # Exports all models (required for auto table creation)
│   │   ├── user.py          # User, RefreshToken
│   │   ├── record.py        # PatientRecord
│   │   └── audit.py         # AuditLog
│   ├── schemas/             # Pydantic request/response schemas
│   │   ├── user.py
│   │   ├── record.py
│   │   └── audit.py
│   ├── api/
│   │   ├── deps.py          # Shared FastAPI dependencies (CurrentUser, AdminUser, DB)
│   │   └── v1/
│   │       ├── router.py    # Combines all routers under /v1
│   │       ├── auth.py      # /v1/auth/*
│   │       ├── users.py     # /v1/users/*
│   │       ├── records.py   # /v1/records/*
│   │       └── admin.py     # /v1/admin/*
│   └── services/            # Business logic (no HTTP concerns)
│       ├── auth.py
│       ├── user.py
│       ├── record.py
│       └── audit.py
├── pyproject.toml
├── Dockerfile
└── .env.example
```

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | — | Health check |
| POST | `/v1/auth/register` | — | Register new user |
| POST | `/v1/auth/login` | — | Login, get tokens |
| POST | `/v1/auth/refresh` | — | Rotate refresh token |
| POST | `/v1/auth/logout` | User | Logout |
| GET | `/v1/auth/me` | User | Current user info |
| GET | `/v1/users/me` | User | Get profile |
| PATCH | `/v1/users/me` | User | Update profile |
| POST | `/v1/users/me/change-password` | User | Change password |
| GET | `/v1/records` | User | List own records |
| POST | `/v1/records` | User | Create record (one per user) |
| GET | `/v1/records/{id}` | User | Get specific record |
| PATCH | `/v1/records/{id}` | User | Update record |
| DELETE | `/v1/records/{id}` | User | Delete record |
| GET | `/v1/admin/stats` | Admin | Dashboard stats |
| GET | `/v1/admin/users` | Admin | List all users |
| GET | `/v1/admin/users/{id}` | Admin | Get user |
| PATCH | `/v1/admin/users/{id}` | Admin | Update user role/status |
| GET | `/v1/admin/records` | Admin | List all records |
| GET | `/v1/admin/audit-logs` | Admin | Audit trail |

Full interactive docs at http://localhost:8000/docs when running.

## Local Development (without Docker)

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install uv
uv pip install -r pyproject.toml

# Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL URL and secret key

# Run
uvicorn app.main:app --reload
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://...@localhost/healthdb` | PostgreSQL connection string |
| `JWT_SECRET_KEY` | *(required in prod)* | Min 32-char secret for JWT signing |
| `JWT_ALGORITHM` | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `15` | Access token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Refresh token lifetime |
| `ADMIN_EMAIL` | `admin@health.local` | Seed admin email |
| `ADMIN_PASSWORD` | `admin123` | Seed admin password |
| `DEMO_EMAIL` | `demo@health.local` | Seed demo user email |
| `DEMO_PASSWORD` | `demo123` | Seed demo user password |

## Data Flow

```
HTTP Request
    ↓
FastAPI Router (app/api/v1/*.py)
    ↓
Dependency Injection (app/api/deps.py)
  - JWT validation → User model
  - DB session injection
    ↓
Service Layer (app/services/*.py)
  - Business logic
  - Authorization checks
  - Audit logging
    ↓
SQLAlchemy ORM (app/models/*.py)
    ↓
PostgreSQL
```

## Dataset ingestion & export

The bundled synthetic datasets live in `app/data/seed/` (`doctors_100.csv`, `patients_1000.csv`). They are loaded by a CLI that targets whatever database `DATABASE_URL` points to, and does not depend on the `SEED_*` flags (which stay `false` in production).

```bash
cd backend
python -m app.scripts.ingest_datasets --dry-run   # validate + report, writes nothing
python -m app.scripts.ingest_datasets             # real run
```

- Prints the target `host/port/db` (never credentials) first. Check it before a real run.
- Idempotent: matched by doctor `id` / patient `pid`. Re-runs update in place, never delete, and never touch an existing record's assigned doctor, risk scores, EHR summary or plan.
- Rejected rows are listed with line number and reason; valid rows still load. Each file is one transaction.
- Ingested accounts (doctors and one stub patient account per `user_id`) cannot sign in.
- Exit codes: `0` ok, `1` database error, `2` missing/invalid file (including bundled-file row-count mismatch).
- Local: `docker compose up db`, then `DATABASE_URL=postgresql://healthadmin:healthpass123@localhost:5433/healthdb python -m app.scripts.ingest_datasets`.
- Production (Render): open the service Shell (it already has the production `DATABASE_URL`), `cd /app/backend`, run `--dry-run`, confirm the host, then run without it.

Rollback (ingestion only adds rows; patient pids all start with `BD-SYN-`):

```sql
DELETE FROM patient_records WHERE pid LIKE 'BD-SYN-%';
DELETE FROM users WHERE email LIKE '%@patient.example.bd';  -- stub patient accounts
DELETE FROM users WHERE email LIKE '%@doctor.example.bd';   -- doctors; profiles cascade
```

Admin-only CSV exports (same columns as the import files; no password hashes; audited; `Cache-Control: no-store`):

- `GET /v1/admin/export/doctors.csv`
- `GET /v1/admin/export/patients.csv`

Text cells starting with `= + - @` are prefixed with `'` so spreadsheets don't execute them (this includes phone numbers beginning with `+`); the importer strips that prefix again.

## Extending the App

### Add a new database model
1. Create `app/models/<name>.py` with your `DeclarativeBase` subclass
2. Add it to `app/models/__init__.py` — tables are created automatically on next startup (no changes to `init_db.py`)

### Add a new seed user
Open `app/db/init_db.py` and append a dict to `_SEED_USERS`:
```python
_SEED_USERS = [
    { ... },   # existing entries
    {
        "email": "nurse@health.local",
        "password": "nurse123",
        "full_name": "Demo Nurse",
        "roles": ["user"],
        "is_active": True,
        "is_verified": True,
    },
]
```
The seed loop handles upsert-avoidance automatically — the user is only created if the email doesn't already exist.

### Add a new API router
1. Create `app/api/v1/<feature>.py` with `router = APIRouter()`
2. Add two lines to `app/api/v1/router.py`:
```python
from app.api.v1 import <feature>
router.include_router(<feature>.router, prefix="/<feature>", tags=["<Feature>"])
```

### Add a new service
Create `app/services/<name>.py`. Services receive a `db: Session` argument and contain all business logic. Import them in the relevant router — no registration required.

## Security

- Passwords hashed with **bcrypt** (passlib, bcrypt<4.0 for compatibility)
- JWT **access tokens** expire in 15 minutes
- JWT **refresh tokens** rotate on every use (stored hashed in DB)
- Role-based access: `["user"]` or `["admin", "user"]`
- One health record per user enforced at service layer
- All mutations logged to `audit_logs` table
