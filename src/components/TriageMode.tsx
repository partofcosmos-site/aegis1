import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Zap,
  Lock,
  Rocket,
  ChevronRight,
  BarChart2,
  FileText,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Keyboard,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TriageDecision = 'commit' | 'bail' | 'in-progress';

export interface TriageEntry {
  id: string;
  problemName: string;
  startedAt: number;
  decisionAt: number | null;
  timeSpentSeconds: number;
  decision: TriageDecision;
  partialNotes: string;
}

const STORAGE_KEY = 'savantix_triage_log';
const MICRO_TIMER_SECONDS = 90;
const COMMIT_DURATION_SECONDS = 20 * 60;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadLog(): TriageEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TriageEntry[]) : [];
  } catch {
    return [];
  }
}

function saveLog(entries: TriageEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  window.dispatchEvent(new CustomEvent('savantix_triage_updated', { detail: entries }));
}

function fmt(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function efficiencyPct(entries: TriageEntry[]): number {
  const done = entries.filter(e => e.decision === 'commit' || e.decision === 'bail');
  if (!done.length) return 0;
  const committed = done.filter(e => e.decision === 'commit').length;
  return Math.round((committed / done.length) * 100);
}

// Play a short beep using Web Audio API
function playDecisionBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // Silently fail if audio not available
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface DecisionModalProps {
  problemName: string;
  onCommit: () => void;
  onBail: () => void;
}

const DecisionModal: React.FC<DecisionModalProps> = ({ problemName, onCommit, onBail }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" />
    <div className="relative w-full max-w-sm bg-zinc-900 border border-amber-500/50 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-amber-500/20 animate-in zoom-in-95 duration-200">
      <div className="flex items-center justify-center mb-4">
        <span className="px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold tracking-wider uppercase flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
          ⚡ 90 s Check
        </span>
      </div>
      <h2 className="text-center text-white font-black text-base sm:text-lg mb-1">
        Do you have a structural breakthrough?
      </h2>
      <p className="text-center text-zinc-400 text-xs mb-5">
        Problem: <span className="text-amber-300 font-semibold">{problemName || 'Unnamed'}</span>
      </p>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onCommit}
          className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-600/30 cursor-pointer"
        >
          <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-xs sm:text-sm">Yes — Commit 🔒</span>
          <span className="text-[9px] sm:text-[10px] font-normal text-indigo-200 text-center">20-min deep focus</span>
          <span className="text-[9px] text-indigo-300/60 font-mono">press C</span>
        </button>
        <button
          onClick={onBail}
          className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-rose-600/30 cursor-pointer"
        >
          <Rocket className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-xs sm:text-sm">No — Bail 🚀</span>
          <span className="text-[9px] sm:text-[10px] font-normal text-rose-200 text-center">Smart skip + notes</span>
          <span className="text-[9px] text-rose-300/60 font-mono">press B</span>
        </button>
      </div>
    </div>
  </div>
);

interface RingProps {
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
}

const ProgressRing: React.FC<RingProps> = ({ pct, size = 200, stroke = 10, color = '#f59e0b' }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#27272a" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.5s ease' }}
      />
    </svg>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const TriageMode: React.FC = () => {
  const [problemName, setProblemName] = useState('');
  const [nextProblemName, setNextProblemName] = useState('');
  const [phase, setPhase] = useState<'idle' | 'micro' | 'check' | 'commit' | 'bail-notes' | 'done'>('idle');
  const [microSecondsLeft, setMicroSecondsLeft] = useState(MICRO_TIMER_SECONDS);
  const microTargetRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const [commitSecondsLeft, setCommitSecondsLeft] = useState(COMMIT_DURATION_SECONDS);
  const commitTargetRef = useRef<number | null>(null);
  const commitRafRef = useRef<number | null>(null);
  const attemptStartRef = useRef<number>(0);
  const [partialNotes, setPartialNotes] = useState('');
  const [log, setLog] = useState<TriageEntry[]>(loadLog);
  const [showLog, setShowLog] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [bailConfirmed, setBailConfirmed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const tickMicro = useCallback(() => {
    if (!microTargetRef.current) return;
    const remaining = Math.ceil((microTargetRef.current - Date.now()) / 1000);
    if (remaining <= 0) {
      setMicroSecondsLeft(0);
      setPhase('check');
      playDecisionBeep();
      microTargetRef.current = null;
      return;
    }
    setMicroSecondsLeft(remaining);
    rafRef.current = requestAnimationFrame(tickMicro);
  }, []);

  const startMicro = useCallback(() => {
    microTargetRef.current = Date.now() + MICRO_TIMER_SECONDS * 1000;
    rafRef.current = requestAnimationFrame(tickMicro);
  }, [tickMicro]);

  const stopMicro = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    microTargetRef.current = null;
  }, []);

  const tickCommit = useCallback(() => {
    if (!commitTargetRef.current) return;
    const remaining = Math.ceil((commitTargetRef.current - Date.now()) / 1000);
    if (remaining <= 0) {
      setCommitSecondsLeft(0);
      commitTargetRef.current = null;
      return;
    }
    setCommitSecondsLeft(remaining);
    commitRafRef.current = requestAnimationFrame(tickCommit);
  }, []);

  const startCommit = useCallback(() => {
    setCommitSecondsLeft(COMMIT_DURATION_SECONDS);
    commitTargetRef.current = Date.now() + COMMIT_DURATION_SECONDS * 1000;
    commitRafRef.current = requestAnimationFrame(tickCommit);
  }, [tickCommit]);

  const stopCommit = useCallback(() => {
    if (commitRafRef.current !== null) cancelAnimationFrame(commitRafRef.current);
    commitTargetRef.current = null;
  }, []);

  useEffect(() => () => { stopMicro(); stopCommit(); }, [stopMicro, stopCommit]);

  const finaliseEntry = useCallback(
    (decision: 'commit' | 'bail', extraSecs = 0, notes = '') => {
      const now = Date.now();
      const spent = Math.round((now - attemptStartRef.current) / 1000) + extraSecs;
      const entry: TriageEntry = {
        id: `${now}`,
        problemName: problemName || 'Unnamed',
        startedAt: attemptStartRef.current,
        decisionAt: now,
        timeSpentSeconds: spent,
        decision,
        partialNotes: notes,
      };
      setLog(prev => {
        const next = [entry, ...prev];
        saveLog(next);
        return next;
      });
    },
    [problemName]
  );

  const handleStartAttempt = useCallback((nameOverride?: string) => {
    const name = nameOverride ?? problemName;
    if (!name.trim()) return;
    if (nameOverride) setProblemName(nameOverride);
    setMicroSecondsLeft(MICRO_TIMER_SECONDS);
    setBailConfirmed(false);
    setPartialNotes('');
    setNextProblemName('');
    attemptStartRef.current = Date.now();
    setPhase('micro');
    startMicro();
  }, [problemName, startMicro]);

  const handleCommit = useCallback(() => {
    stopMicro();
    setPhase('commit');
    startCommit();
    finaliseEntry('commit');
  }, [stopMicro, startCommit, finaliseEntry]);

  const handleBail = useCallback(() => {
    stopMicro();
    setPhase('bail-notes');
  }, [stopMicro]);

  const handleBailConfirm = useCallback(() => {
    finaliseEntry('bail', 0, partialNotes);
    setBailConfirmed(true);
    setTimeout(() => {
      setPhase('idle');
      setProblemName('');
      setPartialNotes('');
      setBailConfirmed(false);
    }, 1800);
  }, [finaliseEntry, partialNotes]);

  const handleCommitFinishEarly = useCallback(() => {
    stopCommit();
    setPhase('idle');
    setProblemName('');
    setNextProblemName('');
  }, [stopCommit]);

  const handleNextProblem = useCallback(() => {
    if (nextProblemName.trim()) {
      handleStartAttempt(nextProblemName.trim());
    } else {
      setPhase('idle');
      setProblemName('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [nextProblemName, handleStartAttempt]);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't hijack when typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (phase === 'check') {
        if (e.key === 'c' || e.key === 'C') handleCommit();
        if (e.key === 'b' || e.key === 'B') handleBail();
      }
      if (phase === 'commit' && (e.key === 'Enter' || e.key === 'd')) {
        handleCommitFinishEarly();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, handleCommit, handleBail, handleCommitFinishEarly]);

  const microPct = ((MICRO_TIMER_SECONDS - microSecondsLeft) / MICRO_TIMER_SECONDS) * 100;
  const commitPct = ((COMMIT_DURATION_SECONDS - commitSecondsLeft) / COMMIT_DURATION_SECONDS) * 100;
  const sessionLog = log;
  const committed = sessionLog.filter(e => e.decision === 'commit').length;
  const bailed = sessionLog.filter(e => e.decision === 'bail').length;
  const eff = efficiencyPct(sessionLog);

  return (
    <div className="bg-zinc-950 border border-amber-500/30 rounded-3xl p-4 sm:p-6 shadow-2xl shadow-amber-500/10 relative overflow-hidden mt-2">
      <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-red-500/8 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold tracking-wider uppercase">
          <Zap className="w-3.5 h-3.5 animate-pulse" />
          Triage Mode Active
        </span>
        <span className="text-zinc-500 text-xs hidden sm:inline">3-Pass Exam Triage • Bail or Commit Pacer</span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => { setShowSummary(false); setShowLog(v => !v); }}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-amber-300 border border-zinc-800 transition-all cursor-pointer"
            title="Attempt Log"
          >
            <FileText className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setShowLog(false); setShowSummary(v => !v); }}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-amber-300 border border-zinc-800 transition-all cursor-pointer"
            title="Session Summary"
          >
            <BarChart2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* IDLE — problem input */}
      {phase === 'idle' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-amber-300/80 mb-1.5">
              Problem # / Name
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                ref={inputRef}
                type="text"
                value={problemName}
                onChange={e => setProblemName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleStartAttempt()}
                placeholder="e.g. IPhO Gold Track / Pathfinder Rotational Mechanics Q14"
                className="flex-1 bg-zinc-900 border border-zinc-700 focus:border-amber-500/60 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition"
              />
              <button
                onClick={() => handleStartAttempt()}
                disabled={!problemName.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:from-zinc-700 disabled:to-zinc-700 disabled:text-zinc-500 text-zinc-950 font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                <Zap className="w-4 h-4" />
                Start
              </button>
            </div>
          </div>
          <p className="text-zinc-600 text-xs">
            A <span className="text-amber-400 font-semibold">90-second micro-timer</span> starts. At 90s: Commit (20-min deep dive) or Bail (capture notes → next problem).
          </p>
          <p className="text-zinc-700 text-[10px] flex items-center gap-1.5">
            <Keyboard className="w-3 h-3" />
            During check: <kbd className="bg-zinc-800 px-1 rounded text-zinc-400">C</kbd> = Commit · <kbd className="bg-zinc-800 px-1 rounded text-zinc-400">B</kbd> = Bail
          </p>
        </div>
      )}

      {/* MICRO TIMER */}
      {phase === 'micro' && (
        <div className="flex flex-col items-center gap-4 sm:gap-6 py-2">
          <p className="text-zinc-400 text-xs text-center">
            Working on: <span className="text-amber-300 font-semibold">{problemName}</span>
          </p>
          <div className="relative flex items-center justify-center">
            {/* Responsive ring: smaller on mobile */}
            <div className="hidden sm:block">
              <ProgressRing pct={microPct} size={180} stroke={8} color="#f59e0b" />
            </div>
            <div className="block sm:hidden">
              <ProgressRing pct={microPct} size={140} stroke={7} color="#f59e0b" />
            </div>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl sm:text-5xl font-black font-mono tabular-nums text-amber-300 drop-shadow-lg">
                {fmt(microSecondsLeft)}
              </span>
              <span className="text-[10px] text-amber-500/70 font-semibold uppercase tracking-widest mt-1">
                90s triage
              </span>
            </div>
          </div>
          {microSecondsLeft <= 30 && (
            <span className="px-3 py-1 rounded-full bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-bold animate-pulse">
              ⚠️ Decision incoming!
            </span>
          )}
        </div>
      )}

      {/* DECISION MODAL */}
      {phase === 'check' && (
        <DecisionModal
          problemName={problemName}
          onCommit={handleCommit}
          onBail={handleBail}
        />
      )}

      {/* COMMIT DEEP WORK */}
      {phase === 'commit' && (
        <div className="flex flex-col items-center gap-4 sm:gap-5 py-2">
          <span className="px-4 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/40 text-indigo-300 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-3.5 h-3.5" />
            Committed — Deep Work
          </span>
          <p className="text-zinc-400 text-xs text-center">
            Solving: <span className="text-indigo-300 font-semibold">{problemName}</span>
          </p>
          <div className="relative flex items-center justify-center">
            <div className="hidden sm:block">
              <ProgressRing pct={commitPct} size={200} stroke={10} color="#6366f1" />
            </div>
            <div className="block sm:hidden">
              <ProgressRing pct={commitPct} size={150} stroke={8} color="#6366f1" />
            </div>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl sm:text-5xl font-black font-mono tabular-nums text-indigo-200 drop-shadow-lg">
                {fmt(commitSecondsLeft)}
              </span>
              <span className="text-[10px] text-indigo-400/70 font-semibold uppercase tracking-widest mt-1">
                20-min focus
              </span>
            </div>
          </div>
          {/* Next problem prep + done button */}
          <div className="w-full space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={nextProblemName}
                onChange={e => setNextProblemName(e.target.value)}
                placeholder="Queue next problem (e.g. JEE Adv 2028 Math / INPhO Physics)…"
                className="flex-1 bg-zinc-900/80 border border-zinc-800 focus:border-indigo-500/50 rounded-xl px-3 py-2 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCommitFinishEarly}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                Done
              </button>
              {nextProblemName.trim() && (
                <button
                  onClick={handleNextProblem}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  Next Problem
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BAIL NOTES */}
      {phase === 'bail-notes' && (
        <div className="space-y-4 py-2">
          {bailConfirmed ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              <p className="text-emerald-300 font-bold text-sm">✓ Smart bail! Captured observations. Moving to next problem.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-rose-400" />
                <p className="text-rose-300 font-semibold text-sm">Smart Bail — Capture Observations</p>
              </div>
              <p className="text-zinc-500 text-xs">
                Problem: <span className="text-rose-300 font-medium">{problemName}</span>
              </p>
              <textarea
                value={partialNotes}
                onChange={e => setPartialNotes(e.target.value)}
                rows={3}
                placeholder="What did you notice? Any partial approach, formula hint, or confusion point..."
                className="w-full bg-zinc-900 border border-zinc-700 focus:border-rose-500/60 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-rose-500/30 resize-none transition"
                autoFocus
              />
              {/* Next problem quick-start */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nextProblemName}
                  onChange={e => setNextProblemName(e.target.value)}
                  placeholder="Queue next problem (e.g. IPhO Mechanics / JEE Adv 2028)…"
                  className="flex-1 bg-zinc-900/80 border border-zinc-800 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition"
                />
              </div>
              <div className="flex gap-2 flex-col sm:flex-row">
                <button
                  onClick={handleBailConfirm}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white font-bold text-sm transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2"
                >
                  <Rocket className="w-4 h-4" />
                  Confirm Bail
                </button>
                {nextProblemName.trim() && (
                  <button
                    onClick={() => { handleBailConfirm(); setTimeout(() => handleStartAttempt(nextProblemName.trim()), 1900); }}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Bail + Start Next
                  </button>
                )}
                <button
                  onClick={() => setPhase('idle')}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700 text-sm transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ATTEMPT LOG */}
      {showLog && (
        <div className="mt-6 border-t border-zinc-800 pt-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Attempt Log
            </span>
            <button onClick={() => setShowLog(false)} className="text-zinc-600 hover:text-zinc-300 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          {log.length === 0 ? (
            <p className="text-zinc-600 text-xs text-center py-4">No attempts logged yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[360px]">
                <thead>
                  <tr className="text-zinc-500 border-b border-zinc-800">
                    <th className="text-left pb-2 pr-3 font-semibold">Problem</th>
                    <th className="text-left pb-2 pr-3 font-semibold">Time</th>
                    <th className="text-left pb-2 pr-3 font-semibold">Decision</th>
                    <th className="text-left pb-2 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {log.map(entry => (
                    <tr key={entry.id} className="border-b border-zinc-900 last:border-0">
                      <td className="py-2 pr-3 text-zinc-200 font-medium max-w-[8rem] truncate">
                        {entry.problemName}
                      </td>
                      <td className="py-2 pr-3 text-zinc-400 font-mono whitespace-nowrap">
                        {fmt(entry.timeSpentSeconds)}
                      </td>
                      <td className="py-2 pr-3">
                        {entry.decision === 'commit' ? (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-semibold">
                            🔒 Commit
                          </span>
                        ) : entry.decision === 'bail' ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-semibold">
                            🚀 Bail
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                            …
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-zinc-500 max-w-[10rem] truncate">
                        {entry.partialNotes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUMMARY */}
      {showSummary && (
        <div className="mt-6 border-t border-zinc-800 pt-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5" /> Triage Summary
            </span>
            <button onClick={() => setShowSummary(false)} className="text-zinc-600 hover:text-zinc-300 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Attempted', value: sessionLog.length, color: 'text-amber-300', bg: 'bg-amber-950/40 border-amber-800/40' },
              { label: 'Committed', value: committed, color: 'text-indigo-300', bg: 'bg-indigo-950/40 border-indigo-800/40' },
              { label: 'Bailed', value: bailed, color: 'text-rose-300', bg: 'bg-rose-950/40 border-rose-800/40' },
              { label: 'Efficiency', value: `${eff}%`, color: 'text-emerald-300', bg: 'bg-emerald-950/40 border-emerald-800/40' },
            ].map(stat => (
              <div key={stat.label} className={`rounded-2xl border p-3 text-center ${stat.bg}`}>
                <div className={`text-2xl font-black font-mono ${stat.color}`}>{stat.value}</div>
                <div className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
          {sessionLog.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Clear all triage log entries?')) {
                  setLog([]);
                  saveLog([]);
                }
              }}
              className="mt-4 w-full py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-rose-400 border border-zinc-800 text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" /> Clear Log
            </button>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] text-zinc-600 border-t border-zinc-800/60 pt-3">
        <Clock className="w-3 h-3" />
        <span>Log persisted to <code className="text-zinc-500">savantix_triage_log</code></span>
        <ChevronRight className="w-3 h-3 ml-auto" />
        <span>{sessionLog.length} entries</span>
      </div>
    </div>
  );
};

export default TriageMode;

