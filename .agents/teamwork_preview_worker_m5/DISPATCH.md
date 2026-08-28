# Milestone 5: R5 — Elastic Streak Health Bar & Resilience Token Engine Implementation

## Working Directory
`C:\Users\white\master-hub\aegis1\.agents\teamwork_preview_worker_m5`

## Project Workspace
`C:\Users\white\master-hub\aegis1`

## Scope & Assigned Files
- `src/utils/streakResilienceEngine.ts` (create elastic HP & shield token engine)
- `src/components/Dashboard.tsx` (integrate 100 HP health bar & shield token display)
- `src/components/StudyHeatmap.tsx` (integrate resilience status badges)
- `src/context/AppContext.tsx` (persist streak resilience state in localStorage)

## Requirements & Specifications
Reference files to read:
- `C:\Users\white\master-hub\aegis1\.agents\ORIGINAL_REQUEST.md`
- `C:\Users\white\master-hub\aegis1\PROJECT.md`
- `C:\Users\white\master-hub\aegis1\.agents\teamwork_preview_explorer_survey_3\survey_report.md` (Section 6)

Key Implementation Details:
1. **`src/utils/streakResilienceEngine.ts`**:
   - `evaluateElasticStreak(currentState: ElasticStreakState, dailyLogs: DailyLogSummary[], targetMinutesDaily?: number): ElasticStreakState`
   - State interface:
     - `currentHP`: 0–100 (starts at 100)
     - `maxHP`: 100
     - `shieldTokens`: 0–3 (starts at 2 onboarding shields)
     - `maxShieldTokens`: 3
     - `activeStreakDays`: integer count
     - `longestStreakDays`: integer count
     - `lastEvaluatedDate`: 'yyyy-MM-dd'
     - `history`: log of daily HP deltas and shield triggers
   - Daily rules:
     - Missed study ($T_{\text{actual}} = 0$): If $\mathcal{T} > 0$, auto-consume 1 shield token ($\mathcal{T} \leftarrow \mathcal{T} - 1$), $0\text{ HP}$ loss, streak FROZEN. If $\mathcal{T} = 0$, $HP \leftarrow \max(0, HP - 35)$. If $HP = 0$, streak resets to 0.
     - Partial study ($0 < T_{\text{actual}} < T_{\text{target}}$): $HP \leftarrow \max(0, HP - 20(1 - T_{\text{actual}}/T_{\text{target}}))$. Streak continues as degraded.
     - Target reached ($T_{\text{actual}} \ge T_{\text{target}}$): $HP \leftarrow \min(100, HP + 15)$, Streak $+1$.
     - Surplus overdrive ($T_{\text{actual}} \ge 1.5 \times T_{\text{target}}$): $HP \leftarrow \min(100, HP + 25)$, charge $+1$ Shield Token ($\mathcal{T} \leftarrow \min(3, \mathcal{T} + 1)$).
2. **`src/components/Dashboard.tsx` & `src/components/StudyHeatmap.tsx`**:
   - Prominent, beautifully styled **Elastic Streak Health Bar** (e.g. glowing green/emerald at 80-100%, amber at 40-79%, crimson pulse at <40%).
   - **Resilience Shield Token Rack** (3 shield icons: 🛡️ Charged, 🛡️ Charged, ⚪ Empty slot) with tooltip explaining auto-defense on rest/missed days.
   - Streak counter indicating active streak status (`🔥 42 Days (Shield Protected)`).
3. **`src/context/AppContext.tsx`**:
   - LocalStorage key `savantix_streak_resilience_v1` synchronization so reload maintains HP and tokens.
4. **Build & Typecheck Verification**:
   - Run `"C:\Program Files\nodejs\node.exe" node_modules/typescript/bin/tsc --noEmit` and `"C:\Program Files\nodejs\node.exe" node_modules/vite/bin/vite.js build`.
   - Ensure 0 errors.

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Handoff Requirements
Write your detailed report to `C:\Users\white\master-hub\aegis1\.agents\teamwork_preview_worker_m5\handoff.md` and notify the parent orchestrator.
