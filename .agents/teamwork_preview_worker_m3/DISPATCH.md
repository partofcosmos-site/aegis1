## 2026-08-28T22:09:19Z

You are Worker 3 implementing Milestone 3 (R3: Speed vs. Accuracy Calibration Matrix - SACM) for Savantix (Aegis).
Working directory: C:\Users\white\master-hub\aegis1\.agents\teamwork_preview_worker_m3
Project workspace: C:\Users\white\master-hub\aegis1
Original request: C:\Users\white\master-hub\aegis1\.agents\ORIGINAL_REQUEST.md
Dispatch file: C:\Users\white\master-hub\aegis1\.agents\teamwork_preview_worker_m3\DISPATCH.md
Project plan & specs: C:\Users\white\master-hub\aegis1\PROJECT.md and C:\Users\white\master-hub\aegis1\.agents\teamwork_preview_explorer_survey_3\survey_report.md (Section 4)

Assigned files (exclusive write ownership):
- `src/utils/sacmCalculator.ts`
- `src/components/Analytics.tsx`

Tasks:
1. Create `src/utils/sacmCalculator.ts`:
   - `calculateSACMData(sessions: any[], benchmarks?: SACMBenchmarks): SACMReport`
   - Velocity ($V = \text{problemsSolved} \times 60 / \text{durationMinutes}$ in Q/hr).
   - Accuracy ($Acc \in [0, 100\%]$ from `accuracyPercent` or derived from `efficiencyScore * 10`).
   - 4-Quadrant partitioning:
     - Q1 (Top-Right): Flow / Mastery Zone ($V \ge 15$, $Acc \ge 80\%$)
     - Q2 (Top-Left): Deliberate / Overthinking Zone ($V < 15$, $Acc \ge 80\%$)
     - Q3 (Bottom-Right): Rushing / Guessing Zone ($V \ge 15$, $Acc < 80\%$)
     - Q4 (Bottom-Left): Struggling / Fatigued Zone ($V < 15$, $Acc < 80\%$)
   - Diagnostic feedback generation per quadrant with actionable STEM exam guidance.
2. In `src/components/Analytics.tsx`:
   - Add a comprehensive "Speed vs. Accuracy Calibration Matrix (SACM)" section.
   - Interactive Recharts `ScatterChart` with X-axis (Velocity in Q/hr), Y-axis (Accuracy in %), reference lines at $X=15$ and $Y=80$, custom tooltips, and quadrant color coding.
   - 4 Quadrant summary cards with session distribution counts, percentage breakdowns, and actionable diagnostic recommendations.
   - Subject filtering and time range filtering ('7d', '30d', 'all').
3. Verify TypeScript compilation (`"C:\Program Files\nodejs\node.exe" node_modules/typescript/bin/tsc --noEmit`) and Vite build (`"C:\Program Files\nodejs\node.exe" node_modules/vite/bin/vite.js build`).
