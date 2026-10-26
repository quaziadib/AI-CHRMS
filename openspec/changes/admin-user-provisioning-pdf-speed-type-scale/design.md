## Context

See proposal.md for motivation. Current state observed in the repo:

- Signup: `frontend/app/(auth)/register/page.tsx` + `features/auth/role-selector.tsx` render Patient plus three professional cards (doctor, national_admin, admin). Zod enum and `lib/api/auth.ts` accept all four. Backend `schemas/user.py` has `SignupRole = Literal["user","doctor","national_admin","admin"]` and `ELEVATED_SIGNUP_ROLES`; `services/auth.register_user` turns any elevated role into a pending request. `roles_for_approved_signup` maps admin to `["admin","user"]`.
- Admin: `api/v1/admin.py` has `PATCH /users/{id}` (roles editable via `AdminUserUpdate`), role-request approve/reject, but no create. Frontend `features/admin/components/users-tab.tsx` lists users with role select; `lib/api/admin.ts` has no create call. `backend/tests/test_signup_role_approval.py` covers schema and deps with pure unit tests (no DB), DB-backed tests exist (`test_doctor_profile_db.py`) using a Postgres fixture.
- PDF: `GET /v1/prescriptions/{id}/pdf` → `generate_prescription_pdf` builds a Jinja `Environment` per call, does `from weasyprint import HTML` lazily inside the request, renders, and returns a `StreamingResponse` with a one-chunk generator (no Content-Length). `deploy/render/Dockerfile` already installs pango/cairo/fonts (the earlier 500 fix). Render free tier: 0.1 CPU, 512 MB, sleeps when idle; WeasyPrint import plus fontconfig scan on first use can take 5–15 s there. Frontend `prescriptionsApi.patientDownloadPdf` uses raw `fetch` + blob; button has no busy state beyond a local flag.
- Type: Tailwind 4 with `@theme inline` in `app/globals.css`; no font-size tokens overridden, so defaults apply (xs 12, sm 14, base 16, lg 18 px). Components lean heavily on `text-sm` and `text-xs`.

## Goals / Non-Goals

**Goals:** server-side enforcement of the signup restriction; one new admin endpoint reusing existing user-creation and audit paths; PDF latency fix that is measurable and does not risk API readiness; app-wide type bump with zero component churn.

**Non-Goals:** invitation emails; persisting PDFs to object storage; changing PDF template; touching spacing scale; migrating existing pending national_admin/admin requests.

## Decisions

1. **Restrict signup at the schema boundary, keep elevated-role plumbing.** Introduce `PublicSignupRole = Literal["user","doctor"]` for `UserCreate.role`; keep `ELEVATED_SIGNUP_ROLES` and `roles_for_approved_signup` untouched because approval of legacy pending requests and admin provisioning still use them. A disallowed role therefore fails Pydantic validation (422) before reaching the service. Alternative: keep the literal and raise 400 in the service — rejected, the schema is the single contract and the existing tests already assert on it. Frontend: drop the two cards from `PROFESSIONAL`, narrow `SignupRole`, narrow the Zod enum and `lib/api/auth.ts` type, and change the "Or request a professional role" grid to one doctor card (`md:grid-cols-1`). Copy on the card header: "Doctors are reviewed by an admin." Remove `ROLE_LABELS` entries for the dropped roles.

2. **Admin provisioning = `POST /v1/admin/users`** with new schema `AdminUserCreate` (email, password ≥ 8, full_name, phone?, role: Literal of all four, doctor_profile? with the same cross-validation as `UserCreate`). Service `admin.create_user(db, admin_id, data)`: duplicate-email 400 (same message as register), `roles = roles_for_approved_signup(role)`, `requested_role=None`, `role_request_status=None`, `is_active=True`, `is_verified=True`, attach `DoctorProfile` when doctor, `log_audit(db, admin_id, "admin_user_created", "user", user.id)`. Return `UserResponse` 201. Password is set by admin and shared out of band; no token is issued for the new user (admin stays logged in). Alternative considered: reuse `register_user` then immediately approve — rejected, it would write two audit rows and a misleading "pending" state.

3. **Admin UI: dialog on Users tab.** New `features/admin/components/create-user-dialog.tsx` using shadcn `Dialog`, react-hook-form + Zod mirroring the register schema minus confirm-password. Reuse `DoctorDetailsSection` from `features/auth` for doctor fields (it already takes `register/errors/division/onDivisionChange/idPic*`). Add `adminApi.createUser`. `use-admin.ts` exposes `createUser` that calls the API and prepends the result to `users` (and refetches stats). Trigger button lives in the admin page header next to the search when `activeTab === 'users'`.

4. **PDF speed, three layers.**
   a. *Warm-up at startup, off the request path:* in `main.py` lifespan, after seeding, start a daemon thread that imports WeasyPrint and renders a one-line HTML to PDF. Failures are logged and ignored; `/health` is untouched. Rationale: on Render the import plus fontconfig scan dominates; doing it in a thread means the API is ready for login/dashboard within the usual time while the renderer loads in parallel. Alternative: eager import at module load — rejected, it would delay `/health` and the start script's 180 s wait.
   b. *Fontconfig cache baked into the image:* add `fc-cache -f` to `backend/Dockerfile` and `deploy/render/Dockerfile` after installing fonts, so the first render does not scan fonts at runtime (the layer is cached for the `appuser` via `FONTCONFIG_FILE` default paths; verify in container that `fc-list` is instant).
   c. *Render cache:* module-level `functools.lru_cache(maxsize=64)` style cache keyed on `(prescription_id, updated_at.isoformat())` holding PDF bytes, implemented as a small `OrderedDict` with a lock in `services/prescription.py`. Key includes `updated_at`, so doctor edits invalidate naturally. Audit `prescription_viewed` is logged by `get_prescription_for_patient` before the cache lookup, so audit is unchanged. Cache is per process; acceptable (single uvicorn worker on Render). Alternative: store PDF bytes on the `Prescription` row — rejected, bloats the table and needs a migration for a cheap win.
   d. *Response:* return `fastapi.Response(content=pdf_bytes, media_type="application/pdf", headers={Content-Disposition, Content-Length})` instead of a one-chunk `StreamingResponse`. Also build the Jinja `Environment` once at module import.
   e. *Measurement first:* task 3.1 adds timing logs (`pdf render ms`, `cache hit`) so Render logs confirm where the time goes before and after. If logs show the proxy hop (Next rewrite) or DB queries dominate instead, the remaining tasks still apply but the 2 s target is re-checked against that evidence.
   f. *Client:* `patientDownloadPdf` stays a raw fetch (binary; the typed client is JSON-only — documented exception already in place) but the button gets `disabled` + spinner while `isDownloading`, and a ref guard prevents double clicks.

5. **Type scale via Tailwind tokens.** In `globals.css` `@theme inline`, override `--text-xs: 0.8125rem` (13 px), `--text-sm: 0.9375rem` (15 px), `--text-base: 1.0625rem` (17 px), `--text-lg: 1.1875rem` (19 px), `--text-xl: 1.3125rem` (21 px), `--text-2xl: 1.625rem` (26 px), with matching `--text-*--line-height` tokens (1.5 for xs/sm/base, 1.4 for lg+) so Tailwind's `text-*` utilities emit the new sizes everywhere. Root `html` font size stays 16 px so `rem`-based spacing, radii and max-widths do not grow. Alternative: `html { font-size: 106% }` — rejected because it scales all spacing and widths (~6% larger layout) and breaks fixed-px assumptions in charts/maps. The prescription PDF template uses `pt` sizes in its own stylesheet and is unaffected.

## Risks / Trade-offs

- [Pending national_admin/admin requests from before] → untouched; approve/reject paths unchanged and covered by a test.
- [Admin sets a weak or reused temp password] → min 8 chars enforced; UI hint tells admin to share securely and ask the user to change it. Password-change flow already exists.
- [Doctor profile ID picture via admin dialog may be large] → reuse the 1 MB client limit from `DoctorDetailsSection`.
- [Warm-up thread holds memory on 512 MB instance] → WeasyPrint resident set ~60–100 MB; already paid on first download today, now just earlier. Monitor Render memory after deploy.
- [Per-process cache stale across workers] → single worker on Render; key includes `updated_at` so cross-worker staleness cannot serve outdated content, only re-render.
- [Type bump causes wrapping/overflow in dense tables, step headers, badges] → visual QA on the four densest screens listed in the spec; fix with wrapping/truncation, not by lowering tokens.
- [Render free tier still slow on cold boot] → warm-up only helps once the process is up; first request after sleep is dominated by boot, which this change does not and cannot fix.

## Migration Plan

Deploy backend and frontend together (single Render image). No DB migration. Rollback = redeploy previous image; cached PDFs are in memory only. The signup restriction is immediately effective; any in-flight client that still posts `admin` gets 422.

## Open Questions

- Exact px targets for `text-xl`/`text-2xl` headings may be tuned during visual QA without changing the spec (spec only fixes the three minimum sizes).
