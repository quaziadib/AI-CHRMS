# Chatbot Specification

## Purpose
Provide an authenticated patient chatbot that answers diabetes questions using the patient's own record history via RAG (with text fallback), and persists conversation history across sessions.

## Requirements

### Requirement: Patient-Only Chat Endpoint
The system SHALL expose `POST /v1/chat` for authenticated patients to send a message (1–500 characters) and receive a plain-language reply, and SHALL reject unauthenticated or invalid messages.

#### Scenario: Successful reply
- **WHEN** a patient sends a valid message while chatbot capability is enabled
- **THEN** the API SHALL return a reply string and persist both the user and assistant messages

#### Scenario: Auth or validation failure
- **WHEN** the caller is unauthenticated or the message is empty/too long
- **THEN** the API SHALL return 401 or 422 respectively

### Requirement: RAG Over Own Records
Chat replies SHALL be grounded in retrieved chunks from the authenticated patient's own records (vitals, risk explanation, recommendations, EHR summary) and MUST NOT retrieve another patient's content.

#### Scenario: Retrieval uses own history
- **WHEN** embeddings exist for the patient's records
- **THEN** the reply generation SHALL inject top-k retrieved chunks belonging only to that patient

#### Scenario: Cross-patient isolation
- **WHEN** vector search runs for a chat request
- **THEN** retrieval queries SHALL be filtered by the authenticated patient's record ownership at the data layer

### Requirement: Text Fallback When Vectors Unavailable
When embeddings are missing or the embedding provider is unavailable, the system SHALL fall back to injecting the latest record as plain text context so chat still has patient-specific grounding.

#### Scenario: Missing embeddings
- **WHEN** a patient chats and no usable embeddings are available
- **THEN** the system SHALL answer using text context from the latest record rather than failing solely for missing vectors

### Requirement: Conversation History Persistence
The system SHALL persist conversation messages per user, expose `GET /v1/chat/history` and `DELETE /v1/chat/history`, and SHALL load recent history into the chat context (bounded window) and into the patient chat widget on open.

#### Scenario: History survives reload
- **WHEN** a patient reopens the chat widget after prior messages
- **THEN** prior messages SHALL load from the history API

#### Scenario: Clear history
- **WHEN** the patient clears history
- **THEN** stored messages for that user SHALL be deleted and the widget SHALL show an empty thread

### Requirement: Feature Flag and Failure Modes
When RAG/chat is disabled via feature flag, chat endpoints MUST return 503. LLM or embedding pipeline failures SHALL surface as 502 without exposing patient PII in application logs.

#### Scenario: Feature disabled
- **WHEN** the chatbot/RAG feature flag is false
- **THEN** chat endpoints SHALL respond with 503

#### Scenario: Chain failure
- **WHEN** the RAG chat chain fails
- **THEN** the API SHALL return 502 and SHALL NOT log raw patient clinical content beyond necessary identifiers
