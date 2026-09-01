# 🛡️ Savantix (Aegis) — Explorer 3 Survey Report
**Focus**: R3 & R4 — Production UI/UX Refinement, Responsive Breakpoints, STEM Tools, and Zero Data Loss Persistence  
**Author**: Explorer 3 (Survey Phase)  
**Date**: 2026-08-31T17:50:00Z  
**Target Repository**: `C:\Users\white\master-hub\aegis1`  

---

## 1. Executive Summary

This comprehensive investigation audits the Savantix (Aegis) codebase against requirements **R3 (Next-Level Production UI/UX Refinement & Responsive Polish)** and **R4 (Health Verification & Zero Data Loss Persistence Guarantee)**. 

### Key Findings Matrix
| Domain | Status | Key Findings / Risks | Severity |
| :--- | :--- | :--- | :--- |
| **Recharts Chart Sizing** | ⚠️ Warning Risk | Charts in `Analytics.tsx` mounted inside `hidden` (`display: none`) viewport tabs trigger Recharts 0x0 container measurement warnings. | Medium |
| **Responsive Breakpoints** | ⚠️ Layout Quirk | `Layout.tsx` mobile viewport calculation `h-screen` below header causes vertical double-scrolling (100vh + 60px). Chatbot mobile lacks recent chat history drawer. | Low-Medium |
| **STEM Tools Architecture** | ✅ Verified Robust | 4-Tier Socratic STEM Solver, KaTeX Formula Palette (14 snippets), and HTML5 high-DPI Scratchpad with memory canvas backing are fully implemented and robust. | Minimal |
| **Zero Data Loss Guarantee** | ✅ Solid & Verified | Complete inventory of 18+ localStorage keys. Firestore bidirectional sync in `AppContext.tsx` utilizes non-destructive union merges and secondary cache backups. | Safe / Verified |

---

## 2. Recharts Sizing Warnings & Chart Container Investigation

### 2.1 Tab Rendering Architecture
- **Location**: `src/App.tsx:40-73`
- **Mechanism**:
  ```tsx
  <div className={`h-full w-full ${activeTab === 'dashboard' ? 'block' : 'hidden'}`}>
    <Dashboard />
  </div>
  <div className={`h-full w-full ${activeTab === 'analytics' ? 'block' : 'hidden'}`}>
    <Analytics />
  </div>
  ```
- **Root Cause Analysis**:
  1. `App.tsx` retains all route views persistently in the DOM so timers and background streams remain active.
  2. When the user loads the app, `activeTab` is `'dashboard'`. The `Analytics` view is rendered inside `display: none` (`hidden`).
  3. When `ResponsiveContainer` calculates `getBoundingClientRect()`, the width and height are `0px`. Recharts throws runtime console warnings:
     `The width(0) and height(0) of chart should be greater than 0, please check the model of ResponsiveContainer.`

### 2.2 Inventory of All Chart Instances (`src/components/Analytics.tsx`)
1. **SACM Velocity vs Accuracy Scatter Plot** (`src/components/Analytics.tsx:1182-1267`):
   - Container: `<div className="h-80 w-full relative">`
   - Child: `<ResponsiveContainer width="100%" height="100%">`
   - Status: Functional, but needs `minWidth={0}` / active tab awareness to suppress 0-width mounting warnings.
2. **Study Timeline Area Chart** (`src/components/Analytics.tsx:2012-2072`):
   - Container: `<div className="h-72 w-full">`
   - Child: `<ResponsiveContainer width="100%" height="100%">`
   - Status: Dual gradient area curves (`#6366f1` / `#10b981`).
3. **Subject Distribution Pie Chart** (`src/components/Analytics.tsx:2088-2116`):
   - Container: `<div className="h-44">`
   - Child: `<ResponsiveContainer width="100%" height="100%">`
   - Status: Donut pie chart with color palette mapping.
4. **Subject Comparison Bar Chart** (`src/components/Analytics.tsx:2200-2215`):
   - Container: `<div className="h-64">`
   - Child: `<ResponsiveContainer width="100%" height="100%">`
   - Status: Dual bar comparison (Hours vs Problems).

### 2.3 Heatmap & Canvas Charts
- **52-Week Study Heatmap** (`src/components/StudyHeatmap.tsx:492-542`):
  - Uses custom SVG/CSS grid with `min-w-[780px]` inside `overflow-x-auto`.
  - Zero Recharts dependencies — operates independently with 0 console warnings.
- **Audio Frequency Visualizer** (`src/components/Pomodoro.tsx:2449-2455`):
  - Uses native `<canvas>` with Web Audio API AnalyserNode.
  - Sized at `width={320} height={48}` with CSS `w-full h-12`. Fully responsive.

### 2.4 Recommended Recharts Fix
In `Analytics.tsx` (and any future chart wrappers), add `minWidth={0} minHeight={0}` and a `key` tied to tab activation or mount state:
```tsx
<ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
  {/* Chart Elements */}
</ResponsiveContainer>
```

---

## 3. Responsive Layout Breakpoints & Mobile Overflow Audit

### 3.1 Global Layout (`src/components/Layout.tsx`)
- **Structure**:
  - Root container: `min-h-screen bg-zinc-950 text-zinc-200 flex flex-col md:flex-row font-sans relative`
  - Mobile Header (`md:hidden`): Height ~60px.
  - Main Viewport (`src/components/Layout.tsx:194`): `<main className="flex-1 overflow-y-auto min-h-0 h-screen scroll-smooth">`
- **Observed Quirk**:
  - On mobile devices, `flex-col` puts the header in document flow, while `main` has `h-screen`. This creates a combined body height of `100vh + ~60px`, triggering window-level scrolling alongside internal container scrolling.
  - **Remedy**: Change `main` to `h-[calc(100vh-60px)] md:h-screen` or `flex-1 min-h-0`.
- **Mobile Menu Backdrop**:
  - `isMobileMenuOpen` animates `<aside className="fixed inset-y-0 left-0 z-40 w-64 ...">`.
  - Currently lacks an external dimmed backdrop overlay (`fixed inset-0 bg-black/60 z-30`). Tapping outside the sidebar on mobile does not dismiss the menu unless the user taps the toggle button or a navigation item.

### 3.2 View-by-View Responsive Audit

| Component | Mobile (<640px) | Tablet (640-1024px) | Desktop (>1024px) | Observations / Polish Needed |
| :--- | :--- | :--- | :--- | :--- |
| **Dashboard** (`Dashboard.tsx`) | 1 Col grid | 2 Col grid | 4 Col Quick Stats & 3 Col Layout | Excellent responsive wrapping. Circadian scheduler 24h map scales smoothly. |
| **Analytics** (`Analytics.tsx`) | Stacks 1 Col | 2 Col topic mastery | 12 Col SACM matrix | Clean breakpoints. Recharts resizing works once container is visible. |
| **StemSolver** (`StemSolver.tsx`) | Tier buttons show T1-T4 | 4 Tier buttons show short labels | Full labels | Math toolbar has `overflow-x-auto`. Scratchpad canvas resizes via ResizeObserver. |
| **ConceptGraph** (`ConceptGraph.tsx`) | Stacks graph + inspector | Stacks graph + inspector | Side-by-side (Inspector 384px) | Graph pan & zoom handles touch pointers. Inspector has max-h-460px on mobile. |
| **Chatbot** (`Chatbot.tsx`) | Recent chats hidden | Recent chats hidden | Left drawer 256px | On mobile, recent chat sessions are inaccessible because no drawer toggle exists. |
| **Flashcards** (`Flashcards.tsx`) | 1 Col cards | 2 Col cards | 3 Col cards | Fluid grid, KaTeX markdown wrapped with `break-words`. |
| **Journal** (`Journal.tsx`) | 1 Col reflections | 2 Col stats | 4 Col stats + filter pills | Tag pills scroll horizontally with `overflow-x-auto`. |
| **Goals** (`Goals.tsx`) | 2 Col stats | 4 Col stats | 4 Col stats | Clean progress bars, category icons. |
| **Pomodoro** (`Pomodoro.tsx`) | Single stack | Dual columns | Dual columns + Tasks | Kiosk YouTube player has `aspect-video`. Audio visualizer adapts to container width. |
| **Settings** (`Settings.tsx`) | 1 Col providers | 2 Col providers | 3 Col sync metrics | Modals have `max-h-[90vh] overflow-y-auto`. |
| **ErrorVault** (`ErrorVault.tsx`) | 1 Col cards | 2 Col cards | 3 Col cards | Filter pills wrap cleanly. |
| **MicroLoggerModal** (`MicroLoggerModal.tsx`) | Full width modal | Centered modal (600px) | Centered modal (600px) | Hotkeys Alt+L / Ctrl+K, responsive voice wave. |

---

## 4. STEM Tools Rendering Deep-Dive

### 4.1 Socratic STEM Solver (`src/components/StemSolver.tsx`)
- **4-Tier Progressive Pedagogical Engine**:
  1. **Tier 1: Conceptual Physical / Mathematical Intuition** (Mental models, qualitative principles, self-check prompts).
  2. **Tier 2: Governing Laws & Formulations** (Key equations, coordinate system frames, boundary conditions).
  3. **Tier 3: Step-by-Step Derivation & Intermediate Steps** (Rigorous mathematical progression with critical substitutions).
  4. **Tier 4: Final Analytical Proof & Dimensional Check** (Boxed answers, units analysis, limiting cases).
- **Typography & Markdown Math Rendering**:
  - Rendered using `react-markdown` with:
    - `remarkMath` & `remarkGfm`
    - `rehypeKatex` & `rehypeRaw`
    - `katex/dist/katex.min.css` (local package + CDN link in `index.html`).
  - Equations enclosed in `$...$` (inline) and `$$...$$` (display block) render with crisp vector glyphs without overflow or clipping.

### 4.2 KaTeX Formula Palette
- **Location**: `src/components/StemSolver.tsx:377-392`
- **Pre-Configured Snippets**:
  - `\frac{a}{b}`, `\int_{0}^{\infty} f(x) \, dx`, `\frac{d}{dt}\left( x(t) \right)`, `\sum_{i=1}^{n}`, `\sqrt{x^2 + y^2}`, `\vec{F} = m \vec{a}`, `\lim_{x \to 0}`, `\begin{pmatrix} a & b \\ c & d \end{pmatrix}`, `\boxed{\text{result}}`, `\theta`, `\omega`, `\Delta E`, `\frac{\partial f}{\partial x}`, `\psi_n(x) = \sqrt{\frac{2}{L}} \sin\left(\frac{n \pi x}{L}\right)`.
- **Interaction**:
  - Clicking any snippet injects the LaTeX string at the exact cursor insertion position in the problem textarea.
  - Live KaTeX Preview toggle (`showLivePreview`) offers instant WYSIWYG feedback before submitting to the AI solver.

### 4.3 Scratchpad Drawing Canvas
- **Location**: `src/components/StemSolver.tsx:423-730, 2004-2158`
- **Technical Capabilities**:
  - **High-DPI Scaling**: Computes `canvas.width = displayWidth * devicePixelRatio` to prevent blurry lines on Retina/HiDPI screens.
  - **Memory Canvas Persistence**: Uses an offscreen memory canvas (`memoryCanvasRef`) to backup pixel buffer before parent container resizes, restoring strokes with zero data loss or distortion.
  - **Grid Modes**: Graph Grid (subtle 24px grid + indigo major axes), Dot Matrix (20px dots), Blank Slate.
  - **Tools**: Pen (anti-aliased round cap), Highlighter (alpha-blended square cap), Eraser (`destination-out` composite operation).
  - **Undo / Redo Stack**: 20-step ImageData history stack.
  - **Multimodal AI Integration**: `Solve Diagram` button exports canvas as base64 PNG and sends it to universal AI for computer vision diagram parsing.

---

## 5. Zero Data Loss Persistence & Storage Architecture

### 5.1 Comprehensive Storage Key Inventory

| Key Pattern | Scope | Purpose | Retention Policy |
| :--- | :--- | :--- | :--- |
| `savantix_user_session` | User | Active authenticated user session token & profile metadata | Preserved across page reloads |
| `savantix_is_guest` | Guest | Flag indicating active guest mode | Managed on login/logout |
| `savantix_user_profile_<uid>` | User | User target exams, school hours, display name | Persistent |
| `savantix_user_logs_<uid>` | User | Array of all logged study sessions | Strictly additive, merged with cloud |
| `savantix_logs_backup_latest` | Global | Emergency local failover backup of all study logs | Never deleted, always overwritten with latest valid logs |
| `savantix_guest_logs` | Guest | Guest study session logs | Preserved in browser |
| `savantix_user_goals_<uid>` | User | Long-term & short-term target goals and milestones | Merged on sync |
| `savantix_guest_goals` | Guest | Guest target goals | Preserved in browser |
| `savantix_user_journal_<uid>` | User | Daily reflections, mood/energy ratings, and wins | Merged on sync |
| `savantix_guest_journal` | Guest | Guest journal reflections | Preserved in browser |
| `savantix_user_insights_<uid>` | User | AI-generated daily study insights & weakness diagnostics | Preserved |
| `savantix_guest_insights` | Guest | Guest AI insights | Preserved |
| `savantix_chat_session_<uid>_<id>` | User | Individual conversation history and multimodal attachments | Preserved |
| `savantix_guest_chat_sessions` | Guest | Guest chat conversation sessions | Preserved |
| `savantix_streak_resilience_v1` | Global | Elastic Streak HP (0-100), Shield Tokens (0-3), history log | Recomputed & saved daily |
| `savantix_pid_weights_v1` | Global | Subject equilibrium target percentage weights | User adjustable |
| `savantix_flowmodoro_config_v1` | Global | Flowmodoro break ratio, target flow duration settings | User adjustable |
| `savantix_flowmodoro_state_v1` | Global | Flowmodoro active stopwatch state | Restorable across sessions |
| `savantix_pomodoro_tasks_v2` | Global | Pomodoro task checklist and completion counters | Persistent |
| `savantix_pomodoro_settings_v2` | Global | Pomodoro work/break intervals, ambient audio volumes | Persistent |
| `savantix_timer_engine_mode_v1` | Global | Current timer mode (`classic` vs `flowmodoro`) | Persistent |
| `aegis_ai_providers_vault_v1` | Global | Universal AI Provider configurations, API keys, custom endpoints | Encrypted/stored in local vault |
| `savantix_parallel_router_models` | Global | Model routing preferences for Council Chat | Persistent |
| `savantix_google_yt_api_key_v1` | Global | Optional Google YouTube Data API v3 key | Persistent |
| `savantix_bad_yt_ids_v1` | Global | Cache of restricted/bad YouTube video IDs for fast bypass | Persistent |
| `savantix_custom_yt_tracks_v1` | Global | User-added custom YouTube focus stream tracks | Persistent |
| `savantix_exam_targets` | Global | Exam countdown dates and target study hours | Persistent |
| `savantix_guest_flashcards` | Guest/User | SM-2 spaced repetition flashcard decks and review schedules | Persistent |
| `savantix_solved_problems` | Global | Socratic STEM Solver history with canvas snapshot PNGs | Max 50 items persistent |
| `savantix_error_vault` | Global | Error Vault mistake logs and remediation review dates | Persistent |
| `savantix_triage_log` | Global | Pomodoro Triage mode distraction entries | Persistent |

### 5.2 Verification of Non-Destructive Bidirectional Sync
- **Code Reference**: `src/context/AppContext.tsx:257-430`
- **Mechanism**:
  1. `onSnapshot` listens for Firestore updates.
  2. Local logs are read first from `localStorage.getItem(localLogsKey)`.
  3. A deduplication map indexes logs by `id` and unique signature: `${log.date}_${log.subject}_${log.topic}`.
  4. Any local logs that were created while offline or before cloud sync are detected (`unuploaded`) and automatically pushed via `addDoc` to Firestore.
  5. The resulting unified set is an inclusive **Union Merge** (no deletion of local-only or cloud-only data).
  6. The merged array is written to both `savantix_user_logs_<uid>` and `savantix_logs_backup_latest`.
- **Founder Data Protection**:
  - `src/utils/debanjanHistoryData.ts:310-340`: `seedDebanjanHistoryIfEmpty` explicitly checks existing logs, goals, and journal entries. If data already exists, it only appends missing historical entries (`if (newLogs.length > 0) ...`), ensuring zero existing data is ever overwritten.

---

## 6. Recommendations & Next Steps for Implementation Phase

1. **Recharts Zero-Width Warning Fix**:
   - In `Analytics.tsx`, pass `minWidth={0} minHeight={0}` to all `<ResponsiveContainer>` instances.
   - Conditionally render or resize charts when `activeTab === 'analytics'`.

2. **Mobile Viewport Height Refinement**:
   - In `src/components/Layout.tsx:194`, change `<main className="flex-1 overflow-y-auto min-h-0 h-screen scroll-smooth">` to `<main className="flex-1 overflow-y-auto min-h-0 h-[calc(100vh-60px)] md:h-screen scroll-smooth">`.
   - Add backdrop overlay `<div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />` when `isMobileMenuOpen` is active.

3. **Chatbot Mobile History Toggle**:
   - In `src/components/Chatbot.tsx`, add a mobile header drawer toggle for `Recent Chats` so mobile users can switch and view chat history.

4. **Production Build & Type Check Verification**:
   - Verify `tsc --noEmit` and `vite build` to guarantee 0 errors.

---
*Report generated by Explorer 3 for Savantix (Aegis) Survey Phase.*
