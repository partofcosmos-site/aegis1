# 🔬 Savantix (Aegis) Survey Report 2: Component Architecture & UI System

**Prepared by:** Explorer 2 (Component Architecture & UI Specialist)  
**Date:** 2026-08-28T22:05:00Z  
**Workspace:** `C:\Users\white\master-hub\aegis1`  
**Target Platform:** Savantix Production (`https://savantix.vercel.app/`)  

---

## Executive Summary

A comprehensive architectural investigation of the Savantix front-end UI and component system was conducted across React 19, TypeScript, Tailwind CSS v4, Lucide React, and Recharts. The application utilizes a **Persistent Tab Viewport** architecture inside `src/App.tsx`, preserving running timers, audio synthesizers, AI streaming solvers, and background state across navigation switches without unmounting.

This report documents the exact structures, state machines, audio pipelines, data flows, and UI integration hooks for:
1. **Component Hierarchy & Persistent Tab Viewport (`App.tsx`, `Layout.tsx`)**
2. **Timer & Pomodoro Architecture (`Pomodoro.tsx`, `pomodoroAudioEngine.ts`, `youtubeAudioService.ts`)**
3. **Dashboard Architecture (`Dashboard.tsx`, `StudyHeatmap.tsx`, `ExamCountdown.tsx`, `InsightsPanel.tsx`)**
4. **Analytics & Velocity Architecture (`Analytics.tsx`, Recharts Suite, Data Mobility)**
5. **Micro-Loggers, Voice Input & Modal Systems (`LogInput.tsx`, `voiceService.ts`, `universalAIService.ts`)**
6. **Detailed Integration Maps for Requirements R1 through R5**

---

## 1. Component Hierarchy & Navigation Architecture

### 1.1 Root Component Tree (`src/App.tsx`)
In `src/App.tsx` (lines 17–61), the application initializes a 4-tier provider wrapper:
```
ErrorBoundary (src/components/ErrorBoundary.tsx)
  └── AppProvider (src/context/AppContext.tsx)
        └── AuthWrapper (src/components/AuthWrapper.tsx)
              └── Layout (src/components/Layout.tsx)
                    ├── [Viewport 1] Dashboard (src/components/Dashboard.tsx)
                    ├── [Viewport 2] Analytics (src/components/Analytics.tsx)
                    ├── [Viewport 3] StemSolver (src/components/StemSolver.tsx)
                    ├── [Viewport 4] ConceptGraph (src/components/ConceptGraph.tsx)
                    ├── [Viewport 5] Chatbot (src/components/Chatbot.tsx)
                    ├── [Viewport 6] Flashcards (src/components/Flashcards.tsx)
                    ├── [Viewport 7] Journal (src/components/Journal.tsx)
                    ├── [Viewport 8] Goals (src/components/Goals.tsx)
                    ├── [Viewport 9] Pomodoro (src/components/Pomodoro.tsx)
                    └── [Viewport 10] Settings (src/components/Settings.tsx)
```

### 1.2 Persistent Tab Viewport Pattern
`src/App.tsx` uses CSS class visibility toggling rather than conditional unmounting:
```tsx
// src/App.tsx lines 25-56
{/* Persistent Tab Viewport: Preserves background streams, solvers & timers across tab switches */}
<div className={`h-full w-full ${activeTab === 'dashboard' ? 'block' : 'hidden'}`}>
  <Dashboard />
</div>
<div className={`h-full w-full ${activeTab === 'analytics' ? 'block' : 'hidden'}`}>
  <Analytics />
</div>
...
<div className={`h-full w-full ${activeTab === 'pomodoro' ? 'block' : 'hidden'}`}>
  <Pomodoro />
</div>
```
**Architectural Significance:**
- Web Audio synthesis nodes (Binaural beats, Brownian noise) and wall-clock interval timers remain active when switching tabs.
- Unsaved draft logs, chat streaming sessions, and solver derivations persist uninterrupted.

### 1.3 Navigation Shell (`src/components/Layout.tsx`)
- Sidebar layout with responsive mobile header (lines 60–131).
- Navigation tabs list (lines 45–56) with icons:
  1. `dashboard` (LayoutDashboard)
  2. `analytics` (BarChart2)
  3. `solver` (Sparkles)
  4. `graph` (Network)
  5. `chat` (MessageSquare)
  6. `flashcards` (Layers)
  7. `journal` (BookOpen)
  8. `goals` (Target)
  9. `pomodoro` (Clock)
  10. `settings` (Settings)
- Founder recognition badge for `debanjan8686@gmail.com` and `partofcosmmos@gmail.com` (lines 43, 118–120).

---

## 2. Timer & Pomodoro Component Architecture

### 2.1 State Machine & Timer Mechanics (`src/components/Pomodoro.tsx`)
The timer engine is implemented in `src/components/Pomodoro.tsx` (1,456 lines).

#### Core State Variables:
- `mode`: `'focus' | 'short_break' | 'long_break'` (line 135)
- `timeLeft`: remaining seconds (line 136)
- `isActive`: boolean running state (line 137)
- `sessionCount`: current cycle index towards long break (line 138)
- `totalCompletedCycles`: cumulative focus blocks completed (line 139)
- `targetEndTimeRef`: `useRef<number | null>(null)` for driftless wall-clock timing (line 141)

#### Drift-Free Wall-Clock Timer Loop (lines 272–295):
```typescript
useEffect(() => {
  let interval: NodeJS.Timeout;

  if (isActive) {
    if (!targetEndTimeRef.current) {
      targetEndTimeRef.current = Date.now() + timeLeft * 1000;
    }

    interval = setInterval(() => {
      if (!targetEndTimeRef.current) return;
      const remaining = Math.max(0, Math.ceil((targetEndTimeRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        handleTimerCompletion();
      }
    }, 250);
  } else {
    targetEndTimeRef.current = null;
  }

  return () => clearInterval(interval);
}, [isActive, mode, focusDuration, shortBreakDuration, longBreakDuration, timeLeft, sessionCount, longBreakInterval]);
```

### 2.2 Audio Engine & Binaural Synthesizer (`src/utils/pomodoroAudioEngine.ts`)
The audio engine uses the native HTML5 Web Audio API:
- `AudioContext`, `GainNode`, `AnalyserNode`, `OscillatorNode`, `AudioBufferSourceNode`.
- Presets (`SOUND_PRESETS`, lines 24–98):
  1. `gamma_40hz`: 200Hz carrier + 40Hz binaural shift (Deep cognitive entrainment).
  2. `alpha_10hz`: 196Hz carrier + 10Hz binaural beat (Flow state).
  3. `brown_noise`: 1/f² Brownian noise generator filtered at 400Hz.
  4. `pink_noise`: 1/f equal energy per octave noise generator.
  5. `white_noise`: Uniform full-spectrum white noise.
  6. `rain_ambient`: Synthesized organic rain textures with low-pass filtering.
  7. `cafe_ambient`: Warm analog pad harmonic ambience.
  8. `lofi_beats`: Fallback-resilient Lo-Fi audio stream.
- Audio completion chime: `playCompletionChime()` synthesized Tibetan Zen chime played at session end (lines 299–302).

### 2.3 YouTube Distraction-Free Audio Engine (`src/services/youtubeAudioService.ts`)
- Curated focus playlists (`CURATED_FOCUS_TRACKS`) + live YouTube search + custom video ID stream player.

### 2.4 Automatic Session Logging (`Pomodoro.tsx` lines 422–451)
When a focus session finishes, `handleTimerCompletion()` triggers `handleLogSession()`:
```typescript
await addLog({
  rawText: `Pomodoro Focus: ${logTopic} (${finalDuration} min)`,
  subject: logSubject,
  topic: logTopic,
  subtopic: 'Pomodoro Focus Block',
  durationMinutes: finalDuration,
  problemsSolved: activeTask?.isCompleted ? 1 : 0,
  mistakes: [],
  efficiencyScore: 9,
  focusScore: 10,
  date: format(new Date(), 'yyyy-MM-dd')
});
```

### 2.5 Extension Hooks for R1 (Flowmodoro & Flowtime Engine):
- Current timer mode union `'focus' | 'short_break' | 'long_break'` can be cleanly expanded with `'flowmodoro'` (or a dedicated mode toggle).
- Count-up stopwatch accumulator (`elapsedSeconds`) tracking cognitive flow state.
- Dynamic break formula: `calculatedBreakSeconds = Math.round(flowFocusSeconds / 5)`.
- Smooth transition trigger: Upon stopping flow focus, user is prompted to begin the proportional break timer.

---

## 3. Dashboard Component Architecture

### 3.1 Overview & Sub-components (`src/components/Dashboard.tsx`)
The Dashboard serves as the daily mission control, aggregating:
1. **Date Picker & Header** (`selectedDate`, lines 75–86).
2. **Key Metric Stats Cards** (lines 89–117):
   - Total Study Time (`totalMinutes` formatted in hours + minutes).
   - Problems Solved (`totalProblems`).
   - Distinct Subjects count (`subjects.length`).
3. **Quick Natural Language Logger** (`<LogInput selectedDate={selectedDate} />`, line 120).
4. **52-Week Study Streak Heatmap** (`<StudyHeatmap logs={logs} selectedDate={selectedDate} onSelectDate={handleDateChange} />`, line 125).
5. **Dynamic Exam Countdowns & Velocity Forecast** (`<ExamCountdown />`, line 129).
6. **AI Daily Insights & Action Plan** (`<InsightsPanel selectedDate={selectedDate} />`, line 133).
7. **Recent Session Log List** (lines 138–226) with inline edit and delete capabilities.

### 3.2 Streak Calculation Engine (`src/components/StudyHeatmap.tsx`)
In `StudyHeatmap.tsx` (lines 63–152):
- Computes `currentStreak` (consecutive days with >0 minutes study time leading up to today/yesterday) and `longestStreak`.
- Color intensity levels (0 to 4) based on daily study duration:
  - Level 4: $\ge 240\text{ mins}$ (Mastery)
  - Level 3: $150\text{–}239\text{ mins}$ (Deep Focus)
  - Level 2: $60\text{–}149\text{ mins}$ (Solid Session)
  - Level 1: $1\text{–}59\text{ mins}$ (Review/Quick)
  - Level 0: $0\text{ mins}$ (Inactive)
- Interactive day modal allows direct session inspection, editing, and addition.

### 3.3 Exam Countdown & Velocity Forecaster (`src/components/ExamCountdown.tsx`)
- Default targets: JEE Advanced 2026 (1200h), IPhO (800h), NSEP (400h), MIT SAT (300h).
- Calculations (lines 182–185):
  - `daysLeft = differenceInDays(targetDate, today)`
  - `hoursRemaining = targetHours - completedHours`
  - `requiredHoursPerDay = hoursRemaining / daysLeft`
  - `progressPercent = (completedHours / targetHours) * 100`

### 3.4 Extension Hooks for R5 (Elastic Streak Health Bar & Resilience Tokens):
- Current streak system is strict/binary.
- Integration point in `Dashboard.tsx` (above or within Quick Stats):
  - 100 HP Health Bar visual component.
  - Daily decay calculation (e.g. -25 HP if daily goal not reached).
  - Resilience shield token counters (spend token to freeze streak when resting/ill).
  - HP recovery on consecutive target hits (+15 HP per full target day).

---

## 4. Analytics Component Architecture

### 4.1 Layout & Capabilities (`src/components/Analytics.tsx`)
In `src/components/Analytics.tsx` (1,256 lines):
- **Time Range Filter**: `7d` | `30d` | `90d` | `365d` | `all` (lines 598–620).
- **Metric Views**: `hours` | `problems` | `combined` (lines 874–899).
- **Exam Filter**: Filter velocity forecast by specific target exam or view all (lines 748–759).
- **Recharts Data Visualizations**:
  1. `AreaChart`: Dual-gradient timeline displaying daily study hours and problem volume (lines 905–962).
  2. `PieChart`: Donut chart of subject distribution with `PALETTE` colors and percentage badges (lines 981–1028).
  3. `BarChart`: Horizontal and grouped bar comparisons for Subject vs. Problems and Topic mastery (lines 1050–1106).
- **Data Mobility Suite** (lines 347–570):
  - CSV Export with full column schema (`handleExportCSV`).
  - JSON Complete Backup Export (`handleExportJSON`).
  - Drag-and-drop / File input Import modal supporting JSON and CSV with Merge or Replace strategies.

### 4.2 Velocity Diagnostics Engine (lines 280–344):
- Calculates student's 30-day rolling daily velocity ($V_{\text{actual}}$ in hours/day).
- Compares against target daily pace ($P_{\text{required}}$ in hours/day).
- Categorizes status into `ahead` ($V \ge 1.15P$), `on_track` ($0.85P \le V < 1.15P$), or `behind` ($V < 0.85P$).
- Computes projected finish buffer: `projectedFinishDaysAhead = daysLeft - (hoursRemaining / currentDailyVelocity)`.

### 4.3 Extension Hooks for R3 & R4:
- **R3 (Speed vs. Accuracy Calibration Matrix - SACM):**
  - Recharts `ScatterChart` can be integrated directly under the Velocity Charts section in `Analytics.tsx`.
  - Axes: X = Velocity (Questions/Hour), Y = Accuracy / Focus Score (%).
  - 4 Quadrants:
    - Q1 (High Speed, High Accuracy): *Mastery Velocity*
    - Q2 (Low Speed, High Accuracy): *Methodical Grinder*
    - Q3 (Low Speed, Low Accuracy): *Critical Overhaul*
    - Q4 (High Speed, Low Accuracy): *Speed Demon (Rushing)*
- **R4 (Dynamic Subject Equilibrium Matrix - PID Allocator):**
  - Rolling 7-day entropy balance gauge: Calculates Shannon Entropy $H = -\sum p_i \log_2(p_i)$ across subjects.
  - Compares against target equal-weight distribution ($H_{\text{max}} = \log_2(N)$).
  - Subject neglect alert: Detects if any core subject (e.g. Physics, Chemistry, Math) has $< 15\%$ rolling allocation.
  - Proportional-Integral-Derivative (PID) recommended study block allocations for the next 24–48 hours.

---

## 5. Quick Loggers, Modals, Floating Actions & Voice Handlers

### 5.1 Quick Logger & Voice Architecture (`src/components/LogInput.tsx`)
In `LogInput.tsx` (lines 1–218):
- **Web Speech Recognition**: Continuous interim listening with auto-restart keepalive (lines 35–81) avoiding browser disconnect timeouts.
- **VoiceService Integration (`src/services/voiceService.ts`)**:
  - Captures raw audio stream via `navigator.mediaDevices.getUserMedia`.
  - Computes real-time audio volume level using `AudioContext` and `AnalyserNode` for live `<canvas id="waveform-log" />` rendering.
  - Converts recorded audio to base64 WebM Blob and transmits to Gemini/AI Vault for precise transcription.
- **Intelligent Dual-Engine Parser (`src/services/universalAIService.ts`)**:
  - Primary: AI JSON Schema parsing via `UniversalAIService.parseStudyLog(text)` (lines 1004–1053).
  - Fallback / Offline: `UniversalAIService.parseStudyLogLocal(rawText)` (lines 923–1002).
  - Robust regex & heuristic extraction of:
    - Duration (handles "2h", "90 mins", "1.5 hours")
    - Problems solved (handles "25 questions", "30 MCQs", "15 numericals")
    - Subject (Physics, Chemistry, Math, Biology, Computer Science)
    - Topic & Subtopic identification from 30+ known JEE/Olympiad topic keys
    - Mistakes and misconceptions classification.

### 5.2 Modal System Patterns in Savantix
All modals throughout the codebase follow a clean, accessible backdrop pattern:
- Fixed full-screen overlay: `fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md`.
- Styled dialog container: `bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6`.
- Used in: `Analytics.tsx` (Data Import), `StudyHeatmap.tsx` (Day Log Inspector & Creator), `Goals.tsx` (Goal Creator), `Settings.tsx` (Snippet Importer).

### 5.3 Extension Hooks for R2 (Sub-Second Voice/Text Micro-Logger):
- A global floating action button / quick trigger (or keyboard shortcut like `Ctrl+K` / `Cmd+K`) can open a high-speed micro-logger popup from anywhere in the app.
- Utilizing `UniversalAIService.parseStudyLogLocal` allows immediate, optimistic $<10\text{ms}$ parsing and instant UI feedback, while background AI enriches the topic metadata seamlessly.

---

## 6. Architecture & Implementation Blueprint for Requirements R1–R5

| Req | Feature Name | Core Component Target | Architectural Mechanism | Key Dependencies / Utilities |
|---|---|---|---|---|
| **R1** | **Flowmodoro & Flowtime Engine** | `src/components/Pomodoro.tsx` | Count-up stopwatch state machine, auto-break calculation ($T_{\text{break}} = \text{round}(T_{\text{focus}} / 5)$), smooth stage handover | `pomodoroAudioEngine.ts`, `youtubeAudioService.ts`, `AppContext.addLog` |
| **R2** | **Sub-Second Voice/Text Micro-Logger** | `src/components/LogInput.tsx` + Global Floating Trigger | SpeechRecognition + VoiceService + sub-second local optimistic NLP parser (`parseStudyLogLocal`) with instant toast feedback | `universalAIService.ts`, `voiceService.ts`, `AppContext.addLog` |
| **R3** | **Speed vs. Accuracy Calibration Matrix (SACM)** | `src/components/Analytics.tsx` | 4-quadrant Recharts `ScatterChart` (X = Problems/Hr, Y = Focus/Efficiency Score), quadrant boundary lines, diagnostic badges | Recharts (`ScatterChart`, `Scatter`, `ZAxis`, `ReferenceLine`), `filteredLogs` |
| **R4** | **Dynamic Subject Equilibrium Matrix (PID Allocator)** | `src/components/Analytics.tsx` | Rolling 7-day Shannon Entropy calculation ($H/H_{\text{max}}$), subject neglect alert threshold, PID correction target hours | `date-fns`, `AppContext.logs` |
| **R5** | **Elastic Streak Health Bar & Resilience Tokens** | `src/components/Dashboard.tsx` + `StudyHeatmap.tsx` | 100 HP Health Bar state, missed-day decay logic (-25 HP), resilience token bank (streak freeze shield), visual shield UI | `localStorage`, `date-fns`, `AppContext` |

---

## 7. Verification & Build Validation

The codebase was surveyed without modifying production source code. To ensure integrity:
1. `package.json` was examined: Vite 6.2.0, React 19.0.0, Lucide-React 0.546.0, Recharts 3.8.1, Tailwind CSS 4.1.14.
2. The project build pipeline was checked: `npm run build` (`vite build`) and `npm run lint` (`tsc --noEmit`).

---
*End of Survey Report 2.*
