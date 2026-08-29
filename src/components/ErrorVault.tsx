import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { getNextReviewDate } from '../utils/sm2Engine';
import { 
  Lock, Plus, CheckCircle2, RotateCcw, AlertTriangle, 
  Brain, Clock, Hash, Zap
} from 'lucide-react';

export type ErrorCategory = 
  | 'Conceptual Gap' 
  | 'Calculation Slip' 
  | 'Misread Constraint' 
  | 'Time Trap' 
  | 'Formula Error';

export interface Mistake {
  id: string;
  subject: string;
  topic: string;
  problemStatement: string;
  category: ErrorCategory;
  notes: string;
  repetitionCount: number;
  nextReview: string;
  status: 'LEARNING' | 'MASTERED';
  createdAt: string;
}

export const ErrorVault = () => {
  const { user } = useAppContext();
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Form state
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [category, setCategory] = useState<ErrorCategory>('Conceptual Gap');
  const [notes, setNotes] = useState('');
  
  // Filter state
  const [filter, setFilter] = useState<'All' | 'Due Today' | 'By Category' | 'By Subject'>('All');
  
  // Load data
  useEffect(() => {
    const data = localStorage.getItem('savantix_error_vault');
    if (data) {
      try {
        setMistakes(JSON.parse(data));
      } catch (e) {
        console.error('Failed to parse error vault data', e);
      }
    }
  }, []);
  
  // Save data
  useEffect(() => {
    localStorage.setItem('savantix_error_vault', JSON.stringify(mistakes));
  }, [mistakes]);
  
  const today = new Date().toISOString().split('T')[0];
  
  const handleAddMistake = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !topic || !problemStatement) return;
    
    const newMistake: Mistake = {
      id: crypto.randomUUID(),
      subject,
      topic,
      problemStatement,
      category,
      notes,
      repetitionCount: 0,
      nextReview: getNextReviewDate(0), // +3 days
      status: 'LEARNING',
      createdAt: new Date().toISOString()
    };
    
    setMistakes([newMistake, ...mistakes]);
    setIsFormOpen(false);
    
    // Reset form
    setSubject('');
    setTopic('');
    setProblemStatement('');
    setCategory('Conceptual Gap');
    setNotes('');
  };
  
  const handleResolve = (id: string) => {
    setMistakes(mistakes.map(m => {
      if (m.id !== id) return m;
      
      const newRepetitionCount = m.repetitionCount + 1;
      const newStatus = newRepetitionCount >= 3 ? 'MASTERED' : 'LEARNING';
      
      return {
        ...m,
        repetitionCount: newRepetitionCount,
        nextReview: newStatus === 'MASTERED' ? m.nextReview : getNextReviewDate(newRepetitionCount),
        status: newStatus
      };
    }));
  };
  
  const handlePracticeAgain = (problemText: string) => {
    const event = new CustomEvent('savantix_stemsolver_preload', { detail: { problemText } });
    window.dispatchEvent(event);
  };
  
  const getCategoryColor = (cat: ErrorCategory) => {
    switch(cat) {
      case 'Conceptual Gap': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Calculation Slip': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Misread Constraint': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Time Trap': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'Formula Error': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    }
  };
  
  // Stats
  const totalMistakes = mistakes.length;
  const masteredCount = mistakes.filter(m => m.status === 'MASTERED').length;
  const dueTodayCount = mistakes.filter(m => m.status !== 'MASTERED' && m.nextReview <= today).length;
  const overdueCount = mistakes.filter(m => m.status !== 'MASTERED' && m.nextReview < today).length;
  
  // Filtered mistakes
  const filteredMistakes = mistakes.filter(m => {
    if (filter === 'Due Today') return m.status !== 'MASTERED' && m.nextReview <= today;
    return true; // Simple filter for now, would expand for Category/Subject grouping
  });

  return (
    <div className="p-6 max-w-6xl mx-auto flex flex-col h-full gap-6">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-3">
            <Lock className="w-8 h-8 text-indigo-400" />
            Error Vault
          </h1>
          <p className="text-zinc-400 mt-2">Active Trap & Mistake Database (SM-2 Spaced Repetition)</p>
        </div>
        
        <button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors font-medium shadow-lg shadow-indigo-600/20"
        >
          {isFormOpen ? <Lock className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isFormOpen ? 'Close Vault' : 'Log New Mistake'}
        </button>
      </header>
      
      {/* Stats Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80 backdrop-blur-sm">
          <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">Total Mistakes</div>
          <div className="text-2xl font-bold text-zinc-100">{totalMistakes}</div>
        </div>
        <div className="bg-emerald-900/20 p-4 rounded-xl border border-emerald-500/20 backdrop-blur-sm">
          <div className="text-emerald-500/70 text-xs font-semibold uppercase tracking-wider mb-1">Mastered</div>
          <div className="text-2xl font-bold text-emerald-400">{masteredCount}</div>
        </div>
        <div className="bg-amber-900/20 p-4 rounded-xl border border-amber-500/20 backdrop-blur-sm">
          <div className="text-amber-500/70 text-xs font-semibold uppercase tracking-wider mb-1">Due Today</div>
          <div className="text-2xl font-bold text-amber-400">{dueTodayCount}</div>
        </div>
        <div className="bg-red-900/20 p-4 rounded-xl border border-red-500/20 backdrop-blur-sm">
          <div className="text-red-500/70 text-xs font-semibold uppercase tracking-wider mb-1">Overdue</div>
          <div className="text-2xl font-bold text-red-400">{overdueCount}</div>
        </div>
      </div>
      
      {/* Form */}
      {isFormOpen && (
        <form onSubmit={handleAddMistake} className="bg-zinc-900/80 border border-zinc-800/80 p-5 rounded-2xl flex flex-col gap-4 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-lg font-bold text-zinc-200 border-b border-zinc-800 pb-2">Log a New Trap</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Subject</label>
              <input required value={subject} onChange={e => setSubject(e.target.value)} type="text" placeholder="e.g. Calculus" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Topic</label>
              <input required value={topic} onChange={e => setTopic(e.target.value)} type="text" placeholder="e.g. Integration by Parts" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Error Category</label>
              <select value={category} onChange={e => setCategory(e.target.value as ErrorCategory)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 focus:outline-none appearance-none">
                <option value="Conceptual Gap">Conceptual Gap</option>
                <option value="Calculation Slip">Calculation Slip</option>
                <option value="Misread Constraint">Misread Constraint</option>
                <option value="Time Trap">Time Trap</option>
                <option value="Formula Error">Formula Error</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Problem Statement</label>
            <textarea required value={problemStatement} onChange={e => setProblemStatement(e.target.value)} rows={3} placeholder="What was the exact problem?" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 focus:outline-none resize-none" />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Notes / Why I got it wrong</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Explain the trap to your future self..." className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 focus:outline-none resize-none" />
          </div>
          
          <div className="flex justify-end pt-2">
            <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors">
              Add to Vault
            </button>
          </div>
        </form>
      )}
      
      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {(['All', 'Due Today', 'By Category', 'By Subject'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filter === f 
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' 
                : 'bg-zinc-900/50 text-zinc-400 border border-transparent hover:bg-zinc-800/50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      
      {/* Mistake List */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-12">
        {filteredMistakes.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-zinc-500 bg-zinc-900/30 rounded-2xl border border-zinc-800/50 border-dashed">
            <Lock className="w-8 h-8 mb-3 opacity-50" />
            <p>Vault is empty. No mistakes logged.</p>
          </div>
        ) : (
          filteredMistakes.map(mistake => {
            const isDue = mistake.status !== 'MASTERED' && mistake.nextReview <= today;
            
            return (
              <div key={mistake.id} className="bg-zinc-900/60 border border-zinc-800/80 p-5 rounded-2xl backdrop-blur-sm hover:border-zinc-700 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getCategoryColor(mistake.category)}`}>
                        {mistake.category}
                      </span>
                      <span className="text-xs text-zinc-400 flex items-center gap-1 bg-zinc-800/50 px-2 py-0.5 rounded border border-zinc-700/50">
                        <Hash className="w-3 h-3" /> {mistake.subject}
                      </span>
                      <span className="text-xs text-zinc-400 bg-zinc-800/50 px-2 py-0.5 rounded border border-zinc-700/50">
                        {mistake.topic}
                      </span>
                      
                      {mistake.status === 'MASTERED' ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Mastered
                        </span>
                      ) : isDue ? (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded uppercase flex items-center gap-1">
                          <Zap className="w-3 h-3" /> Due Now
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded uppercase flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Due {mistake.nextReview}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handlePracticeAgain(mistake.problemStatement)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold transition-colors border border-zinc-700"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Practice Again
                    </button>
                    {mistake.status !== 'MASTERED' && (
                      <button
                        onClick={() => handleResolve(mistake.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Resolved
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 mb-3 text-sm text-zinc-300 whitespace-pre-wrap font-mono">
                  {mistake.problemStatement}
                </div>
                
                {mistake.notes && (
                  <div className="flex gap-3 items-start bg-indigo-950/20 p-3 rounded-lg border border-indigo-500/10">
                    <Brain className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-indigo-200/80">{mistake.notes}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
