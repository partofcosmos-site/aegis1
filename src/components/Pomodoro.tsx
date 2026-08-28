import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Save, 
  Settings, 
  Music, 
  Volume2, 
  VolumeX, 
  Volume1, 
  Check, 
  Plus, 
  Trash2, 
  Edit3, 
  Flame, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Brain, 
  Radio, 
  Headphones, 
  Sliders, 
  Bell, 
  Info, 
  X,
  Target,
  Layers,
  Award,
  ListTodo
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { format } from 'date-fns';
import { 
  pomodoroAudio, 
  SOUND_PRESETS, 
  SoundPreset, 
  SoundPresetId 
} from '../utils/pomodoroAudioEngine';

export interface PomodoroTask {
  id: string;
  title: string;
  subject: string;
  estimatedPomodoros: number;
  completedPomodoros: number;
  isCompleted: boolean;
  createdAt: number;
}

const STORAGE_KEY_TASKS = 'savantix_pomodoro_tasks_v2';
const STORAGE_KEY_SETTINGS = 'savantix_pomodoro_settings_v2';

const SUBJECT_OPTIONS = [
  'General',
  'Physics',
  'Mathematics',
  'Chemistry',
  'Computer Science',
  'Biology',
  'Literature',
  'Engineering',
  'Research'
];

export const Pomodoro: React.FC = () => {
  const { user, addLog } = useAppContext();

  // --- TIMER SETTINGS STATE ---
  const [focusDuration, setFocusDuration] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return JSON.parse(saved).focusDuration || 25;
    } catch {}
    return 25;
  });

  const [shortBreakDuration, setShortBreakDuration] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return JSON.parse(saved).shortBreakDuration || 5;
    } catch {}
    return 5;
  });

  const [longBreakDuration, setLongBreakDuration] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return JSON.parse(saved).longBreakDuration || 15;
    } catch {}
    return 15;
  });

  const [longBreakInterval, setLongBreakInterval] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return JSON.parse(saved).longBreakInterval || 4;
    } catch {}
    return 4;
  });

  const [autoStartBreaks, setAutoStartBreaks] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return JSON.parse(saved).autoStartBreaks ?? false;
    } catch {}
    return false;
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Save settings whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify({
        focusDuration,
        shortBreakDuration,
        longBreakDuration,
        longBreakInterval,
        autoStartBreaks
      }));
    } catch {}
  }, [focusDuration, shortBreakDuration, longBreakDuration, longBreakInterval, autoStartBreaks]);

  // --- TIMER RUNTIME STATE ---
  const [mode, setMode] = useState<'focus' | 'short_break' | 'long_break'>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(focusDuration * 60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [sessionCount, setSessionCount] = useState<number>(1);
  const [totalCompletedCycles, setTotalCompletedCycles] = useState<number>(0);

  const targetEndTimeRef = useRef<number | null>(null);

  // --- ACTIVE SESSION DETAILS ---
  const [subject, setSubject] = useState<string>('Physics');
  const [topic, setTopic] = useState<string>('');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // --- AUDIO SYNTHESIZER STATE ---
  const [showAudioDrawer, setShowAudioDrawer] = useState<boolean>(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);
  const [showTasksDrawer, setShowTasksDrawer] = useState<boolean>(true);

  const [activePreset, setActivePreset] = useState<SoundPresetId>(pomodoroAudio.getCurrentPreset());
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(pomodoroAudio.getIsPlaying());
  const [audioVolume, setAudioVolume] = useState<number>(pomodoroAudio.getVolume());
  const [isMuted, setIsMuted] = useState<boolean>(pomodoroAudio.getIsMuted());
  const [isFallbackActive, setIsFallbackActive] = useState<boolean>(pomodoroAudio.isFallbackActive());

  // --- TASK LIST STATE ---
  const [tasks, setTasks] = useState<PomodoroTask[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TASKS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskSubject, setNewTaskSubject] = useState<string>('Physics');
  const [newTaskPomodoros, setNewTaskPomodoros] = useState<number>(2);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');

  // Persist tasks
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
    } catch {}
  }, [tasks]);

  // Sync active task with subject/topic
  useEffect(() => {
    if (activeTaskId) {
      const activeTask = tasks.find(t => t.id === activeTaskId);
      if (activeTask) {
        setTopic(activeTask.title);
        setSubject(activeTask.subject);
      }
    }
  }, [activeTaskId, tasks]);

  // Subscribe to audio engine state changes
  useEffect(() => {
    const unsubscribe = pomodoroAudio.subscribe(state => {
      setIsAudioPlaying(state.isPlaying);
      setActivePreset(state.preset);
      setIsFallbackActive(state.isFallback);
    });
    return unsubscribe;
  }, []);

  // Update time left if durations change when paused
  useEffect(() => {
    if (!isActive) {
      if (mode === 'focus') setTimeLeft(focusDuration * 60);
      else if (mode === 'short_break') setTimeLeft(shortBreakDuration * 60);
      else if (mode === 'long_break') setTimeLeft(longBreakDuration * 60);
      targetEndTimeRef.current = null;
    }
  }, [focusDuration, shortBreakDuration, longBreakDuration, mode, isActive]);

  // --- DRIFT-FREE WALL-CLOCK TIMER ENGINE ---
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive) {
      if (!targetEndTimeRef.current) {
        targetEndTimeRef.current = Date.now() + timeLeft * 1000;
      }

      interval = setInterval(() => {
        if (!targetEndTimeRef.current) return;
        const remaining = Math.max(0, Math.ceil((targetEndTimeRef.current - Date.now()) / 1000));
        setTimeLeft(remaining);

        if (remaining <= 0) {
          handleTimerCompletion();
        }
      }, 250);
    } else {
      targetEndTimeRef.current = null;
    }

    return () => clearInterval(interval);
  }, [isActive, mode, focusDuration, shortBreakDuration, longBreakDuration, timeLeft, sessionCount, longBreakInterval]);

  // Timer complete transition logic
  const handleTimerCompletion = async () => {
    // 1. Play synthesized Tibetan Zen chime
    if (soundEnabled) {
      pomodoroAudio.playCompletionChime();
    }

    if (mode === 'focus') {
      // Completed a focus session!
      await handleLogSession(focusDuration);

      // Increment task pomodoros if active
      if (activeTaskId) {
        setTasks(prev => prev.map(t => {
          if (t.id === activeTaskId) {
            const nextDone = t.completedPomodoros + 1;
            return {
              ...t,
              completedPomodoros: nextDone,
              isCompleted: nextDone >= t.estimatedPomodoros ? true : t.isCompleted
            };
          }
          return t;
        }));
      }

      setTotalCompletedCycles(prev => prev + 1);
      const isLongBreakDue = sessionCount >= longBreakInterval;

      if (isLongBreakDue) {
        setMode('long_break');
        const nextSecs = longBreakDuration * 60;
        setTimeLeft(nextSecs);
        targetEndTimeRef.current = autoStartBreaks ? Date.now() + nextSecs * 1000 : null;
        setIsActive(autoStartBreaks);
        setSessionCount(1);
      } else {
        setMode('short_break');
        const nextSecs = shortBreakDuration * 60;
        setTimeLeft(nextSecs);
        targetEndTimeRef.current = autoStartBreaks ? Date.now() + nextSecs * 1000 : null;
        setIsActive(autoStartBreaks);
        setSessionCount(prev => prev + 1);
      }

      setMessage({
        type: 'success',
        text: `🎯 Focus session completed (${focusDuration}m logged)! Enjoy your ${isLongBreakDue ? 'Long Break' : 'Short Break'}.`
      });
    } else {
      // Break completed -> Switch back to focus
      setMode('focus');
      const nextSecs = focusDuration * 60;
      setTimeLeft(nextSecs);
      targetEndTimeRef.current = null;
      setIsActive(false);
      setMessage({
        type: 'info',
        text: '☕ Break over! Ready for the next deep work session?'
      });
    }
  };

  const toggleTimer = () => {
    if (!isActive) {
      targetEndTimeRef.current = Date.now() + timeLeft * 1000;
      setIsActive(true);
    } else {
      targetEndTimeRef.current = null;
      setIsActive(false);
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    targetEndTimeRef.current = null;
    if (mode === 'focus') setTimeLeft(focusDuration * 60);
    else if (mode === 'short_break') setTimeLeft(shortBreakDuration * 60);
    else if (mode === 'long_break') setTimeLeft(longBreakDuration * 60);
  };

  const skipStage = () => {
    setIsActive(false);
    targetEndTimeRef.current = null;
    if (mode === 'focus') {
      const isLongBreakDue = sessionCount >= longBreakInterval;
      if (isLongBreakDue) {
        setMode('long_break');
        setTimeLeft(longBreakDuration * 60);
        setSessionCount(1);
      } else {
        setMode('short_break');
        setTimeLeft(shortBreakDuration * 60);
        setSessionCount(prev => prev + 1);
      }
    } else {
      setMode('focus');
      setTimeLeft(focusDuration * 60);
    }
  };

  const switchMode = (newMode: 'focus' | 'short_break' | 'long_break') => {
    setIsActive(false);
    targetEndTimeRef.current = null;
    setMode(newMode);
    if (newMode === 'focus') setTimeLeft(focusDuration * 60);
    else if (newMode === 'short_break') setTimeLeft(shortBreakDuration * 60);
    else if (newMode === 'long_break') setTimeLeft(longBreakDuration * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentTotalSeconds = () => {
    if (mode === 'focus') return focusDuration * 60;
    if (mode === 'short_break') return shortBreakDuration * 60;
    return longBreakDuration * 60;
  };

  const progressPercent = Math.min(100, Math.max(0, ((getCurrentTotalSeconds() - timeLeft) / getCurrentTotalSeconds()) * 100));

  // --- LOGGING TO APP CONTEXT ---
  const handleLogSession = async (explicitMinutes?: number) => {
    if (!user || mode !== 'focus') return;

    const finalDuration = explicitMinutes ?? Math.round((focusDuration * 60 - timeLeft) / 60);
    if (finalDuration <= 0) return;

    const activeTask = tasks.find(t => t.id === activeTaskId);
    const logSubject = (activeTask?.subject || subject.trim() || 'General').substring(0, 99);
    const logTopic = (activeTask?.title || topic.trim() || 'Deep Focus Session').substring(0, 199);

    try {
      await addLog({
        rawText: `Pomodoro Focus: ${logTopic} (${finalDuration} min)`,
        subject: logSubject,
        topic: logTopic,
        subtopic: 'Pomodoro Focus Block',
        durationMinutes: finalDuration,
        problemsSolved: activeTask?.isCompleted ? 1 : 0,
        mistakes: [],
        efficiencyScore: 9,
        focusScore: 10,
        date: format(new Date(), 'yyyy-MM-dd')
      });
      setMessage({ type: 'success', text: `✨ Logged ${finalDuration}m under ${logSubject} - ${logTopic}` });
      setTimeout(() => setMessage(null), 4000);
    } catch (error) {
      console.error('Error logging pomodoro:', error);
      setMessage({ type: 'error', text: 'Failed to record session log.' });
    }
  };

  // --- AUDIO CONTROLS ---
  const handleSelectPreset = (presetId: SoundPresetId) => {
    setActivePreset(presetId);
    pomodoroAudio.play(presetId);
  };

  const handleToggleAudioPlay = () => {
    pomodoroAudio.togglePlay(activePreset);
  };

  const handleVolumeChange = (newVol: number) => {
    setAudioVolume(newVol);
    pomodoroAudio.setVolume(newVol);
    if (isMuted && newVol > 0) {
      setIsMuted(false);
      pomodoroAudio.toggleMute();
    }
  };

  const handleToggleMute = () => {
    const muted = pomodoroAudio.toggleMute();
    setIsMuted(muted);
  };

  // --- TASK MANAGER HANDLERS ---
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: PomodoroTask = {
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      title: newTaskTitle.trim(),
      subject: newTaskSubject,
      estimatedPomodoros: Math.max(1, newTaskPomodoros),
      completedPomodoros: 0,
      isCompleted: false,
      createdAt: Date.now()
    };

    setTasks(prev => [newTask, ...prev]);
    setNewTaskTitle('');
    if (!activeTaskId) {
      setActiveTaskId(newTask.id);
    }
  };

  const handleToggleTaskComplete = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, isCompleted: !t.isCompleted };
      }
      return t;
    }));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (activeTaskId === taskId) {
      setActiveTaskId(null);
    }
  };

  const handleSaveEditTask = (taskId: string) => {
    if (!editTitle.trim()) return;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, title: editTitle.trim() } : t));
    setEditingTaskId(null);
  };

  const activeTask = tasks.find(t => t.id === activeTaskId);

  return (
    <div className="flex-1 w-full min-h-screen bg-zinc-950 text-zinc-100 flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
      
      {/* Header Bar */}
      <div className="w-full max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 via-indigo-200 to-cyan-400">
              Savantix Deep Focus Synthesizer
            </h1>
            <p className="text-xs text-zinc-400">
              Scientific Web Audio Binaural Engine • Wall-Clock Driftless Precision • Session Auto-Logger
            </p>
          </div>
        </div>

        {/* Top Control Action Bar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Audio Suite Toggle Button */}
          <button
            onClick={() => setShowAudioDrawer(!showAudioDrawer)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
              isAudioPlaying 
                ? 'bg-indigo-600/20 border border-indigo-500/50 text-indigo-300 shadow-lg shadow-indigo-500/20 animate-pulse' 
                : showAudioDrawer 
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' 
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
            }`}
            title="Open Audio Synthesizer Suite"
          >
            <Headphones className={`w-4 h-4 ${isAudioPlaying ? 'text-cyan-400' : 'text-zinc-400'}`} />
            <span className="hidden sm:inline">
              {isAudioPlaying ? SOUND_PRESETS.find(p => p.id === activePreset)?.name : 'Audio Synth'}
            </span>
            {isAudioPlaying && (
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            )}
          </button>

          {/* Settings Drawer Button */}
          <button
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            className={`p-2.5 rounded-xl border transition-all ${
              showSettingsDrawer 
                ? 'bg-indigo-600 text-white border-indigo-500' 
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-800'
            }`}
            title="Custom Timer Durations & Presets"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Left Arena (Timer + Active Task) & Right Side (Synth Suite + Tasks) */}
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-start">
        
        {/* Left Column: Timer & Controls (7 cols on large) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Pomodoro Card */}
          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
            {/* Background Ambient Glow */}
            <div className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-20 transition-all duration-700 ${
              mode === 'focus' ? 'bg-indigo-500' : mode === 'short_break' ? 'bg-emerald-500' : 'bg-cyan-500'
            }`} />

            {/* Mode Switcher Tabs */}
            <div className="flex items-center justify-center p-1.5 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl max-w-md mx-auto mb-8 shadow-inner">
              <button
                onClick={() => switchMode('focus')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  mode === 'focus'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                🧠 Focus ({focusDuration}m)
              </button>
              <button
                onClick={() => switchMode('short_break')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  mode === 'short_break'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                ☕ Short Break ({shortBreakDuration}m)
              </button>
              <button
                onClick={() => switchMode('long_break')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  mode === 'long_break'
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                🌴 Long Break ({longBreakDuration}m)
              </button>
            </div>

            {/* Big Countdown Timer Display */}
            <div className="text-center relative my-4 sm:my-8">
              <div className="text-7xl sm:text-8xl md:text-9xl font-black tracking-tighter tabular-nums font-mono bg-clip-text text-transparent bg-gradient-to-b from-zinc-100 to-zinc-400 drop-shadow-2xl">
                {formatTime(timeLeft)}
              </div>

              {/* Cycle and State Badges */}
              <div className="flex items-center justify-center gap-3 mt-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-xs font-medium text-zinc-300">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  Cycle {sessionCount} / {longBreakInterval}
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-xs font-medium text-zinc-300">
                  <Award className="w-3.5 h-3.5 text-indigo-400" />
                  {totalCompletedCycles} Total Done
                </span>

                {isAudioPlaying && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-700/50 text-xs font-medium text-cyan-300">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                    {SOUND_PRESETS.find(p => p.id === activePreset)?.freqLabel || 'Audio On'}
                  </span>
                )}
              </div>

              {/* Linear Progress Bar */}
              <div className="w-full bg-zinc-950/80 h-2 rounded-full mt-6 overflow-hidden border border-zinc-800/60">
                <div 
                  className={`h-full transition-all duration-300 rounded-full ${
                    mode === 'focus' 
                      ? 'bg-gradient-to-r from-indigo-500 to-cyan-400' 
                      : mode === 'short_break' 
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                        : 'bg-gradient-to-r from-cyan-500 to-blue-400'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Timer Action Controls */}
            <div className="flex items-center justify-center gap-4 sm:gap-6 mt-8">
              {/* Reset */}
              <button
                onClick={resetTimer}
                className="p-3.5 sm:p-4 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 border border-zinc-700/60 transition-all hover:scale-105 active:scale-95 shadow-lg"
                title="Reset Timer"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              {/* Main Play / Pause Button */}
              <button
                onClick={toggleTimer}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-xl ${
                  isActive
                    ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/25 ring-4 ring-amber-500/20'
                    : mode === 'focus'
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 ring-4 ring-indigo-500/20'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 ring-4 ring-emerald-500/20'
                }`}
                title={isActive ? "Pause Session" : "Start Focus Session"}
              >
                {isActive ? (
                  <Pause className="w-7 h-7 sm:w-9 sm:h-9 fill-current" />
                ) : (
                  <Play className="w-7 h-7 sm:w-9 sm:h-9 ml-1 fill-current" />
                )}
              </button>

              {/* Skip stage */}
              <button
                onClick={skipStage}
                className="p-3.5 sm:p-4 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 border border-zinc-700/60 transition-all hover:scale-105 active:scale-95 shadow-lg"
                title="Skip to Next Stage"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Notification / Toast Message */}
            {message && (
              <div className={`mt-6 p-3.5 rounded-2xl text-xs sm:text-sm font-medium text-center border animate-in fade-in slide-in-from-bottom-2 ${
                message.type === 'success'
                  ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                  : message.type === 'error'
                    ? 'bg-red-950/80 border-red-800 text-red-300'
                    : 'bg-indigo-950/80 border-indigo-800 text-indigo-300'
              }`}>
                {message.text}
              </div>
            )}
          </div>

          {/* Active Focus Session Target & Quick Logger Card */}
          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-zinc-200">Current Session Focus Target</h3>
              </div>
              {activeTask && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-medium">
                  Linked to Task
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  {SUBJECT_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-400 mb-1">Topic / Intent</label>
                <input
                  type="text"
                  placeholder="e.g., Electromagnetic Induction Problem Set #4"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-zinc-600"
                />
              </div>
            </div>

            {/* Manual Quick Save / Progress Log */}
            {!isActive && timeLeft < focusDuration * 60 && mode === 'focus' && (
              <button
                onClick={() => handleLogSession()}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-indigo-300 border border-indigo-900/50 hover:border-indigo-500/50 rounded-xl transition-all font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md"
              >
                <Save className="w-4 h-4" />
                Log Current Elapsed Progress ({Math.round((focusDuration * 60 - timeLeft) / 60)} min)
              </button>
            )}
          </div>

        </div>

        {/* Right Column: Audio Synth Suite + Task Checklist (5 cols on large) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Audio Synthesizer Suite Card */}
          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Headphones className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">Web Audio Synthesizer Suite</h3>
                  <p className="text-[11px] text-zinc-400">Pure Oscillators, Noise Filters & Streams</p>
                </div>
              </div>
              <button
                onClick={() => pomodoroAudio.playCompletionChime()}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700/60 flex items-center gap-1.5 transition-colors"
                title="Preview Zen Bell Sound"
              >
                <Bell className="w-3 h-3 text-amber-400" />
                Test Bell
              </button>
            </div>

            {/* Real-time Visualizer Canvas */}
            <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800/80 shadow-inner">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-2 px-1">
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isAudioPlaying ? 'bg-cyan-400 animate-ping' : 'bg-zinc-600'}`} />
                  {isAudioPlaying ? 'Real-Time Frequency Analyser' : 'Audio Engine Standby'}
                </span>
                <span className="font-mono text-zinc-500">64-FFT</span>
              </div>
              <AudioVisualizer isPlaying={isAudioPlaying} />
            </div>

            {/* Master Audio Controls Bar: Play/Pause, Volume, Mute */}
            <div className="bg-zinc-950/60 p-3.5 rounded-2xl border border-zinc-800/60 space-y-3">
              <div className="flex items-center justify-between gap-3">
                {/* Play/Pause toggle */}
                <button
                  onClick={handleToggleAudioPlay}
                  className={`flex-1 py-2 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                    isAudioPlaying
                      ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                  }`}
                >
                  {isAudioPlaying ? (
                    <>
                      <Pause className="w-4 h-4" /> Pause Sound
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" /> Play Sound
                    </>
                  )}
                </button>

                {/* Mute Button */}
                <button
                  onClick={handleToggleMute}
                  className={`p-2.5 rounded-xl border transition-colors ${
                    isMuted 
                      ? 'bg-red-950/80 border-red-800 text-red-400' 
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                  }`}
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : audioVolume > 0.5 ? <Volume2 className="w-4 h-4" /> : <Volume1 className="w-4 h-4" />}
                </button>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-3 pt-1">
                <span className="text-[11px] text-zinc-400 font-medium">Vol</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  value={isMuted ? 0 : audioVolume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="flex-1 accent-indigo-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
                <span className="text-[11px] text-zinc-400 font-mono w-8 text-right">
                  {isMuted ? '0%' : `${Math.round(audioVolume * 100)}%`}
                </span>
              </div>
            </div>

            {/* Sound Preset Grid Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Soundscapes & Synthesizers
              </label>
              
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                {SOUND_PRESETS.map((preset) => {
                  const isSelected = activePreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset.id)}
                      className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                        isSelected
                          ? 'bg-indigo-950/70 border-indigo-500/80 text-white shadow-lg shadow-indigo-500/10'
                          : 'bg-zinc-950/60 hover:bg-zinc-800/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg">{preset.icon}</span>
                        {isSelected && isAudioPlaying && (
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        )}
                      </div>
                      <div className="mt-2">
                        <div className="text-xs font-semibold text-zinc-100 truncate">{preset.name}</div>
                        <div className="text-[10px] text-zinc-400 truncate mt-0.5">{preset.freqLabel}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {isFallbackActive && (
                <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-800/60 text-amber-300 text-[11px] flex items-center gap-2">
                  <Info className="w-4 h-4 flex-shrink-0 text-amber-400" />
                  <span>Network stream unreachable; fallback Web Audio Brown Noise synth active.</span>
                </div>
              )}
            </div>

          </div>

          {/* Pomodoro Task Checklist Card */}
          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">Session Tasks & Milestones</h3>
                  <p className="text-[11px] text-zinc-400">Track & Auto-Complete Focus Goals</p>
                </div>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400">
                {tasks.filter(t => t.isCompleted).length}/{tasks.length}
              </span>
            </div>

            {/* Add Task Form */}
            <form onSubmit={handleAddTask} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a new focus task..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-zinc-600"
                />
                <button
                  type="submit"
                  disabled={!newTaskTitle.trim()}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs transition-colors flex items-center gap-1 shadow-md shadow-emerald-600/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={newTaskSubject}
                  onChange={(e) => setNewTaskSubject(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-300 focus:outline-none"
                >
                  {SUBJECT_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <div className="flex items-center gap-1 text-xs text-zinc-400">
                  <span>Target:</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newTaskPomodoros}
                    onChange={(e) => setNewTaskPomodoros(parseInt(e.target.value) || 1)}
                    className="w-12 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-center text-zinc-200 focus:outline-none"
                  />
                  <span>🍅</span>
                </div>
              </div>
            </form>

            {/* Task Item List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {tasks.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-500">
                  No tasks added yet. Add one above to anchor your focus session!
                </div>
              ) : (
                tasks.map(t => {
                  const isActive = activeTaskId === t.id;
                  const isEditing = editingTaskId === t.id;

                  return (
                    <div
                      key={t.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                        isActive 
                          ? 'bg-indigo-950/40 border-indigo-500/70 shadow-md shadow-indigo-500/10' 
                          : t.isCompleted 
                            ? 'bg-zinc-950/40 border-zinc-800/40 opacity-60' 
                            : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                      }`}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => handleToggleTaskComplete(t.id)}
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors flex-shrink-0 ${
                          t.isCompleted
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900'
                        }`}
                      >
                        {t.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-100 focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveEditTask(t.id)}
                              className="text-xs px-2 py-0.5 bg-emerald-600 text-white rounded"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div 
                            onClick={() => setActiveTaskId(t.id)}
                            className="cursor-pointer"
                          >
                            <div className={`text-xs font-medium truncate ${t.isCompleted ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                              {t.title}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-500">
                              <span className="text-indigo-400">{t.subject}</span>
                              <span>•</span>
                              <span>🍅 {t.completedPomodoros}/{t.estimatedPomodoros}</span>
                              {isActive && (
                                <span className="text-cyan-400 font-bold ml-1">● Active Target</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => {
                            setEditingTaskId(t.id);
                            setEditTitle(t.title);
                          }}
                          className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors"
                          title="Edit Task"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(t.id)}
                          className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-red-400 transition-colors"
                          title="Delete Task"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Settings Modal Drawer */}
      {showSettingsDrawer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-zinc-100">Custom Timer Settings</h3>
              </div>
              <button
                onClick={() => setShowSettingsDrawer(false)}
                className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Focus Duration Slider */}
              <div>
                <div className="flex justify-between items-center text-sm font-medium mb-1.5">
                  <span className="text-zinc-300">Focus Duration</span>
                  <span className="text-indigo-400 font-mono font-bold">{focusDuration} min</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="90"
                  step="5"
                  value={focusDuration}
                  onChange={(e) => setFocusDuration(parseInt(e.target.value))}
                  className="w-full accent-indigo-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                  <span>15 min</span>
                  <span>25 min (Standard)</span>
                  <span>50 min (Deep)</span>
                  <span>90 min</span>
                </div>
              </div>

              {/* Short Break Slider */}
              <div>
                <div className="flex justify-between items-center text-sm font-medium mb-1.5">
                  <span className="text-zinc-300">Short Break</span>
                  <span className="text-emerald-400 font-mono font-bold">{shortBreakDuration} min</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="15"
                  step="1"
                  value={shortBreakDuration}
                  onChange={(e) => setShortBreakDuration(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                  <span>3 min</span>
                  <span>5 min (Standard)</span>
                  <span>10 min</span>
                  <span>15 min</span>
                </div>
              </div>

              {/* Long Break Slider */}
              <div>
                <div className="flex justify-between items-center text-sm font-medium mb-1.5">
                  <span className="text-zinc-300">Long Break</span>
                  <span className="text-cyan-400 font-mono font-bold">{longBreakDuration} min</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="30"
                  step="5"
                  value={longBreakDuration}
                  onChange={(e) => setLongBreakDuration(parseInt(e.target.value))}
                  className="w-full accent-cyan-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                  <span>10 min</span>
                  <span>15 min (Standard)</span>
                  <span>20 min</span>
                  <span>30 min</span>
                </div>
              </div>

              {/* Long Break Interval */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Long Break Interval (every N sessions)
                </label>
                <div className="flex gap-2">
                  {[2, 3, 4, 5, 6].map(num => (
                    <button
                      key={num}
                      onClick={() => setLongBreakInterval(num)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        longBreakInterval === num
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2 border-t border-zinc-800">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-medium text-zinc-300">Auto-start breaks</span>
                  <input
                    type="checkbox"
                    checked={autoStartBreaks}
                    onChange={(e) => setAutoStartBreaks(e.target.checked)}
                    className="accent-indigo-500 w-4 h-4 rounded"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-medium text-zinc-300">Sound notifications (Zen Chime)</span>
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                    className="accent-indigo-500 w-4 h-4 rounded"
                  />
                </label>
              </div>
            </div>

            <button
              onClick={() => setShowSettingsDrawer(false)}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-indigo-600/20"
            >
              Apply Settings
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

// --- REAL-TIME AUDIO VISUALIZER COMPONENT ---
const AudioVisualizer: React.FC<{ isPlaying: boolean }> = ({ isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = pomodoroAudio.getAnalyser();
    const bufferLength = analyser ? analyser.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animId = requestAnimationFrame(render);
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(dataArray);
      } else {
        // Soft idle harmonic wave when paused
        const t = Date.now() / 500;
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = Math.max(12, Math.round((Math.sin(t + i * 0.25) * 0.5 + 0.5) * 35 + 10));
        }
      }

      const barCount = 28;
      const barWidth = (width / barCount) * 0.65;
      const gap = (width - barCount * barWidth) / (barCount - 1);

      for (let i = 0; i < barCount; i++) {
        const dataIdx = Math.floor((i / barCount) * bufferLength);
        const value = isPlaying && analyser ? dataArray[dataIdx] : dataArray[i % dataArray.length];
        const barHeight = Math.max(4, (value / 255) * height * 0.85);

        const x = i * (barWidth + gap);
        const y = height - barHeight;

        // Glowing gradient fill
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#4f46e5'); // Indigo 600
        gradient.addColorStop(0.5, '#7c3aed'); // Violet 600
        gradient.addColorStop(1, '#06b6d4'); // Cyan 500

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);

        // Peak dot
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(x, Math.max(0, y - 2.5), barWidth, 1.5);
      }
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  return (
    <canvas 
      ref={canvasRef} 
      width={320} 
      height={48} 
      className="w-full h-12 rounded-xl"
    />
  );
};
