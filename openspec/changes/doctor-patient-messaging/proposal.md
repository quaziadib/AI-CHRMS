## Why

The patient profile currently exposes doctor-authored interactions as one-way clinical notes, while the existing chat is with an AI assistant. Patients and their doctors need a clear, private way to communicate and receive replies inside the app, with access controlled by the patient's consent.

## What Changes

- Add a separate in-app inbox for patient-doctor conversations, distinct from clinical interaction notes and the AI chatbot.
- Allow a patient and a doctor to exchange persistent messages only while the patient-doctor grant is active.
- Give both sides conversation history and unread indicators; a new patient message appears in the doctor's inbox and a doctor reply appears in the patient's inbox.
- Add role-appropriate inbox navigation for patients and doctors.
- Stop doctor access and messaging after the patient revokes access; retain the patient's conversation history and log message activity metadata for administrators without exposing message contents.

## Capabilities

### New Capabilities
- `doctor-patient-messaging`: Consent-gated, persistent in-app patient-doctor conversations and unread state.

### Modified Capabilities
- `role-navigation`: Add the messaging inbox to patient and doctor navigation while keeping role-specific routes protected.

## Impact

Expected changes to FastAPI conversation models and endpoints, PostgreSQL persistence, patient and doctor inbox views, role navigation, and authorization checks that reuse active patient-doctor grants. Delivery is in-app and asynchronous; this proposal does not require WebSockets, push notifications, or external messaging services.

## Non-goals

- Replacing or deleting append-only clinical interaction notes.
- Replacing the patient-to-AI chatbot.
- Attachments, group conversations, appointment scheduling, SMS/email delivery, or live WebSocket/push delivery.
- Enabling messaging before a doctor accepts the patient's access grant or after the patient revokes it.
