# 🛡️ Savantix (Aegis) — Comprehensive Survey Report: Features R1–R5

> **Feature Specifications, Mathematical Formulations, Engine Architectures & Integration Mapping**  
> **Target Platform:** Savantix Production Web Application (`https://savantix.vercel.app/`)  
> **Prepared by:** Explorer 3 (Survey Phase)  
> **Date:** 2026-08-28  

---

## 1. Executive Summary & Architectural Overview

Savantix (Aegis) is an elite study optimization platform engineered for hyper-focused competitive STEM aspirants (JEE Advanced, International Physics Olympiad [IPhO], Mathematics Olympiads, and advanced college research). Competitive STEM preparation demands a balance of **frictionless cognitive flow**, **deep velocity tracking**, **speed-accuracy calibration**, **subject equilibrium**, and **anti-fragile resilience**.

This report establishes the complete mathematical, algorithmic, and architectural blueprint for the 5 core features requested in **R1–R5**:

| Feature ID | Feature Name | Core Mission & Key Differentiator | Integration Target |
| :--- | :--- | :--- | :--- |
| **R1** | **Flowmodoro & Flowtime Engine** | Open-ended count-up stopwatch with dynamic break calculation ($\text{Break} = \text{Focus}/5$), flow state indicator, auto-break transitions, and seamless Pomodoro integration. | `src/components/Pomodoro.tsx`, `src/utils/pomodoroAudioEngine.ts` |
| **R2** | **Sub-Second Voice/Text Micro-Logger** | Frictionless voice/text quick-entry floating bar / modal with sub-second deterministic NLP parser extracting Subject, Topic, Duration, Problems, Accuracy %, and Mistakes. | `src/components/LogInput.tsx`, `src/components/Layout.tsx`, `src/services/voiceService.ts` |
| **R3** | **Speed vs. Accuracy Calibration Matrix (SACM)** | 4-quadrant velocity vs. accuracy scatter plot with automated diagnostic insights (Flow, Overthinking, Rushing, Struggling) and exam benchmark calibration. | `src/components/Analytics.tsx` |
| **R4** | **Dynamic Subject Equilibrium Matrix (PID Allocator)** | Rolling 7-day subject distribution tracker, Shannon entropy equilibrium score ($E \in [0, 100\%]$), and discrete PID controller generating corrective study prescriptions. | `src/components/Analytics.tsx`, `src/components/Dashboard.tsx` |
| **R5** | **Elastic Streak Health Bar & Resilience Token Engine** | 100 HP elastic health bar for anti-fragile streak tracking with decay/recovery dynamics and Resilience Shield Tokens ($\mathcal{T} \in [0, 3]$) for zero-guilt consistency. | `src/components/Dashboard.tsx`, `src/components/StudyHeatmap.tsx`, `src/context/AppContext.tsx` |

---

## 2. R1: Flowmodoro & Flowtime Engine

### 2.1 Problem Analysis & Cognitive Rationale
Traditional Pomodoro timers enforce fixed countdown durations (e.g. 25m or 50m). While effective for routine administrative tasks, fixed alarms severely fragment **deep cognitive flow** during high-level STEM problem solving (e.g., deriving 5-page Lagrangian equations, tackling multivariable calculus integrals, or solving complex rotational mechanics problems). 

**The Flowtime / Flowmodoro Approach:**
1. Work continuously in a count-up stopwatch mode until natural fatigue or natural milestone completion occurs.
2. Calculate earned rest dynamically proportional to the actual uninterrupted focus time.
3. Eliminate artificial cutoff interruptions while preserving structured rest recovery.

---

### 2.2 Mathematical Formulations

#### 1. Dynamic Break Calculation Formula
Let $T_{\text{focus}}$ be the total elapsed focus time in seconds. The dynamic break duration $T_{\text{break}}$ is calculated by:

$$T_{\text{break\_raw}} = \text{round}\left( \frac{T_{\text{focus}}}{\rho} \right)$$

where $\rho$ is the focus-to-break ratio (default $\rho = 5.0$, i.e. 20% of focus duration; configurable to $\rho \in [4.0, 6.0]$).

To prevent degenerate breaks on ultra-short sessions or excessively long breaks on marathon sessions, we apply bounded clamping:

$$T_{\text{break}} = \begin{cases} 
0 & \text{if } T_{\text{focus}} < 300\text{ s (under 5 mins)} \\
\max\left( T_{\text{min\_break}}, \min\left( T_{\text{max\_break}}, \text{round}\left(\frac{T_{\text{focus}}}{\rho}\right) \right) \right) & \text{if } T_{\text{focus}} \ge 300\text{ s}
\end{cases}$$

- Default $T_{\text{min\_break}} = 180\text{ s (3 minutes)}$
- Default $T_{\text{max\_break}} = 1800\text{ s (30 minutes)}$

#### 2. Flow State Intensity Function
As focus time elapses, the cognitive immersion depth $I(t)$ is categorized across 4 psychological stages:

$$\text{Stage}(T_{\text{focus\_mins}}) = \begin{cases}
\text{"Ramp-up / Entering Flow"} & 0 \le T < 15\text{ mins} \\
\text{"Deep Focus Zone"} & 15 \le T < 45\text{ mins} \\
\text{"Hyper-Focus Peak"} & 45 \le T < 90\text{ mins} \\
\text{"Cognitive Fatigue Alert"} & T \ge 90\text{ mins (Gentle chime nudge to take earned break)}
\end{cases}$$

---

### 2.3 State Machine & Transition Diagram

```
       ┌───────────────────────────────────────────────────────────┐
       │                        IDLE MODE                          │
       │   Timer stopped (00:00:00). Mode: 'pomodoro' | 'flow'     │
       └─────────────────────────────┬─────────────────────────────┘
                                     │ Start (Click Play)
                                     ▼
       ┌───────────────────────────────────────────────────────────┐
       │                 ACTIVE FLOW (COUNT-UP)                    │
       │  Stopwatch increments. Live earned break: Math.round(t/5) │
       │  Visualizer active. Binaural 40Hz audio playing.          │
       └──────────────┬─────────────────────────────┬──────────────┘
                      │ Pause                       │ Click "Finish Flow"
                      ▼                             ▼
       ┌──────────────────────────────┐   ┌──────────────────────────────┐
       │         FLOW PAUSED          │   │      BREAK READY MODAL       │
       │  Time held. Resume or Reset  │   │  Logged Focus: 65 mins       │
       └──────────────┬───────────────┘   │  Earned Break: 13 mins       │
                      │                           └──────────────┬───────────────┘
                      │ Resume                                   │ Click "Start Earned Break"
                      └─────────────►                            ▼
                                          ┌──────────────────────────────┐
                                          │      DYNAMIC BREAK TIMER     │
                                          │  Counts DOWN from 13:00 to 0 │
                                          │  Gentle ambient audio        │
                                          └──────────────┬───────────────┘
                                                         │ Break Reaches 00:00
                                                         ▼
                                          ┌──────────────────────────────┐
                                          │       ZEN CHIME ALARM        │
                                          │  Tibetan bowl synthesis      │
                                          │  Auto-ready for next Flow    │
                                          └──────────────────────────────┘
```

---

### 2.4 TypeScript Interfaces & Implementation Specifications

```typescript
export type TimerEngineMode = 'pomodoro' | 'flowmodoro';
export type FlowStateStage = 'ramp_up' | 'deep_flow' | 'hyper_focus' | 'fatigue_warning';

export interface FlowSessionState {
  engineMode: TimerEngineMode;
  isActive: boolean;
  isPaused: boolean;
  elapsedFocusSeconds: number;
  earnedBreakSeconds: number;
  remainingBreakSeconds: number;
  isBreakActive: boolean;
  flowStage: FlowStateStage;
  startTime: number | null;
  targetBreakEndTime: number | null;
}

export interface FlowmodoroConfig {
  focusToBreakRatio: number; // default: 5 (1 min break per 5 min focus)
  minBreakMinutes: number;   // default: 3
  maxBreakMinutes: number;   // default: 30
  fatigueNudgeMinutes: number; // default: 90
  autoStartEarnedBreak: boolean;
  autoLogToContext: boolean;
}
```

#### Break Calculation Helper Code:
```typescript
export function calculateDynamicBreak(focusSeconds: number, config: FlowmodoroConfig): number {
  if (focusSeconds < 300) return 0; // Less than 5 mins earns 0 break
  const rawBreakSecs = Math.round(focusSeconds / config.focusToBreakRatio);
  const minSecs = config.minBreakMinutes * 60;
  const maxSecs = config.maxBreakMinutes * 60;
  return Math.max(minSecs, Math.min(maxSecs, rawBreakSecs));
}

export function getFlowStage(focusMinutes: number): { stage: FlowStateStage; label: string; color: string } {
  if (focusMinutes < 15) {
    return { stage: 'ramp_up', label: 'Entering Flow', color: 'text-blue-400 border-blue-500/30 bg-blue-950/40' };
  } else if (focusMinutes < 45) {
    return { stage: 'deep_flow', label: 'Deep Focus Zone', color: 'text-indigo-400 border-indigo-500/30 bg-indigo-950/40' };
  } else if (focusMinutes < 90) {
    return { stage: 'hyper_focus', label: 'Hyper-Focus Peak', color: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/40' };
  } else {
    return { stage: 'fatigue_warning', label: 'Fatigue Alert (Break Recommended)', color: 'text-amber-400 border-amber-500/30 bg-amber-950/40' };
  }
}
```

---

## 3. R2: Sub-Second Voice/Text Micro-Logger

### 3.1 Problem Analysis & Friction Elimination
Logging study sessions in traditional apps requires navigation to a specific tab, opening a complex form, manually filling dropdowns for subject, topic, start time, end time, problem count, and saving. This high activation energy causes students to procrastinate or abandon tracking.

**The Sub-Second Micro-Logger Blueprint:**
1. **Global Accessibility:** Triggerable via global hotkey (`Alt+L` or `Ctrl+K` / `Cmd+K`) from any view, opening an ultra-minimal floating HUD.
2. **Instant Voice Dictation:** One click on mic or holding spacebar activates real-time speech recognition with live visualizer.
3. **Deterministic Sub-Millisecond NLP Engine:** Parses all key dimensions (Subject, Topic, Duration, Solved, Accuracy, Mood, Mistakes) client-side in $< 5\text{ms}$ with zero API network latency.
4. **Live Token Chips Display:** Shows parsed values in real-time as the user speaks or types.
5. **1-Tap Save / Auto-Commit:** Pressing Enter immediately dispatches the log to `AppContext` and closes the HUD.

---

### 3.2 Natural Language Parsing Engine Specification

#### Supported Speech / Text Patterns:
- `"Did 45m Physics electrostatics 20 questions 85% accuracy"`
- `"2h math integration solved 35 problems 28 correct 7 wrong torque confusion"`
- `"1.5 hrs chemistry organic reaction mechanisms 15 numericals 90% acc felt tired"`
- `"Physics kinematics 50 mins 12 qs high focus"`

#### Extraction Matrix & Regex Rules:

| Entity | Extraction Regex & Logic | Output Normalization |
| :--- | :--- | :--- |
| **Duration** | `/(\d+(?:\.\d+)?)\s*(?:hours?\|hrs?\|h)\b/i`, `/(\d+)\s*(?:minutes?\|mins?\|m)\b/i` | Minutes (integer) |
| **Subject** | Matches keyword lexicon (`physics\|mechanics\|chem\|math\|calculus\|biology\|cs`) | `'Physics' \| 'Chemistry' \| 'Mathematics' \| 'Biology' \| 'Computer Science' \| 'General'` |
| **Topic** | Match known syllabus dictionary + noun phrases before problem markers | Cleaned Topic string |
| **Problems Solved** | `/(\d+)\s*(?:questions?\|problems?\|numericals?\|mcqs?\|qs?\|q)\b/i` | Integer count |
| **Accuracy** | `/(?:accuracy\|acc)[:\s]*(\d+)%/i`, `(\d+)\s*correct\s*(\d+)\s*wrong` | Percentage ($0-100\%$) |
| **Efficiency / Focus** | Cues like `high focus`, `tired`, `exhausted`, `flow`, `distracted` | Score $1-10$ |
| **Mistakes** | `/(?:mistakes?\|errors?\|wrong|confusion with)[:\s]+([^,.;]+)/i` | Array of strings |

---

### 3.3 Complete Deterministic NLP Parser Implementation

```typescript
export interface MicroLogEntity {
  subject: string;
  topic: string;
  subtopic: string;
  durationMinutes: number;
  problemsSolved: number;
  accuracyPercent: number | null;
  mistakes: string[];
  focusScore: number;
  efficiencyScore: number;
  energyMood: string;
  rawText: string;
}

const SUBJECT_KEYWORDS: Record<string, string[]> = {
  Physics: ['physics', 'phy', 'mechanics', 'electrostatics', 'electromagnetism', 'thermodynamics', 'optics', 'kinematics', 'rotation', 'capacitance', 'gravitation', 'waves'],
  Chemistry: ['chemistry', 'chem', 'organic', 'inorganic', 'physical chem', 'thermodynamics', 'equilibrium', 'electrochemistry', 'bonding', 'aldehydes', 'amines', 'p-block'],
  Mathematics: ['math', 'mathematics', 'calculus', 'integration', 'derivative', 'algebra', 'matrices', 'determinants', 'vectors', '3d geometry', 'trigonometry', 'probability'],
  Biology: ['biology', 'bio', 'genetics', 'botany', 'zoology', 'biotech', 'ecology', 'physiology'],
  'Computer Science': ['cs', 'coding', 'algorithms', 'dsa', 'programming', 'python', 'cpp', 'data structures']
};

export function parseMicroLog(input: string): MicroLogEntity {
  const text = input.trim();
  const lower = text.toLowerCase();

  // 1. Duration Parsing (supports "1.5h", "45m", "1h 30m", "90 mins")
  let durationMinutes = 60;
  const hourMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/i);
  const minMatch = lower.match(/(\d+)\s*(?:minutes?|mins?|m)\b/i);
  
  if (hourMatch) {
    durationMinutes = Math.round(parseFloat(hourMatch[1]) * 60);
    if (minMatch) durationMinutes += parseInt(minMatch[1], 10);
  } else if (minMatch) {
    durationMinutes = parseInt(minMatch[1], 10);
  }

  // 2. Problems Solved
  let problemsSolved = 0;
  const probMatch = lower.match(/(?:solved|did|completed|attempted)?\s*(\d+)\s*(?:questions?|problems?|numericals?|mcqs?|qs?|q)\b/i);
  if (probMatch) {
    problemsSolved = parseInt(probMatch[1], 10);
  }

  // 3. Accuracy Parsing
  let accuracyPercent: number | null = null;
  const accDirect = lower.match(/(?:accuracy|acc)[:\s]*(\d+(?:\.\d+)?)%/i) || lower.match(/(\d+(?:\.\d+)?)%\s*(?:accuracy|acc)\b/i);
  const correctWrongMatch = lower.match(/(\d+)\s*(?:correct|right)[\s,]+(\d+)\s*(?:wrong|incorrect|mistakes?)/i);

  if (accDirect) {
    accuracyPercent = Math.min(100, Math.max(0, Math.round(parseFloat(accDirect[1]))));
  } else if (correctWrongMatch) {
    const correct = parseInt(correctWrongMatch[1], 10);
    const wrong = parseInt(correctWrongMatch[2], 10);
    const total = correct + wrong;
    if (total > 0) {
      accuracyPercent = Math.round((correct / total) * 100);
      if (problemsSolved === 0) problemsSolved = total;
    }
  } else if (lower.match(/(\d+)%/)) {
    const rawPct = lower.match(/(\d+)%/);
    if (rawPct) accuracyPercent = parseInt(rawPct[1], 10);
  }

  // 4. Subject Detection
  let detectedSubject = 'General';
  for (const [subj, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    if (keywords.some(kw => new RegExp(`\\b${kw}\\b`, 'i').test(lower))) {
      detectedSubject = subj;
      break;
    }
  }

  // 5. Topic Extraction
  let cleanedText = text
    .replace(/(?:did|solved|completed|practiced)\s+/gi, '')
    .replace(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/gi, '')
    .replace(/(\d+)\s*(?:minutes?|mins?|m)\b/gi, '')
    .replace(/(\d+)\s*(?:questions?|problems?|numericals?|mcqs?|qs?|q)\b/gi, '')
    .replace(/(?:accuracy|acc)[:\s]*\d+%/gi, '')
    .replace(/\d+%\s*(?:accuracy|acc)?/gi, '')
    .replace(/\b(physics|chemistry|mathematics|math|biology|cs)\b/gi, '')
    .trim();

  const parts = cleanedText.split(/[,;\.]/).map(p => p.trim()).filter(Boolean);
  let topic = parts[0] || (detectedSubject !== 'General' ? `${detectedSubject} Practice` : 'Study Session');
  topic = topic.replace(/^[-–—:]+/, '').trim();
  if (topic.length > 80) topic = topic.substring(0, 80);

  // 6. Mistakes Extraction
  const mistakes: string[] = [];
  const mistakeMatch = lower.match(/(?:mistakes?|errors?|wrong|confused with)[:\s]+([^,.;]+)/i);
  if (mistakeMatch && mistakeMatch[1]) {
    mistakes.push(mistakeMatch[1].trim());
  }

  // 7. Focus & Energy Scores
  let focusScore = 8;
  let efficiencyScore = 8;
  let energyMood = 'Normal';

  if (lower.includes('hyper focus') || lower.includes('peak flow') || lower.includes('in the zone')) {
    focusScore = 10;
    efficiencyScore = 10;
    energyMood = 'Peak Flow';
  } else if (lower.includes('tired') || lower.includes('exhausted') || lower.includes('fatigued') || lower.includes('sleepy')) {
    focusScore = 5;
    efficiencyScore = 5;
    energyMood = 'Fatigued';
  } else if (lower.includes('distracted') || lower.includes('slow')) {
    focusScore = 6;
    efficiencyScore = 5;
    energyMood = 'Distracted';
  }

  return {
    subject: detectedSubject,
    topic: topic || 'General Study',
    subtopic: 'Micro-Logged',
    durationMinutes: Math.max(1, durationMinutes),
    problemsSolved,
    accuracyPercent,
    mistakes,
    focusScore,
    efficiencyScore,
    energyMood,
    rawText: text
  };
}
```

---

## 4. R3: Speed vs. Accuracy Calibration Matrix (SACM)

### 4.1 Theoretical Framework & Cognitive Modeling
In high-percentile competitive examinations (such as JEE Advanced, where negative marking penalizes uncalibrated speed, and strict time limits penalize overthinking), an aspirant must calibrate the trade-off between **Velocity ($V$)** and **Accuracy ($Acc$)**.

Conventional dashboards display only total hours studied or total problem counts, concealing whether a student is:
- Rapidly guessing with poor retention (Rushing).
- Spending 20 minutes per standard question out of anxiety (Overthinking).
- Hitting the sweet spot of rapid precision (Mastery Flow).

---

### 4.2 Mathematical Formulations

#### 1. Metric Calculations per Study Session $i$:
- **Duration in Hours:** $H_i = \frac{\text{durationMinutes}_i}{60}$
- **Velocity (Speed in Questions per Hour):**
  $$V_i = \frac{\text{problemsSolved}_i}{H_i} = \frac{\text{problemsSolved}_i \times 60}{\text{durationMinutes}_i}$$
- **Time per Question (Minutes/Question):**
  $$t_{q,i} = \frac{\text{durationMinutes}_i}{\text{problemsSolved}_i}$$
- **Accuracy Percentage ($Acc_i$):**
  $$Acc_i = \text{accuracyPercent}_i \quad (\text{or default derived from efficiency: } Acc_i = \text{efficiencyScore}_i \times 10)$$

#### 2. Quadrant Thresholds & Partitioning:
Let $V_{\text{threshold}}$ be the subject-calibrated target velocity (default $V_{\text{thresh}} = 15\text{ Q/hr}$) and $Acc_{\text{threshold}} = 80\%$.

| Quadrant | Name & Psychological State | Mathematical Condition | Diagnostic & Corrective Prescription |
| :--- | :--- | :--- | :--- |
| **Q1 (Top-Right)** | **Flow / Mastery Zone** | $V_i \ge V_{\text{thresh}} \land Acc_i \ge Acc_{\text{thresh}}$ | **Optimal Fluidity:** High velocity with high accuracy. The student has internalized core patterns. **Action:** Escalate difficulty to Tier 3 / Olympiad / Irodov level problems. |
| **Q2 (Top-Left)** | **Deliberate / Overthinking Zone** | $V_i < V_{\text{thresh}} \land Acc_i \ge Acc_{\text{thresh}}$ | **Precision Bottleneck:** Very accurate but excessively slow. Student re-verifies basic steps or lacks algebraic shortcuts. **Action:** Timed speed-sprints; practice dimensional analysis and elimination heuristics. |
| **Q3 (Bottom-Right)** | **Rushing / Guessing Zone** | $V_i \ge V_{\text{thresh}} \land Acc_i < Acc_{\text{thresh}}$ | **Impulsive Execution:** Fast but prone to sign errors, misreading question stems, and calculation blunders. **Action:** Enforce a mandatory 30-second problem decomposition pause before writing formulas. |
| **Q4 (Bottom-Left)** | **Struggling / Fatigued Zone** | $V_i < V_{\text{thresh}} \land Acc_i < Acc_{\text{thresh}}$ | **Cognitive Overload / Gaps:** Slow and inaccurate. Indicates deep prerequisite knowledge gaps or extreme fatigue. **Action:** Downshift to concept review; use Socratic STEM solver hints; enforce an active break. |

---

### 4.3 Visual Layout & Interactive Chart Specification

```
      Accuracy (%)
         100% ▲
              │         Q2: OVERTHINKING          │            Q1: FLOW / MASTERY
              │  (High Precision, Low Velocity)   │   (High Precision, High Velocity)
              │                                   │
              │  ● Physics Optics (92%, 8 Q/h)    │   ● Math Calculus (90%, 22 Q/h)
          80% ┼───────────────────────────────────┼──────────────────────────────────── (Acc Threshold = 80%)
              │                                   │
              │  ● Organic Mechanisms (60%, 6 Q/h)│   ● Rotational Dynamics (65%, 26 Q/h)
              │         Q4: STRUGGLING            │            Q3: RUSHING
              │   (Low Precision, Low Velocity)   │   (Low Precision, High Velocity)
           0% └───────────────────────────────────┴────────────────────────────────────► Velocity
              0                              15 Q/hr                                40 Q/hr
                                         (Speed Threshold)
```

#### Recharts ScatterPlot Data Structure:
```typescript
export interface SACMDataPoint {
  id: string;
  date: string;
  subject: string;
  topic: string;
  velocityQpH: number;     // X-Axis (Questions / Hour)
  timePerQuestionMin: number;
  accuracyPercent: number; // Y-Axis (0 - 100%)
  problemsSolved: number;
  durationMinutes: number;
  quadrant: 'Q1_Mastery' | 'Q2_Overthinking' | 'Q3_Rushing' | 'Q4_Struggling';
}
```

---

## 5. R4: Dynamic Subject Equilibrium Matrix (PID Allocator)

### 5.1 The Subject Skew / Cognitive Neglect Problem
STEM competitive aspirants naturally gravitate toward their highest-confidence subjects ("comfort-zone bias"), neglecting challenging subjects (e.g. studying 5 hours of Physics Mechanics daily while ignoring Inorganic Chemistry coordination compounds). Over a 30-day window, this introduces severe percentile imbalances.

The **Dynamic Subject Equilibrium Matrix** continuously tracks rolling 7-day distributions, evaluates **Shannon Entropy Balance**, and runs a **PID Corrective Allocator** that computes exact daily study prescriptions to bring the system back into dynamic equilibrium.

---

### 5.2 Mathematical Formulations

#### 1. Rolling 7-Day Subject Allocation
Let $S = \{s_1, s_2, \dots, s_N\}$ be the set of active subjects (e.g. Physics, Chemistry, Mathematics, Biology).  
Let $T_i$ be the total study minutes allocated to subject $s_i$ in the past 7 days:

$$T_{\text{total}} = \sum_{i=1}^N T_i$$

The observed probability distribution vector $P = (p_1, p_2, \dots, p_N)$ is:

$$p_i = \frac{T_i}{T_{\text{total}}} \quad \text{where } \sum_{i=1}^N p_i = 1$$

#### 2. Shannon Entropy & Normalized Equilibrium Index ($E$)
The Shannon Information Entropy $H(P)$ measures the dispersion and uniformity of study distribution:

$$H(P) = -\sum_{i=1}^N p_i \ln(p_i) \quad (\text{with } 0 \ln 0 \equiv 0)$$

The maximum possible entropy occurs at perfect parity ($p_i = 1/N$ for all $i$):

$$H_{\text{max}} = \ln(N)$$

The Normalized Equilibrium Score $E \in [0, 100\%]$ is:

$$E = \left( \frac{H(P)}{H_{\text{max}}} \right) \times 100\% = \left( \frac{-\sum_{i=1}^N p_i \ln(p_i)}{\ln(N)} \right) \times 100\%$$

- **$E \ge 90\%$:** *Harmonious Equilibrium* (optimal multi-subject progression).
- **$75\% \le E < 90\%$:** *Mild Skew* (minor corrective adjustments needed).
- **$E < 75\%$:** *Severe Imbalance / High Neglect Hazard* (automated PID intervention triggered).

#### 3. PID Corrective Allocator
Let $p_i^*$ be the target allocation fraction for subject $i$ (e.g. for JEE: $p_{\text{Phy}}^* = 0.35, p_{\text{Math}}^* = 0.35, p_{\text{Chem}}^* = 0.30$).

The error signal on day $k$ is:

$$e_i(k) = p_i^* - p_i(k)$$

The discrete PID control output $\Delta M_i$ (recommended adjustment in daily minutes) is:

$$\Delta M_i(k) = K_p \cdot e_i(k) + K_i \cdot \sum_{j=0}^{W} e_i(k-j) + K_d \cdot \left[ e_i(k) - e_i(k-1) \right]$$

- **Proportional Term ($K_p = 120\text{ mins}$):** Corrects immediate current-day allocation deficits.
- **Integral Term ($K_i = 30\text{ mins}$, rolling window $W = 7$):** Eliminates chronic long-term neglect.
- **Derivative Term ($K_d = 20\text{ mins}$):** Dampens rapid over-correction oscillations.

**Output Clamping:**
$$\Delta M_i = \text{clamp}(\Delta M_i, -60\text{ mins}, +90\text{ mins})$$

---

### 5.3 Concrete Algorithm & Prescription Generator

```typescript
export interface SubjectEquilibriumReport {
  equilibriumScore: number; // 0 - 100%
  status: 'harmonious' | 'mild_skew' | 'severe_neglect';
  subjectDistributions: Array<{
    subject: string;
    actualMinutes: number;
    actualPercentage: number;
    targetPercentage: number;
    deficitPercentage: number;
    recommendedDailyAdjustmentMins: number;
  }>;
  actionablePrescription: string;
}

export function calculateSubjectEquilibrium(
  logs7Days: any[],
  targetWeights: Record<string, number> = { Physics: 0.35, Mathematics: 0.35, Chemistry: 0.30 }
): SubjectEquilibriumReport {
  const activeSubjects = Object.keys(targetWeights);
  const timeMap: Record<string, number> = {};
  activeSubjects.forEach(s => timeMap[s] = 0);

  logs7Days.forEach(l => {
    const sub = l.subject || 'General';
    const norm = activeSubjects.find(s => s.toLowerCase() === sub.toLowerCase()) || 'Other';
    if (timeMap[norm] !== undefined) {
      timeMap[norm] += Math.max(0, Number(l.durationMinutes)) || 0;
    }
  });

  const totalMinutes = Object.values(timeMap).reduce((a, b) => a + b, 0);
  if (totalMinutes === 0) {
    return {
      equilibriumScore: 100,
      status: 'harmonious',
      subjectDistributions: activeSubjects.map(s => ({
        subject: s,
        actualMinutes: 0,
        actualPercentage: 0,
        targetPercentage: Math.round(targetWeights[s] * 100),
        deficitPercentage: 0,
        recommendedDailyAdjustmentMins: 0
      })),
      actionablePrescription: 'No study logs found in the past 7 days. Start logging to build equilibrium.'
    };
  }

  // Shannon Entropy
  const N = activeSubjects.length;
  let entropy = 0;
  activeSubjects.forEach(s => {
    const p = timeMap[s] / totalMinutes;
    if (p > 0) {
      entropy += -p * Math.log(p);
    }
  });

  const maxEntropy = Math.log(N);
  const equilibriumScore = Math.min(100, Math.max(0, Math.round((entropy / maxEntropy) * 100)));

  // PID Correction calculation
  const Kp = 120; // Proportional gain
  const dists = activeSubjects.map(s => {
    const pActual = timeMap[s] / totalMinutes;
    const pTarget = targetWeights[s];
    const error = pTarget - pActual;
    const recommendedMins = Math.max(-60, Math.min(90, Math.round(Kp * error)));

    return {
      subject: s,
      actualMinutes: timeMap[s],
      actualPercentage: Math.round(pActual * 100),
      targetPercentage: Math.round(pTarget * 100),
      deficitPercentage: Math.round(error * 100),
      recommendedDailyAdjustmentMins: recommendedMins
    };
  });

  const neglected = dists.filter(d => d.deficitPercentage > 10).sort((a, b) => b.deficitPercentage - a.deficitPercentage);
  const overAllocated = dists.filter(d => d.deficitPercentage < -10).sort((a, b) => a.deficitPercentage - b.deficitPercentage);

  let status: 'harmonious' | 'mild_skew' | 'severe_neglect' = 'harmonious';
  if (equilibriumScore < 75) status = 'severe_neglect';
  else if (equilibriumScore < 90) status = 'mild_skew';

  let actionablePrescription = 'Study time is well balanced across all disciplines.';
  if (neglected.length > 0) {
    const neg = neglected[0];
    const over = overAllocated[0];
    actionablePrescription = `⚠️ ${neg.subject} is in a ${neg.deficitPercentage}% deficit (${neg.actualPercentage}% vs ${neg.targetPercentage}% target). Prescribed tomorrow: +${neg.recommendedDailyAdjustmentMins} mins ${neg.subject}${over ? `, reduce ${over.subject} by ${Math.abs(over.recommendedDailyAdjustmentMins)} mins` : ''}.`;
  }

  return {
    equilibriumScore,
    status,
    subjectDistributions: dists,
    actionablePrescription
  };
}
```

---

## 6. R5: Elastic Streak Health Bar & Resilience Token Engine

### 6.1 The Anti-Fragile Gamification Paradigm
Traditional all-or-nothing streak counters suffer from the **"Streak Fragility Trap"**: a student who studies 60 consecutive days and catches a fever on Day 61 sees their streak reset to `0`. This induces the cognitive *"what-the-hell effect"*, leading to extended dropouts.

**The Elastic Health & Resilience Token Model:**
- Replaces binary pass/fail streaks with a **100 HP Health Bar** that absorbs fluctuations.
- Introduces **Resilience Shield Tokens ($\mathcal{T} \in [0, 3]$)** earned through surplus effort that automatically deploy to defend the student's streak during emergencies or rest days.

---

### 6.2 Mathematical Model & Game Mechanics

```
      ┌────────────────────────────────────────────────────────┐
      │         ELASTIC STREAK & RESILIENCE ENGINE             │
      │   HP: [██████████████████████████░░] 85 / 100 HP        │
      │   Shields: 🛡️ 🛡️ ⚪ (2 / 3 Charged)                      │
      │   Active Streak: 🔥 42 Days                           │
      └──────────────────────────┬─────────────────────────────┘
                                 │
                 Daily Midnight Evaluation ($T_{\text{actual}}$ vs $T_{\text{target}}$)
                                 │
        ┌────────────────────────┴────────────────────────┐
        │                                                 │
        ▼ ($T_{\text{actual}} = 0$)                       ▼ ($T_{\text{actual}} \ge T_{\text{target}}$)
┌────────────────────────────────┐               ┌────────────────────────────────┐
│       MISSED STUDY DAY         │               │     TARGET ACHIEVED DAY        │
│ Check Shield Tokens Inventory: │               │ Health Recovery:               │
│ • If $\mathcal{T} > 0$:        │               │ • HP $\leftarrow \min(100, HP + 15)$
│   $\mathcal{T} \leftarrow \mathcal{T} - 1$     │ Consecutive Streak $+1$        │
│   HP Protected (0 loss)        │               │ Surplus Overdrive Bonus:       │
│   Streak FROZEN (Preserved)    │               │ If $T_{\text{actual}} \ge 1.5 \times T_{\text{target}}$:
│ • If $\mathcal{T} = 0$:        │               │   HP $\leftarrow \min(100, HP + 25)$
│   $HP \leftarrow HP - 35$      │               │   Charge $+1$ Shield Token     │
│   If $HP \le 0 \implies$ Reset │               └────────────────────────────────┘
└────────────────────────────────┘
```

#### 1. HP Decay Function:
$$\Delta HP = \begin{cases} 
0 & \text{if } \mathcal{T} > 0 \land T_{\text{actual}} = 0 \text{ (Shield auto-consumed)} \\
-35\text{ HP} & \text{if } \mathcal{T} = 0 \land T_{\text{actual}} = 0 \text{ (Zero study, no shield)} \\
-20 \times \left(1 - \frac{T_{\text{actual}}}{T_{\text{target}}}\right)\text{ HP} & \text{if } 0 < T_{\text{actual}} < T_{\text{target}} \text{ (Partial study day)} \\
0\text{ HP} & \text{if } T_{\text{actual}} \ge T_{\text{target}}
\end{cases}$$

#### 2. HP Recovery Function:
$$\Delta HP = \begin{cases} 
+15\text{ HP} & \text{if } T_{\text{actual}} \ge T_{\text{target}} \\
+25\text{ HP} & \text{if } T_{\text{actual}} \ge 1.5 \times T_{\text{target}} \text{ (Overdrive study)}
\end{cases}$$

$$\text{New } HP = \min(100, \max(0, HP_{\text{prev}} + \Delta HP))$$

#### 3. Resilience Token Earning & Capping:
$$\mathcal{T}_{\text{new}} = \min\left(3, \mathcal{T}_{\text{prev}} + \mathbf{1}_{\{ \text{ConsecutiveTargetDays} \pmod 5 = 0 \lor T_{\text{actual}} \ge 1.5 \cdot T_{\text{target}} \}}\right)$$

#### 4. Streak Continuity Rule:
$$\text{Streak} = \begin{cases} 
\text{Streak} + 1 & \text{if } T_{\text{actual}} \ge T_{\text{target}} \\
\text{Streak} & \text{if } T_{\text{actual}} < T_{\text{target}} \land (\mathcal{T}_{\text{consumed}} \lor HP > 0) \text{ (Protected / Degraded)} \\
0 & \text{if } HP = 0 \land \mathcal{T} = 0
\end{cases}$$

---

### 6.3 TypeScript Data Structures & Persistence

```typescript
export interface ElasticStreakState {
  currentHP: number;         // 0 - 100
  maxHP: number;             // 100
  shieldTokens: number;      // 0 - 3
  maxShieldTokens: number;   // 3
  activeStreakDays: number;
  longestStreakDays: number;
  lastEvaluatedDate: string; // 'yyyy-MM-dd'
  history: Array<{
    date: string;
    actualMinutes: number;
    targetMinutes: number;
    hpDelta: number;
    hpResult: number;
    shieldUsed: boolean;
    shieldEarned: boolean;
  }>;
}

export const DEFAULT_STREAK_STATE: ElasticStreakState = {
  currentHP: 100,
  maxHP: 100,
  shieldTokens: 2, // Start with 2 onboarding shield tokens
  activeStreakDays: 0,
  longestStreakDays: 0,
  lastEvaluatedDate: format(new Date(), 'yyyy-MM-dd'),
  history: []
};
```

---

## 7. Cross-Feature Integration & Layout Blueprint

### 7.1 Component Integration Map

```
src/
├── components/
│   ├── Pomodoro.tsx             ◄── [R1: Flowmodoro Count-Up & Dynamic Break Engine]
│   ├── LogInput.tsx             ◄── [R2: Sub-Second Voice/Text Micro-Logger Bar]
│   ├── MicroLoggerModal.tsx     ◄── [R2: Global Floating Hotkey HUD (Alt+L)]
│   ├── Analytics.tsx            ◄── [R3: SACM 4-Quadrant Matrix] & [R4: Subject Equilibrium PID]
│   ├── Dashboard.tsx            ◄── [R5: Elastic 100 HP Health Bar & Resilience Shields]
│   ├── StudyHeatmap.tsx         ◄── [R5: Streak integration with HP status indicators]
│   └── Layout.tsx               ◄── [Global shortcut listener for MicroLogger HUD]
├── utils/
│   ├── pomodoroAudioEngine.ts   ◄── [R1: Chime triggers for Flow completion]
│   ├── microLogParser.ts        ◄── [R2: Deterministic sub-millisecond NLP regex engine]
│   ├── sacmCalculator.ts        ◄── [R3: Speed vs Accuracy calibration algorithms]
│   ├── pidEquilibriumEngine.ts  ◄── [R4: Shannon Entropy & PID study allocators]
│   └── streakResilienceEngine.ts◄── [R5: Elastic HP decay/recovery & shield token engine]
└── context/
    └── AppContext.tsx           ◄── [State persistence in localStorage / Firestore]
```

---

### 7.2 Storage Keys & Schema Contract

| Storage Key | Type | Description |
| :--- | :--- | :--- |
| `savantix_flowmodoro_config_v1` | `FlowmodoroConfig` | Stores break ratio, min/max limits, auto-start preferences. |
| `savantix_streak_resilience_v1` | `ElasticStreakState` | Stores HP (0-100), shield tokens (0-3), streak days, and evaluation logs. |
| `savantix_sacm_benchmark_v1` | `Record<string, number>` | Stores subject speed thresholds (Q/hr) and accuracy targets. |
| `savantix_pid_weights_v1` | `Record<string, number>` | Stores target subject allocation fractions (Physics 35%, Math 35%, Chem 30%). |

---

## 8. Verification & Performance Criteria

1. **Deterministic Latency:** Micro-log NLP parser must execute in $< 5\text{ms}$ on modern browsers without network dependencies.
2. **Drift-Free Precision:** Flowmodoro count-up stopwatch must utilize wall-clock `performance.now()` / timestamp deltas to guarantee zero background drift.
3. **Responsive UI & Clean Build:** Zero TypeScript compilation errors (`tsc --noEmit` / `vite build`).
4. **State Integrity:** All states (Health HP, Shield tokens, Flow sessions, Benchmark thresholds) must seamlessly recover from page reloads.

---
*End of Survey Report for R1–R5.*
