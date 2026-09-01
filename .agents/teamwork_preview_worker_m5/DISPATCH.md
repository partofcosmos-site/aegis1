## 2026-09-01T10:31:30Z

<USER_REQUEST>
You are Worker 5 for Savantix (Aegis).
Working directory: C:\Users\white\master-hub\aegis1\.agents\teamwork_preview_worker_m5
Project root: C:\Users\white\master-hub\aegis1
Original request file: C:\Users\white\master-hub\aegis1\.agents\ORIGINAL_REQUEST.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your task:
1. **Fix Falsy Zero Coercion Bug in `src/services/attendanceRegulatorService.ts`**:
   In `computeLiveMetrics`:
   Replace `profile.presentDays || 48`, `profile.workingDaysHeld || 71`, `profile.absentDays || 23`, `profile.onDutyCredits || 10` with nullish coalescing (`??`) or explicit `typeof === 'number'` checks, so that valid `0` values (e.g. 0 present days or 0 on-duty credits during what-if tests) are preserved instead of falling back to default non-zero values.
2. **Update Academic Timeline & 2028 Exam Targets (per timestamp 2026-09-01T10:29:42Z)**:
   - Primary Goal for the 2 years (Class 11 & 12): **IPhO (International Physics Olympiad) Gold Track / NSEP 2026–2027 / INPhO / OCSC**.
   - Class 12 CBSE Board Exams: **March 2028** (e.g. `2028-03-01` / `2028-03-15`).
   - JEE Advanced: **May 2028** (e.g. `2028-05-28`).
   - ISI & CMI Mathematics Entrances: **May 2028** (e.g. `2028-05-14` / `2028-05-21`).
   - NSEP / INPhO (Physics Olympiad): **November 2026** (NSEP: `2026-11-29`) and **January 2027** (INPhO: `2027-01-31`).
   - Update default exam targets in `src/context/AppContext.tsx`, `src/components/ExamCountdown.tsx`, `src/components/Goals.tsx`, `src/components/Settings.tsx`, `src/components/TriageMode.tsx`, and `src/components/Dashboard.tsx` to reflect this 2028 timeline and IPhO Gold Track priority.
3. **Verification**:
   - Run `& "C:\Program Files\nodejs\node.exe" node_modules/typescript/bin/tsc --noEmit` and confirm 0 errors.
   - Run `& "C:\Program Files\nodejs\node.exe" node_modules/vite/bin/vite.js build` and confirm clean production build.
   - Run `& "C:\Program Files\nodejs\node.exe" ./node_modules/tsx/dist/cli.mjs src/test/allTests.test.ts` and confirm all tests pass.

Write your handoff report to `C:\Users\white\master-hub\aegis1\.agents\teamwork_preview_worker_m5\handoff.md` and send a message when complete.
</USER_REQUEST>
