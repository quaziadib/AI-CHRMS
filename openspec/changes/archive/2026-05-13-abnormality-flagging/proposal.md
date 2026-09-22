# Proposal: Abnormality Flagging

Clinicians needed immediate triage signals for out-of-range vitals without LLM cost. We added rule-based flagging (ADA/WHO thresholds) recomputed on every record save, stored as structured JSONB flags, and surfaced on doctor EHR and patient record views by severity.
