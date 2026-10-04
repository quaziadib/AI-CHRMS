## Why

We have two synthetic datasets (100 doctors, 1,000 Bangladesh patient records) that must exist in both local and production databases so doctor search, sharing, risk scoring and national analytics can be exercised with realistic volume. Production cannot use startup seeding (blocked by config validation), so there is no safe way to load them today, and no way to export either set back out. Phase 2/3 stakeholder need: realistic data for clinicians and national admins; admins able to take data out.

## What Changes

- Repeatable, idempotent ingestion of the doctor CSV (account + doctor profile) and patient CSV (patient records plus the patient accounts they belong to), runnable against any database (local Docker DB and production) by pointing at its connection string.
- Ingested accounts cannot sign in (unusable credentials); doctors keep the CSV active/verified flags.
- Dry-run mode and a per-file summary (inserted / updated / skipped / rejected rows with reasons); invalid rows never abort valid ones.
- Dataset files are committed under `backend/app/data/seed/` so the production container can read them.
- Two admin-only CSV export endpoints: doctors and patient records. Exports never include password hashes, and each export is audit-logged.

## Capabilities

### New Capabilities
- `data-ingestion`: loading doctor and patient datasets from CSV into any environment, safely and repeatably.
- `data-export`: admin-only CSV export of doctors and patient records.

### Modified Capabilities
<!-- none: existing doctor-profile / patient record behavior unchanged -->

## Impact

- Backend: new ingestion module/CLI (`backend/app/scripts/`), new export service + routes in `api/v1/admin.py`, tests in `backend/tests/`.
- Data: `backend/app/data/seed/doctors_100.csv`, `backend/app/data/seed/patients_1000.csv`.
- Deploy: one-off run in Render shell with production `DATABASE_URL`; no `render.yaml` or env flag changes (`SEED_*` stay false).
- No new dependencies (stdlib `csv`).

## Non-goals

- Enabling startup seeding in production or relaxing the production config guard.
- Login-capable ingested accounts, or real credential import (CSV hashes are synthetic placeholders).
- Doctor ID-picture file upload/storage (only the path string is kept).
- Frontend UI for import/export; import over HTTP; non-CSV formats.
- Re-running LLM risk scoring on ingested patients (flags are computed per existing save rules; LLM scoring stays on demand).
