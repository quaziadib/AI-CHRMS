# Proposal: LLM Risk Scoring

Patients needed an immediate diabetes risk signal after the 8-step health form. We added a provider-agnostic LLM risk assessment (level, explanation, brief tips) via `POST /v1/records/{id}/risk-score`, persisted on the record and shown inline after submit plus on the patient dashboard widget.
