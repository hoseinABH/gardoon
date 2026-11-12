# Box (صندوق) Domain Specification

**Domain:** `box` (ROSCA Group)  
**Base Path:** `/api/boxes` (with legacy dual mapping `/api/groups`)  
**Package:** `ir.gardoon.domain.group`  
**Frontend Feature:** `frontend/src/features/groups/`

---

## 1. Domain Enums & Structures

### Calculation Modes
* `TARGET_POT`: Creator specifies target total pot amount. Per-member contribution is calculated dynamically based on total active members.
* `FIXED_CONTRIBUTION`: Creator specifies a fixed per-member contribution per cycle. Total pot equals `fixed_share * member_count`.

### Box Status
* `RECRUITING`: Open for members to join via invite code. Cannot execute draws yet.
* `ACTIVE`: Launched by owner. Cycles are active and lucky draws can be held.
* `COMPLETED`: All cycles have settled and finished.

### Cycle Interval
* `MONTHLY`: Due once a month on `jalaliDueDay`.

---

## 2. API Contracts

### 2.1 List My Boxes
* **Method:** `GET`
* **Path:** `/api/boxes` (or `/api/groups`)
* **Auth Required:** Yes (`Authorization: Bearer <token>`)

#### Response (`200 OK`)
```json
[
  {
    "id": "e4d3c2b1-1234-5678-9abc-def012345678",
    "title": "صندوق دوستانه ۳ نفره",
    "ownerId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "ownerName": "سارا محمدی",
    "calculationMode": "FIXED_CONTRIBUTION",
    "baseAmount": 1000000,
    "estimatedPotAmount": 3000000,
    "estimatedPerMemberShare": 1000000,
    "currency": "IRT",
    "cycleInterval": "MONTHLY",
    "jalaliDueDay": 1,
    "startDate": "2026-12-01",
    "gracePeriodHours": 48,
    "status": "ACTIVE",
    "inviteCode": "7K9P2X4W",
    "memberCount": 3,
    "completedRounds": 0,
    "totalRounds": 3,
    "createdAt": "2026-11-12T20:00:00Z"
  }
]
```

---

### 2.2 Create New Box
* **Method:** `POST`
* **Path:** `/api/boxes` (or `/api/groups`)
* **Auth Required:** Yes (`Authorization: Bearer <token>`)

#### Request Body
```json
{
  "title": "صندوق دوستانه ۳ نفره",
  "calculationMode": "FIXED_CONTRIBUTION",
  "baseAmount": 1000000,
  "cycleInterval": "MONTHLY",
  "jalaliDueDay": 1,
  "startDate": "2026-12-01",
  "gracePeriodHours": 48
}
```

#### Response (`201 Created`)
Returns `GroupDetailDto` with initial owner as first member.

---

### 2.3 Get Box Details
* **Method:** `GET`
* **Path:** `/api/boxes/{id}` (or `/api/groups/{id}`)
* **Auth Required:** Yes (`Authorization: Bearer <token>`)

#### Response (`200 OK`)
```json
{
  "id": "e4d3c2b1-1234-5678-9abc-def012345678",
  "title": "صندوق دوستانه ۳ نفره",
  "ownerId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "ownerName": "سارا محمدی",
  "calculationMode": "FIXED_CONTRIBUTION",
  "baseAmount": 1000000,
  "totalPotAmount": 3000000,
  "perMemberShare": 1000000,
  "currency": "IRT",
  "cycleInterval": "MONTHLY",
  "jalaliDueDay": 1,
  "startDate": "2026-12-01",
  "gracePeriodHours": 48,
  "status": "RECRUITING",
  "inviteCode": "7K9P2X4W",
  "members": [
    {
      "id": "b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e",
      "userId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "fullName": "سارا محمدی",
      "phoneNumber": "09121110001",
      "avatarHue": 142,
      "defaultCardNumber": "6104337890123456",
      "defaultIban": "IR210012000000123456789012",
      "defaultBankName": "بانک ملت",
      "defaultAccountHolder": "سارا محمدی",
      "shareCount": 1,
      "hasWon": false,
      "wonCycleNumber": null,
      "joinedAt": "2026-11-12T20:00:00Z"
    }
  ],
  "rounds": [],
  "createdAt": "2026-11-12T20:00:00Z"
}
```

---

### 2.4 Preview Box by Invite Code
* **Method:** `GET`
* **Path:** `/api/boxes/invite/{code}` (or `/api/groups/invite/{code}`)
* **Auth Required:** No

#### Response (`200 OK`)
Returns `GroupSummaryDto` containing the title, owner name, contribution amounts, and member count.

---

### 2.5 Join Box via Invite Code
* **Method:** `POST`
* **Path:** `/api/boxes/join` (or `/api/groups/join`)
* **Auth Required:** Yes (`Authorization: Bearer <token>`)

#### Request Body
```json
{
  "inviteCode": "7K9P2X4W",
  "shareCount": 1
}
```

#### Response (`200 OK`)
Returns the updated `GroupDetailDto` with the newly joined member.

---

### 2.6 Launch Box
* **Method:** `POST`
* **Path:** `/api/boxes/{id}/launch` (or `/api/groups/{id}/launch`)
* **Auth Required:** Yes (must be the box owner)
* **Preconditions:** Box must be in `RECRUITING` status with at least 2 members.
* **Side Effects:**
  - Status updates to `ACTIVE`.
  - Generates $N$ `box_cycles` where $N$ is total shares.
  - Generates automated system event card in chat.

#### Response (`200 OK`)
Returns updated `GroupDetailDto` with generated `rounds`.

---

### 2.7 Replace Member
* **Method:** `POST`
* **Path:** `/api/boxes/{id}/replace-member` (or `/api/groups/{id}/replace-member`)
* **Auth Required:** Yes (must be the box owner)

#### Request Body
```json
{
  "currentMemberId": "b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e",
  "newUserId": "c9d8e7f6-a5b4-3c2d-1e0f-9a8b7c6d5e4f"
}
```

#### Response (`200 OK`)
Returns updated `GroupDetailDto`.
