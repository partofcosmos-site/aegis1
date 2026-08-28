import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { StudyHeatmap } from './StudyHeatmap';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, Legend,
  ScatterChart, Scatter, ZAxis, ReferenceLine
} from 'recharts';
import {
  format, parseISO, isValid, subDays, eachDayOfInterval,
  differenceInDays, startOfDay, endOfDay, isWithinInterval
} from 'date-fns';
import {
  Clock, CheckCircle2, TrendingUp, Upload, Target,
  Calendar, Zap, BarChart3, Award,
  FileSpreadsheet, FileJson, Check, AlertTriangle, ArrowUpRight,
  Info, X, Sparkles, Compass, Gauge, Crosshair, Brain,
  Activity, Sliders, ChevronRight, CheckCircle, Flame,
  Scale, Plus, Minus, RefreshCw, SlidersHorizontal, AlertCircle,
  TrendingDown, Layers
} from 'lucide-react';
import {
  calculateSACMData,
  SACMReport,
  SACMDataPoint,
  SACMQuadrantId,
  DEFAULT_VELOCITY_THRESHOLD,
  DEFAULT_ACCURACY_THRESHOLD,
  QUADRANT_META
} from '../utils/sacmCalculator';
import {
  calculateSubjectEquilibrium,
  loadTargetWeights,
  saveTargetWeights,
  resetTargetWeights,
  DEFAULT_TARGET_WEIGHTS,
  SubjectEquilibriumReport,
  SubjectDistribution,
  PID_GAINS
} from '../utils/pidEquilibriumEngine';

const PALETTE = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f43f5e', // Rose
  '#a855f7', // Purple
  '#06b6d4'  // Cyan
];

type TimeRangeOption = '7d' | '30d' | '90d' | '365d' | 'all';
type MetricViewOption = 'hours' | 'problems' | 'combined';

interface ExamTarget {
  id: string;
  name: string;
  targetDate: string;
  targetHours: number;
  completedHours: number;
  category: 'Physics' | 'Math' | 'Chemistry' | 'General';
}

const DEFAULT_EXAMS: ExamTarget[] = [
  { id: 'exam-1', name: 'JEE Advanced 2026', targetDate: '2026-05-24', targetHours: 1200, completedHours: 0, category: 'General' },
  { id: 'exam-2', name: 'IPhO (International Physics Olympiad)', targetDate: '2026-07-12', targetHours: 800, completedHours: 0, category: 'Physics' },
  { id: 'exam-3', name: 'NSEP (National Standard Exam in Physics)', targetDate: '2026-11-23', targetHours: 400, completedHours: 0, category: 'Physics' },
  { id: 'exam-4', name: 'MIT SAT / Subject Test', targetDate: '2026-10-05', targetHours: 300, completedHours: 0, category: 'General' }
];

// Custom Tooltip for SACM Scatter Matrix
const SACMCustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  const data: SACMDataPoint = payload[0].payload;
  if (!data) return null;

  return (
    <div className="bg-zinc-900/95 backdrop-blur-md border border-zinc-700/80 rounded-xl p-3.5 shadow-2xl text-xs max-w-xs space-y-2 z-50 pointer-events-none">
      <div className="flex items-start justify-between gap-2 border-b border-zinc-800 pb-2">
        <div>
          <span className="font-bold text-zinc-100 text-sm block">{data.topic}</span>
          <span className="text-[11px] text-zinc-400 font-medium">{data.subject} • {data.date}</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${data.badgeColor}`}>
          {data.diagnosticTag}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="bg-zinc-950/70 p-2 rounded-lg border border-zinc-800/80">
          <span className="text-zinc-400 block text-[10px]">Velocity</span>
          <strong className="text-indigo-300 font-mono text-xs">{data.velocityQpH} Q/hr</strong>
          <span className="text-zinc-500 block text-[10px] mt-0.5">~{data.timePerQuestionMin} m/q</span>
        </div>
        <div className="bg-zinc-950/70 p-2 rounded-lg border border-zinc-800/80">
          <span className="text-zinc-400 block text-[10px]">Accuracy</span>
          <strong className={`font-mono text-xs ${data.accuracyPercent >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {data.accuracyPercent}%
          </strong>
          <span className="text-zinc-500 block text-[10px] mt-0.5">{data.problemsSolved} Qs in {data.durationMinutes}m</span>
        </div>
      </div>

      {data.mistakes && data.mistakes.length > 0 && (
        <div className="text-[10px] text-rose-300 bg-rose-950/40 border border-rose-800/40 rounded-lg p-1.5">
          <span className="font-semibold text-rose-400">Mistakes noted: </span>
          {data.mistakes.join(', ')}
        </div>
      )}
    </div>
  );
};

export const Analytics = () => {
  const { logs, user, isGuest, addLog } = useAppContext();

  // State
  const [timeRange, setTimeRange] = useState<TimeRangeOption>('30d');
  const [metricView, setMetricView] = useState<MetricViewOption>('hours');
  const [selectedExamId, setSelectedExamId] = useState<string>('all');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [importPreview, setImportPreview] = useState<any[] | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // SACM State
  const [sacmSubjectFilter, setSacmSubjectFilter] = useState<string>('all');
  const [sacmTimeRange, setSacmTimeRange] = useState<TimeRangeOption>('30d');
  const [velocityThreshold, setVelocityThreshold] = useState<number>(DEFAULT_VELOCITY_THRESHOLD);
  const [accuracyThreshold, setAccuracyThreshold] = useState<number>(DEFAULT_ACCURACY_THRESHOLD);
  const [showSACMSettings, setShowSACMSettings] = useState<boolean>(false);

  // PID Subject Equilibrium State
  const [pidWeights, setPidWeights] = useState<Record<string, number>>(() => loadTargetWeights());
  const [showWeightCustomizer, setShowWeightCustomizer] = useState<boolean>(false);
  const [newSubjectInput, setNewSubjectInput] = useState<string>('');
  const [newSubjectWeightPct, setNewSubjectWeightPct] = useState<number>(20);

  // Load Exam Targets from localStorage
  const examTargets: ExamTarget[] = useMemo(() => {
    try {
      const saved = localStorage.getItem('savantix_exam_targets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_EXAMS;
  }, []);

  // Extract unique subjects for filters
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    (logs || []).forEach(l => {
      if (l.subject) {
        const s = String(l.subject).trim();
        if (s) set.add(s);
      }
    });
    const standard = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science'];
    standard.forEach(s => set.add(s));
    return Array.from(set);
  }, [logs]);

  // Filter logs according to selected Time Range
  const { filteredLogs, startDate, endDate, totalDaysInRange } = useMemo(() => {
    const today = new Date();
    let start = subDays(today, 29);

    if (timeRange === '7d') start = subDays(today, 6);
    else if (timeRange === '30d') start = subDays(today, 29);
    else if (timeRange === '90d') start = subDays(today, 89);
    else if (timeRange === '365d') start = subDays(today, 364);
    else if (timeRange === 'all') {
      if (logs && logs.length > 0) {
        const validTimestamps = logs
          .map(l => l.date ? parseISO(l.date.substring(0, 10)).getTime() : NaN)
          .filter(t => !isNaN(t));
        if (validTimestamps.length > 0) {
          start = new Date(Math.min(...validTimestamps));
        } else {
          start = subDays(today, 29);
        }
      } else {
        start = subDays(today, 29);
      }
    }

    const startBoundary = startOfDay(start);
    const endBoundary = endOfDay(today);

    const filtered = (logs || []).filter(l => {
      if (!l.date) return false;
      const parsed = parseISO(l.date.substring(0, 10));
      return isValid(parsed) && isWithinInterval(parsed, { start: startBoundary, end: endBoundary });
    });

    const daysCount = Math.max(1, differenceInDays(endBoundary, startBoundary) + 1);

    return {
      filteredLogs: filtered,
      startDate: startBoundary,
      endDate: endBoundary,
      totalDaysInRange: daysCount
    };
  }, [logs, timeRange]);

  // SACM Engine Data Calculation
  const { sacmFilteredLogs, sacmReport } = useMemo(() => {
    const today = new Date();
    let start = subDays(today, 29);

    if (sacmTimeRange === '7d') start = subDays(today, 6);
    else if (sacmTimeRange === '30d') start = subDays(today, 29);
    else if (sacmTimeRange === '90d') start = subDays(today, 89);
    else if (sacmTimeRange === '365d') start = subDays(today, 364);
    else if (sacmTimeRange === 'all') {
      if (logs && logs.length > 0) {
        const validTimestamps = logs
          .map(l => l.date ? parseISO(l.date.substring(0, 10)).getTime() : NaN)
          .filter(t => !isNaN(t));
        if (validTimestamps.length > 0) {
          start = new Date(Math.min(...validTimestamps));
        } else {
          start = subDays(today, 29);
        }
      } else {
        start = subDays(today, 29);
      }
    }

    const startBoundary = startOfDay(start);
    const endBoundary = endOfDay(today);

    let filtered = (logs || []).filter(l => {
      if (!l.date) return false;
      const parsed = parseISO(l.date.substring(0, 10));
      return isValid(parsed) && isWithinInterval(parsed, { start: startBoundary, end: endBoundary });
    });

    if (sacmSubjectFilter !== 'all') {
      filtered = filtered.filter(l => {
        const s = String(l.subject || '').toLowerCase();
        return s.includes(sacmSubjectFilter.toLowerCase());
      });
    }

    const report: SACMReport = calculateSACMData(filtered, {
      velocityThreshold,
      accuracyThreshold
    });

    return {
      sacmFilteredLogs: filtered,
      sacmReport: report
    };
  }, [logs, sacmTimeRange, sacmSubjectFilter, velocityThreshold, accuracyThreshold]);

  // Rolling 7-Day Logs for Dynamic Subject Equilibrium Matrix
  const logs7Days = useMemo(() => {
    const today = new Date();
    const startBoundary = startOfDay(subDays(today, 6));
    const endBoundary = endOfDay(today);

    return (logs || []).filter(l => {
      if (!l.date) return false;
      const parsed = parseISO(l.date.substring(0, 10));
      return isValid(parsed) && isWithinInterval(parsed, { start: startBoundary, end: endBoundary });
    });
  }, [logs]);

  // Dynamic Subject Equilibrium Matrix & PID Report
  const equilibriumReport: SubjectEquilibriumReport = useMemo(() => {
    return calculateSubjectEquilibrium(logs7Days, pidWeights);
  }, [logs7Days, pidWeights]);

  const handleUpdateSubjectWeight = (subj: string, pct: number) => {
    const updated = { ...pidWeights, [subj]: Math.max(0.01, pct / 100) };
    const saved = saveTargetWeights(updated);
    setPidWeights(saved);
  };

  const handleAddCustomSubject = () => {
    if (!newSubjectInput.trim()) return;
    const name = newSubjectInput.trim();
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
    const updated = { ...pidWeights, [formattedName]: Math.max(0.05, newSubjectWeightPct / 100) };
    const saved = saveTargetWeights(updated);
    setPidWeights(saved);
    setNewSubjectInput('');
  };

  const handleRemoveCustomSubject = (subj: string) => {
    if (Object.keys(pidWeights).length <= 1) return;
    const copy = { ...pidWeights };
    delete copy[subj];
    const saved = saveTargetWeights(copy);
    setPidWeights(saved);
  };

  const handleResetPIDWeights = () => {
    const reset = resetTargetWeights();
    setPidWeights(reset);
  };

  // Aggregate Core Analytics Metrics
  const analyticsData = useMemo(() => {
    let totalMinutes = 0;
    let totalProblems = 0;
    let totalFocus = 0;
    let focusCount = 0;

    const subjectTimeMap: Record<string, { minutes: number; problems: number; count: number }> = {};
    const topicTimeMap: Record<string, { minutes: number; problems: number; subject: string }> = {};
    const dailyMap: Record<string, { minutes: number; problems: number; subjects: Set<string> }> = {};

    // Initialize all days in interval with 0
    let intervalDays: Date[] = [];
    try {
      intervalDays = eachDayOfInterval({ start: startDate, end: endDate });
    } catch {
      intervalDays = [new Date()];
    }

    intervalDays.forEach(day => {
      const dKey = format(day, 'yyyy-MM-dd');
      dailyMap[dKey] = { minutes: 0, problems: 0, subjects: new Set<string>() };
    });

    filteredLogs.forEach(log => {
      const duration = Math.max(0, Number(log.durationMinutes)) || 0;
      const problems = Math.max(0, Number(log.problemsSolved)) || 0;
      const focus = Number(log.focusScore);

      totalMinutes += duration;
      totalProblems += problems;
      if (!isNaN(focus) && focus > 0) {
        totalFocus += focus;
        focusCount++;
      }

      // Subject parsing and normalization
      const rawSubject = String(log.subject || 'General').trim();
      const subjectTokens = rawSubject.split(/,| and | & /i).map(s => s.trim()).filter(Boolean);
      const subjects = subjectTokens.length > 0 ? subjectTokens : ['General'];
      const durationShare = duration / subjects.length;
      const problemShare = Math.round(problems / subjects.length);

      subjects.forEach(sub => {
        const normSubject = sub.charAt(0).toUpperCase() + sub.slice(1).toLowerCase();
        if (!subjectTimeMap[normSubject]) {
          subjectTimeMap[normSubject] = { minutes: 0, problems: 0, count: 0 };
        }
        subjectTimeMap[normSubject].minutes += durationShare;
        subjectTimeMap[normSubject].problems += problemShare;
        subjectTimeMap[normSubject].count += 1;
      });

      // Topic aggregation
      if (log.topic && log.topic.trim()) {
        const topicName = log.topic.trim();
        if (!topicTimeMap[topicName]) {
          topicTimeMap[topicName] = { minutes: 0, problems: 0, subject: subjects[0] || 'General' };
        }
        topicTimeMap[topicName].minutes += duration;
        topicTimeMap[topicName].problems += problems;
      }

      // Daily timeline mapping
      if (log.date) {
        const dKey = log.date.substring(0, 10);
        if (dailyMap[dKey]) {
          dailyMap[dKey].minutes += duration;
          dailyMap[dKey].problems += problems;
          subjects.forEach(s => dailyMap[dKey].subjects.add(s));
        }
      }
    });

    // Subject Pie & Bar Data
    const subjectList = Object.entries(subjectTimeMap)
      .map(([name, data]) => ({
        name,
        minutes: Math.round(data.minutes),
        hours: Number((data.minutes / 60).toFixed(1)),
        problems: data.problems,
        count: data.count,
        percentage: totalMinutes > 0 ? Math.round((data.minutes / totalMinutes) * 100) : 0
      }))
      .filter(item => item.minutes > 0)
      .sort((a, b) => b.minutes - a.minutes);

    // Topic Bar Data
    const topicList = Object.entries(topicTimeMap)
      .map(([name, data]) => ({
        name,
        subject: data.subject,
        minutes: Math.round(data.minutes),
        hours: Number((data.minutes / 60).toFixed(1)),
        problems: data.problems
      }))
      .filter(item => item.minutes > 0)
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 8); // Top 8 topics

    // Timeline Trend Data
    let peakMinutes = 0;
    let peakDate = '';
    let activeDaysCount = 0;

    const timelineData = Object.entries(dailyMap).map(([date, data]) => {
      const parsed = parseISO(date);
      const hours = Number((data.minutes / 60).toFixed(1));
      if (data.minutes > 0) {
        activeDaysCount++;
        if (data.minutes > peakMinutes) {
          peakMinutes = data.minutes;
          peakDate = date;
        }
      }
      return {
        date,
        formattedDate: isValid(parsed) ? format(parsed, 'MMM dd') : date,
        minutes: data.minutes,
        hours,
        problems: data.problems,
        velocity: data.problems > 0 && hours > 0 ? Number((data.problems / hours).toFixed(1)) : 0,
        subjects: Array.from(data.subjects).join(', ')
      };
    });

    const formatTime = (mins: number) => {
      if (isNaN(mins) || mins <= 0) return '0m';
      const h = Math.floor(mins / 60);
      const m = Math.round(mins % 60);
      if (h > 0 && m > 0) return `${h}h ${m}m`;
      if (h > 0) return `${h}h`;
      return `${m}m`;
    };

    const avgDailyMinutes = totalDaysInRange > 0 ? (totalMinutes / totalDaysInRange) : 0;
    const avgProblemPerHour = totalMinutes > 0 ? ((totalProblems / (totalMinutes / 60))).toFixed(1) : '0.0';
    const consistencyPercentage = totalDaysInRange > 0 ? Math.round((activeDaysCount / totalDaysInRange) * 100) : 0;
    const avgFocusScore = focusCount > 0 ? (totalFocus / focusCount).toFixed(1) : '8.0';

    return {
      totalMinutes,
      totalHours: Number((totalMinutes / 60).toFixed(1)),
      totalFormatted: formatTime(totalMinutes),
      totalProblems,
      avgDailyFormatted: formatTime(avgDailyMinutes),
      avgDailyMinutes,
      avgProblemPerHour,
      activeDaysCount,
      totalDaysInRange,
      consistencyPercentage,
      avgFocusScore,
      peakDate: peakDate && isValid(parseISO(peakDate)) ? format(parseISO(peakDate), 'MMM dd, yyyy') : 'N/A',
      peakHours: (peakMinutes / 60).toFixed(1),
      subjectList,
      topicList,
      timelineData
    };
  }, [filteredLogs, startDate, endDate, totalDaysInRange]);

  // Velocity Forecast & Readiness Calculator
  const examForecastData = useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);
    const recentLogs = (logs || []).filter(l => {
      if (!l.date) return false;
      const d = parseISO(l.date.substring(0, 10));
      return isValid(d) && isWithinInterval(d, { start: thirtyDaysAgo, end: today });
    });

    const recentMinutes = recentLogs.reduce((sum, l) => sum + (Math.max(0, Number(l.durationMinutes)) || 0), 0);
    const recentHours = recentMinutes / 60;
    const recentDailyVelocityHours = Math.max(0.1, recentHours / 30);

    const allMinutes = (logs || []).reduce((sum, l) => sum + (Math.max(0, Number(l.durationMinutes)) || 0), 0);
    const allHours = allMinutes / 60;

    return examTargets.map(exam => {
      const daysLeft = Math.max(0, differenceInDays(parseISO(exam.targetDate), today));
      
      let loggedHoursForExam = 0;
      if (exam.category === 'General') {
        loggedHoursForExam = allHours;
      } else {
        const subLogs = (logs || []).filter(l => {
          const s = String(l.subject || '').toLowerCase();
          return s.includes(exam.category.toLowerCase());
        });
        const subMins = subLogs.reduce((sum, l) => sum + (Math.max(0, Number(l.durationMinutes)) || 0), 0);
        loggedHoursForExam = subMins / 60;
      }

      const actualCompleted = Math.max(loggedHoursForExam, exam.completedHours || 0);
      const readinessPercent = Math.min(100, Math.round((actualCompleted / exam.targetHours) * 100));
      const hoursRemaining = Math.max(0, exam.targetHours - actualCompleted);
      const requiredDailyPace = daysLeft > 0 ? (hoursRemaining / daysLeft) : 0;

      let paceStatus: 'ahead' | 'on_track' | 'behind' = 'on_track';
      if (recentDailyVelocityHours >= requiredDailyPace * 1.15) {
        paceStatus = 'ahead';
      } else if (recentDailyVelocityHours < requiredDailyPace * 0.85) {
        paceStatus = 'behind';
      }

      const daysToCompleteAtCurrentVelocity = Math.round(hoursRemaining / recentDailyVelocityHours);
      const projectedFinishDaysAhead = daysLeft - daysToCompleteAtCurrentVelocity;

      return {
        ...exam,
        actualCompletedHours: Number(actualCompleted.toFixed(1)),
        readinessPercent,
        hoursRemaining: Number(hoursRemaining.toFixed(1)),
        daysLeft,
        requiredDailyPace: Number(requiredDailyPace.toFixed(1)),
        currentDailyVelocity: Number(recentDailyVelocityHours.toFixed(1)),
        paceStatus,
        daysToCompleteAtCurrentVelocity,
        projectedFinishDaysAhead
      };
    });
  }, [examTargets, logs]);

  // Export Study Data as CSV
  const handleExportCSV = () => {
    if (!logs || logs.length === 0) {
      alert('No study logs available to export.');
      return;
    }

    const headers = [
      'id',
      'date',
      'subject',
      'topic',
      'subtopic',
      'durationMinutes',
      'durationHours',
      'problemsSolved',
      'accuracyPercent',
      'focusScore',
      'efficiencyScore',
      'rawText',
      'createdAt'
    ];

    const rows = logs.map(log => {
      const durationMins = Number(log.durationMinutes) || 0;
      const durationHours = (durationMins / 60).toFixed(2);
      const escape = (str: any) => `"${String(str || '').replace(/"/g, '""')}"`;

      return [
        escape(log.id || ''),
        escape(log.date || ''),
        escape(log.subject || 'General'),
        escape(log.topic || ''),
        escape(log.subtopic || ''),
        durationMins,
        durationHours,
        Number(log.problemsSolved) || 0,
        log.accuracyPercent != null ? Number(log.accuracyPercent) : '',
        Number(log.focusScore) || 8,
        Number(log.efficiencyScore) || 8,
        escape(log.rawText || ''),
        escape(log.createdAt || '')
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    link.setAttribute('href', url);
    link.setAttribute('download', `savantix_study_data_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export Study Data as JSON
  const handleExportJSON = () => {
    if (!logs || logs.length === 0) {
      alert('No study logs available to export.');
      return;
    }

    const exportData = {
      exportVersion: '1.0',
      exportDate: new Date().toISOString(),
      user: {
        uid: user?.uid || 'guest_user',
        email: user?.email || 'guest@savantix.app',
        isGuest
      },
      summary: {
        totalLogs: logs.length,
        totalMinutes: analyticsData.totalMinutes,
        totalProblems: analyticsData.totalProblems,
        timeRangeSelected: timeRange
      },
      logs
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    link.setAttribute('href', url);
    link.setAttribute('download', `savantix_study_backup_${todayStr}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle File Input for Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const isJson = file.name.endsWith('.json');
    const isCsv = file.name.endsWith('.csv');

    if (!isJson && !isCsv) {
      setImportStatus({ type: 'error', text: 'Unsupported file format. Please upload a .json or .csv study data file.' });
      return;
    }

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        let parsedLogs: any[] = [];

        if (isJson) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            parsedLogs = parsed;
          } else if (parsed && Array.isArray(parsed.logs)) {
            parsedLogs = parsed.logs;
          } else {
            throw new Error('Invalid JSON structure: Expected an array of study logs or an object with a "logs" property.');
          }
        } else if (isCsv) {
          const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
          if (lines.length <= 1) {
            throw new Error('CSV file contains no data rows.');
          }
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
          
          parsedLogs = lines.slice(1).map(line => {
            const row: string[] = [];
            let inQuotes = false;
            let current = '';
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                row.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
                current = '';
              } else {
                current += char;
              }
            }
            row.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

            const logObj: any = {};
            headers.forEach((h, idx) => {
              logObj[h] = row[idx] || '';
            });

            return {
              id: logObj.id || 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
              date: logObj.date || format(new Date(), 'yyyy-MM-dd'),
              subject: logObj.subject || 'General',
              topic: logObj.topic || '',
              subtopic: logObj.subtopic || '',
              durationMinutes: Math.max(1, Math.round(Number(logObj.durationMinutes))) || 60,
              problemsSolved: Math.max(0, Math.round(Number(logObj.problemsSolved))) || 0,
              accuracyPercent: logObj.accuracyPercent !== '' && !isNaN(Number(logObj.accuracyPercent)) ? Number(logObj.accuracyPercent) : null,
              focusScore: Math.min(10, Math.max(1, Math.round(Number(logObj.focusScore)))) || 8,
              efficiencyScore: Math.min(10, Math.max(1, Math.round(Number(logObj.efficiencyScore)))) || 8,
              rawText: logObj.rawText || '',
              createdAt: logObj.createdAt || new Date().toISOString()
            };
          });
        }

        const validParsed = parsedLogs.filter(l => l && typeof l === 'object' && l.date);
        if (validParsed.length === 0) {
          throw new Error('No valid study logs found in the uploaded file.');
        }

        setImportPreview(validParsed);
        setImportStatus({
          type: 'info',
          text: `Found ${validParsed.length} study logs ready to import. Review details below and click "Confirm Import".`
        });
      } catch (err: any) {
        setImportStatus({ type: 'error', text: err.message || 'Failed to parse file.' });
        setImportPreview(null);
      }
    };

    reader.readAsText(file);
  };

  // Execute Data Import
  const handleExecuteImport = async () => {
    if (!importPreview || importPreview.length === 0) return;

    try {
      let finalLogs: any[] = [];

      if (importMode === 'merge') {
        const existingIds = new Set((logs || []).map(l => l.id));
        const newLogs = importPreview.filter(l => !existingIds.has(l.id));
        finalLogs = [...newLogs, ...(logs || [])];
      } else {
        finalLogs = [...importPreview];
      }

      const storageKey = isGuest ? 'savantix_guest_logs' : `savantix_user_logs_${user?.uid || 'guest_user'}`;
      localStorage.setItem(storageKey, JSON.stringify(finalLogs));

      for (const log of importPreview) {
        await addLog(log);
      }

      setImportStatus({
        type: 'success',
        text: `Successfully imported ${importPreview.length} logs! Dashboard has been updated.`
      });

      setTimeout(() => {
        setIsImportModalOpen(false);
        setImportPreview(null);
        setImportStatus(null);
      }, 2000);
    } catch (err: any) {
      setImportStatus({ type: 'error', text: err.message || 'Error occurred while saving imported data.' });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-zinc-950 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header & Action Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 tracking-tight">
                  Study Analytics & Velocity Intelligence
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                  Speed-accuracy calibration (SACM), 52-week activity heatmap, exam readiness, and data mobility
                </p>
              </div>
            </div>
          </div>

          {/* Time Range Selector & Data Mobility Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Time Range Pills */}
            <div className="flex items-center p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
              {(
                [
                  { id: '7d', label: '7D' },
                  { id: '30d', label: '30D' },
                  { id: '90d', label: '90D' },
                  { id: '365d', label: '1Y' },
                  { id: 'all', label: 'All' },
                ] as Array<{ id: TimeRangeOption; label: string }>
              ).map((option) => (
                <button
                  key={option.id}
                  onClick={() => setTimeRange(option.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    timeRange === option.id
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/50'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-200 transition-all cursor-pointer shadow-sm"
              title="Export study data as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>

            {/* Export JSON Button */}
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-200 transition-all cursor-pointer shadow-sm"
              title="Export complete study backup as JSON"
            >
              <FileJson className="w-3.5 h-3.5 text-indigo-400" />
              <span>JSON</span>
            </button>

            {/* Import Data Modal Trigger */}
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
            </button>
          </div>
        </div>

        {/* Dynamic Key Performance Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Total Study Time */}
          <div className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-zinc-700 transition-all shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Study Time</span>
              <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl sm:text-3xl font-extrabold text-zinc-100 tracking-tight">
                {analyticsData.totalFormatted}
              </p>
              <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                <span>Avg <strong>{analyticsData.avgDailyFormatted}</strong> / day</span>
              </p>
            </div>
          </div>

          {/* Problems Solved & Solve Velocity */}
          <div className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-zinc-700 transition-all shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Problems Solved</span>
              <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl sm:text-3xl font-extrabold text-zinc-100 tracking-tight">
                {analyticsData.totalProblems}
              </p>
              <p className="text-xs text-emerald-400 mt-1 font-medium">
                ~{analyticsData.avgProblemPerHour} problems / study hr
              </p>
            </div>
          </div>

          {/* Consistency & Active Days */}
          <div className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-zinc-700 transition-all shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Consistency Rate</span>
              <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl sm:text-3xl font-extrabold text-zinc-100 tracking-tight">
                {analyticsData.consistencyPercentage}%
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                {analyticsData.activeDaysCount} of {analyticsData.totalDaysInRange} days active
              </p>
            </div>
          </div>

          {/* Peak Productivity & Focus */}
          <div className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-zinc-700 transition-all shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Peak Day & Focus</span>
              <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-xl sm:text-2xl font-extrabold text-zinc-100 tracking-tight truncate">
                {analyticsData.peakHours}h <span className="text-xs text-zinc-400 font-normal">({analyticsData.peakDate})</span>
              </p>
              <p className="text-xs text-purple-300 mt-1 font-medium">
                Avg Focus: <strong>{analyticsData.avgFocusScore}/10</strong>
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* R3: SPEED VS. ACCURACY CALIBRATION MATRIX (SACM)                         */}
        {/* ========================================================================= */}
        <div className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-6 shadow-xl space-y-6">
          
          {/* SACM Section Header & Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl border border-indigo-500/30 text-indigo-400 shrink-0">
                <Gauge className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-lg font-extrabold text-zinc-100 tracking-tight">
                    Speed vs. Accuracy Calibration Matrix (SACM)
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1">
                    <Crosshair className="w-3 h-3" />
                    Cognitive 4-Quadrant
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Calibrate the trade-off between Solving Velocity (Q/hr) and Accuracy (%) for JEE Advanced & Olympiad performance
                </p>
              </div>
            </div>

            {/* Filter Pills & Calibration Setting Trigger */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Subject Filter */}
              <div className="flex items-center gap-1.5 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800 text-xs">
                <span className="text-zinc-500 font-medium">Subject:</span>
                <select
                  value={sacmSubjectFilter}
                  onChange={(e) => setSacmSubjectFilter(e.target.value)}
                  className="bg-transparent text-zinc-200 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-zinc-900 text-zinc-200">All Subjects</option>
                  {availableSubjects.map(sub => (
                    <option key={sub} value={sub} className="bg-zinc-900 text-zinc-200">{sub}</option>
                  ))}
                </select>
              </div>

              {/* Time Range Filter */}
              <div className="flex items-center p-1 bg-zinc-950 border border-zinc-800 rounded-xl">
                {(
                  [
                    { id: '7d', label: '7D' },
                    { id: '30d', label: '30D' },
                    { id: 'all', label: 'All' }
                  ] as Array<{ id: TimeRangeOption; label: string }>
                ).map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSacmTimeRange(opt.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      sacmTimeRange === opt.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Threshold Adjuster Toggle */}
              <button
                onClick={() => setShowSACMSettings(!showSACMSettings)}
                className={`p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  showSACMSettings
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-100'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
                title="Adjust Velocity & Accuracy Calibration Benchmarks"
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Benchmarks</span>
              </button>
            </div>
          </div>

          {/* Benchmark Settings Slider Panel */}
          {showSACMSettings && (
            <div className="p-4 bg-zinc-950/90 border border-zinc-800 rounded-2xl space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs border-b border-zinc-800/80 pb-2">
                <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  Calibrate Exam Target Thresholds
                </span>
                <button
                  onClick={() => {
                    setVelocityThreshold(DEFAULT_VELOCITY_THRESHOLD);
                    setAccuracyThreshold(DEFAULT_ACCURACY_THRESHOLD);
                  }}
                  className="text-[11px] text-indigo-400 hover:underline cursor-pointer"
                >
                  Reset Defaults (15 Q/hr, 80%)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Velocity Threshold Slider */}
                <div className="space-y-1.5 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/60">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Target Velocity ($V_0$):</span>
                    <strong className="text-indigo-400 font-mono">{velocityThreshold} Q/hr ({Math.round(60 / velocityThreshold)} min/q)</strong>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="40"
                    step="1"
                    value={velocityThreshold}
                    onChange={(e) => setVelocityThreshold(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>5 Q/hr (Tier 3 Olympiad)</span>
                    <span>15 Q/hr (JEE Adv)</span>
                    <span>40 Q/hr (JEE Main/Speed)</span>
                  </div>
                </div>

                {/* Accuracy Threshold Slider */}
                <div className="space-y-1.5 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/60">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Target Accuracy ($Acc_0$):</span>
                    <strong className="text-emerald-400 font-mono">{accuracyThreshold}%</strong>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="5"
                    value={accuracyThreshold}
                    onChange={(e) => setAccuracyThreshold(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>50% (Exploratory)</span>
                    <span>80% (JEE Adv Cutoff)</span>
                    <span>95% (Top 100 AIR)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Executive STEM Diagnostic & Calibration Summary Banner */}
          <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800/90 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Dominant Archetype:</span>
                    {sacmReport.dominantQuadrant ? (
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${sacmReport.quadrants[sacmReport.dominantQuadrant].badgeColor}`}>
                        {sacmReport.quadrants[sacmReport.dominantQuadrant].name}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-400">
                        Awaiting Calibration Data
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-300 mt-1 font-medium">
                    {sacmReport.executiveSummary}
                  </p>
                </div>
              </div>

              {/* Quick Calibration Numbers */}
              <div className="flex items-center gap-4 text-xs font-mono bg-zinc-900/90 px-3.5 py-2 rounded-xl border border-zinc-800 shrink-0">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Avg Speed</span>
                  <strong className="text-indigo-400 text-sm">{sacmReport.overallAvgVelocity} Q/h</strong>
                </div>
                <div className="w-px h-7 bg-zinc-800" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Avg Accuracy</span>
                  <strong className={`text-sm ${sacmReport.overallAvgAccuracy >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {sacmReport.overallAvgAccuracy}%
                  </strong>
                </div>
                <div className="w-px h-7 bg-zinc-800" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Sessions</span>
                  <strong className="text-zinc-200 text-sm">{sacmReport.totalSessionsEvaluated}</strong>
                </div>
              </div>
            </div>

            {/* Prescriptions Bullet Points */}
            {sacmReport.topPrescriptions.length > 0 && (
              <div className="pt-3 border-t border-zinc-800/80 space-y-1.5">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Actionable Exam Prescriptions:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {sacmReport.topPrescriptions.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/60 text-zinc-300">
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Interactive Scatter Plot Matrix & Quadrant Diagnostics Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Recharts Interactive Scatter Plot (Span 7) */}
            <div className="lg:col-span-7 bg-zinc-950/80 border border-zinc-800/90 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-indigo-400" />
                      4-Quadrant Scatter Calibration
                    </h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Hover over any session data point to inspect topic details, pacing, and diagnostic notes
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {sacmReport.dataPoints.length} Sessions Plotted
                  </span>
                </div>

                {/* Quadrant Legend Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-[10px]">
                  <div className="flex items-center gap-1.5 bg-emerald-950/30 px-2 py-1 rounded-lg border border-emerald-500/20 text-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="truncate">Q1: Mastery ({sacmReport.quadrants.Q1_Mastery.count})</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-blue-950/30 px-2 py-1 rounded-lg border border-blue-500/20 text-blue-300">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    <span className="truncate">Q2: Overthinking ({sacmReport.quadrants.Q2_Overthinking.count})</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-amber-950/30 px-2 py-1 rounded-lg border border-amber-500/20 text-amber-300">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span className="truncate">Q3: Rushing ({sacmReport.quadrants.Q3_Rushing.count})</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-rose-950/30 px-2 py-1 rounded-lg border border-rose-500/20 text-rose-300">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <span className="truncate">Q4: Struggling ({sacmReport.quadrants.Q4_Struggling.count})</span>
                  </div>
                </div>
              </div>

              {/* Scatter Chart */}
              <div className="h-80 w-full relative">
                {sacmReport.dataPoints.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 space-y-2">
                    <Crosshair className="w-10 h-10 text-zinc-700 animate-pulse" />
                    <p className="text-xs font-semibold text-zinc-400">No session points in selected interval</p>
                    <p className="text-[11px] text-zinc-600 max-w-xs">
                      Log study sessions with question counts to calibrate your velocity-accuracy curve.
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 25, bottom: 25, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis
                        type="number"
                        dataKey="velocityQpH"
                        name="Velocity"
                        unit=" Q/h"
                        domain={[0, (dataMax: number) => Math.max(35, Math.ceil((dataMax + 5) / 5) * 5)]}
                        stroke="#71717a"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#3f3f46' }}
                        label={{
                          value: 'Solving Velocity (Questions / Hour)',
                          position: 'insideBottom',
                          offset: -15,
                          fill: '#a1a1aa',
                          fontSize: 11
                        }}
                      />
                      <YAxis
                        type="number"
                        dataKey="accuracyPercent"
                        name="Accuracy"
                        unit="%"
                        domain={[0, 100]}
                        ticks={[0, 20, 40, 60, 80, 100]}
                        stroke="#71717a"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#3f3f46' }}
                        label={{
                          value: 'Accuracy (%)',
                          angle: -90,
                          position: 'insideLeft',
                          offset: 5,
                          fill: '#a1a1aa',
                          fontSize: 11
                        }}
                      />
                      <ZAxis range={[80, 80]} />
                      <Tooltip content={<SACMCustomTooltip />} />
                      
                      {/* Vertical Speed Benchmark Line */}
                      <ReferenceLine
                        x={velocityThreshold}
                        stroke="#6366f1"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        label={{
                          value: `Speed: ${velocityThreshold} Q/h`,
                          fill: '#818cf8',
                          fontSize: 10,
                          position: 'insideTopRight'
                        }}
                      />

                      {/* Horizontal Accuracy Benchmark Line */}
                      <ReferenceLine
                        y={accuracyThreshold}
                        stroke="#10b981"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        label={{
                          value: `Acc: ${accuracyThreshold}%`,
                          fill: '#34d399',
                          fontSize: 10,
                          position: 'insideTopLeft'
                        }}
                      />

                      {/* Scatter Dots */}
                      <Scatter name="Sessions" data={sacmReport.dataPoints}>
                        {sacmReport.dataPoints.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            stroke="#18181b"
                            strokeWidth={1.5}
                            className="transition-all hover:scale-125 cursor-pointer"
                          />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Matrix Watermark Footnote */}
              <div className="flex justify-between items-center text-[10px] text-zinc-500 pt-2 border-t border-zinc-900">
                <span>Top-Right = Flow / Mastery ($V \ge {velocityThreshold}, Acc \ge {accuracyThreshold}\%$)</span>
                <span>Bottom-Left = Struggling / Fatigued</span>
              </div>
            </div>

            {/* Right: 4 Quadrant Summary Cards Grid (Span 5) */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3.5">
              
              {/* Q1: Mastery Zone Card */}
              <div className="bg-zinc-950/80 border border-emerald-500/30 hover:border-emerald-500/50 rounded-2xl p-4 space-y-2 transition-all shadow-md">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <h5 className="text-xs font-bold text-emerald-400">Q1: Flow / Mastery Zone</h5>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                    {sacmReport.quadrants.Q1_Mastery.count} Sessions ({sacmReport.quadrants.Q1_Mastery.percentage}%)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-zinc-300 bg-zinc-900/60 p-2 rounded-xl border border-zinc-800/60">
                  <div>Avg Velocity: <strong className="text-emerald-400">{sacmReport.quadrants.Q1_Mastery.avgVelocity} Q/h</strong></div>
                  <div>Avg Acc: <strong className="text-emerald-400">{sacmReport.quadrants.Q1_Mastery.avgAccuracy}%</strong></div>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  <strong className="text-zinc-200">Prescription: </strong>
                  {sacmReport.quadrants.Q1_Mastery.actionablePrescription}
                </p>
              </div>

              {/* Q2: Overthinking Zone Card */}
              <div className="bg-zinc-950/80 border border-blue-500/30 hover:border-blue-500/50 rounded-2xl p-4 space-y-2 transition-all shadow-md">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <h5 className="text-xs font-bold text-blue-400">Q2: Deliberate / Overthinking</h5>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-500/30">
                    {sacmReport.quadrants.Q2_Overthinking.count} Sessions ({sacmReport.quadrants.Q2_Overthinking.percentage}%)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-zinc-300 bg-zinc-900/60 p-2 rounded-xl border border-zinc-800/60">
                  <div>Avg Velocity: <strong className="text-blue-400">{sacmReport.quadrants.Q2_Overthinking.avgVelocity} Q/h</strong></div>
                  <div>Avg Acc: <strong className="text-blue-400">{sacmReport.quadrants.Q2_Overthinking.avgAccuracy}%</strong></div>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  <strong className="text-zinc-200">Prescription: </strong>
                  {sacmReport.quadrants.Q2_Overthinking.actionablePrescription}
                </p>
              </div>

              {/* Q3: Rushing Zone Card */}
              <div className="bg-zinc-950/80 border border-amber-500/30 hover:border-amber-500/50 rounded-2xl p-4 space-y-2 transition-all shadow-md">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <h5 className="text-xs font-bold text-amber-400">Q3: Rushing / Guessing</h5>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/30">
                    {sacmReport.quadrants.Q3_Rushing.count} Sessions ({sacmReport.quadrants.Q3_Rushing.percentage}%)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-zinc-300 bg-zinc-900/60 p-2 rounded-xl border border-zinc-800/60">
                  <div>Avg Velocity: <strong className="text-amber-400">{sacmReport.quadrants.Q3_Rushing.avgVelocity} Q/h</strong></div>
                  <div>Avg Acc: <strong className="text-amber-400">{sacmReport.quadrants.Q3_Rushing.avgAccuracy}%</strong></div>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  <strong className="text-zinc-200">Prescription: </strong>
                  {sacmReport.quadrants.Q3_Rushing.actionablePrescription}
                </p>
              </div>

              {/* Q4: Struggling Zone Card */}
              <div className="bg-zinc-950/80 border border-rose-500/30 hover:border-rose-500/50 rounded-2xl p-4 space-y-2 transition-all shadow-md">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <h5 className="text-xs font-bold text-rose-400">Q4: Struggling / Fatigued</h5>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-500/30">
                    {sacmReport.quadrants.Q4_Struggling.count} Sessions ({sacmReport.quadrants.Q4_Struggling.percentage}%)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-zinc-300 bg-zinc-900/60 p-2 rounded-xl border border-zinc-800/60">
                  <div>Avg Velocity: <strong className="text-rose-400">{sacmReport.quadrants.Q4_Struggling.avgVelocity} Q/h</strong></div>
                  <div>Avg Acc: <strong className="text-rose-400">{sacmReport.quadrants.Q4_Struggling.avgAccuracy}%</strong></div>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  <strong className="text-zinc-200">Prescription: </strong>
                  {sacmReport.quadrants.Q4_Struggling.actionablePrescription}
                </p>
              </div>

            </div>

          </div>

          {/* Subject Speed-Accuracy Calibration Overview Table */}
          {sacmReport.subjectCalibrations.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-indigo-400" />
                  Subject Velocity Calibration Status
                </h4>
                <span className="text-[11px] text-zinc-500">
                  Calibrated against $V_0 = {velocityThreshold}$ Q/hr & $Acc_0 = {accuracyThreshold}\%$
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {sacmReport.subjectCalibrations.map((sub) => {
                  const dominantMeta = QUADRANT_META[sub.dominantQuadrant];
                  return (
                    <div
                      key={sub.subject}
                      className="bg-zinc-950/70 border border-zinc-800/90 rounded-xl p-3.5 space-y-2.5 hover:border-zinc-700 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-100 text-sm">{sub.subject}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${dominantMeta.badgeColor}`}>
                          {dominantMeta.shortName}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[11px] font-mono bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/60">
                        <div>
                          <span className="text-[9px] text-zinc-500 block">TIME</span>
                          <span className="text-zinc-300 font-bold">{sub.totalHours}h</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-zinc-500 block">SPEED</span>
                          <span className="text-indigo-400 font-bold">{sub.avgVelocity} Q/h</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-zinc-500 block">ACC</span>
                          <span className={`font-bold ${sub.avgAccuracy >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {sub.avgAccuracy}%
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-zinc-400 leading-snug">
                        {sub.recommendation}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* R4: DYNAMIC SUBJECT EQUILIBRIUM MATRIX (PID REBALANCER)                   */}
        {/* ========================================================================= */}
        <div className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-6 shadow-xl space-y-6">
          
          {/* Section Header & Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-indigo-500/20 rounded-2xl border border-emerald-500/30 text-emerald-400 shrink-0">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-lg font-extrabold text-zinc-100 tracking-tight">
                    Dynamic Subject Equilibrium Matrix (PID Rebalancer)
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                    <SlidersHorizontal className="w-3 h-3" />
                    Shannon Entropy & PID Engine
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Rolling 7-day multi-subject parity tracking and discrete PID corrective daily prescriptions to eliminate subject neglect
                </p>
              </div>
            </div>

            {/* Customizer & Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowWeightCustomizer(!showWeightCustomizer)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  showWeightCustomizer
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-100'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:border-zinc-700'
                }`}
                title="Customize subject target allocation weights"
              >
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <span>Target Weights</span>
              </button>

              <button
                type="button"
                onClick={handleResetPIDWeights}
                className="p-2 bg-zinc-950 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded-xl text-xs transition-colors cursor-pointer"
                title="Reset target weights to JEE defaults (Physics 35%, Math 35%, Chem 30%)"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Target Weight Customizer Drawer */}
          {showWeightCustomizer && (
            <div className="p-5 bg-zinc-950/90 border border-zinc-800 rounded-2xl space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs border-b border-zinc-800/80 pb-2">
                <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                  Customize Target Subject Proportions ($p_i^*$)
                </span>
                <span className="text-[11px] text-zinc-500">
                  Weights auto-normalize to 100% total
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {Object.entries(pidWeights).map(([subj, fraction]) => {
                  const pct = Math.round(fraction * 100);
                  const isDeletable = Object.keys(pidWeights).length > 2;

                  return (
                    <div key={subj} className="bg-zinc-900/70 p-3.5 rounded-xl border border-zinc-800/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-200">{subj}</span>
                        <div className="flex items-center gap-2">
                          <strong className="text-emerald-400 font-mono text-xs">{pct}%</strong>
                          {isDeletable && !['Physics', 'Mathematics', 'Chemistry'].includes(subj) && (
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomSubject(subj)}
                              className="text-zinc-500 hover:text-rose-400 p-0.5"
                              title={`Remove ${subj}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="80"
                        step="5"
                        value={pct}
                        onChange={(e) => handleUpdateSubjectWeight(subj, Number(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                        <span>Min 5%</span>
                        <span>Current: {pct}%</span>
                        <span>Max 80%</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Custom Subject Bar */}
              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-zinc-800/70 text-xs">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <input
                    type="text"
                    value={newSubjectInput}
                    onChange={(e) => setNewSubjectInput(e.target.value)}
                    placeholder="Add custom subject (e.g. Biology, CS)..."
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustomSubject(); }}
                  />
                  <select
                    value={newSubjectWeightPct}
                    onChange={(e) => setNewSubjectWeightPct(Number(e.target.value))}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-2 text-xs text-zinc-300 focus:outline-none"
                  >
                    <option value={15}>15%</option>
                    <option value={20}>20%</option>
                    <option value={25}>25%</option>
                    <option value={30}>30%</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddCustomSubject}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleResetPIDWeights}
                  className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-xl font-medium cursor-pointer transition-colors"
                >
                  Reset JEE Standard (35% Phy, 35% Math, 30% Chem)
                </button>
              </div>
            </div>
          )}

          {/* Executive AI Prescription Banner */}
          <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800/90 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Equilibrium Status:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${equilibriumReport.statusBadgeColor}`}>
                      {equilibriumReport.statusLabel}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-200 mt-1 font-medium leading-relaxed">
                    {equilibriumReport.actionablePrescription}
                  </p>
                </div>
              </div>

              {/* Equilibrium Metric Badge */}
              <div className="flex items-center gap-4 text-xs font-mono bg-zinc-900/90 px-3.5 py-2 rounded-xl border border-zinc-800 shrink-0">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Shannon Entropy</span>
                  <strong className={`text-sm ${
                    equilibriumReport.equilibriumScore >= 90 ? 'text-emerald-400' :
                    equilibriumReport.equilibriumScore >= 75 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {equilibriumReport.equilibriumScore}%
                  </strong>
                </div>
                <div className="w-px h-7 bg-zinc-800" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">7-Day Study</span>
                  <strong className="text-indigo-300 text-sm">{equilibriumReport.totalHours7Days}h</strong>
                </div>
                <div className="w-px h-7 bg-zinc-800" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Disciplines</span>
                  <strong className="text-zinc-200 text-sm">{equilibriumReport.activeSubjectCount}</strong>
                </div>
              </div>
            </div>

            {/* Detailed Prescriptions Bullet List */}
            {equilibriumReport.detailedPrescriptions.length > 0 && (
              <div className="pt-3 border-t border-zinc-800/80 space-y-1.5">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
                  PID Corrective Prescriptions:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {equilibriumReport.detailedPrescriptions.map((desc, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/60 text-zinc-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <span className="leading-snug">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Grid Layout: Left Shannon Entropy Meter / Right Subject Distribution Bars */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Shannon Entropy Balance Meter Card (Span 5) */}
            <div className="lg:col-span-5 bg-zinc-950/80 border border-zinc-800/90 rounded-2xl p-5 space-y-5 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Shannon Entropy Parity Meter
                  </h4>
                  <span className="text-[11px] font-mono text-zinc-400">
                    Rolling 7 Days
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-2">
                  Measures information dispersion and multi-discipline parity across your study schedule.
                </p>
              </div>

              {/* Entropy Radial / Circle Meter */}
              <div className="flex flex-col items-center justify-center py-4 relative">
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="stroke-zinc-800"
                      strokeWidth="10"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className={`transition-all duration-700 ${
                        equilibriumReport.equilibriumScore >= 90 ? 'stroke-emerald-500' :
                        equilibriumReport.equilibriumScore >= 75 ? 'stroke-amber-500' : 'stroke-rose-500'
                      }`}
                      strokeWidth="10"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={2 * Math.PI * 40 * (1 - (equilibriumReport.equilibriumScore / 100))}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  
                  {/* Center Score */}
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-extrabold font-mono text-zinc-100 tracking-tight">
                      {equilibriumReport.equilibriumScore}%
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 border ${equilibriumReport.statusBadgeColor}`}>
                      {equilibriumReport.status === 'harmonious' ? 'Harmonious' : equilibriumReport.status === 'mild_skew' ? 'Mild Skew' : 'Neglect Alert'}
                    </span>
                  </div>
                </div>

                {/* Score Status Legend */}
                <div className="flex items-center justify-center gap-4 text-[10px] text-zinc-400 mt-2">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    ≥90% Harmonious
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    75-89% Mild Skew
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    &lt;75% Neglect
                  </span>
                </div>
              </div>

              {/* Mathematical Formulation Footer */}
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/60 text-[10px] text-zinc-400 space-y-1">
                <div className="flex justify-between font-mono text-zinc-300">
                  <span>Entropy Formula:</span>
                  <span className="text-emerald-400 font-bold">E = (-Σ p_i ln p_i / ln N) × 100%</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Raw Entropy H(P): {equilibriumReport.shannonEntropyRaw.toFixed(3)}</span>
                  <span>Max H_max: {equilibriumReport.maxPossibleEntropy.toFixed(3)}</span>
                </div>
              </div>
            </div>

            {/* Right: Subject Distribution & PID Corrections (Span 7) */}
            <div className="lg:col-span-7 bg-zinc-950/80 border border-zinc-800/90 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    Subject Distribution & Daily PID Allocator
                  </h4>
                  <span className="text-[11px] text-zinc-400">
                    Kp = 120m, Ki = 30m, Kd = 20m
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-2">
                  Comparison between Actual 7-Day Study % and Target % with discrete PID corrective minutes for tomorrow.
                </p>
              </div>

              {/* Subject Distribution Cards */}
              <div className="space-y-3">
                {equilibriumReport.subjectDistributions.map((sub) => {
                  const isNeglected = sub.deficitPercentage > 5;
                  const isSurplus = sub.deficitPercentage < -5;

                  return (
                    <div
                      key={sub.subject}
                      className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-3.5 space-y-2.5 hover:border-zinc-700 transition-all"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: sub.color }}
                          />
                          <span className="font-bold text-zinc-100 text-sm">{sub.subject}</span>
                          <span className="text-[11px] text-zinc-500 font-mono">
                            ({sub.actualMinutes}m / {Math.round(sub.actualMinutes / 60 * 10) / 10}h)
                          </span>
                        </div>

                        {/* PID Output Badge for Tomorrow */}
                        <div className="flex items-center gap-2">
                          {sub.recommendedDailyAdjustmentMins > 0 ? (
                            <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                              <Plus className="w-3 h-3" />
                              {sub.recommendedDailyAdjustmentMins}m Tomorrow
                            </span>
                          ) : sub.recommendedDailyAdjustmentMins < 0 ? (
                            <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <Minus className="w-3 h-3" />
                              {Math.abs(sub.recommendedDailyAdjustmentMins)}m Tomorrow
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                              On Target (0m)
                            </span>
                          )}

                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                            isNeglected ? 'text-rose-400 bg-rose-950/60 border-rose-500/30' :
                            isSurplus ? 'text-amber-400 bg-amber-950/60 border-amber-500/30' :
                            'text-emerald-400 bg-emerald-950/60 border-emerald-500/30'
                          }`}>
                            {isNeglected ? `+${sub.deficitPercentage}% Deficit` :
                             isSurplus ? `${sub.deficitPercentage}% Surplus` : 'Balanced'}
                          </span>
                        </div>
                      </div>

                      {/* Multi-layered Comparison Bar (Actual vs Target) */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                          <span>Actual: <strong className="text-zinc-200">{sub.actualPercentage}%</strong></span>
                          <span>Target: <strong className="text-emerald-400">{sub.targetPercentage}%</strong></span>
                        </div>
                        <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden p-0.5 border border-zinc-800 relative">
                          {/* Target Guideline Line */}
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-white/80 z-10 shadow-[0_0_4px_white]"
                            style={{ left: `${Math.min(100, Math.max(0, sub.targetPercentage))}%` }}
                            title={`Target: ${sub.targetPercentage}%`}
                          />
                          {/* Actual Progress Bar */}
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, Math.max(2, sub.actualPercentage))}%`,
                              backgroundColor: sub.color
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* PID Legend / Clamping Note */}
              <div className="flex justify-between items-center text-[10px] text-zinc-500 pt-2 border-t border-zinc-900">
                <span>PID Corrective Range Clamped to [−60m, +90m]</span>
                <span>$e_i = p_i^* - p_i$ (Error Signal)</span>
              </div>
            </div>

          </div>

        </div>

        {/* 52-Week Interactive Heatmap */}
        <StudyHeatmap logs={logs} />

        {/* Velocity Forecast & Exam Readiness Intelligence */}
        <div className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100">Velocity Forecast & Exam Readiness Calculator</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Dynamic milestone forecasting based on target prep hours from your exam countdowns
                </p>
              </div>
            </div>

            {/* Exam Target Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-medium">Filter:</span>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Exam Milestones</option>
                {examForecastData.map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Exam Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {examForecastData
              .filter(exam => selectedExamId === 'all' || exam.id === selectedExamId)
              .map(exam => {
                const isAhead = exam.paceStatus === 'ahead';
                const isBehind = exam.paceStatus === 'behind';

                return (
                  <div
                    key={exam.id}
                    className="bg-zinc-950/80 border border-zinc-800/90 rounded-2xl p-5 space-y-4 hover:border-zinc-700 transition-all shadow-md relative"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-zinc-100">{exam.name}</h4>
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-full">
                            {exam.category}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Target: {format(parseISO(exam.targetDate), 'MMM dd, yyyy')}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-2xl font-mono font-bold text-indigo-400">
                          {exam.daysLeft}d
                        </span>
                        <span className="block text-[10px] uppercase tracking-wider text-zinc-400 font-bold">
                          Remaining
                        </span>
                      </div>
                    </div>

                    {/* Readiness Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-400">
                          Completed: <strong className="text-zinc-200">{exam.actualCompletedHours}h</strong> / {exam.targetHours}h
                        </span>
                        <span className="font-bold text-indigo-300">{exam.readinessPercent}% Ready</span>
                      </div>
                      <div className="w-full bg-zinc-800/80 h-2.5 rounded-full overflow-hidden p-0.5">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]"
                          style={{ width: `${exam.readinessPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Velocity Diagnostics & Actionable Advice */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-800/80 text-xs">
                      <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/60">
                        <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Required Pace</span>
                        <span className="font-bold text-zinc-200 text-sm mt-0.5 block">
                          {exam.requiredDailyPace} hrs/day
                        </span>
                      </div>

                      <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/60">
                        <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Current Velocity</span>
                        <span className={`font-bold text-sm mt-0.5 block ${
                          isAhead ? 'text-emerald-400' : isBehind ? 'text-amber-400' : 'text-indigo-400'
                        }`}>
                          {exam.currentDailyVelocity} hrs/day
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between ${
                      isAhead
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                        : isBehind
                        ? 'bg-amber-500/10 border border-amber-500/20 text-amber-300'
                        : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-300'
                    }`}>
                      <span className="flex items-center gap-1.5 font-medium">
                        {isAhead ? <Sparkles className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                        {isAhead
                          ? 'Ahead of Schedule: You will complete prep early!'
                          : isBehind
                          ? 'Acceleration Needed: Increase daily pace by ' + (exam.requiredDailyPace - exam.currentDailyVelocity).toFixed(1) + 'h'
                          : 'On Track: Maintaining optimal prep velocity'}
                      </span>
                      <span className="font-mono text-[11px] font-bold">
                        {exam.hoursRemaining}h left
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Dynamic Velocity Charts & Distribution Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Study Timeline & Velocity Trends (Span 2) */}
          <div className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-6 shadow-xl lg:col-span-2 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
              <div>
                <h3 className="text-base font-bold text-zinc-100">Study Velocity & Volume Timeline</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Daily study hours and problem count trends over the selected period
                </p>
              </div>

              {/* Metric Toggle */}
              <div className="flex items-center p-1 bg-zinc-950 border border-zinc-800 rounded-xl">
                <button
                  onClick={() => setMetricView('hours')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    metricView === 'hours' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Hours
                </button>
                <button
                  onClick={() => setMetricView('problems')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    metricView === 'problems' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Problems
                </button>
                <button
                  onClick={() => setMetricView('combined')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    metricView === 'combined' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Both
                </button>
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorProblems" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis
                    dataKey="formattedDate"
                    stroke="#71717a"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={25}
                  />
                  <YAxis
                    stroke="#71717a"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${val}`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '0.75rem', fontSize: '12px' }}
                    itemStyle={{ color: '#e4e4e7' }}
                    formatter={(value: any, name: any) => {
                      if (name === 'hours') return [`${value} hrs`, 'Study Time'];
                      if (name === 'problems') return [`${value} questions`, 'Problems Solved'];
                      return [value, name];
                    }}
                  />
                  {(metricView === 'hours' || metricView === 'combined') && (
                    <Area
                      type="monotone"
                      dataKey="hours"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorHours)"
                    />
                  )}
                  {(metricView === 'problems' || metricView === 'combined') && (
                    <Area
                      type="monotone"
                      dataKey="problems"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorProblems)"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Subject Distribution Donut (Span 1) */}
          <div className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="border-b border-zinc-800/80 pb-3">
              <h3 className="text-base font-bold text-zinc-100">Subject Distribution</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Real percentage breakdown</p>
            </div>

            {analyticsData.subjectList.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-zinc-400 text-center">
                No subject logs recorded in this period.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.subjectList}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="minutes"
                      >
                        {analyticsData.subjectList.map((entry, index) => (
                          <Cell key={`pie-cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '0.5rem', fontSize: '12px' }}
                        itemStyle={{ color: '#e4e4e7' }}
                        formatter={(value: any) => {
                          const mins = Number(value) || 0;
                          const h = Math.floor(mins / 60);
                          const m = mins % 60;
                          return [`${h}h ${m}m`, 'Time'];
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Color-Coded Subject Badges */}
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {analyticsData.subjectList.map((subject, idx) => (
                    <div key={subject.name} className="flex items-center justify-between text-xs bg-zinc-950/60 px-3 py-2 rounded-xl border border-zinc-800/60">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: PALETTE[idx % PALETTE.length] }}
                        />
                        <span className="font-semibold text-zinc-200">{subject.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-400 font-mono">
                        <span>{subject.hours}h</span>
                        <span className="px-1.5 py-0.5 bg-zinc-800 rounded text-[10px] text-zinc-300 font-bold">
                          {subject.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Topic Mastery & Velocity Breakdown Bar Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Top Topics by Study Time */}
          <div className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="border-b border-zinc-800/80 pb-3">
              <h3 className="text-base font-bold text-zinc-100">Top Topic Velocity Breakdown</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Hours invested & questions completed per topic</p>
            </div>

            {analyticsData.topicList.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-xs text-zinc-400 text-center">
                Log topics to see granular topic mastery breakdowns.
              </div>
            ) : (
              <div className="space-y-3">
                {analyticsData.topicList.map((topic, index) => {
                  const maxHours = analyticsData.topicList[0]?.hours || 1;
                  const barWidth = Math.max(8, Math.round((topic.hours / maxHours) * 100));

                  return (
                    <div key={topic.name} className="space-y-1.5 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/60">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span className="font-bold text-zinc-200 truncate">{topic.name}</span>
                          <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[10px] text-indigo-400">
                            {topic.subject}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-zinc-400 shrink-0 font-mono text-[11px]">
                          <span>{topic.hours}h</span>
                          <span className="text-emerald-400 font-semibold">{topic.problems} Qs</span>
                        </div>
                      </div>
                      <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${barWidth}%`,
                            backgroundColor: PALETTE[index % PALETTE.length]
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Time & Problems by Subject Comparison Chart */}
          <div className="bg-zinc-900/70 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="border-b border-zinc-800/80 pb-3">
              <h3 className="text-base font-bold text-zinc-100">Subject Comparison (Hours vs Problems)</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Comparative load distribution</p>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.subjectList} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '0.5rem', fontSize: '12px' }}
                    cursor={{ fill: '#27272a' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Bar dataKey="hours" name="Hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="problems" name="Problems" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Data Import & Export Modal */}
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
              
              <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-100">Import Study History</h3>
                    <p className="text-xs text-zinc-400">Restore or merge logs from Savantix CSV or JSON files</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setImportPreview(null);
                    setImportStatus(null);
                  }}
                  className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Banner */}
              {importStatus && (
                <div className={`p-4 rounded-xl text-xs border ${
                  importStatus.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : importStatus.type === 'error'
                    ? 'bg-red-500/10 border-red-500/30 text-red-300'
                    : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                }`}>
                  {importStatus.text}
                </div>
              )}

              {/* File Upload Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-700 hover:border-indigo-500/80 bg-zinc-950/60 rounded-2xl p-8 text-center cursor-pointer transition-all space-y-3 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="p-3 bg-zinc-900 group-hover:bg-indigo-600/20 rounded-full w-12 h-12 mx-auto flex items-center justify-center text-zinc-400 group-hover:text-indigo-400 transition-colors">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-200">
                    Click to select or drag & drop a file
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Supports <strong>.json</strong> (Savantix Backup) and <strong>.csv</strong> (Spreadsheet data)
                  </p>
                </div>
              </div>

              {/* Import Options & Preview */}
              {importPreview && (
                <div className="space-y-4 bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-300">Import Strategy</span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                        <input
                          type="radio"
                          name="importMode"
                          value="merge"
                          checked={importMode === 'merge'}
                          onChange={() => setImportMode('merge')}
                          className="accent-indigo-600"
                        />
                        <span>Merge (Keep Existing)</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                        <input
                          type="radio"
                          name="importMode"
                          value="replace"
                          checked={importMode === 'replace'}
                          onChange={() => setImportMode('replace')}
                          className="accent-indigo-600"
                        />
                        <span>Replace All</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-center text-xs pt-2 border-t border-zinc-800">
                    <div className="bg-zinc-900 p-2 rounded-lg">
                      <span className="text-zinc-500 text-[10px] block">Logs Found</span>
                      <strong className="text-indigo-400 text-sm">{importPreview.length}</strong>
                    </div>
                    <div className="bg-zinc-900 p-2 rounded-lg">
                      <span className="text-zinc-500 text-[10px] block">Total Study Time</span>
                      <strong className="text-emerald-400 text-sm">
                        {Math.round(importPreview.reduce((sum, l) => sum + (Number(l.durationMinutes) || 0), 0) / 60)} hrs
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setImportPreview(null);
                    setImportStatus(null);
                  }}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                {importPreview && (
                  <button
                    type="button"
                    onClick={handleExecuteImport}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm Import ({importPreview.length} logs)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
