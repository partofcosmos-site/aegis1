import React, { useState, useMemo } from 'react';
import { format, subDays, eachDayOfInterval, parseISO, isValid, addDays } from 'date-fns';
import { Flame, Calendar, Trophy, Zap, Plus, Edit2, Trash2, X, Clock, CheckCircle2, BookOpen, Save } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export interface StudyHeatmapProps {
  logs: any[];
  onSelectDate?: (date: string) => void;
  selectedDate?: string;
  className?: string;
}

interface DayLogEntry {
  id: string;
  subject: string;
  topic?: string;
  subtopic?: string;
  durationMinutes: number;
  problemsSolved: number;
  focusScore?: number;
  efficiencyScore?: number;
  rawText?: string;
  mistakes?: string[];
  createdAt?: string;
}

export const StudyHeatmap: React.FC<StudyHeatmapProps> = ({
  logs = [],
  onSelectDate,
  selectedDate: externalSelectedDate,
  className = ''
}) => {
  const { addLog, updateLog, deleteLog } = useAppContext();
  
  // Active date modal state
  const [modalDate, setModalDate] = useState<string | null>(null);
  const [isAddingSession, setIsAddingSession] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  
  // Add session form state
  const [newSubject, setNewSubject] = useState('Physics');
  const [newTopic, setNewTopic] = useState('');
  const [newDuration, setNewDuration] = useState('120');
  const [newProblems, setNewProblems] = useState('20');
  const [newFocusScore, setNewFocusScore] = useState('8');
  const [newNotes, setNewNotes] = useState('');

  // Edit session form state
  const [editForm, setEditForm] = useState<{
    subject: string;
    topic: string;
    durationMinutes: number;
    problemsSolved: number;
    focusScore: number;
  }>({
    subject: 'Physics',
    topic: '',
    durationMinutes: 60,
    problemsSolved: 10,
    focusScore: 8,
  });

  // Calculate 52 weeks (364 days ending today)
  const {
    weeks,
    monthHeaders,
    currentStreak,
    longestStreak,
    totalActiveDays,
    totalMinutes,
    totalProblems,
    dateMap
  } = useMemo(() => {
    const today = new Date();
    const startDate = subDays(today, 363); // 52 weeks = 364 days
    const intervalDays = eachDayOfInterval({ start: startDate, end: today });

    // Map logs by date key (yyyy-MM-dd)
    const map = new Map<string, {
      minutes: number;
      problems: number;
      count: number;
      subjects: Set<string>;
      logs: DayLogEntry[];
    }>();

    logs.forEach(log => {
      if (!log.date) return;
      const dateStr = log.date.substring(0, 10);
      const existing = map.get(dateStr) || {
        minutes: 0,
        problems: 0,
        count: 0,
        subjects: new Set<string>(),
        logs: []
      };

      const duration = Math.max(0, Number(log.durationMinutes)) || 0;
      const problems = Math.max(0, Number(log.problemsSolved)) || 0;
      existing.minutes += duration;
      existing.problems += problems;
      existing.count += 1;

      if (log.subject) {
        existing.subjects.add(log.subject.trim());
      }
      existing.logs.push(log);
      map.set(dateStr, existing);
    });

    let current = 0;
    let longest = 0;
    let tempStreak = 0;
    let activeDays = 0;
    let totalMins = 0;
    let totalProbs = 0;

    // Calculate streaks across chronological days
    intervalDays.forEach((day, idx) => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const entry = map.get(dateKey);

      if (entry && entry.minutes > 0) {
        tempStreak++;
        activeDays++;
        totalMins += entry.minutes;
        totalProbs += entry.problems;
        if (tempStreak > longest) longest = tempStreak;
      } else {
        tempStreak = 0;
      }

      // Check current streak from today backwards
      if (idx === intervalDays.length - 1) {
        let backIdx = intervalDays.length - 1;
        while (backIdx >= 0) {
          const dKey = format(intervalDays[backIdx], 'yyyy-MM-dd');
          const e = map.get(dKey);
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

    // Group interval days into 52 weeks (columns) of 7 days (rows)
    const weekColumns: Array<Array<{
      date: Date;
      dateKey: string;
      minutes: number;
      problems: number;
      level: number;
      subjects: string[];
      logCount: number;
    }>> = [];

    let currentWeek: Array<{
      date: Date;
      dateKey: string;
      minutes: number;
      problems: number;
      level: number;
      subjects: string[];
      logCount: number;
    }> = [];

    // Pad beginning if startDate is not the first day of week
    const startDayOfWeek = startDate.getDay(); // 0 = Sunday
    for (let i = 0; i < startDayOfWeek; i++) {
      const dummyDate = subDays(startDate, startDayOfWeek - i);
      currentWeek.push({
        date: dummyDate,
        dateKey: format(dummyDate, 'yyyy-MM-dd'),
        minutes: 0,
        problems: 0,
        level: -1, // out of range padding
        subjects: [],
        logCount: 0
      });
    }

    intervalDays.forEach(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const entry = map.get(dateKey);
      const minutes = entry?.minutes || 0;
      const problems = entry?.problems || 0;

      let level = 0;
      if (minutes >= 240) level = 4;      // 4+ hours (Mastery)
      else if (minutes >= 150) level = 3; // 2.5h - 4h (Deep Focus)
      else if (minutes >= 60) level = 2;  // 1h - 2.5h (Solid Session)
      else if (minutes > 0) level = 1;    // < 1h (Review / Quick)

      currentWeek.push({
        date: day,
        dateKey,
        minutes,
        problems,
        level,
        subjects: entry ? Array.from(entry.subjects) : [],
        logCount: entry ? entry.count : 0
      });

      if (currentWeek.length === 7) {
        weekColumns.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      // Pad end of last week
      while (currentWeek.length < 7) {
        const nextDate = addDays(currentWeek[currentWeek.length - 1].date, 1);
        currentWeek.push({
          date: nextDate,
          dateKey: format(nextDate, 'yyyy-MM-dd'),
          minutes: 0,
          problems: 0,
          level: -1,
          subjects: [],
          logCount: 0
        });
      }
      weekColumns.push(currentWeek);
    }

    // Generate Month Header labels corresponding to column index
    const months: Array<{ name: string; colIndex: number }> = [];
    let lastMonth = '';
    weekColumns.forEach((week, colIdx) => {
      const validDay = week.find(d => d.level >= 0);
      if (validDay) {
        const monthName = format(validDay.date, 'MMM');
        if (monthName !== lastMonth) {
          months.push({ name: monthName, colIndex: colIdx });
          lastMonth = monthName;
        }
      }
    });

    return {
      weeks: weekColumns,
      monthHeaders: months,
      currentStreak: current,
      longestStreak: longest,
      totalActiveDays: activeDays,
      totalMinutes: totalMins,
      totalProblems: totalProbs,
      dateMap: map
    };
  }, [logs]);

  // Color intensity mapping in dark palette
  const getLevelColor = (level: number, isSelected: boolean) => {
    if (level === -1) return 'opacity-0 pointer-events-none';
    
    let base = '';
    switch (level) {
      case 4:
        base = 'bg-indigo-500 border border-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.6)]';
        break;
      case 3:
        base = 'bg-indigo-600 border border-indigo-500';
        break;
      case 2:
        base = 'bg-indigo-800 border border-indigo-700/80';
        break;
      case 1:
        base = 'bg-indigo-950/90 border border-indigo-900/60';
        break;
      default:
        base = 'bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700';
    }

    if (isSelected) {
      return `${base} ring-2 ring-indigo-400 ring-offset-2 ring-offset-zinc-950 scale-110 z-10`;
    }
    return `${base} hover:ring-2 hover:ring-indigo-400/80 hover:scale-105 transition-all`;
  };

  const handleCellClick = (dateKey: string) => {
    setModalDate(dateKey);
    setIsAddingSession(false);
    setEditingLogId(null);
    if (onSelectDate) {
      onSelectDate(dateKey);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalDate) return;

    try {
      await addLog({
        date: modalDate,
        subject: newSubject.trim() || 'General',
        topic: newTopic.trim() || 'General Study',
        durationMinutes: Math.max(1, Math.round(Number(newDuration))) || 60,
        problemsSolved: Math.max(0, Math.round(Number(newProblems))) || 0,
        focusScore: Math.min(10, Math.max(1, Math.round(Number(newFocusScore)))) || 8,
        rawText: newNotes.trim() ? `${newNotes.trim()} (${newSubject} - ${newTopic})` : `Logged session for ${modalDate}`,
      });

      setIsAddingSession(false);
      setNewTopic('');
      setNewNotes('');
    } catch (err) {
      console.error('Failed to add study log from heatmap:', err);
    }
  };

  const handleStartEdit = (log: DayLogEntry) => {
    setEditingLogId(log.id);
    setEditForm({
      subject: log.subject || 'Physics',
      topic: log.topic || '',
      durationMinutes: Number(log.durationMinutes) || 60,
      problemsSolved: Number(log.problemsSolved) || 0,
      focusScore: Number(log.focusScore) || 8,
    });
  };

  const handleSaveEdit = async (logId: string) => {
    try {
      await updateLog(logId, {
        subject: editForm.subject.trim() || 'General',
        topic: editForm.topic.trim(),
        durationMinutes: Math.max(1, Math.round(Number(editForm.durationMinutes))) || 60,
        problemsSolved: Math.max(0, Math.round(Number(editForm.problemsSolved))) || 0,
        focusScore: Math.min(10, Math.max(1, Math.round(Number(editForm.focusScore)))) || 8,
      });
      setEditingLogId(null);
    } catch (err) {
      console.error('Failed to update study log from heatmap:', err);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (window.confirm('Are you sure you want to delete this study log entry?')) {
      try {
        await deleteLog(logId);
        if (editingLogId === logId) {
          setEditingLogId(null);
        }
      } catch (err) {
        console.error('Failed to delete study log from heatmap:', err);
      }
    }
  };

  const currentModalEntry = modalDate ? dateMap.get(modalDate) : null;
  const currentModalLogs = currentModalEntry?.logs || [];
  const modalFormattedDate = modalDate && isValid(parseISO(modalDate)) ? format(parseISO(modalDate), 'EEEE, MMMM dd, yyyy') : modalDate;

  return (
    <div className={`bg-zinc-900/70 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-6 shadow-xl space-y-5 ${className}`}>
      {/* Top Metrics Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-zinc-100">52-Week Study Velocity Heatmap</h3>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                Interactive
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Click any day cell to inspect, log sessions, or edit problem counts
            </p>
          </div>
        </div>

        {/* Dynamic Streak & Total Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-amber-300 font-semibold text-xs shadow-sm">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
            <span>{currentStreak} Day Streak</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/25 rounded-xl text-indigo-300 font-medium text-xs">
            <Trophy className="w-3.5 h-3.5 text-indigo-400" />
            <span>Best: <strong>{longestStreak}d</strong></span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-300 font-medium text-xs">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>{totalActiveDays} Active Days</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-800/80 border border-zinc-700/60 rounded-xl text-zinc-300 font-medium text-xs">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>{Math.round(totalMinutes / 60)}h ({totalProblems} Qs)</span>
          </div>
        </div>
      </div>

      {/* 52-Week Grid with Month Headers and Day of Week Labels */}
      <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-700">
        <div className="min-w-[780px] max-w-full">
          
          {/* Month Headers */}
          <div className="grid grid-flow-col auto-cols-[minmax(12px,1fr)] gap-1 text-[10px] text-zinc-400 font-medium mb-1.5 h-4 pl-7">
            {weeks.map((_, colIdx) => {
              const month = monthHeaders.find(m => m.colIndex === colIdx);
              return (
                <div key={`month-${colIdx}`} className="overflow-visible whitespace-nowrap">
                  {month ? month.name : ''}
                </div>
              );
            })}
          </div>

          {/* Days Grid with Row Labels */}
          <div className="flex gap-2">
            {/* Day of Week Labels */}
            <div className="flex flex-col justify-between text-[9px] text-zinc-400 font-mono select-none py-0.5 w-5 shrink-0">
              <span className="h-3 leading-3">Sun</span>
              <span className="h-3 leading-3">Tue</span>
              <span className="h-3 leading-3">Thu</span>
              <span className="h-3 leading-3">Sat</span>
            </div>

            {/* 52-Week Matrix */}
            <div className="grid grid-flow-col auto-cols-[minmax(12px,1fr)] gap-1 flex-1">
              {weeks.map((week, colIdx) => (
                <div key={`col-${colIdx}`} className="grid grid-rows-7 gap-1">
                  {week.map((day) => {
                    const isSelected = (externalSelectedDate === day.dateKey) || (modalDate === day.dateKey);
                    const hours = (day.minutes / 60).toFixed(1);
                    const tooltip = day.level >= 0
                      ? `${day.dateKey}: ${hours}h (${day.minutes}m), ${day.problems} problems\nSubjects: ${day.subjects.join(', ') || 'None'}\nClick to view/edit logs`
                      : '';

                    return (
                      <button
                        type="button"
                        key={day.dateKey}
                        onClick={() => day.level >= 0 && handleCellClick(day.dateKey)}
                        disabled={day.level === -1}
                        title={tooltip}
                        className={`w-3 h-3 rounded-sm cursor-pointer transition-all ${getLevelColor(day.level, isSelected)}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend and Active Selected Day Notice */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400 mt-4 pt-3 border-t border-zinc-800/60">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-400">Selected Date:</span>
              <span className="font-mono text-xs text-indigo-300 font-semibold px-2.5 py-0.5 bg-indigo-950/60 border border-indigo-800/60 rounded-md">
                {modalDate || externalSelectedDate || format(new Date(), 'yyyy-MM-dd')}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-zinc-400">Less</span>
              <div className="w-3 h-3 rounded-sm bg-zinc-900 border border-zinc-800" title="0 min" />
              <div className="w-3 h-3 rounded-sm bg-indigo-950 border border-indigo-900/60" title="1-59 min" />
              <div className="w-3 h-3 rounded-sm bg-indigo-800 border border-indigo-700" title="1h - 2.5h" />
              <div className="w-3 h-3 rounded-sm bg-indigo-600 border border-indigo-500" title="2.5h - 4h" />
              <div className="w-3 h-3 rounded-sm bg-indigo-500 border border-indigo-400 shadow-sm shadow-indigo-500/50" title="4h+ (Mastery)" />
              <span className="text-zinc-400">More (4h+)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Date Inspector & Editor Modal */}
      {modalDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-100">{modalFormattedDate}</h3>
                    <p className="text-xs text-zinc-400">
                      Detailed study activity and problem records
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalDate(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Day Summary Stats Banner */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3.5 text-center">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Total Time</span>
                <p className="text-xl font-bold text-indigo-400 mt-1">
                  {Math.floor((currentModalEntry?.minutes || 0) / 60)}h {(currentModalEntry?.minutes || 0) % 60}m
                </p>
              </div>

              <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3.5 text-center">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Problems Solved</span>
                <p className="text-xl font-bold text-emerald-400 mt-1">
                  {currentModalEntry?.problems || 0}
                </p>
              </div>

              <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3.5 text-center">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Sessions</span>
                <p className="text-xl font-bold text-purple-400 mt-1">
                  {currentModalLogs.length}
                </p>
              </div>
            </div>

            {/* Action Bar: Add Session Toggle */}
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Logged Sessions</h4>
              
              <button
                type="button"
                onClick={() => setIsAddingSession(!isAddingSession)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {isAddingSession ? 'Cancel' : 'Log New Session'}
              </button>
            </div>

            {/* Add Session Form */}
            {isAddingSession && (
              <form onSubmit={handleCreateSession} className="bg-zinc-950/90 border border-indigo-500/30 rounded-xl p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                  <span className="text-xs font-semibold text-indigo-300">Add Study Log for {modalDate}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">Subject</label>
                    <select
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Biology">Biology</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="General">General / Olympiad</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">Topic</label>
                    <input
                      type="text"
                      placeholder="e.g. Rotational Dynamics, Organic Reactions"
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">Duration (Mins)</label>
                    <input
                      type="number"
                      min="1"
                      value={newDuration}
                      onChange={(e) => setNewDuration(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">Problems Solved</label>
                    <input
                      type="number"
                      min="0"
                      value={newProblems}
                      onChange={(e) => setNewProblems(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">Focus Score (1-10)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newFocusScore}
                      onChange={(e) => setNewFocusScore(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">Notes / Key Takeaways</label>
                  <input
                    type="text"
                    placeholder="Optional session notes, difficult problems, or formulas reviewed"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingSession(false)}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md cursor-pointer"
                  >
                    Save Session
                  </button>
                </div>
              </form>
            )}

            {/* Sessions List */}
            <div className="space-y-3">
              {currentModalLogs.length === 0 ? (
                <div className="bg-zinc-950/60 border border-dashed border-zinc-800 rounded-xl p-8 text-center space-y-2">
                  <BookOpen className="w-7 h-7 text-zinc-600 mx-auto" />
                  <p className="text-sm text-zinc-400 font-medium">No study sessions recorded for this date.</p>
                  <p className="text-xs text-zinc-500">Click &ldquo;Log New Session&rdquo; above to add study hours or problems solved.</p>
                </div>
              ) : (
                currentModalLogs.map((log: any) => {
                  const isEditingThis = editingLogId === log.id;

                  return (
                    <div
                      key={log.id}
                      className="bg-zinc-950/80 border border-zinc-800/90 rounded-xl p-4 space-y-3 hover:border-zinc-700 transition-colors"
                    >
                      {isEditingThis ? (
                        /* In-line Edit Form */
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">Subject</label>
                              <input
                                type="text"
                                value={editForm.subject}
                                onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-100"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">Topic</label>
                              <input
                                type="text"
                                value={editForm.topic}
                                onChange={(e) => setEditForm({ ...editForm, topic: e.target.value })}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-100"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">Duration (mins)</label>
                              <input
                                type="number"
                                value={editForm.durationMinutes}
                                onChange={(e) => setEditForm({ ...editForm, durationMinutes: Number(e.target.value) })}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-100"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">Problems Solved</label>
                              <input
                                type="number"
                                value={editForm.problemsSolved}
                                onChange={(e) => setEditForm({ ...editForm, problemsSolved: Number(e.target.value) })}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-100"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">Focus Score</label>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={editForm.focusScore}
                                onChange={(e) => setEditForm({ ...editForm, focusScore: Number(e.target.value) })}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-100"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800/80">
                            <button
                              type="button"
                              onClick={() => setEditingLogId(null)}
                              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(log.id)}
                              className="flex items-center gap-1 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                            >
                              <Save className="w-3.5 h-3.5" />
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Normal Session Card View */
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                                {log.subject || 'General'}
                              </span>
                              {log.topic && (
                                <span className="text-xs font-medium text-zinc-200">
                                  {log.topic}
                                </span>
                              )}
                              {log.subtopic && (
                                <span className="text-[11px] text-zinc-500">
                                  • {log.subtopic}
                                </span>
                              )}
                            </div>

                            {log.rawText && (
                              <p className="text-xs text-zinc-400 leading-relaxed">
                                {log.rawText}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 pt-1">
                              <span className="flex items-center gap-1 text-indigo-400 font-medium">
                                <Clock className="w-3.5 h-3.5" />
                                {log.durationMinutes || 0} mins ({((log.durationMinutes || 0) / 60).toFixed(1)}h)
                              </span>

                              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {log.problemsSolved || 0} problems
                              </span>

                              {log.focusScore && (
                                <span className="text-zinc-500">
                                  Focus: <strong className="text-zinc-300">{log.focusScore}/10</strong>
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(log)}
                              className="p-1.5 text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                              title="Edit Log"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteLog(log.id)}
                              className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                              title="Delete Log"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setModalDate(null)}
                className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
