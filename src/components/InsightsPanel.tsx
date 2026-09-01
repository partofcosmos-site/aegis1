import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { UniversalAIService } from '../services/universalAIService';
import { format } from 'date-fns';
import {
  Brain,
  AlertTriangle,
  Target,
  TrendingUp,
  Zap,
  Loader2,
  RotateCcw,
  Sparkles,
  Clock,
  CheckCircle2,
  Layers,
  Info
} from 'lucide-react';

export const InsightsPanel = ({ selectedDate }: { selectedDate: string }) => {
  const { user, profile, logs, insights, addInsight } = useAppContext();
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const todayInsight = insights.find(i => i.date === selectedDate);
  const todayLogs = logs.filter(l => l.date === selectedDate);

  // Cumulative metrics calculation across all sessions for the active date
  const totalMinutes = todayLogs.reduce((acc, log) => acc + (Math.max(0, Number(log.durationMinutes)) || 0), 0);
  const totalProblems = todayLogs.reduce((acc, log) => acc + (Math.max(0, Number(log.problemsSolved)) || 0), 0);
  const avgEfficiency = todayLogs.length > 0
    ? (todayLogs.reduce((acc, log) => acc + (Number(log.efficiencyScore) || 8), 0) / todayLogs.length).toFixed(1)
    : '8.0';
  const avgFocus = todayLogs.length > 0
    ? (todayLogs.reduce((acc, log) => acc + (Number(log.focusScore) || 8), 0) / todayLogs.length).toFixed(1)
    : '8.0';
  const subjectsCovered = Array.from(new Set(todayLogs.map(l => l.subject).filter(Boolean)));
  const mistakesCollected = todayLogs.flatMap(l => (Array.isArray(l.mistakes) ? l.mistakes : [l.mistakes]).filter(Boolean));

  // Determine if new logs exist since the last analysis snapshot was generated
  const evaluatedSessions = todayInsight?.sessionCount || 1;
  const evaluatedMinutes = todayInsight?.evaluatedMinutes || 0;
  const hasNewLogsSinceAnalysis = Boolean(
    todayInsight && (todayLogs.length > evaluatedSessions || (evaluatedMinutes > 0 && totalMinutes !== evaluatedMinutes))
  );

  const handleGenerate = async () => {
    if (!user || todayLogs.length === 0) return;
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const constraints = {
        schoolHours: profile?.schoolHours || 6,
        targetExams: profile?.targetExams || ['IPhO / NSEP Track', 'JEE Advanced 2028', 'ISI / CMI 2028', 'CBSE Class 12 Boards (2028)'],
        cumulativeDailyStats: {
          sessionCount: todayLogs.length,
          totalMinutes,
          totalProblems,
          avgEfficiency,
          avgFocus,
          subjects: subjectsCovered
        }
      };

      let insightData: any;
      try {
        insightData = await UniversalAIService.generateDailyInsights(todayLogs, constraints);
      } catch (aiErr: any) {
        console.warn("AI generation fallback to cumulative heuristic analysis:", aiErr);
        const subjectListStr = subjectsCovered.join(', ') || 'General STEM';
        const mistakeSummary = mistakesCollected.length > 0
          ? `Key mistake patterns flagged across sessions: ${mistakesCollected.slice(0, 3).join('; ')}.`
          : 'Zero major conceptual traps reported across logged sessions.';

        insightData = {
          performanceSummary: `Completed ${todayLogs.length} cumulative study session(s) totaling ${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m across ${subjectListStr}. Solved ${totalProblems} problems with an average efficiency score of ${avgEfficiency}/10 and focus score of ${avgFocus}/10.`,
          keyInefficiencies: totalMinutes < 120 ? ['Daily focus volume is below optimal 2-hour threshold'] : ['Pacing optimization recommended on complex multi-step numericals'],
          biggestMistakePattern: mistakeSummary,
          hiddenWeakness: `Deep conceptual grounding and formula retention in ${subjectsCovered[0] || 'Physics'}.`,
          nextDayPlan: [
            `Initiate Morning Revision Sprint on ${subjectsCovered[0] || 'Core STEM'} for 45 mins.`,
            `Schedule 90-minute high-yield numerical practice block.`,
            `Review active recall flashcards and error logs prior to evening session.`
          ],
          priorityRanking: subjectsCovered,
          warnings: totalMinutes < 60 ? ['Cumulative focus time is below recommended baseline.'] : []
        };
      }

      const effectiveDate = selectedDate || format(new Date(), 'yyyy-MM-dd');
      await addInsight({
        date: effectiveDate,
        sessionCount: todayLogs.length,
        evaluatedMinutes: totalMinutes,
        evaluatedProblems: totalProblems,
        avgEfficiencyScore: Number(avgEfficiency),
        avgFocusScore: Number(avgFocus),
        ...insightData
      });

      setSuccessToast(`🎯 Insights updated with latest ${todayLogs.length} sessions (${totalMinutes}m)!`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (error: any) {
      console.error("Failed to generate insights", error);
      setErrorMsg(error.message || "Failed to generate insights. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!todayInsight) {
    return (
      <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center min-h-[320px] shadow-xl relative">
        <Brain className="w-12 h-12 text-indigo-400/60 mb-4 animate-pulse" />
        <h3 className="text-lg font-bold text-zinc-100 mb-2">No Daily Insights Yet</h3>
        <p className="text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
          {todayLogs.length > 0
            ? `You have ${todayLogs.length} logged session(s) (${totalMinutes}m, ${totalProblems} problems) ready for AI cognitive evaluation.`
            : 'Log your study sessions for this date to generate AI-driven insights, mistake diagnosis, and optimal next-day action plan.'}
        </p>
        {errorMsg && (
          <p className="text-xs text-red-400 mb-4 bg-red-950/40 border border-red-800/50 px-3 py-1.5 rounded-lg">{errorMsg}</p>
        )}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={todayLogs.length === 0 || isGenerating}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 text-white rounded-xl transition-all font-semibold shadow-lg shadow-indigo-600/20 cursor-pointer"
        >
          {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
          {isGenerating ? 'Analyzing Cumulative Sessions...' : 'Generate Daily Analysis'}
        </button>
        {todayLogs.length === 0 && (
          <p className="text-xs text-zinc-500 mt-3">You need at least one log on this day to analyze.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Interactive Control Bar */}
      <div className="bg-gradient-to-r from-zinc-900/90 via-zinc-900/80 to-zinc-950 border border-zinc-800/90 rounded-2xl p-5 shadow-2xl backdrop-blur-md space-y-4 relative overflow-hidden">
        
        {/* Toast Alert */}
        {successToast && (
          <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successToast}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 rounded-xl text-indigo-400 shadow-inner">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-zinc-100 tracking-tight">Daily AI Cognitive Insights</h3>
                {hasNewLogsSinceAnalysis ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full animate-pulse flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> New logs ready to re-analyze
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-full">
                    Active Snapshot
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Evaluated on {evaluatedSessions} session(s) ({evaluatedMinutes || totalMinutes}m) • Active: {todayLogs.length} session(s) ({totalMinutes}m)
              </p>
            </div>
          </div>

          {/* R3: Explicit "🔄 Re-analyze with Latest Logs" Action Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={todayLogs.length === 0 || isGenerating}
            title="Re-evaluate cumulative daily performance, recalculate mistake patterns, and refresh next-day plan with your latest study logs."
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <RotateCcw className="w-4 h-4 text-indigo-200" />
            )}
            <span>{isGenerating ? 'Re-analyzing Latest Logs...' : '🔄 Re-analyze with Latest Logs'}</span>
          </button>
        </div>

        {/* Cumulative Daily Stats Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-800/70">
          <div className="bg-zinc-950/60 border border-zinc-850 rounded-xl p-2.5 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400 shrink-0" />
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Total Focus</p>
              <p className="text-xs font-bold text-zinc-200">{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</p>
            </div>
          </div>
          <div className="bg-zinc-950/60 border border-zinc-850 rounded-xl p-2.5 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Problems</p>
              <p className="text-xs font-bold text-zinc-200">{totalProblems}</p>
            </div>
          </div>
          <div className="bg-zinc-950/60 border border-zinc-850 rounded-xl p-2.5 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Avg Efficiency</p>
              <p className="text-xs font-bold text-zinc-200">{avgEfficiency}/10</p>
            </div>
          </div>
          <div className="bg-zinc-950/60 border border-zinc-850 rounded-xl p-2.5 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400 shrink-0" />
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Subjects</p>
              <p className="text-xs font-bold text-zinc-200">{subjectsCovered.length || 1}</p>
            </div>
          </div>
        </div>

        {errorMsg && (
          <p className="text-xs text-red-400 bg-red-950/40 border border-red-800/50 px-3 py-1.5 rounded-lg">{errorMsg}</p>
        )}
      </div>

      {/* Performance Summary Card */}
      <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
          </div>
          <h3 className="text-base font-bold text-zinc-100">Cumulative Performance Summary</h3>
        </div>
        <p className="text-zinc-300 text-sm leading-relaxed">{todayInsight.performanceSummary}</p>
      </div>

      {/* Diagnostics Grid: Weaknesses & Next Day Plan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <h3 className="text-base font-bold text-zinc-100">Weaknesses & Mistakes</h3>
          </div>
          <div className="space-y-4">
            <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-xl p-3.5">
              <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider mb-1">Biggest Pattern</h4>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">{todayInsight.biggestMistakePattern}</p>
            </div>
            <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-xl p-3.5">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">Hidden Weakness</h4>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">{todayInsight.hiddenWeakness}</p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <Target className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-base font-bold text-zinc-100">Next Day Action Plan</h3>
          </div>
          <ul className="space-y-3">
            {todayInsight.nextDayPlan?.map((plan: string, idx: number) => (
              <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-zinc-300 bg-zinc-950/50 border border-zinc-800/60 rounded-xl p-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xs font-bold text-emerald-300 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-snug">{plan}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* System Warnings */}
      {todayInsight.warnings?.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3 shadow-lg">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-300">System Warnings & Velocity Alerts</h4>
            <ul className="list-disc list-inside text-xs sm:text-sm text-amber-200/80 space-y-1">
              {todayInsight.warnings.map((w: string, i: number) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
