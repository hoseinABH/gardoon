# Gardoon (گردون) — Living Domain Specifications & API Contracts

This directory contains the authoritative, source-of-truth contracts and specifications for all domains in Gardoon.

---

## 1. Mandatory Rules for All AI Agents

### Rule 1: Brainstorm, Edge Cases & Plan First (No Code Without Approval)
Before writing or modifying any implementation code:
1. **Brainstorm & Explore Edge Cases:** Analyze concurrency, race conditions, edge cases, money precision, Persian RTL/digit formatting, offline states, and security permissions.
2. **Deliver a Detailed Plan:** Present the proposed architecture, DTO schemas, and step-by-step execution.
3. **Wait for Approval:** Do NOT start writing or editing code until the user explicitly reviews and approves the plan.

### Rule 2: Contract-First Development (`docs/specs/`)
1. **Every domain has a dedicated spec file** under `docs/specs/<domain>.spec.md`.
2. **Every contract must explicitly specify:**
   - HTTP method, URL pattern (with path variables and query params).
   - Headers (e.g., `Authorization: Bearer <token>`, `X-Refresh-Token`, `Idempotency-Key`).
   - Request Body schema with a concrete JSON example.
   - Response Status Codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`).
   - Success Response Body schema with a concrete JSON example.
   - Error Response Body schema with exact `code` and `message`.
3. **Backend Agent Responsibility:** Whenever a backend endpoint, DTO, or entity is created or modified, the backend agent **MUST immediately update the corresponding spec file in the same turn/commit**.
4. **Frontend Agent Responsibility:** Before implementing any UI feature that interacts with the backend, the frontend agent **MUST read the corresponding spec file** and adhere 100% to the documented contract. Never guess or invent endpoint URLs or payload structures.

### Rule 3: Strict Verification & Test-Driven Delivery
1. **Immediate Verification:** After any implementation, strictly verify the changes across affected tiers.
2. **Automated Testing:** Write or update:
   - **Backend Unit & Integration Tests:** JUnit 5 + Mockito in `backend/src/test/`.
   - **Frontend Unit Tests:** Vitest in `frontend/src/**/__tests__/`.
   - **End-to-End Tests:** Playwright in `frontend/e2e/`.
3. **Zero Breakage Guarantee:** Run `./mvnw test` and `pnpm test && pnpm typecheck` before finishing. A feature is not complete if tests fail or if newly introduced features lack test coverage.

---

## 2. Domain Specification Index

| Domain | Spec File | Key Endpoints & Scope |
| :--- | :--- | :--- |
| **User & Auth** | [`user.spec.md`](./user.spec.md) | OTP login/verify, JWT refresh, logout, profile, and banking coordinates. |
| **Box (صندوق)** | [`box.spec.md`](./box.spec.md) | Box creation, listing, invite preview/join, manager launch, and member replacement. |
| **Cycle (دوره)** | [`cycle.spec.md`](./cycle.spec.md) | Box cycles listing, deterministic lucky draw execution (`SecureRandom` + angle). |
| **Obligation (قسط و رسید)** | [`obligation.spec.md`](./obligation.spec.md) | Bilateral payment obligations, receipt upload, receipt image stream, beneficiary confirm/reject. |
| **Chat & Timeline (گفتگو)** | [`chat.spec.md`](./chat.spec.md) | REST message history, send message, WebSocket live updates, system event cards. |

---

## 3. Standard Error Envelope

All API errors return a standard JSON structure with HTTP status codes:

```json
{
  "code": "SPECIFIC_ERROR_CODE",
  "message": "پیام خطای فارسی و خوانا برای کاربر",
  "status": 400,
  "timestamp": "2026-11-12T21:30:00Z"
}
```
