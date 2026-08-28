# Survey Task 3: Feature Specifications, Formulas, Math & Integration Mapping for R1-R5

## Working Directory
`C:\Users\white\master-hub\aegis1\.agents\teamwork_preview_explorer_survey_3`

## Project Workspace
`C:\Users\white\master-hub\aegis1`

## Original Request Path
`C:\Users\white\master-hub\aegis1\.agents\ORIGINAL_REQUEST.md`

## Mission
You are Explorer 3 on the Survey phase. Read `ORIGINAL_REQUEST.md` and thoroughly investigate the codebase and domain logic to specify the 5 features:
1. **R1: Flowmodoro & Flowtime Engine**:
   - Stopwatch count-up mode vs traditional countdown Pomodoro.
   - Dynamic break calculation formula (`Break = Math.round(FocusMinutes / 5)` or configurable ratio).
   - Mode switcher (Pomodoro vs Flowtime), flow state indicators, auto-break transitions, session recording.
2. **R2: Sub-Second Voice/Text Micro-Logger**:
   - Voice recognition via Web Speech API (`webkitSpeechRecognition` / `SpeechRecognition`) with fallback.
   - Natural language parsing engine (extracting Subject, Topic, Duration, Questions Solved, Accuracy %, Mood/Energy, Tags from strings like "Did 45m Physics electrostatics 20 questions 85% accuracy").
   - Frictionless quick-entry modal / floating micro-logger bar accessible from any tab or hotkey.
3. **R3: Speed vs. Accuracy Calibration Matrix (SACM)**:
   - 4-Quadrant scatter plot / matrix (Q1: High Velocity + High Accuracy = Flow/Mastery, Q2: Low Velocity + High Accuracy = Deliberate/Overthinking, Q3: High Velocity + Low Accuracy = Rushing/Guessing, Q4: Low Velocity + Low Accuracy = Struggling/Fatigued).
   - Metrics: Questions per Hour / Speed (min/question) vs Accuracy %.
   - Diagnostic insights and recommendations per quadrant.
4. **R4: Dynamic Subject Equilibrium Matrix (PID Allocator)**:
   - Rolling 7-day time/session distribution across subjects (e.g. Physics, Chemistry, Math, etc.).
   - Shannon entropy / equilibrium balance score calculation (`-sum(p_i * ln(p_i)) / ln(N)` normalized 0-100%).
   - PID / corrective target recommendations for neglected subjects to restore balance.
5. **R5: Elastic Streak Health Bar & Resilience Token Engine**:
   - 100 HP Health Bar for study consistency (decay on missed days or under-target days, recovery on high focus days).
   - Resilience Shield Tokens (tokens earned by consecutive perfection or surplus study, auto-consumed to freeze streak or absorb HP penalty on missed/off days).
   - Integration into Dashboard and streak badge display.

## Output Requirements
Write your detailed findings and evidence report to:
`C:\Users\white\master-hub\aegis1\.agents\teamwork_preview_explorer_survey_3\survey_report.md`
And summarize in `handoff.md`.
Then send a completion message to parent.
