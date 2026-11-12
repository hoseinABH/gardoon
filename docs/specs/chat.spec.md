# Chat & System Timeline (گفتگو و رویدادها) Domain Specification

**Domain:** `chat`  
**Base Path:** `/api/boxes/{groupId}/chat` (with dual mapping `/api/groups/{groupId}/chat`) and WebSocket `/ws/chat`  
**Package:** `ir.gardoon.domain.chat`  
**Frontend Feature:** `frontend/src/features/chat/`

---

## 1. Domain Entities & Message Types

### Message Types
* `TEXT`: User-to-user community chat message.
* `SYSTEM_EVENT`: Automated milestone card (e.g. member joined, box launched, lucky draw winner declared, cycle settled).
* `RECEIPT_CARD`: Automated card containing receipt slip thumbnail, amount, and payer details for quick in-timeline review.

---

## 2. API Contracts

### 2.1 Get Box Chat History
* **Method:** `GET`
* **Path:** `/api/boxes/{groupId}/chat` (or `/api/groups/{groupId}/chat`)
* **Auth Required:** Yes (`Authorization: Bearer <token>`)
* **Query Parameters:**
  - `page`: Integer (default: `0`)
  - `size`: Integer (default: `50`)

#### Response (`200 OK`)
```json
[
  {
    "id": "7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d",
    "groupId": "e4d3c2b1-1234-5678-9abc-def012345678",
    "senderUserId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "senderName": "سارا محمدی",
    "senderAvatarHue": 142,
    "messageType": "TEXT",
    "content": "سلام به همگی، صندوق فعال شد!",
    "relatedObligationId": null,
    "createdAt": "2026-11-12T20:30:00Z"
  },
  {
    "id": "8b9c0d1e-2f3a-4b5c-6d7e-8f9a0b1c2d3e",
    "groupId": "e4d3c2b1-1234-5678-9abc-def012345678",
    "senderUserId": null,
    "senderName": "گردون",
    "senderAvatarHue": 45,
    "messageType": "SYSTEM_EVENT",
    "content": "🎉 قرعه‌کشی دوره ۱ با موفقیت برگزار شد. برنده: سارا محمدی",
    "relatedObligationId": null,
    "createdAt": "2026-11-12T20:35:00Z"
  }
]
```

---

### 2.2 Send Chat Message
* **Method:** `POST`
* **Path:** `/api/boxes/{groupId}/chat` (or `/api/groups/{groupId}/chat`)
* **Auth Required:** Yes (`Authorization: Bearer <token>`)

#### Request Body
```json
{
  "content": "سلام دوستان، فیش واریز شد."
}
```

#### Response (`200 OK`)
Returns the created `ChatMessageDto` object.

---

### 2.3 WebSocket Real-time Topic
* **Endpoint:** `/ws/chat`
* **STOMP Broker Destination:** `/topic/boxes/{groupId}/chat`
* **Message Payload:** `ChatMessageDto` JSON object emitted automatically whenever any member posts a message or the system triggers an event.
