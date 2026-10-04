## Context

- PDF: `generate_prescription_pdf` renders Jinja HTML via WeasyPrint (imported lazily). `backend/Dockerfile` installs pango/cairo/gdk-pixbuf/fonts; `deploy/render/Dockerfile` (used by `render.yaml`, runtime docker) installs only gcc/libpq/curl/node, so the import/render fails -> unhandled 500. Endpoint: `GET /v1/prescriptions/{id}/pdf` in `api/v1/prescriptions.py`.
- Sections to remove live in `doctor/patients/[id]/page.tsx` (Medication history, Doctor interactions + add form + related state/handler) and `features/sharing/components/patient-sharing-panel.tsx` (Doctor interactions).
- Doctor prescription flows exist as separate routes under `doctor/prescriptions/[patientId]/...` with components in `features/prescriptions/`.

## Goals / Non-Goals

**Goals:** PDF works on Render; clean UI removals; side-panel prescription UX on patient profile; clearer `/doctor/prescriptions`.

**Non-Goals:** backend data/endpoint removal; new data model; PDF redesign.

## Decisions

1. **PDF fix = add apt packages to Render image** (`libpango-1.0-0 libpangoft2-1.0-0 libcairo2 libgdk-pixbuf-2.0-0 libffi-dev fonts-dejavu-core`, bookworm names match local Dockerfile). Alternative: swap to a pure-Python renderer (xhtml2pdf/reportlab) — rejected: loses CSS fidelity, rewrites template.
2. **Graceful failure**: wrap render in try/except, `logger.exception` with prescription id, raise HTTPException 503. Frontend PDF download surfaces `detail` via toast (api client already returns `{error}`). Verify by reading real logs first; do not assume import error is the only cause (template/data error possible).
3. **Section removal is UI-only**: delete JSX, unused state, `saveInteraction`, unused imports/types usage in the two files. Keep API client functions and backend routes (append-only, audit-safe). Dead client code flagged but left.
4. **Side panel**: client component `PrescriptionPanel` on patient profile page. Layout: CSS grid on the page wrapper, `lg:grid-cols-[minmax(0,1fr)_minmax(420px,40%)]` when open, single column when closed; panel is `sticky top-4` with own scroll (not a modal/overlay), below `lg` it stacks/full-width. Panel modes: `view` (latest prescription via existing doctor list/detail API, reusing `prescription-sections.tsx`) and `compose` (reuse `doctor-compose-form.tsx`, extracted to accept `patientId`, `onSaved`, `onCancel` and render without page chrome). Button visibility from a lightweight fetch of the patient's prescriptions (SWR hook in `usePrescriptions.ts`); revalidate on save.
5. **Doctor prescriptions UX**: applied with frontend-design skill during apply — search + status filter on patient/prescription list, card/row hierarchy, sticky primary "New prescription" action, skeleton/empty/error states; reuse shadcn/ui, no new deps. Keep routes working (deep links still valid).

## Risks / Trade-offs

- Image size/build time grows ~50-80 MB; acceptable on Render.
- Root cause unconfirmed until Render logs/container repro; task 1.1 gates the fix.
- Refactoring compose form into panel risks regressions in existing compose/edit routes; keep props backward compatible and test both entry points.
- Unsaved-edit loss on panel close; mitigate with confirm.
