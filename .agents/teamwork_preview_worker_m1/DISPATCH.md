# Milestone 1: R1 — Flowmodoro & Flowtime Engine Implementation

## 2026-08-28T22:06:13Z

## Working Directory
`C:\Users\white\master-hub\aegis1\.agents\teamwork_preview_worker_m1`

## Project Workspace
`C:\Users\white\master-hub\aegis1`

## Scope & Assigned Files (Exclusive Write Ownership)
- `src/utils/flowmodoroEngine.ts` (create new engine)
- `src/components/Pomodoro.tsx` (integrate Flowmodoro count-up stopwatch, dynamic break, flow state indicator, fix `RefreshCw` import)

## Requirements & Specifications
Reference files to read:
- `C:\Users\white\master-hub\aegis1\.agents\ORIGINAL_REQUEST.md`
- `C:\Users\white\master-hub\aegis1\PROJECT.md`
- `C:\Users\white\master-hub\aegis1\.agents\teamwork_preview_explorer_survey_3\survey_report.md` (Section 2)

Key Implementation Details:
1. **`src/utils/flowmodoroEngine.ts`**:
   - `calculateDynamicBreak(focusSeconds: number, config?: FlowmodoroConfig): number` where Break = round(Focus / 5) with min 3 min (180s) and max 30 min (1800s) if Focus >= 300s, else 0.
   - `getFlowStage(focusMinutes: number): { stage: FlowStateStage; label: string; color: string; badge: string }`
     - 0-15m: Ramp-up / Entering Flow
     - 15-45m: Deep Focus Zone
     - 45-90m: Hyper-Focus Peak
     - 90m+: Fatigue Alert (Break Recommended)
   - Configuration management with localStorage key `savantix_flowmodoro_config_v1`.
2. **`src/components/Pomodoro.tsx`**:
   - Add Mode switcher: classical "Pomodoro" (countdown) vs "Flowtime / Flowmodoro" (count-up stopwatch).
   - In Flowmodoro mode:
     - Count-up stopwatch tracking elapsed focus time (`elapsedFocusSeconds`).
     - Live display of earned dynamic break (e.g., "Earned Break: 12 mins" updating in real-time as `Math.round(elapsedFocusSeconds / 300)`).
     - Visual Flow State badge indicator (Entering Flow -> Deep Focus Zone -> Hyper-Focus Peak -> Fatigue Alert).
     - When user clicks "Finish Flow & Take Break": prompts modal / transitions to Dynamic Break Countdown timer.
     - Dynamic Break countdown counts down from earned break seconds to 00:00, with optional Tibetan bowl / zen chime completion.
     - Auto-log completed focus session to AppContext upon completion.
   - Fix the missing `RefreshCw` import from `lucide-react` at top of `Pomodoro.tsx`.
3. **Build & Typecheck Verification**:
   - Run `"C:\Program Files\nodejs\node.exe" node_modules/typescript/bin/tsc --noEmit` and `"C:\Program Files\nodejs\node.exe" node_modules/vite/bin/vite.js build`.
   - Ensure 0 errors.

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Handoff Requirements
Write your detailed report to `C:\Users\white\master-hub\aegis1\.agents\teamwork_preview_worker_m1\handoff.md` and notify the parent orchestrator.
