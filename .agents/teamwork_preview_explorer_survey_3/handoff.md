# Handoff Report — Explorer 3: Feature Specifications (R1–R5)

## 1. Observation
1. **Existing Timer Architecture (`src/components/Pomodoro.tsx:135-296`)**:
   - The timer exclusively runs fixed countdown intervals (`focusDuration * 60`, `shortBreakDuration * 60`, `longBreakDuration * 60`).
   - Line 136: `const [timeLeft, setTimeLeft] = useState<number>(focusDuration * 60);`.
   - Line 284: Decrements `timeLeft = Math.max(0, Math.ceil((targetEndTimeRef.current - Date.now()) / 1000));`.
   - There is no count-up stopwatch mode, no dynamic break calculator, and no real-time flow state indicator.

2. **Existing Logging Engine (`src/components/LogInput.tsx:109-151`, `src/services/universalAIService.ts:923-1053`)**:
   - `LogInput.tsx` sends study strings to `UniversalAIService.parseStudyLog(text)` which calls external LLM providers over HTTP, introducing 1–3 second latency or failure if offline/unauthenticated.
   - The fallback local parser (`universalAIService.ts:923-1002`) handles only duration, problem count, and basic subjects, omitting accuracy %, mood/energy levels, and structured tag entities.
   - Logging is only accessible when navigating directly to Dashboard (`src/components/Dashboard.tsx:120`), lacking a global floating/hotkey HUD.

3. **Existing Analytics Engine (`src/components/Analytics.tsx:120-277`)**:
   - Lines 238–241: Calculates linear speed as a scalar: `velocity = data.problems > 0 && hours > 0 ? Number((data.problems / hours).toFixed(1)) : 0`.
   - Lacks 2D Speed vs. Accuracy scatter analysis, 4-quadrant calibration (Flow vs Overthinking vs Rushing vs Struggling), and quadrant diagnostic recommendations.

4. **Existing Subject Breakdown (`src/components/Analytics.tsx:194-205`)**:
   - Computes basic subject proportions (`percentage: totalMinutes > 0 ? Math.round((data.minutes / totalMinutes) * 100) : 0`).
   - Lacks rolling entropy balance evaluation ($H = -\sum p_i \ln p_i$) and automated PID corrective study prescriptions.

5. **Existing Streak Tracking (`src/components/StudyHeatmap.tsx:118-152`)**:
   - Streak is strictly binary: `tempStreak++` on active days, `tempStreak = 0` on zero-minute days (lines 124–130).
   - Missing elastic health decay/recovery mechanics and shield token absorption.

---

## 2. Logic Chain
1. **R1 (Flowmodoro)**: By adding a dual-mode toggle (`mode: 'pomodoro' | 'flowmodoro'`) and a count-up timer accumulating elapsed focus seconds, we compute $T_{\text{break}} = \text{clamp}(180, 1800, \text{round}(T_{\text{focus}} / 5))$. Flow state indicators transition seamlessly based on elapsed duration (0-15m Ramp-up, 15-45m Deep Flow, 45-90m Hyper-Focus, 90m+ Fatigue Alert).
2. **R2 (Micro-Logger)**: Implementing a client-side deterministic regex/NLP parser (`microLogParser.ts`) extracts Subject, Topic, Duration, Questions, Accuracy %, Mistakes, and Energy in $< 5\text{ms}$ with zero network overhead. Mounting a global hotkey HUD (`Alt+L` / `Ctrl+K`) in `Layout.tsx` enables sub-second one-tap logging from any screen.
3. **R3 (SACM)**: By plotting Velocity ($V = \text{Problems} / \text{Hours}$) against Accuracy ($Acc \in [0, 100\%]$) on a 4-quadrant scatter chart with thresholds $V = 15\text{ Q/hr}$ and $Acc = 80\%$, we provide tailored diagnostics for Flow/Mastery (Q1), Overthinking (Q2), Rushing (Q3), and Fatigue (Q4).
4. **R4 (Subject Equilibrium)**: Tracking rolling 7-day subject minutes allows computing normalized Shannon Entropy $E = \frac{-\sum p_i \ln p_i}{\ln N} \times 100\%$. The discrete PID allocator calculates corrective daily minute adjustments $\Delta M_i = \text{clamp}(K_p \cdot e_i + K_i \cdot \sum e_i + K_d \cdot \Delta e_i, -60, +90)$ to eliminate subject neglect.
5. **R5 (Elastic Streak Health & Resilience Tokens)**: Replacing brittle binary resets with a 100 HP health bar (decaying by $-35\text{ HP}$ on zero days or $-20(1 - T_{\text{actual}}/T_{\text{target}})$ on partial days; recovering $+15\text{ to }+25\text{ HP}$ on target days) coupled with up to 3 Resilience Shield Tokens ensures an anti-fragile consistency engine.

---

## 3. Caveats
- No modifications have been made to application source code during this survey phase (adhering strictly to integrity rules).
- Default benchmark thresholds ($V = 15\text{ Q/hr}$, $Acc = 80\%$, target weights Physics 35%, Math 35%, Chem 30%) are initial defaults and can be customized per student.

---

## 4. Conclusion
The comprehensive feature specifications, mathematical formulations, engine architectures, TypeScript schemas, and integration points for R1–R5 are fully established and documented in `C:\Users\white\master-hub\aegis1\.agents\teamwork_preview_explorer_survey_3\survey_report.md`. The design is ready for immediate implementation.

---

## 5. Verification Method
- Inspect the survey report: `C:\Users\white\master-hub\aegis1\.agents\teamwork_preview_explorer_survey_3\survey_report.md`.
- Verify formulas:
  1. $T_{\text{break}} = \text{round}(T_{\text{focus}} / 5)$ with clamp $[180, 1800]$ seconds.
  2. Shannon Entropy $E = \frac{-\sum_{i=1}^N p_i \ln(p_i)}{\ln(N)} \times 100\%$.
  3. PID Allocator $\Delta M_i = K_p e_i + K_i \sum e_i + K_d \Delta e_i$.
  4. SACM Quadrant partitioning: $V_{\text{thresh}} = 15\text{ Q/hr}$, $Acc_{\text{thresh}} = 80\%$.
  5. Elastic HP decay $\Delta HP \in [-35, +25]$ and Resilience Shield Tokens $\mathcal{T} \in [0, 3]$.
- Invalidation condition: Inconsistencies between mathematical formulas and practical TypeScript interfaces.
