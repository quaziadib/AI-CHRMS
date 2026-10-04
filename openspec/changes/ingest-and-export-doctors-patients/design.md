## Context

See proposal.md. Observed state:
- Doctors are a `users` row (roles array) plus 1:1 `doctor_profiles`; patients' `patient_records.user_id` is a plain string column with no FK, `pid` unique.
- Production config rejects `SEED_DEMO_USERS` / `SEED_SYNTHETIC_DATA`, and `DB_INIT_ON_STARTUP=false`, so startup seeding is unavailable there by design.
- Doctor CSV: 100 rows, unique emails, 15 blank `id_pic`, `password_hash` values are `$synthetic$…` (not bcrypt). Division values are `Dhaka`, `Chattogram`, `Barishal`… whereas the app stores `Dhaka Division`, `Chittagong Division`, `Barisal Division` (see geo service), and filters match on that.
- Patient CSV: 1,000 rows, 1,000 unique pids and 1,000 unique user_ids (none exist as users), allergies blank in 656 rows, pregnancies in 529. Allergies/symptoms are `;`-separated.
- Existing CSV export precedent: `national.py` returns a `Response` with `text/csv` and writes an audit entry.

## Goals / Non-Goals

**Goals:** one ingestion path for local and prod; idempotent; safe by default (dry-run, atomic per file); exports round-trippable.
**Non-Goals:** HTTP upload, UI, scheduled sync, deletion of absent rows.

## Decisions

1. **CLI module, not startup seed or HTTP endpoint.** `python -m app.scripts.ingest_datasets [--dry-run] [--doctors PATH] [--patients PATH]`, reusing the app's engine/session from `DATABASE_URL`. Prod: run in a Render shell (or locally with the prod URL). Alternatives: relax prod seed guard (rejected: weakens a deliberate safeguard); admin upload endpoint (rejected: larger attack surface, not requested).
2. **Data committed in `backend/app/data/seed/`.** `.context/` is gitignored and absent from the image. Data is synthetic. Both Dockerfiles copy only `backend/app/`, so the folder lives under `app/` to ship in the image.
3. **Match keys and upsert.** Doctors by `id` (then email conflict → reject row); patients by `pid`. Update-in-place on match; never touch `doctor_id`, risk fields, EHR summary, plan on existing records. Use per-file transaction; rows validated up front via Pydantic/explicit checks so bad rows are skipped before any write.
4. **Unusable credentials.** Do not store CSV `password_hash`. Store a sentinel hash that bcrypt verification rejects without raising (verify in task 1.2 that the login path handles it), and `is_active` per CSV for doctors. Patient stub accounts: `is_active=false`, email `<pid-lowercase>@patient.example.bd` (must stay a valid address: admin user responses validate emails), name = pid, role `patient`, id = CSV user_id. Alternative: leave records orphaned (rejected: admin user joins/sharing break).
5. **Geography normalization.** Map CSV division to the app's division display name (`Dhaka`→`Dhaka Division`, `Chattogram`→`Chittagong Division`, `Barishal`→`Barisal Division`, others append ` Division`) so division filters work. Districts kept as given unless the geo service has a canonical alias; unmatched values are reported as warnings, not rejected.
6. **Flags on ingest.** Run the existing flag computation per record so the abnormality views are populated; skip LLM scoring (cost, rate limits, flag-gated).
7. **Export endpoints.** `GET /v1/admin/export/doctors.csv` and `/v1/admin/export/patients.csv` under existing admin router (`AdminUser` dependency). Doctors: `StreamingResponse` over a server-side cursor in batches; same for patients (1k rows today, scalable). Columns equal the import columns minus `password_hash`; doctors export reverses the division normalization to remain re-ingestable. A shared column spec drives both import and export so they cannot drift. Formula-injection guard prefixes `'` for cells starting with `= + - @`. Audit entry written when the stream starts, via existing audit service (action e.g. `admin_export`).
8. **Patient PII.** Dataset is synthetic, but the endpoint is built as if real: admin-only, audited, no caching headers (`Cache-Control: no-store`).

## Risks / Trade-offs

- [Prod run mistake against wrong DB] → echo target host, `--dry-run` first, document in tasks.
- [Synthetic patients mix into national analytics] → pids use `BD-SYN-` prefix so they are identifiable; note in handoff, no filter added now.
- [Division/district naming mismatches hide doctors from filters] → normalization + warning report; verified in tests.
- [Render free tier memory / request timeout on export] → streamed batches; 1k rows is trivial.
- [Spreadsheet export prefix alters round-trip of text starting with `-`] → importer strips the leading `'` only when it was added by the exporter for those four characters; numeric fields unaffected.

## Migration Plan

No schema change. Local: `docker compose up db`, run CLI. Prod: deploy this change, open Render shell, run `--dry-run` then real run with production `DATABASE_URL`. Rollback: delete by ingested ids/pid prefix `BD-SYN-` (documented SQL in tasks), as ingestion only adds rows.
