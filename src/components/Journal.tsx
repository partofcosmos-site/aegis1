import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { format } from 'date-fns';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Search, 
  Tag, 
  Filter, 
  Calendar, 
  Sparkles, 
  Zap, 
  BookOpen, 
  Copy, 
  CheckCheck, 
  Clock, 
  Trophy, 
  AlertTriangle, 
  Lightbulb, 
  ListTodo, 
  Smile, 
  Meh, 
  Frown, 
  BatteryCharging, 
  TrendingUp, 
  Share2, 
  Bookmark,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export interface JournalReflection {
  id: string;
  title: string;
  date: string; // yyyy-MM-dd
  mood?: number; // 1 - 5
  energy?: number; // 1 - 5
  tags?: string[];
  wins?: string;
  struggles?: string;
  insights?: string;
  priorities?: string;
  content?: string; // Legacy / freeform notes
  createdAt?: string;
  updatedAt?: string;
}

const MOOD_OPTIONS = [
  { 
    level: 5, 
    label: 'Victorious / Flow', 
    sublabel: 'Crushed all targets & peak focus',
    icon: Smile, 
    emoji: '😄', 
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30 ring-emerald-500' 
  },
  { 
    level: 4, 
    label: 'Good / Focused', 
    sublabel: 'Solid study rhythm & momentum',
    icon: Smile, 
    emoji: '😊', 
    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30 ring-indigo-500' 
  },
  { 
    level: 3, 
    label: 'Neutral / Steady', 
    sublabel: 'Standard routine & moderate pace',
    icon: Meh, 
    emoji: '😐', 
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/30 ring-blue-500' 
  },
  { 
    level: 2, 
    label: 'Fatigued / Stressed', 
    sublabel: 'Encountered friction or brain fog',
    icon: Frown, 
    emoji: '😓', 
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30 ring-amber-500' 
  },
  { 
    level: 1, 
    label: 'Burned Out / Low', 
    sublabel: 'Depleted stamina, needed recovery',
    icon: Frown, 
    emoji: '😫', 
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/30 ring-rose-500' 
  }
];

const ENERGY_OPTIONS = [
  { level: 5, label: '100% Hypercharged', bars: 5, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  { level: 4, label: '80% High Energy', bars: 4, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
  { level: 3, label: '60% Moderate', bars: 3, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
  { level: 2, label: '40% Low Battery', bars: 2, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { level: 1, label: '20% Drained', bars: 1, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
];

const PRESET_TAGS = [
  'Physics',
  'Math',
  'Chemistry',
  'Mock Analysis',
  'Breakthrough',
  'Revision',
  'PYQ Marathon',
  'Formula Insights',
  'Mindset & Focus',
  'Deep Work'
];

export const Journal = () => {
  const { user, journalEntries, addJournalEntry, updateJournalEntry, deleteJournalEntry } = useAppContext();

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Structured Editor Fields
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [mood, setMood] = useState<number>(4);
  const [energy, setEnergy] = useState<number>(4);
  const [wins, setWins] = useState('');
  const [struggles, setStruggles] = useState('');
  const [insights, setInsights] = useState('');
  const [priorities, setPriorities] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'mood' | 'energy'>('newest');

  // Copy notification state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Open Form for New Entry
  const handleOpenNew = () => {
    setEditingId(null);
    setTitle('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setMood(4);
    setEnergy(4);
    setWins('');
    setStruggles('');
    setInsights('');
    setPriorities('');
    setNotes('');
    setTags(['Deep Work']);
    setTagInput('');
    setIsFormOpen(true);
  };

  // Open Form for Editing
  const handleOpenEdit = (entry: any) => {
    setEditingId(entry.id);
    setTitle(entry.title || '');
    setDate(entry.date || format(new Date(), 'yyyy-MM-dd'));
    setMood(entry.mood || 4);
    setEnergy(entry.energy || 4);
    setWins(entry.wins || '');
    setStruggles(entry.struggles || '');
    setInsights(entry.insights || '');
    setPriorities(entry.priorities || '');
    setNotes(entry.notes || entry.content || '');
    setTags(entry.tags || []);
    setTagInput('');
    setIsFormOpen(true);
  };

  // Close Form
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
  };

  // Add Tag
  const handleAddTag = (tagToAdd?: string) => {
    const rawTag = tagToAdd || tagInput;
    const cleanTag = rawTag.trim().replace(/^#+/, '');
    if (!cleanTag) return;
    if (!tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
    }
    if (!tagToAdd) setTagInput('');
  };

  // Remove Tag
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Save / Update Entry
  const handleSaveEntry = async () => {
    if (!user) return;
    
    // Auto-generate title if empty
    const resolvedTitle = title.trim() || `Daily Reflection (${date})`;

    const entryData = {
      title: resolvedTitle.substring(0, 199),
      date: date.trim(),
      mood,
      energy,
      wins: wins.trim().substring(0, 9999),
      struggles: struggles.trim().substring(0, 9999),
      insights: insights.trim().substring(0, 9999),
      priorities: priorities.trim().substring(0, 9999),
      notes: notes.trim().substring(0, 9999),
      content: [wins, struggles, insights, priorities, notes].filter(Boolean).join('\n\n').substring(0, 9999),
      tags,
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingId) {
        await updateJournalEntry(editingId, entryData);
      } else {
        await addJournalEntry(entryData);
      }
      handleCloseForm();
    } catch (error) {
      console.error('Error saving journal entry:', error);
    }
  };

  // Delete Entry
  const handleDeleteEntry = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this journal entry?')) {
      try {
        await deleteJournalEntry(id);
      } catch (error) {
        console.error('Error deleting journal entry:', error);
      }
    }
  };

  // Copy entry as markdown summary
  const handleCopyMarkdown = async (entry: any) => {
    const md = [
      `# ${entry.title || 'Daily Reflection'} - ${entry.date}`,
      `**Mood:** ${entry.mood || 3}/5 | **Energy:** ${entry.energy || 3}/5`,
      entry.tags?.length ? `**Tags:** ${entry.tags.map((t: string) => `#${t}`).join(' ')}` : '',
      entry.wins ? `\n### 🏆 Wins of the Day\n${entry.wins}` : '',
      entry.struggles ? `\n### ⚡ Struggles & Bottlenecks\n${entry.struggles}` : '',
      entry.insights ? `\n### 💡 Key Insights Learned\n${entry.insights}` : '',
      entry.priorities ? `\n### 🎯 Tomorrow's Top 3 Priorities\n${entry.priorities}` : '',
      (entry.notes || entry.content) ? `\n### 📝 Notes & Reflections\n${entry.notes || entry.content}` : '',
    ].filter(Boolean).join('\n');

    try {
      await navigator.clipboard.writeText(md);
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.error('Clipboard copy failed:', e);
    }
  };

  // Extract all unique tags across entries
  const allUniqueTags = useMemo(() => {
    const set = new Set<string>();
    journalEntries.forEach((entry: any) => {
      (entry.tags || []).forEach((t: string) => set.add(t));
    });
    return Array.from(set);
  }, [journalEntries]);

  // Filter & Sort Entries
  const filteredEntries = useMemo(() => {
    return journalEntries.filter((entry: any) => {
      // Tag filter
      if (selectedTag !== 'All' && !(entry.tags || []).includes(selectedTag)) {
        return false;
      }
      // Mood filter
      if (selectedMoodFilter !== 'All' && Number(entry.mood || 3) !== Number(selectedMoodFilter)) {
        return false;
      }
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = entry.title?.toLowerCase().includes(q);
        const matchesWins = entry.wins?.toLowerCase().includes(q);
        const matchesStruggles = entry.struggles?.toLowerCase().includes(q);
        const matchesInsights = entry.insights?.toLowerCase().includes(q);
        const matchesPriorities = entry.priorities?.toLowerCase().includes(q);
        const matchesNotes = (entry.notes || entry.content || '')?.toLowerCase().includes(q);
        const matchesTags = (entry.tags || []).some((t: string) => t.toLowerCase().includes(q));

        if (!matchesTitle && !matchesWins && !matchesStruggles && !matchesInsights && !matchesPriorities && !matchesNotes && !matchesTags) {
          return false;
        }
      }
      return true;
    }).sort((a: any, b: any) => {
      if (sortBy === 'mood') {
        return (b.mood || 3) - (a.mood || 3);
      }
      if (sortBy === 'energy') {
        return (b.energy || 3) - (a.energy || 3);
      }
      if (sortBy === 'oldest') {
        return new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
      }
      // Default: newest date
      return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
    });
  }, [journalEntries, selectedTag, selectedMoodFilter, searchQuery, sortBy]);

  // Stats calculation
  const totalEntriesCount = journalEntries.length;
  const avgMood = totalEntriesCount > 0
    ? (journalEntries.reduce((acc: number, e: any) => acc + (e.mood || 3), 0) / totalEntriesCount).toFixed(1)
    : '0.0';
  const avgEnergy = totalEntriesCount > 0
    ? (journalEntries.reduce((acc: number, e: any) => acc + (e.energy || 3), 0) / totalEntriesCount).toFixed(1)
    : '0.0';

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const hasLoggedToday = journalEntries.some((e: any) => e.date === todayStr);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-zinc-950 text-zinc-100">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                  Daily Reflections & Mindset Journal
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                  Record breakthrough wins, debug bottlenecks, track daily mood/energy, and set tomorrow's top 3 priorities.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleOpenNew}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Reflection</span>
          </button>
        </div>

        {/* Stats & Today's Reminder Card */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Reflections</p>
              <p className="text-2xl sm:text-3xl font-bold text-zinc-100 mt-1">{totalEntriesCount}</p>
            </div>
            <div className="p-3 bg-zinc-800/80 rounded-xl text-zinc-400 border border-zinc-700/50">
              <Bookmark className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Avg Mood</p>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-400 mt-1 flex items-center gap-1">
                <span>{avgMood}</span>
                <span className="text-xs text-zinc-500 font-normal">/ 5.0</span>
              </p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <Smile className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-lg">
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Avg Energy</p>
              <p className="text-2xl sm:text-3xl font-bold text-cyan-400 mt-1 flex items-center gap-1">
                <span>{avgEnergy}</span>
                <span className="text-xs text-zinc-500 font-normal">/ 5.0</span>
              </p>
            </div>
            <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/20">
              <Zap className="w-5 h-5" />
            </div>
          </div>

          <div className={`backdrop-blur-md border rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-lg transition-all ${
            hasLoggedToday
              ? 'bg-emerald-950/20 border-emerald-500/30'
              : 'bg-indigo-950/20 border-indigo-500/30'
          }`}>
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Today's Log</p>
              <p className={`text-base sm:text-lg font-bold mt-1 ${hasLoggedToday ? 'text-emerald-400' : 'text-indigo-400'}`}>
                {hasLoggedToday ? 'Completed ✨' : 'Pending ⏳'}
              </p>
            </div>
            {!hasLoggedToday && (
              <button
                onClick={handleOpenNew}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg shadow transition-colors"
              >
                Log Now
              </button>
            )}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-4 space-y-4">
          
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search wins, bottlenecks, insights, priorities or tags..."
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

            {/* Mood & Sorting Dropdowns */}
            <div className="flex items-center gap-2">
              <select
                value={selectedMoodFilter}
                onChange={(e) => setSelectedMoodFilter(e.target.value)}
                className="bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Moods</option>
                <option value="5">😄 Flow / 5★</option>
                <option value="4">😊 Good / 4★</option>
                <option value="3">😐 Steady / 3★</option>
                <option value="2">😓 Fatigued / 2★</option>
                <option value="1">😫 Low / 1★</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="newest">Sort: Newest Date</option>
                <option value="oldest">Sort: Oldest Date</option>
                <option value="mood">Sort: Highest Mood</option>
                <option value="energy">Sort: Highest Energy</option>
              </select>
            </div>
          </div>

          {/* Tag Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-zinc-500 flex items-center gap-1 shrink-0 font-medium mr-1">
              <Tag className="w-3.5 h-3.5" /> Tag:
            </span>

            <button
              onClick={() => setSelectedTag('All')}
              className={`px-3 py-1.5 rounded-xl border transition-all shrink-0 font-medium ${
                selectedTag === 'All'
                  ? 'bg-zinc-100 text-zinc-900 border-zinc-100 shadow-sm'
                  : 'bg-zinc-950/60 text-zinc-400 border-zinc-800/80 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              All Tags ({journalEntries.length})
            </button>

            {allUniqueTags.map((tag) => {
              const isSelected = selectedTag === tag;
              const count = journalEntries.filter((e: any) => (e.tags || []).includes(tag)).length;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all shrink-0 font-medium ${
                    isSelected
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 ring-1 ring-indigo-500/40'
                      : 'bg-zinc-950/60 text-zinc-400 border-zinc-800/80 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <span>#{tag}</span>
                  <span className="opacity-70 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Reflection Editor Modal / Card */}
        {isFormOpen && (
          <div className="bg-zinc-900/90 backdrop-blur-xl p-6 rounded-2xl border border-indigo-500/30 shadow-2xl shadow-indigo-950/40 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <span>{editingId ? 'Edit Daily Reflection' : 'New Daily Reflection & Mindset Check-In'}</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Calibrate your daily progress, mental state, and strategic focus for the next study day.
                </p>
              </div>
              <button
                onClick={handleCloseForm}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Core Metadata: Title, Date, Mood & Energy */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Title */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Reflection Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mastered Rotational Dynamics & 3-Hour Problem Block"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Reflection Date</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Mood & Energy Pickers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Mood Rating (1-5) */}
                <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Smile className="w-4 h-4 text-emerald-400" />
                      <span>Mood & Mindset State (1-5)</span>
                    </label>
                    <span className="text-xs font-bold text-emerald-400">
                      {MOOD_OPTIONS.find(m => m.level === mood)?.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    {MOOD_OPTIONS.map((opt) => {
                      const isSelected = mood === opt.level;
                      return (
                        <button
                          type="button"
                          key={opt.level}
                          onClick={() => setMood(opt.level)}
                          className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center ${
                            isSelected
                              ? `${opt.color} ring-2 ring-indigo-500/40 shadow-lg scale-105`
                              : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                          }`}
                        >
                          <span className="text-xl mb-1">{opt.emoji}</span>
                          <span className="text-[10px] font-bold">{opt.level}★</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Energy Rating (1-5) */}
                <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-cyan-400" />
                      <span>Stamina & Energy Level (1-5)</span>
                    </label>
                    <span className="text-xs font-bold text-cyan-400">
                      {ENERGY_OPTIONS.find(e => e.level === energy)?.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    {ENERGY_OPTIONS.map((opt) => {
                      const isSelected = energy === opt.level;
                      return (
                        <button
                          type="button"
                          key={opt.level}
                          onClick={() => setEnergy(opt.level)}
                          className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center ${
                            isSelected
                              ? `${opt.color} ring-2 ring-cyan-500/40 shadow-lg scale-105`
                              : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                          }`}
                        >
                          <div className="flex items-center gap-0.5 mb-1">
                            {Array.from({ length: opt.bars }).map((_, i) => (
                              <span key={i} className="text-xs font-bold text-amber-400">⚡</span>
                            ))}
                          </div>
                          <span className="text-[10px] font-bold">{opt.level} / 5</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Tags Selector */}
              <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80 space-y-2.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Tags & Topics</span>
                </label>

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_TAGS.map((pt) => {
                    const isAdded = tags.includes(pt);
                    return (
                      <button
                        type="button"
                        key={pt}
                        onClick={() => isAdded ? handleRemoveTag(pt) : handleAddTag(pt)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                          isAdded
                            ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 font-semibold'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                        }`}
                      >
                        {isAdded ? `✓ #${pt}` : `+ #${pt}`}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Tag Input */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add custom tag (e.g. Electromagnetism, Mock Test 4)..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTag()}
                    disabled={!tagInput.trim()}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    Add Tag
                  </button>
                </div>

                {/* Current Active Tags */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-500/10 border border-indigo-500/30 text-indigo-300"
                      >
                        <span>#{t}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(t)}
                          className="hover:text-rose-400 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Four Core Reflection Prompts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Wins of the Day */}
                <div className="bg-zinc-950/60 p-4 rounded-xl border border-emerald-500/20 space-y-2">
                  <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-emerald-400" />
                    <span>1. Wins of the Day</span>
                  </label>
                  <p className="text-[11px] text-zinc-500">
                    What breakthrough problems did you crack? What study streaks did you maintain?
                  </p>
                  <textarea
                    placeholder="e.g. Solved 25 hard Irodov mechanics problems without checking hints. Finally understood Doppler effect formulas with zero confusion..."
                    value={wins}
                    onChange={(e) => setWins(e.target.value)}
                    className="w-full h-28 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
                  />
                </div>

                {/* 2. Struggles & Bottlenecks */}
                <div className="bg-zinc-950/60 p-4 rounded-xl border border-amber-500/20 space-y-2">
                  <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>2. Struggles & Bottlenecks</span>
                  </label>
                  <p className="text-[11px] text-zinc-500">
                    Where did you lose focus or get stuck? What topics need urgent reinforcement?
                  </p>
                  <textarea
                    placeholder="e.g. Struggled with organic reaction mechanisms in Aldehydes & Ketones. Lost 30 mins to phone distractions in the afternoon..."
                    value={struggles}
                    onChange={(e) => setStruggles(e.target.value)}
                    className="w-full h-28 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
                  />
                </div>

                {/* 3. Key Insights Learned */}
                <div className="bg-zinc-950/60 p-4 rounded-xl border border-indigo-500/20 space-y-2">
                  <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-indigo-400" />
                    <span>3. Key Insights Learned</span>
                  </label>
                  <p className="text-[11px] text-zinc-500">
                    Formulas, shortcuts, mental models, or strategic lessons discovered today.
                  </p>
                  <textarea
                    placeholder="e.g. In rolling without slipping problems, always take torque about the instantaneous axis of rotation to eliminate friction force..."
                    value={insights}
                    onChange={(e) => setInsights(e.target.value)}
                    className="w-full h-28 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                  />
                </div>

                {/* 4. Tomorrow's Top 3 Priorities */}
                <div className="bg-zinc-950/60 p-4 rounded-xl border border-cyan-500/20 space-y-2">
                  <label className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ListTodo className="w-4 h-4 text-cyan-400" />
                    <span>4. Tomorrow's Top 3 Priorities</span>
                  </label>
                  <p className="text-[11px] text-zinc-500">
                    The 3 non-negotiable study missions to crush tomorrow.
                  </p>
                  <textarea
                    placeholder="1. Finish Organic Chemistry reaction flowcharts (2h)&#10;2. Complete 40 Calculus PYQs on Definite Integrals (3h)&#10;3. Full Mock Test Analysis & error log entry (2h)"
                    value={priorities}
                    onChange={(e) => setPriorities(e.target.value)}
                    className="w-full h-28 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500 resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Freeform Notes / Additional Thoughts */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Additional Notes, Formulas or Mindset Thoughts (Optional)
                </label>
                <textarea
                  placeholder="Any other observations, exam count thoughts, health & sleep notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-20 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                />
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
                onClick={handleSaveEntry}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
              >
                {editingId ? 'Update Reflection' : 'Save Daily Reflection'}
              </button>
            </div>
          </div>
        )}

        {/* Reflection Cards Feed */}
        <div className="space-y-4">
          {filteredEntries.map((entry: any) => {
            const entryMood = MOOD_OPTIONS.find(m => m.level === entry.mood) || MOOD_OPTIONS[2];
            const entryEnergy = ENERGY_OPTIONS.find(e => e.level === entry.energy) || ENERGY_OPTIONS[2];
            const isCopied = copiedId === entry.id;

            return (
              <div
                key={entry.id}
                className="bg-zinc-900/60 backdrop-blur-md rounded-2xl border border-zinc-800/80 hover:border-zinc-700/80 transition-all p-5 sm:p-6 shadow-lg space-y-4 relative"
              >
                {/* Header: Title, Date, Badges & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-zinc-100">
                      {entry.title || 'Daily Reflection'}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1.5 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{entry.date}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Mood Badge */}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border ${entryMood.color}`}>
                      <span>{entryMood.emoji}</span>
                      <span>Mood: {entryMood.level}/5</span>
                    </span>

                    {/* Energy Badge */}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border ${entryEnergy.color}`}>
                      <Zap className="w-3.5 h-3.5" />
                      <span>Energy: {entryEnergy.level}/5</span>
                    </span>

                    {/* Action Controls: Copy, Edit, Delete */}
                    <div className="flex items-center gap-1 pl-2 border-l border-zinc-800">
                      <button
                        onClick={() => handleCopyMarkdown(entry)}
                        title="Copy as Markdown"
                        className="p-1.5 text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        {isCopied ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleOpenEdit(entry)}
                        title="Edit Entry"
                        className="p-1.5 text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        title="Delete Entry"
                        className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {entry.tags.map((t: string) => (
                      <button
                        key={t}
                        onClick={() => setSelectedTag(t)}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20 transition-colors"
                      >
                        #{t}
                      </button>
                    ))}
                  </div>
                )}

                {/* Structured Prompts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Wins */}
                  {entry.wins && (
                    <div className="bg-emerald-950/10 border border-emerald-500/20 p-3.5 rounded-xl space-y-1">
                      <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5" />
                        <span>Wins of the Day</span>
                      </p>
                      <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                        {entry.wins}
                      </p>
                    </div>
                  )}

                  {/* Struggles */}
                  {entry.struggles && (
                    <div className="bg-amber-950/10 border border-amber-500/20 p-3.5 rounded-xl space-y-1">
                      <p className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Struggles & Bottlenecks</span>
                      </p>
                      <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                        {entry.struggles}
                      </p>
                    </div>
                  )}

                  {/* Key Insights */}
                  {entry.insights && (
                    <div className="bg-indigo-950/10 border border-indigo-500/20 p-3.5 rounded-xl space-y-1">
                      <p className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span>Key Insights Learned</span>
                      </p>
                      <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                        {entry.insights}
                      </p>
                    </div>
                  )}

                  {/* Priorities */}
                  {entry.priorities && (
                    <div className="bg-cyan-950/10 border border-cyan-500/20 p-3.5 rounded-xl space-y-1">
                      <p className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                        <ListTodo className="w-3.5 h-3.5" />
                        <span>Tomorrow's Top 3 Priorities</span>
                      </p>
                      <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                        {entry.priorities}
                      </p>
                    </div>
                  )}
                </div>

                {/* Freeform Notes or Legacy Content */}
                {(entry.notes || (entry.content && !entry.wins && !entry.struggles && !entry.insights && !entry.priorities)) && (
                  <div className="bg-zinc-950/60 border border-zinc-800/80 p-3.5 rounded-xl space-y-1">
                    <p className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Notes & Freeform Thoughts</span>
                    </p>
                    <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                      {entry.notes || entry.content}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty State */}
          {filteredEntries.length === 0 && !isFormOpen && (
            <div className="text-center py-16 px-4 bg-zinc-900/30 border border-zinc-800/60 rounded-2xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mx-auto text-zinc-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-zinc-200">No reflections found</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  {journalEntries.length === 0
                    ? 'Start tracking your daily wins, bottlenecks, mindset, and tomorrow priorities.'
                    : 'Try clearing your search query or tag filter to view all reflections.'}
                </p>
              </div>
              {journalEntries.length === 0 ? (
                <button
                  onClick={handleOpenNew}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Write First Reflection
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSelectedTag('All');
                    setSelectedMoodFilter('All');
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
