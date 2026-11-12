# User & Authentication Domain Specification

**Domain:** `user`  
**Base Path:** `/api/auth` and `/api/users`  
**Package:** `ir.gardoon.domain.user`  
**Frontend Feature:** `frontend/src/features/auth/`

---

## 1. Domain Entities & Value Objects

### User Profile
```typescript
interface UserProfile {
  id: string; // UUID
  phoneNumber: string; // 11 digits (e.g. 09121110001)
  fullName: string;
  avatarUrl?: string | null;
  avatarHue: number; // 0-360 HSL color hue
  defaultCardNumber?: string | null; // 16 digits (Luhn valid)
  defaultIban?: string | null; // 26 chars starting with IR (ISO-7064 Mod-97-10 valid)
  defaultBankName?: string | null; // e.g. "بانک ملت"
  defaultAccountHolder?: string | null;
}
```

---

## 2. API Contracts

### 2.1 Send OTP Code
* **Method:** `POST`
* **Path:** `/api/auth/otp/send`
* **Auth Required:** No

#### Request Body
```json
{
  "phoneNumber": "09121110001"
}
```

#### Response (`200 OK`)
```json
{
  "ok": true,
  "message": "کد تایید ارسال شد",
  "devCode": "12345"
}
```
*(Note: `devCode` is only returned when `app.auth.dev-mode=true`)*

#### Rate Limit Response (`429 Too Many Requests`)
*Triggered if a subsequent OTP is requested for the same phone number within 60 seconds.*
```json
{
  "code": "OTP_COOLDOWN",
  "message": "لطفاً ۵۸ ثانیه دیگر دوباره تلاش کنید",
  "status": 429
}
```

#### Provider Error Response (`502 Bad Gateway`)
*Triggered in production if the SMS provider returns a failure or network error.*
```json
{
  "code": "SMS_PROVIDER_ERROR",
  "message": "خطا در ارسال پیامک توسط سرویس‌دهنده",
  "status": 502
}
```

---

### 2.2 Verify OTP Code & Login
* **Method:** `POST`
* **Path:** `/api/auth/otp/verify`
* **Auth Required:** No
* **Side Effect:** Sets HttpOnly cookie `gardoon_refresh` with path `/api/auth`.

#### Request Body
```json
{
  "phoneNumber": "09121110001",
  "code": "12345",
  "fullName": "سارا محمدی"
}
```

#### Response (`200 OK`)
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "phoneNumber": "09121110001",
    "fullName": "سارا محمدی",
    "avatarUrl": null,
    "avatarHue": 142,
    "defaultCardNumber": null,
    "defaultIban": null,
    "defaultBankName": null,
    "defaultAccountHolder": null
  }
}
```

---

### 2.3 Refresh Access Token
* **Method:** `POST`
* **Path:** `/api/auth/refresh`
* **Auth Required:** No (reads HttpOnly cookie `gardoon_refresh` or `X-Refresh-Token` header).
* **Headers:** `X-Refresh-Token: <token>` *(optional fallback)*

#### Response (`200 OK`)
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "phoneNumber": "09121110001",
    "fullName": "سارا محمدی",
    "avatarUrl": null,
    "avatarHue": 142,
    "defaultCardNumber": "6104337890123456",
    "defaultIban": "IR210012000000123456789012",
    "defaultBankName": "بانک ملت",
    "defaultAccountHolder": "سارا محمدی"
  }
}
```

#### Error Response (`401 Unauthorized`)
```json
{
  "code": "INVALID_REFRESH_TOKEN",
  "message": "نشست کاربری منقضی شده است؛ دوباره وارد شوید",
  "status": 401
}
```

---

### 2.4 Logout
* **Method:** `POST`
* **Path:** `/api/auth/logout`
* **Auth Required:** No
* **Side Effect:** Clears HttpOnly cookie `gardoon_refresh`.

#### Response (`200 OK`)
```json
{
  "ok": true
}
```

---

### 2.5 Get Current User Profile
* **Method:** `GET`
* **Path:** `/api/users/me`
* **Auth Required:** Yes (`Authorization: Bearer <token>`)

#### Response (`200 OK`)
```json
{
  "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "phoneNumber": "09121110001",
  "fullName": "سارا محمدی",
  "avatarUrl": null,
  "avatarHue": 142,
  "defaultCardNumber": "6104337890123456",
  "defaultIban": "IR210012000000123456789012",
  "defaultBankName": "بانک ملت",
  "defaultAccountHolder": "سارا محمدی"
}
```

---

### 2.6 Update Banking Coordinates
* **Method:** `PUT`
* **Path:** `/api/users/me/banking`
* **Auth Required:** Yes (`Authorization: Bearer <token>`)

#### Request Body
```json
{
  "defaultCardNumber": "6104337890123456",
  "defaultIban": "IR210012000000123456789012",
  "defaultBankName": "بانک ملت",
  "defaultAccountHolder": "سارا محمدی"
}
```

#### Response (`200 OK`)
Returns the updated `UserProfileDto` object.
