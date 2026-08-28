# 🛡️ Savantix (Aegis) — Universal AI Study Optimization & Decision-Support System

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live%20Deployment-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://aegis1-blond.vercel.app/)
[![React 19](https://img.shields.io/badge/React-19.0.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.1-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Cloud%20Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-16%20Free%20Models-6366F1?style=for-the-badge)](https://openrouter.ai/)

**Savantix (Aegis)** is an elite, zero-friction AI decision-support platform designed for competitive STEM aspirants (JEE Advanced, Physics & Math Olympiads, IPhO, Elite Academics). 

Unlike rigid calendar planners, Savantix combines **natural language study logging**, **constraint-aware daily AI performance optimization**, **SM-2 spaced repetition flashcards with LaTeX KaTeX and inline SVG diagrams**, and a **Universal Multi-Provider AI Architecture** with client-side zero-leak encrypted storage.

---

## 🌐 Live Production Access

* **Production URL:** [https://aegis1-blond.vercel.app/](https://aegis1-blond.vercel.app/)
* **GitHub Repository:** [https://github.com/partofcosmos-site/aegis1](https://github.com/partofcosmos-site/aegis1)
* **Access Modes:**
  * **Google One-Tap Cloud Sync:** Instant synchronization across phone, tablet, and PC via Cloud Firestore.
  * **Explore Demo / Guest Mode:** 100% offline, privacy-first local storage execution with zero login barriers.

---

## ⚡ Core Feature Suite

### 1. 📊 Natural Language Study Logging & NLP Parser
* Type or dictate study sessions naturally (e.g. *"Did 2h physics rotation, solved 25 questions, torque mistakes"*).
* Automatically extracts `subject`, `topic`, `subtopic`, converts duration to minutes (`2h` $\to$ `120m`), isolates practice problem counts from lecture watch time, and infers focus/efficiency ratings ($1-10$).
* Retrospective date picker allows historical backlogging with local timezone accuracy (`date-fns`).

### 2. 🧠 Constraint-Aware AI Daily Analysis
* High-reasoning performance synthesis factoring in real-world constraints (daily school hours, tuition, fatigue).
* Generates:
  * Executive Performance Summary
  * Hidden Weakness Identification
  * Recurring Mistake Patterns
  * Constraint-Aware Prioritized Next-Day Plan

### 3. 🗂️ SuperMemo-2 (SM-2) Flashcards & KaTeX Engine
* Dynamic Ease Factor ($EF \ge 1.3$) spaced repetition scheduling across 4 review tiers (*Again, Hard, Good, Easy*).
* Full LaTeX mathematical rendering ($...$ inline, $$...$$ block) powered by KaTeX.
* **Multimodal Diagram Generation:** Generates inline, scalable SVG vector diagrams for physics force vectors, geometric proofs, and circuit schematics.
* **Anki Importer:** Full CSV/TSV import with cloze deletion support (`{{c1::answer}}`).
* 3D hardware-accelerated card flip animations.

### 4. 📈 Continuous Study Analytics
* Continuous calendar timeline of total study volume plotted via Recharts.
* Proportional subject distribution donut charts and exact minute breakdowns.
* Smart multi-subject tokenization (splitting *"Physics and Math 120m"* evenly).

### 5. ⏱️ Drift-Free Pomodoro Focus Timer
* 15/25/50/90 min Focus & 5/10/15/30 min Break presets.
* Wall-clock target tracking (`targetEndTimeRef`) eliminating background tab timer drift.
* Automatic mode transitions, dual-tone audio completion chimes, auto-logging to database, and integrated Lofi radio stream.

### 6. 💬 Savantix Conversational Assistant & Voice Engine
* Multi-turn strategic study advisor with Firestore persistence.
* Built-in tools: Direct session logging (`logStudySession`) and tab navigation (`navigateApp`).
* Web Audio API streaming text-to-speech engine with 6 natural voice models (`Puck`, `Charon`, `Fenrir`, `Kore`, `Zephyr`, `Aoede`) and variable playback speeds ($0.5\times - 2\times$).

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

### 🏆 Top 5 Free Models for Students & Researchers

1. **`liquid/lfm-2.5-2.6b:free` (Speed Champion — 1,714 ms)**: Ultra-low latency responses, ideal for real-time quick logging and instant flashcard lookups.
2. **`inclusionai/ling-3.0-flash-fin:free` (Fast & Consistent — 2,550 ms)**: 100% uptime with rapid analytical feedback.
3. **`nvidia/nemotron-3-super-120b-a12b:free` (STEM & Math Champion — 2,578 ms)**: Flawless mathematical proofs (energy conservation, multi-variable calculus) and strict JSON schema compliance.
4. **`cohere/north-mini-code:free` (Code & Logic — 2,706 ms)**: Reliable structured data generation without markdown code block corruption.
5. **`nvidia/nemotron-3-ultra-550b-a55b:free` (Deep Reasoning — 3,144 ms)**: Massive 550B MoE capacity for complex multi-step Olympiad problem synthesis.

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
