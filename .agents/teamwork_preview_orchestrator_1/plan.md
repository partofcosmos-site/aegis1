# Savantix (Aegis) — 5 Elite Time Management & Velocity Features Plan

## Project Overview
Implement, verify, and live-validate the 5 elite time management and velocity features for Savantix:
- R1: Flowmodoro & Flowtime Engine (count-up stopwatch, dynamic break = focus / 5, Pomodoro integration)
- R2: Sub-Second Voice/Text Micro-Logger (voice input, natural language entity parsing)
- R3: Speed vs. Accuracy Calibration Matrix (SACM) (4-quadrant velocity vs accuracy scatter plot and diagnostic analytics in Analytics component)
- R4: Dynamic Subject Equilibrium Matrix (PID Allocator) (rolling 7-day entropy balance tracking to prevent subject neglect)
- R5: Elastic Streak Health Bar & Resilience Token Engine (100 HP health bar with resilience shield tokens in Dashboard and streak tracking)

## Milestone Breakdown
- **Phase 0: Architecture & Codebase Survey**
  - Explorer 1: Project structure, dependencies, build/test setup, type definitions, state/localStorage architecture.
  - Explorer 2: Component architecture (Pomodoro, Dashboard, Analytics, Logger/Quick-log, Navigation, UI system).
  - Explorer 3: Data flow, timer mechanics, session persistence, mock data, and integration points for R1-R5.
- **Phase 1: Project Specification (PROJECT.md & TEST_INFRA.md)**
  - Synthesize survey findings into feature inventory, architecture map, interface contracts, and milestone plan.
  - Establish E2E testing framework and requirements.
- **Phase 2: Implementation Track & E2E Testing Track**
  - Milestone 1 (M1): Flowmodoro & Flowtime Engine (R1)
  - Milestone 2 (M2): Sub-Second Voice/Text Micro-Logger (R2)
  - Milestone 3 (M3): Speed vs. Accuracy Calibration Matrix (R3)
  - Milestone 4 (M4): Dynamic Subject Equilibrium Matrix (R4)
  - Milestone 5 (M5): Elastic Streak Health Bar & Resilience Token Engine (R5)
  - Dual Track: E2E Test Suite Creation & Verification
- **Phase 3: Integration, Full Build, Review & Adversarial Stress-Testing**
  - TypeScript build verification (`node node_modules/vite/bin/vite.js build`).
  - Challenger testing & Forensic Audit verification.
- **Phase 4: Live BrowserOS Validation & Victory Report**
  - Verify live application behavior in BrowserOS.
  - Final audit, state dump handoff, and reporting to parent/user.
