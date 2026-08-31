import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Zap, X, ExternalLink, Copy, Check, ChevronDown, ChevronUp,
  Search, Sparkles, Brain, Globe, ArrowRight, Info
} from "lucide-react";
import clsx from "clsx";

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
  category: "frontier" | "search" | "code" | "science";
}

const AI_SERVICES: AIService[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    shortName: "GPT",
    description: "OpenAI GPT-4o — general reasoning & STEM",
    color: "from-emerald-600 to-teal-600",
    textColor: "text-emerald-400",
    emoji: "🤖",
    queryUrl: q => `https://chatgpt.com/?q=${encodeURIComponent(q)}`,
    baseUrl: "https://chatgpt.com/",
    supportsDirectLink: true,
    category: "frontier",
  },
  {
    id: "gemini",
    name: "Gemini",
    shortName: "Gemini",
    description: "Google Gemini 2.5 Pro — multimodal & search grounding",
    color: "from-blue-600 to-indigo-600",
    textColor: "text-blue-400",
    emoji: "✨",
    baseUrl: "https://gemini.google.com/app",
    supportsDirectLink: false,
    category: "frontier",
  },
  {
    id: "claude",
    name: "Claude",
    shortName: "Claude",
    description: "Anthropic Claude 4 — long context & analysis",
    color: "from-orange-600 to-amber-600",
    textColor: "text-orange-400",
    emoji: "🏛️",
    baseUrl: "https://claude.ai/",
    supportsDirectLink: false,
    category: "frontier",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    shortName: "DeepSeek",
    description: "DeepSeek R2 — advanced reasoning & math",
    color: "from-sky-600 to-cyan-600",
    textColor: "text-sky-400",
    emoji: "🔬",
    baseUrl: "https://chat.deepseek.com/",
    supportsDirectLink: false,
    category: "frontier",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    shortName: "Perplexity",
    description: "Perplexity AI — cited real-time web answers",
    color: "from-violet-600 to-purple-600",
    textColor: "text-violet-400",
    emoji: "🔍",
    queryUrl: q => `https://www.perplexity.ai/search?q=${encodeURIComponent(q)}`,
    baseUrl: "https://www.perplexity.ai/",
    supportsDirectLink: true,
    category: "search",
  },
  {
    id: "phind",
    name: "Phind",
    shortName: "Phind",
    description: "Phind — AI code & STEM problem search",
    color: "from-pink-600 to-rose-600",
    textColor: "text-pink-400",
    emoji: "💻",
    queryUrl: q => `https://www.phind.com/search?q=${encodeURIComponent(q)}`,
    baseUrl: "https://www.phind.com/",
    supportsDirectLink: true,
    category: "code",
  },
  {
    id: "qwen",
    name: "Qwen",
    shortName: "Qwen",
    description: "Alibaba Qwen 3 — multilingual STEM reasoning",
    color: "from-red-600 to-orange-600",
    textColor: "text-red-400",
    emoji: "🐉",
    baseUrl: "https://chat.qwenlm.ai/",
    supportsDirectLink: false,
    category: "frontier",
  },
  {
    id: "grok",
    name: "Grok",
    shortName: "Grok",
    description: "xAI Grok 3 — real-time X/Twitter data & reasoning",
    color: "from-zinc-500 to-zinc-600",
    textColor: "text-zinc-400",
    emoji: "⚡",
    baseUrl: "https://grok.com/",
    supportsDirectLink: false,
    category: "frontier",
  },
  {
    id: "you",
    name: "You.com",
    shortName: "You",
    description: "You.com — AI-powered web search with citations",
    color: "from-indigo-600 to-violet-600",
    textColor: "text-indigo-400",
    emoji: "🌐",
    queryUrl: q => `https://you.com/search?q=${encodeURIComponent(q)}&tbm=youchat`,
    baseUrl: "https://you.com/",
    supportsDirectLink: true,
    category: "search",
  },
  {
    id: "wolfram",
    name: "Wolfram Alpha",
    shortName: "Wolfram",
    description: "Wolfram Alpha — computational science & math engine",
    color: "from-red-700 to-red-600",
    textColor: "text-red-400",
    emoji: "🧮",
    queryUrl: q => `https://www.wolframalpha.com/input?i=${encodeURIComponent(q)}`,
    baseUrl: "https://www.wolframalpha.com/",
    supportsDirectLink: true,
    category: "science",
  },
];

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "frontier", label: "Frontier AI" },
  { id: "search", label: "Search AI" },
  { id: "code", label: "Code / STEM" },
  { id: "science", label: "Science" },
];

const PRESET_QUERIES = [
  "Explain the derivation of Euler-Lagrange equations from Hamilton'\''s principle",
  "Solve this IPhO-style optics problem step by step",
  "Explain quantum tunnelling with mathematical derivation",
  "What is the Born approximation in scattering theory?",
  "Derive the Navier-Stokes equations from conservation laws",
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
  const [launchToast, setLaunchToast] = useState<{ name: string; direct: boolean } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync external query
  useEffect(() => {
    if (initialQuery) setQuery(initialQuery);
  }, [initialQuery]);

  // Focus textarea on open
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const filtered = catFilter === "all" ? AI_SERVICES : AI_SERVICES.filter(s => s.category === catFilter);

  const launchService = useCallback(async (service: AIService) => {
    const q = query.trim();
    if (!q) { textareaRef.current?.focus(); return; }

    if (service.supportsDirectLink && service.queryUrl) {
      // Direct deep link — query lands pre-filled in the AI service
      window.open(service.queryUrl(q), "_blank", "noopener,noreferrer");
      setLaunchToast({ name: service.name, direct: true });
    } else {
      // Clipboard bridge — copy silently, open tab, user pastes
      try { await navigator.clipboard.writeText(q); } catch {}
      window.open(service.baseUrl, "_blank", "noopener,noreferrer");
      setLaunchToast({ name: service.name, direct: false });
    }

    setCopiedId(service.id);
    setTimeout(() => setCopiedId(null), 2000);
    setTimeout(() => setLaunchToast(null), 3500);
  }, [query]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:left-auto md:right-6 md:bottom-6 md:w-[560px] md:max-h-[85vh] bg-zinc-950 border border-zinc-800/90 rounded-t-3xl md:rounded-3xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl shadow-lg shadow-indigo-600/20">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100">AI Gateway</h2>
              <p className="text-[10px] text-zinc-500">Route your query to any AI service instantly</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Query Input */}
        <div className="px-5 pt-4 pb-3 shrink-0">
          <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Your Query</label>
          <div className="relative mt-1.5">
            <textarea
              ref={textareaRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Type your STEM question, concept, or topic..."
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-2xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 resize-none leading-relaxed"
            />
            {query.trim() && (
              <button
                onClick={() => setQuery("")}
                className="absolute top-2.5 right-3 p-1 text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Preset queries */}
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {PRESET_QUERIES.map((p, i) => (
              <button
                key={i}
                onClick={() => setQuery(p)}
                className="shrink-0 text-[10px] px-2.5 py-1 bg-zinc-900 border border-zinc-800 hover:border-indigo-500/40 hover:bg-indigo-950/30 text-zinc-500 hover:text-indigo-300 rounded-lg transition-all cursor-pointer whitespace-nowrap"
              >
                {p.length > 40 ? p.slice(0, 40) + "…" : p}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div className="px-5 pb-2 flex gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCatFilter(cat.id)}
              className={clsx(
                "shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer whitespace-nowrap",
                catFilter === cat.id
                  ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/40"
                  : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-600"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Service Grid */}
        <div className="overflow-y-auto flex-1 px-5 pb-5 pt-2 scrollbar-thin scrollbar-thumb-zinc-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filtered.map(service => {
              const hasQuery = query.trim().length > 0;
              const isLaunched = copiedId === service.id;

              return (
                <button
                  key={service.id}
                  onClick={() => launchService(service)}
                  disabled={!hasQuery}
                  className={clsx(
                    "group relative flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer",
                    hasQuery
                      ? "bg-zinc-900/80 border-zinc-800/80 hover:border-zinc-600 hover:bg-zinc-900 hover:shadow-lg"
                      : "bg-zinc-900/40 border-zinc-800/40 opacity-50 cursor-not-allowed",
                    isLaunched && "border-emerald-500/40 bg-emerald-950/20"
                  )}
                >
                  <div className={clsx("w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-lg shrink-0 shadow-sm", service.color)}>
                    {service.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-zinc-100">{service.name}</span>
                      {service.supportsDirectLink ? (
                        <span className="text-[8px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded font-semibold uppercase tracking-wide">Direct</span>
                      ) : (
                        <span className="text-[8px] px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/25 rounded font-semibold uppercase tracking-wide">Clipboard</span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5 leading-relaxed">{service.description}</p>
                  </div>
                  <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isLaunched
                      ? <Check className="w-4 h-4 text-emerald-400" />
                      : <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
                    }
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-start gap-2 p-3 bg-zinc-900/50 border border-zinc-800/60 rounded-xl">
            <Info className="w-3.5 h-3.5 text-zinc-600 mt-0.5 shrink-0" />
            <p className="text-[10px] text-zinc-600 leading-relaxed">
              <span className="text-emerald-400 font-semibold">Direct</span> — query lands pre-filled in the AI service, zero paste needed. &nbsp;
              <span className="text-amber-400 font-semibold">Clipboard</span> — query is copied silently; the AI service opens in a new tab, just press <kbd className="bg-zinc-800 px-1 rounded text-zinc-400">Ctrl+V</kbd> to paste.
            </p>
          </div>
        </div>
      </div>

      {/* Launch Toast */}
      {launchToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl flex items-center gap-2.5 text-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          {launchToast.direct
            ? <span className="text-zinc-200">Opened <strong className="text-white">{launchToast.name}</strong> with your query pre-filled</span>
            : <span className="text-zinc-200">Query copied · <strong className="text-white">{launchToast.name}</strong> opened — press <kbd className="bg-zinc-800 px-1.5 rounded text-zinc-300">Ctrl+V</kbd> to paste</span>
          }
        </div>
      )}
    </>
  );
};

// ─────────────────────────────────────────────────────────
// Floating Trigger Button — lives in Layout, always visible
// ─────────────────────────────────────────────────────────
interface AIGatewayButtonProps {
  query?: string;
}

export const AIGatewayButton: React.FC<AIGatewayButtonProps> = ({ query }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Listen for external open events (e.g. from StemSolver "Send to AI" button)
  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail?.open) setIsOpen(true);
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
        title="AI Gateway — Route query to ChatGPT, Gemini, Claude, DeepSeek & more (Alt+G)"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">AI Gateway</span>
        <Sparkles className="w-3.5 h-3.5 opacity-80" />
      </button>

      <AIGatewayDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialQuery={query}
      />
    </>
  );
};
