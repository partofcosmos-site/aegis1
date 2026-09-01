# Project: Savantix (Aegis) — Institutional Attendance & Production Operating System

## Architecture
Savantix is an ultra-practical, production-grade study and institutional attendance operating system built with React 19, Vite 6, Tailwind CSS v4, Lucide React, and Recharts.
- **Institutional Attendance & Reality Engine**: `src/components/AttendanceTracker.tsx` (and `AttendanceCalculator.tsx`, `src/services/attendanceRegulatorService.ts`) delivers official academic record ingestion for The Bandhan School Aranghata (CBSE XI-Science), live percentage math with on-duty credits, consecutive recovery formulas, lock date projections, and zero-cost Gemini Web AI Regulator clipboard bridging.
- **Dynamic Daily Insight Regeneration**: `src/components/Dashboard.tsx` & `src/components/InsightsPanel.tsx` provide adaptive daily study analysis with explicit "🔄 Re-analyze with Latest Logs" triggers that dynamically aggregate multi-session days without stale locking.
- **Cross-Device Cloud Sync & Dual-Persistence**: `src/services/cloudSyncService.ts` and `src/context/AppContext.tsx` provide non-destructive real-time bidirectional Firestore synchronization with local cache (34+ persistent keys) adhering strictly to the Zero Data Loss Invariant.
- **AI Gateway & Fast Model Roster**: `src/components/AIGateway.tsx` provides instant 1-click launch to frontier models (ChatGPT GPT-4o/o3, DeepSeek R1, Google Gemini 2.5 Pro, Claude 3.7 Sonnet, Perplexity AI, Wolfram Alpha, DuckDuckGo AI Chat) and offline 4-tier Socratic KaTeX derivations.
- **Academic Roadmap & Exam Countdown**: Unified 2-year timeline prioritizing IPhO Gold Track / NSEP 2026 / INPhO 2027, Class 12 CBSE Board Exams (March 2028), ISI & CMI (May 2028), and JEE Advanced (May 2028).
- **Initiative Branding & User Anonymity**: Uniform placement of *"An initiative of Part of Cosmos"* across Desktop Sidebar, Mobile Header, and Public Footers while masking student identities to "Lead Scholar" / "Core Researcher".

## Feature Inventory
| # | Feature | Description | Milestone | Source | Status |
|---|---------|-------------|-----------|--------|--------|
| 1 | The Bandhan School Record Ingestion | Ingest CBSE XI-Science records (Affiliation 2430453, 71 working days held as of Sept 1 2026, 48 present, 23 absent, 10 on-duty for IIT KGP Kriti RISE) | M1 | ORIGINAL_REQUEST §R1 | DONE |
| 2 | Institutional Calendar & Absence Ledger | 28 official holidays, 4 vacation windows (36 days saved), 4 exam/PTM schedules, 23 logged absences with practical day tags | M1 | ORIGINAL_REQUEST §R1 | DONE |
| 3 | Attendance Reality Math Engine | Dynamic effective (81.69%) and raw (67.61%) attendance %, Dec 31 lock date safe leave limits (21 for 75%, 42 for 60%), and consecutive recovery days formula | M2 | ORIGINAL_REQUEST §R2 | DONE |
| 4 | Zero-Cost Gemini Web AI Regulator Bridge | 1-Click "Launch Attendance AI Regulator" opening Gemini Web with clipboard prompt payload on CBSE Rule 13.2/14 by-laws, dummy schooling, NIOS, and British A-Levels | M2 | ORIGINAL_REQUEST §R2 | DONE |
| 5 | Dynamic Daily Insight Regeneration | "🔄 Re-analyze with Latest Logs" in Dashboard and InsightsPanel recalculating cumulative daily metrics for multi-session days | M3 | ORIGINAL_REQUEST §R3 | DONE |
| 6 | State Rehydration for Daily Insights | Startup cache rehydration in `AppContext.tsx` preventing loss of daily insights across page reloads | M3 | ORIGINAL_REQUEST §R3 | DONE |
| 7 | Real-Time Cross-Device Firestore Sync | Bidirectional Firestore sync supporting `debanjan8686@gmail.com` / `partofcosmmos@gmail.com` with instant React state updates and anonymous auth safety | M4 | ORIGINAL_REQUEST §R4 | DONE |
| 8 | Zero Data Loss Invariant Protection | Additive non-destructive union merges for all 34+ storage keys, study logs, goals, reflections, and attendance data | M4 | ORIGINAL_REQUEST §R4 | DONE |
| 9 | AI Gateway Fast Model Roster | 7-model fast launch bar (ChatGPT GPT-4o/o3, DeepSeek R1, Gemini 2.5 Pro, Claude 3.7 Sonnet, Perplexity AI, Wolfram Alpha, DuckDuckGo AI Chat) with clipboard payload | M5 | ORIGINAL_REQUEST §R5 | DONE |
| 10 | Deprecated Route Purge & Socratic KaTeX | Clean removal of dead endpoints (`You.com`), crisp KaTeX formula rendering in 4-tier derivation drawer with Alt+G shortcut | M5 | ORIGINAL_REQUEST §R5 | DONE |
| 11 | Cosmos Branding & Identity Anonymity | Subtitle *"An initiative of Part of Cosmos"* on sidebar, mobile header, and footer with identity protection masking | M5 | ORIGINAL_REQUEST §Core Directive 2 | DONE |
| 12 | 2028 IPhO Gold Track Target Roadmap | Unified 2-year target roadmap (IPhO/NSEP/INPhO, Class 12 Boards March 2028, JEE Advanced May 2028, ISI & CMI May 2028) | M5 | ORIGINAL_REQUEST Timeline Clarification | DONE |
| 13 | Comprehensive Master Test Suite | E2E test suites in `src/test/` for R1-R5, TypeScript compilation 0 errors, clean Vite build | M6 (Test) | ORIGINAL_REQUEST Acceptance Criteria | DONE |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Historical Attendance & Institutional Calendar Ingestion | `src/components/AttendanceTracker.tsx`, `src/components/AttendanceCalculator.tsx`, `src/types/attendance.ts`, `src/App.tsx`, `src/components/Layout.tsx` | none | DONE |
| M2 | Attendance Reality Math & Gemini AI Regulator Bridge | `src/components/AttendanceTracker.tsx`, `src/services/attendanceRegulatorService.ts` | M1 | DONE |
| M3 | Dynamic Daily Insight Regeneration & Log Adaptation | `src/components/Dashboard.tsx`, `src/components/InsightsPanel.tsx`, `src/context/AppContext.tsx` | none | DONE |
| M4 | Real-Time Cross-Device Cloud Sync & Persistence | `src/services/cloudSyncService.ts`, `src/context/AppContext.tsx` | none | DONE |
| M5 | AI Gateway Streamlining, Cosmos Branding & 2028 Targets | `src/components/AIGateway.tsx`, `src/components/Layout.tsx`, `src/App.tsx`, `src/components/ExamCountdown.tsx`, `src/components/Goals.tsx` | none | DONE |
| M6 | Master E2E Test Suite & Build Verification | `src/test/`, `src/test/allTests.test.ts`, `tsc --noEmit`, `vite build` | M1, M2, M3, M4, M5 | DONE |

## Interface Contracts
### AttendanceTracker ↔ App & Layout
- Route identifier: `'attendance'` in `ActiveTabType`
- Label: `"Attendance & Regulatory AI"`, Icon: `GraduationCap`
- Local storage keys: `savantix_attendance_institutional_v1`, `savantix_attendance_data_v1`
- Export contract: `AttendanceTracker` component rendered in `App.tsx` (with backwards-compatible export/wrapper for `AttendanceCalculator`)

### Daily Insights ↔ Dashboard & AppContext
- Function: `reanalyzeDailyInsights(date: string, todayLogs: StudyLog[])`
- Component trigger: `<button onClick={handleGenerate}>🔄 Re-analyze with Latest Logs</button>`
- Local storage key: `savantix_user_insights_${uid}`
- Cloud Sync payload key: `insights: any[]`

### CloudSyncService ↔ AppContext
- Listener: `subscribeToCloudSync(canonicalId: string, onUpdate: (data: CloudSyncPayload) => void)`
- Auth session key: `savantix_user_session`
- Sync Hub collection: `sync_hub` / `deb_sync_<sanitized_email>`

### AI Gateway ↔ Navigation
- Global trigger: `window.dispatchEvent(new CustomEvent('savantix_open_ai_gateway'))` / `Alt+G`
- Roster: 7 external frontier model endpoints + In-App Socratic KaTeX solver
