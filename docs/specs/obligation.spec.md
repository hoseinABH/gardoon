# Obligation & Receipt (قسط و رسید) Domain Specification

**Domain:** `obligation`  
**Base Path:** `/api/cycles/{roundId}/obligations` and `/api/obligations`  
**Package:** `ir.gardoon.domain.obligation`  
**Frontend Feature:** `frontend/src/features/obligations/`

---

## 1. Domain Entities & States

### Obligation Status
* `PENDING`: Payer owes the installment to beneficiary.
* `SUBMITTED`: Payer uploaded receipt slip with tracking reference; awaiting beneficiary verification.
* `CONFIRMED`: Beneficiary confirmed receiving the money in their bank account.
* `REJECTED`: Beneficiary rejected the slip (e.g. wrong amount, illegible receipt, uncredited funds); payer must re-upload.

---

## 2. API Contracts

### 2.1 Get Cycle Obligations
* **Method:** `GET`
* **Path:** `/api/cycles/{roundId}/obligations` (or `/api/rounds/{roundId}/obligations`)
* **Auth Required:** Yes (`Authorization: Bearer <token>`)

#### Response (`200 OK`)
```json
[
  {
    "id": "c1d2e3f4-5678-90ab-cdef-1234567890ab",
    "roundId": "f1e2d3c4-b5a6-9876-5432-10fedcba9876",
    "roundNumber": 1,
    "payerUserId": "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
    "payerName": "علی رضایی",
    "payerPhoneNumber": "09121110002",
    "payerAvatarHue": 210,
    "beneficiaryUserId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "beneficiaryName": "سارا محمدی",
    "amount": 1000000,
    "status": "PENDING",
    "receiptImageUrl": null,
    "trackingReference": null,
    "rejectionReason": null,
    "submittedAt": null,
    "confirmedAt": null
  }
]
```

---

### 2.2 Submit Receipt
* **Method:** `POST`
* **Path:** `/api/obligations/{id}/receipt`
* **Content-Type:** `multipart/form-data`
* **Auth Required:** Yes (must be the `payerUserId`)
* **Headers:** `Idempotency-Key: <UUID>` *(optional)*

#### Request Parts & Parameters
* `file`: Binary file (image/png, image/jpeg, max 10MB)
* `trackingReference`: String (e.g. `123456789`)
* `idempotencyKey`: UUID header *(optional)*

#### Response (`200 OK`)
```json
{
  "id": "c1d2e3f4-5678-90ab-cdef-1234567890ab",
  "roundId": "f1e2d3c4-b5a6-9876-5432-10fedcba9876",
  "roundNumber": 1,
  "payerUserId": "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
  "payerName": "علی رضایی",
  "payerPhoneNumber": "09121110002",
  "payerAvatarHue": 210,
  "beneficiaryUserId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "beneficiaryName": "سارا محمدی",
  "amount": 1000000,
  "status": "SUBMITTED",
  "receiptImageUrl": "/api/obligations/c1d2e3f4-5678-90ab-cdef-1234567890ab/receipt-image",
  "trackingReference": "TRK-987654",
  "rejectionReason": null,
  "submittedAt": "2026-12-01T11:00:00Z",
  "confirmedAt": null
}
```

---

### 2.3 Download / Stream Receipt Image
* **Method:** `GET`
* **Path:** `/api/obligations/{id}/receipt-image`
* **Auth Required:** Yes (must be payer, beneficiary, or box manager)
* **Response:** Binary image stream with `Cache-Control: private, max-age=3600`.

---

### 2.4 Beneficiary Confirm Receipt
* **Method:** `POST`
* **Path:** `/api/obligations/{id}/confirm`
* **Auth Required:** Yes (must be `beneficiaryUserId`)
* **Preconditions:** Status must be `SUBMITTED`.
* **Side Effects:**
  - Status updates to `CONFIRMED`.
  - Checks if all obligations in the cycle are now confirmed. If so, updates cycle status to `SETTLED`.
  - If this was the last cycle, updates box status to `COMPLETED`.
  - Posts confirmation card to chat.

#### Response (`200 OK`)
Returns updated `ObligationDto` with `status: "CONFIRMED"` and `confirmedAt`.

---

### 2.5 Beneficiary Reject Receipt
* **Method:** `POST`
* **Path:** `/api/obligations/{id}/reject`
* **Auth Required:** Yes (must be `beneficiaryUserId`)
* **Preconditions:** Status must be `SUBMITTED`.

#### Request Body
```json
{
  "reason": "مبلغ واریزی ناقص است یا کد پیگیری همخوانی ندارد"
}
```

#### Response (`200 OK`)
Returns updated `ObligationDto` with `status: "REJECTED"` and `rejectionReason`.
