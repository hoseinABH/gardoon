# GEMINI.md

Special instructions, execution guidelines, and strict operational rules for Gemini models working on Gardoon:

---

## 1. Mandatory Workflow Gate (Plan First, Code Later)
- **Brainstorm & Edge Cases:** Always brainstorm architectural implications and edge cases (concurrency, race conditions, network failures, boundary conditions, Persian text/digit normalization) before proposing changes.
- **Deliver Structured Plan:** Formulate a clear, actionable plan and present it to the user.
- **Obtain Approval:** **Never touch or modify code until the user has explicitly approved the plan.**

---

## 2. Living Domain Specs & API Contracts (`docs/specs/`)
- All API contracts between frontend and backend live in `docs/specs/`:
  - `docs/specs/user.spec.md`
  - `docs/specs/box.spec.md`
  - `docs/specs/cycle.spec.md`
  - `docs/specs/obligation.spec.md`
  - `docs/specs/chat.spec.md`
- **Backend Updates:** When updating backend endpoints, DTOs, or error codes, you **MUST immediately update the corresponding spec file**.
- **Frontend Implementations:** When implementing frontend features that call backend endpoints, you **MUST open and read the domain spec file first** to follow the exact payload schemas, parameters, and headers.

---

## 3. Strict Verification & Comprehensive Testing
- Write unit tests (`./mvnw test`, `pnpm test`) and E2E tests (`pnpm e2e`) for every newly implemented feature or endpoint.
- Always run the relevant test suites and ensure all tests pass with exit code `0` before completing your turn.

---

## 4. Domain & Product Conventions
1. **Persian UX Tone:** Always use clean, polite, contemporary Iranian Persian fintech terminology:
   - Use "صندوق قرض‌الحسنه", "قسط", "گردونه شانس", "رسید واریز", "شماره شبا", "تایید واریز", "کد پیگیری".
   - Avoid literal machine translations.
2. **Deterministic Lucky Draw:**
   - Calculation formula for target wheel stop angle: `total_rotations * 360 + slice_offset_degrees`.
   - The server chooses the winner using `SecureRandom`, persists the result atomically in `@Transactional(isolation = PESSIMISTIC_WRITE)`, and emits the draw parameters to the frontend.
3. **No In-App Payment Gateway:** Never introduce IPG (Shaparak) mocks or payment gateway redirections. Everything operates on bilateral external Card-to-Card / Sheba transfers with receipt confirmation.
4. **Money Precision:** Store amounts in Tomans (IRT) using `Long` / `BIGINT`. Never use floating-point numbers.
