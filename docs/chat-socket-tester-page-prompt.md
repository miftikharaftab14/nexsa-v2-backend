# Prompt: Build Chat Socket Tester Page (Next.js)

Use this prompt in your `Nexsa-Sockets` project to generate a new page that can test all chat socket events from backend namespace `/ws/chat`.

---

## Paste This Prompt

You are working in a Next.js app that already has:
- `src/components/EventFeed.tsx`
- `src/components/ConnectionPanel.tsx`
- `src/socket/socket.ts`

Create a new page named `src/app/chat-sockets/page.tsx` (or `src/pages/chat-sockets.tsx` if Pages Router) to test **all chat-related socket events** for backend namespace `/ws/chat`.

### Requirements

1. Use `socket.io-client` and connect to namespace:
   - `${NEXT_PUBLIC_SOCKET_URL}/ws/chat`
   - Support auth via:
     - `extraHeaders.authorization = "Bearer <token>"` (if possible in runtime)
     - and `auth.token = "Bearer <token>"` fallback

2. Build a UI with:
   - JWT token input
   - Contact ID input
   - Sender ID input (optional helper input)
   - Message ID input
   - Broadcast ID input
   - Product ID input
   - Seller ID input
   - Content textarea
   - Message type select (`TEXT | IMAGE | VIDEO | FILE | MEDIA`)
   - Media JSON textarea (for now plain JSON array)
   - Connect / Disconnect controls
   - Clear logs button

3. Add emit buttons/forms for client events:
   - `send_message`
     payload:
     ```json
     {
       "contactId": 123,
       "senderId": 456,
       "messageType": "TEXT",
       "content": "Hello",
       "media": []
     }
     ```
   - `mark_read`
     ```json
     { "contactId": 123 }
     ```
   - `product-chat-initiate`
     ```json
     {
       "productId": 10,
       "sellerId": 456,
       "content": "Is this available?",
       "messageType": "IMAGE"
     }
     ```
   - `send_broadcast`
     ```json
     {
       "broadcastId": 7,
       "messageType": "TEXT",
       "content": "Special offer",
       "media": []
     }
     ```
   - `edit_message`
     ```json
     {
       "contactId": 123,
       "messageId": 987,
       "content": "Updated text"
     }
     ```
   - `delete_message`
     ```json
     {
       "contactId": 123,
       "messageId": 987
     }
     ```
   - `unsend_message`
     ```json
     {
       "contactId": 123,
       "messageId": 987
     }
     ```

4. Register listeners for server events:
   - `connect`
   - `disconnect`
   - `connect_error`
   - `receive_message`
   - `send_message` (server echo event name)
   - `read_ack`
   - `broadcast_sent`
   - `message_edited`
   - `message_deleted`
   - `message_unsent`
   - `error_message`
   - `product-chat-initiate_error`

5. Route all received events to existing `EventFeed` component as structured log items:
   - timestamp
   - event name
   - payload
   - direction (`incoming` or `outgoing`)

6. Reuse `ConnectionPanel` if possible; otherwise extend it without breaking existing pages.

7. Add a lightweight socket helper in `src/socket/socket.ts`:
   - `createChatSocket({ baseUrl, token })`
   - return typed `Socket`
   - ensure old socket code still works (no breaking changes)

8. Add safe JSON parsing for media payload textareas:
   - If invalid JSON, show inline error and do not emit.

9. Keep page client-side (`"use client"`), with clean TypeScript types and no `any`.

10. Add a short usage section at the top of the page:
   - enter token
   - connect
   - fill payload fields
   - emit event
   - observe logs

### Acceptance Checklist

- Can connect/disconnect to `/ws/chat` with token.
- Can emit every client chat event listed above.
- Receives and logs every listed server event.
- Invalid JSON does not crash UI.
- Existing socket testing pages/components continue working.

---

## Notes For Your Backend

- Namespace is `/ws/chat`.
- JWT can be sent as `authorization` header or `auth.token`.
- Main error channels are `error_message` and `product-chat-initiate_error`.
