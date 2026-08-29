import React, { useState, useMemo, useEffect } from 'react';
import { LogInput } from './LogInput';
import { InsightsPanel } from './InsightsPanel';
import { StudyHeatmap } from './StudyHeatmap';
import { ExamCountdown } from './ExamCountdown';
import { useAppContext } from '../context/AppContext';
import { format, subDays, parseISO, isValid, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { generateMorningRevisionSprint } from '../utils/fsrsEngine';
import {
  Clock,
  BookOpen,
  CheckCircle2,
  Edit2,
  Check,
  X,
  Trash2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Flame,
  Zap,
  Trophy,
  HeartPulse,
  Info,
  RotateCcw,
  Sliders,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Scale,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Plus,
  Minus,
  Sun,
  BrainCircuit,
  Target
} from 'lucide-react';
import {
  getStreakHealthTier,
  getShieldTokenRack,
  getAntiFragileStreakBadge,
  MAX_HP,
  MAX_SHIELD_TOKENS
} from '../utils/streakResilienceEngine';
import {
  calculateSubjectEquilibrium,
  SubjectEquilibriumReport
} from '../utils/pidEquilibriumEngine';
import {
  getCurrentZone,
  getNextZone,
  getMinutesUntilNextZone,
  formatCountdown,
  getWeakSubjectsFromLogs,
  getPersonalizedRecommendations,
  buildTimeline,
} from '../utils/circadianEngine';

export const Dashboard = () => {
  const { logs, updateLog, deleteLog, elasticStreak, updateElasticStreak, recomputeElasticStreak, addLog } = useAppContext();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showHistory, setShowHistory] = useState(false);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState(String(elasticStreak?.targetMinutesDaily || 120));
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Rolling 7-Day Logs for Dynamic Subject Equilibrium Matrix
  const logs7Days = useMemo(() => {
    const today = new Date();
    const sevenDaysAgo = subDays(today, 6);
    const startBoundary = startOfDay(sevenDaysAgo);
    const endBoundary = endOfDay(today);

    return (logs || []).filter(l => {
      if (!l.date) return false;
      const parsed = parseISO(l.date.substring(0, 10));
      return isValid(parsed) && isWithinInterval(parsed, { start: startBoundary, end: endBoundary });
    });
  }, [logs]);

  // Subject Equilibrium & PID Corrective Prescription Report
  const equilibriumReport: SubjectEquilibriumReport = useMemo(() => {
    return calculateSubjectEquilibrium(logs7Days);
  }, [logs7Days]);
  
  const todayLogs = logs.filter(l => l.date === selectedDate);

  const totalMinutes = todayLogs.reduce((acc, log) => acc + (Math.max(0, Number(log.durationMinutes)) || 0), 0);
  const totalProblems = todayLogs.reduce((acc, log) => acc + (Math.max(0, Number(log.problemsSolved)) || 0), 0);
  
  const subjects = Array.from(new Set(
    todayLogs.flatMap(l => (l.subject || 'Uncategorized').split(/,| and | & /i).map(s => {
      const trimmed = s.trim();
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    }).filter(Boolean))
  ));

  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const healthTier = getStreakHealthTier(elasticStreak?.currentHP ?? 100);
  const shieldRack = getShieldTokenRack(elasticStreak?.shieldTokens ?? 2, MAX_SHIELD_TOKENS);
  const streakBadge = getAntiFragileStreakBadge(elasticStreak || {
    currentHP: 100,
    maxHP: 100,
    shieldTokens: 2,
    maxShieldTokens: 3,
    activeStreakDays: 0,
    longestStreakDays: 0,
    lastEvaluatedDate: selectedDate,
    targetMinutesDaily: 120,
    history: []
  });

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    setEditingLogId(null);
  };

  const handleEditClick = (log: any) => {
    setEditingLogId(log.id);
    setEditForm({
      subject: log.subject || '',
      topic: log.topic || '',
      durationMinutes: Number(log.durationMinutes) || 0,
      problemsSolved: Number(log.problemsSolved) || 0,
    });
  };

  const handleSaveEdit = async (logId: string) => {
    try {
      await updateLog(logId, {
        subject: (editForm.subject || 'General').trim().substring(0, 99) || 'General',
        topic: (editForm.topic || '').trim().substring(0, 199),
        durationMinutes: Math.max(0, Math.round(Number(editForm.durationMinutes))) || 0,
        problemsSolved: Math.max(0, Math.round(Number(editForm.problemsSolved))) || 0,
      });
      setEditingLogId(null);
    } catch (error) {
      console.error("Failed to update log:", error);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (window.confirm("Are you sure you want to delete this log?")) {
      try {
        await deleteLog(logId);
        if (editingLogId === logId) {
          setEditingLogId(null);
        }
      } catch (error) {
        console.error("Failed to delete log:", error);
      }
    }
  };

  const handleSaveTarget = () => {
    const parsed = parseInt(targetInput, 10);
    if (!isNaN(parsed) && parsed >= 15) {
      updateElasticStreak({ targetMinutesDaily: parsed });
      setIsEditingTarget(false);
      showToast(`🎯 Daily study target updated to ${parsed} mins!`);
    }
  };

  const handleRecompute = () => {
    recomputeElasticStreak();
    showToast('⚡ Elastic streak recomputed from history!');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const revisionSprint = useMemo(() => {
    return generateMorningRevisionSprint(logs, new Date());
  }, [logs]);

  const handleSolveNow = (subject: string, topic: string) => {
    window.dispatchEvent(new CustomEvent('navigate', { 
      detail: { tab: 'solver', subject, topic } 
    }));
  };

  const handleMarkSprintComplete = async () => {
    try {
      await addLog({
        date: format(new Date(), 'yyyy-MM-dd'),
        subject: 'General STEM',
        topic: 'Morning Revision Sprint',
        durationMinutes: 45,
        problemsSolved: 3
      });
      showToast('🌅 Morning Sprint Complete! +45 mins');
    } catch (e) {
      console.error(e);
    }
  };

  const hasSprintCards = revisionSprint.stabilityCard || revisionSprint.consolidationCard || revisionSprint.decayCard;

  // ── Circadian Engine — live clock ──────────────────────────────────────────
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(tick);
  }, []);

  const currentZone = useMemo(() => getCurrentZone(now), [now]);
  const nextZone    = useMemo(() => getNextZone(currentZone), [currentZone]);
  const minsLeft    = useMemo(() => getMinutesUntilNextZone(now, currentZone), [now, currentZone]);
  const weakSubjects = useMemo(() => getWeakSubjectsFromLogs(logs), [logs]);
  const circadianRecs = useMemo(() => getPersonalizedRecommendations(currentZone, weakSubjects), [currentZone, weakSubjects]);
  const circadianTimeline = useMemo(() => buildTimeline(currentZone), [currentZone]);

  return (
    <div className="w-full px-4 sm:px-6 py-8">
      <div className="max-w-7xl mx-auto w-full space-y-8">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 bg-zinc-900 border border-indigo-500/50 text-indigo-200 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">Overview</h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">Select a date to view or log sessions</p>
          </div>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => handleDateChange(e.target.value)}
            className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-full px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner w-full sm:w-auto"
          />
        </header>

        {/* ========================================================================= */}
        {/* FSRS-STEM NEURO-INTERLEAVED SPRINT */}
        {/* ========================================================================= */}
        <div className="bg-zinc-950 border border-indigo-900/50 rounded-2xl overflow-hidden shadow-2xl relative">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-violet-500/5 to-transparent pointer-events-none" />
          <div className="p-6 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-lg">
                  <Sun className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-violet-200">
                    Morning Revision Sprint 🌅
                  </h2>
                  <p className="text-xs text-indigo-200/60 mt-0.5">
                    {format(new Date(), 'EEEE, MMMM do')} • 45 Min Interleaved Practice
                  </p>
                </div>
              </div>
              {hasSprintCards && (
                <button
                  onClick={handleMarkSprintComplete}
                  className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark Sprint Complete
                </button>
              )}
            </div>

            {!hasSprintCards ? (
              <div className="text-center py-8 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                <BrainCircuit className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-zinc-300">Your revision queue is empty!</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">Log some study sessions first. The FSRS engine will automatically build optimal interleaved revision sprints for you as topics age.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { card: revisionSprint.stabilityCard, title: 'Stability Test', icon: <Target className="w-4 h-4 text-rose-400" />, desc: 'Long-term (21+ days)', bg: 'bg-rose-950/20', border: 'border-rose-900/50' },
                  { card: revisionSprint.consolidationCard, title: 'Consolidation', icon: <BrainCircuit className="w-4 h-4 text-amber-400" />, desc: 'Medium (7-14 days)', bg: 'bg-amber-950/20', border: 'border-amber-900/50' },
                  { card: revisionSprint.decayCard, title: 'Decay Reinforce', icon: <RotateCcw className="w-4 h-4 text-emerald-400" />, desc: 'Recent (2-6 days)', bg: 'bg-emerald-950/20', border: 'border-emerald-900/50' }
                ].map((item, idx) => (
                  <div key={idx} className={`p-4 rounded-xl border ${item.border} ${item.bg} flex flex-col justify-between gap-4 transition-all hover:scale-[1.02] cursor-default`}>
                    {item.card ? (
                      <>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            {item.icon}
                            <span className="text-xs font-bold text-zinc-300">{item.title}</span>
                          </div>
                          <div className="mb-2">
                            <span className="inline-block px-2 py-0.5 bg-zinc-900/80 rounded border border-zinc-700/50 text-[10px] text-zinc-400 font-mono mb-1">
                              {item.card.subject}
                            </span>
                            <h3 className="text-sm font-semibold text-zinc-100 leading-snug line-clamp-2">
                              {item.card.topic}
                            </h3>
                          </div>
                          <p className="text-[10px] text-zinc-500">Studied {item.card.daysAgo} days ago</p>
                        </div>
                        <button
                          onClick={() => handleSolveNow(item.card.subject, item.card.topic)}
                          className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                        >
                          Solve Now <ArrowRight className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-4">
                        <div className="mb-2">{item.icon}</div>
                        <span className="text-xs font-semibold text-zinc-400">{item.title}</span>
                        <p className="text-[10px] text-zinc-500 mt-1">{item.desc}</p>
                        <span className="text-[10px] bg-zinc-900 px-2 py-0.5 rounded mt-2">Up to date</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* R5: ELASTIC STREAK HEALTH BAR & RESILIENCE TOKEN ENGINE HUB */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-br from-zinc-900/90 via-zinc-900/70 to-zinc-950 border border-zinc-800/90 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-6 relative overflow-hidden">
          
          {/* Ambient Glow Background Accent */}
          <div 
            className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-20 transition-all duration-700"
            style={{ backgroundColor: healthTier.tier === 'emerald' ? '#10b981' : healthTier.tier === 'amber' ? '#f59e0b' : '#f43f5e' }}
          />

          {/* Top Row: Title, Anti-Fragile Badge & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl border ${healthTier.borderColor} bg-zinc-950/60 shadow-inner`}>
                <ShieldCheck className={`w-6 h-6 ${healthTier.textColor}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-zinc-100 tracking-tight">Elastic Streak & Resilience Hub</h2>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                    Anti-Fragile
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  100 HP health buffer absorbs off-days • Surplus effort charges shield tokens
                </p>
              </div>
            </div>

            {/* Streak & Record Badges */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-md ${streakBadge.badgeClass}`}>
                <span>{streakBadge.icon}</span>
                <span>{streakBadge.text}</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950/70 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-300">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Best: <strong className="text-zinc-100">{elasticStreak?.longestStreakDays ?? 0}d</strong></span>
              </div>

              <button
                type="button"
                onClick={handleRecompute}
                className="p-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-zinc-700/60 rounded-xl text-xs transition-colors cursor-pointer"
                title="Recalculate streak resilience from full log history"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Health Bar Section */}
          <div className="space-y-2.5 relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 font-mono">
                <HeartPulse className={`w-4 h-4 ${healthTier.textColor}`} />
                <span className="text-sm font-bold text-zinc-100">
                  {elasticStreak?.currentHP ?? 100} <span className="text-zinc-500 font-normal">/ {MAX_HP} HP</span>
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${healthTier.borderColor} ${healthTier.textColor} bg-zinc-950/60`}>
                  {healthTier.label}
                </span>
              </div>

              {/* Daily Target Setting */}
              <div className="flex items-center gap-2 text-zinc-400">
                {isEditingTarget ? (
                  <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1">
                    <span className="text-[11px] text-zinc-400">Target:</span>
                    <input
                      type="number"
                      min="15"
                      max="720"
                      value={targetInput}
                      onChange={e => setTargetInput(e.target.value)}
                      className="w-12 bg-transparent text-zinc-100 text-xs font-mono focus:outline-none"
                    />
                    <span className="text-[11px] text-zinc-500">m</span>
                    <button
                      type="button"
                      onClick={handleSaveTarget}
                      className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] ml-1"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingTarget(false)}
                      className="p-1 text-zinc-500 hover:text-zinc-300 text-[10px]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setTargetInput(String(elasticStreak?.targetMinutesDaily || 120));
                      setIsEditingTarget(true);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-950/60 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-[11px] text-zinc-300 transition-colors cursor-pointer"
                    title="Click to adjust daily target minutes"
                  >
                    <span>🎯 Target: <strong>{elasticStreak?.targetMinutesDaily || 120}m</strong> / day</span>
                    <Sliders className="w-3 h-3 text-indigo-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Visual Health Bar */}
            <div className="h-4 w-full bg-zinc-950/80 rounded-full border border-zinc-800/80 p-0.5 overflow-hidden shadow-inner relative">
              <div 
                className={`h-full rounded-full transition-all duration-700 ease-out ${healthTier.barColor}`}
                style={{ width: `${Math.max(0, Math.min(100, elasticStreak?.currentHP ?? 100))}%` }}
              />
            </div>

            {/* Mechanics Rules Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-zinc-400 pt-1">
              <div className="bg-zinc-950/50 border border-zinc-800/70 rounded-lg p-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span><strong>+15 HP</strong> on Target ({elasticStreak?.targetMinutesDaily || 120}m)</span>
              </div>
              <div className="bg-zinc-950/50 border border-zinc-800/70 rounded-lg p-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                <span><strong>+25 HP & +1 🛡️</strong> Overdrive ({Math.round((elasticStreak?.targetMinutesDaily || 120) * 1.5)}m)</span>
              </div>
              <div className="bg-zinc-950/50 border border-zinc-800/70 rounded-lg p-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <span><strong>-20 HP max</strong> Partial Study</span>
              </div>
              <div className="bg-zinc-950/50 border border-zinc-800/70 rounded-lg p-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                <span><strong>-35 HP</strong> Miss (0 Shields)</span>
              </div>
            </div>
          </div>

          {/* Resilience Shield Token Rack */}
          <div className="border-t border-zinc-800/80 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div>
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                Resilience Shield Tokens ({elasticStreak?.shieldTokens ?? 2} / {MAX_SHIELD_TOKENS} Armed)
              </span>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Shields automatically deploy on missed/rest days: 0 HP lost & streak frozen
              </p>
            </div>

            {/* 3 Shield Icons Rack */}
            <div className="flex items-center gap-2.5">
              {shieldRack.map(slot => (
                <div
                  key={slot.index}
                  className="group relative cursor-pointer"
                  title={slot.tooltip}
                >
                  <div className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
                    slot.isCharged
                      ? 'bg-indigo-950/80 border-indigo-500/50 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.4)] group-hover:scale-110'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-600 group-hover:border-zinc-700'
                  }`}>
                    {slot.isCharged ? (
                      <ShieldCheck className="w-5 h-5 text-indigo-400 fill-indigo-400/20 animate-pulse" />
                    ) : (
                      <ShieldAlert className="w-5 h-5 text-zinc-600" />
                    )}
                  </div>
                  
                  {/* Tooltip Overlay */}
                  <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-zinc-900 border border-zinc-700 text-[10px] text-zinc-300 p-2 rounded-lg shadow-xl z-30">
                    <p className="font-bold text-zinc-100 mb-0.5">{slot.label}</p>
                    <p className="text-zinc-400 leading-snug">{slot.tooltip}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Defense History Accordion */}
          {elasticStreak?.history && elasticStreak.history.length > 0 && (
            <div className="border-t border-zinc-800/80 pt-3 relative z-10">
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center justify-between w-full text-xs text-zinc-400 hover:text-zinc-200 transition-colors py-1 cursor-pointer"
              >
                <span className="flex items-center gap-1.5 font-semibold">
                  <Info className="w-3.5 h-3.5 text-indigo-400" />
                  Recent Resilience Defense & Health Log ({elasticStreak.history.length} events)
                </span>
                {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showHistory && (
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 animate-in fade-in duration-200">
                  {elasticStreak.history.slice(0, 10).map((entry, idx) => (
                    <div
                      key={`${entry.date}-${idx}`}
                      className="bg-zinc-950/70 border border-zinc-850 p-2.5 rounded-xl flex items-center justify-between text-xs gap-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-zinc-400 text-[11px]">{entry.date}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          entry.status === 'surplus_overdrive' ? 'bg-cyan-950/60 border border-cyan-500/40 text-cyan-300' :
                          entry.status === 'target_met' ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300' :
                          entry.status === 'shield_defended' ? 'bg-indigo-950/60 border border-indigo-500/40 text-indigo-300' :
                          entry.status === 'partial_decay' ? 'bg-amber-950/60 border border-amber-500/40 text-amber-300' :
                          'bg-rose-950/60 border border-rose-500/40 text-rose-300'
                        }`}>
                          {entry.status === 'surplus_overdrive' ? '⚡ Overdrive' :
                           entry.status === 'target_met' ? '✅ Target Met' :
                           entry.status === 'shield_defended' ? '🛡️ Shield Defended' :
                           entry.status === 'partial_decay' ? '⚠️ Partial Study' : '❌ Missed Study'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="text-zinc-400">{entry.actualMinutes}m / {entry.targetMinutes}m</span>
                        <span className={`font-mono font-bold ${entry.hpDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {entry.hpDelta >= 0 ? `+${entry.hpDelta}` : entry.hpDelta} HP
                        </span>
                        <span className="text-zinc-300 font-mono">({entry.hpResult} HP)</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-6 flex items-center gap-4 shadow-lg hover:border-zinc-700 transition-colors">
            <div className="p-3 bg-blue-500/10 rounded-full border border-blue-500/20">
              <Clock className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-500 font-medium">Study Time</p>
              <p className="text-2xl font-bold text-zinc-100">{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</p>
            </div>
          </div>
          <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-6 flex items-center gap-4 shadow-lg hover:border-zinc-700 transition-colors">
            <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-500 font-medium">Problems Solved</p>
              <p className="text-2xl font-bold text-zinc-100">{totalProblems}</p>
            </div>
          </div>
          <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-6 flex items-center gap-4 shadow-lg hover:border-zinc-700 transition-colors">
            <div className="p-3 bg-purple-500/10 rounded-full border border-purple-500/20">
              <BookOpen className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-500 font-medium">Subjects Today</p>
              <p className="text-2xl font-bold text-zinc-100">{subjects.length}</p>
            </div>
          </div>
          <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-6 flex items-center gap-4 shadow-lg hover:border-zinc-700 transition-colors">
            <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/20">
              <Scale className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm text-zinc-500 font-medium">Equilibrium</p>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${equilibriumReport.statusBadgeColor}`}>
                  {equilibriumReport.status === 'harmonious' ? 'Harmonious' : equilibriumReport.status === 'mild_skew' ? 'Mild Skew' : 'Neglect Alert'}
                </span>
              </div>
              <p className="text-2xl font-bold text-zinc-100 font-mono">{equilibriumReport.equilibriumScore}%</p>
            </div>
          </div>
        </div>

        <div className="w-full">
          <LogInput selectedDate={selectedDate} />
        </div>

        {/* 52-Week Study Streak Heatmap */}
        <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-6 shadow-xl">
          <StudyHeatmap logs={logs} selectedDate={selectedDate} onSelectDate={handleDateChange} />
        </div>

        {/* Dynamic Exam Countdowns & Velocity Forecast */}
        <ExamCountdown />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            
            {/* Subject Equilibrium Status & PID Next-Day Prescription Banner */}
            <div className="bg-gradient-to-r from-zinc-900/90 via-zinc-900/70 to-zinc-950 border border-zinc-800/90 rounded-2xl p-5 shadow-xl space-y-4 backdrop-blur-md relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400 shrink-0">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-zinc-100">Subject Equilibrium & PID Rebalancer</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${equilibriumReport.statusBadgeColor}`}>
                        {equilibriumReport.statusLabel} ({equilibriumReport.equilibriumScore}%)
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 mt-1 font-medium leading-relaxed">
                      {equilibriumReport.actionablePrescription}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  {equilibriumReport.subjectDistributions.map(sub => (
                    <div
                      key={sub.subject}
                      className="px-2 py-1 bg-zinc-950/80 border border-zinc-800 rounded-lg text-[10px] font-mono flex items-center gap-1"
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sub.color }} />
                      <span className="text-zinc-400">{sub.subject}:</span>
                      <strong className={
                        sub.recommendedDailyAdjustmentMins > 0 ? 'text-emerald-400' :
                        sub.recommendedDailyAdjustmentMins < 0 ? 'text-amber-400' : 'text-zinc-400'
                      }>
                        {sub.recommendedDailyAdjustmentMins > 0 ? `+${sub.recommendedDailyAdjustmentMins}m` :
                         sub.recommendedDailyAdjustmentMins < 0 ? `${sub.recommendedDailyAdjustmentMins}m` : '0m'}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <InsightsPanel selectedDate={selectedDate} />
          </div>
          <div className="space-y-6">
            
            {/* Recent Logs */}
            <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Sessions</h3>
                <span className="px-2.5 py-0.5 bg-zinc-800/50 rounded-full text-[10px] text-zinc-500 border border-zinc-700 font-medium">{selectedDate}</span>
              </div>
              {todayLogs.length === 0 ? (
                <p className="text-sm text-zinc-600 text-center py-8">No sessions logged yet.</p>
              ) : (
                <div className="space-y-3">
                  {todayLogs.map(log => (
                    <div key={log.id} className="p-4 bg-zinc-950/50 border border-zinc-800/50 rounded-xl group hover:border-zinc-700 transition-all hover:shadow-md">
                      {editingLogId === log.id ? (
                        <div className="space-y-3">
                          <input 
                            type="text" 
                            value={editForm.subject} 
                            onChange={e => setEditForm({...editForm, subject: e.target.value})}
                            className="w-full bg-zinc-900/60 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:ring-1 focus:ring-indigo-500"
                            placeholder="Subject"
                          />
                          <input 
                            type="text" 
                            value={editForm.topic} 
                            onChange={e => setEditForm({...editForm, topic: e.target.value})}
                            className="w-full bg-zinc-900/60 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:ring-1 focus:ring-indigo-500"
                            placeholder="Topic"
                          />
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Mins</label>
                              <input 
                                type="number" 
                                value={editForm.durationMinutes} 
                                onChange={e => setEditForm({...editForm, durationMinutes: e.target.value})}
                                className="w-full bg-zinc-900/60 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Probs</label>
                              <input 
                                type="number" 
                                value={editForm.problemsSolved} 
                                onChange={e => setEditForm({...editForm, problemsSolved: e.target.value})}
                                className="w-full bg-zinc-900/60 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-zinc-800">
                            <button onClick={() => setEditingLogId(null)} className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors">Cancel</button>
                            <button onClick={() => handleSaveEdit(log.id)} className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-sm">Save</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start mb-2 relative">
                            <span className="text-sm font-semibold text-zinc-200">{log.subject}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-zinc-400 font-medium bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">{log.durationMinutes}m</span>
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => handleEditClick(log)} 
                                  className="p-1.5 text-zinc-400 hover:text-indigo-300 hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-800/80 cursor-pointer"
                                  title="Edit Log"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteLog(log.id)} 
                                  className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-800/80 cursor-pointer"
                                  title="Delete Log"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-zinc-400 truncate">{log.topic}</p>
                          {log.problemsSolved > 0 && <p className="text-[10px] text-zinc-500 mt-2 font-medium bg-zinc-900/50 inline-block px-2 py-0.5 rounded-full">{log.problemsSolved} problems</p>}
                          {log.efficiencyScore && (
                            <div className="mt-3 flex items-center gap-2">
                              <div className="h-1.5 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-indigo-500 rounded-full" 
                                  style={{ width: `${(log.efficiencyScore / 10) * 100}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-zinc-500 font-medium">EFF {log.efficiencyScore}/10</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>


        {/* ================================================================= */}
        {/* CIRCADIAN COGNITIVE LOAD SCHEDULER                                */}
        {/* ================================================================= */}
        <div className={`relative rounded-2xl overflow-hidden shadow-2xl border ${currentZone.borderColor} ${currentZone.bgColor}`}>
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{ background: `radial-gradient(ellipse at top left, ${currentZone.glowColor}22 0%, transparent 60%)` }}
          />
          <div className="relative z-10 p-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="text-3xl leading-none">{currentZone.icon}</div>
                <div>
                  <h2 className={`text-lg font-bold ${currentZone.accentColor}`}>
                    Circadian Cognitive Scheduler
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Your brain's current energy state · Live-updating every minute
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${currentZone.badgeBg}`}>
                  {currentZone.icon} {currentZone.brainState}
                </span>
              </div>
            </div>

            {/* Timeline bar */}
            <div className="mb-6">
              <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest mb-2">24-Hour Energy Map</p>
              <div className="flex h-5 rounded-full overflow-hidden gap-0.5">
                {circadianTimeline.map((seg) => (
                  <div
                    key={seg.zone.id}
                    title={`${seg.zone.icon} ${seg.zone.label}`}
                    className={`h-full transition-all rounded-sm ${seg.isCurrent ? 'opacity-100 ring-2 ring-white/30' : 'opacity-40'}`}
                    style={{
                      width: `${seg.widthFraction * 100}%`,
                      background: seg.zone.glowColor,
                    }}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[9px] text-zinc-600 mt-1.5 font-mono">
                <span>5:30</span>
                <span>9:00</span>
                <span>12:00</span>
                <span>14:00</span>
                <span>17:00</span>
                <span>20:00</span>
                <span>22:00</span>
              </div>
            </div>

            {/* Current zone card + countdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className={`sm:col-span-2 rounded-xl border p-4 ${currentZone.borderColor} bg-zinc-950/40`}>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-2">Now — What to do</p>
                <ul className="space-y-2">
                  {circadianRecs.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${currentZone.accentColor.replace('text-', 'bg-')}`} />
                      <span className="text-sm text-zinc-300">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-3">
                <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-4 flex flex-col items-center justify-center text-center gap-1">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Next Zone In</p>
                  <p className={`text-3xl font-bold font-mono ${currentZone.accentColor}`}>
                    {formatCountdown(minsLeft)}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    → {nextZone.icon} {nextZone.label}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-3 flex flex-col items-center justify-center text-center gap-1">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Current Time</p>
                  <p className="text-lg font-bold font-mono text-zinc-200">
                    {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Weak subject callout */}
            {weakSubjects.length > 0 && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-3 flex items-start gap-3">
                <span className="text-amber-400 text-lg leading-none mt-0.5">⚠️</span>
                <div>
                  <p className="text-xs font-bold text-amber-300">Weakest subject this week</p>
                  <p className="text-xs text-amber-200/70 mt-0.5">
                    <strong>{weakSubjects[0].subject}</strong> — only {weakSubjects[0].totalMinutes} min in the last 7 days.
                    Schedule it in your next Peak Working Memory slot.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
