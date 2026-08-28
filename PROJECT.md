# Project: Savantix (Aegis) — 5 Elite Time Management & Velocity Features

## Architecture
Savantix is an elite study acceleration platform built with React 19, Vite 6, Tailwind CSS v4, Lucide React, and Recharts.
- **Viewport Architecture**: `src/App.tsx` employs a Persistent Tab Viewport (`block`/`hidden`) preserving active timers, Web Audio nodes, and form states across view switches.
- **State & Persistence**: `src/context/AppContext.tsx` provides dual-persistence via Firebase Firestore sync with immediate `localStorage` fallbacks.
- **Audio Synthesis**: `src/utils/pomodoroAudioEngine.ts` generates real-time Web Audio binaural beats and ambient frequencies.
- **Domain Utilities**: Modular calculation engines in `src/utils/` for Flowmodoro, Micro-Log NLP Parsing, SACM Calibration, PID Subject Equilibrium, and Elastic Streak Resilience.

## Feature Inventory
Every feature from the user request and survey is assigned to a milestone.
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Flowmodoro & Flowtime Count-up Engine | Count-up stopwatch with dynamic break calculation (Break = Focus / 5), stage indicators (Ramp-up, Deep Flow, Hyper-Focus, Fatigue), and auto-break transitions | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Pomodoro & Flowtime Integration | Seamless mode switching between classical Pomodoro and Flowmodoro with persistent state, audio chimes, and auto-logging | M1 | ORIGINAL_REQUEST §R1 |
| 3 | Deterministic Micro-Log NLP Parser | Sub-millisecond client-side regex/NLP parser extracting Subject, Topic, Duration, Solved count, Accuracy %, Mistakes, and Energy | M2 | ORIGINAL_REQUEST §R2 |
| 4 | Global Floating Micro-Logger HUD | Global hotkey (`Alt+L` / `Ctrl+K`) floating HUD with Web Speech API voice capture, live token chips, and instant 1-tap save | M2 | ORIGINAL_REQUEST §R2 |
| 5 | Speed vs. Accuracy Calibration Matrix (SACM) | 4-Quadrant Velocity vs. Accuracy scatter plot (Flow/Mastery, Overthinking, Rushing, Struggling) with velocity (Q/hr) and accuracy (%) thresholds | M3 | ORIGINAL_REQUEST §R3 |
| 6 | SACM Diagnostic Insights & Archetype Badges | Real-time diagnostic feedback per quadrant with personalized study actions for STEM exam prep | M3 | ORIGINAL_REQUEST §R3 |
| 7 | Dynamic Subject Equilibrium Shannon Entropy | Rolling 7-day multi-subject allocation tracking and normalized Shannon entropy balance score ($E \in [0, 100\%]$) | M4 | ORIGINAL_REQUEST §R4 |
| 8 | Discrete PID Subject Allocator | PID-based corrective study prescription engine calculating daily target minute adjustments to prevent subject neglect | M4 | ORIGINAL_REQUEST §R4 |
| 9 | 100 HP Elastic Streak Health Bar | Non-binary anti-fragile health bar with daily decay on missed/under-target days and recovery on target/surplus days | M5 | ORIGINAL_REQUEST §R5 |
| 10 | Resilience Shield Token Engine | 0–3 shield tokens earned through surplus effort and auto-consumed to defend streaks during missed/off days | M5 | ORIGINAL_REQUEST §R5 |
| 11 | Comprehensive E2E Verification & BrowserOS Live Validation | Verification suite covering all 5 features, TypeScript zero-error compilation, and BrowserOS live validation | M6 | ORIGINAL_REQUEST Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Flowmodoro & Flowtime Engine | `src/utils/flowmodoroEngine.ts`, `src/components/Pomodoro.tsx` | none | IN_PROGRESS |
| M2 | Sub-Second Voice/Text Micro-Logger | `src/utils/microLogParser.ts`, `src/components/MicroLoggerModal.tsx`, `src/components/LogInput.tsx`, `src/components/Layout.tsx` | none | PLANNED |
| M3 | Speed vs. Accuracy Calibration Matrix (SACM) | `src/utils/sacmCalculator.ts`, `src/components/Analytics.tsx` | none | PLANNED |
| M4 | Dynamic Subject Equilibrium Matrix (PID Allocator) | `src/utils/pidEquilibriumEngine.ts`, `src/components/Analytics.tsx`, `src/components/Dashboard.tsx` | none | PLANNED |
| M5 | Elastic Streak Health Bar & Resilience Tokens | `src/utils/streakResilienceEngine.ts`, `src/components/Dashboard.tsx`, `src/components/StudyHeatmap.tsx`, `src/context/AppContext.tsx` | none | PLANNED |
| M6 | E2E Test Suite & BrowserOS Live Validation | Test suites, TypeScript compilation, BrowserOS validation | M1-M5 | PLANNED |

## Interface Contracts
### Flowmodoro ↔ Pomodoro Component
- `calculateDynamicBreak(focusSeconds: number, config: FlowmodoroConfig): number`
- `getFlowStage(focusMinutes: number): { stage: FlowStateStage; label: string; color: string }`
- State: `{ engineMode: 'pomodoro' | 'flowmodoro', elapsedFocusSeconds: number, earnedBreakSeconds: number, isBreakActive: boolean }`

### MicroLogParser ↔ MicroLoggerModal & LogInput
- `parseMicroLog(input: string): MicroLogEntity`
- Input: raw text / speech transcript. Output: `{ subject, topic, durationMinutes, problemsSolved, accuracyPercent, mistakes, focusScore, efficiencyScore, energyMood }`

### SACM Calculator ↔ Analytics Component
- `calculateSACMData(sessions: StudySession[], benchmarks?: SACMBenchmarks): SACMReport`
- Quadrants: `'Q1_Mastery' | 'Q2_Overthinking' | 'Q3_Rushing' | 'Q4_Struggling'`

### PID Equilibrium Engine ↔ Analytics & Dashboard
- `calculateSubjectEquilibrium(logs7Days: StudySession[], targetWeights?: Record<string, number>): SubjectEquilibriumReport`
- Output: `{ equilibriumScore: number, status: 'harmonious' | 'mild_skew' | 'severe_neglect', subjectDistributions, actionablePrescription: string }`

### Streak Resilience Engine ↔ Dashboard & Heatmap
- `evaluateElasticStreak(currentState: ElasticStreakState, dailyLogs: DailyLogSummary[], targetMinutesDaily: number): ElasticStreakState`
- State: `{ currentHP: number, maxHP: 100, shieldTokens: number, maxShieldTokens: 3, activeStreakDays: number }`

## Code Layout
- `src/utils/flowmodoroEngine.ts` — Flowmodoro & Flowtime calculation and stage classifier.
- `src/utils/microLogParser.ts` — Deterministic regex NLP parser for micro-logs.
- `src/utils/sacmCalculator.ts` — SACM 4-quadrant calibration and diagnostics.
- `src/utils/pidEquilibriumEngine.ts` — Shannon entropy & PID corrective study balance.
- `src/utils/streakResilienceEngine.ts` — Elastic 100 HP health bar & shield token engine.
- `src/components/MicroLoggerModal.tsx` — Global floating micro-logger HUD.
- `src/components/Pomodoro.tsx` — Pomodoro & Flowmodoro UI and timer integration.
- `src/components/LogInput.tsx` — Dashboard quick logger with micro-log integration.
- `src/components/Layout.tsx` — App layout with global hotkey handler (`Alt+L` / `Ctrl+K`).
- `src/components/Analytics.tsx` — SACM matrix scatter plot and Subject Equilibrium PID panel.
- `src/components/Dashboard.tsx` — Elastic Streak Health Bar & Shield Tokens display.
- `src/components/StudyHeatmap.tsx` — Streak display and health status integration.
- `src/context/AppContext.tsx` — LocalStorage persistence and streak health state sync.
