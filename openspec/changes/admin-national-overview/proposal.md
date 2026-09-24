## Why

Administrators currently land on `/admin` and see only the admin-specific navigation, even though the backend already authorizes admins to use national analytics. Giving admins a named “National Overview” destination makes those population-level views discoverable alongside their existing management pages after login.

## What Changes

- Add a “National Overview” item to the authenticated admin navigation, linking to the existing `/national` dashboard.
- Allow the `admin` role through the frontend `/national` route guard while continuing to reject unrelated roles.
- Reuse the existing national dashboard and database-backed analytics rather than creating a second page or duplicating data flows.
- Keep `/admin` as the admin post-login landing page; the overview is an additional destination.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `role-navigation`: admins receive a National Overview navigation destination and may open it after authentication.
- `national-analytics`: authorized system admins may view the same protected dashboard already available to national admins.

## Non-goals

- Changing the admin default landing page or removing existing admin navigation destinations.
- Granting national analytics access to doctors, patients, or other roles.
- Duplicating or redesigning the national dashboard.

## Impact

- Frontend role navigation and route guard in `frontend/app/(dashboard)/layout.tsx`.
- Existing `/national` page and national analytics API authorization; no new endpoints or database changes are expected.
