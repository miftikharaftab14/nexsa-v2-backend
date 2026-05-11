# Chat Socket Events Integration

Namespace: `/ws/chat`

## Connection

- Transport: `websocket` (polling is also allowed)
- Auth: pass JWT in socket handshake:
  - Header: `authorization: Bearer <token>`
  - or `auth.token: Bearer <token>`

---

## Client -> Server Events

### `send_message`

Send a new message in a contact/chat.

Payload:

```json
{
  "contactId": 123,
  "senderId": 456,
  "messageType": "TEXT",
  "content": "Hello",
  "media": []
}
```

Notes:
- `messageType` can be `TEXT | IMAGE | VIDEO | FILE | MEDIA`.
- For media messages, `media` should be provided as the existing stored-file format used in the app.

---

### `mark_read`

Mark all unread messages of a chat as read.

Payload:

```json
{
  "contactId": 123
}
```

---

### `product-chat-initiate`

Send product media + text flow in a chat.

Payload:

```json
{
  "productId": 10,
  "sellerId": 456,
  "content": "Is this available?",
  "messageType": "IMAGE"
}
```

---

### `send_broadcast`

Send broadcast message to broadcast recipients.

Payload:

```json
{
  "broadcastId": 7,
  "messageType": "TEXT",
  "content": "Special offer",
  "media": []
}
```

---

### `edit_message` (new)

Edit a previously sent message.

Payload:

```json
{
  "contactId": 123,
  "messageId": 987,
  "content": "Updated text"
}
```

Broadcast-compatible payload (when operating from broadcast context):

```json
{
  "broadcastId": 7,
  "messageId": 987,
  "content": "Updated text"
}
```

Rules:
- Only chat participants can call this event.
- Only original sender can edit the message.
- **Broadcast fanout:** when `broadcastId` is provided (or the resolved message is a broadcast message), every sibling message of the same broadcast send (one row per recipient contact, plus per uploaded media file) is updated together. A separate `message_edited` event is emitted for each affected chat so every recipient and the sender's chat views are kept in sync.

---

### `delete_message` (new)

Delete a message for current user only (hide in that user's chat view).

Payload:

```json
{
  "contactId": 123,
  "messageId": 987
}
```

Broadcast-compatible payload:

```json
{
  "broadcastId": 7,
  "messageId": 987
}
```

Rules:
- Only chat participants can call this event.
- Message stays visible for the other participant(s).
- For the deleting user, the message is now represented as a removed placeholder (`content: "This message was removed"` and `isDeletedForUser: true`) instead of being omitted from conversation payloads.
- **Broadcast fanout:** when `broadcastId` is provided, only the broadcast sender may call this event. The action marks every sibling message (one per recipient contact) as deleted-for-user so the sender's view of the broadcast message is cleared from all of their recipient chats. A separate `message_deleted` event is emitted back to the requester for each affected chat. Recipients who want to delete the message in their own chat should use the per-chat `contactId` form.

---

### `unsend_message` (new)

Unsend a message for everyone (hard delete from DB).

Payload:

```json
{
  "contactId": 123,
  "messageId": 987
}
```

Broadcast-compatible payload:

```json
{
  "broadcastId": 7,
  "messageId": 987
}
```

Rules:
- Only chat participants can call this event.
- Only original sender can unsend the message.
- Message is removed permanently from DB.
- **Broadcast fanout:** when `broadcastId` is provided (or the resolved message is a broadcast message), every sibling message of the same broadcast send is hard-deleted. A separate `message_unsent` event is emitted to the participants of each affected chat so the message disappears for all recipients.

---

## Server -> Client Events

### `receive_message`

Delivered to receiver on incoming message.

Payload shape (summary):

```json
{
  "unreadMessagesCount": 2,
  "username": "John",
  "contactId": 123,
  "phone_number": "+92xxxx",
  "profile_picture": "https://...",
  "lastMessage": "Hello",
  "lastMessageAt": "2026-05-01T17:20:00.000Z",
  "sender": {},
  "read": false,
  "message": {},
  "mediaCont": {
    "mediaUrl": null,
    "thumbnailUrl": ""
  }
}
```

---

### `send_message`

Echo/update sent to sender after sending message.

Payload shape is similar to `receive_message`.

---

### `read_ack`

Read acknowledgement to both participants.

Payload:

```json
{
  "contactId": 123,
  "readerId": 456
}
```

---

### `broadcast_sent`

Confirmation to sender after broadcast is sent.

---

### `message_edited` (new)

Broadcast to chat participants when a message is edited.

Payload:

```json
{
  "contactId": 123,
  "broadcastId": 7,
  "message": {
    "id": 987,
    "content": "Updated text",
    "isEdited": true,
    "editedAt": "2026-05-01T18:00:00.000Z"
  }
}
```

Notes:
- `broadcastId` is `null` for one-to-one messages.
- For broadcast edits the server emits this event **once per recipient chat** (each with that chat's `contactId` and the sibling `message`). Clients should treat each event independently when updating chat views.

Message entity now includes:
- `isEdited: boolean`
- `editedAt: string | null`

This is available in normal message payloads as well (chat list/conversation/socket message object).

Delete visibility behavior:
- `delete_message` stores a user-message delete record.
- Conversation payload for that user keeps the message position but marks it as removed (`isDeletedForUser: true` and placeholder content).
- Other users still receive the message normally.
- `unsend_message` removes the message row from DB, so nobody sees it anymore.

---

### `message_deleted` (new)

Sent back to requester when message is deleted for that user only.

Payload:

```json
{
  "contactId": 123,
  "broadcastId": 7,
  "messageId": 987,
  "userId": 456
}
```

Notes:
- `broadcastId` is `null` for one-to-one messages.
- For broadcast deletes the server emits this event **once per recipient chat** to the requester (each with that chat's `contactId` and the sibling `messageId`).

---

### `message_unsent` (new)

Broadcast to chat participants when a message is unsent (hard deleted).

Payload:

```json
{
  "contactId": 123,
  "broadcastId": 7,
  "messageId": 987
}
```

Notes:
- `broadcastId` is `null` for one-to-one messages.
- For broadcast unsends the server emits this event **once per recipient chat** to the participants of that chat (each with that chat's `contactId` and the sibling `messageId`).

---

### Error events

- `error_message`
- `product-chat-initiate_error`

Typical payload:

```json
{
  "message": "Error details"
}
```
