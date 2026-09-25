## 1. Backend Authorization

- [x] 1.1 Add or update authorization coverage proving an `admin` can request national analytics while patients and doctors remain forbidden; verify the focused backend test passes.

## 2. Frontend Navigation and Route Access

- [x] 2.1 Add “National Overview” to the admin sidebar pointing to `/national`, preserving Admin Dashboard and Profile; verify role-specific navigation output.
- [x] 2.2 Allow admins through the `/national` route guard while continuing to redirect unauthorized roles; verify admin and national-admin access and patient/doctor denial.
- [x] 2.3 Keep the admin post-login destination at `/admin`; verify login role routing remains unchanged.

## 3. Validation

- [x] 3.1 Build the frontend and run the focused backend authorization test; verify an admin can open National Overview and load the existing database-backed dashboard.
