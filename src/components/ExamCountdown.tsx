import React, { useState, useMemo } from 'react';
import { Calendar, Target, Clock, AlertCircle, Plus, Trash2, CheckCircle2, ChevronRight, Edit2 } from 'lucide-react';
import { differenceInDays, parseISO, format } from 'date-fns';
import { useAppContext } from '../context/AppContext';

interface ExamTarget {
  id: string;
  name: string;
  targetDate: string;
  targetHours: number;
  completedHours: number;
  category: 'Physics' | 'Math' | 'Chemistry' | 'General';
}

const DEFAULT_EXAMS: ExamTarget[] = [
  { id: 'exam-1', name: 'JEE Advanced 2026', targetDate: '2026-05-24', targetHours: 1200, completedHours: 420, category: 'General' },
  { id: 'exam-2', name: 'IPhO (International Physics Olympiad)', targetDate: '2026-07-12', targetHours: 800, completedHours: 310, category: 'Physics' },
  { id: 'exam-3', name: 'NSEP (National Standard Exam in Physics)', targetDate: '2026-11-23', targetHours: 400, completedHours: 180, category: 'Physics' },
  { id: 'exam-4', name: 'MIT SAT / Subject Test', targetDate: '2026-10-05', targetHours: 300, completedHours: 140, category: 'General' }
];

export const ExamCountdown: React.FC = () => {
  const { user } = useAppContext();
  
  const getInitialExams = () => {
    const saved = localStorage.getItem('savantix_exam_targets');
    if (saved) return JSON.parse(saved);
    
    if (user?.email === 'debanjan8686@gmail.com' || user?.email === 'partofcosmmos@gmail.com') {
      return DEFAULT_EXAMS;
    }
    return [{ id: 'exam-1', name: 'JEE Advanced 2026', targetDate: '2026-05-24', targetHours: 1200, completedHours: 420, category: 'General' }];
  };

  const [exams, setExams] = useState<ExamTarget[]>(getInitialExams());
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [targetHours, setTargetHours] = useState('');
  const [category, setCategory] = useState<ExamTarget['category']>('General');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const saveExams = (newExams: ExamTarget[]) => {
    setExams(newExams);
    localStorage.setItem('savantix_exam_targets', JSON.stringify(newExams));
    // Persistence to Firestore could be added here if needed, via AppContext
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newExam: ExamTarget = {
      id: 'exam-' + Date.now(),
      name,
      targetDate,
      targetHours: Number(targetHours),
      completedHours: 0,
      category
    };
    saveExams([...exams, newExam]);
    setIsAdding(false);
    setName('');
    setTargetDate('');
    setTargetHours('');
  };

  const handleEditClick = (exam: ExamTarget) => {
    setIsEditing(exam.id);
    setEditForm({ ...exam });
  };

  const handleSaveEdit = (id: string) => {
    const updated = exams.map(e => e.id === id ? { ...e, ...editForm } : e);
    saveExams(updated);
    setIsEditing(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this exam target?")) {
      saveExams(exams.filter(e => e.id !== id));
    }
  };

  return (
    <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
            <Target className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Exam Countdowns & Velocity Forecast</h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">Milestone tickers & study pace tracking</p>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-medium transition-all shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          {isAdding ? 'Close' : 'Add Target'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-zinc-950/80 border border-zinc-800/80 p-5 rounded-2xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Target Exam Name</label>
              <input
                type="text"
                placeholder="e.g. JEE Advanced 2026"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Target Exam Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
                className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Estimated Prep Hours</label>
              <input
                type="number"
                placeholder="e.g. 1000"
                value={targetHours}
                onChange={e => setTargetHours(e.target.value)}
                className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
              >
                <option value="General">General / All Subjects</option>
                <option value="Physics">Physics Olympiad</option>
                <option value="Math">Math Olympiad</option>
                <option value="Chemistry">Chemistry</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-lg"
            >
              Save Milestone
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exams.length === 0 ? (
          <div className="col-span-full border-2 border-dashed border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-3">
             <Target className="w-8 h-8 text-zinc-700" />
             <p className="text-sm text-zinc-500">No exam targets set.</p>
             <button 
               onClick={() => setIsAdding(true)}
               className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
             >
               <Plus className="w-3.5 h-3.5" />
               Add Target
             </button>
          </div>
        ) : (
          exams.map(exam => {
            const daysLeft = Math.max(0, differenceInDays(parseISO(exam.targetDate), new Date()));
            const hoursRemaining = Math.max(0, exam.targetHours - exam.completedHours);
            const requiredHoursPerDay = daysLeft > 0 ? (hoursRemaining / daysLeft).toFixed(1) : '0.0';
            const progressPercent = Math.min(100, Math.round((exam.completedHours / exam.targetHours) * 100));
  
            return (
              <div
                key={exam.id}
                className="bg-zinc-950/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-5 space-y-4 relative group hover:border-zinc-700 transition-all shadow-md"
              >
                {isEditing === exam.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={e => setEditForm({...editForm, name: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100"
                    />
                    <input
                      type="date"
                      value={editForm.targetDate}
                      onChange={e => setEditForm({...editForm, targetDate: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100"
                    />
                    <div className="flex gap-2">
                       <button onClick={() => setIsEditing(null)} className="flex-1 px-3 py-2 bg-zinc-800 rounded-lg text-xs text-zinc-300">Cancel</button>
                       <button onClick={() => handleSaveEdit(exam.id)} className="flex-1 px-3 py-2 bg-indigo-600 rounded-lg text-xs text-white">Save</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-zinc-200">{exam.name}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{format(parseISO(exam.targetDate), 'MMM dd, yyyy')}</span>
                          <span className="px-2 py-0.5 text-[10px] bg-zinc-900 text-zinc-400 rounded-full border border-zinc-800">
                            {exam.category}
                          </span>
                        </div>
                      </div>
  
                      <div className="text-right">
                        <div className="text-2xl font-bold font-mono text-indigo-400">{daysLeft}d</div>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Remaining</span>
                      </div>
                    </div>
  
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] text-zinc-400">
                        <span>Progress</span>
                        <span className="font-semibold text-indigo-300">{progressPercent}%</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
  
                    <div className="flex items-center justify-between text-[11px] pt-2 text-zinc-400 border-t border-zinc-800/60">
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <Clock className="w-3.5 h-3.5" />
                        Pace: <strong>{requiredHoursPerDay} hrs/day</strong>
                      </span>
  
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEditClick(exam)}
                          className="text-zinc-400 hover:text-indigo-400 p-1.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
                          title="Edit Target"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(exam.id)}
                          className="text-zinc-400 hover:text-red-400 p-1.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
                          title="Delete Target"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
