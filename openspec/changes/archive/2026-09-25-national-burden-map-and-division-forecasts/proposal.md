## Why

The national dashboard already has anonymized district summaries and a national urban/rural forecast, but it lacks the HTML reference's interactive division-to-district map and division-scoped forecast explorer. These additions serve national policy users who need to move from a country view to a region and compare its projected trend with other divisions.

## What Changes

- Add an interactive Bangladesh map with division overview, click-to-drill district boundaries, breadcrumb/back navigation, and tooltips. Show a responsive district legend inside the map after a division is selected, listing only districts represented by stored records.
- Connect map selection to the existing geographic filter and division forecast selection.
- Add a division forecast section with single-division and all-division comparison, chart/table views, and forecast summary metrics. Show urban/rural series only when validated stratified inputs are available; otherwise explain that the split is unavailable.
- Use locally served boundary geometry with source attribution, existing anonymized record aggregates for observed dashboard metrics, and the configured LLM for future projections.
- Distinguish observed data from projections and show gaps where historical inputs are unavailable. Do not present synthetic values as official prevalence or population counts.

## Non-goals

- Replacing the existing predictor, risk matrix, division prevalence chart, demographic chart, or national risk-group cards.
- Copying the reference's unsupported sample-size, population, prevalence, or telemetry claims.
- Adding patient-level map data, new PII fields, satellite telemetry, or full upazilla/thana polygons.
- Using XGBoost, ARIMA, or ARIMAX for the division forecast.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `national-analytics`: Add interactive ADM1/ADM2 map drill-down and a suppression-aware in-map legend over anonymized district aggregates.
- `population-forecasting`: Add division-scoped and all-division forecast views with observed-versus-projected series and table access.

## Impact

- Frontend: `/national`, national map and forecast components, API client types, and dashboard state.
- Backend: national aggregate and forecast APIs, response schemas, LLM forecast generation, and async job results.
- Data: static division/district geometry and its attribution; no database migration expected unless forecast job scope requires it.
- Validation: map and API privacy/suppression behavior, division selection synchronization, forecast provenance, and empty-data states.
