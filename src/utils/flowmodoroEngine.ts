// Savantix (Aegis) Flowmodoro & Flowtime Calculation Engine
// Provides count-up stopwatch calculations, dynamic break scaling (Break = Focus / 5),
// flow state stage classifiers, and persistence utilities.

export type TimerEngineMode = 'pomodoro' | 'flowmodoro';

export type FlowStateStage = 'ramp_up' | 'deep_flow' | 'hyper_focus' | 'fatigue_warning';

export interface FlowmodoroConfig {
  focusToBreakRatio: number;   // default: 5 (1 min break per 5 min focus)
  minBreakMinutes: number;     // default: 3
  maxBreakMinutes: number;     // default: 30
  fatigueNudgeMinutes: number; // default: 90
  autoStartEarnedBreak: boolean; // default: false
  autoLogToContext: boolean;   // default: true
}

export interface FlowStageInfo {
  stage: FlowStateStage;
  label: string;
  badge: string;
  color: string;
  description: string;
  alertLevel: 'normal' | 'optimal' | 'peak' | 'warning';
}

export interface FlowSessionState {
  engineMode: TimerEngineMode;
  isActive: boolean;
  isPaused: boolean;
  elapsedFocusSeconds: number;
  earnedBreakSeconds: number;
  remainingBreakSeconds: number;
  isBreakActive: boolean;
  flowStage: FlowStateStage;
  startTime: number | null;
  targetBreakEndTime: number | null;
}

export const STORAGE_KEY_FLOWMODORO_CONFIG = 'savantix_flowmodoro_config_v1';
export const STORAGE_KEY_FLOWMODORO_STATE = 'savantix_flowmodoro_state_v1';

export const DEFAULT_FLOWMODORO_CONFIG: FlowmodoroConfig = {
  focusToBreakRatio: 5,
  minBreakMinutes: 3,
  maxBreakMinutes: 30,
  fatigueNudgeMinutes: 90,
  autoStartEarnedBreak: false,
  autoLogToContext: true
};

/**
 * Loads Flowmodoro configuration from localStorage with fallback to defaults.
 */
export function loadFlowmodoroConfig(): FlowmodoroConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_FLOWMODORO_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_FLOWMODORO_CONFIG,
        ...parsed,
        focusToBreakRatio: Number(parsed.focusToBreakRatio) || DEFAULT_FLOWMODORO_CONFIG.focusToBreakRatio,
        minBreakMinutes: Number(parsed.minBreakMinutes) || DEFAULT_FLOWMODORO_CONFIG.minBreakMinutes,
        maxBreakMinutes: Number(parsed.maxBreakMinutes) || DEFAULT_FLOWMODORO_CONFIG.maxBreakMinutes,
        fatigueNudgeMinutes: Number(parsed.fatigueNudgeMinutes) || DEFAULT_FLOWMODORO_CONFIG.fatigueNudgeMinutes
      };
    }
  } catch (err) {
    console.warn('Failed to load Flowmodoro config from localStorage:', err);
  }
  return { ...DEFAULT_FLOWMODORO_CONFIG };
}

/**
 * Saves Flowmodoro configuration to localStorage.
 */
export function saveFlowmodoroConfig(config: FlowmodoroConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_FLOWMODORO_CONFIG, JSON.stringify(config));
  } catch (err) {
    console.warn('Failed to save Flowmodoro config to localStorage:', err);
  }
}

/**
 * Calculates dynamic earned break time based on elapsed focus seconds.
 * 
 * Formula:
 * - Focus < 300s (5 mins) => 0 break
 * - Focus >= 300s => clamp(round(focusSeconds / ratio), minBreakSeconds, maxBreakSeconds)
 * 
 * @param focusSeconds - Total uninterrupted focus time in seconds
 * @param config - Optional configuration overrides
 * @returns Earned break duration in seconds (integer)
 */
export function calculateDynamicBreak(
  focusSeconds: number,
  config: Partial<FlowmodoroConfig> = {}
): number {
  if (focusSeconds < 300) {
    return 0; // Less than 5 mins earns 0 break
  }

  const ratio = config.focusToBreakRatio ?? DEFAULT_FLOWMODORO_CONFIG.focusToBreakRatio;
  const minMins = config.minBreakMinutes ?? DEFAULT_FLOWMODORO_CONFIG.minBreakMinutes;
  const maxMins = config.maxBreakMinutes ?? DEFAULT_FLOWMODORO_CONFIG.maxBreakMinutes;

  const rawBreakSecs = Math.round(focusSeconds / Math.max(1, ratio));
  const minSecs = Math.max(0, minMins * 60);
  const maxSecs = Math.max(minSecs, maxMins * 60);

  return Math.max(minSecs, Math.min(maxSecs, rawBreakSecs));
}

/**
 * Determines cognitive flow immersion stage and corresponding UI badge/color styling.
 * 
 * Stages:
 * - 0 - 15 mins: Ramp-up / Entering Flow (Blue)
 * - 15 - 45 mins: Deep Focus Zone (Indigo)
 * - 45 - 90 mins: Hyper-Focus Peak (Cyan)
 * - 90+ mins: Cognitive Fatigue Alert (Amber warning nudge)
 * 
 * @param focusMinutes - Total elapsed focus time in minutes
 * @param fatigueThresholdMinutes - Configurable fatigue threshold (default: 90)
 * @returns FlowStageInfo
 */
export function getFlowStage(
  focusMinutes: number,
  fatigueThresholdMinutes: number = 90
): FlowStageInfo {
  if (focusMinutes < 15) {
    return {
      stage: 'ramp_up',
      label: 'Entering Flow',
      badge: '🌱 Ramp-Up',
      color: 'text-blue-400 border-blue-500/30 bg-blue-950/40',
      description: 'Warming up cognitive faculties; initial friction is dissolving.',
      alertLevel: 'normal'
    };
  } else if (focusMinutes < 45) {
    return {
      stage: 'deep_flow',
      label: 'Deep Focus Zone',
      badge: '⚡ Deep Focus',
      color: 'text-indigo-400 border-indigo-500/30 bg-indigo-950/40',
      description: 'High neural synchronization; optimal analytical problem solving.',
      alertLevel: 'optimal'
    };
  } else if (focusMinutes < fatigueThresholdMinutes) {
    return {
      stage: 'hyper_focus',
      label: 'Hyper-Focus Peak',
      badge: '🔥 Hyper-Focus Peak',
      color: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/40',
      description: 'Peak cognitive immersion; maximum velocity and abstract synthesis.',
      alertLevel: 'peak'
    };
  } else {
    return {
      stage: 'fatigue_warning',
      label: 'Fatigue Alert (Break Recommended)',
      badge: '⚠️ Fatigue Alert',
      color: 'text-amber-400 border-amber-500/30 bg-amber-950/40',
      description: 'Cognitive endurance threshold reached. Finish flow to claim earned rest.',
      alertLevel: 'warning'
    };
  }
}

/**
 * Formats seconds into human-readable MM:SS or HH:MM:SS format.
 * 
 * @param totalSeconds - Time in seconds
 * @param forceHours - If true, always display HH:MM:SS
 * @returns Formatted time string
 */
export function formatFlowTime(totalSeconds: number, forceHours: boolean = false): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0 || forceHours) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Formats earned break seconds into a user-friendly string (e.g. "12 mins", "3m 45s").
 * 
 * @param breakSeconds - Break duration in seconds
 * @returns Friendly string
 */
export function formatEarnedBreak(breakSeconds: number): string {
  if (breakSeconds <= 0) return '0 mins';
  const mins = Math.floor(breakSeconds / 60);
  const secs = breakSeconds % 60;
  if (secs === 0) return `${mins} min${mins === 1 ? '' : 's'}`;
  return `${mins}m ${secs}s`;
}
