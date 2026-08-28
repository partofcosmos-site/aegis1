# E2E Test Infra: Savantix (Aegis)

## Test Philosophy
- Opaque-box, requirement-driven, deterministic testing of all 5 elite time management features.
- Verification methodology: Tier 1 (Feature Coverage), Tier 2 (Boundary & Corner Cases), Tier 3 (Cross-Feature Combinations), Tier 4 (Real-World Application Scenarios).

## Feature Inventory
| # | Feature | Source | Tier 1 | Tier 2 | Tier 3 |
|---|---------|--------|:------:|:------:|:------:|
| 1 | Flowmodoro & Flowtime Count-up Engine | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 2 | Pomodoro & Flowtime Integration | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 3 | Deterministic Micro-Log NLP Parser | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 4 | Global Floating Micro-Logger HUD | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 5 | Speed vs. Accuracy Calibration Matrix (SACM) | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 6 | SACM Diagnostic Insights & Archetype Badges | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 7 | Dynamic Subject Equilibrium Shannon Entropy | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |
| 8 | Discrete PID Subject Allocator | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |
| 9 | 100 HP Elastic Streak Health Bar | ORIGINAL_REQUEST §R5 | 5 | 5 | ✓ |
| 10 | Resilience Shield Token Engine | ORIGINAL_REQUEST §R5 | 5 | 5 | ✓ |

## Test Architecture
- Test Runner: Node.js verification script and BrowserOS live verification.
- Pass/Fail Semantics: 100% assertions passing with zero exit code and zero TypeScript compile errors.
- Verification commands:
  - `node scripts/verify_features.js` (comprehensive automated test suite for all utility engines, algorithms, and integration contracts).
  - `node node_modules/typescript/bin/tsc --noEmit` (TypeScript static type checking).
  - `node node_modules/vite/bin/vite.js build` (Vite production bundle build).

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Long Olympiad Physics Study Session with Dynamic Break | Flowmodoro, Micro-Logger, SACM, Subject Equilibrium | High |
| 2 | Voice-dictated Micro-log with mistakes and accuracy calibration | Micro-Logger, SACM, Heatmap | Medium |
| 3 | 7-Day JEE Subject Neglect Detection & PID Rebalancing | Subject Equilibrium PID, Dashboard, Analytics | High |
| 4 | Missed Study Day with Resilience Shield Absorption | Elastic Streak Health Bar, Resilience Tokens, Heatmap | High |
| 5 | End-to-End Persistence and LocalStorage State Reload | Flowmodoro, Streak Health, SACM, Storage Sync | High |

## Coverage Thresholds
- Tier 1: >=5 test cases per feature (50+ total).
- Tier 2: >=5 boundary and corner cases per feature (50+ total).
- Tier 3: Pairwise combination test cases across all 5 features.
- Tier 4: >=5 realistic end-to-end user workflows.
