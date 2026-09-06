import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Circle, Plus, Trash2, Zap, Target, BookOpen, Clock, 
  RotateCcw, Sparkles, AlertTriangle, ArrowRight, ShieldCheck, Flame
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import clsx from 'clsx';

export interface AgendaItem {
  id: string;
  title: string;
  subject: string;
  targetMinutes: number;
  targetProblems: number;
  completed: boolean;
  logged?: boolean;
}

const DEFAULT_AGENDA: Record<string, AgendaItem[]> = {
  default: [
    {
      id: 'ag-1',
      title: 'Irodov Mechanics: Angular Momentum & Conservation Laws',
      subject: 'Physics',
      targetMinutes: 60,
      targetProblems: 15,
      completed: false
    },
    {
      id: 'ag-2',
      title: 'Calculus: Integration by Reduction & Definite Integrals',
      subject: 'Mathematics',
      targetMinutes: 60,
      targetProblems: 20,
      completed: false
    },
    {
      id: 'ag-3',
      title: 'Organic Chemistry: Reaction Mechanisms & Aromaticity',
      subject: 'Chemistry',
      targetMinutes: 45,
      targetProblems: 15,
      completed: false
    }
  ]
};

const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Physics: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  Chemistry: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  Mathematics: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  Biology: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  'Computer Science': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  General: { bg: 'bg-zinc-800/40', text: 'text-zinc-300', border: 'border-zinc-700/50' }
};

export const DailyAgendaDesk: React.FC<{ selectedDate: string }> = ({ selectedDate }) => {
  const { addLog } = useAppContext();
  
  // 1. Daily Agenda State
  const [agenda, setAgenda] = useState<AgendaItem[]>(() => {
    try {
      const saved = localStorage.getItem(`savantix_agenda_${selectedDate}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_AGENDA.default;
  });

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState('Physics');
  const [newTaskMins, setNewTaskMins] = useState(60);
  const [newTaskProbs, setNewTaskProbs] = useState(15);
  const [isAddingOpen, setIsAddingOpen] = useState(false);

  // 2. Desk Problem Tally Counter
  const [deskCounter, setDeskCounter] = useState(() => {
    try {
      const saved = localStorage.getItem(`savantix_desk_counter_${selectedDate}`);
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [logSuccessMsg, setLogSuccessMsg] = useState<string | null>(null);

  // Sync agenda to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`savantix_agenda_${selectedDate}`, JSON.stringify(agenda));
    } catch {}
  }, [agenda, selectedDate]);

  // Sync desk counter
  useEffect(() => {
    try {
      localStorage.setItem(`savantix_desk_counter_${selectedDate}`, deskCounter.toString());
    } catch {}
  }, [deskCounter, selectedDate]);

  // Load when date changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`savantix_agenda_${selectedDate}`);
      setAgenda(saved ? JSON.parse(saved) : DEFAULT_AGENDA.default);
      const savedCounter = localStorage.getItem(`savantix_desk_counter_${selectedDate}`);
      setDeskCounter(savedCounter ? parseInt(savedCounter, 10) : 0);
    } catch {}
  }, [selectedDate]);

  const toggleTask = (id: string) => {
    setAgenda(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const deleteTask = (id: string) => {
    setAgenda(prev => prev.filter(item => item.id !== id));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newItem: AgendaItem = {
      id: `ag-${Date.now()}`,
      title: newTaskTitle.trim(),
      subject: newTaskSubject,
      targetMinutes: Number(newTaskMins) || 45,
      targetProblems: Number(newTaskProbs) || 10,
      completed: false
    };

    setAgenda(prev => [...prev, newItem]);
    setNewTaskTitle('');
    setIsAddingOpen(false);
  };

  const handleLogTask = async (item: AgendaItem) => {
    try {
      await addLog({
        date: selectedDate,
        subject: item.subject,
        topics: [item.title],
        durationMinutes: item.targetMinutes,
        problemsSolved: item.targetProblems,
        efficiencyScore: 8,
        focusScore: 9,
        notes: `Completed planned target: ${item.title}`
      });

      setAgenda(prev => prev.map(t => t.id === item.id ? { ...t, completed: true, logged: true } : t));
      setLogSuccessMsg(`✅ Logged "${item.title}" (+${item.targetMinutes}m, ${item.targetProblems} Qs)!`);
      setTimeout(() => setLogSuccessMsg(null), 3500);
    } catch (err: any) {
      setLogSuccessMsg(`⚠️ Notice: ${err?.message || 'Logged locally'}`);
      setTimeout(() => setLogSuccessMsg(null), 3000);
    }
  };

  const handleLogDeskCounter = async () => {
    if (deskCounter <= 0) return;
    try {
      await addLog({
        date: selectedDate,
        subject: 'General STEM',
        topics: ['Desk Problem-Solving Session'],
        durationMinutes: Math.round(deskCounter * 3.5),
        problemsSolved: deskCounter,
        efficiencyScore: 8,
        focusScore: 8,
        notes: `Rapid problem-solving tally logged from live desk counter.`
      });

      setLogSuccessMsg(`🎯 Logged ${deskCounter} solved problems!`);
      setTimeout(() => setLogSuccessMsg(null), 3500);
    } catch (err: any) {
      setLogSuccessMsg(`⚠️ Notice: ${err?.message || 'Logged locally'}`);
      setTimeout(() => setLogSuccessMsg(null), 3000);
    }
  };

  const completedCount = agenda.filter(i => i.completed).length;
  const totalCount = agenda.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. Daily Study Agenda Checklist */}
      <div className="lg:col-span-2 bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-100 tracking-tight">Today's Study Agenda & Targets</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-full font-mono">
                  {completedCount}/{totalCount} Done ({progressPct}%)
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Target milestones for {selectedDate} • Check off as you solve
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddingOpen(!isAddingOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-md shadow-indigo-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Target</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-950/80 rounded-full h-2 border border-zinc-800/80 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-emerald-400 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {logSuccessMsg && (
          <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-medium animate-fadeIn">
            {logSuccessMsg}
          </div>
        )}

        {/* Add Target Form Modal / Expansion */}
        {isAddingOpen && (
          <form onSubmit={handleAddTask} className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-3 animate-fadeIn">
            <div className="text-xs font-semibold text-zinc-300">New Study Target</div>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="e.g., HC Verma Electrostatics Q 1-20 or Calculus Limits revision..."
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-lg text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              autoFocus
            />

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-zinc-400 font-medium">Subject</label>
                <select
                  value={newTaskSubject}
                  onChange={(e) => setNewTaskSubject(e.target.value)}
                  className="w-full mt-1 px-2 py-1.5 bg-zinc-900 border border-zinc-700/80 rounded-lg text-xs text-zinc-200"
                >
                  <option value="Physics">Physics</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="Computer Science">CS</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 font-medium">Target Minutes</label>
                <input
                  type="number"
                  value={newTaskMins}
                  onChange={(e) => setNewTaskMins(parseInt(e.target.value) || 0)}
                  className="w-full mt-1 px-2 py-1.5 bg-zinc-900 border border-zinc-700/80 rounded-lg text-xs text-zinc-200"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 font-medium">Target Problems</label>
                <input
                  type="number"
                  value={newTaskProbs}
                  onChange={(e) => setNewTaskProbs(parseInt(e.target.value) || 0)}
                  className="w-full mt-1 px-2 py-1.5 bg-zinc-900 border border-zinc-700/80 rounded-lg text-xs text-zinc-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingOpen(false)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Save Target
              </button>
            </div>
          </form>
        )}

        {/* Target Items List */}
        <div className="space-y-2.5">
          {agenda.length === 0 ? (
            <div className="py-8 text-center text-zinc-500 text-xs">
              No targets planned yet. Click "+ Add Target" to plan your session!
            </div>
          ) : (
            agenda.map((item) => {
              const subStyle = SUBJECT_COLORS[item.subject] || SUBJECT_COLORS.General;
              return (
                <div
                  key={item.id}
                  className={clsx(
                    "flex items-center justify-between p-3 rounded-xl border transition-all duration-200 group",
                    item.completed 
                      ? "bg-zinc-950/40 border-zinc-800/40 opacity-75" 
                      : "bg-zinc-950/80 border-zinc-800/80 hover:border-zinc-700"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                    <button
                      type="button"
                      onClick={() => toggleTask(item.id)}
                      className="text-zinc-500 hover:text-indigo-400 cursor-pointer shrink-0 transition-colors"
                      title={item.completed ? "Mark incomplete" : "Mark completed"}
                    >
                      {item.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-zinc-600 hover:text-indigo-400" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={clsx(
                          "px-2 py-0.5 rounded text-[10px] font-semibold border",
                          subStyle.bg, subStyle.text, subStyle.border
                        )}>
                          {item.subject}
                        </span>
                        <span className="text-[11px] font-mono text-zinc-500">
                          {item.targetMinutes}m • {item.targetProblems} Qs
                        </span>
                      </div>
                      <p className={clsx(
                        "text-xs font-medium text-zinc-200 mt-1 truncate",
                        item.completed && "line-through text-zinc-500"
                      )}>
                        {item.title}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!item.logged ? (
                      <button
                        type="button"
                        onClick={() => handleLogTask(item)}
                        className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer"
                        title="Log this study session directly into today's records"
                      >
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span>Log Session</span>
                      </button>
                    ) : (
                      <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Logged</span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => deleteTask(item.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                      title="Delete target"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Live Desk Problem Tally Counter Widget */}
      <div className="bg-gradient-to-b from-zinc-900/90 via-zinc-900/70 to-zinc-950 border border-zinc-800/90 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                <Flame className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-100">Live Desk Problem Tally</h3>
                <p className="text-[11px] text-zinc-400">Real-time counter for textbook practice</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDeskCounter(0)}
              className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 rounded-lg transition-colors cursor-pointer"
              title="Reset counter to 0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Large Counter Display */}
          <div className="my-6 text-center">
            <div className="text-5xl font-extrabold font-mono text-zinc-100 tracking-tight">
              {deskCounter}
            </div>
            <p className="text-xs text-zinc-500 mt-1 uppercase font-semibold tracking-wider">
              Problems Solved This Sitting
            </p>
            {deskCounter > 0 && (
              <p className="text-[11px] text-emerald-400 mt-1 font-mono">
                ≈ {Math.round(deskCounter * 3.5)} mins study velocity
              </p>
            )}
          </div>

          {/* Quick Counter Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setDeskCounter(prev => Math.max(0, prev - 1))}
              className="py-2.5 bg-zinc-950/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xl text-xs font-bold transition-all cursor-pointer font-mono"
            >
              -1
            </button>
            <button
              type="button"
              onClick={() => setDeskCounter(prev => prev + 1)}
              className="py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold transition-all cursor-pointer font-mono shadow-sm"
            >
              +1 Solved
            </button>
            <button
              type="button"
              onClick={() => setDeskCounter(prev => prev + 5)}
              className="py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 rounded-xl text-xs font-bold transition-all cursor-pointer font-mono shadow-sm"
            >
              +5 Burst
            </button>
          </div>
        </div>

        {/* Save Counter as Log Button */}
        <button
          type="button"
          onClick={handleLogDeskCounter}
          disabled={deskCounter <= 0}
          className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed border border-zinc-700/80 text-zinc-100 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Commit Counter to Daily Log</span>
        </button>
      </div>

    </div>
  );
};
