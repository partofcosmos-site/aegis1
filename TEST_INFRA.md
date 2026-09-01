# E2E Test Infra: Savantix (Aegis) Institutional & Study Operating System

## Test Philosophy
- Opaque-box, requirement-driven, deterministic test suite using fast in-memory mock harness executed via Node `tsx`.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise Combinatorial + Real-World Workload Testing.

## Feature Inventory & Test Coverage
| # | Feature | Requirement | Tier 1 (Functional) | Tier 2 (Boundaries) | Tier 3 (Interactions) | Tier 4 (Workloads) |
|---|---------|-------------|:-------------------:|:-------------------:|:---------------------:|:------------------:|
| 1 | Attendance Ingestion & Calendar | R1 | 5 | 5 | ✓ | ✓ |
| 2 | Reality Math & Gemini Regulator | R2 | 5 | 5 | ✓ | ✓ |
| 3 | Dynamic Daily Insight Regeneration | R3 | 5 | 5 | ✓ | ✓ |
| 4 | Real-time Cloud Sync & Data Loss | R4 | 5 | 5 | ✓ | ✓ |
| 5 | AI Gateway Roster & Cosmos Branding | R5 / Core 2 | 5 | 5 | ✓ | ✓ |

## Test Architecture
- **Master Test Runner**: `& "C:\Program Files\nodejs\node.exe" ./node_modules/tsx/dist/cli.mjs src/test/allTests.test.ts`
- **Unit & Feature Suites**:
  1. `src/test/attendanceInstitutional.test.ts` — The Bandhan School records, 28 holidays, 4 vacations, 4 exams, 23 absences.
  2. `src/test/attendanceMathAiRegulator.test.ts` — Effective vs raw %, lock date projections, recovery formulas, Gemini clipboard bridge payload.
  3. `src/test/dynamicInsightRegeneration.test.ts` — Re-analysis with latest logs, cumulative score recalibration, cached state rehydration.
  4. `src/test/cloudSyncRealtime.test.ts` — Real-time Firestore listeners, insight syncing, non-destructive union merges, zero data loss.
  5. `src/test/aiGatewayFastRoster.test.ts` — 7-model fast launch bar, deprecated route removal, Socratic KaTeX drawer, Alt+G shortcut.
  6. `src/test/cosmosBrandingAnonymity.test.ts` — *"An initiative of Part of Cosmos"* subtitle and user anonymity protection.
  7. `src/test/zeroDataLoss.test.ts` — 34+ localStorage keys integrity verification.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised |
|---|----------|--------------------|
| 1 | Student attendance evaluation on Sept 1 2026 with IIT KGP on-duty credit & Gemini regulator launch | F1, F2, F3, F4 |
| 2 | Multi-session study day: morning session -> generate insight -> evening session -> "🔄 Re-analyze with Latest Logs" | F5, F6, F7, F8 |
| 3 | Cross-device real-time sync between mobile and PC under `debanjan8686@gmail.com` with zero data loss | F7, F8 |
| 4 | Socratic derivation of advanced physics problem + fast launch to Claude 3.7 Sonnet with clipboard payload | F9, F10 |
| 5 | Public interface navigation with verified Cosmos branding and scholar anonymity masking | F11 |
