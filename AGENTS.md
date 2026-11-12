# Gardoon (گردون) — Architecture & Development Guidelines

This document provides system-wide operational rules and conventions for developing Gardoon.

## 1. Domain Overview
Gardoon is a gamified, peer-to-peer ROSCA (Rotating Savings and Credit Association / صندوق قرض‌الحسنه و وام دورهمی) ledger.
It **never processes monetary transactions in-app**. It operates as a coordination, verification, and gamification ledger.

## 2. Directory Architecture
- `frontend/`: Next.js 16 (App Router) PWA with TypeScript, Tailwind CSS (RTL), Zustand, Framer Motion, and IRANSansX font.
- `backend/`: Java 21 Spring Boot 3.4.x domain-driven architecture with Maven, PostgreSQL 16, Flyway, and WebSockets.
- `docs/`: Product specifications, architecture decision records, and API contracts.

## 3. Strict Development Rules

### Backend (Domain-Driven Design)
- **Bounded Contexts:** Each domain entity lives in its own dedicated package under `ir.gardoon.domain.<context>`:
  - `user`: Identity, OTP, default banking coordinates (16-digit card, 26-char Sheba).
  - `group`: ROSCA group lifecycle, calculation modes (`TARGET_POT`, `FIXED_CONTRIBUTION`), membership.
  - `round`: Rounds/cycles, deterministic lucky draw angle computation, server-authoritative draw with `SecureRandom`.
  - `obligation`: Bilateral payment obligations, receipt image storage, beneficiary confirmation/rejection.
  - `chat`: Group WebSocket chat & automated system event timeline cards.
- **Concurrency & ACID:** Wrap lucky draws in `@Transactional` using `PESSIMISTIC_WRITE` locks (`SELECT ... FOR UPDATE`) on the round.
- **Money Handling:** Amounts are stored in Tomans (IRT) using `Long` (PostgreSQL `BIGINT`). Never floating-point numbers.
- **Validation:** Enforce Luhn algorithm for 16-digit Iranian bank cards and ISO-7064 Mod-97-10 for 26-char Iranian Sheba (`IR...`).

### Frontend (Feature-Based Structure)
- **Feature Directories:** All components, hooks, and state stores belong to `src/features/<feature>/`. Shared UI components live in `src/components/ui/`.
- **RTL & Typography:** Root `<html lang="fa" dir="rtl">`. Always use Tailwind logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end`).
- **Persian Inputs:** Mask and convert Persian/Arabic digits (`۰-۹`) to standard ASCII (`0-9`) before mutating state. Always show comma-separated numbers with live Persian words helper (e.g. `۱۰,۰۰۰,۰۰۰ تومان — معادل ده میلیون تومان`).
- **PWA & Offline:** Support offline reading of group status and queued receipt uploads.
