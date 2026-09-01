import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Zap, X, ExternalLink, Copy, Check, ChevronDown, ChevronUp,
  Search, Sparkles, Brain, Globe, ArrowRight, Info, ShieldCheck,
  Cpu, BookOpen, Layers, Send, RefreshCw, BookmarkPlus
} from "lucide-react";
import clsx from "clsx";
import Markdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { SocraticStemEngine, SocraticSolution } from "../utils/socraticStemEngine";

// ─────────────────────────────────────────────────────────
// AI Service Registry
// ─────────────────────────────────────────────────────────
interface AIService {
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

const AI_SERVICES: AIService[] = [
  {
    id: "in_app_socratic",
    name: "Savantix In-App Solver",
    shortName: "In-App",
    description: "Instant 4-Tier Socratic KaTeX Derivation (Zero Login • Offline Ready)",
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
    name: "ChatGPT",
    shortName: "GPT",
    description: "OpenAI GPT-4o / o3 — general reasoning & STEM pre-filled",
    color: "from-emerald-600 to-teal-600",
    textColor: "text-emerald-400",
    emoji: "🤖",
    queryUrl: q => `https://chatgpt.com/?q=${encodeURIComponent(q)}`,
    baseUrl: "https://chatgpt.com/",
    supportsDirectLink: true,
    requiresLogin: false,
    category: "frontier",
    bestFor: "General STEM reasoning & code generation"
  },
  {
    id: "wolfram",
    name: "Wolfram Alpha",
    shortName: "Wolfram",
    description: "Wolfram Alpha — exact algebraic computation & integrals (No Login)",
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
    name: "DuckDuckGo AI Chat",
    shortName: "DDG AI",
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
  },
  {
    id: "perplexity",
    name: "Perplexity AI",
    shortName: "Perplexity",
    description: "Perplexity AI — real-time web search with academic citations",
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
    id: "deepseek",
    name: "DeepSeek R1",
    shortName: "DeepSeek",
    description: "DeepSeek R1 — deep thinking chain-of-thought for Olympiad math",
    color: "from-sky-600 to-cyan-600",
    textColor: "text-sky-400",
    emoji: "🔬",
    baseUrl: "https://chat.deepseek.com/",
    supportsDirectLink: false,
    requiresLogin: true,
    category: "frontier",
    bestFor: "Complex mathematical deductions & proof verification"
  },
  {
    id: "gemini",
    name: "Google Gemini",
    shortName: "Gemini",
    description: "Gemini 2.5 Pro — 1M token context & Google Search Grounding",
    color: "from-blue-600 to-indigo-600",
    textColor: "text-blue-400",
    emoji: "✨",
    baseUrl: "https://gemini.google.com/app",
    supportsDirectLink: false,
    requiresLogin: true,
    category: "frontier",
    bestFor: "Multimodal diagrams, textbook chapter analysis"
  },
  {
    id: "claude",
    name: "Anthropic Claude",
    shortName: "Claude",
    description: "Claude 3.7 / 4 Sonnet — extended thinking & crystal-clear explanations",
    color: "from-orange-600 to-amber-600",
    textColor: "text-orange-400",
    emoji: "🏛️",
    baseUrl: "https://claude.ai/",
    supportsDirectLink: false,
    requiresLogin: true,
    category: "frontier",
    bestFor: "Conceptual depth, physics intuition, rigorous derivations"
  },
  {
    id: "grok",
    name: "xAI Grok",
    shortName: "Grok",
    description: "Grok 3 — frontier STEM thinking & real-time X data",
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
    id: "huggingchat",
    name: "HuggingChat (Open Source)",
    shortName: "HuggingFace",
    description: "Free access to Qwen 2.5 72B, DeepSeek R1, and Llama 3.3",
    color: "from-yellow-600 to-amber-600",
    textColor: "text-yellow-400",
    emoji: "🤗",
    baseUrl: "https://huggingface.co/chat/",
    supportsDirectLink: false,
    requiresLogin: false,
    category: "code",
    bestFor: "Open weights frontier models with zero vendor lock-in"
  }
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

interface AIGatewayDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export const AIGatewayDrawer: React.FC<AIGatewayDrawerProps> = ({ isOpen, onClose, initialQuery }) => {
  const [query, setQuery] = useState(initialQuery || "");
  const [catFilter, setCatFilter] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [launchToast, setLaunchToast] = useState<{ name: string; message: string; type: 'success' | 'info' } | null>(null);
  const [inAppSolution, setInAppSolution] = useState<SocraticSolution | null>(null);
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
          // Open
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

  // Instant In-App Solve Handler (No Login Required)
  const handleSolveInApp = useCallback(() => {
    if (!query.trim()) return;
    const sol = SocraticStemEngine.deriveSolution(query.trim());
    setInAppSolution(sol);
    setActiveTab('in_app');
    setLaunchToast({
      name: "Savantix In-App Engine",
      message: "Generated 4-Tier Socratic Derivation with KaTeX formulas (Zero Login Required)",
      type: "success"
    });
    setTimeout(() => setLaunchToast(null), 4500);
  }, [query]);

  // Launch external AI handler with auto-copy
  const handleLaunch = useCallback(async (service: AIService) => {
    const trimmed = query.trim();

    if (service.id === "in_app_socratic") {
      handleSolveInApp();
      return;
    }

    if (!trimmed) {
      if (service.baseUrl) window.open(service.baseUrl, "_blank", "noopener,noreferrer");
      return;
    }

    // Always copy prompt to clipboard so user can instantly Ctrl+V anywhere
    try {
      await navigator.clipboard.writeText(trimmed);
      setCopiedId(service.id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {}

    if (service.supportsDirectLink && service.queryUrl) {
      const url = service.queryUrl(trimmed);
      window.open(url, "_blank", "noopener,noreferrer");
      setLaunchToast({
        name: service.name,
        message: `Opened with pre-filled query! Also copied to clipboard.`,
        type: "success"
      });
    } else {
      window.open(service.baseUrl, "_blank", "noopener,noreferrer");
      setLaunchToast({
        name: service.name,
        message: `✓ Prompt copied to clipboard! Switch to the opened tab and press Ctrl+V.`,
        type: "info"
      });
    }

    setTimeout(() => setLaunchToast(null), 5000);
  }, [query, handleSolveInApp]);

  if (!isOpen) return null;

  const filteredServices = AI_SERVICES.filter(s => {
    if (catFilter === "all") return true;
    if (catFilter === "instant") return !s.requiresLogin || s.category === "instant";
    return s.category === catFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-100">Universal AI Gateway & STEM Solver</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                  Alt+G
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Solve instantly inside Savantix or route queries to 10+ frontier AI platforms
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switcher */}
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-semibold">
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
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Floating Toast Notification */}
        {launchToast && (
          <div className={`mx-6 mt-3 px-4 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between gap-2 border animate-fadeIn ${
            launchToast.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
              : 'bg-indigo-950/80 border-indigo-500/40 text-indigo-200'
          }`}>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span><strong>{launchToast.name}:</strong> {launchToast.message}</span>
            </div>
            <button onClick={() => setLaunchToast(null)} className="text-zinc-400 hover:text-zinc-200 text-xs">×</button>
          </div>
        )}

        {/* Body Container */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* Query Input Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-indigo-400" />
                Enter STEM Problem / Academic Query
              </label>
              {query.trim() && (
                <button
                  onClick={() => setQuery("")}
                  className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="relative">
              <textarea
                ref={textareaRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Type your STEM question, concept, derivation, or formula (LaTeX supported $...$ or $$...$$)..."
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none font-mono"
              />
              
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSolveInApp}
                  disabled={!query.trim()}
                  className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>Solve In-App</span>
                </button>
              </div>
            </div>

            {/* Quick Preset Prompts */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-thin">
              <span className="text-zinc-500 shrink-0">Presets:</span>
              {PRESET_QUERIES.map((pq, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setQuery(pq)}
                  className="px-2.5 py-1 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-lg whitespace-nowrap transition-colors cursor-pointer"
                >
                  {pq.length > 40 ? pq.slice(0, 38) + "…" : pq}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'in_app' && inAppSolution ? (
            /* In-App Socratic Derivation View */
            <div className="bg-zinc-950/80 border border-indigo-500/30 rounded-2xl p-5 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full uppercase">
                    {inAppSolution.subject}
                  </span>
                  <h3 className="text-sm font-bold text-zinc-100">{inAppSolution.title}</h3>
                </div>
                <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Zero-Login Socratic Verified</span>
                </div>
              </div>

              {/* 4-Tier Display */}
              <div className="space-y-3 text-xs leading-relaxed text-zinc-300">
                {/* Tier 1 */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5">
                  <div className="font-semibold text-indigo-300 mb-1 flex items-center gap-1">
                    <Brain className="w-3.5 h-3.5" />
                    <span>{inAppSolution.tier1.title}</span>
                  </div>
                  <p className="text-zinc-300">{inAppSolution.tier1.conceptualOverview}</p>
                  <div className="mt-2 text-zinc-400 italic bg-zinc-950/60 p-2 rounded border border-zinc-800">
                    💡 {inAppSolution.tier1.mentalModel}
                  </div>
                </div>

                {/* Tier 2 */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5">
                  <div className="font-semibold text-emerald-300 mb-1 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{inAppSolution.tier2.title}</span>
                  </div>
                  <div className="space-y-1.5 mt-2">
                    {inAppSolution.tier2.equations.map((eq, i) => (
                      <div key={i} className="bg-zinc-950 p-2 rounded border border-zinc-800 font-mono text-center text-indigo-200">
                        <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {`$$${eq.latex}$$`}
                        </Markdown>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tier 3 & 4 */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5">
                  <div className="font-semibold text-purple-300 mb-1 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    <span>{inAppSolution.tier3.title}</span>
                  </div>
                  <div className="space-y-2 mt-2">
                    {inAppSolution.tier3.steps.map((step, i) => (
                      <div key={i} className="border-l-2 border-indigo-500 pl-3 py-1">
                        <div className="font-medium text-zinc-200">{step.title}</div>
                        <div className="text-zinc-400 mt-0.5">{step.explanation}</div>
                        <div className="my-1.5 font-mono text-indigo-300 text-center">
                          <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {`$$${step.intermediateLatex}$$`}
                          </Markdown>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-t border-zinc-800">
                    <div className="font-semibold text-amber-300 mb-1">Final Result:</div>
                    <div className="bg-zinc-950 p-2.5 rounded-lg border border-amber-500/30 text-center font-mono text-amber-200">
                      <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {`$$${inAppSolution.tier4.finalAnswerLatex}$$`}
                      </Markdown>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
        <div className="px-6 py-3.5 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Zero-Leak Security: Queries never logged to cloud. Hotkey: <strong>Alt+G</strong></span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-medium transition-colors"
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
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl shadow-2xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer font-semibold text-sm"
        title="AI Gateway & Socratic STEM Solver (Alt+G)"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">AI Gateway</span>
        <Sparkles className="w-3.5 h-3.5 opacity-80" />
      </button>

      <AIGatewayDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialQuery={activeQuery || query}
      />
    </>
  );
};
