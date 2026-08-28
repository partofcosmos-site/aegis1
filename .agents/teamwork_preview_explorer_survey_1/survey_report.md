# Savantix (Aegis) — Comprehensive Codebase Survey Report

**Survey Phase: Explorer 1**  
**Date:** 2026-08-28 (UTC) / 2026-08-29 (Local)  
**Workspace:** `C:\Users\white\master-hub\aegis1`  
**Target:** Savantix Production Platform (`https://savantix.vercel.app/`)  

---

## 1. Executive Summary

Savantix (Aegis) is a high-performance, client-first study operating system and decision-support platform designed for competitive STEM aspirants (JEE Advanced, IPhO, IMO). The frontend is built on **React 19**, **Vite 6**, **Tailwind CSS v4** (`@tailwindcss/vite`), **Recharts 3**, **KaTeX**, **Lucide React**, and **Motion**. It features a dual-persistence architecture: direct cloud persistence via **Firebase Authentication & Cloud Firestore**, with an immediate fallback to a complete, zero-backend, origin-isolated **LocalStorage persistence layer** (supporting guest mode and offline work).

---

## 2. Directory Structure & File Layout

```
C:\Users\white\master-hub\aegis1\
├── .agents/                                      # Agent metadata & working directories
│   ├── ORIGINAL_REQUEST.md                       # Core user requirements (R1 - R5)
│   └── teamwork_preview_explorer_survey_1/       # Explorer 1 working memory & reports
├── dist/                                         # Production build output
│   ├── assets/                                   # Bundled CSS, JS, and KaTeX web fonts
│   └── index.html
├── node_modules/                                 # Installed NPM dependencies
├── public/                                       # Static assets
├── src/                                          # Application source code
│   ├── components/                               # UI Components & Feature Modules
│   │   ├── Analytics.tsx                         # Velocity intelligence, 52-wk heatmap & exam forecast
│   │   ├── AuthWrapper.tsx                       # Firebase/Email/Guest authentication barrier
│   │   ├── Chatbot.tsx                           # Multi-model AI Council & multimodal chat
│   │   ├── ConceptGraph.tsx                      # Interactive STEM mastery DAG & constellation
│   │   ├── Dashboard.tsx                         # Core daily overview, stats, quick log & tickers
│   │   ├── ErrorBoundary.tsx                     # Top-level React error boundary
│   │   ├── ExamCountdown.tsx                     # Countdown timers & required daily velocity calculator
│   │   ├── Flashcards.tsx                        # SM-2 spaced repetition engine with LaTeX/SVG
│   │   ├── Goals.tsx                             # Categorized milestone tracker & progress engine
│   │   ├── InsightsPanel.tsx                     # AI daily study analysis & actionable advice
│   │   ├── Journal.tsx                           # Reflection logger with mood/energy & tags
│   │   ├── Layout.tsx                            # Top-level shell with persistent navigation sidebar
│   │   ├── LogInput.tsx                          # Natural language study logger with Web Speech API
│   │   ├── Pomodoro.tsx                          # Focus timer, synthesized audio & YouTube player
│   │   ├── Settings.tsx                          # Multi-provider AI Vault & profile configuration
│   │   ├── StemSolver.tsx                        # 4-tier Socratic solver with step derivation & scratchpad
│   │   └── StudyHeatmap.tsx                      # 52-week activity commit matrix with log inspection
│   ├── context/
│   │   └── AppContext.tsx                        # Central React Context state, Firestore sync & guest store
│   ├── services/
│   │   ├── aiProviderTypes.ts                    # AI provider interfaces, templates & consensus types
│   │   ├── aiVaultService.ts                     # Zero-leak client credential vault & connection test
│   │   ├── freeOnlineAIService.ts                # Wikipedia/ArXiv free research fetcher
│   │   ├── geminiService.ts                      # Direct Google Gemini API service & function calling
│   │   ├── universalAIService.ts                 # Multi-provider routing, fallback & JSON extraction
│   │   ├── voiceService.ts                       # Audio recording & speech transcription
│   │   └── youtubeAudioService.ts                # Distraction-free YouTube focus audio engine
│   ├── utils/
│   │   └── pomodoroAudioEngine.ts                # Web Audio API synthesizers (40Hz Gamma, Brown Noise)
│   ├── App.tsx                                   # Main app component with persistent tab viewport
│   ├── firebase.ts                               # Firebase Auth & Firestore client configuration
│   ├── index.css                                 # Tailwind CSS v4 entry point & custom scrollbars
│   └── main.tsx                                  # React 19 root bootstrap
├── .env.example                                  # Environment template (GEMINI_API_KEY)
├── .gitignore                                    # Git exclusion rules
├── build_aegis.py                                # Python build helper script
├── firebase-applet-config.json                   # Firebase app credentials
├── firebase-blueprint.json                       # Firebase blueprint metadata
├── firestore.rules                               # Firestore security rules
├── index.html                                    # HTML5 root with KaTeX fonts & metadata
├── metadata.json                                 # Project metadata
├── package.json                                  # Package manifest & scripts
├── package-lock.json                             # Exact dependency lockfile
├── README.md                                     # Project overview and documentation
├── tsconfig.json                                 # TypeScript compiler options
├── vercel.json                                   # Vercel deployment routing & headers
└── vite.config.ts                                # Vite bundler config with Tailwind & React plugins
```

---

## 3. Package Dependencies & Tooling

### 3.1 Dependencies Overview (`package.json`)

| Category | Library | Version | Role in Savantix |
| :--- | :--- | :--- | :--- |
| **Core Framework** | `react`, `react-dom` | `^19.0.0` | Next-gen React UI framework |
| **Bundler & Build** | `vite` | `^6.2.0` | Fast ESM build tool |
| **Styling** | `tailwindcss`, `@tailwindcss/vite`, `@tailwindcss/typography` | `^4.1.14` | Modern CSS styling with Tailwind v4 engine |
| **Icons** | `lucide-react` | `^0.546.0` | Comprehensive UI icon system |
| **Data Viz** | `recharts` | `^3.8.1` | Area charts, Bar charts, Pie charts, Responsive Containers |
| **Math & Markdown**| `katex`, `react-markdown`, `remark-math`, `rehype-katex`, `rehype-raw`, `remark-gfm`, `remark-breaks`, `marked`, `marked-katex-extension` | Latest | LaTeX equation rendering & Markdown parsing for STEM notes |
| **Animation** | `motion` | `^12.23.24` | Smooth transitions and state animations |
| **Date Utilities** | `date-fns` | `^4.1.0` | Date manipulation, interval math, streak calendars |
| **Backend & Cloud**| `firebase` | `^12.11.0` | Auth & Firestore real-time synchronization |
| **AI Integration** | `@google/genai` | `^1.29.0` | Google GenAI SDK |
| **Utility** | `clsx`, `tailwind-merge`, `style-to-object`, `dotenv` | Latest | Class merge and style utilities |

### 3.2 Build & Test Tooling Configuration

- **Node binary path:** `C:\Program Files\nodejs\node.exe`
- **Vite configuration (`vite.config.ts`):**
  - Plugins: `react()`, `tailwindcss()`
  - Defines: `'__GEMINI_API_KEY__': JSON.stringify(env.GEMINI_API_KEY)`
- **TypeScript configuration (`tsconfig.json`):**
  - Target: `ES2022`, Module: `ESNext`, JSX: `react-jsx`
  - Path alias: `@/*` -> `./*`
  - `allowImportingTsExtensions: true`, `noEmit: true`, `skipLibCheck: true`

### 3.3 Build Verification & TS Check Results

1. **Vite Production Build (`vite build`):**
   - Command: `& "C:\Program Files\nodejs\node.exe" node_modules/vite/bin/vite.js build`
   - **Status: SUCCESS (Exit code 0)**
   - Transformed 2994 modules in 9.53s. Output generated in `dist/`.
2. **TypeScript Type Check (`tsc --noEmit`):**
   - Command: `& "C:\Program Files\nodejs\node.exe" node_modules/typescript/bin/tsc --noEmit`
   - **Observation:** Identified 1 missing import in `src/components/Pomodoro.tsx`:
     `src/components/Pomodoro.tsx(983,39): error TS2304: Cannot find name 'RefreshCw'.`
     *(Note: `RefreshCw` is used at line 983 during YouTube track search, but omitted in lines 2–35 import statement).*

---

## 4. Application Architecture & Viewport Navigation

The root `App.tsx` adopts a **Persistent Tab Viewport Pattern**:
Instead of conditionally unmounting tabs when navigating, all viewports (`Dashboard`, `Analytics`, `StemSolver`, `ConceptGraph`, `Chatbot`, `Flashcards`, `Journal`, `Goals`, `Pomodoro`, `Settings`) remain mounted with CSS visibility toggling (`block` vs `hidden`).
- **Benefit:** Background timers (Pomodoro), audio synthesizers (40Hz Gamma), YouTube audio streams, Web Speech recognition sessions, and multi-step LaTeX derivations continue running uninterrupted during navigation.

---

## 5. Core Data Models, Interfaces & Types

### 5.1 User Profile & App Context (`src/context/AppContext.tsx`)

```typescript
interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  schoolHours?: number;
  targetExams?: string[];
  createdAt: any;
}
```

### 5.2 Study Log Model (`src/services/universalAIService.ts` & `src/context/AppContext.tsx`)

```typescript
export interface ParsedLog {
  subject: string;
  topic: string;
  subtopic: string;
  durationMinutes: number;
  problemsSolved: number;
  mistakes: string[];
  efficiencyScore: number; // 1 - 10
  focusScore: number;      // 1 - 10
}

export interface StudyLogEntry extends ParsedLog {
  id: string;
  uid: string;
  rawText: string;
  date: string;            // yyyy-MM-dd
  createdAt: string;       // ISO Timestamp
}
```

### 5.3 Daily AI Insights Model (`src/services/universalAIService.ts`)

```typescript
export interface DailyInsightData {
  performanceSummary: string;
  keyInefficiencies: string[];
  biggestMistakePattern: string;
  hiddenWeakness: string;
  nextDayPlan: string[];
  priorityRanking: string[];
  warnings: string[];
}
```

### 5.4 Goals & Milestones Model (`src/components/Goals.tsx`)

```typescript
export type GoalCategory = 'Physics' | 'Math' | 'Chemistry' | 'Mock Tests' | 'General';
export type GoalPriority = 'Urgent' | 'High' | 'Medium' | 'Low';

export interface Milestone {
  id: string;
  text: string;
  completed: boolean;
}

export interface GoalItem {
  id: string;
  title: string;
  description?: string;
  targetDate?: string | null;
  category?: GoalCategory;
  priority?: GoalPriority;
  progress?: number;
  completed: boolean;
  milestones?: Milestone[];
  createdAt?: string;
}
```

### 5.5 Journal & Reflection Model (`src/components/Journal.tsx`)

```typescript
export interface JournalReflection {
  id: string;
  title: string;
  date: string;          // yyyy-MM-dd
  mood?: number;          // 1 - 5 scale
  energy?: number;        // 1 - 5 scale
  tags?: string[];
  wins?: string;
  struggles?: string;
  insights?: string;
  priorities?: string;
  content?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

### 5.6 Exam Targets & Velocity Forecast Model (`src/components/ExamCountdown.tsx` & `src/components/Analytics.tsx`)

```typescript
export interface ExamTarget {
  id: string;
  name: string;
  targetDate: string;     // yyyy-MM-dd
  targetHours: number;
  completedHours: number;
  category: 'Physics' | 'Math' | 'Chemistry' | 'General';
}
```

### 5.7 Pomodoro, Audio & Flowtime Engine Models (`src/components/Pomodoro.tsx`, `src/utils/pomodoroAudioEngine.ts`)

```typescript
export interface PomodoroTask {
  id: string;
  title: string;
  subject: string;
  estimatedPomodoros: number;
  completedPomodoros: number;
  isCompleted: boolean;
  createdAt: number;
}

export interface SoundPreset {
  id: 'gamma_40hz' | 'alpha_10hz' | 'brown_noise' | 'pink_noise' | 'white_noise' | 'rain_ambient' | 'cafe_ambient' | 'lofi_beats';
  name: string;
  category: 'binaural' | 'noise' | 'ambient' | 'stream';
  tagline: string;
  description: string;
  icon: string;
  freqLabel?: string;
}

export interface YouTubeTrack {
  id: string;
  title: string;
  artist: string;
  category: 'lofi' | 'classical' | 'binaural' | 'synthwave' | 'ambient' | 'cinematic' | 'custom';
  youtubeId: string;
  tag: string;
  duration?: string;
}
```

### 5.8 AI Vault & Multi-Provider Architecture (`src/services/aiProviderTypes.ts`)

```typescript
export type ProviderType = 
  | 'google' 
  | 'openrouter' 
  | 'openai' 
  | 'anthropic' 
  | 'groq' 
  | 'together' 
  | 'deepseek' 
  | 'ollama' 
  | 'custom_openai';

export interface AIProviderConfig {
  id: string;
  name: string;
  providerType: ProviderType;
  baseUrl?: string;
  apiKey?: string;
  selectedModel: string;
  temperature?: number;
  maxTokens?: number;
  thinkingLevel?: 'off' | 'low' | 'medium' | 'high';
  isDefault?: boolean;
  headers?: Record<string, string>;
  createdAt?: number;
}
```

---

## 6. Comprehensive LocalStorage Schema Mapping

The platform operates on a robust, multi-layer key schema in the browser's `localStorage`:

| Key / Pattern | Type / Schema | Originating File | Description |
| :--- | :--- | :--- | :--- |
| `savantix_user_session` | JSON `{ uid, email, displayName }` | `AppContext.tsx` | Active authenticated user session token |
| `savantix_user_profile_{uid}` | JSON `UserProfile` | `AppContext.tsx` | User profile cache (school hours, target exams) |
| `savantix_user_logs_{uid}` | JSON `StudyLogEntry[]` | `AppContext.tsx` | User study session logs |
| `savantix_user_goals_{uid}` | JSON `GoalItem[]` | `AppContext.tsx` | User milestone targets and progress items |
| `savantix_user_insights_{uid}`| JSON `DailyInsightData[]` | `AppContext.tsx` | Daily AI analyses and recommendations |
| `savantix_user_journal_{uid}` | JSON `JournalReflection[]` | `AppContext.tsx` | User reflections, moods, energy ratings |
| `savantix_is_guest` | `'true'` or absent | `AppContext.tsx` | Flag indicating guest fallback mode |
| `savantix_guest_logs` | JSON `StudyLogEntry[]` | `AppContext.tsx` | Guest session study logs |
| `savantix_guest_insights` | JSON `DailyInsightData[]` | `AppContext.tsx` | Guest daily AI analyses |
| `savantix_guest_goals` | JSON `GoalItem[]` | `AppContext.tsx` | Guest goals and milestones |
| `savantix_guest_journal` | JSON `JournalReflection[]` | `AppContext.tsx` | Guest reflections and diary entries |
| `savantix_guest_chat_sessions`| JSON `any[]` | `AppContext.tsx` | Guest AI chat session list |
| `savantix_guest_session_{id}` | JSON `ChatMessage[]` | `Chatbot.tsx` | Full history of an individual guest chat conversation |
| `savantix_guest_flashcards` | JSON `Flashcard[]` | `Flashcards.tsx` | Guest SM-2 spaced repetition flashcards |
| `savantix_flashcards` | JSON `Flashcard[]` | `StemSolver.tsx` | Main flashcard collection backup |
| `aegis_ai_providers_vault_v1` | JSON `AIProviderConfig[]` | `aiVaultService.ts` | Multi-provider API keys, base URLs, model selection |
| `aegis_active_ai_provider_id` | String (`prov_*`) | `aiVaultService.ts` | Active default AI provider ID |
| `savantix_parallel_router_models` | JSON `RouterTargetModel[]` | `aiVaultService.ts` | AI council consensus parallel router models |
| `savantix_google_yt_api_key_v1` | String | `youtubeAudioService.ts`| User YouTube API Key for audio track search |
| `savantix_pomodoro_settings_v2` | JSON `{ focusDuration, shortBreakDuration, longBreakDuration, ... }` | `Pomodoro.tsx` | Pomodoro timers, cycle counts, break rules |
| `savantix_pomodoro_tasks_v2` | JSON `PomodoroTask[]` | `Pomodoro.tsx` | Task list linked with Pomodoro cycles |
| `savantix_exam_targets` | JSON `ExamTarget[]` | `ExamCountdown.tsx` | Countdown targets, target hours, exam dates |
| `savantix_solved_problems` | JSON `SolvedProblemItem[]` | `StemSolver.tsx` | Saved 4-tier STEM problem solutions and whiteboard canvas |
| `savantix_concept_graph_v2_{uid}` | JSON `ConceptNode[]` | `ConceptGraph.tsx` | Mastery constellation graph node positions and state |

---

## 7. Requirement Alignment & Implementation Roadmap

| Requirement | Current Baseline in Codebase | Recommended Integration Strategy |
| :--- | :--- | :--- |
| **R1. Flowmodoro & Flowtime Engine** | Standard Pomodoro timer with countdown modes (`focus`, `short_break`, `long_break`). | Add stopwatch count-up mode (`flowtime`) to `Pomodoro.tsx` with dynamic break calculation: `Break = Math.round(focusMinutes / 5)`. |
| **R2. Sub-Second Voice/Text Micro-Logger** | `LogInput.tsx` has Web Speech recognition and Universal AI parser with ~2s latency. | Streamline micro-logging with single-tap quick capture, instant hotkeys, and regex fast-path entity parser. |
| **R3. Speed vs. Accuracy Calibration Matrix (SACM)** | `Analytics.tsx` has velocity trends, bar/area charts and subject breakdown. | Implement 4-quadrant scatter plot (Speed Q/hr vs Accuracy %) with quadrant classification (Flow Zone, Rush Hazard, Overthinking, Danger). |
| **R4. Dynamic Subject Equilibrium Matrix (PID Allocator)** | `Analytics.tsx` aggregates time per subject. | Implement rolling 7-day Shannon entropy balance score & PID allocation recommendations to prevent subject starvation. |
| **R5. Elastic Streak Health Bar & Resilience Token Engine** | `StudyHeatmap.tsx` computes streaks from daily logs. | Add 100 HP health bar with resilience shield tokens (burn token to protect streak during off-days) in `Dashboard.tsx`. |

---

## 8. Conclusion

The Savantix (Aegis) repository is structured cleanly with zero backend blockers, high build performance (Vite build ~9.5s), comprehensive client-side persistence, and extensive domain typing. All requirements (R1–R5) map directly onto existing components with well-defined interfaces and storage schemas.
