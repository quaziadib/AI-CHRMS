# Proposal: EHR Summarization

Doctors needed a fast clinical briefing of dense EHR fields. We added an on-demand, feature-flagged LLM summary for assigned doctors (`POST /v1/doctor/patients/{id}/summarize`), stored with timestamp on the record, regenerable from the read-only EHR UI, and audited on success.
