## 1. Backend Data and Authorization

- [x] 1.1 Add patient-doctor conversation and message models with pair uniqueness, sender, body, timestamps, read cursors, and the grant used to send each message; verify model metadata includes additive tables and indexes.
- [x] 1.2 Register the new models through the existing database initialization path and verify application startup creates tables without altering chatbot messages or clinical interaction history.
- [x] 1.3 Implement conversation listing, message history, sending, and read-cursor services; verify patient ownership and doctor participant plus active-grant checks are enforced for every operation.
- [x] 1.4 Add authenticated messaging API schemas and routes for patient and doctor inboxes, text send, history, and mark-read; verify invalid lengths, non-participants, pending grants, revoked doctor access, and unauthorized roles are rejected without exposing conversation data.
- [x] 1.5 Record message-sent and read-cursor audit events without message bodies; verify administrator access history shows actor, patient, doctor, event, and timestamp but no content.
- [x] 1.6 Cover active-grant send/read, patient history after revocation, doctor denial after revocation, and conversation resumption after a new accepted grant in backend tests.

## 2. Patient and Doctor Inbox

- [x] 2.1 Add messaging API client types and hooks for inbox, message history, sending, and read state; verify responses map to the patient-doctor API contract.
- [x] 2.2 Build the shared in-app inbox and one-to-one conversation view with chronological messages, unread indicators, loading/error/empty states, and a 4,000-character text composer; verify valid messages send and invalid content is blocked.
- [x] 2.3 Refresh an open inbox every 15 seconds, pause polling while the browser tab is hidden, and refresh immediately after send/open; verify new messages and unread counts appear within the specified 30-second window without reloading.
- [x] 2.4 Show revoked conversations to patients as read-only history and clear a doctor's active conversation when access polling returns unauthorized; verify neither participant can send after revocation.
- [x] 2.5 Add a Messages navigation destination for patients and doctors, protect its route by role, and keep chatbot and clinical interaction UI separate; verify other roles are redirected and existing patient/doctor navigation remains available.

## 3. Integration Validation

- [x] 3.1 Run backend tests for message persistence, authorization, audit metadata, and consent lifecycle; verify existing chatbot history and clinical interaction tests remain unchanged.
- [x] 3.2 Run frontend lint and type checking on changed messaging/navigation files; verify there are no new diagnostics.
- [ ] 3.3 Walk through patient grant, doctor acceptance, patient message, doctor reply, unread/read state, revocation, and regrant in the app; verify both inboxes and administrator audit metadata follow the specs.
