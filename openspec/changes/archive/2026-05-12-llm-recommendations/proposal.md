# Proposal: LLM Recommendations

Brief risk-chain tips were too thin for actionable guidance. We added a dedicated, feature-flagged recommendations chain producing categorized diet/exercise/lifestyle/monitoring advice via `POST /v1/records/{id}/recommendations`, stored on the record, shown in patient/admin UIs, and audited on success—without blocking risk scoring on failure.
