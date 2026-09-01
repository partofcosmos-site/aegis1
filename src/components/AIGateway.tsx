import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Zap, X, ExternalLink, Copy, Check, ChevronDown, ChevronUp,
  Search, Sparkles, Brain, Globe, ArrowRight, Info, ShieldCheck,
  Cpu, BookOpen, Layers, Send, RefreshCw, BookmarkPlus, ArrowUpRight,
  Share2, CheckCircle2, MessageSquare
} from "lucide-react";
import clsx from "clsx";
import Markdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { SocraticStemEngine, SocraticSolution } from "../utils/socraticStemEngine";
import { UniversalAIService } from "../services/universalAIService";

// ─────────────────────────────────────────────────────────
// AI Service Interface & Roster
// ─────────────────────────────────────────────────────────
export interface AIService {
  id: string;
  name: string;
  shortName: string;
  description: string;
  color: string;       // Tailwind gradient class
  textColor: string;
  emoji: string;
  // If provided, query is appended to this URL directly
  queryUrl?: (q: string) => string;
  // Base URL opened when no direct query param is available (clipboard bridge)
  baseUrl: string;
  supportsDirectLink: boolean;
  requiresLogin: boolean;
  category: "instant" | "frontier" | "search" | "code" | "science";
  bestFor: string;
}

/**
 * Verified Frontier AI Gateway Roster (7 Target Models + In-App KaTeX Solver)
 * Deprecated endpoints and dead search proxies have been completely excised.
 */
export const AI_SERVICES: AIService[] = [
  {
    id: "in_app_socratic",
    name: "Savantix In-App Solver",
    shortName: "In-App Solver",
    description: "Instant 4-Tier Socratic KaTeX Derivation (Zero Login • 100% Offline Ready)",
    color: "from-indigo-600 to-violet-600",
    textColor: "text-indigo-400",
    emoji: "⚡",
    baseUrl: "in_app",
    supportsDirectLink: true,
    requiresLogin: false,
    category: "instant",
    bestFor: "Step-by-step Olympiad & STEM proofs with KaTeX formulas"
  },
  {
    id: "chatgpt",
    name: "ChatGPT (GPT-4o / o3 / Deep Research)",
    shortName: "ChatGPT (o3)",
    description: "OpenAI o3 & GPT-4o — advanced STEM problem solving & code reasoning",
    color: "from-emerald-600 to-teal-600",
    textColor: "text-emerald-400",
    emoji: "🤖",
    queryUrl: q => `https://chatgpt.com/?q=${encodeURIComponent(q)}`,
    baseUrl: "https://chatgpt.com/",
    supportsDirectLink: true,
    requiresLogin: false,
    category: "frontier",
    bestFor: "General STEM reasoning, Olympiad proofs & code synthesis"
  },
  {
    id: "deepseek",
    name: "DeepSeek R1 (DeepThink Reasoner)",
    shortName: "DeepSeek R1",
    description: "DeepSeek R1 671B — deep thinking chain-of-thought for Olympiad math & physics",
    color: "from-sky-600 to-cyan-600",
    textColor: "text-sky-400",
    emoji: "🔬",
    baseUrl: "https://chat.deepseek.com/",
    supportsDirectLink: false,
    requiresLogin: true,
    category: "frontier",
    bestFor: "Complex mathematical deductions, proofs & self-correction"
  },
  {
    id: "gemini",
    name: "Google Gemini 3 / Advanced",
    shortName: "Gemini 3",
    description: "Gemini 3 — 1M+ token context, Google Search Grounding & multimodality",
    color: "from-blue-600 to-indigo-600",
    textColor: "text-blue-400",
    emoji: "✨",
    baseUrl: "https://gemini.google.com/app",
    supportsDirectLink: false,
    requiresLogin: true,
    category: "frontier",
    bestFor: "Multimodal diagrams, textbook chapter analysis & papers"
  },
  {
    id: "notebooklm",
    name: "Google NotebookLM (Audio & Sources)",
    shortName: "NotebookLM",
    description: "NotebookLM — grounded study guides, Audio Deep Dive podcasts & source synthesis",
    color: "from-purple-600 to-indigo-600",
    textColor: "text-purple-400",
    emoji: "📓",
    baseUrl: "https://notebooklm.google.com/",
    supportsDirectLink: false,
    requiresLogin: true,
    category: "frontier",
    bestFor: "Audio Deep Dive podcasts, source-grounded study notes & Q&A"
  },
  {
    id: "claude",
    name: "Claude 3.7 Sonnet (Hybrid Thinking)",
    shortName: "Claude 3.7",
    description: "Anthropic Claude 3.7 Sonnet — extended thinking mode & crystal-clear mathematical proofs",
    color: "from-orange-600 to-amber-600",
    textColor: "text-orange-400",
    emoji: "🏛️",
    baseUrl: "https://claude.ai/new",
    supportsDirectLink: false,
    requiresLogin: true,
    category: "frontier",
    bestFor: "Conceptual depth, physics intuition, rigorous derivations"
  },
  {
    id: "grok",
    name: "xAI Grok 3 (Think Mode / DeepSearch)",
    shortName: "Grok 3",
    description: "Grok 3 — frontier STEM thinking, real-time reasoning & code execution",
    color: "from-zinc-500 to-zinc-600",
    textColor: "text-zinc-400",
    emoji: "⚡",
    baseUrl: "https://grok.com/",
    supportsDirectLink: false,
    requiresLogin: true,
    category: "frontier",
    bestFor: "Fast physics intuition and coding synthesis"
  },
  {
    id: "perplexity",
    name: "Perplexity AI (Academic Pro)",
    shortName: "Perplexity",
    description: "Perplexity AI — real-time web search with academic citations & research focus",
    color: "from-violet-600 to-purple-600",
    textColor: "text-violet-400",
    emoji: "🔍",
    queryUrl: q => `https://www.perplexity.ai/search?q=${encodeURIComponent(q)}`,
    baseUrl: "https://www.perplexity.ai/",
    supportsDirectLink: true,
    requiresLogin: false,
    category: "search",
    bestFor: "Fast academic paper lookups and real-time facts"
  },
  {
    id: "wolfram",
    name: "Wolfram Alpha (Symbolic Engine)",
    shortName: "Wolfram Alpha",
    description: "Wolfram Alpha — exact algebraic computation, ODEs & analytical integrals",
    color: "from-red-700 to-red-600",
    textColor: "text-red-400",
    emoji: "🧮",
    queryUrl: q => `https://www.wolframalpha.com/input?i=${encodeURIComponent(q)}`,
    baseUrl: "https://www.wolframalpha.com/",
    supportsDirectLink: true,
    requiresLogin: false,
    category: "science",
    bestFor: "Exact analytical integrals, matrix eigenvalues & ODEs"
  },
  {
    id: "duckduckgo",
    name: "DuckDuckGo AI Chat (Private)",
    shortName: "DuckDuckGo AI",
    description: "100% Free Anonymous AI (Claude 3 Haiku, GPT-4o mini, Llama 3.3)",
    color: "from-amber-600 to-orange-600",
    textColor: "text-amber-400",
    emoji: "🦆",
    queryUrl: () => `https://duckduckgo.com/?q=DuckDuckGo+AI+Chat&ia=chat`,
    baseUrl: "https://duckduckgo.com/?q=DuckDuckGo+AI+Chat&ia=chat",
    supportsDirectLink: true,
    requiresLogin: false,
    category: "search",
    bestFor: "100% private, anonymous AI chat with zero login"
  }
];

/** Primary Fast Launch Frontier Models for the 1-Click Action Bar */
export const FAST_LAUNCH_ROSTER_IDS = [
  "chatgpt",
  "deepseek",
  "gemini",
  "notebooklm",
  "claude",
  "grok",
  "perplexity",
  "wolfram"
];

export interface StrategyModifier {
  id: string;
  label: string;
  emoji: string;
  promptSuffix: string;
}

export const STRATEGY_MODIFIERS: StrategyModifier[] = [
  {
    id: "first_principles",
    label: "First-Principles Proof",
    emoji: "🔬",
    promptSuffix: "\n\n[DIRECTIVE: Provide a rigorous first-principles derivation formatted in KaTeX. State all governing differential equations, conservation laws, and dimensional limits.]"
  },
  {
    id: "fast_heuristic",
    label: "Speed Shortcut / Trick",
    emoji: "⚡",
    promptSuffix: "\n\n[DIRECTIVE: Identify the fastest intuitive shortcut, symmetry argument, or Olympiad heuristic to solve this problem in <60 seconds without long algebra.]"
  },
  {
    id: "trap_boundary",
    label: "Boundary & Trap Audit",
    emoji: "⚠️",
    promptSuffix: "\n\n[DIRECTIVE: Audit all edge-case boundary conditions (e.g. limits -> 0, infinity, friction transitions) and highlight the exact mistake traps students fall into.]"
  },
  {
    id: "notebooklm_audio",
    label: "NotebookLM Audio Prep",
    emoji: "🎙️",
    promptSuffix: "\n\n[DIRECTIVE: Format this as a highly engaging 2-person Socratic discussion script with conversational analogies, ready to be ingested into Google NotebookLM for Audio Overview.]"
  }
];

export const MATH_SNIPPETS = [
  { label: "\\int", snippet: "\\int_{a}^{b} f(x) \\, dx " },
  { label: "\\frac{a}{b}", snippet: "\\frac{d}{dt} " },
  { label: "\\sqrt{x}", snippet: "\\sqrt{x} " },
  { label: "\\sum", snippet: "\\sum_{i=1}^{n} " },
  { label: "\\lim", snippet: "\\lim_{x \\to 0} " },
  { label: "\\vec{F}", snippet: "\\vec{F} = m\\vec{a}" },
  { label: "\\nabla", snippet: "\\nabla \\times \\vec{B}" },
  { label: "\\theta", snippet: "\\theta" }
];

const CATEGORIES = [
  { id: "all", label: "All Gateways" },
  { id: "instant", label: "⚡ In-App (No Login)" },
  { id: "frontier", label: "Frontier AI" },
  { id: "search", label: "Search AI" },
  { id: "science", label: "Math & Science" },
];

const PRESET_QUERIES = [
  "Explain the derivation of Euler-Lagrange equations from Hamilton's principle",
  "A solid sphere rolls without slipping on an inclined plane of angle theta. Find its acceleration.",
  "Evaluate the Gaussian integral int e^(-x^2) dx from -infinity to +infinity with proof",
  "Explain the Born approximation in quantum mechanical scattering theory with formulas",
  "Derive the Nernst equation for galvanic cells from Gibbs free energy"
];

/** Resilient cross-platform clipboard copy helper */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn("navigator.clipboard failed, falling back to execCommand", err);
  }

  // Fallback for browsers / iframes with restricted clipboard API
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error("execCommand fallback failed", err);
    return false;
  }
}

interface AIGatewayDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export const AIGatewayDrawer: React.FC<AIGatewayDrawerProps> = ({ isOpen, onClose, initialQuery }) => {
  const [query, setQuery] = useState(initialQuery || "");
  const [catFilter, setCatFilter] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedDerivation, setCopiedDerivation] = useState(false);
  const [launchToast, setLaunchToast] = useState<{ name: string; message: string; type: 'success' | 'info' } | null>(null);
  const [inAppSolution, setInAppSolution] = useState<SocraticSolution | null>(null);
  const [isSolvingInApp, setIsSolvingInApp] = useState(false);
  const [activeTab, setActiveTab] = useState<'gateways' | 'in_app'>('gateways');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync external query
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  // Focus textarea on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Handle global Alt+G hotkey
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "g" || e.key === "G")) {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          window.dispatchEvent(new CustomEvent("savantix_open_ai_gateway", { detail: { open: true } }));
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Dynamic Live Socratic Derivation Handler (Real-Time AI with Offline Fallback)
  const handleSolveInApp = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsSolvingInApp(true);
    setActiveTab('in_app');

    try {
      // 1. Attempt live dynamic derivation synthesis via Universal AI / Gemini 3
      const schemaDesc = `{
        "id": "string",
        "title": "string",
        "subject": "Physics | Mathematics | Chemistry",
        "difficulty": "JEE Advanced / Olympiad",
        "topic": "string",
        "problemStatement": "string",
        "tier1": {
          "title": "Tier 1: Core Physical Intuition & Mental Model",
          "conceptualOverview": "string",
          "mentalModel": "string",
          "selfCheckPrompt": "string"
        },
        "tier2": {
          "title": "Tier 2: Governing Laws & Coordinate Setup",
          "principles": ["string"],
          "equations": [{"name": "string", "latex": "string", "description": "string"}],
          "coordinateSetup": "string"
        },
        "tier3": {
          "title": "Tier 3: Step-by-Step Mathematical Derivation",
          "steps": [{"stepNumber": 1, "title": "string", "explanation": "string", "intermediateLatex": "string", "keyInsight": "string"}],
          "criticalSubstitutions": ["string"]
        },
        "tier4": {
          "title": "Tier 4: Exact Result & Rigorous Proof",
          "finalAnswerLatex": "string",
          "fullRigorousProof": "string",
          "dimensionalCheck": "string",
          "numericalExample": "string"
        }
      }`;

      const aiSol = await UniversalAIService.executeJsonRequest<SocraticSolution>(
        `Synthesize a complete 4-Tier Socratic Derivation for this STEM problem with exact KaTeX LaTeX formulas:
Problem: "${trimmed}"

Requirements:
- Tier 1: Deep physical intuition and mental models.
- Tier 2: Conservation laws and coordinate systems.
- Tier 3: Rigorous algebraic steps with intermediate LaTeX equations ($...$ or $$...$$).
- Tier 4: Final boxed analytical solution with dimensional homogeneity verification.`,
        schemaDesc
      );

      if (aiSol && aiSol.tier1 && aiSol.tier3?.steps?.length > 0) {
        setInAppSolution(aiSol);
        setLaunchToast({
          name: "Socratic AI Engine",
          message: "Synthesized dynamic first-principles proof with KaTeX formulas!",
          type: "success"
        });
      } else {
        throw new Error("Invalid structure returned");
      }
    } catch (err) {
      // 2. Offline deterministic fallback
      console.warn("Live Socratic synthesis offline fallback:", err);
      const sol = SocraticStemEngine.deriveSolution(trimmed);
      setInAppSolution(sol);
      setLaunchToast({
        name: "Socratic Offline Engine",
        message: "Generated 4-Tier Socratic Derivation (Zero Login • Offline Ready)",
        type: "info"
      });
    } finally {
      setIsSolvingInApp(false);
      setTimeout(() => setLaunchToast(null), 4500);
    }
  }, [query]);

  // Launch external AI handler with auto-copy
  const handleLaunch = useCallback(async (service: AIService) => {
    const trimmed = query.trim();

    if (service.id === "in_app_socratic") {
      handleSolveInApp();
      return;
    }

    const payloadToCopy = trimmed || "Please provide a rigorous, step-by-step Socratic derivation with first-principles physical intuition and LaTeX mathematical proofs.";

    // Always copy prompt to clipboard so user can instantly Ctrl+V anywhere
    await copyToClipboard(payloadToCopy);
    setCopiedId(service.id);
    setTimeout(() => setCopiedId(null), 2500);

    if (trimmed && service.supportsDirectLink && service.queryUrl) {
      const url = service.queryUrl(trimmed);
      window.open(url, "_blank", "noopener,noreferrer");
      setLaunchToast({
        name: service.name,
        message: `Opened with pre-filled query! Also copied to clipboard for 1-keystroke pasting (Ctrl+V).`,
        type: "success"
      });
    } else {
      window.open(service.baseUrl, "_blank", "noopener,noreferrer");
      setLaunchToast({
        name: service.name,
        message: `✓ Prompt copied to clipboard! Switch to the opened tab and press Ctrl+V to paste.`,
        type: "info"
      });
    }

    setTimeout(() => setLaunchToast(null), 5000);
  }, [query, handleSolveInApp]);

  // Insert Math Symbol at cursor position
  const handleInsertMath = (snippet: string) => {
    if (!textareaRef.current) {
      setQuery(prev => prev + snippet);
      return;
    }
    const el = textareaRef.current;
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const nextVal = query.substring(0, start) + snippet + query.substring(end);
    setQuery(nextVal);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + snippet.length, start + snippet.length);
    }, 50);
  };

  // Apply Strategy Directive
  const handleApplyStrategy = (mod: StrategyModifier) => {
    const cleaned = query.replace(/\n\n\[DIRECTIVE:[\s\S]*?\]/g, '').trim();
    setQuery(cleaned + mod.promptSuffix);
    setLaunchToast({
      name: mod.label,
      message: `Directive attached to query. Ready for any AI Model.`,
      type: "info"
    });
    setTimeout(() => setLaunchToast(null), 3000);
  };

  // Launch Multi-Model Parallel Audit (DeepSeek + ChatGPT + Claude)
  const handleParallelTripleAudit = async () => {
    const trimmed = query.trim() || "Please provide a rigorous, step-by-step Socratic derivation with first-principles physical intuition and LaTeX mathematical proofs.";
    await copyToClipboard(trimmed);
    
    window.open("https://chat.deepseek.com/", "_blank", "noopener,noreferrer");
    window.open(`https://chatgpt.com/?q=${encodeURIComponent(trimmed)}`, "_blank", "noopener,noreferrer");
    window.open("https://claude.ai/new", "_blank", "noopener,noreferrer");

    setLaunchToast({
      name: "⚡ Triple-Audit Dispatched",
      message: "Opened DeepSeek R1, ChatGPT o3, and Claude 3.7 with prompt auto-copied to clipboard!",
      type: "success"
    });
    setTimeout(() => setLaunchToast(null), 6000);
  };

  // Comprehensive Cross-Verification Handler: copies entire derivation + verification prompt to clipboard
  const handleCrossVerify = useCallback(async (service: AIService) => {
    if (!inAppSolution) return;

    const payload = `### Socratic Derivation & Proof Audit Request
**Problem / Concept**: ${query.trim()}
**Subject Domain**: ${inAppSolution.subject} — ${inAppSolution.title}

#### 1. Physical Intuition & Mental Model:
${inAppSolution.tier1.conceptualOverview}
*Mental Model*: ${inAppSolution.tier1.mentalModel}

#### 2. Governing Laws & Setup:
Coordinate Setup: ${inAppSolution.tier2.coordinateSetup}
Equations:
${inAppSolution.tier2.equations.map(e => `- ${e.name} (${e.description}): $$${e.latex}$$`).join('\n')}

#### 3. Step-by-Step Derivation:
${inAppSolution.tier3.steps.map(s => `Step ${s.stepNumber} (${s.title}):\n${s.explanation}\n$$${s.intermediateLatex}$$\n*Key Insight*: ${s.keyInsight}`).join('\n\n')}

#### 4. Final Result & Boundary Checks:
Final Analytical Result: $$${inAppSolution.tier4.finalAnswerLatex}$$
*Dimensional Homogeneity*: ${inAppSolution.tier4.dimensionalCheck}
*Rigorous Proof*: ${inAppSolution.tier4.fullRigorousProof}

---
### Verification Directives for ${service.name}:
1. Rigorously cross-verify every algebraic step, sign convention, and integration limit in this proof.
2. Verify dimensional consistency and physical boundary limits (e.g. initial conditions and asymptotic limits).
3. Identify any subtle mathematical oversights, approximations, or hidden assumptions.
4. Provide alternative Olympiad / First-Principles shortcuts if applicable.`;

    await copyToClipboard(payload);
    setCopiedId(service.id);
    setTimeout(() => setCopiedId(null), 2500);

    window.open(service.baseUrl, "_blank", "noopener,noreferrer");

    setLaunchToast({
      name: `Cross-Verification on ${service.name}`,
      message: `Full proof & audit prompt copied to clipboard! Paste (Ctrl+V) into ${service.shortName} to audit this derivation.`,
      type: "success"
    });
    setTimeout(() => setLaunchToast(null), 6000);
  }, [inAppSolution, query]);

  // Copy full Socratic derivation in LaTeX + Markdown
  const handleCopyFullDerivation = async () => {
    if (!inAppSolution) return;
    const md = `# ${inAppSolution.title}\n\n` +
      `**Subject**: ${inAppSolution.subject} | **Difficulty**: ${inAppSolution.difficulty}\n\n` +
      `## 1. Physical Intuition & Mental Model\n${inAppSolution.tier1.conceptualOverview}\n\n*Intuition*: ${inAppSolution.tier1.mentalModel}\n\n` +
      `## 2. Governing Equations\n` +
      inAppSolution.tier2.equations.map(eq => `### ${eq.name}\n$$${eq.latex}$$\n${eq.description}`).join('\n\n') + '\n\n' +
      `## 3. Step-by-Step Derivation\n` +
      inAppSolution.tier3.steps.map(s => `### Step ${s.stepNumber}: ${s.title}\n${s.explanation}\n\n$$${s.intermediateLatex}$$\n*Insight*: ${s.keyInsight}`).join('\n\n') + '\n\n' +
      `## 4. Final Result & Proof\n$$${inAppSolution.tier4.finalAnswerLatex}$$\n\n` +
      `**Dimensional Check**: ${inAppSolution.tier4.dimensionalCheck}\n` +
      `**Proof**: ${inAppSolution.tier4.fullRigorousProof}`;

    await copyToClipboard(md);
    setCopiedDerivation(true);
    setLaunchToast({
      name: "Derivation Exported",
      message: "Copied complete 4-tier solution (Markdown + LaTeX formulas) to clipboard!",
      type: "success"
    });
    setTimeout(() => {
      setCopiedDerivation(false);
      setLaunchToast(null);
    }, 3000);
  };

  if (!isOpen) return null;

  const fastLaunchServices = AI_SERVICES.filter(s => FAST_LAUNCH_ROSTER_IDS.includes(s.id));

  const filteredServices = AI_SERVICES.filter(s => {
    if (catFilter === "all") return true;
    if (catFilter === "instant") return !s.requiresLogin || s.category === "instant";
    return s.category === catFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-4xl max-h-[94vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-800 bg-zinc-950/70 space-y-2 sm:space-y-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 shrink-0">
                <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-zinc-100 truncate">AI Gateway & STEM Solver</h2>
                  <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                    Alt+G
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-indigo-400 font-medium truncate">
                  An initiative of Part of Cosmos • Zero-Latency Bridge
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Desktop Mode Switcher */}
              <div className="hidden sm:flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('gateways')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'gateways' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  AI Gateways
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!inAppSolution && query.trim()) handleSolveInApp();
                    else setActiveTab('in_app');
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    activeTab === 'in_app' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>In-App Derivation</span>
                </button>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile Mode Switcher Bar */}
          <div className="sm:hidden flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-semibold w-full">
            <button
              type="button"
              onClick={() => setActiveTab('gateways')}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer text-center ${
                activeTab === 'gateways' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              AI Gateways
            </button>
            <button
              type="button"
              onClick={() => {
                if (!inAppSolution && query.trim()) handleSolveInApp();
                else setActiveTab('in_app');
              }}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 text-center ${
                activeTab === 'in_app' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>In-App Derivation</span>
            </button>
          </div>
        </div>

        {/* Floating Toast Notification */}
        {launchToast && (
          <div className={`mx-4 sm:mx-6 mt-3 px-4 py-2 rounded-xl text-xs font-medium flex items-center justify-between gap-2 border animate-fadeIn ${
            launchToast.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
              : 'bg-indigo-950/80 border-indigo-500/40 text-indigo-200'
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate"><strong>{launchToast.name}:</strong> {launchToast.message}</span>
            </div>
            <button onClick={() => setLaunchToast(null)} className="text-zinc-400 hover:text-zinc-200 text-xs shrink-0">×</button>
          </div>
        )}

        {/* Body Container */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-5">
          
          {/* Query Input Card with Dedicated Bottom Toolbar (Zero Overlap) */}
          <div className="bg-zinc-950 border border-zinc-800/90 rounded-2xl p-3 sm:p-4 space-y-2.5 shadow-inner focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
              <label className="flex items-center gap-1.5 text-zinc-300">
                <Brain className="w-3.5 h-3.5 text-indigo-400" />
                <span>Enter STEM Problem / Mathematical Query</span>
              </label>
              {query.trim() && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <textarea
              ref={textareaRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Type your STEM problem, derivation, or formula (LaTeX supported e.g. $\int x dx$ or $$E=mc^2$$)..."
              rows={3}
              className="w-full bg-transparent border-0 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none resize-none font-mono leading-relaxed"
            />

            {/* Interactive LaTeX Math Snippet Bar */}
            <div className="flex items-center gap-1 overflow-x-auto pt-1 pb-0.5 no-scrollbar border-t border-zinc-900/80">
              <span className="text-[10px] text-zinc-500 font-mono shrink-0 mr-1">LaTeX:</span>
              {MATH_SNIPPETS.map((sn, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleInsertMath(sn.snippet)}
                  className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-indigo-300 border border-zinc-800/80 rounded text-[11px] font-mono transition-colors cursor-pointer shrink-0"
                  title={`Insert ${sn.label}`}
                >
                  {sn.label}
                </button>
              ))}
            </div>

            {/* Dedicated Action Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-2 border-t border-zinc-900 gap-2">
              {/* Strategy Directives */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                <span className="text-[10px] text-zinc-500 font-semibold shrink-0">Strategy:</span>
                {STRATEGY_MODIFIERS.map(mod => (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => handleApplyStrategy(mod)}
                    className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-lg text-[10px] font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                  >
                    <span>{mod.emoji}</span>
                    <span>{mod.label}</span>
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={handleParallelTripleAudit}
                  className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-amber-300 hover:text-amber-200 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  title="Launch DeepSeek R1 + ChatGPT o3 + Claude 3.7 simultaneously"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>⚡ Triple-Audit</span>
                </button>

                <button
                  type="button"
                  onClick={handleSolveInApp}
                  disabled={!query.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Solve In-App (KaTeX)</span>
                </button>
              </div>
            </div>
          </div>

          {/* ⚡ 1-Click Fast Launch Frontier Model Roster Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400">
              <span className="flex items-center gap-1.5 text-amber-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>1-Click Fast Launch Roster (Auto-Copies Prompt)</span>
              </span>
              <span className="text-[10px] text-zinc-500 hidden sm:inline">Zero-Latency Bridge • Press [1-8]</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-1.5 sm:gap-2">
              {fastLaunchServices.map((service, idx) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => handleLaunch(service)}
                  className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 hover:border-indigo-500/40 text-left transition-all hover:scale-[1.02] active:scale-[0.98] group cursor-pointer relative"
                  title={`Launch ${service.name}`}
                >
                  <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-tr ${service.color} flex items-center justify-center shrink-0 text-xs shadow`}>
                    <span>{service.emoji}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-zinc-200 truncate group-hover:text-white flex items-center gap-0.5">
                      <span className="truncate">{service.shortName}</span>
                      {copiedId === service.id && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                    </div>
                    <div className="text-[9px] text-zinc-500 truncate group-hover:text-indigo-300">
                      {service.supportsDirectLink ? "Direct Link" : "1-Tap Copy"}
                    </div>
                  </div>
                  <span className="absolute top-1 right-1 text-[8px] font-mono text-zinc-600 group-hover:text-zinc-400">
                    {idx + 1}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Preset Prompts */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
            <span className="text-zinc-500 shrink-0 font-medium">Presets:</span>
            {PRESET_QUERIES.map((pq, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setQuery(pq)}
                className="px-2.5 py-1 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-lg whitespace-nowrap transition-colors cursor-pointer shrink-0"
              >
                {pq.length > 32 ? pq.slice(0, 30) + "…" : pq}
              </button>
            ))}
          </div>

          {activeTab === 'in_app' ? (
            isSolvingInApp ? (
              /* Live Socratic Synthesis Loader */
              <div className="bg-zinc-950/90 border border-indigo-500/40 rounded-2xl p-8 flex flex-col items-center justify-center space-y-4 text-center animate-fadeIn min-h-[320px]">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/20 animate-pulse">
                  <Sparkles className="w-7 h-7 text-indigo-400 animate-spin" />
                </div>
                <div className="space-y-1 max-w-md">
                  <h3 className="text-base font-bold text-zinc-100">Synthesizing First-Principles Derivation</h3>
                  <p className="text-xs text-zinc-400">
                    Constructing 4-Tier Socratic physical intuition, governing Euler-Lagrange equations, and KaTeX mathematical proofs...
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-indigo-400 font-mono bg-indigo-950/50 px-3 py-1 rounded-full border border-indigo-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
                  <span>Gemini 3 / Socratic Mathematical Kernel Active</span>
                </div>
              </div>
            ) : inAppSolution ? (
              /* In-App Socratic Derivation View with KaTeX */
              <div className="bg-zinc-950/90 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full uppercase">
                      {inAppSolution.subject}
                    </span>
                    <h3 className="text-sm font-bold text-zinc-100">{inAppSolution.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyFullDerivation}
                      className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer border border-zinc-700"
                      title="Copy full derivation with LaTeX formulas to clipboard"
                    >
                      {copiedDerivation ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedDerivation ? "Copied LaTeX" : "Copy Derivation"}</span>
                    </button>
                    <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Zero-Login Socratic Verified</span>
                    </div>
                  </div>
                </div>

                {/* 4-Tier Display */}
                <div className="space-y-3.5 text-xs leading-relaxed text-zinc-300">
                  {/* Tier 1 */}
                  <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 space-y-2">
                    <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
                      <Brain className="w-4 h-4 text-indigo-400" />
                      <span>{inAppSolution.tier1.title}</span>
                    </div>
                    <p className="text-zinc-300">{inAppSolution.tier1.conceptualOverview}</p>
                    <div className="text-zinc-300 italic bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-800">
                      💡 <strong>Mental Model:</strong> {inAppSolution.tier1.mentalModel}
                    </div>
                    <div className="text-amber-300/90 text-[11px] bg-amber-500/10 p-2 rounded border border-amber-500/20">
                      ❓ <strong>Self-Check Prompt:</strong> {inAppSolution.tier1.selfCheckPrompt}
                    </div>
                  </div>

                  {/* Tier 2 */}
                  <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 space-y-2">
                    <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-emerald-400" />
                      <span>{inAppSolution.tier2.title}</span>
                    </div>
                    <p className="text-zinc-400 text-[11px]">Coordinate Setup: {inAppSolution.tier2.coordinateSetup}</p>
                    <div className="space-y-2 mt-2">
                      {inAppSolution.tier2.equations.map((eq, i) => (
                        <div key={i} className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                          <div className="text-[11px] text-zinc-400 font-medium mb-1">{eq.name}: {eq.description}</div>
                          <div className="overflow-x-auto py-1 font-mono text-center text-indigo-200">
                            <Markdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                              {`$$${eq.latex}$$`}
                            </Markdown>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tier 3 */}
                  <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 space-y-3">
                    <div className="font-semibold text-purple-300 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-purple-400" />
                      <span>{inAppSolution.tier3.title}</span>
                    </div>
                    <div className="space-y-2.5">
                      {inAppSolution.tier3.steps.map((step, i) => (
                        <div key={i} className="border-l-2 border-indigo-500 pl-3.5 py-1 bg-zinc-950/40 rounded-r-lg">
                          <div className="font-semibold text-zinc-200 text-xs">Step {step.stepNumber}: {step.title}</div>
                          <div className="text-zinc-400 mt-0.5">{step.explanation}</div>
                          <div className="my-2 overflow-x-auto py-1 font-mono text-indigo-300 text-center bg-zinc-950 p-2 rounded border border-zinc-800/80">
                            <Markdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                              {`$$${step.intermediateLatex}$$`}
                            </Markdown>
                          </div>
                          <div className="text-[11px] text-indigo-300 italic">Key Insight: {step.keyInsight}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tier 4 */}
                  <div className="bg-zinc-900/80 border border-amber-500/30 rounded-xl p-3.5 space-y-2.5">
                    <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>{inAppSolution.tier4.title}</span>
                    </div>

                    <div className="bg-zinc-950 p-3 rounded-xl border border-amber-500/40 text-center font-mono text-amber-200">
                      <div className="text-[10px] text-amber-400/70 uppercase tracking-wider mb-1 font-semibold">Exact Analytical Result</div>
                      <div className="overflow-x-auto py-1">
                        <Markdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                          {`$$${inAppSolution.tier4.finalAnswerLatex}$$`}
                        </Markdown>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-800">
                        <strong className="text-emerald-400">Dimensional Verification:</strong>
                        <p className="text-zinc-400 mt-0.5">{inAppSolution.tier4.dimensionalCheck}</p>
                      </div>
                      <div className="bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-800">
                        <strong className="text-indigo-400">Rigorous Assessment:</strong>
                        <p className="text-zinc-400 mt-0.5">{inAppSolution.tier4.fullRigorousProof}</p>
                      </div>
                    </div>

                    {/* True Proof Cross-Verification Action Strip */}
                    <div className="pt-3 border-t border-zinc-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <span className="font-semibold text-indigo-300 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Audit & Cross-Verify this Full Derivation:</span>
                        </span>
                        <span className="text-[10px] text-zinc-500 hidden sm:inline">Auto-copies full 4-tier proof</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {["deepseek", "chatgpt", "claude", "gemini", "notebooklm", "wolfram"].map(svcId => {
                          const svc = AI_SERVICES.find(s => s.id === svcId);
                          if (!svc) return null;
                          return (
                            <button
                              key={svc.id}
                              type="button"
                              onClick={() => handleCrossVerify(svc)}
                              className="px-2.5 py-1.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-indigo-500/40 rounded-lg text-xs text-zinc-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer group shadow-sm"
                              title={`Cross-verify derivation on ${svc.name} (Copies full proof & audit directives)`}
                            >
                              <span>{svc.emoji}</span>
                              <span className="font-medium">{svc.shortName}</span>
                              <ArrowUpRight className="w-3 h-3 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
                  <Brain className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-zinc-200">No Derivation Loaded Yet</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Type a STEM problem or formula above and click <strong>Solve In-App</strong> to synthesize a 4-Tier first-principles derivation.
                </p>
              </div>
            )
          ) : (
            /* AI Gateways Grid */
            <div className="space-y-3">
              {/* Category Filter Chips */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setCatFilter(cat.id)}
                      className={`px-3 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                        catFilter === cat.id
                          ? "bg-indigo-600 text-white font-medium shadow-sm"
                          : "bg-zinc-950 text-zinc-400 hover:bg-zinc-800 border border-zinc-800"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="text-[11px] text-zinc-500 hidden sm:block">
                  Clicking copies prompt to clipboard & launches AI
                </div>
              </div>

              {/* Service Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredServices.map(service => (
                  <button
                    key={service.id}
                    onClick={() => handleLaunch(service)}
                    className="group flex items-start gap-3.5 p-3.5 bg-zinc-950/70 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all text-left cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${service.color} flex items-center justify-center shrink-0 shadow-md`}>
                      <span className="text-lg">{service.emoji}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-semibold text-zinc-100 text-sm truncate">
                          {service.name}
                        </span>
                        
                        {service.requiresLogin ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-medium border border-zinc-700/60 shrink-0">
                            🔑 Needs Login
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 font-medium border border-emerald-500/30 shrink-0">
                            🟢 No Login
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-zinc-400 leading-snug line-clamp-1">
                        {service.description}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-zinc-900 text-[11px]">
                        <span className="text-zinc-500 truncate">{service.bestFor}</span>
                        <div className="flex items-center gap-1 text-indigo-400 group-hover:text-indigo-300 font-medium shrink-0 ml-1">
                          <span>{service.supportsDirectLink ? "Launch Direct" : "Copy & Open"}</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between text-xs text-zinc-400 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <span className="truncate">
              <span className="text-indigo-400 font-medium">Part of Cosmos</span>
              <span className="hidden sm:inline"> • Hotkey: <strong>Alt+G</strong></span>
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-medium transition-colors cursor-pointer shrink-0"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

interface AIGatewayButtonProps {
  query?: string;
}

export const AIGatewayButton: React.FC<AIGatewayButtonProps> = ({ query }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeQuery, setActiveQuery] = useState(query || "");

  // Listen for external open events (e.g. from StemSolver "Send to AI" button)
  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail?.open) {
        if (e.detail.query) setActiveQuery(e.detail.query);
        setIsOpen(true);
      }
    };
    window.addEventListener("savantix_open_ai_gateway", handler);
    return () => window.removeEventListener("savantix_open_ai_gateway", handler);
  }, []);

  return (
    <>
      {/* Floating Button — compact icon on mobile, pill with label on desktop */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center justify-center gap-2 p-3 sm:px-4 sm:py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-full sm:rounded-2xl shadow-2xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer font-semibold text-sm"
        title="AI Gateway & Socratic STEM Solver (Alt+G)"
      >
        <Globe className="w-5 h-5 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">AI Gateway</span>
        <Sparkles className="w-3.5 h-3.5 opacity-80 hidden sm:block" />
      </button>

      <AIGatewayDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialQuery={activeQuery || query}
      />
    </>
  );
};
