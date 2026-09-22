# API Reference

Base URL: `http://localhost:8000`
All authenticated endpoints require `Authorization: Bearer <access_token>`.

🔒 = requires user token &nbsp;&nbsp; 👑 = requires admin role

---

## Authentication

### POST `/v1/auth/register`
Create a new user account.

**Request**
```json
{
  "email": "user@example.com",
  "password": "secret123",
  "full_name": "Jane Doe",
  "phone": "+8801700000000"
}
```

**Response `201`**
```json
{
  "access_token": "<jwt>",
  "refresh_token": "<jwt>",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "Jane Doe",
    "phone": "+8801700000000",
    "is_active": true,
    "is_verified": false,
    "roles": ["user"],
    "created_at": "2026-03-19T10:00:00+00:00",
    "updated_at": "2026-03-19T10:00:00+00:00"
  }
}
```

**Errors**
- `400` — email already registered

---

### POST `/v1/auth/login`
Login and receive tokens.

**Request**
```json
{ "email": "user@example.com", "password": "secret123" }
```

**Response `200`** — same shape as `/register`

**Errors**
- `401` — incorrect credentials
- `400` — account disabled

---

### POST `/v1/auth/refresh`
Rotate the refresh token. Old token is invalidated immediately (rotation on use).

**Request**
```json
{ "refresh_token": "<jwt>" }
```

**Response `200`**
```json
{
  "access_token": "<new_jwt>",
  "refresh_token": "<new_jwt>",
  "token_type": "bearer"
}
```

**Errors**
- `401` — token invalid or already revoked

---

### POST `/v1/auth/logout` 🔒
Revokes the current refresh token and logs the action.

**Response `200`** `{ "message": "Logged out successfully" }`

---

### GET `/v1/auth/me` 🔒
Returns the current authenticated user.

**Response `200`** — `User` object (see register response)

---

## Users

### GET `/v1/users/me` 🔒
Get own profile.

**Response `200`** — `User` object

---

### PATCH `/v1/users/me` 🔒
Update own profile. Only `full_name` and `phone` are mutable.

**Request** (all fields optional)
```json
{ "full_name": "New Name", "phone": "+8801700000001" }
```

**Response `200`** — updated `User` object

---

### POST `/v1/users/me/change-password` 🔒

**Request**
```json
{ "current_password": "old", "new_password": "newpass123" }
```

**Response `200`** `{ "message": "Password changed successfully" }`

**Errors**
- `400` — current password incorrect
- `422` — new password too short (< 6 chars)

---

## Records

### GET `/v1/records` 🔒
List the current user's records.

**Query params:** `skip=0`, `limit=100`

**Response `200`** — array of `PatientRecord`

---

### POST `/v1/records` 🔒
Create a health record. **Each user may only have one record.**

**Request body — all fields:**
```json
{
  "age": 35,
  "gender": "Male",
  "district": "Dhaka",
  "family_diabetes": false,
  "family_hypertension": true,
  "family_cvd": false,
  "family_stroke": false,
  "diabetes_history": false,
  "hypertension": false,
  "cvd": false,
  "stroke": false,
  "allergies": null,
  "pregnancies": null,
  "bp_systolic": 120,
  "bp_diastolic": 80,
  "height": 170.0,
  "weight": 70.0,
  "bmi": 24.2,
  "pulse_rate": 72,
  "blood_glucose": null,
  "cholesterol": null,
  "hemoglobin": null,
  "creatinine": null,
  "ecg_result": null,
  "symptoms": null,
  "diagnosis": null,
  "smoking": "Never",
  "physical_activity": "Moderate",
  "alcohol": "Never",
  "sleep_hours": 7.0,
  "sound_sleep": true
}
```

**Response `201`** — `PatientRecord` (includes `id`, `user_id`, `pid`, `created_at`, `updated_at`)

**Errors**
- `400` — user already has a record

---

### GET `/v1/records/{id}` 🔒
Get a specific record. Users can only access their own; admins can access any.

---

### PATCH `/v1/records/{id}` 🔒
Update a record. All fields optional; protected fields (`id`, `user_id`, `pid`, `created_at`) are ignored.

---

### DELETE `/v1/records/{id}` 🔒
Delete a record. Returns `204 No Content`.

---

## Admin

All admin endpoints require the `admin` role.

### GET `/v1/admin/stats` 🔒👑

Returns aggregate counts. Note: the admin dashboard also displays an **Administrators** count — that value is computed client-side by counting users whose `roles` includes `"admin"`, not returned here.

```json
{
  "total_users": 10,
  "active_users": 9,
  "total_records": 7,
  "records_today": 2,
  "records_this_week": 5,
  "records_this_month": 7
}
```

---

### GET `/v1/admin/users` 🔒👑
List all users.

**Query params:** `skip=0`, `limit=100`, `search` (case-insensitive match on name or email)

**Response `200`** — array of `User`

---

### GET `/v1/admin/users/{id}` 🔒👑
Get a single user by ID.

**Response `200`** — `User` object
**Errors** — `404` if not found

---

### PATCH `/v1/admin/users/{id}` 🔒👑
Update a user. Only `is_active`, `is_verified`, and `roles` are writable by admin.

**Request** (all fields optional)
```json
{ "is_active": false }
{ "roles": ["user"] }
{ "roles": ["admin", "user"] }
```

**Response `200`** — updated `User` object

---

### GET `/v1/admin/records` 🔒👑
List all patient records.

**Query params:** `skip=0`, `limit=100`, `user_id` (filter by owner)

**Response `200`** — array of `PatientRecord`

---

### GET `/v1/admin/audit-logs` 🔒👑

**Query params:** `skip=0`, `limit=100`, `user_id`, `action`

**Response `200`** — array of audit log entries:
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "user_email": "user@example.com",
  "action": "create_record",
  "entity_type": "patient_record",
  "entity_id": "uuid",
  "ip_address": null,
  "user_agent": null,
  "status": "success",
  "timestamp": "2026-03-19T10:00:00+00:00"
}
```

**Tracked actions:** `register`, `login`, `logout`, `update_profile`, `change_password`, `create_record`, `update_record`, `delete_record`, `admin_update_user`

---

## Error Format

All errors return JSON:
```json
{ "detail": "Human-readable error message" }
```

Validation errors (`422`) from Pydantic return an array:
```json
{
  "detail": [
    { "type": "...", "loc": ["body", "field"], "msg": "...", "input": "..." }
  ]
}
```

The frontend API client normalises these into a single joined string automatically.

---

## National Analytics 🌐

Requires `national_admin` or `admin` role. Master flag: `ENABLE_NATIONAL_ANALYTICS` (default `true`). Related flags: `ENABLE_POPULATION_FORECASTING`, `ENABLE_PATTERN_DISCOVERY`, `ENABLE_NATIONAL_INDIVIDUAL_PREDICTOR`. Cell suppression: `NATIONAL_MIN_CELL_SIZE` (default `5`).

All aggregate responses are **anonymized** — never include patient name, email, or user id. The `/national` UI follows the RSGI flow (geo filters, LLM individual predictor, spatial matrix, charts, LLM epidemic forecast).

### GET `/v1/national/geo/divisions`
### GET `/v1/national/geo/districts?division_id=`
### GET `/v1/national/geo/upazillas?district_id=`
### GET `/v1/national/geo/thanas?upazilla_id=`
Cascading Bangladesh admin hierarchy options.

### GET `/v1/national/spatial?division_id=&district_id=`
Spatial risk matrix hotspots + regional metrics for selected geography.

### GET `/v1/national/charts/divisions`
### GET `/v1/national/charts/demographics`
Anonymized prevalence chart series (division; age×gender).

### POST `/v1/national/predict-individual`
LLM what-if individual risk prediction. Body: `age`, `gender`, `bmi`, `glucose`, `family_history`, `activity`. Returns probability, risk level, category, confidence, top factors. Does **not** persist EHR. Flag: `ENABLE_NATIONAL_INDIVIDUAL_PREDICTOR`. Engine is always LLM (not XGBoost).

### POST `/v1/national/epidemic-forecast`
### GET `/v1/national/epidemic-forecast/latest`
LLM multi-year urban/rural epidemic forecast job (`forecast_kind: epidemic_llm`) + risk-group shares. Flag: `ENABLE_POPULATION_FORECASTING`.

### GET `/v1/national/districts/summary`
District risk distribution for map/table views.

**Response `200`**
```json
{
  "districts": [
    {
      "district": "Dhaka",
      "suppressed": false,
      "record_count": 42,
      "low_risk": 10,
      "moderate_risk": 20,
      "high_risk": 12,
      "unscored": 0,
      "high_risk_rate": 0.2857,
      "latest_record_at": "2026-09-01T12:00:00+00:00"
    }
  ],
  "generated_at": "2026-09-22T06:00:00+00:00",
  "min_cell_size": 5
}
```

**Errors:** `403` wrong role · `503` analytics disabled

### GET `/v1/national/resources`
Resource allocation estimates (kits, medicines, clinic sites) from forecast or current high-risk burden.

### GET `/v1/national/export.csv`
CSV download of district summary. Audits `national_analytics_exported`.

### POST `/v1/national/forecasts`
Enqueue population forecast job (`202`). Sync fallback if Celery unavailable. Flag: `ENABLE_POPULATION_FORECASTING`.

### GET `/v1/national/forecasts/latest`
Latest population forecast job payload.

### POST `/v1/national/patterns`
On-demand LLM pattern insights over anonymized aggregates. Audits `national_pattern_discovery`. Flag: `ENABLE_PATTERN_DISCOVERY`. Returns `insufficient_data: true` without calling the LLM when no usable aggregates exist.

---

## PatientRecord Schema

| Field | Type | Required | Constraints |
|---|---|---|---|
| `age` | int | ✓ | 0–150 |
| `gender` | string | ✓ | — |
| `district` | string | ✓ | — |
| `family_diabetes` | bool | ✓ | default false |
| `family_hypertension` | bool | ✓ | default false |
| `family_cvd` | bool | ✓ | default false |
| `family_stroke` | bool | ✓ | default false |
| `diabetes_history` | bool | ✓ | default false |
| `hypertension` | bool | ✓ | default false |
| `cvd` | bool | ✓ | default false |
| `stroke` | bool | ✓ | default false |
| `allergies` | string? | — | optional |
| `pregnancies` | int? | — | optional |
| `bp_systolic` | int | ✓ | 50–300 mmHg |
| `bp_diastolic` | int | ✓ | 30–200 mmHg |
| `height` | float | ✓ | 30–300 cm |
| `weight` | float | ✓ | 1–500 kg |
| `bmi` | float | ✓ | auto-calculated client-side |
| `pulse_rate` | int | ✓ | 20–250 bpm |
| `blood_glucose` | float? | — | mg/dL, optional |
| `cholesterol` | float? | — | mg/dL, optional |
| `hemoglobin` | float? | — | g/dL, optional |
| `creatinine` | float? | — | mg/dL, optional |
| `ecg_result` | string? | — | optional |
| `symptoms` | string? | — | optional |
| `diagnosis` | string? | — | optional |
| `smoking` | string | ✓ | — |
| `physical_activity` | string | ✓ | — |
| `alcohol` | string | ✓ | — |
| `sleep_hours` | float | ✓ | 0–24 hrs |
| `sound_sleep` | bool | ✓ | default false |

---

## User Schema

| Field | Type | Notes |
|---|---|---|
| `id` | uuid string | Read-only |
| `email` | string | Immutable after registration |
| `full_name` | string | Mutable via PATCH /users/me |
| `phone` | string? | Mutable via PATCH /users/me |
| `is_active` | bool | Set by admin only |
| `is_verified` | bool | Set by admin only |
| `roles` | string[] | `["user"]` or `["admin", "user"]` |
| `created_at` | ISO 8601 string | Read-only |
| `updated_at` | ISO 8601 string | Read-only |
