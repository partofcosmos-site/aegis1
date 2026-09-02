import React, { useState, useEffect, useMemo } from 'react';
import {
  School, Calendar, Award, Sparkles, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle2, Clock, ShieldAlert, FileText, Copy,
  ExternalLink, Plus, Trash2, Edit3, Save, X, ChevronDown, ChevronUp,
  BookOpen, Filter, Search, Check, RefreshCw, Sliders, Info, Scale, ArrowRight,
  Compass
} from 'lucide-react';
import clsx from 'clsx';
import {
  InstitutionalAttendanceState,
  AbsenceEntry,
  AbsenceCategory,
  HolidayEntry,
  VacationEntry,
  ExamMilestone,
  SubjectAttendance,
} from '../types/attendance';
import {
  loadInstitutionalState,
  saveInstitutionalState,
  computeLiveMetrics,
  simulateAttendanceScenario,
  generateGeminiRegulatoryPrompt,
  launchGeminiRegulator,
  DEFAULT_INITIAL_STATE
} from '../services/attendanceRegulatorService';
import { WidgetSyncService } from '../services/widgetSyncService';
import { useAppContext } from '../context/AppContext';

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; ring: string }> = {
  indigo:  { bg: 'bg-indigo-500/10',  border: 'border-indigo-500/30',  text: 'text-indigo-400',  ring: 'ring-indigo-500/40' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', ring: 'ring-emerald-500/40' },
  rose:    { bg: 'bg-rose-500/10',    border: 'border-rose-500/30',    text: 'text-rose-400',    ring: 'ring-rose-500/40' },
  amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   text: 'text-amber-400',   ring: 'ring-amber-500/40' },
  sky:     { bg: 'bg-sky-500/10',     border: 'border-sky-500/30',     text: 'text-sky-400',     ring: 'ring-sky-500/40' },
  purple:  { bg: 'bg-purple-500/10',  border: 'border-purple-500/30',  text: 'text-purple-400',  ring: 'ring-purple-500/40' },
  orange:  { bg: 'bg-orange-500/10',  border: 'border-orange-500/30',  text: 'text-orange-400',  ring: 'ring-orange-500/40' },
  teal:    { bg: 'bg-teal-500/10',    border: 'border-teal-500/30',    text: 'text-teal-400',    ring: 'ring-teal-500/40' },
};

type ActiveTab = 'overview' | 'calendar' | 'absences' | 'subjects' | 'ai_regulator';

export const AttendanceTracker: React.FC = () => {
  const { user, isGuest } = useAppContext();
  const userIdentifier = user?.email || (isGuest ? 'guest' : undefined);

  const [state, setState] = useState<InstitutionalAttendanceState>(() => loadInstitutionalState(userIdentifier));
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reload state if active account changes (e.g. login/logout)
  useEffect(() => {
    setState(loadInstitutionalState(userIdentifier));
  }, [userIdentifier]);

  // Reality Math Simulator State
  const [simLeaves, setSimLeaves] = useState<number>(0);
  const [simAttended, setSimAttended] = useState<number>(0);

  // Calendar search & filter state
  const [holidayFilter, setHolidayFilter] = useState<string>('all');
  const [holidaySearch, setHolidaySearch] = useState<string>('');

  // Absence ledger filter & search
  const [absenceCategoryFilter, setAbsenceCategoryFilter] = useState<string>('all');
  const [absenceSearch, setAbsenceSearch] = useState<string>('');
  const [isAddingAbsence, setIsAddingAbsence] = useState<boolean>(false);
  const [newAbsDate, setNewAbsDate] = useState<string>('2026-09-02');
  const [newAbsReason, setNewAbsReason] = useState<string>('');
  const [newAbsCategory, setNewAbsCategory] = useState<AbsenceCategory>('self_study');
  const [newAbsIsPractical, setNewAbsIsPractical] = useState<boolean>(false);

  // Subject micro-tracker state
  const [isAddingSubject, setIsAddingSubject] = useState<boolean>(false);
  const [editingSubjId, setEditingSubjId] = useState<string | null>(null);
  const [expandedSubjId, setExpandedSubjId] = useState<string | null>(null);
  const [newSubjName, setNewSubjName] = useState<string>('');
  const [newSubjCode, setNewSubjCode] = useState<string>('');
  const [newSubjAttended, setNewSubjAttended] = useState<string>('48');
  const [newSubjTotal, setNewSubjTotal] = useState<string>('71');
  const [newSubjReq, setNewSubjReq] = useState<string>('75');
  const [newSubjColor, setNewSubjColor] = useState<string>('indigo');
  const [newSubjIsPractical, setNewSubjIsPractical] = useState<boolean>(true);

  // Subject edit form
  const [editSubjForm, setEditSubjForm] = useState<{
    name: string;
    code: string;
    attended: number;
    total: number;
    required: number;
    color: string;
    isPracticalSubject: boolean;
  }>({
    name: '',
    code: '',
    attended: 48,
    total: 71,
    required: 75,
    color: 'indigo',
    isPracticalSubject: false
  });

  // AI Regulator Custom Directive
  const [customAIQuery, setCustomAIQuery] = useState<string>('');
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  // Save to storage on changes and sync to Native Android/iOS Widget
  useEffect(() => {
    saveInstitutionalState(state, userIdentifier);
    const m = computeLiveMetrics(state);
    WidgetSyncService.syncToNativeWidget({
      effectivePct: m.effectivePct,
      safeLeaves75: m.safeLeaves75,
      safeLeaves60: m.safeLeaves60
    });
  }, [state, userIdentifier]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Compute live metrics
  const metrics = useMemo(() => computeLiveMetrics(state), [state]);

  // Simulation projection
  const simulation = useMemo(() => {
    return simulateAttendanceScenario(state, simLeaves, simAttended);
  }, [state, simLeaves, simAttended]);

  // Handle Launching Gemini AI Regulator
  const handleLaunchGemini = async () => {
    const res = await launchGeminiRegulator(state, customAIQuery);
    showToast(res.message);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 5000);
  };

  // Handle Copy Payload Only
  const handleCopyPayload = async () => {
    const payload = generateGeminiRegulatoryPrompt(state, customAIQuery);
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(payload);
        setCopiedSuccess(true);
        showToast('✅ Structured AI Regulatory Payload copied to clipboard!');
        setTimeout(() => setCopiedSuccess(false), 4000);
      }
    } catch {
      showToast('⚠️ Unable to write to clipboard directly. Please copy from the dossier below.');
    }
  };

  // Add new absence
  const handleAddAbsence = () => {
    if (!newAbsReason.trim() || !newAbsDate) return;
    const dateObj = new Date(newAbsDate + 'T00:00:00');
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = days[dateObj.getDay()] || 'Weekday';

    const newEntry: AbsenceEntry = {
      id: `abs_${Date.now()}`,
      date: newAbsDate,
      dayOfWeek,
      reason: newAbsReason.trim(),
      category: newAbsCategory,
      isPracticalDay: newAbsIsPractical,
      notes: `Logged manually via Attendance Tracker`
    };

    setState(prev => {
      const updatedAbsences = [newEntry, ...prev.absences];
      const updatedProfile = {
        ...prev.profile,
        absentDays: prev.profile.absentDays + 1,
        workingDaysHeld: prev.profile.workingDaysHeld + 1
      };
      return {
        ...prev,
        profile: updatedProfile,
        absences: updatedAbsences
      };
    });

    setNewAbsReason('');
    setIsAddingAbsence(false);
    showToast(`Logged absence for ${newAbsDate}`);
  };

  // Remove absence
  const handleDeleteAbsence = (id: string) => {
    setState(prev => ({
      ...prev,
      absences: prev.absences.filter(a => a.id !== id),
      profile: {
        ...prev.profile,
        absentDays: Math.max(0, prev.profile.absentDays - 1)
      }
    }));
    showToast('Absence record removed.');
  };

  // Add Subject
  const handleAddSubject = () => {
    if (!newSubjName.trim()) return;
    const att = Math.max(0, parseInt(newSubjAttended) || 0);
    const tot = Math.max(att, parseInt(newSubjTotal) || 0);
    const req = Math.min(100, Math.max(1, parseInt(newSubjReq) || 75));

    const newSubject: SubjectAttendance = {
      id: `subj_${Date.now()}`,
      code: newSubjCode.trim() || undefined,
      name: newSubjName.trim(),
      attended: att,
      total: tot,
      required: req,
      color: newSubjColor,
      isPracticalSubject: newSubjIsPractical
    };

    setState(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        subjects: [...prev.profile.subjects, newSubject]
      }
    }));

    setNewSubjName('');
    setNewSubjCode('');
    setIsAddingSubject(false);
    showToast(`Added subject ${newSubject.name}`);
  };

  // Save Subject Edit
  const handleSaveSubjectEdit = (id: string) => {
    setState(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        subjects: prev.profile.subjects.map(s => {
          if (s.id !== id) return s;
          const att = Math.max(0, Math.round(Number(editSubjForm.attended)) || 0);
          const tot = Math.max(att, Math.round(Number(editSubjForm.total)) || 0);
          return {
            ...s,
            name: editSubjForm.name.trim() || s.name,
            code: editSubjForm.code.trim() || s.code,
            attended: att,
            total: tot,
            required: Math.min(100, Math.max(1, Math.round(Number(editSubjForm.required)) || 75)),
            color: editSubjForm.color,
            isPracticalSubject: editSubjForm.isPracticalSubject
          };
        })
      }
    }));
    setEditingSubjId(null);
    showToast('Subject updated successfully.');
  };

  // Delete Subject
  const handleDeleteSubject = (id: string) => {
    if (window.confirm('Remove this subject from tracker?')) {
      setState(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          subjects: prev.profile.subjects.filter(s => s.id !== id)
        }
      }));
      showToast('Subject removed.');
    }
  };

  // Reset to default ground truth
  const handleResetToGroundTruth = () => {
    if (window.confirm('Reset all attendance data back to verified institutional ground truth (Bandhan School, 71 held, 48 attended, 10 on-duty, 28 holidays)?')) {
      setState(DEFAULT_INITIAL_STATE);
      showToast('Reset to verified ground truth.');
    }
  };

  // Filtered holidays
  const filteredHolidays = useMemo(() => {
    return state.holidays.filter(h => {
      const matchesFilter = holidayFilter === 'all' ||
        (holidayFilter === 'National' && h.classification.includes('National')) ||
        (holidayFilter === 'Gazetted' && h.classification.includes('Gazetted')) ||
        (holidayFilter === 'State' && h.classification.includes('State')) ||
        (holidayFilter === 'Festive' && h.classification.includes('Festive'));

      const matchesSearch = !holidaySearch.trim() ||
        h.name.toLowerCase().includes(holidaySearch.toLowerCase()) ||
        h.date.includes(holidaySearch) ||
        h.dayOfWeek.toLowerCase().includes(holidaySearch.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [state.holidays, holidayFilter, holidaySearch]);

  // Filtered absences
  const filteredAbsences = useMemo(() => {
    return state.absences.filter(a => {
      const matchesCat = absenceCategoryFilter === 'all' || a.category === absenceCategoryFilter;
      const matchesSearch = !absenceSearch.trim() ||
        a.reason.toLowerCase().includes(absenceSearch.toLowerCase()) ||
        a.date.includes(absenceSearch) ||
        a.dayOfWeek.toLowerCase().includes(absenceSearch.toLowerCase()) ||
        (a.notes && a.notes.toLowerCase().includes(absenceSearch.toLowerCase()));

      return matchesCat && matchesSearch;
    });
  }, [state.absences, absenceCategoryFilter, absenceSearch]);

  return (
    <div className="w-full min-h-screen bg-zinc-950 text-zinc-100 px-3 sm:px-6 py-6 max-w-7xl mx-auto space-y-6">
      {/* Top Toast Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-zinc-900/95 border border-indigo-500/40 text-zinc-100 rounded-xl shadow-2xl shadow-indigo-950/50 backdrop-blur-md text-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Institutional Identity */}
      <div className="bg-gradient-to-r from-zinc-900/90 via-zinc-900/80 to-indigo-950/40 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-600/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="p-2.5 bg-indigo-500/15 border border-indigo-500/30 rounded-2xl text-indigo-400 shadow-inner">
                <School className="w-6 h-6" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/25 rounded-full text-xs font-semibold text-indigo-300 tracking-wide">
                  CBSE Affiliation: {state.profile.affiliationNo}
                </span>
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/25 rounded-full text-xs font-semibold text-emerald-300">
                  {state.profile.stream}
                </span>
                <span className="px-3 py-1 bg-zinc-800/80 border border-zinc-700 rounded-full text-xs text-zinc-400">
                  Mon – Fri Schedule
                </span>
              </div>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                {state.profile.schoolName}
              </h1>
              <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
                Institutional Attendance Reality Engine & Regulatory Compliance Dashboard · Academic Session 2026–2027
              </p>
            </div>
          </div>

          {/* 1-Click Zero-Cost Gemini Regulator CTA */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={handleLaunchGemini}
              className="relative group flex items-center justify-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all duration-300 cursor-pointer active:scale-95 border border-indigo-400/30"
            >
              <Sparkles className="w-4 h-4 text-violet-200 animate-pulse" />
              <span>Launch Attendance AI Regulator</span>
              <ExternalLink className="w-4 h-4 text-indigo-200 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={handleResetToGroundTruth}
              title="Reset data to verified ground truth"
              className="p-3 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-2xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="relative z-10 flex items-center gap-2 mt-6 pt-4 border-t border-zinc-800/60 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Overview & Reality Math', icon: Scale },
            { id: 'calendar', label: 'Institutional Calendar & Holidays', icon: Calendar, badge: '28 Holidays' },
            { id: 'absences', label: 'Absence & On-Duty Ledger', icon: Award, badge: `${state.absences.length} Logged` },
            { id: 'subjects', label: 'Subject Roster & Micro-Tracker', icon: BookOpen, badge: `${state.profile.subjects.length}` },
            { id: 'ai_regulator', label: 'AI Regulator Dossier & Legal', icon: FileText },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/40'
                    : 'bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
                )}
              >
                <Icon className={clsx('w-4 h-4', isActive ? 'text-white' : 'text-zinc-500')} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={clsx(
                    'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                    isActive ? 'bg-indigo-800/80 text-indigo-100' : 'bg-zinc-800 text-zinc-400'
                  )}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW & REALITY MATH */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Approved On-Duty Deputation Spotlight Card */}
          <div className="bg-gradient-to-r from-emerald-950/30 via-zinc-900/80 to-zinc-900/80 border border-emerald-500/30 rounded-3xl p-5 shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-400 shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider">
                    Approved Academic Deputation (CBSE Rule 14.ii)
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold rounded-md border border-emerald-500/30">
                    APPROVED_ON_DUTY
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-zinc-100 mt-0.5">
                  Kriti RISE IKITIES Program — Indian Institute of Technology (IIT) Kharagpur
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Duration: June 15 – June 26, 2026 · Credited: <strong className="text-emerald-300">10 Working Days</strong> · Ref: IIT-KGP/RISE/2026/IK-0428
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3.5 py-2 rounded-xl border border-emerald-500/25 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
              +10 Full Days Counted in Effective Attendance
            </div>
          </div>

          {/* Primary Reality Math KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Live Effective Attendance */}
            <div className="bg-zinc-900/80 border border-emerald-500/30 rounded-3xl p-5 backdrop-blur-md shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Effective Attendance</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  CBSE Validated
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3.5xl sm:text-4xl font-extrabold text-emerald-400 tracking-tight">
                  {metrics.effectivePct}%
                </span>
                <span className="text-xs text-zinc-500 font-medium">
                  ({metrics.effectiveDays} / {metrics.workingDaysHeld} days)
                </span>
              </div>
              <div className="mt-2 text-xs text-zinc-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300 font-semibold">+{(metrics.effectivePct - 75).toFixed(2)}%</span> above 75% CBSE line
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-500 flex justify-between">
                <span>Present ({metrics.presentDays}) + OD ({metrics.onDutyDays})</span>
                <span className="text-emerald-400 font-medium">Safe Surplus: +{metrics.effectiveSurplusBuffer}d</span>
              </div>
            </div>

            {/* Raw Physical Attendance */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 backdrop-blur-md shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Raw Physical Attended</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  In-Classroom
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3.5xl sm:text-4xl font-extrabold text-amber-400 tracking-tight">
                  {metrics.rawPct}%
                </span>
                <span className="text-xs text-zinc-500 font-medium">
                  ({metrics.presentDays} / {metrics.workingDaysHeld} days)
                </span>
              </div>
              <div className="mt-2 text-xs text-zinc-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-400" />
                <span>Requires OD credit for CBSE compliance</span>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-500 flex justify-between">
                <span>Absent: {metrics.absentDays} days</span>
                <span className="text-zinc-400">Recovery w/o OD: {metrics.consecutiveRecoveryRaw}d</span>
              </div>
            </div>

            {/* Safe Leaves to Dec 31 (75% Safe Threshold) */}
            <div className="bg-zinc-900/80 border border-indigo-500/30 rounded-3xl p-5 backdrop-blur-md shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Safe Leaves (75% Target)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  To Dec 31 Lock
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3.5xl sm:text-4xl font-extrabold text-indigo-400 tracking-tight">
                  {metrics.safeLeaves75}
                </span>
                <span className="text-xs text-zinc-400 font-semibold">Days Remaining</span>
              </div>
              <div className="mt-2 text-xs text-zinc-400">
                Must attend <strong className="text-indigo-300">{metrics.daysMustAttend75}</strong> of remaining {metrics.remainingSessionDays} days
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-500 flex justify-between">
                <span>Total Target: {metrics.targetDays75} / {metrics.totalSessionDays}d</span>
                <span className="text-indigo-400 font-medium">~1.2 days/wk</span>
              </div>
            </div>

            {/* Safe Leaves to Dec 31 (60% Medical Condonation) */}
            <div className="bg-zinc-900/80 border border-violet-500/30 rounded-3xl p-5 backdrop-blur-md shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">60% Condonation Limit</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-violet-500/15 text-violet-300 border border-violet-500/30">
                  CBSE Rule 14.i
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3.5xl sm:text-4xl font-extrabold text-violet-400 tracking-tight">
                  {metrics.safeLeaves60}
                </span>
                <span className="text-xs text-zinc-400 font-semibold">Max Buffer Days</span>
              </div>
              <div className="mt-2 text-xs text-zinc-400">
                With verified medical certificates / Olympiad camp
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-500 flex justify-between">
                <span>Must attend: {metrics.daysMustAttend60} days</span>
                <span className="text-violet-400 font-medium">Floor Target: {metrics.targetDays60}d</span>
              </div>
            </div>
          </div>

          {/* Session Progress & Visual Gauge Bar */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 backdrop-blur-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  CBSE 2026 Academic Session Timeline
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Commencement: {state.profile.sessionStart} · Attendance Submission Lock: {state.profile.lockDate} · {metrics.remainingSessionDays} working days remaining
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-zinc-300">Present ({metrics.presentDays}d)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span className="text-zinc-300">On-Duty ({metrics.onDutyDays}d)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-zinc-300">Absent ({metrics.absentDays}d)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                  <span className="text-zinc-400">Future ({metrics.remainingSessionDays}d)</span>
                </div>
              </div>
            </div>

            {/* Stacked Progress Bar */}
            <div className="h-4 bg-zinc-950 rounded-full overflow-hidden flex p-0.5 border border-zinc-800">
              <div
                style={{ width: `${(metrics.presentDays / metrics.totalSessionDays) * 100}%` }}
                className="bg-emerald-500 h-full rounded-l-full"
                title={`Present: ${metrics.presentDays} days`}
              />
              <div
                style={{ width: `${(metrics.onDutyDays / metrics.totalSessionDays) * 100}%` }}
                className="bg-indigo-500 h-full"
                title={`On-Duty: ${metrics.onDutyDays} days`}
              />
              <div
                style={{ width: `${(metrics.absentDays / metrics.totalSessionDays) * 100}%` }}
                className="bg-rose-500/80 h-full"
                title={`Absent: ${metrics.absentDays} days`}
              />
            </div>

            {/* Threshold Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl">
                <div className="text-[11px] text-zinc-500 uppercase tracking-wider">CBSE 75% Safe Threshold</div>
                <div className="text-lg font-bold text-indigo-400 mt-0.5">{metrics.targetDays75} Days Required</div>
                <div className="text-xs text-zinc-400 mt-0.5">Currently {metrics.effectiveDays} credited (Need {metrics.daysMustAttend75} more)</div>
              </div>
              <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl">
                <div className="text-[11px] text-zinc-500 uppercase tracking-wider">60% Special Condonation Floor</div>
                <div className="text-lg font-bold text-violet-400 mt-0.5">{metrics.targetDays60} Days Required</div>
                <div className="text-xs text-zinc-400 mt-0.5">Currently {metrics.effectiveDays} credited (Need {metrics.daysMustAttend60} more)</div>
              </div>
              <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl">
                <div className="text-[11px] text-zinc-500 uppercase tracking-wider">Consecutive Recovery Needed</div>
                <div className="text-lg font-bold text-emerald-400 mt-0.5">
                  {metrics.consecutiveRecoveryEffective} Days <span className="text-xs font-normal text-emerald-300">(Buffer Positive)</span>
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">Raw without OD would require {metrics.consecutiveRecoveryRaw} unbroken days</div>
              </div>
            </div>
          </div>

          {/* Interactive What-If Reality Simulator */}
          <div className="bg-gradient-to-br from-zinc-900/90 via-zinc-900/70 to-indigo-950/20 border border-indigo-500/30 rounded-3xl p-6 backdrop-blur-md space-y-5 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-400" />
                  Interactive Attendance Reality Simulator
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Simulate future leaves and study marathons to project your final attendance percentage on Dec 31, 2026.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setSimLeaves(5); setSimAttended(0); }}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium cursor-pointer transition-colors"
                >
                  +5 Study Leaves
                </button>
                <button
                  onClick={() => { setSimLeaves(15); setSimAttended(0); }}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium cursor-pointer transition-colors"
                >
                  +15 Deep Work Days
                </button>
                <button
                  onClick={() => { setSimLeaves(0); setSimAttended(0); }}
                  className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-medium cursor-pointer transition-colors"
                >
                  Reset Sim
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-zinc-300">Hypothetical Future Leaves to Take:</span>
                    <span className="text-rose-400 font-bold">{simLeaves} Days</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={metrics.remainingSessionDays}
                    value={simLeaves}
                    onChange={(e) => setSimLeaves(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                    <span>0 days</span>
                    <span>Safe limit: {metrics.safeLeaves75}d</span>
                    <span>{metrics.remainingSessionDays} max</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-zinc-300">Hypothetical Future School Days Attended:</span>
                    <span className="text-emerald-400 font-bold">{simAttended} Days</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(0, metrics.remainingSessionDays - simLeaves)}
                    value={simAttended}
                    onChange={(e) => setSimAttended(Number(e.target.value))}
                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                    <span>0 days</span>
                    <span>{Math.max(0, metrics.remainingSessionDays - simLeaves)} days max</span>
                  </div>
                </div>
              </div>

              {/* Simulation Result Box */}
              <div className="bg-zinc-950/70 p-5 rounded-2xl border border-zinc-800 flex flex-col justify-between">
                <div>
                  <span className="text-xs uppercase font-bold text-zinc-400 tracking-wider">Projected Final Dec 31 Result</span>
                  <div className="mt-2 flex items-baseline gap-3">
                    <span className={clsx(
                      'text-4xl font-extrabold tracking-tight',
                      simulation.projectedFinalPctDec31 >= 75 ? 'text-emerald-400' :
                      simulation.projectedFinalPctDec31 >= 60 ? 'text-amber-400' : 'text-rose-400'
                    )}>
                      {simulation.projectedFinalPctDec31}%
                    </span>
                    <span className="text-xs text-zinc-400">
                      ({simulation.projectedEffectiveDays + Math.max(0, metrics.remainingSessionDays - (simLeaves + simAttended))} / {metrics.totalSessionDays} days)
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    {simulation.meetsSafe75 ? (
                      <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                        <CheckCircle2 className="w-4 h-4" /> Meets CBSE 75% Safe Standard
                      </span>
                    ) : simulation.meetsCondonation60 ? (
                      <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                        <AlertTriangle className="w-4 h-4" /> Below 75%, but eligible under 60% Medical Condonation
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                        <ShieldAlert className="w-4 h-4" /> Critical: Drops below 60% legal condonation floor!
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Taking {simLeaves} leaves leaves you with {Math.max(0, metrics.safeLeaves75 - simLeaves)} additional buffer leaves before crossing the 75% line.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INSTITUTIONAL CALENDAR & HOLIDAYS */}
      {activeTab === 'calendar' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Vacation Windows Ledger */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                  Official Institutional Vacation Windows (4 Windows)
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Scheduled school breaks saving a cumulative 36 working days for intensive Olympiad & JEE self-study.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {state.vacations.map((vac: VacationEntry, idx: number) => (
                <div key={vac.id} className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4 space-y-2 hover:border-indigo-500/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Window #{idx + 1}</span>
                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold rounded-md">
                      {vac.schoolDaysSaved} School Days Saved
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-zinc-100">{vac.name}</h4>
                  <div className="text-xs text-zinc-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{vac.startDate} to {vac.endDate}</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 pt-1 border-t border-zinc-800/60">{vac.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Examination & PTM Milestones */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 backdrop-blur-md space-y-4">
            <div>
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-400" />
                Examination & PTM Milestones (Class XI Science)
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Key academic assessment windows and parent-teacher meeting schedules.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {state.exams.map((exam: ExamMilestone) => {
                const isUpcoming = exam.status === 'upcoming';
                const isCompleted = exam.status === 'completed';
                return (
                  <div
                    key={exam.id}
                    className={clsx(
                      'bg-zinc-950/70 border rounded-2xl p-4 space-y-2 transition-all',
                      isUpcoming ? 'border-emerald-500/50 ring-1 ring-emerald-500/30' :
                      isCompleted ? 'border-zinc-800 opacity-80' : 'border-zinc-800'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className={clsx(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border',
                        isUpcoming ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                        isCompleted ? 'bg-zinc-800 text-zinc-400 border-zinc-700' :
                        'bg-indigo-500/10 text-indigo-300 border-indigo-500/25'
                      )}>
                        {isUpcoming ? '⏳ Upcoming' : isCompleted ? '✅ Completed' : '📅 Scheduled'}
                      </span>
                      {exam.syllabusPercentage && (
                        <span className="text-[10px] text-zinc-500 font-bold">{exam.syllabusPercentage}% Syllabus</span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-zinc-100">{exam.name}</h4>
                    <div className="text-xs text-zinc-400 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{exam.startDate} – {exam.endDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-indigo-400 font-medium">
                        <Award className="w-3.5 h-3.5" />
                        <span>PTM Date: {exam.ptmDate}</span>
                      </div>
                    </div>
                    {exam.strategicFocus && (
                      <p className="text-[11px] text-zinc-500 pt-1 border-t border-zinc-800/60">{exam.strategicFocus}</p>
                    )}
                    {Array.isArray(exam.slots) && exam.slots.length > 0 && (
                      <div className="pt-2 border-t border-zinc-800/80 space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Exam Routine & Practicals:</span>
                        <div className="grid grid-cols-1 gap-1">
                          {exam.slots.map((slot, sIdx) => (
                            <div key={sIdx} className="flex items-center justify-between text-[11px] bg-zinc-950/70 px-2.5 py-1.5 rounded-xl border border-zinc-800/60">
                              <div className="flex items-center gap-2">
                                <span className={clsx(
                                  "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                                  slot.type === 'practical' ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                )}>
                                  {slot.type}
                                </span>
                                <span className="font-semibold text-zinc-200">{slot.subject}</span>
                              </div>
                              <span className="text-zinc-400 font-mono text-[10px]">{slot.date} ({slot.day})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 28 Institutional Holidays Table */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 backdrop-blur-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                  Official Institutional Holiday Calendar ({filteredHolidays.length} / {state.holidays.length} Holidays)
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Complete catalogue of 28 institutional, gazetted, and regional holidays.
                </p>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search holiday..."
                    value={holidaySearch}
                    onChange={(e) => setHolidaySearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-36 sm:w-48"
                  />
                </div>

                <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                  {['all', 'National', 'Gazetted', 'State', 'Festive'].map(filterKey => (
                    <button
                      key={filterKey}
                      onClick={() => setHolidayFilter(filterKey)}
                      className={clsx(
                        'px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer',
                        holidayFilter === filterKey ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                      )}
                    >
                      {filterKey}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Holidays Table */}
            <div className="overflow-x-auto rounded-2xl border border-zinc-800">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-950 text-zinc-400 font-semibold border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Day</th>
                    <th className="py-3 px-4">Holiday Name</th>
                    <th className="py-3 px-4">Classification</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredHolidays.map((h: HolidayEntry, idx: number) => (
                    <tr key={h.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-4 text-zinc-500 font-mono">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-medium text-zinc-200">{h.date}</td>
                      <td className="py-3 px-4 text-zinc-400">{h.dayOfWeek}</td>
                      <td className="py-3 px-4 font-bold text-zinc-100">{h.name}</td>
                      <td className="py-3 px-4">
                        <span className={clsx(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border',
                          h.classification.includes('National') ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25' :
                          h.classification.includes('Gazetted') ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/25' :
                          h.classification.includes('Festive') ? 'bg-purple-500/10 text-purple-300 border-purple-500/25' :
                          'bg-amber-500/10 text-amber-300 border-amber-500/25'
                        )}>
                          {h.classification}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-500">
                        {h.inVacationWindow ? (
                          <span className="text-indigo-400 font-medium">Inside {h.inVacationWindow}</span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ABSENCES & ON-DUTY LEDGER */}
      {activeTab === 'absences' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header & Log Action */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Comprehensive Absence & Academic Deputation Ledger
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Total Absences: <strong className="text-rose-400">{state.profile.absentDays} Days</strong> (21 Specific Dates + 3 Administrative Buffers) · Approved On-Duty: <strong className="text-emerald-400">10 Days</strong>
              </p>
            </div>
            <button
              onClick={() => setIsAddingAbsence(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-lg shadow-indigo-600/30 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" /> Log Absence Record
            </button>
          </div>

          {/* Add Absence Modal Form */}
          {isAddingAbsence && (
            <div className="bg-zinc-900/90 border border-indigo-500/40 rounded-3xl p-6 space-y-4 backdrop-blur-md animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-400" /> Log New Academic Absence / Self-Study Date
                </h4>
                <button onClick={() => setIsAddingAbsence(false)} className="p-1 text-zinc-500 hover:text-zinc-300 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-[11px] text-zinc-500 uppercase tracking-wide">Date</label>
                  <input
                    type="date"
                    value={newAbsDate}
                    onChange={(e) => setNewAbsDate(e.target.value)}
                    className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-zinc-500 uppercase tracking-wide">Category</label>
                  <select
                    value={newAbsCategory}
                    onChange={(e) => setNewAbsCategory(e.target.value as AbsenceCategory)}
                    className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <option value="olympiad">Olympiad / STEM</option>
                    <option value="jee_prep">JEE Prep</option>
                    <option value="self_study">Self Study</option>
                    <option value="exam_prep">Exam Prep</option>
                    <option value="travel">Travel</option>
                    <option value="medical">Medical</option>
                    <option value="academic_deputation">Academic Deputation</option>
                    <option value="school_work">School Work</option>
                    <option value="buffer">Administrative Buffer</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] text-zinc-500 uppercase tracking-wide">Reason / Academic Activity</label>
                  <input
                    type="text"
                    placeholder="e.g. Physics Irodov mechanics sprint..."
                    value={newAbsReason}
                    onChange={(e) => setNewAbsReason(e.target.value)}
                    className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={newAbsIsPractical}
                    onChange={(e) => setNewAbsIsPractical(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-950 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Was this scheduled as a Practical Lab Day at School?</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddAbsence}
                    disabled={!newAbsReason.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Record
                  </button>
                  <button
                    onClick={() => setIsAddingAbsence(false)}
                    className="px-4 py-2 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Absence Filter & Search Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search absences..."
                value={absenceSearch}
                onChange={(e) => setAbsenceSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44 sm:w-60"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1">
              {[
                { id: 'all', label: 'All' },
                { id: 'olympiad', label: 'Olympiad' },
                { id: 'jee_prep', label: 'JEE Prep' },
                { id: 'self_study', label: 'Self Study' },
                { id: 'exam_prep', label: 'Exam Prep' },
                { id: 'buffer', label: 'Buffer' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setAbsenceCategoryFilter(cat.id)}
                  className={clsx(
                    'px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
                    absenceCategoryFilter === cat.id ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Absence Table */}
          <div className="overflow-x-auto rounded-3xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-md">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950 text-zinc-400 font-semibold border-b border-zinc-800">
                <tr>
                  <th className="py-3.5 px-4">#</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Day</th>
                  <th className="py-3.5 px-4">Reason & Academic Activity</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Practical Day?</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredAbsences.map((abs: AbsenceEntry, idx: number) => (
                  <tr key={abs.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-4 text-zinc-500 font-mono">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-medium text-zinc-200">{abs.date}</td>
                    <td className="py-3 px-4 text-zinc-400">{abs.dayOfWeek}</td>
                    <td className="py-3 px-4 font-semibold text-zinc-100">{abs.reason}</td>
                    <td className="py-3 px-4">
                      <span className={clsx(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border',
                        abs.category === 'olympiad' ? 'bg-purple-500/10 text-purple-300 border-purple-500/30' :
                        abs.category === 'jee_prep' ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' :
                        abs.category === 'self_study' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' :
                        abs.category === 'buffer' ? 'bg-zinc-800 text-zinc-400 border-zinc-700' :
                        'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      )}>
                        {abs.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {abs.isPracticalDay ? (
                        <span className="px-2 py-0.5 bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded-md text-[10px] font-bold">
                          Yes (Lab Day)
                        </span>
                      ) : (
                        <span className="text-zinc-500">No</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteAbsence(abs.id)}
                        className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                        title="Delete absence record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SUBJECT ROSTER & MICRO-TRACKER */}
      {activeTab === 'subjects' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                Class XI Science Subject Roster ({state.profile.subjects.length} Subjects)
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                CBSE Senior Secondary course codes and per-subject attendance micro-counters.
              </p>
            </div>
            <button
              onClick={() => setIsAddingSubject(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-lg shadow-indigo-600/30 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" /> Add Subject
            </button>
          </div>

          {/* Add Subject Modal */}
          {isAddingSubject && (
            <div className="bg-zinc-900/90 border border-indigo-500/40 rounded-3xl p-6 space-y-4 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-zinc-100">Add New Academic Subject</h4>
                <button onClick={() => setIsAddingSubject(false)} className="p-1 text-zinc-500 hover:text-zinc-300 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] text-zinc-500 uppercase tracking-wide">Subject Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Physics"
                    value={newSubjName}
                    onChange={(e) => setNewSubjName(e.target.value)}
                    className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-500 uppercase tracking-wide">CBSE Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 042"
                    value={newSubjCode}
                    onChange={(e) => setNewSubjCode(e.target.value)}
                    className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-500 uppercase tracking-wide">Required %</label>
                  <input
                    type="number"
                    value={newSubjReq}
                    onChange={(e) => setNewSubjReq(e.target.value)}
                    className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-500 uppercase tracking-wide">Attended</label>
                  <input
                    type="number"
                    value={newSubjAttended}
                    onChange={(e) => setNewSubjAttended(e.target.value)}
                    className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-500 uppercase tracking-wide">Total Held</label>
                  <input
                    type="number"
                    value={newSubjTotal}
                    onChange={(e) => setNewSubjTotal(e.target.value)}
                    className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={newSubjIsPractical}
                    onChange={(e) => setNewSubjIsPractical(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-950 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Includes Practical / Laboratory component (e.g. 70 Theory + 30 Practical)</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddSubject}
                    disabled={!newSubjName.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Subject
                  </button>
                  <button
                    onClick={() => setIsAddingSubject(false)}
                    className="px-4 py-2 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Subject Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.profile.subjects.map((subj: SubjectAttendance) => {
              const pct = subj.total > 0 ? (subj.attended / subj.total) * 100 : 0;
              const req = subj.required || 75;
              const isSafe = pct >= req;
              const colors = COLOR_MAP[subj.color] || COLOR_MAP.indigo;
              const isEditing = editingSubjId === subj.id;
              const isExpanded = expandedSubjId === subj.id;

              const classesNeeded = !isSafe && req < 100
                ? Math.ceil((req * subj.total - 100 * subj.attended) / (100 - req))
                : 0;

              const classesCanSkip = isSafe && req > 0
                ? Math.floor((100 * subj.attended - req * subj.total) / req)
                : 0;

              return (
                <div
                  key={subj.id}
                  className={clsx(
                    'bg-zinc-900/80 backdrop-blur-md border rounded-3xl p-5 shadow-xl transition-all',
                    colors.border
                  )}
                >
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-zinc-100">Edit {subj.name}</h4>
                        <button onClick={() => setEditingSubjId(null)} className="p-1 text-zinc-500 hover:text-zinc-300 cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="text-[10px] text-zinc-500 uppercase">Subject Name</label>
                          <input
                            type="text"
                            value={editSubjForm.name}
                            onChange={(e) => setEditSubjForm(p => ({ ...p, name: e.target.value }))}
                            className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-500 uppercase">Attended</label>
                          <input
                            type="number"
                            value={editSubjForm.attended}
                            onChange={(e) => setEditSubjForm(p => ({ ...p, attended: Number(e.target.value) }))}
                            className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-500 uppercase">Total Held</label>
                          <input
                            type="number"
                            value={editSubjForm.total}
                            onChange={(e) => setEditSubjForm(p => ({ ...p, total: Number(e.target.value) }))}
                            className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveSubjectEdit(subj.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" /> Save
                        </button>
                        <button
                          onClick={() => setEditingSubjId(null)}
                          className="px-3 py-1.5 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-xl text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={clsx('p-2.5 rounded-2xl border', colors.bg, colors.border)}>
                            <BookOpen className={clsx('w-5 h-5', colors.text)} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-sm sm:text-base text-zinc-100">{subj.name}</h4>
                              {subj.code && (
                                <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded text-[10px] font-mono font-bold">
                                  {subj.code}
                                </span>
                              )}
                              {subj.isPracticalSubject && (
                                <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded text-[9px] font-semibold">
                                  Lab/Practical
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-zinc-400 mt-0.5">
                              {subj.attended} attended of {subj.total} total classes · Target: {subj.required}%
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className={clsx('text-xl font-extrabold', isSafe ? 'text-emerald-400' : 'text-rose-400')}>
                            {pct.toFixed(1)}%
                          </div>
                          <span className={clsx(
                            'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border',
                            isSafe ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          )}>
                            {isSafe ? '✓ Safe' : '⚠ Deficit'}
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                        <div
                          className={clsx('h-full rounded-full transition-all duration-500', isSafe ? 'bg-emerald-500' : 'bg-rose-500')}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>

                      {/* Badges / Advice */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {isSafe ? (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-300">
                            <TrendingDown className="w-3.5 h-3.5" /> Can skip <strong>{classesCanSkip}</strong> classes safely
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-300">
                            <TrendingUp className="w-3.5 h-3.5" /> Attend <strong>{classesNeeded}</strong> consecutive classes to reach {req}%
                          </div>
                        )}
                      </div>

                      {/* Quick Interactive Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80">
                        <button
                          onClick={() => {
                            setState(prev => ({
                              ...prev,
                              profile: {
                                ...prev.profile,
                                subjects: prev.profile.subjects.map(s => s.id === subj.id ? { ...s, attended: s.attended + 1, total: s.total + 1 } : s)
                              }
                            }));
                            showToast(`Logged attended class for ${subj.name}`);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> + Attended
                        </button>

                        <button
                          onClick={() => {
                            setState(prev => ({
                              ...prev,
                              profile: {
                                ...prev.profile,
                                subjects: prev.profile.subjects.map(s => s.id === subj.id ? { ...s, total: s.total + 1 } : s)
                              }
                            }));
                            showToast(`Logged missed class for ${subj.name}`);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/15 hover:bg-rose-600/25 border border-rose-500/25 text-rose-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                        >
                          <X className="w-3.5 h-3.5" /> + Missed
                        </button>

                        <div className="flex items-center gap-1 ml-auto">
                          <button
                            onClick={() => {
                              setEditingSubjId(subj.id);
                              setEditSubjForm({
                                name: subj.name,
                                code: subj.code || '',
                                attended: subj.attended,
                                total: subj.total,
                                required: subj.required || 75,
                                color: subj.color,
                                isPracticalSubject: !!subj.isPracticalSubject
                              });
                            }}
                            className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg cursor-pointer"
                            title="Edit Subject"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setExpandedSubjId(isExpanded ? null : subj.id)}
                            className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg cursor-pointer"
                            title="Expand Details"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => handleDeleteSubject(subj.id)}
                            className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded-lg cursor-pointer"
                            title="Delete Subject"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Analysis */}
                      {isExpanded && (
                        <div className="pt-3 border-t border-zinc-800/80 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                          <div className="bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800">
                            <div className="text-[10px] text-zinc-500 uppercase">Classes Held</div>
                            <div className="font-bold text-zinc-200 mt-0.5">{subj.total}</div>
                          </div>
                          <div className="bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800">
                            <div className="text-[10px] text-zinc-500 uppercase">Classes Attended</div>
                            <div className="font-bold text-emerald-400 mt-0.5">{subj.attended}</div>
                          </div>
                          <div className="bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800 col-span-2 sm:col-span-1">
                            <div className="text-[10px] text-zinc-500 uppercase">Deficit / Surplus</div>
                            <div className={clsx('font-bold mt-0.5', pct >= req ? 'text-emerald-400' : 'text-rose-400')}>
                              {pct >= req ? '+' : ''}{(pct - req).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: AI REGULATOR DOSSIER & LEGAL ANALYSIS */}
      {activeTab === 'ai_regulator' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Action Header Card */}
          <div className="bg-gradient-to-r from-violet-950/40 via-indigo-950/30 to-zinc-900 border border-violet-500/40 rounded-3xl p-6 backdrop-blur-md space-y-4 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-violet-500/20 text-violet-300 text-xs font-bold rounded-full border border-violet-500/30">
                    Zero-Cost Gemini Web AI Bridge
                  </span>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/25">
                    No API Keys Required
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-white mt-2">
                  Institutional Attendance Regulator & Strategic Dossier
                </h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
                  Automatically compiles live CBSE Ground Truth, IIT Kharagpur on-duty proof, 28 holidays, 21 absence records, and CBSE Rule 13.2 / 14 by-laws into an elite strategic consultation prompt.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  onClick={handleCopyPayload}
                  className="flex items-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer border border-zinc-700"
                >
                  {copiedSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                  <span>{copiedSuccess ? 'Copied Payload!' : 'Copy AI Prompt'}</span>
                </button>

                <button
                  onClick={handleLaunchGemini}
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer border border-indigo-400/40"
                >
                  <Sparkles className="w-4 h-4 text-violet-200" />
                  <span>Launch in Gemini Web</span>
                  <ExternalLink className="w-4 h-4 text-indigo-200" />
                </button>
              </div>
            </div>

            {/* Custom Directive Input */}
            <div className="pt-3 border-t border-zinc-800/80">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-2 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                Add Custom Directive or Question for Gemini (Optional):
              </label>
              <textarea
                rows={2}
                value={customAIQuery}
                onChange={(e) => setCustomAIQuery(e.target.value)}
                placeholder="e.g., Draft an official letter to Principal requesting counter-signature on IIT Kharagpur on-duty certificate under CBSE Rule 14.ii, and provide an optimized leave plan for NSEP revision..."
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          {/* Legal Framework Explainer Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase">
                <Scale className="w-4 h-4" /> CBSE Rule 13.2 By-Laws
              </div>
              <h4 className="font-bold text-sm text-zinc-100">75% Mandatory Attendance</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Mandates that candidates for CBSE Senior Secondary Board Exams must attain minimum 75% attendance from session commencement until the cutoff lock date (Dec 31).
              </p>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase">
                <Award className="w-4 h-4" /> CBSE Rule 14 Condonation
              </div>
              <h4 className="font-bold text-sm text-zinc-100">15% Medical & OD Relief</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Rule 14(i) permits Chairman condonation down to 60% for certified illnesses. Rule 14(ii) grants official On-Duty (OD) attendance credit for authorized scientific olympiad camps and deputations.
              </p>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase">
                <Compass className="w-4 h-4" /> Strategic Alternatives
              </div>
              <h4 className="font-bold text-sm text-zinc-100">Dummy vs NIOS vs A-Levels</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Comparative analysis for high-achieving STEM aspirants balancing JEE Advanced / IPhO with formal schooling, open board flexibility (NIOS), or British Cambridge A-Levels.
              </p>
            </div>
          </div>

          {/* Dossier Preview Container */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-400" /> Live AI Dossier Payload Preview
              </h4>
              <span className="text-[11px] text-zinc-500 font-mono">
                {generateGeminiRegulatoryPrompt(state, customAIQuery).length} characters
              </span>
            </div>

            <pre className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800/90 text-xs text-zinc-300 font-mono overflow-x-auto max-h-96 whitespace-pre-wrap leading-relaxed select-all">
              {generateGeminiRegulatoryPrompt(state, customAIQuery)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
