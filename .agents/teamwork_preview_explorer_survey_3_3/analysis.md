# 🛡️ Savantix (Aegis) — Explorer 3 Survey & Architectural Analysis Report

> **Target Platform:** Savantix Production (`https://savantix.vercel.app/`)  
> **Prepared by:** Explorer 3 (`teamwork_preview_explorer_survey_3_3`)  
> **Focus:** AI Gateway Roster (R5), Socratic STEM Solver & KaTeX Integration, Cosmos Initiative Branding & Anonymity (Core Directive 2), and Comprehensive E2E Test Architecture (`src/test/`).

---

## 1. Executive Summary & Problem Boundaries

This survey establishes the complete architectural mapping for:
1. **AI Gateway Streamlining & Fast Model Roster (R5)**: Elimination of deprecated endpoints (e.g. `You.com`, broken search proxies), integration of zero-latency launch buttons for all 7 frontier AI services, and real-time 4-Tier In-App Socratic derivations with KaTeX formula rendering.
2. **Cosmos Initiative Branding & Anonymity Protocol (Core Directive 2)**: Standardizing the initiative subtitle **"An initiative of Part of Cosmos"** across public headers, sidebars, and footers while enforcing strict identity anonymization ("Lead Scholar" / "Core Researcher") across public-facing UI.
3. **Institutional Attendance & Dynamic Insights Testing (R1–R4)**: Mapping out the data contracts for The Bandhan School Aranghata, on-duty IIT Kharagpur credits, CBSE condonation math, Gemini Web AI Regulator, and dynamic daily insight re-analysis.
4. **Master E2E Test Suite Architecture (`src/test/`)**: Evaluating the current Node `tsx` test framework and designing modular test suites for full R1–R5 automated verification.

---

## 2. AI Gateway Architecture & Model Roster (R5)

### 2.1 Deprecated Endpoints Audit & Elimination
- **Audited Services**:
  - `You.com` and custom scraping search proxies have been completely excised from `AI_SERVICES` to eliminate CORS failures, bot-blocking 403s, and broken iframe/search routes.
  - All external AI gateway entries are mapped to canonical, active, and verified entry points.

### 2.2 Frontier Fast Launch Roster (7 Target Models)
The AI Gateway now features a high-visibility, zero-latency 1-click Fast Action Bar for the 7 specified frontier models:

| # | Frontier Model / Service | Entry URL / Query Route | Launch Mode | Category | Best Use Case |
|---|--------------------------|-------------------------|-------------|----------|---------------|
| 1 | **ChatGPT (GPT-4o / o3)** | `https://chatgpt.com/?q=${q}` | Direct URL + Clipboard Bridge | Frontier | General STEM reasoning, code synthesis & Olympiad proofs |
| 2 | **DeepSeek R1** | `https://chat.deepseek.com/` | Clipboard Bridge (`Ctrl+V`) | Frontier | Deep chain-of-thought, Olympiad math & formal logic |
| 3 | **Google Gemini 2.5 Pro** | `https://gemini.google.com/app` | Clipboard Bridge (`Ctrl+V`) | Frontier | Multimodal diagrams, 1M context textbook reasoning |
| 4 | **Claude 3.7 Sonnet** | `https://claude.ai/` | Clipboard Bridge (`Ctrl+V`) | Frontier | Extended thinking, physics intuition, rigorous derivations |
| 5 | **Perplexity AI** | `https://www.perplexity.ai/search?q=${q}` | Direct URL + Clipboard Bridge | Search | Real-time academic citations & paper discovery |
| 6 | **Wolfram Alpha** | `https://www.wolframalpha.com/input?i=${q}` | Direct URL + Clipboard Bridge | Science | Exact analytical integrals, differential equations & eigenvalues |
| 7 | **DuckDuckGo AI Chat** | `https://duckduckgo.com/?q=DuckDuckGo+AI+Chat&ia=chat` | Direct URL + Clipboard Bridge | Search | 100% private, anonymous AI chat (Zero Login) |

### 2.3 In-App Socratic Derivation Drawer & KaTeX Integration
- **Engine**: `src/utils/socraticStemEngine.ts` (`SocraticStemEngine.deriveSolution(query, subject, difficulty)`).
- **Zero-Latency Offline Derivation**:
  - **Tier 1: Core Physical Intuition & Mental Model**: Intuitive qualitative decomposition without formulas + asymptotic checks + self-check conceptual prompt.
  - **Tier 2: Governing Laws & Coordinate Setup**: Principles catalog, coordinate frame definitions, and foundational equations in LaTeX.
  - **Tier 3: Step-by-Step Derivation & Intermediate Steps**: Sequential algebra, Lagrangian reductions, and intermediate LaTeX steps.
  - **Tier 4: Rigorous Final Result & Verification**: Boxed final result (`\boxed{...}`), full proof, dimensional analysis check ($[X] = \text{M}^a \text{L}^b \text{T}^c$), and normalized numerical benchmark.
- **KaTeX Rendering Stack**:
  - Package dependencies: `katex` (v0.16.44), `remark-math` (v6.0.0), `rehype-katex` (v7.0.1), `react-markdown` (v10.1.0).
  - Stylesheet: `import "katex/dist/katex.min.css";` loaded globally and scoped inside derivation blocks.
  - Format support: Inline math (`$...$`) and Block math (`$$...$$`).
- **Interaction & Ergonomics**:
  - Global hotkey: **Alt+G** toggles the drawer instantly from any view.
  - Persistent Floating Action Button in `Layout.tsx` (`AIGatewayButton`).
  - Auto-copy to clipboard on launch: Whenever a user clicks any external model card, the prompt in the textarea is automatically copied to `navigator.clipboard` with an instant confirmation toast.

---

## 3. Initiative Branding & User Anonymity Architecture (Core Directive 2)

### 3.1 Subtitle Placement Specification: *"An initiative of Part of Cosmos"*
The brand subtitle must be visible across all public header, sidebar, and footer surfaces:

1. **Desktop Sidebar (`src/components/Layout.tsx`)**:
   ```tsx
   <div className="hidden md:flex p-6 items-center gap-3 border-b border-zinc-800/80">
     <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
       <BrainCircuit className="w-5 h-5 text-white" />
     </div>
     <div>
       <h1 className="text-lg font-bold tracking-tight text-zinc-100">Savantix</h1>
       <p className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">
         An initiative of Part of Cosmos
       </p>
     </div>
   </div>
   ```

2. **Mobile Header (`src/components/Layout.tsx`)**:
   ```tsx
   <div className="flex items-center gap-3">
     <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
       <BrainCircuit className="w-5 h-5 text-white" />
     </div>
     <div>
       <h1 className="text-xl font-bold tracking-tight text-zinc-100">Savantix</h1>
       <p className="text-[10px] text-zinc-400 font-medium tracking-wide">
         An initiative of Part of Cosmos
       </p>
     </div>
   </div>
   ```

3. **Public Component Footers (Dashboard, ContactFeedback, AttendanceTracker, AIGateway Drawer)**:
   - Standardized badge:
     ```tsx
     <div className="text-center py-4 text-xs text-zinc-500 border-t border-zinc-900">
       <span>Savantix OS • </span>
       <span className="text-indigo-400 font-medium">An initiative of Part of Cosmos</span>
     </div>
     ```

### 3.2 User Anonymity Protocol
- **Display Name Sanitization**:
  - Public UI components mask real founder names:
    ```tsx
    const displayScholarName = user?.displayName && !user.displayName.toLowerCase().includes('debanjan') 
      ? user.displayName 
      : 'Lead Scholar';
    ```
- **Founder Role Badge**:
  - Displays `"Core Researcher"` or `"Lead Scholar"` with a subtle gold crown icon, protecting private student identity while acknowledging contributor status.
- **Zero Public Cloud Leakage**:
  - Queries made to In-App Socratic Solver remain 100% in local memory and are never broadcasted to external tracking servers.

---

## 4. Test Infrastructure & Test Suite Plan (`src/test/`)

### 4.1 Current Test Harness Evaluation
- **Test Runner**: Node.js + `tsx` executing pure TypeScript test suites without requiring heavy browser DOM overhead for logic engines.
- **Execution Command**:
  ```powershell
  & "C:\Program Files\nodejs\node.exe" ./node_modules/tsx/dist/cli.mjs src/test/allTests.test.ts
  ```
- **Current Performance**: **32/32 tests passing cleanly in ~155ms** across 3 test suites:
  1. `contactFeedback.test.ts` (12/12 passed)
  2. `youtubeAudioService.test.ts` (13/13 passed)
  3. `zeroDataLoss.test.ts` (7/7 passed)

### 4.2 Proposed Comprehensive Test Plan for R1–R5

To verify all requirements from the 2026-09-01 specification, we propose adding modular test suites integrated into `allTests.test.ts`:

```
src/test/
├── allTests.test.ts                    # Master test runner aggregating all test suites
├── contactFeedback.test.ts             # Contact & Feedback Hub tests (12 tests)
├── youtubeAudioService.test.ts         # YouTube Focus Audio Engine tests (13 tests)
├── zeroDataLoss.test.ts                # Storage Invariants & Cloud Sync tests (7 tests)
├── attendanceAiRegulator.test.ts       # [NEW] Bandhan School Ingestion, Reality Math & Gemini Bridge (R1, R2)
├── dynamicInsightRegeneration.test.ts  # [NEW] Cumulative daily insight re-analysis tests (R3)
├── aiGatewayFastRoster.test.ts         # [NEW] Fast Model Roster, Socratic 4-tier & KaTeX tests (R5)
└── cosmosBrandingAnonymity.test.ts      # [NEW] Initiative subtitle & identity sanitization tests (Core Directive 2)
```

#### Detailed Test Coverage Matrix for New Suites:

| Suite | Feature Area | Specific Invariants & Test Cases |
|---|---|---|
| **`attendanceAiRegulator.test.ts`** | R1 & R2 | 1. Ingests Bandhan School Aranghata calendar (2026-04-21 to 2026-12-31, 139 projected days).<br>2. Verifies 69 held days, 48 present, 21 absent, 10 on-duty IIT Kharagpur credits.<br>3. Computes exact attendance percentage: `(48 + 10) / 69 = 84.06%` and raw `48/69 = 69.57%`.<br>4. Verifies safe absence allowance to Dec 31: 13 days for 75% target, 34 days for 60% condonation.<br>5. Validates consecutive recovery formula `C_rec = ceil((0.75 * T - (P + OD)) / 0.25)`.<br>6. Validates Gemini Web regulator payload schema with CBSE circular by-laws & strategy prompts. |
| **`dynamicInsightRegeneration.test.ts`** | R3 | 1. Verifies that adding new study logs to an existing date invalidates stale snapshot cache.<br>2. Tests "Re-analyze with Latest Logs" re-evaluates cumulative study time, efficiency scores, and mistake patterns.<br>3. Non-destructive update: ensures historical journal notes and previous day reflections are never overwritten. |
| **`aiGatewayFastRoster.test.ts`** | R5 | 1. Validates all 7 frontier fast launch entries (ChatGPT, DeepSeek R1, Gemini 2.5 Pro, Claude 3.7 Sonnet, Perplexity, Wolfram, DuckDuckGo AI Chat).<br>2. Asserts zero deprecated endpoints (e.g. `You.com`, dead search proxies).<br>3. Tests `SocraticStemEngine.deriveSolution` generates complete 4-tier output (Intuition, Governing, Derivation, Final Answer).<br>4. Verifies valid KaTeX formulas (`\sum`, `\int`, `\mathcal{L}`, `\boxed{...}`).<br>5. Validates clipboard auto-copy bridge and URL query construction. |
| **`cosmosBrandingAnonymity.test.ts`** | Core Directive 2 | 1. Asserts initiative subtitle `"An initiative of Part of Cosmos"` is declared in layout/header constants.<br>2. Verifies student identity sanitization masks raw founder name to `"Lead Scholar"` or `"Core Researcher"`.<br>3. Verifies zero leakage of private identifiers in exported feedback tickets or clipboard exports. |

---

## 5. Architectural Recommendations for Implementation Agents

1. **AIGateway Fast Action Strip**:
   - Add a compact, horizontal quick-launch row directly below the query textarea for 1-click model switching with clear icon badges.
2. **KaTeX Styling Assurance**:
   - Ensure KaTeX font stylesheets are imported and CSS classes (`katex`, `katex-display`) render without horizontal layout overflow on mobile screens.
3. **Cosmos Branding Uniformity**:
   - Verify that all public views (Layout desktop sidebar, mobile header, auth wrapper, and footer) render `"An initiative of Part of Cosmos"`.
4. **Test Suite Integration**:
   - Export all runner functions (`runAttendanceAiRegulatorTests`, `runAiGatewayFastRosterTests`, etc.) and register them inside `allTests.test.ts` so `npm test` or `tsx src/test/allTests.test.ts` validates the entire platform in a single pass.
