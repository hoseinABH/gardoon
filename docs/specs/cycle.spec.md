# Cycle & Lucky Draw (دوره و قرعه‌کشی) Domain Specification

**Domain:** `cycle` (Box Round)  
**Base Path:** `/api/boxes/{groupId}/cycles` and `/api/cycles/{roundId}/draw` (with dual mappings `/api/groups/{groupId}/rounds` and `/api/rounds/{roundId}/draw`)  
**Package:** `ir.gardoon.domain.round`  
**Frontend Feature:** `frontend/src/features/groups/`

---

## 1. Domain Lifecycle & States

### Cycle Status
* `PENDING_DRAW`: Due date reached or ready for lucky draw.
* `COLLECTING`: Winner determined; bilateral payment obligations generated; non-winners are submitting receipts.
* `SETTLED`: All payment obligations are confirmed by the beneficiary; cycle is complete.

### Deterministic Wheel Angle Formula
To ensure visual honesty and server-authoritative integrity, the backend chooses the winner using `SecureRandom`, computes a deterministic stopping angle, persists it atomically in `@Transactional(isolation = PESSIMISTIC_WRITE)`, and emits it to the frontend:

$$\text{sliceAngle} = \frac{360}{\text{eligibleCount}}$$
$$\text{sliceCenter} = (\text{winnerSliceIndex} \times \text{sliceAngle}) + \frac{\text{sliceAngle}}{2}$$
$$\text{targetAngle} = (5 \times 360) + \text{sliceCenter}$$

---

## 2. API Contracts

### 2.1 Get Box Cycles
* **Method:** `GET`
* **Path:** `/api/boxes/{groupId}/cycles` (or `/api/groups/{groupId}/rounds`)
* **Auth Required:** Yes (`Authorization: Bearer <token>`)

#### Response (`200 OK`)
```json
[
  {
    "id": "f1e2d3c4-b5a6-9876-5432-10fedcba9876",
    "groupId": "e4d3c2b1-1234-5678-9abc-def012345678",
    "roundNumber": 1,
    "dueDate": "2026-12-01",
    "jalaliDueDateLabel": "۱ آذر ۱۴۰۵",
    "beneficiaryUserId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "beneficiaryName": "سارا محمدی",
    "beneficiaryAvatarUrl": null,
    "payoutCardSnapshot": "6104337890123456",
    "payoutIbanSnapshot": "IR210012000000123456789012",
    "payoutBankSnapshot": "بانک ملت",
    "payoutHolderSnapshot": "سارا محمدی",
    "totalPotAmount": 3000000,
    "perMemberShare": 1000000,
    "drawTargetAngle": 1845,
    "drawCompletedAt": "2026-12-01T10:00:00Z",
    "status": "COLLECTING"
  }
]
```

---

### 2.2 Execute Lucky Draw
* **Method:** `POST`
* **Path:** `/api/cycles/{roundId}/draw` (or `/api/rounds/{roundId}/draw`)
* **Auth Required:** Yes (must be box owner or authorized participant)
* **Preconditions:** Cycle must be in `PENDING_DRAW` status.
* **Side Effects:**
  - Atomically selects winner among members where `hasWon = false`.
  - Marks winner `hasWon = true`, `wonCycleNumber = currentCycleNumber`.
  - Takes banking snapshot of winner coordinates.
  - Updates cycle status to `COLLECTING`.
  - Generates $N - 1$ bilateral `payment_obligations` directed to the winner.
  - Broadcasts system event card to group chat.

#### Response (`200 OK`)
```json
{
  "roundId": "f1e2d3c4-b5a6-9876-5432-10fedcba9876",
  "roundNumber": 1,
  "winnerUserId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "winnerName": "سارا محمدی",
  "winnerAvatarUrl": null,
  "targetAngle": 1845,
  "sliceIndex": 0,
  "drawSeed": "a9f8e7d6...",
  "potAmount": 3000000,
  "completedAt": "2026-12-01T10:00:00Z"
}
```

#### Error Response (`400 Bad Request`)
```json
{
  "code": "ROUND_NOT_READY_FOR_DRAW",
  "message": "قرعه‌کشی این دوره قبلاً انجام شده یا هنوز زمان آن نرسیده است",
  "status": 400
}
```
