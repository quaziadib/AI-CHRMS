# Doctor Patient Messaging Specification

## Purpose

Provide a persistent, private in-app conversation between a patient and a doctor that is available only while the patient has granted that doctor active profile access.

## Requirements

### Requirement: Consent-Gated Patient-Doctor Conversations
The system SHALL allow a patient and a named doctor to exchange messages only while that patient-doctor access grant is active. Patients SHALL retain read access to their own conversation history after revocation, but SHALL NOT send until a new grant is active. Doctors SHALL access a conversation only while the patient-doctor grant is active. Patient and doctor roles SHALL only access conversations in which they are a participant.

#### Scenario: Patient opens a conversation with an active doctor
- **WHEN** a patient opens messaging for a doctor with an active grant
- **THEN** the system SHALL show the patient-doctor conversation and allow the patient to send a message

#### Scenario: Doctor receives a message from an active patient
- **WHEN** a doctor opens the inbox for a patient who has an active grant to that doctor
- **THEN** the system SHALL show that conversation and its messages

#### Scenario: Pending or declined grant cannot be used for messaging
- **WHEN** a doctor attempts to read or send messages, or either participant attempts to send, while the latest grant is pending or declined
- **THEN** the system SHALL deny the operation without returning patient profile data, while allowing the patient to retain read access to their own prior conversation history

#### Scenario: Another doctor attempts to access the conversation
- **WHEN** a doctor who is not the grant recipient requests the conversation or its messages
- **THEN** the system SHALL deny access without exposing whether a conversation exists

### Requirement: Persistent Text Messages
The system SHALL accept non-empty plain-text messages of at most 4,000 characters from either participant, persist each message with its sender and timestamp, and return messages in chronological order. The system SHALL reject empty, oversized, or unsupported attachment content.

#### Scenario: Participant sends a valid message
- **WHEN** an authorized participant sends a message containing 1 to 4,000 text characters
- **THEN** the system SHALL persist it and make it available in the conversation to the other participant

#### Scenario: Participant sends invalid content
- **WHEN** a participant sends an empty message, a message longer than 4,000 characters, or an attachment
- **THEN** the system SHALL reject the message and SHALL NOT persist it

### Requirement: Patient and Doctor Inboxes
The system SHALL provide separate role-appropriate inbox destinations for patients and doctors. The inbox SHALL list only conversations the signed-in user is authorized to access and SHALL show an unread count for messages received from the other participant. While the inbox is open, the system SHALL refresh messages and unread state at least once every 30 seconds without requiring a page reload.

#### Scenario: Patient sees doctor conversations
- **WHEN** a patient opens the messaging inbox
- **THEN** the system SHALL list conversations for doctors with whom the patient has an active grant and show unread counts, and SHALL show prior conversations for revoked grants as read-only history

#### Scenario: Doctor sees patient conversations
- **WHEN** a doctor opens the messaging inbox
- **THEN** the system SHALL list conversations for patients who have an active grant to that doctor and show unread counts

#### Scenario: Participant reads a conversation
- **WHEN** a participant opens a conversation containing unread messages
- **THEN** the system SHALL mark those received messages as read and update the unread count

#### Scenario: New message arrives while inbox is open
- **WHEN** the other participant sends a message while an authorized user has the inbox open
- **THEN** the inbox SHALL show the new message and updated unread state within 30 seconds

### Requirement: Messaging Stops When Consent Ends
The system SHALL immediately deny a doctor's conversation read and send requests after the patient revokes the grant. A patient SHALL retain access to their own conversation history after revocation. If the patient later grants access to the same doctor and that doctor accepts, the existing conversation history MAY be resumed under the new active grant.

#### Scenario: Patient revokes access during an ongoing conversation
- **WHEN** a patient revokes the doctor's active grant
- **THEN** subsequent doctor requests to list, read, or send messages in that conversation SHALL be denied

#### Scenario: Patient retains conversation history after revocation
- **WHEN** a patient opens messaging after revoking a doctor's grant
- **THEN** the patient SHALL still be able to read the conversation history and SHALL NOT be able to send messages to that doctor unless a new grant is active

#### Scenario: New active grant restores conversation access
- **WHEN** the patient creates a new grant for the same doctor and the doctor accepts it
- **THEN** both participants SHALL be able to resume the existing conversation

### Requirement: Doctor Messaging Is Separate From Clinical Notes and AI Chat
The system SHALL keep patient-doctor messages distinct from append-only clinical interaction notes and from patient-to-AI chatbot messages. Reading or sending a doctor message SHALL NOT create, edit, or delete a clinical interaction note or AI chatbot message.

#### Scenario: Doctor and patient exchange messages
- **WHEN** either participant sends or reads a doctor message
- **THEN** the system SHALL store and present it only in the patient-doctor conversation

#### Scenario: Patient uses the AI chatbot
- **WHEN** a patient sends a message to the AI chatbot
- **THEN** the system SHALL keep it in the patient's chatbot history and SHALL NOT show it in a doctor conversation

### Requirement: Message Activity Audit
The system SHALL record message-sent and conversation-read activity with patient, doctor, actor, event, and timestamp for administrator oversight. Audit records SHALL NOT contain message bodies. Administrator audit access SHALL NOT grant administrators access to message content through doctor or patient conversation APIs.

#### Scenario: Administrator reviews message activity
- **WHEN** an administrator reviews patient-doctor access activity
- **THEN** the administrator SHALL see message-sent and conversation-read metadata without message content

#### Scenario: Administrator requests conversation content
- **WHEN** an administrator requests a patient-doctor conversation through participant messaging APIs
- **THEN** the system SHALL deny the request unless the administrator is also a participant with an active patient-doctor grant
