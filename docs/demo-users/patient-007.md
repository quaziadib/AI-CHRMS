# Demo Patient 007

> Synthetic dev account — seeded when `SEED_SYNTHETIC_DATA=true`.

## Login

| Field | Value |
|-------|-------|
| Email | `patient007@health.local` |
| Password | `patient123` |
| Role | patient (`user`) |

## Health profile (latest submission)

| Field | Value |
|-------|-------|
| District | Bogura |
| Age | 33 |
| Gender | Female |
| Risk level | high |
| Glucose | 109.8 mg/dL |
| BMI | 55.5 |
| BP | 162/97 |

## History

- **10 assessments** on file (longitudinal resubmit history)
- **12 chat messages** (multi-turn RAG history)
- PIDs: `PID-007-01` … `PID-007-10`

## URLs

- Dashboard: `/dashboard`
- Records: `/records`
- Health form: `/health-form`
