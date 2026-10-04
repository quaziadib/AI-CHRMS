## Context

`users` holds credentials, `phone`, `is_active`, `is_verified`, `roles[]`, `requested_role`. Doctor signup stays `roles=["user"]` + `requested_role="doctor"` until admin approval (`services/auth.py`, `services/admin.py`). `GET /v1/sharing/doctors` returns all active users with role doctor as id/name/email; the patient panel renders a `<select>`. Schema is `create_all` plus idempotent SQL in `db/init_db.py::_run_migrations` (no Alembic). `patient_records` already stores `division`/`district` strings; `bd_geo.DIVISIONS` lists divisions. See proposal.md.

## Goals / Non-Goals

**Goals:** add doctor-only fields without bloating `users`; one registration call; idempotent backfill; indexed server-side search.

**Non-Goals:** second credential store, file upload service, profile editing UI.

## Decisions

1. **`doctor_profiles` table, 1:1 with `users`** (`user_id` PK + FK `ON DELETE CASCADE`, plus `TimestampMixin`). The proposed `Doctor` schema duplicates name/email/phone/password_hash/is_active/is_verified, which already exist on `User`. A separate `doctors` table would create two logins, divergent flags and break `roles`/JWT/grants that key on `users.id`. Alternative: nullable doctor columns on `users` (rejected: sparse columns for every patient). Alternative: JSONB (rejected: not filterable/indexable cleanly). Mapping: `name`→`users.full_name`, rest same.
2. **Profile created at registration, not approval.** Admin needs it to review. Search ignores it until the role is approved because it filters on `roles @> {doctor}`.
3. **Single register payload**: `UserCreate` gains optional `doctor_profile`; a model validator requires it iff `role == "doctor"` and forbids it otherwise. User + profile inserted in one transaction.
4. **`id_pic` as Text reference** (URL or storage key), optional at signup since no upload pipeline exists; never exposed in patient-facing responses. Assumption: upload is a follow-up.
5. **Divisions/districts**: free strings validated for length; division chosen from `bd_geo` list in the UI, district free text/select matching record districts. No new geo table.
6. **Search**: `GET /v1/sharing/doctors?q=&search_by=all|name|email|specialization|affiliation|location&specialization=&division=&district=&limit=&offset=`; response wraps `items` + `total`. Query joins `users` ↔ `doctor_profiles` using `ILIKE` with escaped `%`/`_`; affiliations matched via `EXISTS (SELECT 1 FROM unnest(affiliations) a WHERE a ILIKE ...)`. `GET /v1/sharing/doctors/filters` returns distinct values. Indexes on `(division, district)` and `specialization`; trigram indexes deferred (small doctor population). Frontend debounces `q` (300 ms) and passes via SWR.
7. **Backfill** in `_run_migrations`: create table via `create_all`, then `INSERT ... SELECT` for doctor-role users (and pending `requested_role='doctor'`) with no profile, using `ON CONFLICT DO NOTHING`; random specialization/division/district/location/affiliations picked in SQL (`(ARRAY[...])[1+floor(random()*n)::int]`). Placeholder rows are marked by location text prefix "Placeholder: " so admins can recognise them. Seeded demo doctor handled by same path.
8. **Admin**: `RoleRequestResponse` embeds `doctor_profile` (with `id_pic`).

## Risks / Trade-offs

- Random placeholder data looks real to patients → "Placeholder:" marker in location; replace via later edit feature.
- Large `id_pic` data URLs could bloat rows → cap length (e.g. 2 MB) in schema validation.
- Breaking response shape of `/sharing/doctors` → only consumer is the patient panel, updated in same change.
- Unescaped wildcards in `ILIKE` → escape input; parameterised queries only (no SQL injection).
- Backfill randomness not reproducible → acceptable for placeholder data.

## Migration Plan

Deploy backend: startup creates table, backfills. Rollback: drop `doctor_profiles`; no `users` columns changed, so older code is unaffected. Frontend and backend ship together (response shape change).

## Open Questions

- Should approval mark `users.is_verified = true` for doctors? Defaulted to no change; revisit.
