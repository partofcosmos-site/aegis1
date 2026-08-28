# Milestone 2: R2 — Sub-Second Voice/Text Micro-Logger Implementation

## Working Directory
`C:\Users\white\master-hub\aegis1\.agents\teamwork_preview_worker_m2`

## Project Workspace
`C:\Users\white\master-hub\aegis1`

## Scope & Assigned Files (Exclusive Write Ownership)
- `src/utils/microLogParser.ts` (create deterministic sub-millisecond NLP parser)
- `src/components/MicroLoggerModal.tsx` (create global floating HUD modal)
- `src/components/LogInput.tsx` (integrate micro-log parser for instant token previews)
- `src/components/Layout.tsx` (wire global hotkey `Alt+L` and quick-launcher button)

## Requirements & Specifications
Reference files to read:
- `C:\Users\white\master-hub\aegis1\.agents\ORIGINAL_REQUEST.md`
- `C:\Users\white\master-hub\aegis1\PROJECT.md`
- `C:\Users\white\master-hub\aegis1\.agents\teamwork_preview_explorer_survey_3\survey_report.md` (Section 3)

Key Implementation Details:
1. **`src/utils/microLogParser.ts`**:
   - `parseMicroLog(input: string): MicroLogEntity`
   - Supports text/speech patterns like:
     - `"Did 45m Physics electrostatics 20 questions 85% accuracy"`
     - `"2h math integration solved 35 problems 28 correct 7 wrong"`
     - `"1.5 hrs chemistry organic reaction mechanisms 15 numericals 90% acc felt tired"`
   - Extracts:
     - `subject` (Physics, Chemistry, Mathematics, Biology, Computer Science, General)
     - `topic` / `subtopic`
     - `durationMinutes` (parses hours, minutes, floats like 1.5h)
     - `problemsSolved`
     - `accuracyPercent` (0-100%, calculated from % or correct/wrong counts)
     - `mistakes` (array of detected mistake strings)
     - `focusScore` (1-10) and `efficiencyScore` (1-10)
     - `energyMood`
   - Sub-millisecond execution (<5ms), zero network overhead.
2. **`src/components/MicroLoggerModal.tsx`**:
   - Floating modal / quick HUD accessible from anywhere.
   - Real-time Web Speech recognition voice toggle with live waveform / mic listening indicator.
   - Text input with real-time parsed token chips showing extracted entities as user types/speaks (Subject badge, Duration chip, Problems chip, Accuracy badge, Mistakes tag).
   - Instant 1-tap "Log Session" button (or press `Enter`) that dispatches session directly to AppContext (`addSession` / `addStudySession` or equivalent context hook).
3. **`src/components/LogInput.tsx`**:
   - Enhance the existing quick logger on the Dashboard to use `parseMicroLog` for instantaneous optimistic token preview alongside the existing voice / AI options.
4. **`src/components/Layout.tsx`**:
   - Mount `<MicroLoggerModal isOpen={isMicroLoggerOpen} onClose={() => setIsMicroLoggerOpen(false)} />`.
   - Global keyboard event listener for `Alt+L` and `Ctrl+K` to toggle the MicroLogger HUD.
   - Quick floating action button / header icon to open the MicroLogger HUD.
5. **Build & Typecheck Verification**:
   - Run `"C:\Program Files\nodejs\node.exe" node_modules/typescript/bin/tsc --noEmit` and `"C:\Program Files\nodejs\node.exe" node_modules/vite/bin/vite.js build`.
   - Ensure 0 errors.

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Handoff Requirements
Write your detailed report to `C:\Users\white\master-hub\aegis1\.agents\teamwork_preview_worker_m2\handoff.md` and notify the parent orchestrator.
