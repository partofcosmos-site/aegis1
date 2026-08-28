import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  Flame, 
  Zap, 
  Target, 
  Bookmark, 
  Filter, 
  Search, 
  CheckSquare, 
  Square, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Layers, 
  Sparkles, 
  AlertCircle, 
  ArrowUpDown, 
  Check, 
  X,
  Atom,
  Calculator,
  FlaskConical,
  FileCheck,
  Compass,
  Sliders,
  CheckCircle
} from 'lucide-react';

export type GoalCategory = 'Physics' | 'Math' | 'Chemistry' | 'Mock Tests' | 'General';
export type GoalPriority = 'Urgent' | 'High' | 'Medium' | 'Low';

export interface Milestone {
  id: string;
  text: string;
  completed: boolean;
}

export interface GoalItem {
  id: string;
  title: string;
  description?: string;
  targetDate?: string | null;
  category?: GoalCategory;
  priority?: GoalPriority;
  progress?: number;
  completed: boolean;
  milestones?: Milestone[];
  createdAt?: string;
}

const CATEGORIES: GoalCategory[] = ['Physics', 'Math', 'Chemistry', 'Mock Tests', 'General'];
const PRIORITIES: GoalPriority[] = ['Urgent', 'High', 'Medium', 'Low'];

const CATEGORY_CONFIG: Record<GoalCategory, { label: string; icon: React.ElementType; badgeBg: string; border: string; text: string; gradient: string }> = {
  'Physics': {
    label: 'Physics',
    icon: Atom,
    badgeBg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    gradient: 'from-cyan-500 to-blue-500'
  },
  'Math': {
    label: 'Math',
    icon: Calculator,
    badgeBg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
    text: 'text-indigo-400',
    gradient: 'from-indigo-500 to-violet-500'
  },
  'Chemistry': {
    label: 'Chemistry',
    icon: FlaskConical,
    badgeBg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    gradient: 'from-emerald-500 to-teal-500'
  },
  'Mock Tests': {
    label: 'Mock Tests',
    icon: FileCheck,
    badgeBg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    gradient: 'from-amber-500 to-orange-500'
  },
  'General': {
    label: 'General',
    icon: Compass,
    badgeBg: 'bg-zinc-500/10',
    border: 'border-zinc-500/30',
    text: 'text-zinc-400',
    gradient: 'from-zinc-500 to-zinc-400'
  }
};

const PRIORITY_CONFIG: Record<GoalPriority, { label: string; icon: React.ElementType; badgeBg: string; border: string; text: string; dot: string }> = {
  'Urgent': {
    label: 'Urgent',
    icon: Flame,
    badgeBg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    dot: 'bg-rose-500'
  },
  'High': {
    label: 'High',
    icon: Zap,
    badgeBg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    dot: 'bg-amber-500'
  },
  'Medium': {
    label: 'Medium',
    icon: Target,
    badgeBg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    dot: 'bg-blue-500'
  },
  'Low': {
    label: 'Low',
    icon: Bookmark,
    badgeBg: 'bg-zinc-800',
    border: 'border-zinc-700',
    text: 'text-zinc-400',
    dot: 'bg-zinc-500'
  }
};

export const Goals = () => {
  const { user, goals, addGoal, updateGoal, deleteGoal } = useAppContext();

  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState<GoalCategory>('Physics');
  const [priority, setPriority] = useState<GoalPriority>('High');
  const [progress, setProgress] = useState<number>(0);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [newMilestoneText, setNewMilestoneText] = useState('');

  // Quick milestone adder state on cards: goalId -> text
  const [quickMilestoneInputs, setQuickMilestoneInputs] = useState<Record<string, string>>({});
  // Expanded milestone checklists on cards: goalId -> boolean
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'Active' | 'Completed'>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'targetDate' | 'priority' | 'progress' | 'recent'>('recent');

  // Helper to recalculate progress from milestones
  const computeProgress = (items: Milestone[], fallback = 0): number => {
    if (items.length > 0) {
      const completedCount = items.filter(m => m.completed).length;
      return Math.round((completedCount / items.length) * 100);
    }
    return Math.min(100, Math.max(0, fallback));
  };

  // Open Form for creating
  const handleOpenCreate = () => {
    setEditingGoalId(null);
    setTitle('');
    setDescription('');
    setTargetDate('');
    setCategory('Physics');
    setPriority('High');
    setProgress(0);
    setMilestones([]);
    setNewMilestoneText('');
    setIsFormOpen(true);
  };

  // Open Form for editing
  const handleOpenEdit = (goal: any) => {
    setEditingGoalId(goal.id);
    setTitle(goal.title || '');
    setDescription(goal.description || '');
    setTargetDate(goal.targetDate || '');
    setCategory(goal.category || 'General');
    setPriority(goal.priority || 'Medium');
    const goalMilestones: Milestone[] = goal.milestones || [];
    setMilestones(goalMilestones);
    setProgress(goal.progress ?? (goalMilestones.length > 0 ? computeProgress(goalMilestones) : (goal.completed ? 100 : 0)));
    setNewMilestoneText('');
    setIsFormOpen(true);
  };

  // Close Form
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingGoalId(null);
  };

  // Add milestone in form
  const handleAddMilestoneToForm = () => {
    if (!newMilestoneText.trim()) return;
    const newM: Milestone = {
      id: 'm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      text: newMilestoneText.trim().substring(0, 199),
      completed: false
    };
    const updated = [...milestones, newM];
    setMilestones(updated);
    setProgress(computeProgress(updated, progress));
    setNewMilestoneText('');
  };

  // Toggle milestone in form
  const handleToggleMilestoneInForm = (id: string) => {
    const updated = milestones.map(m => m.id === id ? { ...m, completed: !m.completed } : m);
    setMilestones(updated);
    setProgress(computeProgress(updated, progress));
  };

  // Delete milestone in form
  const handleDeleteMilestoneInForm = (id: string) => {
    const updated = milestones.filter(m => m.id !== id);
    setMilestones(updated);
    setProgress(updated.length > 0 ? computeProgress(updated) : progress);
  };

  // Save / Update Goal
  const handleSaveGoal = async () => {
    if (!user || !title.trim()) return;

    const finalProgress = milestones.length > 0 ? computeProgress(milestones) : progress;
    const isCompleted = finalProgress === 100;

    const goalPayload = {
      title: title.trim().substring(0, 199),
      description: description.trim().substring(0, 999),
      targetDate: targetDate.trim() || null,
      category,
      priority,
      progress: finalProgress,
      completed: isCompleted,
      milestones,
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingGoalId) {
        await updateGoal(editingGoalId, goalPayload);
      } else {
        await addGoal(goalPayload);
      }
      handleCloseForm();
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  // Toggle Goal Overall Complete Button
  const handleToggleComplete = async (goal: any) => {
    try {
      const willBeCompleted = !goal.completed;
      const currentMilestones: Milestone[] = goal.milestones || [];
      const updatedMilestones = currentMilestones.map(m => ({
        ...m,
        completed: willBeCompleted
      }));
      const newProgress = willBeCompleted ? 100 : 0;

      await updateGoal(goal.id, {
        completed: willBeCompleted,
        progress: newProgress,
        milestones: updatedMilestones,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error toggling goal complete:', error);
    }
  };

  // Toggle single milestone on card with automatic progress recalculation
  const handleToggleCardMilestone = async (goal: any, milestoneId: string) => {
    try {
      const currentMilestones: Milestone[] = goal.milestones || [];
      const updatedMilestones = currentMilestones.map(m => 
        m.id === milestoneId ? { ...m, completed: !m.completed } : m
      );
      const newProgress = computeProgress(updatedMilestones);
      const newCompleted = newProgress === 100;

      await updateGoal(goal.id, {
        milestones: updatedMilestones,
        progress: newProgress,
        completed: newCompleted,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating milestone:', error);
    }
  };

  // Quick add milestone directly on the card
  const handleAddCardMilestone = async (goal: any) => {
    const text = quickMilestoneInputs[goal.id]?.trim();
    if (!text) return;

    try {
      const currentMilestones: Milestone[] = goal.milestones || [];
      const newM: Milestone = {
        id: 'm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        text: text.substring(0, 199),
        completed: false
      };
      const updatedMilestones = [...currentMilestones, newM];
      const newProgress = computeProgress(updatedMilestones);
      const newCompleted = newProgress === 100;

      await updateGoal(goal.id, {
        milestones: updatedMilestones,
        progress: newProgress,
        completed: newCompleted,
        updatedAt: new Date().toISOString()
      });

      setQuickMilestoneInputs(prev => ({ ...prev, [goal.id]: '' }));
    } catch (error) {
      console.error('Error adding card milestone:', error);
    }
  };

  // Delete milestone directly from card
  const handleDeleteCardMilestone = async (goal: any, milestoneId: string) => {
    try {
      const currentMilestones: Milestone[] = goal.milestones || [];
      const updatedMilestones = currentMilestones.filter(m => m.id !== milestoneId);
      const newProgress = updatedMilestones.length > 0 ? computeProgress(updatedMilestones) : (goal.progress || 0);
      const newCompleted = updatedMilestones.length > 0 ? (newProgress === 100) : (newProgress === 100);

      await updateGoal(goal.id, {
        milestones: updatedMilestones,
        progress: newProgress,
        completed: newCompleted,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error deleting milestone:', error);
    }
  };

  // Direct progress slider adjustment on card
  const handleSliderProgressChange = async (goal: any, newProgress: number) => {
    try {
      const clamped = Math.min(100, Math.max(0, Math.round(newProgress)));
      const isCompleted = clamped === 100;
      await updateGoal(goal.id, {
        progress: clamped,
        completed: isCompleted,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating progress slider:', error);
    }
  };

  // Delete Goal
  const handleDeleteGoal = async (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this goal?')) {
      try {
        await deleteGoal(id);
      } catch (error) {
        console.error('Error deleting goal:', error);
      }
    }
  };

  // Toggle milestone list expansion on card
  const toggleCardExpansion = (goalId: string) => {
    setExpandedCards(prev => ({ ...prev, [goalId]: !prev[goalId] }));
  };

  // Date badge helper
  const getTargetDateBadge = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(dateStr + 'T00:00:00');
      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return { text: `Overdue (${Math.abs(diffDays)}d ago)`, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
      } else if (diffDays === 0) {
        return { text: 'Due Today', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
      } else if (diffDays === 1) {
        return { text: 'Due Tomorrow', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' };
      } else if (diffDays <= 7) {
        return { text: `${diffDays} days left`, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' };
      } else {
        return { text: dateStr, color: 'text-zinc-400 bg-zinc-800/80 border-zinc-700/60' };
      }
    } catch {
      return { text: dateStr, color: 'text-zinc-400 bg-zinc-800/80 border-zinc-700/60' };
    }
  };

  // Filter & Sort Logic
  const filteredGoals = useMemo(() => {
    return goals.filter(goal => {
      // Category filter
      if (selectedCategory !== 'All' && (goal.category || 'General') !== selectedCategory) {
        return false;
      }
      // Status filter
      if (selectedStatus === 'Active' && goal.completed) return false;
      if (selectedStatus === 'Completed' && !goal.completed) return false;
      // Priority filter
      if (selectedPriority !== 'All' && (goal.priority || 'Medium') !== selectedPriority) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = goal.title?.toLowerCase().includes(query);
        const matchesDesc = goal.description?.toLowerCase().includes(query);
        const matchesMilestones = (goal.milestones || []).some((m: Milestone) => m.text?.toLowerCase().includes(query));
        if (!matchesTitle && !matchesDesc && !matchesMilestones) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder: Record<string, number> = { 'Urgent': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        const pA = priorityOrder[a.priority || 'Medium'] || 1;
        const pB = priorityOrder[b.priority || 'Medium'] || 1;
        return pB - pA;
      }
      if (sortBy === 'progress') {
        const progA = a.progress ?? (a.completed ? 100 : 0);
        const progB = b.progress ?? (b.completed ? 100 : 0);
        return progB - progA;
      }
      if (sortBy === 'targetDate') {
        if (!a.targetDate) return 1;
        if (!b.targetDate) return -1;
        return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
      }
      // Default: recent
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [goals, selectedCategory, selectedStatus, selectedPriority, searchQuery, sortBy]);

  // Overall Statistics
  const totalGoalsCount = goals.length;
  const completedGoalsCount = goals.filter(g => g.completed).length;
  const activeGoalsCount = totalGoalsCount - completedGoalsCount;
  const overallProgressAvg = totalGoalsCount > 0 
    ? Math.round(goals.reduce((acc, g) => acc + (g.progress ?? (g.completed ? 100 : 0)), 0) / totalGoalsCount) 
    : 0;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-zinc-950 text-zinc-100">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Title & CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                  Syllabus, Goals & Milestones
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                  Plan syllabus topics, track sub-milestones with automated progress, and dominate your prep targets.
                </p>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Goal</span>
          </button>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Goals</p>
              <p className="text-2xl sm:text-3xl font-bold text-zinc-100 mt-1">{totalGoalsCount}</p>
            </div>
            <div className="p-3 bg-zinc-800/80 rounded-xl text-zinc-400 border border-zinc-700/50">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Active Targets</p>
              <p className="text-2xl sm:text-3xl font-bold text-indigo-400 mt-1">{activeGoalsCount}</p>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Completed</p>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-400 mt-1">{completedGoalsCount}</p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Mastery Rate</p>
              <p className="text-2xl sm:text-3xl font-bold text-cyan-400 mt-1">{overallProgressAvg}%</p>
            </div>
            <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter, Search and Category Pills */}
        <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-4 space-y-4">
          
          {/* Top Bar: Search, Status Tabs & Sorting */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search goals, topics or sub-milestones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Tabs */}
            <div className="flex bg-zinc-950/80 p-1 rounded-xl border border-zinc-800 text-xs font-medium self-start md:self-auto">
              {(['All', 'Active', 'Completed'] as const).map((status) => {
                const isActive = selectedStatus === status;
                const count = status === 'All' 
                  ? goals.length 
                  : status === 'Active' 
                    ? activeGoalsCount 
                    : completedGoalsCount;
                return (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                      isActive 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span>{status}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-zinc-800 text-zinc-400'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Priority & Sort Dropdowns */}
            <div className="flex items-center gap-2">
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Priorities</option>
                <option value="Urgent">🔥 Urgent</option>
                <option value="High">⚡ High</option>
                <option value="Medium">🎯 Medium</option>
                <option value="Low">📌 Low</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="recent">Sort: Recently Added</option>
                <option value="targetDate">Sort: Target Date</option>
                <option value="priority">Sort: Priority</option>
                <option value="progress">Sort: Highest Progress</option>
              </select>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-zinc-500 flex items-center gap-1 shrink-0 font-medium">
              <Filter className="w-3.5 h-3.5" /> Category:
            </span>

            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1.5 rounded-xl border transition-all shrink-0 font-medium ${
                selectedCategory === 'All'
                  ? 'bg-zinc-100 text-zinc-900 border-zinc-100 shadow-sm'
                  : 'bg-zinc-950/60 text-zinc-400 border-zinc-800/80 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              All Categories ({goals.length})
            </button>

            {CATEGORIES.map((cat) => {
              const config = CATEGORY_CONFIG[cat];
              const Icon = config.icon;
              const isSelected = selectedCategory === cat;
              const catCount = goals.filter(g => (g.category || 'General') === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all shrink-0 font-medium ${
                    isSelected
                      ? `${config.badgeBg} ${config.text} ${config.border} ring-1 ring-inset ${config.text.replace('text-', 'ring-')}`
                      : 'bg-zinc-950/60 text-zinc-400 border-zinc-800/80 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat}</span>
                  <span className="opacity-70 text-[10px]">({catCount})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Goal Creator / Editor Modal */}
        {isFormOpen && (
          <div className="bg-zinc-900/90 backdrop-blur-xl p-6 rounded-2xl border border-indigo-500/30 shadow-2xl shadow-indigo-950/40 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                {editingGoalId ? <Edit3 className="w-5 h-5 text-indigo-400" /> : <Plus className="w-5 h-5 text-indigo-400" />}
                <span>{editingGoalId ? 'Edit Goal & Milestones' : 'Create New Target Goal'}</span>
              </h3>
              <button
                onClick={handleCloseForm}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Goal Title */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Goal Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Master Rotational Dynamics (Irodov Level) or Organic Reaction Mechanisms"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Description / Study Strategy (Optional)
                </label>
                <textarea
                  placeholder="Key focus areas, reference books (HC Verma, Pathfinder, Cengage), and problem targets..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full h-20 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none text-sm"
                />
              </div>

              {/* Category & Priority Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {CATEGORIES.map((cat) => {
                      const cfg = CATEGORY_CONFIG[cat];
                      const Icon = cfg.icon;
                      const isSelected = category === cat;
                      return (
                        <button
                          type="button"
                          key={cat}
                          onClick={() => setCategory(cat)}
                          className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                            isSelected
                              ? `${cfg.badgeBg} ${cfg.text} ${cfg.border} ring-1 ring-indigo-500/40`
                              : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span className="truncate">{cat}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Priority Selection */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Priority Level
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {PRIORITIES.map((pri) => {
                      const cfg = PRIORITY_CONFIG[pri];
                      const Icon = cfg.icon;
                      const isSelected = priority === pri;
                      return (
                        <button
                          type="button"
                          key={pri}
                          onClick={() => setPriority(pri)}
                          className={`flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-xs font-medium border transition-all ${
                            isSelected
                              ? `${cfg.badgeBg} ${cfg.text} ${cfg.border} ring-1 ring-current`
                              : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{pri}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Target Date & Manual/Calculated Progress Slider */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Target Completion Date</span>
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Progress Percentage</span>
                    </label>
                    <span className="text-xs font-bold text-cyan-400">
                      {milestones.length > 0 ? `${computeProgress(milestones)}% (Auto-Calculated)` : `${progress}%`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={milestones.length > 0 ? computeProgress(milestones) : progress}
                      disabled={milestones.length > 0}
                      onChange={(e) => setProgress(Number(e.target.value))}
                      className="flex-1 accent-indigo-500 cursor-pointer disabled:opacity-60"
                    />
                    <span className="text-xs font-mono bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 text-zinc-300 w-12 text-center">
                      {milestones.length > 0 ? computeProgress(milestones) : progress}%
                    </span>
                  </div>
                  {milestones.length > 0 && (
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Progress is dynamically synced with sub-milestones checklist below.
                    </p>
                  )}
                </div>
              </div>

              {/* Sub-milestones Checklist Builder */}
              <div className="border border-zinc-800/80 bg-zinc-950/60 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-indigo-400" />
                    <span>Sub-Milestones Checklist</span>
                  </span>
                  <span className="text-xs text-zinc-500">
                    {milestones.filter(m => m.completed).length} of {milestones.length} completed
                  </span>
                </div>

                {/* Add Milestone input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add milestone (e.g. Complete 50 PYQs, Notes Revision, Mock Analysis)..."
                    value={newMilestoneText}
                    onChange={(e) => setNewMilestoneText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddMilestoneToForm();
                      }
                    }}
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddMilestoneToForm}
                    disabled={!newMilestoneText.trim()}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                {/* Milestones list */}
                {milestones.length > 0 ? (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {milestones.map((m) => (
                      <div
                        key={m.id}
                        className={`flex items-center justify-between gap-2 p-2 rounded-lg border transition-all ${
                          m.completed
                            ? 'bg-indigo-500/10 border-indigo-500/30 text-zinc-300'
                            : 'bg-zinc-900/80 border-zinc-800/80 text-zinc-200'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleMilestoneInForm(m.id)}
                          className="flex items-center gap-2 text-left flex-1 min-w-0"
                        >
                          {m.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-zinc-500 shrink-0 hover:text-indigo-400" />
                          )}
                          <span className={`text-xs truncate ${m.completed ? 'line-through text-zinc-500' : ''}`}>
                            {m.text}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMilestoneInForm(m.id)}
                          className="p-1 text-zinc-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic py-1 text-center">
                    No sub-milestones yet. Add checkpoints to break down this target.
                  </p>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={handleCloseForm}
                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveGoal}
                disabled={!title.trim()}
                className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
              >
                {editingGoalId ? 'Update Target Goal' : 'Save New Goal'}
              </button>
            </div>
          </div>
        )}

        {/* Goals Grid / List */}
        <div className="grid gap-4">
          {filteredGoals.map((goal) => {
            const goalCat: GoalCategory = goal.category || 'General';
            const catConfig = CATEGORY_CONFIG[goalCat] || CATEGORY_CONFIG['General'];
            const CatIcon = catConfig.icon;

            const goalPriority: GoalPriority = goal.priority || 'Medium';
            const priorityConfig = PRIORITY_CONFIG[goalPriority] || PRIORITY_CONFIG['Medium'];
            const PriorityIcon = priorityConfig.icon;

            const goalMilestones: Milestone[] = goal.milestones || [];
            const milestoneCount = goalMilestones.length;
            const completedMilestones = goalMilestones.filter(m => m.completed).length;

            const currentProgress = goal.progress ?? (milestoneCount > 0 ? computeProgress(goalMilestones) : (goal.completed ? 100 : 0));
            const isCompleted = goal.completed || currentProgress === 100;
            const dateBadge = getTargetDateBadge(goal.targetDate);
            const isExpanded = !!expandedCards[goal.id];

            return (
              <div
                key={goal.id}
                className={`bg-zinc-900/60 backdrop-blur-md rounded-2xl border transition-all p-5 shadow-lg relative overflow-hidden ${
                  isCompleted
                    ? 'border-emerald-500/30 bg-emerald-950/10'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* Top Glowing Progress Stripe */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-800">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isCompleted 
                        ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]' 
                        : `bg-gradient-to-r ${catConfig.gradient}`
                    }`}
                    style={{ width: `${currentProgress}%` }}
                  />
                </div>

                <div className="flex flex-col gap-4">
                  {/* Goal Header: Badges & Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Category Badge */}
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${catConfig.badgeBg} ${catConfig.border} ${catConfig.text}`}>
                        <CatIcon className="w-3.5 h-3.5" />
                        <span>{catConfig.label}</span>
                      </span>

                      {/* Priority Badge */}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium border ${priorityConfig.badgeBg} ${priorityConfig.border} ${priorityConfig.text}`}>
                        <PriorityIcon className="w-3 h-3" />
                        <span>{priorityConfig.label}</span>
                      </span>

                      {/* Target Date Badge */}
                      {dateBadge && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium border ${dateBadge.color}`}>
                          <Calendar className="w-3 h-3" />
                          <span>{dateBadge.text}</span>
                        </span>
                      )}
                    </div>

                    {/* Action Buttons: Edit, Delete */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(goal)}
                        title="Edit Goal"
                        className="p-1.5 text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        title="Delete Goal"
                        className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Goal Content: Title, Description & Main Toggle */}
                  <div className="flex items-start gap-3.5">
                    <button
                      onClick={() => handleToggleComplete(goal)}
                      title={isCompleted ? "Mark as Active" : "Mark as Completed"}
                      className={`mt-0.5 flex-shrink-0 transition-transform active:scale-90 ${
                        isCompleted ? 'text-emerald-400 hover:text-emerald-300' : 'text-zinc-500 hover:text-indigo-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 fill-emerald-500/20" />
                      ) : (
                        <Circle className="w-6 h-6" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0 space-y-1">
                      <h3 className={`text-base sm:text-lg font-semibold tracking-tight transition-all ${
                        isCompleted ? 'text-zinc-400 line-through' : 'text-zinc-100'
                      }`}>
                        {goal.title}
                      </h3>

                      {goal.description && (
                        <p className={`text-xs sm:text-sm whitespace-pre-wrap leading-relaxed ${
                          isCompleted ? 'text-zinc-500' : 'text-zinc-400'
                        }`}>
                          {goal.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar & Slider Controls */}
                  <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-zinc-400 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Completion Progress</span>
                      </span>
                      <div className="flex items-center gap-2">
                        {milestoneCount > 0 && (
                          <span className="text-[11px] text-zinc-400">
                            {completedMilestones}/{milestoneCount} milestones
                          </span>
                        )}
                        <span className={`font-bold font-mono px-2 py-0.5 rounded-md ${
                          isCompleted ? 'bg-emerald-500/20 text-emerald-300' : 'bg-indigo-500/20 text-indigo-300'
                        }`}>
                          {currentProgress}%
                        </span>
                      </div>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isCompleted
                            ? 'bg-emerald-500'
                            : `bg-gradient-to-r ${catConfig.gradient}`
                        }`}
                        style={{ width: `${currentProgress}%` }}
                      />
                    </div>

                    {/* If no sub-milestones, allow direct slider control */}
                    {milestoneCount === 0 && (
                      <div className="pt-1 flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500">Adjust:</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={currentProgress}
                          onChange={(e) => handleSliderProgressChange(goal, Number(e.target.value))}
                          className="flex-1 accent-indigo-500 h-1.5 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>

                  {/* Sub-Milestones Section */}
                  <div className="border-t border-zinc-800/80 pt-3">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => toggleCardExpansion(goal.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-indigo-400 transition-colors"
                      >
                        <CheckSquare className="w-4 h-4 text-indigo-400" />
                        <span>Milestones & Checkpoints ({milestoneCount})</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {milestoneCount > 0 && !isExpanded && (
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                          <span>{completedMilestones}/{milestoneCount} checked</span>
                        </div>
                      )}
                    </div>

                    {/* Collapsible / Expandable Milestones Area */}
                    {isExpanded && (
                      <div className="mt-3 space-y-2 animate-in fade-in duration-150">
                        {/* Milestone Items */}
                        {goalMilestones.length > 0 ? (
                          <div className="space-y-1.5">
                            {goalMilestones.map((m) => (
                              <div
                                key={m.id}
                                className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition-all text-xs ${
                                  m.completed
                                    ? 'bg-emerald-500/5 border-emerald-500/20 text-zinc-400'
                                    : 'bg-zinc-950/80 border-zinc-800 text-zinc-200 hover:border-zinc-700'
                                }`}
                              >
                                <button
                                  onClick={() => handleToggleCardMilestone(goal, m.id)}
                                  className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
                                >
                                  {m.completed ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-zinc-500 shrink-0 hover:text-indigo-400" />
                                  )}
                                  <span className={`truncate ${m.completed ? 'line-through text-zinc-500' : ''}`}>
                                    {m.text}
                                  </span>
                                </button>
                                <button
                                  onClick={() => handleDeleteCardMilestone(goal, m.id)}
                                  title="Delete Milestone"
                                  className="p-1 text-zinc-500 hover:text-rose-400 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-500 italic py-1">
                            No milestones added yet. Add a quick milestone below!
                          </p>
                        )}

                        {/* Quick-add milestone input on card */}
                        <div className="flex gap-2 pt-1">
                          <input
                            type="text"
                            placeholder="Add sub-milestone (e.g. Formula Sheet review, Solved HC Verma Exercise 2)..."
                            value={quickMilestoneInputs[goal.id] || ''}
                            onChange={(e) => setQuickMilestoneInputs(prev => ({ ...prev, [goal.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCardMilestone(goal);
                              }
                            }}
                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            onClick={() => handleAddCardMilestone(goal)}
                            disabled={!quickMilestoneInputs[goal.id]?.trim()}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors shrink-0 flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Empty State */}
          {filteredGoals.length === 0 && !isFormOpen && (
            <div className="text-center py-16 px-4 bg-zinc-900/30 border border-zinc-800/60 rounded-2xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mx-auto text-zinc-400">
                <Target className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-zinc-200">No matching goals found</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  {goals.length === 0 
                    ? 'Start organizing your JEE / STEM mastery roadmap with milestone breakdowns.' 
                    : 'Try clearing your category or search filters to see all goals.'}
                </p>
              </div>
              {goals.length === 0 ? (
                <button
                  onClick={handleOpenCreate}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create First Goal
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedStatus('All');
                    setSelectedPriority('All');
                    setSearchQuery('');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-xl transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
