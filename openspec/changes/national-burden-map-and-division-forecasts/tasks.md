## 1. Aggregate APIs and Forecast Jobs

- [x] 1.1 Inspect the supplied HTML's boundary data, identify its source, release, and license, and bundle division/district geometry with attribution metadata and stable geography IDs. Verify all geometry IDs map to the project's geography records or are explicitly marked unmatched.
- [x] 1.2 Add a national map-summary API keyed by stable division and district IDs. Return allowlisted anonymized metrics, metric basis, generation time, and suppression threshold; derive division summaries from privacy-safe aggregates. Verify suppressed, unknown, and empty regions never expose exact small-cell counts or inferred rates.
- [x] 1.3 Add division and all-division scopes to the existing national epidemic forecast job flow, storing scope and provenance in the result and retrieving the latest job by scope. Keep the existing district resource forecast contract unchanged. Verify role and feature-flag behavior matches the current national forecast flow.
- [x] 1.4 Build forecast observations only from available anonymized annual aggregates, and request future scenario projections through 2035 only when the division has a sufficient baseline. Include per-point observed/projected source metadata and report urban/rural as unavailable unless validated stratified inputs exist. Verify missing years and insufficient baselines remain unavailable rather than model-filled.

## 2. National Dashboard Map

- [x] 2.1 Replace the unused stylized map presentation with a locally rendered division and district boundary map using the bundled geometry and map-summary API. Add hover, focus, and touch tooltips with metric provenance, suppression, and unavailable states. Verify visible boundary attribution and an accessible responsive district legend inside the map after a division is selected; omit districts without stored records.
- [x] 2.2 Keep map selection synchronized with existing geography filters and the forecast explorer. Implement division drill-down, district view, breadcrumb, and return-to-national action. Verify selecting a division on the map updates dependent controls.

## 3. Division Forecast Explorer

- [x] 3.1 Add one-division and all-division forecast selection plus chart/table views backed by the same scoped API response. Display the annual range through 2035, observed-versus-projected labels, source basis, projection boundary, and forecast summary metrics. Verify both presentations contain identical scopes, periods, values, and unavailable states.
- [x] 3.2 Connect forecast requests to scoped async job polling and handle loading, disabled, forbidden, unavailable, and failed states. Display urban/rural series only when validated stratified data is available; otherwise explain the unavailable split. Verify switching from map selection requests or displays the matching division scope.

## 4. Integration Review

- [x] 4.1 Review the completed API and UI flows against national-admin access, feature flags, privacy suppression, boundary attribution, and observed-versus-projected provenance requirements. Resolve any mismatch before enabling the new sections for national admins.
- [x] 4.2 Document the bundled boundary source/license and the meaning and limitations of submitted-record metrics and generated projections near the relevant dashboard views. Verify the dashboard does not label submitted-record rates as population prevalence or show unsupported sample sizes.
