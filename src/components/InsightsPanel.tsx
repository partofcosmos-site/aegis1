import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { UniversalAIService } from '../services/universalAIService';
import { format } from 'date-fns';
import { Brain, AlertTriangle, Target, TrendingUp, Zap, Loader2 } from 'lucide-react';

export const InsightsPanel = ({ selectedDate }: { selectedDate: string }) => {
  const { user, profile, logs, insights, addInsight } = useAppContext();
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const todayInsight = insights.find(i => i.date === selectedDate);
  const todayLogs = logs.filter(l => l.date === selectedDate);

  const handleGenerate = async () => {
    if (!user || todayLogs.length === 0) return;
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const constraints = {
        schoolHours: profile?.schoolHours || 6,
        targetExams: profile?.targetExams || ['JEE Advanced']
      };
      const insightData = await UniversalAIService.generateDailyInsights(todayLogs, constraints);
      
      const effectiveDate = selectedDate || format(new Date(), 'yyyy-MM-dd');
      await addInsight({
        date: effectiveDate,
        ...insightData
      });
    } catch (error: any) {
      console.error("Failed to generate insights", error);
      setErrorMsg(error.message || "Failed to generate insights. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!todayInsight) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center text-center min-h-[300px]">
        <Brain className="w-12 h-12 text-zinc-700 mb-4" />
        <h3 className="text-lg font-medium text-zinc-300 mb-2">No Insights Yet</h3>
        <p className="text-sm text-zinc-500 max-w-sm mb-6">
          Log your study sessions for this day to generate AI-driven insights and your optimal plan.
        </p>
        {errorMsg && (
          <p className="text-sm text-red-400 mb-4">{errorMsg}</p>
        )}
        <button
          onClick={handleGenerate}
          disabled={todayLogs.length === 0 || isGenerating}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg transition-colors font-medium"
        >
          {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
          {isGenerating ? 'Analyzing...' : 'Generate Daily Analysis'}
        </button>
        {todayLogs.length === 0 && (
          <p className="text-xs text-zinc-600 mt-3">You need at least one log on this day to analyze.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-100">Performance Summary</h3>
        </div>
        <p className="text-zinc-300 text-sm leading-relaxed">{todayInsight.performanceSummary}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-100">Weaknesses & Mistakes</h3>
          </div>
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Biggest Pattern</h4>
              <p className="text-sm text-zinc-300">{todayInsight.biggestMistakePattern}</p>
            </div>
            <div>
              <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Hidden Weakness</h4>
              <p className="text-sm text-zinc-300">{todayInsight.hiddenWeakness}</p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Target className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-100">Next Day Plan</h3>
          </div>
          <ul className="space-y-3">
            {todayInsight.nextDayPlan?.map((plan: string, idx: number) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-zinc-300">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-400 mt-0.5">
                  {idx + 1}
                </span>
                {plan}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {todayInsight.warnings?.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-amber-500 mb-1">System Warnings</h4>
            <ul className="list-disc list-inside text-sm text-amber-400/80 space-y-1">
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
