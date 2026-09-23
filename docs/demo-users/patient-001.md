# Demo Patient 001

> Synthetic dev account — seeded when `SEED_SYNTHETIC_DATA=true`.

## Login

| Field | Value |
|-------|-------|
| Email | `patient001@health.local` |
| Password | `patient123` |
| Role | patient (`user`) |

## Health profile (latest submission)

| Field | Value |
|-------|-------|
| District | Dhaka |
| Age | 64 |
| Gender | Female |
| Risk level | moderate |
| Glucose | 162.0 mg/dL |
| BMI | 29.3 |
| BP | 90/76 |

## History

- **10 assessments** on file (longitudinal resubmit history)
- **12 chat messages** (multi-turn RAG history)
- PIDs: `PID-001-01` … `PID-001-10`

## URLs

- Dashboard: `/dashboard`
- Records: `/records`
- Health form: `/health-form`
