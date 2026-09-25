## Context

See proposal.md — Why. Today `POST /v1/auth/register` always sets `roles=["user"]` (`UserCreate` has no role field). Admin can later `PATCH /v1/admin/users/{id}` with `roles`. Login already rejects inactive users; JWT embeds `roles` from the User row. Frontend register has no role picker; admin Users tab can set patient/doctor/national_admin/admin after the fact.

## Goals / Non-Goals

**Goals:**
- Extensible signup payload + UI for role choice.
- Persist pending elevated requests without putting elevated roles into JWT until approval.
- Admin list + approve/reject APIs and UI.
- Startup migration for new columns (match existing `_run_migrations` / create_all patterns).

**Non-Goals:**
- Email confirmation of professional credentials.
- Changing password policy or JWT lifetimes.
- Separating “maintainer” from `admin` string (keep existing `admin` role key).

## Decisions

1. **Pending storage on `users`**
   - Add `requested_role: str | null` and `role_request_status: str | null` (`pending` | `approved` | `rejected` | null).
   - Effective `roles` stay `["user"]` until approval; on approve set `roles` to `["doctor"]` / `["national_admin"]` / `["admin","user"]` (match existing admin seed shape) and set status `approved`, clear or keep `requested_role` for history.
   - **Alternative considered:** separate `role_requests` table — cleaner history, more join/UI work; defer unless audit needs multi-request history. Single pending request per user is enough for MVP.

2. **Patient path**
   - `requested_role=user` or omitted → `roles=["user"]`, `role_request_status=null` (auto-approved). No admin step.

3. **Login / tokens**
   - Continue issuing tokens from `user.roles` only. Pending users can log in as patients. No new “pending-only” lockout unless `is_active` is false.

4. **Admin API**
   - `GET /v1/admin/role-requests?status=pending`
   - `POST /v1/admin/role-requests/{user_id}/approve` and `.../reject`
   - Reuse `AdminUser` dependency. Also surface pending badge on existing Users tab.

5. **Frontend**
   - Register: role select (Patient / Doctor / National Admin / Admin) + copy that non-patient needs approval.
   - On pending success: toast + redirect to patient home (or a small “pending approval” banner on dashboard), never doctor/admin home.
   - Admin: pending requests section or filter on Users tab.

6. **Idempotency**
   - Re-register of same email still 400. Changing pending request: allow `PATCH` later is out of scope; one request at signup only. Admin reject leaves user as patient; they may contact admin for manual role change via existing dropdown.

## Risks / Trade-offs

- **[Risk] Users request admin and wait forever** → Mitigation: pending list is prominent; optional later email notify (non-goal now).
- **[Risk] JWT cached after approval still has old roles** → Mitigation: document refresh/re-login; approval response can note client should re-login; access token TTL is 15m.
- **[Risk] Self-signup as admin floods pending queue** → Mitigation: acceptable for demo; rate limits / captcha later.
- **[Trade-off] Pending elevated users still get full patient features** → Intentional so accounts are usable while waiting.

## Migration Plan

1. Add nullable columns via startup migration SQL (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`).
2. Deploy backend then frontend (API must accept new register field first; old clients without `role` default to patient).
3. Rollback: ignore new columns; stop sending `role` from client — elevated pending rows remain patient until manually fixed.

## Open Questions

- None blocking: banner vs dedicated pending page can be chosen during implement (spec only requires clear pending messaging).
