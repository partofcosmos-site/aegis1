// Savantix (Aegis) Elastic Streak Health Bar & Resilience Token Engine
// Implements non-binary anti-fragile streak gamification with 100 HP health bar,
// auto-defending shield tokens, daily decay/recovery mechanics, and localStorage synchronization.

import { format, parseISO, addDays, differenceInCalendarDays, isAfter, isValid } from 'date-fns';

export type StreakStatusCategory =
  | 'shield_defended'
  | 'zero_decay'
  | 'partial_decay'
  | 'target_met'
  | 'surplus_overdrive'
  | 'untracked';

export interface StreakEvaluationHistoryEntry {
  date: string; // 'yyyy-MM-dd'
  actualMinutes: number;
  targetMinutes: number;
  hpDelta: number;
  hpResult: number;
  shieldUsed: boolean;
  shieldEarned: boolean;
  streakResult: number;
  status: StreakStatusCategory;
  notes?: string;
}

export interface ElasticStreakState {
  currentHP: number;         // 0 - 100
  maxHP: number;             // 100
  shieldTokens: number;      // 0 - 3
  maxShieldTokens: number;   // 3
  activeStreakDays: number;
  longestStreakDays: number;
  lastEvaluatedDate: string; // 'yyyy-MM-dd'
  targetMinutesDaily: number; // default: 120
  history: StreakEvaluationHistoryEntry[];
}

export interface DailyLogSummary {
  date: string; // 'yyyy-MM-dd'
  totalMinutes: number;
  problemsSolved?: number;
}

export interface StreakHealthTierInfo {
  tier: 'emerald' | 'amber' | 'crimson';
  label: string;
  subLabel: string;
  bgGradient: string;
  barColor: string;
  textColor: string;
  borderColor: string;
  glowColor: string;
  pulse: boolean;
}

export interface ShieldTokenSlot {
  index: number;
  isCharged: boolean;
  label: string;
  tooltip: string;
}

export interface AntiFragileStreakBadge {
  text: string;
  subText: string;
  icon: string;
  badgeClass: string;
  isProtected: boolean;
  isDegraded: boolean;
  isCritical: boolean;
}

export const STORAGE_KEY_STREAK_RESILIENCE = 'savantix_streak_resilience_v1';
export const DEFAULT_DAILY_TARGET_MINUTES = 120; // 2 hours standard target
export const MAX_HP = 100;
export const MAX_SHIELD_TOKENS = 3;
export const INITIAL_SHIELD_TOKENS = 2; // 2 onboarding resilience shields
export const MISSED_DAY_HP_PENALTY = 35;
export const PARTIAL_DAY_MAX_PENALTY = 20;
export const TARGET_MET_HP_RECOVERY = 15;
export const OVERDRIVE_HP_RECOVERY = 25;
export const OVERDRIVE_TARGET_MULTIPLIER = 1.5;

export const DEFAULT_STREAK_STATE: ElasticStreakState = {
  currentHP: 100,
  maxHP: MAX_HP,
  shieldTokens: INITIAL_SHIELD_TOKENS,
  maxShieldTokens: MAX_SHIELD_TOKENS,
  activeStreakDays: 0,
  longestStreakDays: 0,
  lastEvaluatedDate: format(new Date(), 'yyyy-MM-dd'),
  targetMinutesDaily: DEFAULT_DAILY_TARGET_MINUTES,
  history: []
};

/**
 * Loads the Elastic Streak state from localStorage with fallback to default state.
 */
export function loadElasticStreakState(): ElasticStreakState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_STREAK_RESILIENCE);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        currentHP: typeof parsed.currentHP === 'number' ? Math.max(0, Math.min(MAX_HP, parsed.currentHP)) : DEFAULT_STREAK_STATE.currentHP,
        maxHP: MAX_HP,
        shieldTokens: typeof parsed.shieldTokens === 'number' ? Math.max(0, Math.min(MAX_SHIELD_TOKENS, parsed.shieldTokens)) : DEFAULT_STREAK_STATE.shieldTokens,
        maxShieldTokens: MAX_SHIELD_TOKENS,
        activeStreakDays: Math.max(0, Number(parsed.activeStreakDays) || 0),
        longestStreakDays: Math.max(0, Number(parsed.longestStreakDays) || 0),
        lastEvaluatedDate: parsed.lastEvaluatedDate || format(new Date(), 'yyyy-MM-dd'),
        targetMinutesDaily: Math.max(15, Number(parsed.targetMinutesDaily) || DEFAULT_DAILY_TARGET_MINUTES),
        history: Array.isArray(parsed.history) ? parsed.history : []
      };
    }
  } catch (err) {
    console.warn('Failed to load ElasticStreakState from localStorage:', err);
  }
  return { ...DEFAULT_STREAK_STATE };
}

/**
 * Saves the Elastic Streak state to localStorage.
 */
export function saveElasticStreakState(state: ElasticStreakState): void {
  try {
    localStorage.setItem(STORAGE_KEY_STREAK_RESILIENCE, JSON.stringify(state));
  } catch (err) {
    console.warn('Failed to save ElasticStreakState to localStorage:', err);
  }
}

/**
 * Aggregates raw study logs into daily minutes map keyed by 'yyyy-MM-dd'.
 */
export function aggregateLogsByDate(logs: any[]): Map<string, { totalMinutes: number; problemsSolved: number }> {
  const map = new Map<string, { totalMinutes: number; problemsSolved: number }>();
  if (!Array.isArray(logs)) return map;

  logs.forEach(log => {
    if (!log || !log.date) return;
    const dateStr = String(log.date).substring(0, 10);
    const existing = map.get(dateStr) || { totalMinutes: 0, problemsSolved: 0 };
    const duration = Math.max(0, Number(log.durationMinutes)) || 0;
    const problems = Math.max(0, Number(log.problemsSolved)) || 0;

    existing.totalMinutes += duration;
    existing.problemsSolved += problems;
    map.set(dateStr, existing);
  });

  return map;
}

/**
 * Evaluates a single calendar day step according to the elastic streak and resilience mechanics.
 * 
 * Rules:
 * 1. Missed study (T_actual = 0):
 *    - If shieldTokens > 0: Consume 1 shield token, 0 HP loss, streak FROZEN (maintained).
 *    - If shieldTokens = 0: -35 HP. If HP reaches 0, streak resets to 0.
 * 2. Partial study (0 < T_actual < T_target):
 *    - Loss: 20 * (1 - T_actual / T_target) HP.
 *    - Streak continues as degraded (maintained if HP > 0, reset to 0 if HP reaches 0).
 * 3. Target reached (T_actual >= T_target and T_actual < 1.5 * T_target):
 *    - +15 HP recovery (capped at 100).
 *    - Streak + 1.
 * 4. Surplus overdrive (T_actual >= 1.5 * T_target):
 *    - +25 HP recovery (capped at 100).
 *    - Charge +1 Shield Token (capped at 3).
 *    - Streak + 1.
 */
export function evaluateDayStep(
  prevState: ElasticStreakState,
  date: string,
  actualMinutes: number,
  targetMinutes: number
): { nextState: ElasticStreakState; historyEntry: StreakEvaluationHistoryEntry } {
  const safeTarget = Math.max(1, targetMinutes);
  let hp = prevState.currentHP;
  let shields = prevState.shieldTokens;
  let streak = prevState.activeStreakDays;
  let hpDelta = 0;
  let shieldUsed = false;
  let shieldEarned = false;
  let status: StreakStatusCategory = 'untracked';
  let notes = '';

  const overdriveThreshold = safeTarget * OVERDRIVE_TARGET_MULTIPLIER;

  if (actualMinutes >= overdriveThreshold) {
    // Case 1: Surplus Overdrive
    status = 'surplus_overdrive';
    hpDelta = OVERDRIVE_HP_RECOVERY;
    hp = Math.min(MAX_HP, hp + hpDelta);
    if (shields < MAX_SHIELD_TOKENS) {
      shields = Math.min(MAX_SHIELD_TOKENS, shields + 1);
      shieldEarned = true;
      notes = `Overdrive bonus: +${hpDelta} HP, +1 Shield Token charged (Total: ${shields}/${MAX_SHIELD_TOKENS})`;
    } else {
      notes = `Overdrive bonus: +${hpDelta} HP (Shield Tokens already maxed at 3/3)`;
    }
    streak += 1;
  } else if (actualMinutes >= safeTarget) {
    // Case 2: Target Met
    status = 'target_met';
    hpDelta = TARGET_MET_HP_RECOVERY;
    hp = Math.min(MAX_HP, hp + hpDelta);
    streak += 1;
    notes = `Target achieved: +${hpDelta} HP, Streak incremented to ${streak} days`;
  } else if (actualMinutes > 0) {
    // Case 3: Partial Study
    status = 'partial_decay';
    const completionRatio = Math.min(1, actualMinutes / safeTarget);
    const penalty = PARTIAL_DAY_MAX_PENALTY * (1 - completionRatio);
    hpDelta = -Math.round(penalty * 10) / 10; // Round to 1 decimal
    hp = Math.max(0, Math.round((hp + hpDelta) * 10) / 10);
    
    if (hp <= 0) {
      streak = 0;
      notes = `HP depleted to 0 on partial study. Streak broken.`;
    } else {
      // Streak continues degraded (frozen/retained)
      notes = `Partial study (${actualMinutes}/${safeTarget}m): ${hpDelta} HP penalty. Streak preserved.`;
    }
  } else {
    // Case 4: Missed Day (actualMinutes == 0)
    if (shields > 0) {
      // Shield auto-consumption defense
      status = 'shield_defended';
      shields -= 1;
      shieldUsed = true;
      hpDelta = 0;
      // Streak is frozen and protected
      notes = `Rest / Missed day: Auto-consumed 1 Resilience Shield Token (${shields}/${MAX_SHIELD_TOKENS} remaining). 0 HP loss, Streak FROZEN.`;
    } else {
      // No shields available: full missed penalty
      status = 'zero_decay';
      hpDelta = -MISSED_DAY_HP_PENALTY;
      hp = Math.max(0, hp + hpDelta);
      
      if (hp <= 0) {
        streak = 0;
        notes = `Missed day with 0 shields: -35 HP. Health depleted to 0, Streak reset to 0.`;
      } else {
        notes = `Missed day with 0 shields: -35 HP penalty (${hp}/100 HP remaining). Streak degraded.`;
      }
    }
  }

  const longest = Math.max(prevState.longestStreakDays, streak);

  const historyEntry: StreakEvaluationHistoryEntry = {
    date,
    actualMinutes,
    targetMinutes: safeTarget,
    hpDelta,
    hpResult: hp,
    shieldUsed,
    shieldEarned,
    streakResult: streak,
    status,
    notes
  };

  const nextState: ElasticStreakState = {
    currentHP: hp,
    maxHP: MAX_HP,
    shieldTokens: shields,
    maxShieldTokens: MAX_SHIELD_TOKENS,
    activeStreakDays: streak,
    longestStreakDays: longest,
    lastEvaluatedDate: date,
    targetMinutesDaily: safeTarget,
    history: [historyEntry, ...prevState.history.filter(h => h.date !== date)]
  };

  return { nextState, historyEntry };
}

/**
 * Evaluates the full elastic streak state given a collection of daily logs or raw logs.
 * Evaluates missing days between the last evaluated date and the target evaluation date.
 */
export function evaluateElasticStreak(
  currentState: ElasticStreakState = DEFAULT_STREAK_STATE,
  dailyLogs: any[] = [],
  targetMinutesDaily?: number,
  evaluationDate?: string
): ElasticStreakState {
  const targetMinutes = targetMinutesDaily || currentState.targetMinutesDaily || DEFAULT_DAILY_TARGET_MINUTES;
  const todayStr = evaluationDate || format(new Date(), 'yyyy-MM-dd');
  const aggregated = aggregateLogsByDate(dailyLogs);

  // If currentState has never been evaluated or is uninitialized, reconstruct from history
  if (!currentState.lastEvaluatedDate || !isValid(parseISO(currentState.lastEvaluatedDate))) {
    return recomputeStreakFromHistory(dailyLogs, targetMinutes, currentState.shieldTokens);
  }

  const lastDate = parseISO(currentState.lastEvaluatedDate);
  const targetDate = parseISO(todayStr);

  // If last evaluated date is today or in the future, evaluate today's current accumulated logs
  if (!isAfter(targetDate, lastDate)) {
    const todaySummary = aggregated.get(todayStr);
    const actualToday = todaySummary?.totalMinutes || 0;

    // Check if today was already evaluated in history
    const existingHistory = currentState.history.find(h => h.date === todayStr);
    
    // If today hasn't changed or isn't finalized, return current state with today's live preview
    if (existingHistory && existingHistory.actualMinutes === actualToday) {
      return currentState;
    }

    // Re-evaluate today based on the state prior to today
    const stateBeforeToday: ElasticStreakState = {
      ...currentState,
      history: currentState.history.filter(h => h.date !== todayStr)
    };

    // If there is prior history, retrieve HP and shields from previous entry
    const previousEntry = stateBeforeToday.history[0];
    if (previousEntry) {
      stateBeforeToday.currentHP = previousEntry.hpResult;
      stateBeforeToday.activeStreakDays = previousEntry.streakResult;
    }

    const { nextState } = evaluateDayStep(stateBeforeToday, todayStr, actualToday, targetMinutes);
    return nextState;
  }

  // Iterate chronologically through intermediate missed days up to today
  let runningState: ElasticStreakState = {
    ...currentState,
    targetMinutesDaily: targetMinutes
  };

  const daysGap = differenceInCalendarDays(targetDate, lastDate);
  for (let i = 1; i <= daysGap; i++) {
    const currentDateObj = addDays(lastDate, i);
    const currentDateStr = format(currentDateObj, 'yyyy-MM-dd');
    const daySummary = aggregated.get(currentDateStr);
    const actual = daySummary?.totalMinutes || 0;

    const { nextState } = evaluateDayStep(runningState, currentDateStr, actual, targetMinutes);
    runningState = nextState;
  }

  return runningState;
}

/**
 * Recomputes the entire Elastic Streak state from raw logs history deterministically.
 * Evaluates chronological daily entries across the past 30 days.
 */
export function recomputeStreakFromHistory(
  logs: any[],
  targetMinutesDaily: number = DEFAULT_DAILY_TARGET_MINUTES,
  initialShields: number = INITIAL_SHIELD_TOKENS
): ElasticStreakState {
  const aggregated = aggregateLogsByDate(logs);
  const today = new Date();
  
  // Find the earliest log date or fallback to 30 days ago
  let earliestDate = addDays(today, -30);
  const dateKeys = Array.from(aggregated.keys()).sort();
  if (dateKeys.length > 0 && isValid(parseISO(dateKeys[0]))) {
    const parsedFirst = parseISO(dateKeys[0]);
    if (differenceInCalendarDays(today, parsedFirst) <= 365) {
      earliestDate = parsedFirst;
    }
  }

  let runningState: ElasticStreakState = {
    currentHP: MAX_HP,
    maxHP: MAX_HP,
    shieldTokens: initialShields,
    maxShieldTokens: MAX_SHIELD_TOKENS,
    activeStreakDays: 0,
    longestStreakDays: 0,
    lastEvaluatedDate: format(earliestDate, 'yyyy-MM-dd'),
    targetMinutesDaily,
    history: []
  };

  const totalDays = differenceInCalendarDays(today, earliestDate);
  for (let i = 0; i <= totalDays; i++) {
    const d = addDays(earliestDate, i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const actual = aggregated.get(dateStr)?.totalMinutes || 0;

    const { nextState } = evaluateDayStep(runningState, dateStr, actual, targetMinutesDaily);
    runningState = nextState;
  }

  return runningState;
}

/**
 * Returns visual color tier and styling metrics for the 100 HP Health Bar.
 * - Emerald Tier (80 - 100 HP): Peak Resilience
 * - Amber Tier (40 - 79 HP): Degraded Resilience
 * - Crimson Tier (0 - 39 HP): Critical Hazard (Pulsing)
 */
export function getStreakHealthTier(hp: number): StreakHealthTierInfo {
  const safeHP = Math.max(0, Math.min(MAX_HP, hp));

  if (safeHP >= 80) {
    return {
      tier: 'emerald',
      label: 'Optimal Resilience',
      subLabel: 'Streak fully shielded & healthy',
      bgGradient: 'from-emerald-500 via-teal-400 to-emerald-600',
      barColor: 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.7)]',
      textColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/30',
      glowColor: 'rgba(16, 185, 129, 0.4)',
      pulse: false
    };
  } else if (safeHP >= 40) {
    return {
      tier: 'amber',
      label: 'Degraded Shield',
      subLabel: 'Study needed to restore HP',
      bgGradient: 'from-amber-500 via-orange-400 to-amber-600',
      barColor: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]',
      textColor: 'text-amber-400',
      borderColor: 'border-amber-500/30',
      glowColor: 'rgba(245, 158, 11, 0.4)',
      pulse: false
    };
  } else {
    return {
      tier: 'crimson',
      label: 'Critical Hazard',
      subLabel: 'Danger: 1 missed day will break streak',
      bgGradient: 'from-rose-600 via-red-500 to-crimson-600',
      barColor: 'bg-rose-500 shadow-[0_0_14px_rgba(244,63,94,0.8)] animate-pulse',
      textColor: 'text-rose-400',
      borderColor: 'border-rose-500/40',
      glowColor: 'rgba(244, 63, 94, 0.6)',
      pulse: true
    };
  }
}

/**
 * Returns the 3-slot Shield Token Rack state with descriptive tooltips.
 */
export function getShieldTokenRack(tokens: number, maxTokens: number = MAX_SHIELD_TOKENS): ShieldTokenSlot[] {
  const safeTokens = Math.max(0, Math.min(maxTokens, Math.floor(tokens)));
  const slots: ShieldTokenSlot[] = [];

  for (let i = 0; i < maxTokens; i++) {
    const isCharged = i < safeTokens;
    slots.push({
      index: i + 1,
      isCharged,
      label: isCharged ? `Shield ${i + 1} (Charged)` : `Slot ${i + 1} (Depleted)`,
      tooltip: isCharged
        ? `🛡️ Shield Slot ${i + 1} Armed: Automatically deploys on a rest/missed day to absorb 0 HP loss and preserve streak.`
        : `⚪ Shield Slot ${i + 1} Empty: Study 1.5× daily target (overdrive) or log 5 consecutive target days to charge.`
    });
  }

  return slots;
}

/**
 * Returns formatted Anti-Fragile Streak badge metadata for display.
 */
export function getAntiFragileStreakBadge(state: ElasticStreakState): AntiFragileStreakBadge {
  const { currentHP, shieldTokens, activeStreakDays } = state;
  const isProtected = shieldTokens > 0;
  const isDegraded = currentHP < 80 && currentHP >= 40;
  const isCritical = currentHP < 40;

  if (activeStreakDays === 0) {
    return {
      text: 'Streak Inactive',
      subText: `${currentHP} HP • ${shieldTokens} Shields Ready`,
      icon: '🌱',
      badgeClass: 'bg-zinc-800/80 border-zinc-700 text-zinc-300',
      isProtected,
      isDegraded: false,
      isCritical: false
    };
  }

  if (isProtected) {
    return {
      text: `${activeStreakDays} Day Streak (Shield Protected)`,
      subText: `🛡️ ${shieldTokens} Shield${shieldTokens === 1 ? '' : 's'} Active • ${currentHP} HP`,
      icon: '🔥',
      badgeClass: 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.25)]',
      isProtected: true,
      isDegraded,
      isCritical
    };
  }

  if (isCritical) {
    return {
      text: `${activeStreakDays} Day Streak (Critical)`,
      subText: `⚠️ ${currentHP} HP • No Shields Left`,
      icon: '⚡',
      badgeClass: 'bg-rose-950/60 border-rose-500/50 text-rose-300 animate-pulse',
      isProtected: false,
      isDegraded: false,
      isCritical: true
    };
  }

  if (isDegraded) {
    return {
      text: `${activeStreakDays} Day Streak (Degraded)`,
      subText: `⚡ ${currentHP} HP • 0 Shields`,
      icon: '🔥',
      badgeClass: 'bg-amber-950/60 border-amber-500/40 text-amber-300',
      isProtected: false,
      isDegraded: true,
      isCritical: false
    };
  }

  return {
    text: `${activeStreakDays} Day Streak`,
    subText: `${currentHP} HP • Pure Velocity`,
    icon: '🔥',
    badgeClass: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
    isProtected: false,
    isDegraded: false,
    isCritical: false
  };
}
