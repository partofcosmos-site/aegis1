# Milestone 4: R4 — Dynamic Subject Equilibrium Matrix (PID Allocator) Implementation

## Working Directory
`C:\Users\white\master-hub\aegis1\.agents\teamwork_preview_worker_m4`

## Project Workspace
`C:\Users\white\master-hub\aegis1`

## Scope & Assigned Files
- `src/utils/pidEquilibriumEngine.ts` (create Shannon Entropy & PID Allocator engine)
- `src/components/Analytics.tsx` (integrate Subject Equilibrium & PID Rebalancer panel)

## Requirements & Specifications
Reference files to read:
- `C:\Users\white\master-hub\aegis1\.agents\ORIGINAL_REQUEST.md`
- `C:\Users\white\master-hub\aegis1\PROJECT.md`
- `C:\Users\white\master-hub\aegis1\.agents\teamwork_preview_explorer_survey_3\survey_report.md` (Section 5)

Key Implementation Details:
1. **`src/utils/pidEquilibriumEngine.ts`**:
   - `calculateSubjectEquilibrium(logs7Days: any[], targetWeights?: Record<string, number>): SubjectEquilibriumReport`
   - Normalized Shannon Entropy Score:
     $$E = \left( \frac{-\sum p_i \ln p_i}{\ln N} \right) \times 100\%$$
     where $p_i = \text{minutes}_i / \text{totalMinutes}$.
     - Status: `harmonious` ($E \ge 90\%$), `mild_skew` ($75\% \le E < 90\%$), `severe_neglect` ($E < 75\%$).
   - Discrete PID corrective allocator:
     $$\Delta M_i = \text{clamp}\left( K_p \cdot e_i + K_i \cdot \sum e_i + K_d \cdot \Delta e_i, -60, +90 \right)$$
     where $e_i = p_i^* - p_i$, $K_p = 120\text{m}$, $K_i = 30\text{m}$, $K_d = 20\text{m}$.
   - Generates natural language actionable prescription (e.g. "⚠️ Chemistry is in a 14% deficit (16% vs 30% target). Prescribed tomorrow: +45 mins Chemistry, reduce Physics by 30 mins.").
2. **`src/components/Analytics.tsx`**:
   - Add "Dynamic Subject Equilibrium Matrix (PID Rebalancer)" section.
   - Live Shannon Entropy Balance gauge / progress meter ($0-100\%$) with status badge (`Harmonious`, `Mild Skew`, `Severe Neglect Alert`).
   - Subject distribution comparison chart / progress bars showing Actual % vs Target % with deficit/surplus indicators.
   - Actionable AI-prescribed daily schedule adjustments for the next study day.
3. **Build & Typecheck Verification**:
   - Run `"C:\Program Files\nodejs\node.exe" node_modules/typescript/bin/tsc --noEmit` and `"C:\Program Files\nodejs\node.exe" node_modules/vite/bin/vite.js build`.
   - Ensure 0 errors.

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Handoff Requirements
Write your detailed report to `C:\Users\white\master-hub\aegis1\.agents\teamwork_preview_worker_m4\handoff.md` and notify the parent orchestrator.
