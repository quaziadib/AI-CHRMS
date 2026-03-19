# Frontend — Health Project

Next.js 16 frontend with App Router, feature-based modular architecture, and shadcn/ui components.

## Module Structure

```
frontend/
├── app/                          # Next.js App Router (thin page shells)
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx            # Sidebar nav, auth guard, role-based nav
│   │   ├── dashboard/page.tsx
│   │   ├── health-form/page.tsx  # Composes health-form feature
│   │   ├── records/page.tsx      # Composes records feature
│   │   ├── admin/page.tsx        # Composes admin feature (admin-only)
│   │   └── profile/page.tsx
│   ├── layout.tsx                # Root layout (Toaster, theme)
│   └── page.tsx                  # Landing page
│
├── features/                     # Feature modules (domain logic + UI)
│   ├── health-form/
│   │   ├── components/
│   │   │   ├── step-demographics.tsx
│   │   │   ├── step-family-history.tsx
│   │   │   ├── step-medical-history.tsx
│   │   │   ├── step-vital-signs.tsx
│   │   │   ├── step-lab-results.tsx
│   │   │   ├── step-lifestyle.tsx
│   │   │   ├── step-clinical.tsx
│   │   │   └── form-review.tsx
│   │   └── hooks/
│   │       └── use-health-form.ts   # All form state, draft, submission
│   ├── records/
│   │   ├── components/
│   │   │   ├── record-card.tsx      # Card header + action buttons
│   │   │   ├── record-detail.tsx    # Read-only expanded view
│   │   │   └── record-edit-form.tsx # Inline edit form
│   │   └── hooks/
│   │       └── use-records.ts       # List/edit state management
│   └── admin/
│       ├── components/
│       │   ├── stats-cards.tsx      # Dashboard stat cards
│       │   ├── users-tab.tsx        # User management table
│       │   └── records-tab.tsx      # Records browser + CSV export
│       └── hooks/
│           └── use-admin.ts         # Data fetching + handlers, client-side stats
│
├── components/
│   ├── auth/
│   │   └── auth-provider.tsx        # React context, login/logout
│   └── ui/                          # shadcn/ui base + custom shared components
│       ├── stat-card.tsx            # Reusable stat card (title + value + icon)
│       ├── form-field.tsx           # FieldWrapper + FormSelectField
│       └── record-sections.tsx      # VitalSignsSection, MedicalHistorySection, etc.
│
├── hooks/
│   └── use-form-draft.ts            # localStorage draft persistence
│
└── lib/
    ├── api/                         # API client (split by domain)
    │   ├── client.ts                # Base ApiClient class
    │   ├── auth.ts                  # authApi
    │   ├── users.ts                 # usersApi
    │   ├── records.ts               # recordsApi
    │   ├── admin.ts                 # adminApi
    │   ├── types.ts                 # All TypeScript interfaces
    │   └── index.ts                 # Re-exports (public surface)
    ├── api.ts                       # Backward-compat re-export shim
    ├── health-form-schema.ts        # Zod validation schemas (all 8 steps)
    └── utils.ts                     # formatDate, calculateBMI, getBMICategory
```

## Local Development

```bash
cd frontend

# Install dependencies
corepack enable pnpm
pnpm install

# Start dev server
pnpm dev
```

App runs at http://localhost:3000. Requires the backend to be running at port 8000 (or adjust `next.config.mjs` rewrites).

## Key Patterns

### API Layer
All HTTP calls go through the typed `ApiClient` in `lib/api/client.ts`. It:
- Injects the JWT `Authorization` header automatically
- Normalises errors: Pydantic array errors (`[{msg, loc}]`) → joined string
- Returns `{ data?, error?, status }` — never throws

Import from `@/lib/api` (the shim) for full backward compatibility:
```typescript
import { recordsApi, type PatientRecord } from '@/lib/api'
```
Or import directly from the split files:
```typescript
import { recordsApi } from '@/lib/api/records'
import type { PatientRecord } from '@/lib/api/types'
```

### Auth
`useAuth()` from `@/components/auth/auth-provider` provides:
- `user: User | null`
- `isLoading: boolean`
- `login(email, password)` → `{ success, error }`
- `logout()`
- `refreshUser()`

Protected routes check auth inside `(dashboard)/layout.tsx`: it calls `useAuth()` and `router.push('/login')` when `!isAuthenticated`. Admin access is also gated here — admin users see only the Admin Dashboard + Profile nav items.

### Feature Hooks
Each feature module exposes a custom hook that owns all state and side effects:

```typescript
// Records page becomes a thin wrapper:
const { records, isLoading, editingId, editData, isSaving,
        startEdit, cancelEdit, setField, saveEdit } = useRecords()
```

### Form Validation
Multi-step form uses Zod schemas defined in `lib/health-form-schema.ts`. Each step validates its own fields before allowing navigation forward. Drafts are auto-saved to localStorage on every step advance.

### Shared UI Components

**`FieldWrapper`** — wraps any form input with a label and optional error message. Eliminates the `<div className="space-y-2"><Label />{children}<p className="text-destructive" /></div>` pattern:
```tsx
import { FieldWrapper } from '@/components/ui/form-field'

<FieldWrapper label="Age (years) *" htmlFor="age" error={errors.age?.message}>
  <Input id="age" type="number" {...register('age')} />
</FieldWrapper>
```

**`FormSelectField`** — label + shadcn Select + options array + error, all in one:
```tsx
import { FormSelectField } from '@/components/ui/form-field'

<FormSelectField
  label="Gender *"
  value={watch('gender')}
  onValueChange={(v) => setValue('gender', v)}
  placeholder="Select gender"
  options={genderOptions}
  error={errors.gender?.message}
/>
```

**`StatCard`** — title + value + icon card used in both the user dashboard and admin stats:
```tsx
import { StatCard } from '@/components/ui/stat-card'

<StatCard title="Total Records" value={42} icon={FileText} description="Submitted assessments" />
```

**Record section components** — individual named exports for each record detail section, shared between `RecordDetail` (user view) and `RecordsTab` (admin view):
```tsx
import {
  VitalSignsSection, MedicalHistorySection, FamilyHistorySection,
  LifestyleSection, LabResultsSection, ClinicalNotesSection,
} from '@/components/ui/record-sections'

<VitalSignsSection record={record} />
<VitalSignsSection record={record} showBMICategory={false} /> // admin view
```

### Extending the Frontend

**Add a new form step:**
1. Create `features/health-form/components/step-<name>.tsx` — use `FieldWrapper`/`FormSelectField`
2. Add the Zod schema for that step to `lib/health-form-schema.ts` (`stepSchemas` array)
3. Increment `TOTAL_STEPS` in `features/health-form/hooks/use-health-form.ts`
4. Add the step to the switch in `app/(dashboard)/health-form/page.tsx`

**Add a nav item:**
Edit the `navigation` array at the top of `app/(dashboard)/layout.tsx`.

**Add a new API domain:**
1. Create `lib/api/<domain>.ts` with a typed class
2. Export it from `lib/api/index.ts` and `lib/api.ts` (shim)

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend URL (Docker internal: `http://backend:8000`) |

API calls from the browser use the Next.js rewrite proxy (`/api/v1/*` → `http://backend:8000/v1/*`) so no CORS issues and the backend URL is never exposed to the client.
