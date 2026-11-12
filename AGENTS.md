# Gardoon (گردون) — Architecture & Development Guidelines

This document provides system-wide operational rules and conventions for developing Gardoon.

---

## 1. Domain Overview
Gardoon is a gamified, peer-to-peer ROSCA (Rotating Savings and Credit Association / صندوق قرض‌الحسنه و وام دورهمی) ledger.
It **never processes monetary transactions in-app**. It operates as a coordination, verification, and gamification ledger.

---

## 2. Directory Architecture
- `frontend/`: Next.js 16 (App Router) PWA with TypeScript, Tailwind CSS (RTL), Zustand, TanStack Query, Framer Motion, and IRANSansX font.
- `backend/`: Java 21 Spring Boot 3.4.x domain-driven architecture with Maven, PostgreSQL 16, Flyway, and WebSockets.
- `docs/specs/`: Authoritative living API contracts and domain specifications (`user.spec.md`, `box.spec.md`, `cycle.spec.md`, `obligation.spec.md`, `chat.spec.md`).

---

## 3. Strict Development Conventions

### Backend (Domain-Driven Design)
- **Bounded Contexts:** Each domain entity lives under `ir.gardoon.domain.<context>`:
  - `user`: Identity, OTP, default banking coordinates (16-digit card, 26-char Sheba).
  - `group / box`: Box lifecycle (`boxes`, `box_members`), calculation modes (`TARGET_POT`, `FIXED_CONTRIBUTION`).
  - `round / cycle`: Box cycles (`box_cycles`), deterministic lucky draw angle computation, server-authoritative draw with `SecureRandom`.
  - `obligation`: Bilateral payment obligations (`payment_obligations`), receipt image storage, beneficiary confirmation/rejection.
  - `chat`: Group WebSocket chat & automated system event timeline cards (`chat_messages`).
- **Concurrency & ACID:** Wrap lucky draws in `@Transactional` using `PESSIMISTIC_WRITE` locks (`SELECT ... FOR UPDATE`) on the cycle.
- **Money Handling:** Amounts are stored in Tomans (IRT) using `Long` (PostgreSQL `BIGINT`). Never floating-point numbers.
- **Validation:** Enforce Luhn algorithm for 16-digit Iranian bank cards and ISO-7064 Mod-97-10 for 26-char Iranian Sheba (`IR...`).

### Frontend (Feature-Based Structure)
- **Feature Directories:** All components, hooks, and state stores belong to `src/features/<feature>/`. Shared UI components live in `src/components/ui/`.
- **RTL & Typography:** Root `<html lang="fa" dir="rtl">`. Always use Tailwind logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end`).
- **Persian Inputs:** Mask and convert Persian/Arabic digits (`۰-۹`) to standard ASCII (`0-9`) before mutating state. Always show comma-separated numbers with live Persian words helper (e.g. `۱۰,۰۰۰,۰۰۰ تومان — معادل ده میلیون تومان`).
- **PWA & Offline:** Support offline reading of box status and queued receipt uploads.

---

## 4. Mandatory AI Agent Workflow & Implementation Rules

### Rule 4.1 — Brainstorm, Edge Cases & Plan First (Strict Pre-Implementation Gate)
Before writing or modifying any implementation code:
1. **Brainstorm & Explore Edge Cases:** Deeply explore potential failure modes:
   - Concurrency & race conditions (e.g. simultaneous draws or duplicate joins).
   - Validation edge cases (invalid Sheba checksums, non-numeric digits, boundary amounts).
   - Security & authorization (verifying only authorized payers or beneficiaries can act).
   - Offline / network failure resilience and state synchronization.
2. **Deliver a Comprehensive Implementation Plan:** Provide a structured plan detailing proposed changes, DTO schemas, and verification steps.
3. **Wait for Explicit User Approval:** **NEVER start implementing code until the user approves the plan.**

### Rule 4.2 — Contract-First Domain Specs (`docs/specs/`)
1. **Source of Truth:** The files in `docs/specs/` (`user.spec.md`, `box.spec.md`, `cycle.spec.md`, `obligation.spec.md`, `chat.spec.md`) are the authoritative contracts between backend and frontend.
2. **Backend Agent Requirement:** Whenever backend code modifies existing endpoints, adds new endpoints, changes DTO schemas, or introduces new error codes, the agent **MUST update the corresponding spec file in the same turn/commit**.
3. **Frontend Agent Requirement:** Whenever frontend code is written to call a backend endpoint, the agent **MUST first read the corresponding domain spec file** and follow its request parameters, body, headers, and response structure exactly. Never invent or guess payload fields.

### Rule 4.3 — Strict Verification & Immediate Comprehensive Testing
1. **Post-Implementation Verification:** Every feature or bugfix must be immediately verified across affected layers.
2. **Automated Test Coverage:**
   - Write backend unit/integration tests with JUnit 5 & Mockito (`./mvnw test`).
   - Write frontend unit/component tests with Vitest (`pnpm test`).
   - Write end-to-end tests with Playwright (`pnpm e2e`).
3. **Definition of Done:** An agent may never conclude a task with broken tests or failing builds. The full test suite must pass with exit code `0`.
