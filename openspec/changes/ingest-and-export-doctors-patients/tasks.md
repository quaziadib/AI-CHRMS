## 1. Dataset files and shared column spec

- [x] 1.1 Copy both CSVs to `backend/app/data/seed/doctors_100.csv` and `patients_1000.csv` (strip BOM/CRLF issues); verify row counts 100 and 1000 (under `app/` because the Dockerfiles copy only `backend/app`)
- [x] 1.2 Check how login handles a non-bcrypt/sentinel hash (`core/security.py`); add a sentinel constant and a unit test proving login returns invalid credentials rather than raising
- [x] 1.3 Define column spec (CSV column ↔ model field, parsers/formatters for booleans, `;` lists, blanks) in one module; verify with unit tests for parse/format round-trip

## 2. Ingestion backend

- [x] 2.1 Implement row validation for doctors (required fields, division normalization, affiliations split) with rejection reasons; verify with unit tests incl. bad rows
- [x] 2.2 Implement doctor upsert (user + profile, email-conflict rejection, id match); verify with DB test: insert, rerun = 0 inserts, conflict row rejected
- [x] 2.3 Implement patient validation + stub patient accounts + record upsert preserving `doctor_id`/risk/EHR/plan fields and computing flags; verify with DB test incl. blank allergies/pregnancies and preserved assigned doctor
- [x] 2.4 Implement CLI `python -m app.scripts.ingest_datasets` with `--dry-run`, path overrides, target-host echo, per-file transaction, summary, non-zero exit on unreadable file/DB; verify dry-run leaves DB unchanged and missing path exits non-zero

## 3. Export backend

- [x] 3.1 Add export service streaming doctors and patients from the shared column spec with formula-injection guard and no password hash; verify with unit tests on output header/rows
- [x] 3.2 Add `GET /v1/admin/export/doctors.csv` and `/patients.csv` (admin-only, `no-store`, attachment filename, audit entry); verify 401/403/200 and audit row via API tests
- [x] 3.3 Verify round trip: ingest → export patients → ingest into empty DB → fields equal (test)

## 4. Local and production rollout

- [x] 4.1 Run locally: `docker compose up db`, dry-run then real ingest; verify counts (100 doctors with profiles, 1000 records) and that doctor search filters return ingested doctors by division/district
- [x] 4.2 Hit both export endpoints locally as seeded admin; verify downloaded CSVs open with expected rows and no password column
- [x] 4.3 Document prod runbook (Render shell command, dry-run first, rollback SQL by `BD-SYN-` pid prefix and doctor ids) in `backend/README.md`
- [ ] 4.4 After deploy, run prod dry-run then real ingest with user approval of the target; verify counts via admin stats and export endpoint

## 5. Validation

- [x] 5.1 Run `pytest` in `backend/` and verify all new and existing tests pass
