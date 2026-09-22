# Proposal: Chatbot (Basic)

Patients needed quick diabetes Q&A without leaving the dashboard. We shipped a feature-flagged FAQ-style patient chatbot (`POST /v1/chat`) with latest-record context in the prompt and a floating patient-only widget with client-side message history (later superseded by RAG persistence).
