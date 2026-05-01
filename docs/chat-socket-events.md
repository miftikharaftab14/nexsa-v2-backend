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

Rules:
- Only chat participants can call this event.
- Only original sender can edit the message.

---

### `delete_message` (new)

Delete/unsend a message (soft delete on backend).

Payload:

```json
{
  "contactId": 123,
  "messageId": 987
}
```

Rules:
- Only chat participants can call this event.
- Only original sender can delete the message.

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
  "message": {
    "id": 987,
    "content": "Updated text",
    "isEdited": true,
    "editedAt": "2026-05-01T18:00:00.000Z"
  }
}
```

Message entity now includes:
- `isEdited: boolean`
- `editedAt: string | null`

This is available in normal message payloads as well (chat list/conversation/socket message object).

---

### `message_deleted` (new)

Broadcast to chat participants when a message is deleted.

Payload:

```json
{
  "contactId": 123,
  "messageId": 987
}
```

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
