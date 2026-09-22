# Proposal: Chatbot with RAG

The basic chatbot lacked memory and record grounding. We upgraded chat to RAG over the patient's own embeddings (pgvector) with text fallback, persisted conversation history APIs, lazy embed backfill, and a widget that loads/clears history across sessions—while enforcing cross-patient isolation.
