# Health Project

A full-stack health data collection platform built with **Next.js 16** (frontend) and **FastAPI** (backend), backed by **PostgreSQL**.

## Architecture

```
health-project/
├── backend/          # FastAPI modular monolith
├── frontend/         # Next.js 16 App Router
├── nginx/            # Reverse proxy config (production)
└── docker-compose.yml
```

**Stack:**
| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | FastAPI, SQLAlchemy 2, Pydantic v2, Python 3.12 |
| Database | PostgreSQL 16 |
| Auth | JWT (access + refresh tokens), bcrypt |
| Infrastructure | Docker, Docker Compose, Nginx |

## Quick Start

### Prerequisites
- Docker Desktop
- Docker Compose v2

### Run the app

```bash
# Clone and start
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

**URLs:**
- Frontend: http://localhost:3001
- Backend API: http://localhost:8000
- API Docs (Swagger): http://localhost:8000/docs
- API Docs (ReDoc): http://localhost:8000/redoc

### Demo Credentials
| Role | Email | Password |
|---|---|---|
| Admin | admin@health.local | admin123 |
| User | demo@health.local | demo123 |

## Features

### For Users
- Register and log in securely
- Submit a single multi-step health assessment (8 steps)
- View and edit their own health record
- Manage profile and change password

### For Admins
- View all users and manage roles/status
- Browse all patient records with full details
- Export all records as CSV
- View real-time stats dashboard

## Development

See [backend/README.md](backend/README.md) and [frontend/README.md](frontend/README.md) for service-specific setup.

### Environment Variables

Copy `.env.example` files and fill in secrets:

```bash
cp backend/.env.example backend/.env
```

Key variables:
```
DATABASE_URL=postgresql://user:pass@db:5432/healthdb
JWT_SECRET_KEY=<minimum 32 character random string>
```

## API Reference

See [docs/API.md](docs/API.md) for the full REST API specification.
