## Context

See proposal.md for motivation and specs for user-visible behavior. The current chatbot persists `ConversationMessage` rows by patient with `user`/`assistant` roles and exposes patient-only history and deletion. The profile-sharing work in this workspace adds active patient-doctor grants and append-only clinical interaction notes. Neither model represents a recipient, per-participant read state, or a doctor inbox, so the chatbot history must not be reused for clinician messaging.

## Goals / Non-Goals

**Goals:**
- Reuse the active patient-doctor grant as the authorization boundary for doctor access and message sending.
- Preserve a patient's ability to read their own prior messages after revocation while immediately removing doctor access.
- Keep conversation content separate from AI chat and clinical notes, with message activity audit metadata only.
- Deliver an inbox that refreshes while open without adding a push or WebSocket service.

**Non-Goals:**
- Persisting drafts, attachments, group chat, message editing/deletion, or external notifications.
- Making conversations available to admins as participants or exposing message bodies in admin access history.

## Decisions

1. **Use dedicated patient-doctor conversation and message records.** Store one conversation per patient-doctor pair and individual messages with sender, body, timestamp, and the active grant in effect when sent. Keep per-participant read cursors on the conversation. This preserves prior history across revocation and later regrant. Do not extend `ConversationMessage`: its user/assistant schema and delete-history API are specific to the AI chatbot. An alternative would be a shared polymorphic chat table, but it couples distinct authorization and retention policies.

2. **Enforce access in the API for every operation.** Patient routes may list and read their own history even when access is revoked, but a patient may send only when an active grant exists. Doctor list, read, send, and read-cursor operations must resolve the conversation's patient-doctor pair and require an active grant on every request. Lock or otherwise serialize grant state with message creation so revocation cannot race with a doctor send. UI state is not an authorization boundary.

3. **Use authenticated REST endpoints and periodic inbox refresh.** Add inbox, conversation history, send, and read-cursor endpoints under a patient-doctor messaging route. Refresh open inbox data every 15 seconds, satisfying the 30-second behavior in the spec without a new broker or WebSocket service. Show unread counts from messages after each participant's read cursor. WebSockets and push were considered but add connection and deployment complexity not needed for this in-app MVP.

4. **Audit activity without copying content.** Reuse patient-doctor access events for message-sent and conversation-read transitions, associating each event with patient, doctor, actor, event type, and timestamp. A message stores the active grant ID under which it was sent. Emit a conversation-read event when an active participant advances their cursor over unread messages, not on every poll. Keep message bodies out of audit records and admin access-history responses.

5. **Add role-aware inbox routes and navigation.** Provide one messaging inbox route for authenticated patient and doctor roles, with the API deriving whether the user is the patient or doctor participant. Keep the chatbot widget and profile clinical-interaction history as separate entry points. Existing role guards protect routes, and API participant checks protect data.

## Risks / Trade-offs

- [Polling creates periodic requests while an inbox is open] → Poll at a modest fixed interval, stop while the page is hidden, and refresh immediately after sending or opening a thread.
- [Revoked grants can leave a doctor with stale content already rendered in an open tab] → Revalidate authorization on every poll and message action; clear doctor-side thread content on an authorization failure.
- [Read auditing can create noisy records] → Record only read-cursor advances that mark one or more messages read, and keep message bodies out of the audit path.
- [A single conversation per patient-doctor pair shows prior history after a later regrant] → Require a new accepted active grant before the doctor can resume and document this lifecycle in the specs.

## Migration Plan

Add conversation and message tables through the existing additive SQLAlchemy model initialization path. Import the new models before `Base.metadata.create_all`; no existing AI-chat or clinical-interaction rows need conversion. Deploy the API and UI together. Rollback can remove the inbox routes and UI while leaving the additive message tables and their history intact; do not cascade-delete messages during grant revocation.
