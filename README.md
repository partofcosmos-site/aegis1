# 🛡️ Savantix (Aegis) — Universal AI Study Optimization & Decision-Support System

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live%20Deployment-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://savantix.vercel.app/)
[![React 19](https://img.shields.io/badge/React-19.0.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.1-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Cloud%20Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-16%20Free%20Models-6366F1?style=for-the-badge)](https://openrouter.ai/)

**Savantix (Aegis)** is an elite, zero-friction AI decision-support platform designed for competitive STEM aspirants (JEE Advanced, Physics & Math Olympiads, IPhO, Elite Academics). 

### 💧 The Core Philosophy: "Frictionless as Drinking Water"
Keeping a physical study logbook or navigating complex productivity tools drains mental energy. Savantix eliminates all logging resistance: speak or type a one-line thought (*"Did 2h rotation, 25 Qs, torque mistakes"*), and the system automatically extracts subjects, practice problem counts, duration, and mistakes into structured analytics, spaced repetition cards, and visual progress maps.

---

## 🌐 Live Production Access

* **Production URL:** [https://savantix.vercel.app/](https://savantix.vercel.app/)
* **GitHub Repository:** [https://github.com/partofcosmos-site/aegis1](https://github.com/partofcosmos-site/aegis1)
* **Access Modes:**
  * **Google One-Tap Cloud Sync:** Instant synchronization across phone, tablet, and PC via Cloud Firestore.
  * **Explore Demo / Guest Mode:** 100% offline, privacy-first local storage execution with zero login barriers.

---

## ⚡ Next-Generation Feature Suite

### 1. 📊 Natural Language Study Logging & NLP Parser
* Type or dictate study sessions naturally via **Web Speech Voice-to-Text**.
* Automatically extracts `subject`, `topic`, `subtopic`, converts duration (`2h` $\to$ `120m`), isolates practice problem counts from lecture time, and infers focus/efficiency ratings ($1-10$).
* **Live Active Model Badge:** Dynamically displays the current AI model processing your logs.
* **Persistent Multi-Tab Viewport:** Switching tabs never interrupts ongoing AI generation, audio streaming, or timers.

### 2. 📅 52-Week Study Streak & Velocity Heatmap (`StudyHeatmap.tsx`)
* GitHub-style 52-week (364-day) continuous activity track directly on Dashboard & Analytics.
* Dynamic 4-tier intensity shading mapping daily hours:
  * Tier 4 (4+ hrs): Mastery Indigo
  * Tier 3 (2.5 - 4 hrs): Deep Focus
  * Tier 2 (1 - 2.5 hrs): Solid Session
  * Tier 1 (< 1 hr): Review / Quick
* Real-time streak tracking (Current Streak, Longest Streak, Active Days).

### 3. 🎯 Dynamic Exam Countdown & Velocity Forecaster (`ExamCountdown.tsx`)
* Live milestone countdown tickers for competitive targets (JEE Advanced, IPhO, NSEP, MIT SAT).
* Automatically calculates daily pace requirements (e.g. *"Pace required: 2.8 hrs/day"* to hit preparation targets).
* Interactive progress bars and custom exam target creation.

### 4. 🔬 Socratic STEM & Olympiad Step-by-Step Solver (`StemSolver.tsx`)
* 6-phase progressive problem breakdown for difficult physics, calculus, and chemistry problems.
* **Tiered Socratic Hints:** Reveal hints on-demand to preserve the deliberate active problem-solving struggle.
* Full mathematical formatting powered by KaTeX ($...$ inline, $$...$$ block) and boxed final answers.

### 5. 🕸️ Interactive Concept Mastery & Topic Graph (`ConceptGraph.tsx`)
* 2D visual dependency graph mapping prerequisite chains and downstream concepts across Physics, Math, and Chemistry.
* Dynamic mastery heat telemetry:
  * **Olympiad Master ($\ge 90\%$):** Emerald Glow
  * **Proficient ($75-89\%$):** Indigo
  * **Practicing ($60-74\%$):** Amber
  * **Needs Focus ($<60\%$):** Red
* Slide-out inspector drawer detailing prerequisites and connected concepts.

### 6. 🧠 Multi-Model AI Council Consensus Engine
* Dispatches complex queries simultaneously to multiple top-performing free models (e.g. `liquid/lfm-2.5-2.6b:free` for speed, `nvidia/nemotron-3-super-120b-a12b:free` for STEM accuracy, `z-ai/glm-5.2:free` for reasoning).
* Synthesizes cross-model agreements into unified, high-confidence strategic advice.

### 7. 🗂️ SuperMemo-2 (SM-2) Flashcards & KaTeX Engine
* Dynamic Ease Factor ($EF \ge 1.3$) spaced repetition scheduling across 4 review tiers (*Again, Hard, Good, Easy*).
* Multimodal AI card generator with inline SVG diagram creation for circuits, force vectors, and geometry.
* Anki CSV/TSV import with cloze deletion support (`{{c1::answer}}`).

### 8. ⏱️ Drift-Free Pomodoro Focus Timer
* 15/25/50/90 min Focus & 5/10/15/30 min Break presets.
* Wall-clock target tracking (`targetEndTimeRef`) eliminating background tab timer drift.
* Dual-tone Web Audio chimes and integrated Lofi focus stream.

---

## 🔬 OpenRouter Robustness & Multi-Call Stress Benchmark

A comprehensive stress-test benchmark was conducted across all **16 Free Tier Models** on OpenRouter, evaluating 96 consecutive STEM queries (Physics mechanics, Calculus derivatives, JSON schema extraction, latency pings) with automated 7-key rotation and exponential backoff.

### 📊 Master Benchmark Matrix

| Model Identifier | Success Rate | Avg Latency | Min Latency | Max Latency | P90 Latency | Stability Grade & Categorization |
|:---|:---:|:---:|:---:|:---:|:---:|:---|
| **`liquid/lfm-2.5-2.6b:free`** | **6/6 (100.0%)** | **1714.0 ms** | 1004.2 ms | 2310.2 ms | 2310.2 ms | 🏆 **Grade A** — Fastest & 100% Reliable |
| **`inclusionai/ling-3.0-flash-fin:free`** | **6/6 (100.0%)** | **2550.9 ms** | 1529.0 ms | 3619.8 ms | 3619.8 ms | 🚀 **Grade A** — High-Speed & 100% Reliable |
| **`nvidia/nemotron-3-super-120b-a12b:free`** | **6/6 (100.0%)** | **2578.8 ms** | 1278.1 ms | 4096.4 ms | 4096.4 ms | 🚀 **Grade A** — Top STEM & Calculus Accuracy |
| **`cohere/north-mini-code:free`** | **6/6 (100.0%)** | **2706.1 ms** | 1216.7 ms | 4741.7 ms | 4741.7 ms | 🚀 **Grade A** — Best for Coding & Logic |
| **`poolside/laguna-xs-2.1:free`** | **6/6 (100.0%)** | **2891.7 ms** | 1265.6 ms | 4780.8 ms | 4780.8 ms | 🚀 **Grade A** — Lightweight & 100% Reliable |
| **`nvidia/nemotron-3-ultra-550b-a55b:free`** | **6/6 (100.0%)** | **3144.7 ms** | 1049.0 ms | 5436.4 ms | 5436.4 ms | 🌟 **Grade A** — Flagship 550B MoE Deep Reasoning |
| **`dots-studio/dots-3-note-preview:free`** | **6/6 (100.0%)** | **3162.7 ms** | 1561.9 ms | 4039.7 ms | 4039.7 ms | 🌟 **Grade A** — Fast Note Summarization |
| **`nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`** | **6/6 (100.0%)** | **3957.9 ms** | 842.9 ms | 7907.8 ms | 7907.8 ms | 🌟 **Grade A** — Step-by-Step Chain of Thought |
| **`minimax/minimax-m2.7:free`** | **6/6 (100.0%)** | **4018.2 ms** | 3051.1 ms | 5191.9 ms | 5191.9 ms | 🌟 **Grade A** — Structured JSON Parsing |
| **`minimax/minimax-m3:free`** | **6/6 (100.0%)** | **4819.3 ms** | 2627.2 ms | 10712.8 ms | 10712.8 ms | 🌟 **Grade A** — Complex Multilingual Synthesis |
| **`poolside/laguna-s-2.1:free`** | **6/6 (100.0%)** | **6122.5 ms** | 1858.7 ms | 10090.6 ms | 10090.6 ms | 🌟 **Grade A** — Software & Architecture Synthesis |
| **`z-ai/glm-5.2:free`** | **2/6 (33.3%)** | **1799.4 ms** | 1751.2 ms | 1847.7 ms | 1847.7 ms | ⚠️ **Grade D** — Heavy Provider Rate Limiting |
| **`thinkingmachines/inkling:free`** | **0/6 (0.0%)** | N/A | N/A | N/A | N/A | 🚫 **Offline** (HTTP 403 Access Forbidden) |
| **`thinkingmachines/inkling-small:free`** | **0/6 (0.0%)** | N/A | N/A | N/A | N/A | 🚫 **Offline** (HTTP 403 Access Forbidden) |
| **`nvidia/nemotron-3.5-lightning:free`** | **0/6 (0.0%)** | N/A | N/A | N/A | N/A | 🚫 **Retired** (HTTP 404 Model Not Found) |
| **`nvidia/llama-nemotron-rerank-vl-1b-v2:free`** | **0/6 (0.0%)** | N/A | N/A | N/A | N/A | 🚫 **Specialized** (Rerank Endpoint Only) |

---

## 🔒 Zero-Leak Privacy & Multi-Provider Architecture

* **Client-Side Encrypted Storage:** API keys are stored strictly in the user's private browser `localStorage` vault (`AIVaultService`). Keys are never sent to remote Firestore databases, Vercel build logs, or GitHub commits.
* **Smart Documentation Snippet Importer:** Paste any code snippet (Python SDK, cURL command, JavaScript fetch, or JSON config) directly from any provider documentation to auto-detect the Base URL, Model ID, and API key in 1 click.
* **Live Model Discovery:** Dynamically queries `GET /models` on custom endpoints (OpenRouter, Groq, Ollama, LM Studio, Together AI) to populate models without hardcoded constraints.

---

## 🛠️ Tech Stack & Architecture

* **Frontend Framework:** React 19 + TypeScript
* **Build Tooling:** Vite 6 + `@vitejs/plugin-react` + `@tailwindcss/vite`
* **Styling:** Tailwind CSS v4 + `@tailwindcss/typography`
* **Math Notation:** KaTeX (`rehype-katex`, `remark-math`, `marked-katex-extension`)
* **Charts & Analytics:** Recharts
* **Backend Database:** Google Cloud Firestore
* **Hosting:** Vercel Edge Global CDN

---

## 🚀 Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/partofcosmos-site/aegis1.git
cd aegis1

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Open in browser
# http://localhost:3000
```

---

## 📄 License
MIT License © 2026 Savantix / Debanjan Biswas. All rights reserved.
