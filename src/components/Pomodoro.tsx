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
  ListTodo,
  Search,
  Youtube,
  ExternalLink,
  RefreshCw,
  Zap,
  Coffee,
  Activity,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import TriageMode from './TriageMode';
import { format } from 'date-fns';
import { 
  pomodoroAudio, 
  SOUND_PRESETS, 
  SoundPreset, 
  SoundPresetId 
} from '../utils/pomodoroAudioEngine';
import { 
  YouTubeAudioService, 
  CURATED_FOCUS_TRACKS, 
  YouTubeTrack 
} from '../services/youtubeAudioService';
import {
  TimerEngineMode,
  FlowStateStage,
  FlowmodoroConfig,
  loadFlowmodoroConfig,
  saveFlowmodoroConfig,
  calculateDynamicBreak,
  getFlowStage,
  formatFlowTime,
  formatEarnedBreak,
  DEFAULT_FLOWMODORO_CONFIG,
  STORAGE_KEY_FLOWMODORO_CONFIG
} from '../utils/flowmodoroEngine';

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
const STORAGE_KEY_ENGINE_MODE = 'savantix_timer_engine_mode_v1';

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

export interface PomodoroProps {
  isFortressMode?: boolean;
  setIsFortressMode?: (mode: boolean) => void;
}

export const Pomodoro: React.FC<PomodoroProps> = ({ isFortressMode, setIsFortressMode }) => {
  const { user, addLog } = useAppContext();

  // --- ENGINE MODE SELECTION (Classical Pomodoro vs Flowmodoro) ---
  const [engineMode, setEngineMode] = useState<TimerEngineMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ENGINE_MODE);
      if (saved === 'flowmodoro' || saved === 'pomodoro') return saved;
    } catch {}
    return 'pomodoro';
  });

  // --- TRIAGE MODE ---
  const [triageModeActive, setTriageModeActive] = useState(false);

  // Save engine mode
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ENGINE_MODE, engineMode);
    } catch {}
  }, [engineMode]);

  // --- FLOWMODORO ENGINE STATE & CONFIG ---
  const [flowConfig, setFlowConfig] = useState<FlowmodoroConfig>(() => loadFlowmodoroConfig());

  // Save flow config
  useEffect(() => {
    saveFlowmodoroConfig(flowConfig);
  }, [flowConfig]);

  // Flow runtime state
  const [flowElapsedSeconds, setFlowElapsedSeconds] = useState<number>(0);
  const [flowIsActive, setFlowIsActive] = useState<boolean>(false);
  const [flowIsBreakActive, setFlowIsBreakActive] = useState<boolean>(false);
  const [flowBreakTotalSeconds, setFlowBreakTotalSeconds] = useState<number>(0);
  const [flowBreakRemainingSeconds, setFlowBreakRemainingSeconds] = useState<number>(0);
  const [showBreakPromptModal, setShowBreakPromptModal] = useState<boolean>(false);

  // Drift-free timestamp refs for Flowmodoro
  const flowStartTimestampRef = useRef<number | null>(null);
  const flowAccumulatedSecondsRef = useRef<number>(0);
  const flowBreakTargetEndTimeRef = useRef<number | null>(null);

  // --- CLASSICAL POMODORO TIMER SETTINGS STATE ---
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

  // --- CLASSICAL POMODORO RUNTIME STATE ---
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

  // --- SESSION LOG CONFIRMATION MODAL STATE ---
  const [showLogPromptModal, setShowLogPromptModal] = useState<boolean>(false);
  const [sessionLogData, setSessionLogData] = useState<{
    subject: string;
    topic: string;
    durationMinutes: number;
    problemsSolved: number;
    accuracyPercent: number | null;
    focusScore: number;
    energyMood: string;
  }>({
    subject: 'Physics',
    topic: '',
    durationMinutes: 25,
    problemsSolved: 0,
    accuracyPercent: 85,
    focusScore: 8,
    energyMood: 'Normal'
  });
  const [isSavingSessionLog, setIsSavingSessionLog] = useState<boolean>(false);

  const promptLogSession = (mins: number, defaultSubject?: string, defaultTopic?: string) => {
    setSessionLogData({
      subject: defaultSubject || subject || 'Physics',
      topic: defaultTopic || topic || (activeTaskId ? tasks.find(t => t.id === activeTaskId)?.title || '' : 'Focus Block'),
      durationMinutes: Math.max(1, mins),
      problemsSolved: 0,
      accuracyPercent: 85,
      focusScore: 8,
      energyMood: 'Normal'
    });
    setShowLogPromptModal(true);
  };

  const handleSaveCompletedSession = async () => {
    if (!user) {
      setMessage({ type: 'error', text: 'Please sign in to record study logs.' });
      setShowLogPromptModal(false);
      return;
    }
    setIsSavingSessionLog(true);
    try {
      await addLog({
        rawText: `Completed ${sessionLogData.durationMinutes}m focus on ${sessionLogData.subject}: ${sessionLogData.topic} (${sessionLogData.problemsSolved} problems)`,
        subject: sessionLogData.subject || 'General',
        topic: sessionLogData.topic || 'Focus Sprint',
        subtopic: 'Pomodoro / Flowtime',
        durationMinutes: sessionLogData.durationMinutes,
        problemsSolved: sessionLogData.problemsSolved,
        accuracyPercent: sessionLogData.accuracyPercent,
        mistakes: [],
        efficiencyScore: 8,
        focusScore: sessionLogData.focusScore,
        energyMood: sessionLogData.energyMood,
        date: format(new Date(), 'yyyy-MM-dd')
      });
      setMessage({
        type: 'success',
        text: `🎯 Saved! Logged ${sessionLogData.durationMinutes}m of ${sessionLogData.subject} (${sessionLogData.problemsSolved} problems) to Dashboard.`
      });
      setShowLogPromptModal(false);
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to save session log: ' + (err.message || 'Error') });
    } finally {
      setIsSavingSessionLog(false);
    }
  };

  const handleDiscardSessionLog = () => {
    setShowLogPromptModal(false);
    setMessage({ type: 'info', text: 'Session finished without saving to logs.' });
  };

  // --- AUDIO SYNTHESIZER STATE ---
  const [showAudioDrawer, setShowAudioDrawer] = useState<boolean>(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);

  const [activePreset, setActivePreset] = useState<SoundPresetId>(pomodoroAudio.getCurrentPreset());
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(pomodoroAudio.getIsPlaying());
  const [audioVolume, setAudioVolume] = useState<number>(pomodoroAudio.getVolume());
  const [isMuted, setIsMuted] = useState<boolean>(pomodoroAudio.getIsMuted());
  const [isFallbackActive, setIsFallbackActive] = useState<boolean>(pomodoroAudio.isFallbackActive());

  // --- DISTRACTION-FREE YOUTUBE AUDIO STATE (SELF-HEALING) ---
  const [audioEngineType, setAudioEngineType] = useState<'synth' | 'youtube'>('synth');
  const [ytTracks, setYtTracks] = useState<YouTubeTrack[]>(() => YouTubeAudioService.getHealthyTracks());
  const [selectedYtTrack, setSelectedYtTrack] = useState<YouTubeTrack | null>(() => {
    const healthy = YouTubeAudioService.getHealthyTracks();
    return healthy[0] || null;
  });
  const [ytSearchQuery, setYtSearchQuery] = useState<string>('');
  const [isYtSearching, setIsYtSearching] = useState<boolean>(false);
  const [ytCategoryFilter, setYtCategoryFilter] = useState<string>('all');
  const [customYtInput, setCustomYtInput] = useState<string>('');
  const [isYtPlaying, setIsYtPlaying] = useState<boolean>(false);

  // --- SELF-HEALING YOUTUBE AUTO-SKIP ENGINE ---
  useEffect(() => {
    const handleYtMessage = (event: MessageEvent) => {
      try {
        if (typeof event.data === 'string') {
          const data = JSON.parse(event.data);
          // YouTube Error codes: 2 (invalid param), 5 (HTML5 error), 100 (not found/removed), 101/150 (not embeddable)
          if (data.event === 'onError' || (data.info && typeof data.info === 'number' && [2, 5, 100, 101, 150].includes(data.info))) {
            if (selectedYtTrack) {
              console.warn(`[Savantix Audio] Video ${selectedYtTrack.youtubeId} unavailable (code ${data.info}). Auto-skipping...`);
              YouTubeAudioService.reportBadVideoId(selectedYtTrack.youtubeId);
              setMessage({ type: 'info', text: `Stream '${selectedYtTrack.title}' unavailable — auto-switching to next stream...` });
              setTimeout(() => {
                handleNextYtTrack();
              }, 300);
            }
          }
        }
      } catch {}
    };

    window.addEventListener('message', handleYtMessage);
    return () => window.removeEventListener('message', handleYtMessage);
  }, [selectedYtTrack, ytTracks]);

  const handleYtSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsYtSearching(true);
    try {
      const results = await YouTubeAudioService.searchTracks(ytSearchQuery);
      setYtTracks(results);
    } catch {
      setYtTracks(YouTubeAudioService.getHealthyTracks());
    } finally {
      setIsYtSearching(false);
    }
  };

  const handleShuffleYtTracks = () => {
    const fresh = YouTubeAudioService.rotateFreshTracks();
    setYtTracks(fresh);
    if (fresh.length > 0) {
      setSelectedYtTrack(fresh[0]);
      setIsYtPlaying(true);
      setMessage({ type: 'success', text: 'Refreshed stream playlist with fresh focus sessions!' });
    }
  };

  const handleSelectYtTrack = (track: YouTubeTrack) => {
    setSelectedYtTrack(track);
    setIsYtPlaying(true);
    if (isAudioPlaying) {
      pomodoroAudio.pause();
      setIsAudioPlaying(false);
    }
  };

  const handleAddCustomYtTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const vidId = YouTubeAudioService.extractVideoId(customYtInput);
    if (!vidId) {
      alert('Please enter a valid YouTube video link or 11-character video ID.');
      return;
    }
    const newTrack: YouTubeTrack = {
      id: `custom_${Date.now()}`,
      title: 'Custom Focus Audio Stream',
      artist: 'Distraction-Free Direct Stream',
      category: 'custom',
      youtubeId: vidId,
      tag: 'Custom Link',
      duration: 'Live Audio'
    };
    YouTubeAudioService.saveCustomTrack(newTrack);
    setYtTracks(prev => [newTrack, ...prev]);
    setSelectedYtTrack(newTrack);
    setIsYtPlaying(true);
    setCustomYtInput('');
    if (isAudioPlaying) {
      pomodoroAudio.pause();
      setIsAudioPlaying(false);
    }
  };

  const handleNextYtTrack = () => {
    const healthy = YouTubeAudioService.getHealthyTracks();
    if (!healthy.length) return;
    const currentIndex = healthy.findIndex(t => t.youtubeId === selectedYtTrack?.youtubeId);
    const nextIndex = (currentIndex + 1) % healthy.length;
    handleSelectYtTrack(healthy[nextIndex]);
  };

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

  // Update time left if durations change when paused (Classical Pomodoro)
  useEffect(() => {
    if (!isActive && engineMode === 'pomodoro') {
      if (mode === 'focus') setTimeLeft(focusDuration * 60);
      else if (mode === 'short_break') setTimeLeft(shortBreakDuration * 60);
      else if (mode === 'long_break') setTimeLeft(longBreakDuration * 60);
      targetEndTimeRef.current = null;
    }
  }, [focusDuration, shortBreakDuration, longBreakDuration, mode, isActive, engineMode]);

  // --- CLASSICAL POMODORO: DRIFT-FREE WALL-CLOCK TIMER ENGINE ---
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && engineMode === 'pomodoro') {
      if (!targetEndTimeRef.current) {
        targetEndTimeRef.current = Date.now() + timeLeft * 1000;
      }

      interval = setInterval(() => {
        if (!targetEndTimeRef.current) return;
        const remaining = Math.max(0, Math.ceil((targetEndTimeRef.current - Date.now()) / 1000));
        setTimeLeft(remaining);

        if (remaining <= 0) {
          handlePomodoroCompletion();
        }
      }, 250);
    } else {
      targetEndTimeRef.current = null;
    }

    return () => clearInterval(interval);
  }, [isActive, mode, focusDuration, shortBreakDuration, longBreakDuration, timeLeft, sessionCount, longBreakInterval, engineMode]);

  // --- FLOWMODORO: DRIFT-FREE WALL-CLOCK COUNT-UP & BREAK TIMER ENGINE ---
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (engineMode === 'flowmodoro') {
      if (flowIsActive && !flowIsBreakActive) {
        // Active Flow Focus (Count-Up Stopwatch)
        if (!flowStartTimestampRef.current) {
          flowStartTimestampRef.current = Date.now();
        }

        interval = setInterval(() => {
          if (!flowStartTimestampRef.current) return;
          const deltaSecs = Math.floor((Date.now() - flowStartTimestampRef.current) / 1000);
          const currentTotal = flowAccumulatedSecondsRef.current + deltaSecs;
          setFlowElapsedSeconds(currentTotal);
        }, 250);

      } else if (flowIsBreakActive) {
        // Active Dynamic Break Countdown
        if (!flowBreakTargetEndTimeRef.current) {
          flowBreakTargetEndTimeRef.current = Date.now() + flowBreakRemainingSeconds * 1000;
        }

        interval = setInterval(() => {
          if (!flowBreakTargetEndTimeRef.current) return;
          const remaining = Math.max(0, Math.ceil((flowBreakTargetEndTimeRef.current - Date.now()) / 1000));
          setFlowBreakRemainingSeconds(remaining);

          if (remaining <= 0) {
            handleFlowBreakCompletion();
          }
        }, 250);
      }
    }

    return () => clearInterval(interval);
  }, [engineMode, flowIsActive, flowIsBreakActive, flowBreakRemainingSeconds]);

  // --- FLOWMODORO DERIVED VALUES ---
  const earnedDynamicBreakSeconds = useMemo(() => {
    return calculateDynamicBreak(flowElapsedSeconds, flowConfig);
  }, [flowElapsedSeconds, flowConfig]);

  const flowStageInfo = useMemo(() => {
    return getFlowStage(flowElapsedSeconds / 60, flowConfig.fatigueNudgeMinutes);
  }, [flowElapsedSeconds, flowConfig.fatigueNudgeMinutes]);

  // --- FLOWMODORO ACTIONS ---
  const toggleFlowTimer = () => {
    if (!flowIsActive) {
      // Start/Resume count-up
      flowStartTimestampRef.current = Date.now();
      setFlowIsActive(true);
    } else {
      // Pause count-up
      if (flowStartTimestampRef.current) {
        const deltaSecs = Math.floor((Date.now() - flowStartTimestampRef.current) / 1000);
        flowAccumulatedSecondsRef.current += deltaSecs;
      }
      flowStartTimestampRef.current = null;
      setFlowIsActive(false);
    }
  };

  const resetFlowTimer = () => {
    setFlowIsActive(false);
    setFlowIsBreakActive(false);
    flowStartTimestampRef.current = null;
    flowAccumulatedSecondsRef.current = 0;
    flowBreakTargetEndTimeRef.current = null;
    setFlowElapsedSeconds(0);
    setFlowBreakTotalSeconds(0);
    setFlowBreakRemainingSeconds(0);
    setShowBreakPromptModal(false);
  };

  const handleFinishFlowSession = async () => {
    // Pause stopwatch
    if (flowIsActive) {
      if (flowStartTimestampRef.current) {
        const deltaSecs = Math.floor((Date.now() - flowStartTimestampRef.current) / 1000);
        flowAccumulatedSecondsRef.current += deltaSecs;
      }
      flowStartTimestampRef.current = null;
      setFlowIsActive(false);
    }

    const totalSecs = flowElapsedSeconds;
    const totalMins = Math.max(1, Math.round(totalSecs / 60));

    if (totalSecs < 10) {
      setMessage({ type: 'info', text: 'Flow session was under 10 seconds. No rest earned yet.' });
      resetFlowTimer();
      return;
    }

    // Update task progress if linked
    if (activeTaskId) {
      const pomodoroEquivalents = Math.max(1, Math.round(totalMins / 25));
      setTasks(prev => prev.map(t => {
        if (t.id === activeTaskId) {
          const nextDone = t.completedPomodoros + pomodoroEquivalents;
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

    // Prompt user to review and save session to study logs
    promptLogSession(totalMins, subject, topic);

    const earnedSecs = calculateDynamicBreak(totalSecs, flowConfig);

    if (earnedSecs > 0) {
      if (flowConfig.autoStartEarnedBreak) {
        startDynamicBreak(earnedSecs);
      } else {
        setShowBreakPromptModal(true);
      }
    } else {
      resetFlowTimer();
    }
  };

  const startDynamicBreak = (breakSecs: number) => {
    setShowBreakPromptModal(false);
    setFlowIsActive(false);
    setFlowIsBreakActive(true);
    setFlowBreakTotalSeconds(breakSecs);
    setFlowBreakRemainingSeconds(breakSecs);
    flowBreakTargetEndTimeRef.current = Date.now() + breakSecs * 1000;
  };

  const handleFlowBreakCompletion = () => {
    if (soundEnabled) {
      pomodoroAudio.playCompletionChime();
    }
    setFlowIsBreakActive(false);
    flowBreakTargetEndTimeRef.current = null;
    flowStartTimestampRef.current = null;
    flowAccumulatedSecondsRef.current = 0;
    setFlowElapsedSeconds(0);
    setFlowBreakTotalSeconds(0);
    setFlowBreakRemainingSeconds(0);

    setMessage({
      type: 'success',
      text: '☕ Dynamic Break complete! Refreshed and primed for your next deep flow session.'
    });
  };

  const skipFlowBreak = () => {
    setFlowIsBreakActive(false);
    flowBreakTargetEndTimeRef.current = null;
    flowStartTimestampRef.current = null;
    flowAccumulatedSecondsRef.current = 0;
    setFlowElapsedSeconds(0);
    setFlowBreakTotalSeconds(0);
    setFlowBreakRemainingSeconds(0);
    setMessage({
      type: 'info',
      text: 'Break ended early. Ready for next flow sprint!'
    });
  };

  // --- CLASSICAL POMODORO COMPLETION ---
  const handlePomodoroCompletion = async () => {
    if (soundEnabled) {
      pomodoroAudio.playCompletionChime();
    }

    if (mode === 'focus') {
      promptLogSession(focusDuration, subject, topic);

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
  const handleLogSession = async (explicitMinutes?: number, customSubtopic?: string) => {
    if (!user) return;

    let finalDuration = explicitMinutes;
    if (finalDuration === undefined) {
      if (engineMode === 'flowmodoro') {
        finalDuration = Math.round(flowElapsedSeconds / 60);
      } else {
        finalDuration = Math.round((focusDuration * 60 - timeLeft) / 60);
      }
    }

    if (finalDuration <= 0) return;

    const activeTask = tasks.find(t => t.id === activeTaskId);
    const logSubject = (activeTask?.subject || subject.trim() || 'General').substring(0, 99);
    const logTopic = (activeTask?.title || topic.trim() || (engineMode === 'flowmodoro' ? 'Flowtime Sprint' : 'Deep Focus Session')).substring(0, 199);
    const subtopicTitle = customSubtopic || (engineMode === 'flowmodoro' ? 'Flowmodoro Continuous Focus' : 'Pomodoro Focus Block');

    try {
      await addLog({
        rawText: `${subtopicTitle}: ${logTopic} (${finalDuration} min)`,
        subject: logSubject,
        topic: logTopic,
        subtopic: subtopicTitle,
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
      console.error('Error logging study session:', error);
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
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-cyan-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            {engineMode === 'flowmodoro' ? (
              <Zap className="w-5 h-5 text-white animate-pulse" />
            ) : (
              <Clock className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 via-indigo-200 to-cyan-400">
                Savantix Cognitive Focus Engine
              </h1>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                engineMode === 'flowmodoro'
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60'
                  : 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60'
              }`}>
                {engineMode === 'flowmodoro' ? 'Flowtime Active' : 'Classical Mode'}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Flowmodoro Open-Ended Velocity • Dynamic Rest Scaling (1:5) • Drift-Free Precision • Web Audio Synthesizer
            </p>
          </div>
        </div>

        {/* Top Control Action Bar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {setIsFortressMode && (
            <button
              onClick={() => setIsFortressMode(true)}
              className="px-3.5 py-2 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer"
              title="Enter Deep Work Fortress"
            >
              🏰 <span className="hidden sm:inline">Enter Fortress</span>
            </button>
          )}

          {/* Audio Suite Toggle Button */}
          <button
            onClick={() => setShowAudioDrawer(!showAudioDrawer)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
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
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              showSettingsDrawer 
                ? 'bg-indigo-600 text-white border-indigo-500' 
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-800'
            }`}
            title="Custom Timer & Flowmodoro Durations"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Engine Paradigm Selector (Pomodoro vs Flowmodoro) */}
      <div className="w-full max-w-6xl mx-auto mt-6">
        <div className="p-1 bg-zinc-900/90 border border-zinc-800/80 rounded-2xl flex items-center gap-1 shadow-lg backdrop-blur-xl">
          <button
            onClick={() => {
              if (engineMode !== 'pomodoro') {
                if (flowIsActive || flowIsBreakActive) {
                  if (confirm('A Flow session is currently active. Switch modes and reset timer?')) {
                    resetFlowTimer();
                    setEngineMode('pomodoro');
                  }
                } else {
                  setEngineMode('pomodoro');
                }
              }
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              engineMode === 'pomodoro'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Clock className="w-4 h-4 text-indigo-300" />
            <span>Classical Pomodoro</span>
            <span className="hidden md:inline text-[11px] text-indigo-200/80 font-normal">
              (Fixed Intervals • 25m/50m Countdown)
            </span>
          </button>

          <button
            onClick={() => {
              if (engineMode !== 'flowmodoro') {
                if (isActive) {
                  if (confirm('A Pomodoro session is currently running. Switch to Flowmodoro?')) {
                    setIsActive(false);
                    targetEndTimeRef.current = null;
                    setEngineMode('flowmodoro');
                  }
                } else {
                  setEngineMode('flowmodoro');
                }
              }
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              engineMode === 'flowmodoro'
                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Zap className="w-4 h-4 text-cyan-300" />
            <span>Flowtime / Flowmodoro</span>
            <span className="hidden md:inline text-[11px] text-cyan-200/80 font-normal">
              (Open-Ended Stopwatch • Dynamic Break Ratio 1:{flowConfig.focusToBreakRatio})
            </span>
          </button>

          {/* Triage Mode Toggle */}
          <div className="w-px h-8 bg-zinc-700/60 mx-1 flex-shrink-0" />
          <button
            onClick={() => setTriageModeActive(v => !v)}
            className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              triageModeActive
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 shadow-md shadow-amber-500/30'
                : 'text-zinc-400 hover:text-amber-300 hover:bg-zinc-800/50'
            }`}
          >
            <Zap className={`w-4 h-4 ${triageModeActive ? 'text-zinc-950' : 'text-amber-400'}`} />
            <span>Triage Mode</span>
            <span className="hidden md:inline text-[11px] font-normal opacity-75">
              (90s Bail-or-Commit)
            </span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Arena (Timer + Active Task) & Right Side (Synth Suite + Tasks) */}
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-start">
        
        {/* Left Column: Timer & Controls (7 cols on large) */}
        <div className={isFortressMode ? 'fixed inset-0 z-[60] flex flex-col items-center justify-center p-8 max-w-2xl mx-auto space-y-6 pointer-events-none' : 'lg:col-span-7 space-y-6'}>
          <div className={isFortressMode ? 'w-full pointer-events-auto' : 'contents'}>
          {/* ============================================================ */}
          {/* FLOWMODORO ENGINE CARD */}
          {/* ============================================================ */}
          {engineMode === 'flowmodoro' && (
            <div className={`bg-zinc-900/90 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl ${
              isFortressMode ? 'border-indigo-500/30' : ''
            }`}>
              {/* Background Ambient Glow */}
              <div className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-25 transition-all duration-700 ${
                flowIsBreakActive ? 'bg-emerald-500' : flowIsActive ? 'bg-cyan-500' : 'bg-indigo-500'
              }`} />

              {/* Top Flow State Immersion Badge */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                {!flowIsBreakActive ? (
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 shadow-sm ${flowStageInfo.color}`}>
                      <Activity className="w-3.5 h-3.5 animate-pulse" />
                      {flowStageInfo.badge}
                    </span>
                    <span className="text-[11px] text-zinc-400 hidden sm:inline">
                      {flowStageInfo.description}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 bg-emerald-950/60 border-emerald-500/40 text-emerald-300 shadow-sm">
                      <Coffee className="w-3.5 h-3.5 text-emerald-400" />
                      🌴 Dynamic Earned Rest Active
                    </span>
                    <span className="text-[11px] text-emerald-400/80">
                      Recharging neural stamina
                    </span>
                  </div>
                )}

                {/* Live Earned Break Indicator Pill */}
                {!flowIsBreakActive && (
                  <div className="px-3 py-1.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs font-medium text-zinc-300 flex items-center gap-1.5 shadow-inner">
                    <Coffee className="w-3.5 h-3.5 text-amber-400" />
                    <span>Earned Break:</span>
                    <span className="font-mono font-bold text-cyan-300">
                      {formatEarnedBreak(earnedDynamicBreakSeconds)}
                    </span>
                  </div>
                )}
              </div>

              {/* Big Digital Display (Stopwatch or Break Countdown) */}
              <div className="text-center relative my-4 sm:my-6">
                {!flowIsBreakActive ? (
                  <>
                    <div className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter tabular-nums font-mono bg-clip-text text-transparent bg-gradient-to-b from-zinc-100 via-cyan-100 to-cyan-400 drop-shadow-2xl">
                      {formatFlowTime(flowElapsedSeconds, flowElapsedSeconds >= 3600)}
                    </div>
                    <p className="text-xs text-zinc-400 mt-2 font-medium">
                      {flowIsActive ? '⚡ Uninterrupted Cognitive Flow Accumulating...' : flowElapsedSeconds > 0 ? '⏸️ Flow Paused — Click Play to Resume' : 'Ready to begin open-ended study session'}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter tabular-nums font-mono bg-clip-text text-transparent bg-gradient-to-b from-emerald-100 via-teal-200 to-emerald-400 drop-shadow-2xl">
                      {formatFlowTime(flowBreakRemainingSeconds)}
                    </div>
                    <p className="text-xs text-emerald-400/90 mt-2 font-medium">
                      ☕ Earned Break Countdown ({formatEarnedBreak(flowBreakTotalSeconds)} total rest)
                    </p>
                  </>
                )}

                {/* Meta Badges */}
                <div className="flex items-center justify-center gap-3 mt-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-xs font-medium text-zinc-300">
                    <Award className="w-3.5 h-3.5 text-cyan-400" />
                    {totalCompletedCycles} Flow Sessions Completed
                  </span>

                  {isAudioPlaying && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-700/50 text-xs font-medium text-cyan-300">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                      {SOUND_PRESETS.find(p => p.id === activePreset)?.freqLabel || 'Audio On'}
                    </span>
                  )}
                </div>

                {/* Linear Dynamic Break Progress Bar */}
                <div className="w-full bg-zinc-950/80 h-2 rounded-full mt-6 overflow-hidden border border-zinc-800/60 relative">
                  {!flowIsBreakActive ? (
                    <div 
                      className="h-full transition-all duration-300 rounded-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400"
                      style={{ 
                        width: `${Math.min(100, ((flowElapsedSeconds % 1800) / 1800) * 100)}%` 
                      }}
                      title="Next 30m Milestone Progression"
                    />
                  ) : (
                    <div 
                      className="h-full transition-all duration-300 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                      style={{ 
                        width: `${Math.min(100, Math.max(0, ((flowBreakTotalSeconds - flowBreakRemainingSeconds) / Math.max(1, flowBreakTotalSeconds)) * 100))}%` 
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Timer Action Controls */}
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-8">
                {!flowIsBreakActive ? (
                  <>
                    {/* Reset Button */}
                    <button
                      onClick={() => {
                        if (flowElapsedSeconds > 60) {
                          if (confirm('Reset current flow session without logging?')) {
                            resetFlowTimer();
                          }
                        } else {
                          resetFlowTimer();
                        }
                      }}
                      disabled={flowElapsedSeconds === 0}
                      className="p-3.5 sm:p-4 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700/80 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-300 border border-zinc-700/60 transition-all hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
                      title="Reset Stopwatch"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>

                    {/* Main Play / Pause Count-Up Button */}
                    <button
                      onClick={toggleFlowTimer}
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-xl cursor-pointer ${
                        flowIsActive
                          ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/25 ring-4 ring-amber-500/20'
                          : 'bg-gradient-to-tr from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white shadow-cyan-600/30 ring-4 ring-cyan-500/20'
                      }`}
                      title={flowIsActive ? "Pause Flow Sprint" : "Start Deep Flow Sprint"}
                    >
                      {flowIsActive ? (
                        <Pause className="w-7 h-7 sm:w-9 sm:h-9 fill-current" />
                      ) : (
                        <Play className="w-7 h-7 sm:w-9 sm:h-9 ml-1 fill-current" />
                      )}
                    </button>

                    {/* Finish Flow & Claim Earned Break Button */}
                    <button
                      onClick={handleFinishFlowSession}
                      disabled={flowElapsedSeconds === 0}
                      className="px-4 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs sm:text-sm border border-emerald-500/40 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
                      title="Complete Flow Session and Claim Earned Dynamic Rest"
                    >
                      <Coffee className="w-4 h-4" />
                      <span>Finish & Rest ({formatEarnedBreak(earnedDynamicBreakSeconds)})</span>
                    </button>
                  </>
                ) : (
                  /* Break Controls */
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        // Add 5 min extension
                        setFlowBreakTotalSeconds(prev => prev + 300);
                        setFlowBreakRemainingSeconds(prev => prev + 300);
                        if (flowBreakTargetEndTimeRef.current) {
                          flowBreakTargetEndTimeRef.current += 300 * 1000;
                        }
                      }}
                      className="px-4 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-emerald-300 border border-emerald-800/40 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
                    >
                      +5m Rest Extension
                    </button>
                    <button
                      onClick={skipFlowBreak}
                      className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-semibold shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <span>Resume Study Sprint</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
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
          )}

          {/* ============================================================ */}
          {/* CLASSICAL POMODORO CARD */}
          {/* ============================================================ */}
          {engineMode === 'pomodoro' && (
            <div className={`bg-zinc-900/90 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl ${
              isFortressMode ? 'border-indigo-500/30' : ''
            }`}>
              {/* Background Ambient Glow */}
              <div className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-20 transition-all duration-700 ${
                mode === 'focus' ? 'bg-indigo-500' : mode === 'short_break' ? 'bg-emerald-500' : 'bg-cyan-500'
              }`} />

              {/* Mode Switcher Tabs */}
              <div className="flex items-center justify-center p-1.5 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl max-w-md mx-auto mb-8 shadow-inner">
                <button
                  onClick={() => switchMode('focus')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    mode === 'focus'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  🧠 Focus ({focusDuration}m)
                </button>
                <button
                  onClick={() => switchMode('short_break')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    mode === 'short_break'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  ☕ Short Break ({shortBreakDuration}m)
                </button>
                <button
                  onClick={() => switchMode('long_break')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
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
                  className="p-3.5 sm:p-4 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 border border-zinc-700/60 transition-all hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                {/* Main Play / Pause Button */}
                <button
                  onClick={toggleTimer}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-xl cursor-pointer ${
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
                  className="p-3.5 sm:p-4 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 border border-zinc-700/60 transition-all hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
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
          )}

          {/* Triage Mode Panel */}
          {triageModeActive && <TriageMode />}

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
            <div className="flex items-center gap-2 pt-2">
              {engineMode === 'pomodoro' && timeLeft < focusDuration * 60 && mode === 'focus' ? (
                <button
                  type="button"
                  onClick={() => promptLogSession(Math.max(1, Math.round((focusDuration * 60 - timeLeft) / 60)), subject, topic)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-indigo-300 border border-indigo-900/50 hover:border-indigo-500/50 rounded-xl transition-all font-semibold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Log Elapsed Focus ({Math.max(1, Math.round((focusDuration * 60 - timeLeft) / 60))}m)
                </button>
              ) : engineMode === 'flowmodoro' && flowElapsedSeconds >= 10 ? (
                <button
                  type="button"
                  onClick={() => promptLogSession(Math.max(1, Math.round(flowElapsedSeconds / 60)), subject, topic)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-cyan-300 border border-cyan-900/50 hover:border-cyan-500/50 rounded-xl transition-all font-semibold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Log Current Flow ({Math.max(1, Math.round(flowElapsedSeconds / 60))}m)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => promptLogSession(focusDuration, subject, topic)}
                  className="flex-1 py-2.5 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-white border border-zinc-700/60 rounded-xl transition-all font-semibold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-indigo-400" />
                  Log Study Session
                </button>
              )}
            </div>
          </div>
          </div>
        </div>

        {/* Right Column: Audio Synth Suite + Task Checklist (5 cols on large) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Audio Synthesizer & Distraction-Free YouTube Suite Card */}
          <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Headphones className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">Study Audio & Focus Engine</h3>
                  <p className="text-[11px] text-zinc-400">Pure Synthesizers, Binaural Waves & YouTube Streams</p>
                </div>
              </div>
              <button
                onClick={() => pomodoroAudio.playCompletionChime()}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700/60 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Preview Zen Bell Sound"
              >
                <Bell className="w-3 h-3 text-amber-400" />
                Test Bell
              </button>
            </div>

            {/* Audio Engine Mode Switcher: Synth vs YouTube Focus */}
            <div className="flex items-center p-1 bg-zinc-950 rounded-2xl border border-zinc-800">
              <button
                onClick={() => setAudioEngineType('synth')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  audioEngineType === 'synth'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Headphones className="w-3.5 h-3.5" />
                Web Audio Synth
              </button>
              <button
                onClick={() => {
                  setAudioEngineType('youtube');
                  if (isAudioPlaying) {
                    pomodoroAudio.pause();
                    setIsAudioPlaying(false);
                  }
                }}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  audioEngineType === 'youtube'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Youtube className="w-3.5 h-3.5" />
                YouTube Focus (0 Distractions)
              </button>
            </div>

            {audioEngineType === 'synth' ? (
              <>
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
                    <button
                      onClick={handleToggleAudioPlay}
                      className={`flex-1 py-2 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
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

                    <button
                      onClick={handleToggleMute}
                      className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                        isMuted 
                          ? 'bg-red-950/80 border-red-800 text-red-400' 
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                      }`}
                      title={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : audioVolume > 0.5 ? <Volume2 className="w-4 h-4" /> : <Volume1 className="w-4 h-4" />}
                    </button>
                  </div>

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
                          className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
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
              </>
            ) : (
              /* Distraction-Free YouTube Engine */
              <div className="space-y-4">
                {/* Active Embed Player */}
                {selectedYtTrack && (
                  <div className="space-y-2">
                    <div className="w-full aspect-video rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-inner relative">
                      <iframe
                        src={YouTubeAudioService.getEmbedUrl(selectedYtTrack.youtubeId, isYtPlaying)}
                        title={selectedYtTrack.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-zinc-100 truncate">{selectedYtTrack.title}</div>
                        <div className="text-[10px] text-zinc-400 truncate">{selectedYtTrack.artist} • {selectedYtTrack.tag}</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={`https://www.youtube.com/watch?v=${selectedYtTrack.youtubeId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 transition-colors flex items-center gap-1"
                          title="Open directly in YouTube"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Open
                        </a>
                        <button
                          type="button"
                          onClick={handleNextYtTrack}
                          className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-zinc-800 hover:bg-zinc-700 text-rose-300 border border-rose-900/40 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Skip to next track"
                        >
                          <SkipForward className="w-3 h-3" />
                          Next
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAudioEngineType('synth');
                            handleSelectPreset(activePreset);
                          }}
                          className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/60 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Switch to pure offline synthesizer"
                        >
                          <Brain className="w-3 h-3" />
                          Synth
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* YouTube Search Bar & Live Rotation */}
                <form onSubmit={handleYtSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search songs, artists, or study vibes..."
                      value={ytSearchQuery}
                      onChange={(e) => setYtSearchQuery(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-rose-500/50 placeholder:text-zinc-600"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isYtSearching}
                    className="px-3 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 shadow-md shadow-rose-600/20 cursor-pointer"
                  >
                    {isYtSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
                  </button>
                  <button
                    type="button"
                    onClick={handleShuffleYtTracks}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                    title="Shuffle and rotate fresh study streams"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Fresh</span>
                  </button>
                </form>

                {/* Category Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-thin">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'lofi', label: 'Lo-Fi' },
                    { id: 'classical', label: 'Classical' },
                    { id: 'cinematic', label: 'Cinematic' },
                    { id: 'binaural', label: '40Hz Gamma' },
                    { id: 'synthwave', label: 'Synthwave' },
                    { id: 'ambient', label: 'Rain Café' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setYtCategoryFilter(cat.id)}
                      className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                        ytCategoryFilter === cat.id
                          ? 'bg-rose-600/20 text-rose-300 border border-rose-500/40 font-semibold'
                          : 'bg-zinc-950 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Track Selection List */}
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {ytTracks
                    .filter(t => ytCategoryFilter === 'all' || t.category === ytCategoryFilter)
                    .map((track) => {
                      const isSelected = selectedYtTrack?.youtubeId === track.youtubeId;
                      return (
                        <div
                          key={track.id}
                          onClick={() => handleSelectYtTrack(track)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-rose-950/40 border-rose-500/70 shadow-md shadow-rose-600/10'
                              : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-zinc-200 truncate">{track.title}</div>
                            <div className="text-[10px] text-zinc-400 truncate">{track.artist} • {track.tag}</div>
                          </div>
                          <button
                            className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                              isSelected
                                ? 'bg-rose-600 text-white'
                                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                            }`}
                          >
                            <Play className="w-3 h-3 fill-current" />
                          </button>
                        </div>
                      );
                    })}
                </div>

                {/* Paste Custom YouTube Link / ID Form */}
                <form onSubmit={handleAddCustomYtTrack} className="pt-2 border-t border-zinc-800/80 space-y-1.5">
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                    Paste Any YouTube URL or Video ID:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. https://youtu.be/... or ID"
                      value={customYtInput}
                      onChange={(e) => setCustomYtInput(e.target.value)}
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-rose-500/50 placeholder:text-zinc-600"
                    />
                    <button
                      type="submit"
                      disabled={!customYtInput.trim()}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                    >
                      Stream
                    </button>
                  </div>
                </form>
              </div>
            )}

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
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs transition-colors flex items-center gap-1 shadow-md shadow-emerald-600/20 cursor-pointer"
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
                  const isTaskActive = activeTaskId === t.id;
                  const isEditing = editingTaskId === t.id;

                  return (
                    <div
                      key={t.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                        isTaskActive 
                          ? 'bg-indigo-950/40 border-indigo-500/70 shadow-md shadow-indigo-500/10' 
                          : t.isCompleted 
                            ? 'bg-zinc-950/40 border-zinc-800/40 opacity-60' 
                            : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                      }`}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => handleToggleTaskComplete(t.id)}
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer ${
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
                              className="text-xs px-2 py-0.5 bg-emerald-600 text-white rounded cursor-pointer"
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
                              {isTaskActive && (
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
                          className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                          title="Edit Task"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(t.id)}
                          className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
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

      {/* ============================================================ */}
      {/* FLOWMODORO BREAK CONFIRMATION MODAL */}
      {/* ============================================================ */}
      {showBreakPromptModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 space-y-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/20">
              <Coffee className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-zinc-100">Flow Sprint Finished!</h3>
              <p className="text-xs text-zinc-400 mt-1">
                You maintained continuous deep focus for <span className="text-cyan-300 font-bold font-mono">{formatFlowTime(flowElapsedSeconds)}</span> ({Math.round(flowElapsedSeconds / 60)} mins).
              </p>
            </div>

            <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Flow Stage Reached:</span>
                <span className={`px-2 py-0.5 rounded-lg border font-semibold ${flowStageInfo.color}`}>
                  {flowStageInfo.badge}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Rest Scaling (1:{flowConfig.focusToBreakRatio}):</span>
                <span className="text-emerald-400 font-bold font-mono text-sm">
                  {formatEarnedBreak(earnedDynamicBreakSeconds)} Earned
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => startDynamicBreak(earnedDynamicBreakSeconds)}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Coffee className="w-4 h-4" />
                <span>Start Earned Break Now ({formatEarnedBreak(earnedDynamicBreakSeconds)})</span>
              </button>

              <button
                onClick={() => {
                  setShowBreakPromptModal(false);
                  resetFlowTimer();
                }}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-2xl transition-all text-xs cursor-pointer"
              >
                Skip Break & Return to Idle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SETTINGS MODAL DRAWER (POMODORO & FLOWMODORO CONFIG) */}
      {/* ============================================================ */}
      {showSettingsDrawer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-zinc-100">Focus Engine Configurations</h3>
              </div>
              <button
                onClick={() => setShowSettingsDrawer(false)}
                className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FLOWMODORO ENGINE SETTINGS SECTION */}
            <div className="space-y-4 pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Flowmodoro & Dynamic Rest Parameters
                </h4>
              </div>

              {/* Focus-to-Break Ratio Slider */}
              <div>
                <div className="flex justify-between items-center text-sm font-medium mb-1.5">
                  <span className="text-zinc-300">Rest Ratio ($\rho$)</span>
                  <span className="text-cyan-400 font-mono font-bold">1 min break per {flowConfig.focusToBreakRatio} min focus</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="8"
                  step="1"
                  value={flowConfig.focusToBreakRatio}
                  onChange={(e) => setFlowConfig(prev => ({ ...prev, focusToBreakRatio: parseInt(e.target.value) || 5 }))}
                  className="w-full accent-cyan-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                  <span>1:3 (Generous)</span>
                  <span>1:5 (Standard Flowmodoro)</span>
                  <span>1:8 (Ultra High Density)</span>
                </div>
              </div>

              {/* Min and Max Break Clamps */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-center text-xs font-medium mb-1">
                    <span className="text-zinc-300">Min Break</span>
                    <span className="text-cyan-400 font-mono">{flowConfig.minBreakMinutes}m</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={flowConfig.minBreakMinutes}
                    onChange={(e) => setFlowConfig(prev => ({ ...prev, minBreakMinutes: parseInt(e.target.value) || 3 }))}
                    className="w-full accent-cyan-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs font-medium mb-1">
                    <span className="text-zinc-300">Max Cap</span>
                    <span className="text-cyan-400 font-mono">{flowConfig.maxBreakMinutes}m</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="60"
                    step="5"
                    value={flowConfig.maxBreakMinutes}
                    onChange={(e) => setFlowConfig(prev => ({ ...prev, maxBreakMinutes: parseInt(e.target.value) || 30 }))}
                    className="w-full accent-cyan-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Fatigue Nudge Slider */}
              <div>
                <div className="flex justify-between items-center text-xs font-medium mb-1.5">
                  <span className="text-zinc-300">Fatigue Alert Threshold</span>
                  <span className="text-amber-400 font-mono font-bold">{flowConfig.fatigueNudgeMinutes} min</span>
                </div>
                <input
                  type="range"
                  min="45"
                  max="120"
                  step="15"
                  value={flowConfig.fatigueNudgeMinutes}
                  onChange={(e) => setFlowConfig(prev => ({ ...prev, fatigueNudgeMinutes: parseInt(e.target.value) || 90 }))}
                  className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Flow Toggles */}
              <div className="space-y-2 pt-1">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-medium text-zinc-300">Auto-start earned break on finish</span>
                  <input
                    type="checkbox"
                    checked={flowConfig.autoStartEarnedBreak}
                    onChange={(e) => setFlowConfig(prev => ({ ...prev, autoStartEarnedBreak: e.target.checked }))}
                    className="accent-cyan-500 w-4 h-4 rounded cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-medium text-zinc-300">Auto-log finished flow sprint to Dashboard</span>
                  <input
                    type="checkbox"
                    checked={flowConfig.autoLogToContext}
                    onChange={(e) => setFlowConfig(prev => ({ ...prev, autoLogToContext: e.target.checked }))}
                    className="accent-cyan-500 w-4 h-4 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* CLASSICAL POMODORO SETTINGS SECTION */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Classical Pomodoro Fixed Durations
                </h4>
              </div>

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
              </div>

              {/* Long Break Interval */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-2">
                  Long Break Interval (every N sessions)
                </label>
                <div className="flex gap-2">
                  {[2, 3, 4, 5, 6].map(num => (
                    <button
                      key={num}
                      onClick={() => setLongBreakInterval(num)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
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
                  <span className="text-xs font-medium text-zinc-300">Auto-start breaks in Pomodoro mode</span>
                  <input
                    type="checkbox"
                    checked={autoStartBreaks}
                    onChange={(e) => setAutoStartBreaks(e.target.checked)}
                    className="accent-indigo-500 w-4 h-4 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-medium text-zinc-300">Sound notifications (Zen Chime)</span>
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                    className="accent-indigo-500 w-4 h-4 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>

            <button
              onClick={() => setShowSettingsDrawer(false)}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              Apply All Settings
            </button>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SESSION LOG CONFIRMATION MODAL (ASK BEFORE SAVING)               */}
      {/* ================================================================= */}
      {showLogPromptModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700/80 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-100">Session Complete — Save to Study Logs?</h3>
                  <p className="text-xs text-zinc-400">Review & confirm details before adding to your Streak & Heatmap.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDiscardSessionLog}
                className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Subject & Duration row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Subject</label>
                  <select
                    value={sessionLogData.subject}
                    onChange={(e) => setSessionLogData(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    {['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'General'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Duration (Mins)</label>
                  <input
                    type="number"
                    min={1}
                    max={720}
                    value={sessionLogData.durationMinutes}
                    onChange={(e) => setSessionLogData(prev => ({ ...prev, durationMinutes: Math.max(1, parseInt(e.target.value) || 1) }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              {/* Topic */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Topic / Chapter</label>
                <input
                  type="text"
                  placeholder="e.g. Rotational Dynamics — Moment of Inertia"
                  value={sessionLogData.topic}
                  onChange={(e) => setSessionLogData(prev => ({ ...prev, topic: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              {/* Problems Solved & Accuracy */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Problems Solved</label>
                  <input
                    type="number"
                    min={0}
                    max={500}
                    value={sessionLogData.problemsSolved}
                    onChange={(e) => setSessionLogData(prev => ({ ...prev, problemsSolved: Math.max(0, parseInt(e.target.value) || 0) }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Accuracy % (Optional)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={sessionLogData.accuracyPercent ?? ''}
                    onChange={(e) => setSessionLogData(prev => ({ ...prev, accuracyPercent: e.target.value ? Math.min(100, Math.max(0, parseInt(e.target.value))) : null }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-zinc-600"
                    placeholder="e.g. 85"
                  />
                </div>
              </div>

              {/* Energy Mood & Focus Score */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Energy / State</label>
                  <select
                    value={sessionLogData.energyMood}
                    onChange={(e) => setSessionLogData(prev => ({ ...prev, energyMood: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <option value="Peak Flow">⚡ Peak Flow</option>
                    <option value="High Energy">🔥 High Energy</option>
                    <option value="Normal">✨ Steady / Normal</option>
                    <option value="Fatigued">💤 Fatigued / Tired</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Focus Score ({sessionLogData.focusScore}/10)</label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={sessionLogData.focusScore}
                    onChange={(e) => setSessionLogData(prev => ({ ...prev, focusScore: parseInt(e.target.value) }))}
                    className="w-full accent-indigo-500 mt-2"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={handleDiscardSessionLog}
                disabled={isSavingSessionLog}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Skip / Discard
              </button>
              <button
                type="button"
                onClick={handleSaveCompletedSession}
                disabled={isSavingSessionLog}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSavingSessionLog ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save to Study Logs</span>
              </button>
            </div>
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
