import React, { useMemo } from 'react';
import { format, subDays, eachDayOfInterval, parseISO, isSameDay } from 'date-fns';
import { Flame, Calendar, Trophy, Zap } from 'lucide-react';

interface StudyHeatmapProps {
  logs: any[];
}

export const StudyHeatmap: React.FC<StudyHeatmapProps> = ({ logs }) => {
  // Generate 52 weeks (364 days) of activity
  const { days, currentStreak, longestStreak, totalActiveDays, totalMinutes } = useMemo(() => {
    const today = new Date();
    const startDate = subDays(today, 364);
    const intervalDays = eachDayOfInterval({ start: startDate, end: today });

    // Map logs by date
    const dateMap = new Map<string, { minutes: number; problems: number; count: number; subjects: Set<string> }>();
    
    logs.forEach(log => {
      if (!log.date) return;
      const dateStr = log.date;
      const existing = dateMap.get(dateStr) || { minutes: 0, problems: 0, count: 0, subjects: new Set<string>() };
      existing.minutes += Number(log.durationMinutes) || 0;
      existing.problems += Number(log.problemsSolved) || 0;
      existing.count += 1;
      if (log.subject) existing.subjects.add(log.subject);
      dateMap.set(dateStr, existing);
    });

    let current = 0;
    let longest = 0;
    let tempStreak = 0;
    let activeDays = 0;
    let totalMins = 0;

    // Calculate streaks across chronological days
    intervalDays.forEach((day, idx) => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const entry = dateMap.get(dateKey);
      
      if (entry && entry.minutes > 0) {
        tempStreak++;
        activeDays++;
        totalMins += entry.minutes;
        if (tempStreak > longest) longest = tempStreak;
      } else {
        tempStreak = 0;
      }

      // Check current streak from today backwards
      if (idx === intervalDays.length - 1) {
        let backIdx = intervalDays.length - 1;
        while (backIdx >= 0) {
          const dKey = format(intervalDays[backIdx], 'yyyy-MM-dd');
          const e = dateMap.get(dKey);
          if (e && e.minutes > 0) {
            current++;
            backIdx--;
          } else {
            // Allow today to be unlogged if yesterday was logged
            if (backIdx === intervalDays.length - 1) {
              backIdx--;
              continue;
            }
            break;
          }
        }
      }
    });

    const dayItems = intervalDays.map(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const entry = dateMap.get(dateKey);
      const minutes = entry?.minutes || 0;
      const problems = entry?.problems || 0;
      
      // Calculate intensity level 0 - 4
      let level = 0;
      if (minutes >= 240) level = 4;      // 4+ hours (Mastery)
      else if (minutes >= 150) level = 3; // 2.5h - 4h (Deep Focus)
      else if (minutes >= 60) level = 2;  // 1h - 2.5h (Solid Session)
      else if (minutes > 0) level = 1;    // < 1h (Review / Quick)

      return {
        date: day,
        dateKey,
        minutes,
        problems,
        level,
        subjects: entry ? Array.from(entry.subjects) : []
      };
    });

    return {
      days: dayItems,
      currentStreak: current,
      longestStreak: longest,
      totalActiveDays: activeDays,
      totalMinutes: totalMins
    };
  }, [logs]);

  // Color intensity mapping in dark palette
  const getLevelColor = (level: number) => {
    switch (level) {
      case 4: return 'bg-indigo-500 shadow-sm shadow-indigo-500/50 hover:ring-2 hover:ring-indigo-300';
      case 3: return 'bg-indigo-600/80 hover:ring-2 hover:ring-indigo-400';
      case 2: return 'bg-indigo-800/80 hover:ring-2 hover:ring-indigo-500';
      case 1: return 'bg-indigo-950/90 border border-indigo-800/40 hover:ring-2 hover:ring-indigo-600';
      default: return 'bg-zinc-900/90 border border-zinc-800/60 hover:bg-zinc-800';
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
      {/* Top Metrics Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Study Velocity & Consistency Heatmap</h3>
            <p className="text-[11px] text-zinc-400">52-week continuous activity track</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 font-semibold">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>{currentStreak} Day Streak</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-300">
            <Trophy className="w-3.5 h-3.5 text-indigo-400" />
            <span>Best: {longestStreak}d</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-zinc-400">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>{totalActiveDays} Active Days ({Math.round(totalMinutes / 60)}h total)</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[680px]">
          <div className="grid grid-flow-col grid-rows-7 gap-1">
            {days.map((day) => (
              <div
                key={day.dateKey}
                title={`${day.dateKey}: ${day.minutes} mins, ${day.problems} problems (${day.subjects.join(', ') || 'None'})`}
                className={`w-3 h-3 rounded-sm transition-all cursor-pointer ${getLevelColor(day.level)}`}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-3 pt-2 border-t border-zinc-800/40">
            <div className="flex gap-4">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span>Less</span>
              <div className="w-2.5 h-2.5 rounded-sm bg-zinc-900 border border-zinc-800" />
              <div className="w-2.5 h-2.5 rounded-sm bg-indigo-950 border border-indigo-800/40" />
              <div className="w-2.5 h-2.5 rounded-sm bg-indigo-800/80" />
              <div className="w-2.5 h-2.5 rounded-sm bg-indigo-600/80" />
              <div className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
              <span>More (4h+)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
