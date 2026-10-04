## Context

See proposal.md for motivation. Current state: `frontend/app/(auth)/register/page.tsx` (350 lines) holds schema, handlers and all JSX in one `max-w-md` `Card`. Role uses `Select`; doctor fields sit in a `<fieldset>` in the same column. `@radix-ui/react-radio-group` is already in `package.json` but `components/ui/radio-group.tsx` does not exist. `components/ui/form-field.tsx` has `FieldWrapper` (label + error, no `aria-describedby`). The auth `layout.tsx` only adds a fade-in. No frontend test runner exists; checks are `npm run lint`, `tsc`, `next build`, and manual/browser.

## Goals / Non-Goals

**Goals:** better hierarchy and shorter form via role-first selection, grid and grouping; accessible errors; zero change to submitted data and validation.

**Non-Goals:** backend/API changes; wizard; changing which roles are public; split-screen brand panel (deferred); extracting a shared auth-form framework.

## Decisions

1. **Role cards via shadcn `RadioGroup` (Radix, already installed), not custom buttons or `Select`.** Gives roving tabindex, arrow keys and `radiogroup` semantics for free. Add `components/ui/radio-group.tsx` in the repo's shadcn style. Alternative: keep `Select` with better copy, rejected because it still hides the key choice.
2. **Patient is a primary card; three elevated roles are a secondary group** under "Request a professional role" with an "Approval required" text badge. Alternative: four equal cards, rejected, since it implies equal weight and makes the common path slower.
3. **Layout: one centered card, width driven by role** (`max-w-xl` patient, `max-w-3xl` doctor) with `grid-cols-1 md:grid-cols-2` for paired fields. Alternative: split-screen brand panel, deferred (assumption in proposal); form content is independent of the shell so it can be added later.
4. **Split the file by responsibility under `frontend/features/auth/`:** `role-selector.tsx`, `doctor-details-section.tsx`, `id-pic-dropzone.tsx`; `page.tsx` keeps schema, `useForm`, submit. Matches the repo's feature-module convention. Schema and `onSubmit` payload mapping stay byte-for-byte equivalent in behavior.
5. **a11y helper:** extend `FieldWrapper` to accept an `id` and wire `aria-describedby` / error `id` through a render-prop or cloned child, rather than hand-writing ids per field. Errors get `role="alert"` only on submit-failure focus, not on every keystroke.
6. **Password fields:** keep two fields (Password | Confirm side by side) with existing show/hide toggles; extract a small `PasswordInput` to remove the duplicated JSX.
7. **Doctor section motion:** CSS grid-rows/opacity transition via existing `tailwindcss-animate` classes, respecting `prefers-reduced-motion`. No new dependency.
8. **Dropzone:** a styled `<label>` over the native file input (keeps native picker, keyboard and screen-reader behavior); drag-and-drop is optional polish. Retain the FileReader base64 + 1 MB + `image/*` checks.

## Risks / Trade-offs

- Width change on role switch causes layout shift → animate `max-width`, keep submit button below content; check no jump on mobile (single column, no width change).
- Hidden doctor values may linger in form state after switching roles → ensure submit already gates on `role === 'doctor'` (it does) and clear `id_pic` on switch; verify in browser.
- Radix RadioGroup inside `react-hook-form` needs `setValue`/`Controller`, not `register` → use `setValue` with `shouldValidate` as the current `Select` does.
- ID picture stays base64 in JSON, a known PII/production concern → out of scope; note presigned upload + scanning as follow-up.
- Admin/national_admin remain publicly requestable → left as is; flagged as open question.

## Migration Plan

Frontend-only; deploys with the normal frontend build. Rollback: revert the commit. No data or API migration.

## Open Questions

- Should `admin` / `national_admin` be removed from public signup in favour of invites? Needs product and backend input; does not affect this UI structure (one more or fewer card).
