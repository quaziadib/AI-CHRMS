## Context

See proposal.md for the motivation and scope. The national page already has cascading geography controls, anonymized district summaries, a prevalence chart, and a national LLM forecast job. Its current choropleth component is a stylized tile diagram and is not used by the page. Patient records contain district but not upazilla/thana or urban/rural classification; the aggregate service suppresses district cells below the configured minimum. No validated population-denominator dataset is present.

## Goals / Non-Goals

**Goals:**
- Add a locally served division/district boundary map and keep its selected division consistent with the existing filters and forecast explorer.
- Reuse suppression-aware aggregates and retain an accessible table equivalent to map interaction.
- Extend forecasting by division without changing the existing district forecast used by resource estimates.
- Make observed record-cohort values, model-generated future values, unsupported stratifications, and missing years distinguishable in the response and UI.

**Non-Goals:**
- Add a live map tile service or a map library dependency.
- Treat health-form submissions as a representative population sample.
- Infer historic prevalence, population denominators, or urban/rural splits from LLM output.
- Change existing national risk-group cards or patient/doctor experiences.

## Decisions

### 1. Bundle sourced ADM1/ADM2 geometry locally

- **Choice:** Extract the division and district geometry represented in the supplied HTML into a versioned local static asset. Keep source name, release/version, and license metadata with the asset and show attribution in the map.
- **Why:** The national page can render without a third-party runtime or network dependency, and the map retains its source provenance.
- **Alternative:** Recreate the geometry as hand-drawn rectangles or fetch remote tiles at runtime; both lose the reference's map interaction or add availability/dependency risk.

### 2. Serve map metrics from an aggregate API contract

- **Choice:** Add a national map summary response keyed by stable division/district IDs, combining local geometry keys with allowlisted aggregate fields. Return scope, metric basis, generated time, and suppression threshold. Use district high-risk share among submitted records; derive division summaries only from unsuppressed aggregates or a direct division-level aggregate that enforces the same threshold.
- **Why:** The current district summary is name-keyed and lacks map-ready IDs. Explicit provenance prevents submission-cohort rates from being presented as adult-population prevalence.
- **Alternative:** Put health metrics in the static geometry file or calculate privacy-sensitive aggregation in the browser; both make data refresh or suppression harder to reason about.

### 3. Keep map navigation in shared dashboard state

- **Choice:** Keep the selected division in the existing national dashboard hook. A map feature or ranking row selection drills into that division, updates the breadcrumb and forecast selector, and synchronizes the existing division filter. The table remains available as an accessible alternative to map-only actions.
- **Why:** Multiple independent selection states would make map, filters, and forecast disagree.
- **Alternative:** Keep separate map and forecast selections; rejected because the HTML interaction already synchronizes them and users expect a single scope.

### 4. Add scoped forecast jobs without changing resource forecasts

- **Choice:** Add division and all-division forecast scopes to the national epidemic forecast flow. Store scope and result metadata in the existing forecast-job result JSON, and read the latest job by scope. Keep `/forecasts` and its district statistical engine unchanged for resource planning.
- **Why:** Reuses the existing async job lifecycle and keeps the LLM epidemic projection distinct from the district forecast contract.
- **Alternative:** Reuse one unscoped latest job for every division; rejected because selecting a division could display another scope's result.

### 5. Separate observations from future scenario estimates

- **Choice:** Build observed annual values from anonymized records only where the data supports them, label them as submitted-record high-risk shares, and have the configured LLM generate future scenario points from those aggregates. Mark each point's source/kind and horizon. Use the reference's 2022–2035 display range only where source data exists; leave missing historical years blank. Return an unavailable state for urban/rural splits until a validated stratified aggregate is available.
- **Why:** The current schema has neither population denominators nor urban/rural labels, and the supplied HTML's hardcoded values cannot serve as production observations.
- **Alternative:** Ask the LLM to fill all years and cohorts; rejected because it would present invented history and unsupported population claims as data.

### 6. Use one forecast payload for chart and table views

- **Choice:** The frontend renders both views from the same scoped response, with selected division(s), period, metric basis, projection boundary, and unavailable values carried as data rather than chart-only behavior.
- **Why:** Prevents the table from disagreeing with the plotted series and gives small screens and assistive technology an equivalent presentation.
- **Alternative:** Maintain separate chart and table datasets; rejected because they can drift.

## Risks / Trade-offs

- [Boundary release or district names do not match project geography IDs] → Keep a reviewed alias map and show unmatched areas as unavailable rather than guessing.
- [Sparse records make map regions blank] → Preserve minimum-cell suppression and explain unavailable values in the legend/table.
- [LLM output is mistaken for an official forecast] → Label it as an illustrative scenario from submitted-record aggregates, store provenance, and never call it adult prevalence without a validated denominator.
- [No urban/rural input exists] → Show that split as unavailable until a source-backed classification and aggregate are added.
- [Map asset license requires attribution] → Verify and bundle the source/license metadata from the supplied HTML before packaging geometry.

## Migration Plan

1. Add the map summary contract and scoped forecast response while leaving current endpoints available.
2. Bundle the attributed boundary asset and ship the new map and forecast views behind the existing national analytics/forecast flags.
3. Confirm empty, suppressed, and unsupported-stratification states, then enable the sections for national admins.
4. Roll back by hiding the new sections and returning to the existing matrix/national forecast panels; retain existing district forecast data and jobs.

## Open Questions

None that block this scope. If a validated national population or urban/rural dataset is supplied later, it can extend the metric basis without changing the map interaction contract.
