import React, { useState } from 'react';
import { LogInput } from './LogInput';
import { InsightsPanel } from './InsightsPanel';
import { StudyHeatmap } from './StudyHeatmap';
import { ExamCountdown } from './ExamCountdown';
import { useAppContext } from '../context/AppContext';
import { format } from 'date-fns';
import { Clock, BookOpen, CheckCircle2, Edit2, Check, X, Trash2 } from 'lucide-react';

export const Dashboard = () => {
  const { logs, updateLog, deleteLog } = useAppContext();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
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

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-10 bg-zinc-950">
      <div className="max-w-5xl mx-auto space-y-8">
        
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

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <p className="text-sm text-zinc-500 font-medium">Subjects</p>
              <p className="text-2xl font-bold text-zinc-100">{subjects.length}</p>
            </div>
          </div>
        </div>

        {/* 52-Week Study Streak Heatmap */}
        <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-6 shadow-xl">
          <StudyHeatmap logs={logs} />
        </div>

        {/* Dynamic Exam Countdowns & Velocity Forecast */}
        <ExamCountdown />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <InsightsPanel selectedDate={selectedDate} />
          </div>
          <div className="space-y-6">
            <LogInput selectedDate={selectedDate} />
            
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
                              <span className="text-xs text-zinc-500 font-medium bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">{log.durationMinutes}m</span>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                <button onClick={() => handleEditClick(log)} className="p-1 text-zinc-500 hover:text-indigo-400 transition-colors">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDeleteLog(log.id)} className="p-1 text-zinc-500 hover:text-red-400 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
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

      </div>
    </div>
  );
};
