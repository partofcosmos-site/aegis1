import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { getNextReviewDate } from '../utils/sm2Engine';
import { 
  Lock, Plus, CheckCircle2, RotateCcw, AlertTriangle, 
  Brain, Clock, Hash, Zap, Trash2, Edit3, Search, 
  Download, Upload, Sparkles, X, Eye, EyeOff, 
  RefreshCw, Filter
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

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
  lastReviewedAt?: string;
}

// 5 Curated Benchmark Competitive Traps (JEE Advanced / IPhO / Olympiad)
const BENCHMARK_TRAPS: Omit<Mistake, 'id' | 'createdAt'>[] = [
  {
    subject: 'Physics',
    topic: 'Rotational Dynamics & Non-Inertial Frames',
    category: 'Conceptual Gap',
    problemStatement: `A uniform solid cylinder of mass $M$ and radius $R$ rests on a flat cart accelerating horizontally with $a_0$. Find the magnitude and direction of the static friction force $f_s$ on the cylinder if it rolls without slipping on the cart.`,
    notes: `**TRAP:** Students instinctively assume static friction $f_s$ opposes the cart's acceleration $a_0$. Writing torque about center of mass: $\\tau_{\\text{cm}} = f_s R = I_{\\text{cm}} \\alpha$. In the cart's frame, the pseudo-force is $M a_0$ at the CM, and rolling without slipping demands $a_{\\text{rel}} = R\\alpha$. This yields $f_s = \\frac{1}{3} M a_0$ directed **along** the cart's acceleration! Always write equations about the contact point or explicitly apply pseudo-forces.`,
    repetitionCount: 0,
    nextReview: new Date().toISOString().split('T')[0],
    status: 'LEARNING'
  },
  {
    subject: 'Mathematics',
    topic: 'Definite Integrals & Discontinuities',
    category: 'Misread Constraint',
    problemStatement: `Evaluate the definite integral:
$$\\int_{-1}^{1} \\frac{1}{x^2} \\, dx$$`,
    notes: `**TRAP:** Naively applying the Fundamental Theorem of Calculus: $\\left[-\\frac{1}{x}\\right]_{-1}^1 = (-1) - (1) = -2$, which is absurd for a strictly positive integrand $\\frac{1}{x^2} > 0$! The integrand has a non-integrable vertical singularity at $x = 0$. $\\lim_{\\epsilon \\to 0^+} \\int_\\epsilon^1 \\frac{dx}{x^2} = \\infty$. The integral **diverges**. Always verify continuity on $[a, b]$ before blind antiderivative evaluation.`,
    repetitionCount: 0,
    nextReview: new Date().toISOString().split('T')[0],
    status: 'LEARNING'
  },
  {
    subject: 'Chemistry',
    topic: 'Ionic Equilibrium & Common Ion Effect',
    category: 'Formula Error',
    problemStatement: `Calculate the molar solubility $S$ of silver chromate $\\text{Ag}_2\\text{CrO}_4$ in a $0.10\\,\\text{M}$ solution of $\\text{AgNO}_3$, given $K_{sp}(\\text{Ag}_2\\text{CrO}_4) = 1.1 \\times 10^{-12}$.`,
    notes: `**TRAP:** For $\\text{Ag}_2\\text{CrO}_4 \\rightleftharpoons 2\\text{Ag}^+ + \\text{CrO}_4^{2-}$, the solubility product expression is $K_{sp} = [\\text{Ag}^+]^2 [\\text{CrO}_4^{2-}]$. Here $[\\text{Ag}^+] \\approx 0.10\\,\\text{M}$ (from $\\text{AgNO}_3$) and $[\\text{CrO}_4^{2-}] = S$. Thus $S = \\frac{K_{sp}}{(0.10)^2} = 1.1 \\times 10^{-10}\\,\\text{M}$. The common blunder is forgetting to square $(0.10)^2$ or writing $[\\text{Ag}^+] = 2 \\times 0.10$.`,
    repetitionCount: 0,
    nextReview: new Date().toISOString().split('T')[0],
    status: 'LEARNING'
  },
  {
    subject: 'Physics',
    topic: 'Electrostatics & Dielectric Energy',
    category: 'Calculation Slip',
    problemStatement: `A parallel-plate capacitor of capacitance $C_0$ is connected to a battery of voltage $V$. A dielectric slab of constant $\\kappa = 3$ is slowly inserted between the plates while remaining connected to the battery. What is the work done by the battery $W_b$ and the change in stored electrostatic energy $\\Delta U$?`,
    notes: `**TRAP:** Final capacitance is $C = 3C_0$. Initial energy $U_i = \\frac{1}{2} C_0 V^2$, final $U_f = \\frac{1}{2} (3C_0) V^2$, so $\\Delta U = C_0 V^2$. Charge increases by $\\Delta Q = (3C_0 - C_0)V = 2 C_0 V$. Work done by the battery is $W_b = \\Delta Q \\cdot V = 2 C_0 V^2$. Note that $W_b = 2 \\Delta U$! Half the energy supplied by the battery is stored as electrostatic field energy, and the other half does mechanical work pulling the dielectric in. Never confuse $W_{\\text{battery}}$ with $\\Delta U$.`,
    repetitionCount: 0,
    nextReview: new Date().toISOString().split('T')[0],
    status: 'LEARNING'
  },
  {
    subject: 'Mathematics',
    topic: 'Limits & Maclaurin Series',
    category: 'Time Trap',
    problemStatement: `Evaluate:
$$\\lim_{x \\to 0} \\frac{\\sin x - x + \\frac{x^3}{6}}{x^5}$$`,
    notes: `**TRAP:** Attempting repeated L'Hôpital's rule requires differentiating 5 successive times, taking 4+ minutes under exam pressure with severe risk of arithmetic slips. Using Maclaurin series expansion directly: $\\sin x = x - \\frac{x^3}{3!} + \\frac{x^5}{5!} - \\mathcal{O}(x^7)$. The numerator is exactly $\\frac{x^5}{120} - \\mathcal{O}(x^7)$. Dividing by $x^5$ yields $\\frac{1}{120}$ in under 15 seconds.`,
    repetitionCount: 0,
    nextReview: new Date().toISOString().split('T')[0],
    status: 'LEARNING'
  }
];

const PRESET_SUBJECTS = ['Physics', 'Mathematics', 'Chemistry', 'General STEM'];

export const ErrorVault: React.FC = () => {
  const { user } = useAppContext();
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMistakeId, setEditingMistakeId] = useState<string | null>(null);
  
  // Form state
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [category, setCategory] = useState<ErrorCategory>('Conceptual Gap');
  const [notes, setNotes] = useState('');
  const [showFormPreview, setShowFormPreview] = useState(false);
  
  // Filter state
  const [filter, setFilter] = useState<'All' | 'Due Today' | 'Overdue' | 'By Category' | 'By Subject' | 'Mastered'>('All');
  const [selectedCategory, setSelectedCategory] = useState<ErrorCategory | 'All'>('All');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [rawViewIds, setRawViewIds] = useState<Set<string>>(new Set());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const today = new Date().toISOString().split('T')[0];

  // Storage key with per-user isolation and guest fallback
  const storageKey = user?.uid ? `savantix_error_vault_${user.uid}` : 'savantix_error_vault';

  // Load data
  useEffect(() => {
    let raw = localStorage.getItem(storageKey);
    if (!raw && storageKey !== 'savantix_error_vault') {
      raw = localStorage.getItem('savantix_error_vault');
    }
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setMistakes(parsed);
        }
      } catch (e) {
        console.error('Failed to parse error vault data', e);
      }
    }
  }, [storageKey]);

  // Save data
  useEffect(() => {
    if (mistakes.length > 0 || localStorage.getItem(storageKey)) {
      localStorage.setItem(storageKey, JSON.stringify(mistakes));
      // Keep legacy key synced for guest/offline resilience
      localStorage.setItem('savantix_error_vault', JSON.stringify(mistakes));
    }
  }, [mistakes, storageKey]);

  const resetForm = () => {
    setSubject('');
    setTopic('');
    setProblemStatement('');
    setCategory('Conceptual Gap');
    setNotes('');
    setEditingMistakeId(null);
    setShowFormPreview(false);
    setIsFormOpen(false);
  };

  const handleOpenEdit = (mistake: Mistake) => {
    setSubject(mistake.subject);
    setTopic(mistake.topic);
    setProblemStatement(mistake.problemStatement);
    setCategory(mistake.category);
    setNotes(mistake.notes);
    setEditingMistakeId(mistake.id);
    setIsFormOpen(true);
    setShowFormPreview(false);
  };

  const handleSubmitMistake = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !topic.trim() || !problemStatement.trim()) return;

    if (editingMistakeId) {
      // Update existing
      setMistakes(prev => prev.map(m => {
        if (m.id !== editingMistakeId) return m;
        return {
          ...m,
          subject: subject.trim(),
          topic: topic.trim(),
          problemStatement: problemStatement.trim(),
          category,
          notes: notes.trim(),
        };
      }));
    } else {
      // Create new
      const newMistake: Mistake = {
        id: crypto.randomUUID(),
        subject: subject.trim(),
        topic: topic.trim(),
        problemStatement: problemStatement.trim(),
        category,
        notes: notes.trim(),
        repetitionCount: 0,
        nextReview: getNextReviewDate(0), // +3 days
        status: 'LEARNING',
        createdAt: new Date().toISOString()
      };
      setMistakes(prev => [newMistake, ...prev]);
    }

    resetForm();
  };

  const handleDeleteMistake = (id: string) => {
    setMistakes(prev => prev.filter(m => m.id !== id));
    setDeleteConfirmId(null);
  };

  const handleResolve = (id: string) => {
    setMistakes(prev => prev.map(m => {
      if (m.id !== id) return m;
      const nextCount = m.repetitionCount + 1;
      const isMastered = nextCount >= 3;
      return {
        ...m,
        repetitionCount: nextCount,
        nextReview: isMastered ? m.nextReview : getNextReviewDate(nextCount),
        status: isMastered ? 'MASTERED' : 'LEARNING',
        lastReviewedAt: new Date().toISOString()
      };
    }));
  };

  const handleFailedReview = (id: string) => {
    // Reset SM-2 schedule to review tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    setMistakes(prev => prev.map(m => {
      if (m.id !== id) return m;
      return {
        ...m,
        repetitionCount: 0,
        nextReview: tomorrowStr,
        status: 'LEARNING',
        lastReviewedAt: new Date().toISOString()
      };
    }));
  };

  const handleResetToLearning = (id: string) => {
    setMistakes(prev => prev.map(m => {
      if (m.id !== id) return m;
      return {
        ...m,
        status: 'LEARNING',
        repetitionCount: 1,
        nextReview: today
      };
    }));
  };

  const handlePracticeInSolver = (problemText: string, subjectName: string, topicName: string) => {
    // Dispatch STEM Solver preload event
    window.dispatchEvent(new CustomEvent('savantix_stemsolver_preload', { 
      detail: { problemText, subject: subjectName, topic: topicName } 
    }));
    // Dispatch in-app navigation event to switch tab to solver
    window.dispatchEvent(new CustomEvent('navigate', { 
      detail: { tab: 'solver', problemText, subject: subjectName, topic: topicName } 
    }));
  };

  const handleLoadBenchmarkTraps = () => {
    const existingStatements = new Set(mistakes.map(m => m.problemStatement.trim()));
    const toAdd: Mistake[] = BENCHMARK_TRAPS
      .filter(b => !existingStatements.has(b.problemStatement.trim()))
      .map(b => ({
        ...b,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString()
      }));

    if (toAdd.length === 0) {
      alert('All benchmark traps are already loaded in your vault!');
      return;
    }

    setMistakes(prev => [...toAdd, ...prev]);
  };

  const toggleRawView = (id: string) => {
    setRawViewIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Export to Markdown
  const handleExportMarkdown = () => {
    let md = `# Savantix Error Notebook & Trap Log\n`;
    md += `Export Date: ${new Date().toLocaleDateString()} | Total Traps: ${mistakes.length}\n\n`;
    md += `---\n\n`;

    mistakes.forEach((m, idx) => {
      md += `### ${idx + 1}. [${m.category}] ${m.subject} — ${m.topic}\n`;
      md += `- **Status:** ${m.status} (Repetitions: ${m.repetitionCount}/3, Next Review: ${m.nextReview})\n`;
      md += `- **Logged:** ${m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'N/A'}\n\n`;
      md += `#### Problem Statement:\n\n${m.problemStatement}\n\n`;
      if (m.notes) {
        md += `#### Trap Notes & Insights:\n\n${m.notes}\n\n`;
      }
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `savantix_error_vault_${today}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export to JSON
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(mistakes, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `savantix_error_vault_${today}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import from JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          // Merge avoiding duplicates by id or problemStatement
          const existingIds = new Set(mistakes.map(m => m.id));
          const existingText = new Set(mistakes.map(m => m.problemStatement.trim()));
          const newEntries: Mistake[] = [];

          parsed.forEach((item: any) => {
            if (item.problemStatement && !existingIds.has(item.id) && !existingText.has(item.problemStatement.trim())) {
              newEntries.push({
                id: item.id || crypto.randomUUID(),
                subject: item.subject || 'General STEM',
                topic: item.topic || 'General Topic',
                problemStatement: item.problemStatement,
                category: item.category || 'Conceptual Gap',
                notes: item.notes || '',
                repetitionCount: item.repetitionCount || 0,
                nextReview: item.nextReview || today,
                status: item.status || 'LEARNING',
                createdAt: item.createdAt || new Date().toISOString()
              });
            }
          });

          setMistakes(prev => [...newEntries, ...prev]);
          alert(`Successfully imported ${newEntries.length} new traps into the vault!`);
        }
      } catch (err) {
        alert('Invalid JSON file. Please check the format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const getCategoryColor = (cat: ErrorCategory) => {
    switch(cat) {
      case 'Conceptual Gap': return 'bg-red-500/15 text-red-400 border-red-500/30';
      case 'Calculation Slip': return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
      case 'Misread Constraint': return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
      case 'Time Trap': return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'Formula Error': return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      default: return 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';
    }
  };

  // Distinct subjects derived from mistakes + presets
  const availableSubjects = useMemo(() => {
    const set = new Set<string>(PRESET_SUBJECTS);
    mistakes.forEach(m => {
      if (m.subject) set.add(m.subject);
    });
    return Array.from(set);
  }, [mistakes]);

  // Statistics
  const totalMistakes = mistakes.length;
  const masteredCount = mistakes.filter(m => m.status === 'MASTERED').length;
  const dueTodayCount = mistakes.filter(m => m.status !== 'MASTERED' && m.nextReview <= today).length;
  const overdueCount = mistakes.filter(m => m.status !== 'MASTERED' && m.nextReview < today).length;
  const masteryRate = totalMistakes > 0 ? Math.round((masteredCount / totalMistakes) * 100) : 0;

  // Filtered mistakes
  const filteredMistakes = useMemo(() => {
    return mistakes.filter(m => {
      // Tab filter
      if (filter === 'Due Today') {
        if (m.status === 'MASTERED' || m.nextReview > today) return false;
      } else if (filter === 'Overdue') {
        if (m.status === 'MASTERED' || m.nextReview >= today) return false;
      } else if (filter === 'Mastered') {
        if (m.status !== 'MASTERED') return false;
      } else if (filter === 'By Category') {
        if (selectedCategory !== 'All' && m.category !== selectedCategory) return false;
      } else if (filter === 'By Subject') {
        if (selectedSubject !== 'All' && m.subject.toLowerCase() !== selectedSubject.toLowerCase()) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesStatement = m.problemStatement.toLowerCase().includes(q);
        const matchesTopic = m.topic.toLowerCase().includes(q);
        const matchesSubject = m.subject.toLowerCase().includes(q);
        const matchesNotes = m.notes.toLowerCase().includes(q);
        if (!matchesStatement && !matchesTopic && !matchesSubject && !matchesNotes) return false;
      }

      return true;
    });
  }, [mistakes, filter, selectedCategory, selectedSubject, searchQuery, today]);

  const allCategories: ErrorCategory[] = [
    'Conceptual Gap',
    'Calculation Slip',
    'Misread Constraint',
    'Time Trap',
    'Formula Error'
  ];

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto flex flex-col h-full gap-6">
      {/* Hidden file input for JSON import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImportJSON} 
        accept=".json" 
        className="hidden" 
      />

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
                Error Vault
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Active Trap & Blunder Notebook powered by SM-2 Spaced Repetition
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Load Benchmark Traps button */}
          <button
            onClick={handleLoadBenchmarkTraps}
            title="Preload 5 Olympiad/JEE advanced benchmark traps"
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-xl text-xs font-semibold transition-all hover:border-zinc-700"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Benchmark Traps</span>
          </button>

          {/* Export Dropdown / Buttons */}
          <button
            onClick={handleExportMarkdown}
            title="Export vault as Markdown revision sheet"
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-xl text-xs font-semibold transition-all hover:border-zinc-700"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export (.md)</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            title="Import vault from JSON file"
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-xl text-xs font-semibold transition-all hover:border-zinc-700"
          >
            <Upload className="w-3.5 h-3.5 text-zinc-400" />
            <span>Import</span>
          </button>

          {/* Primary Add/Close Button */}
          <button 
            onClick={() => {
              if (isFormOpen) {
                resetForm();
              } else {
                setIsFormOpen(true);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            {isFormOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isFormOpen ? 'Close Editor' : 'Log New Trap'}
          </button>
        </div>
      </header>

      {/* Stats Header */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-zinc-900/60 p-3.5 sm:p-4 rounded-xl border border-zinc-800/80 backdrop-blur-sm">
          <div className="text-zinc-500 text-[11px] font-bold uppercase tracking-wider mb-1">Total Traps</div>
          <div className="text-xl sm:text-2xl font-bold text-zinc-100">{totalMistakes}</div>
        </div>
        <div className="bg-emerald-950/20 p-3.5 sm:p-4 rounded-xl border border-emerald-500/20 backdrop-blur-sm">
          <div className="text-emerald-400/80 text-[11px] font-bold uppercase tracking-wider mb-1">Mastered</div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-400 flex items-baseline gap-2">
            {masteredCount}
            <span className="text-xs font-medium text-emerald-500/60">({masteryRate}%)</span>
          </div>
        </div>
        <div className="bg-amber-950/20 p-3.5 sm:p-4 rounded-xl border border-amber-500/20 backdrop-blur-sm">
          <div className="text-amber-400/80 text-[11px] font-bold uppercase tracking-wider mb-1">Due Today</div>
          <div className="text-xl sm:text-2xl font-bold text-amber-400">{dueTodayCount}</div>
        </div>
        <div className="bg-rose-950/20 p-3.5 sm:p-4 rounded-xl border border-rose-500/20 backdrop-blur-sm">
          <div className="text-rose-400/80 text-[11px] font-bold uppercase tracking-wider mb-1">Overdue</div>
          <div className="text-xl sm:text-2xl font-bold text-rose-400">{overdueCount}</div>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-zinc-900/60 p-3.5 sm:p-4 rounded-xl border border-zinc-800/80 backdrop-blur-sm flex flex-col justify-between">
          <div className="text-zinc-500 text-[11px] font-bold uppercase tracking-wider mb-1">In Learning</div>
          <div className="text-xl sm:text-2xl font-bold text-indigo-400">
            {totalMistakes - masteredCount}
          </div>
        </div>
      </div>

      {/* Log / Edit Form Drawer */}
      {isFormOpen && (
        <form onSubmit={handleSubmitMistake} className="bg-zinc-900/90 border border-zinc-700/80 p-5 rounded-2xl flex flex-col gap-4 backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Brain className="w-4 h-4 text-indigo-400" />
              {editingMistakeId ? 'Edit Trap' : 'Log a New Trap into the Vault'}
            </h2>
            <button
              type="button"
              onClick={resetForm}
              className="text-zinc-400 hover:text-zinc-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Subject</label>
              <input 
                required 
                value={subject} 
                onChange={e => setSubject(e.target.value)} 
                type="text" 
                placeholder="e.g. Physics, Calculus, Chemistry" 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 focus:outline-none placeholder-zinc-600" 
              />
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {PRESET_SUBJECTS.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setSubject(preset)}
                    className="text-[10px] px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 border border-zinc-700/50 cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Topic</label>
              <input 
                required 
                value={topic} 
                onChange={e => setTopic(e.target.value)} 
                type="text" 
                placeholder="e.g. Rotational Dynamics, FTC" 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 focus:outline-none placeholder-zinc-600" 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Error Category</label>
              <select 
                value={category} 
                onChange={e => setCategory(e.target.value as ErrorCategory)} 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 focus:outline-none"
              >
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-zinc-300">
                Problem Statement <span className="text-zinc-500 font-normal">(KaTeX supported: $x^2$ or $$\int f(x)dx$$)</span>
              </label>
              <button
                type="button"
                onClick={() => setShowFormPreview(!showFormPreview)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold cursor-pointer"
              >
                {showFormPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showFormPreview ? 'Edit LaTeX' : 'Preview KaTeX'}
              </button>
            </div>

            {showFormPreview ? (
              <div className="min-h-[90px] bg-zinc-950 p-3 rounded-xl border border-indigo-500/30 text-sm text-zinc-200 prose prose-invert max-w-none">
                {problemStatement.trim() ? (
                  <Markdown
                    remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {problemStatement}
                  </Markdown>
                ) : (
                  <span className="text-zinc-500 italic">Enter a problem statement to preview math rendering...</span>
                )}
              </div>
            ) : (
              <textarea 
                required 
                value={problemStatement} 
                onChange={e => setProblemStatement(e.target.value)} 
                rows={3} 
                placeholder="What was the exact problem? You can use $math$ or standard text..." 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 focus:outline-none resize-y placeholder-zinc-600 font-mono text-xs" 
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Trap Notes & Why I Got It Wrong <span className="text-zinc-500 font-normal">(Explain the cognitive trap to your future self)</span>
            </label>
            <textarea 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              rows={3} 
              placeholder="e.g. Forgot pseudo-force at CM; assumed friction opposes acceleration; missed discontinuity at x=0..." 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:border-indigo-500 focus:outline-none resize-y placeholder-zinc-600" 
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
            <button 
              type="button" 
              onClick={resetForm}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              {editingMistakeId ? 'Save Changes' : 'Add to Vault'}
            </button>
          </div>
        </form>
      )}

      {/* Search & Filter Controls */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {(['All', 'Due Today', 'Overdue', 'By Category', 'By Subject', 'Mastered'] as const).map(f => {
              const isActive = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                      : 'bg-zinc-900/60 text-zinc-400 border border-zinc-800/80 hover:bg-zinc-800/60 hover:text-zinc-200'
                  }`}
                >
                  {f}
                  {f === 'Due Today' && dueTodayCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {dueTodayCount}
                    </span>
                  )}
                  {f === 'Overdue' && overdueCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {overdueCount}
                    </span>
                  )}
                  {f === 'Mastered' && masteredCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {masteredCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search traps, topics, formulas..."
              className="w-full bg-zinc-900/60 border border-zinc-800/80 rounded-xl pl-8 pr-8 py-1.5 text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none placeholder-zinc-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Secondary Filter: By Category */}
        {filter === 'By Category' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 animate-in fade-in duration-200">
            <span className="text-xs text-zinc-500 font-semibold mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Category:
            </span>
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'All'
                  ? 'bg-zinc-200 text-zinc-950 font-bold'
                  : 'bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              All ({mistakes.length})
            </button>
            {allCategories.map(cat => {
              const count = mistakes.filter(m => m.category === cat).length;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-200 text-zinc-950 font-bold'
                      : 'bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1 rounded ${isSelected ? 'bg-zinc-400 text-zinc-950' : 'bg-zinc-800 text-zinc-500'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Secondary Filter: By Subject */}
        {filter === 'By Subject' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 animate-in fade-in duration-200">
            <span className="text-xs text-zinc-500 font-semibold mr-1 flex items-center gap-1">
              <Hash className="w-3 h-3" /> Subject:
            </span>
            <button
              onClick={() => setSelectedSubject('All')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedSubject === 'All'
                  ? 'bg-zinc-200 text-zinc-950 font-bold'
                  : 'bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              All ({mistakes.length})
            </button>
            {availableSubjects.map(sub => {
              const count = mistakes.filter(m => m.subject.toLowerCase() === sub.toLowerCase()).length;
              const isSelected = selectedSubject.toLowerCase() === sub.toLowerCase();
              return (
                <button
                  key={sub}
                  onClick={() => setSelectedSubject(sub)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-200 text-zinc-950 font-bold'
                      : 'bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
                  }`}
                >
                  <span>{sub}</span>
                  <span className={`text-[10px] px-1 rounded ${isSelected ? 'bg-zinc-400 text-zinc-950' : 'bg-zinc-800 text-zinc-500'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Mistake Cards List */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-12">
        {filteredMistakes.length === 0 ? (
          <div className="py-16 px-4 flex flex-col items-center justify-center text-center text-zinc-500 bg-zinc-900/30 rounded-2xl border border-zinc-800/50 border-dashed">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-3 text-zinc-400">
              <Lock className="w-6 h-6 opacity-60" />
            </div>
            <h3 className="text-base font-semibold text-zinc-300 mb-1">
              {totalMistakes === 0 ? 'Your Error Vault is Empty' : 'No traps match your active filter'}
            </h3>
            <p className="text-xs text-zinc-500 max-w-md mb-4">
              {totalMistakes === 0 
                ? 'Competitive STEM aspirants review their mistakes with SM-2 spaced repetition to never trip on the same trap twice.'
                : 'Try adjusting your search query, error category, or subject filter.'}
            </p>
            {totalMistakes === 0 ? (
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <button
                  onClick={handleLoadBenchmarkTraps}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Load Benchmark Traps (JEE / Olympiad)
                </button>
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Log Custom Trap
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setFilter('All');
                  setSelectedCategory('All');
                  setSelectedSubject('All');
                  setSearchQuery('');
                }}
                className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          filteredMistakes.map(mistake => {
            const isDue = mistake.status !== 'MASTERED' && mistake.nextReview <= today;
            const isOverdue = mistake.status !== 'MASTERED' && mistake.nextReview < today;
            const isRaw = rawViewIds.has(mistake.id);

            return (
              <div 
                key={mistake.id} 
                className="bg-zinc-900/70 border border-zinc-800/90 hover:border-zinc-700/90 rounded-2xl p-4 sm:p-5 backdrop-blur-sm transition-all shadow-lg flex flex-col gap-3"
              >
                {/* Card Top Metadata & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Error Category Tag */}
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${getCategoryColor(mistake.category)}`}>
                      {mistake.category}
                    </span>

                    {/* Subject Tag */}
                    <span className="text-xs text-zinc-300 font-semibold flex items-center gap-1 bg-zinc-800/80 px-2.5 py-0.5 rounded-lg border border-zinc-700/60">
                      <Hash className="w-3 h-3 text-indigo-400" /> {mistake.subject}
                    </span>

                    {/* Topic Tag */}
                    <span className="text-xs text-zinc-400 bg-zinc-800/50 px-2.5 py-0.5 rounded-lg border border-zinc-700/40 font-medium">
                      {mistake.topic}
                    </span>

                    {/* Review Status Pill */}
                    {mistake.status === 'MASTERED' ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md uppercase flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Mastered (Rep 3/3)
                      </span>
                    ) : isOverdue ? (
                      <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/25 px-2 py-0.5 rounded-md uppercase flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Overdue (Due {mistake.nextReview})
                      </span>
                    ) : isDue ? (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md uppercase flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Due Today (Rep {mistake.repetitionCount}/3)
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-md uppercase flex items-center gap-1 border border-zinc-700/40">
                        <Clock className="w-3 h-3 text-zinc-500" /> Due {mistake.nextReview} (Rep {mistake.repetitionCount}/3)
                      </span>
                    )}
                  </div>

                  {/* Top Right Actions: Edit, Raw/KaTeX Toggle, Delete */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      onClick={() => toggleRawView(mistake.id)}
                      title={isRaw ? 'Render KaTeX math' : 'View raw LaTeX source'}
                      className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                    >
                      {isRaw ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => handleOpenEdit(mistake)}
                      title="Edit this trap"
                      className="p-1.5 text-zinc-400 hover:text-indigo-300 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {deleteConfirmId === mistake.id ? (
                      <div className="flex items-center gap-1 bg-rose-950/40 border border-rose-500/40 rounded-lg p-1 animate-in fade-in duration-200">
                        <span className="text-[10px] text-rose-300 font-bold px-1">Delete?</span>
                        <button
                          onClick={() => handleDeleteMistake(mistake.id)}
                          className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold cursor-pointer"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(mistake.id)}
                        title="Delete mistake"
                        className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Problem Statement Box */}
                <div className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-800/80 text-sm text-zinc-200 overflow-x-auto">
                  {isRaw ? (
                    <pre className="font-mono text-xs text-zinc-300 whitespace-pre-wrap">
                      {mistake.problemStatement}
                    </pre>
                  ) : (
                    <div className="prose prose-invert max-w-none text-zinc-200 leading-relaxed text-sm">
                      <Markdown
                        remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {mistake.problemStatement}
                      </Markdown>
                    </div>
                  )}
                </div>

                {/* Trap Notes Box */}
                {mistake.notes && (
                  <div className="flex gap-3 items-start bg-indigo-950/15 p-3.5 rounded-xl border border-indigo-500/20">
                    <Brain className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed prose prose-invert max-w-none">
                      <Markdown
                        remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {mistake.notes}
                      </Markdown>
                    </div>
                  </div>
                )}

                {/* Bottom Interactive SM-2 & Practice Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-zinc-800/60">
                  <div className="text-[11px] text-zinc-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Logged {mistake.createdAt ? new Date(mistake.createdAt).toLocaleDateString() : 'earlier'}</span>
                    {mistake.lastReviewedAt && (
                      <span className="text-zinc-600">
                        • Last reviewed {new Date(mistake.lastReviewedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {/* Practice in STEM Solver */}
                    <button
                      onClick={() => handlePracticeInSolver(mistake.problemStatement, mistake.subject, mistake.topic)}
                      title="Load into Socratic STEM Solver"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition-colors border border-zinc-700/60 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3 text-indigo-400" />
                      Practice in Solver
                    </button>

                    {/* Mastered / Re-learn toggles */}
                    {mistake.status === 'MASTERED' ? (
                      <button
                        onClick={() => handleResetToLearning(mistake.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3 text-amber-400" />
                        Move to In-Learning
                      </button>
                    ) : (
                      <>
                        {/* Got trapped again: Reset SM-2 repetition */}
                        <button
                          onClick={() => handleFailedReview(mistake.id)}
                          title="Fumbled or forgot this trap: schedule for tomorrow"
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 border border-rose-500/25 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          Trapped Again
                        </button>

                        {/* Resolved / Reviewed Pass */}
                        <button
                          onClick={() => handleResolve(mistake.id)}
                          title="Successfully solved without tripping: advance SM-2 interval"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          {mistake.repetitionCount >= 2 ? 'Mastered!' : 'Review Pass (+SM-2)'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
