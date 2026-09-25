## Context

See `proposal.md` for the motivation. Admin users currently get `NAV_ADMIN`, whose destinations are `/admin` and `/profile`. The dashboard layout also has a route guard requiring `national_admin` for `/national`, while `get_national_admin_user` in the API already accepts either `national_admin` or `admin`. Login routing independently sends admins to `/admin`.

## Goals / Non-Goals

**Goals:**
- Make the existing database-backed national dashboard reachable by authenticated admins from their sidebar.
- Keep frontend route access consistent with the backend authorization already in place.
- Preserve role-specific menus and the existing admin landing page.

**Non-Goals:**
- Changing analytics APIs, aggregates, dashboard content, or backend role policy.
- Changing post-login redirection or granting access to other roles.

## Decisions

- Add a `National Overview` entry to admin navigation pointing to `/national`; retain `Admin Dashboard` and `Profile`.
- Change the frontend route guard from a single required-role check to allow the `admin` role for `/national` as well as `national_admin`. Keep `/admin` restricted to `admin` and `/doctor` restricted to `doctor`.
- Reuse the existing `/national` route and page, whose APIs are already authorized for admins. Do not create a duplicate page, endpoint, or data path.
- Leave both role-home implementations unchanged so an admin still lands on `/admin` after login and can choose National Overview afterward.

## Risks / Trade-offs

- [Frontend and API role policy could drift] → Cover admin access and patient/doctor denial at the route/API boundaries; keep the backend authorization dependency unchanged.
- [An admin with multiple roles could see an unexpected active sidebar item] → Validate the admin-first navigation behavior and exact `/national` active state with multi-role accounts if supported.

## Migration Plan

No data migration is needed. Deploy the frontend navigation and guard update; rollback by reverting those frontend changes. Existing analytics APIs and stored data remain unchanged.
