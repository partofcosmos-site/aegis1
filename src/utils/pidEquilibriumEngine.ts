/**
 * Savantix (Aegis) — Dynamic Subject Equilibrium Matrix & PID Allocator Engine
 * 
 * Implements:
 * 1. Normalized Shannon Information Entropy Balance Index (E in [0, 100%])
 *    E = (-sum(p_i * ln(p_i)) / ln(N)) * 100%
 *    Status: Harmonious (E >= 90%), Mild Skew (75% <= E < 90%), Severe Neglect (E < 75%)
 * 
 * 2. Discrete PID Corrective Allocator:
 *    Delta M_i = clamp(K_p * e_i + K_i * sum(e_i) + K_d * Delta e_i, -60m, +90m)
 *    where e_i = p_i^* - p_i, K_p = 120m, K_i = 30m, K_d = 20m.
 * 
 * 3. Natural Language Actionable Prescription Generator
 * 4. LocalStorage persistence for custom subject target weights ('savantix_pid_weights_v1')
 */

export type EquilibriumStatus = 'harmonious' | 'mild_skew' | 'severe_neglect';

export interface SubjectDistribution {
  subject: string;
  actualMinutes: number;
  actualPercentage: number;
  targetPercentage: number;
  deficitPercentage: number; // positive = deficit (neglected), negative = surplus (over-allocated)
  recommendedDailyAdjustmentMins: number; // PID output clamped to [-60, +90]
  pActual: number; // 0..1
  pTarget: number; // 0..1
  error: number; // pTarget - pActual
  status: 'neglected' | 'balanced' | 'surplus';
  badgeColor: string;
  color: string;
}

export interface SubjectEquilibriumReport {
  equilibriumScore: number; // 0 - 100% Normalized Shannon Entropy
  status: EquilibriumStatus;
  statusLabel: string;
  statusBadgeColor: string;
  statusBorderColor: string;
  statusBgColor: string;
  totalMinutes7Days: number;
  totalHours7Days: number;
  activeSubjectCount: number;
  subjectDistributions: SubjectDistribution[];
  neglectedSubjects: SubjectDistribution[];
  overAllocatedSubjects: SubjectDistribution[];
  actionablePrescription: string;
  detailedPrescriptions: string[];
  shannonEntropyRaw: number;
  maxPossibleEntropy: number;
  dailyAdjustments: Record<string, number>;
}

export const DEFAULT_TARGET_WEIGHTS: Record<string, number> = {
  Physics: 0.35,
  Mathematics: 0.35,
  Chemistry: 0.30
};

export const STORAGE_KEY_PID_WEIGHTS = 'savantix_pid_weights_v1';

export const PID_GAINS = {
  Kp: 120, // Proportional gain in minutes
  Ki: 30,  // Integral gain in minutes
  Kd: 20,  // Derivative gain in minutes
  minClamp: -60, // Min daily reduction: -60 mins
  maxClamp: 90   // Max daily addition: +90 mins
};

export const SUBJECT_COLOR_MAP: Record<string, { color: string; badgeColor: string }> = {
  Physics: { color: '#6366f1', badgeColor: 'text-indigo-400 bg-indigo-950/60 border-indigo-500/30' },
  Mathematics: { color: '#3b82f6', badgeColor: 'text-blue-400 bg-blue-950/60 border-blue-500/30' },
  Chemistry: { color: '#10b981', badgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30' },
  Biology: { color: '#ec4899', badgeColor: 'text-pink-400 bg-pink-950/60 border-pink-500/30' },
  'Computer Science': { color: '#06b6d4', badgeColor: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/30' },
  General: { color: '#a855f7', badgeColor: 'text-purple-400 bg-purple-950/60 border-purple-500/30' }
};

const FALLBACK_PALETTE = [
  '#f59e0b', '#8b5cf6', '#14b8a6', '#f43f5e', '#84cc16', '#eab308'
];

/**
 * Subject keyword dictionary for intelligent fuzzy subject matching
 */
const SUBJECT_KEYWORDS: Record<string, string[]> = {
  Physics: ['physics', 'phy', 'mechanics', 'electrostatics', 'electromagnetism', 'thermodynamics', 'optics', 'kinematics', 'rotation', 'capacitance', 'gravitation', 'waves', 'modern physics', 'nsep', 'ipho'],
  Mathematics: ['math', 'mathematics', 'maths', 'calculus', 'integration', 'derivative', 'algebra', 'matrices', 'determinants', 'vectors', '3d geometry', 'trigonometry', 'probability', 'coordinate', 'complex numbers'],
  Chemistry: ['chemistry', 'chem', 'organic', 'inorganic', 'physical chem', 'physical chemistry', 'equilibrium', 'electrochemistry', 'bonding', 'aldehydes', 'amines', 'p-block', 'coordination', 'kinetics'],
  Biology: ['biology', 'bio', 'genetics', 'botany', 'zoology', 'biotech', 'ecology', 'physiology', 'cell biology', 'neet'],
  'Computer Science': ['cs', 'coding', 'algorithms', 'dsa', 'programming', 'python', 'cpp', 'data structures', 'web dev', 'software']
};

/**
 * Normalize an arbitrary subject string to match active target subject keys
 */
export function normalizeSubjectName(rawSubject: string, activeSubjects: string[]): string {
  if (!rawSubject || typeof rawSubject !== 'string') return activeSubjects[0] || 'General';
  const clean = rawSubject.trim();
  const lower = clean.toLowerCase();

  // 1. Direct exact match in activeSubjects (case-insensitive)
  const exactMatch = activeSubjects.find(s => s.toLowerCase() === lower);
  if (exactMatch) return exactMatch;

  // 2. Keyword dictionary lookup
  for (const activeSub of activeSubjects) {
    const keywords = SUBJECT_KEYWORDS[activeSub];
    if (keywords && keywords.some(kw => new RegExp(`\\b${kw}\\b`, 'i').test(lower))) {
      return activeSub;
    }
  }

  // 3. Partial substring match in active subjects
  const partialMatch = activeSubjects.find(s => lower.includes(s.toLowerCase()) || s.toLowerCase().includes(lower));
  if (partialMatch) return partialMatch;

  // 4. Return as-is or fallback
  return clean || activeSubjects[0] || 'General';
}

/**
 * Normalize target weights so they sum to 1.0 (100%)
 */
export function normalizeWeights(weights: Record<string, number>): Record<string, number> {
  const keys = Object.keys(weights);
  if (keys.length === 0) return { ...DEFAULT_TARGET_WEIGHTS };

  const total = Object.values(weights).reduce((sum, v) => sum + Math.max(0, Number(v) || 0), 0);
  if (total <= 0) {
    const uniform = 1 / keys.length;
    const res: Record<string, number> = {};
    keys.forEach(k => res[k] = uniform);
    return res;
  }

  const normalized: Record<string, number> = {};
  keys.forEach(k => {
    normalized[k] = Number(((Math.max(0, Number(weights[k]) || 0)) / total).toFixed(4));
  });

  return normalized;
}

/**
 * Load target weights from localStorage with fallback to defaults
 */
export function loadTargetWeights(): Record<string, number> {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem(STORAGE_KEY_PID_WEIGHTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          return normalizeWeights(parsed);
        }
      }
    }
  } catch (err) {
    console.warn('[PID Equilibrium] Failed to load saved target weights from localStorage:', err);
  }
  return { ...DEFAULT_TARGET_WEIGHTS };
}

/**
 * Save target weights to localStorage
 */
export function saveTargetWeights(weights: Record<string, number>): Record<string, number> {
  const normalized = normalizeWeights(weights);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY_PID_WEIGHTS, JSON.stringify(normalized));
    }
  } catch (err) {
    console.warn('[PID Equilibrium] Failed to save target weights to localStorage:', err);
  }
  return normalized;
}

/**
 * Reset target weights to default JEE / Standard proportions
 */
export function resetTargetWeights(): Record<string, number> {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY_PID_WEIGHTS, JSON.stringify(DEFAULT_TARGET_WEIGHTS));
    }
  } catch {}
  return { ...DEFAULT_TARGET_WEIGHTS };
}

/**
 * Calculate Normalized Shannon Entropy & Discrete PID Corrective Study Prescription.
 * 
 * @param logs7Days Array of study logs from the past 7 days (or general log array)
 * @param targetWeights Target weight fractions per subject (e.g. { Physics: 0.35, Math: 0.35, Chemistry: 0.30 })
 */
export function calculateSubjectEquilibrium(
  logs7Days: any[] = [],
  targetWeights: Record<string, number> = loadTargetWeights()
): SubjectEquilibriumReport {
  const normalizedTargets = normalizeWeights(targetWeights);
  const activeSubjects = Object.keys(normalizedTargets);
  const N = Math.max(1, activeSubjects.length);

  // Time aggregation maps
  const timeMap: Record<string, number> = {};
  const dailyTimeMap: Record<string, Record<string, number>> = {}; // date -> subject -> minutes
  activeSubjects.forEach(s => {
    timeMap[s] = 0;
  });

  const validLogs = Array.isArray(logs7Days) ? logs7Days.filter(Boolean) : [];

  validLogs.forEach(log => {
    const rawSub = String(log.subject || 'General');
    const duration = Math.max(0, Number(log.durationMinutes)) || 0;
    const dateKey = log.date ? String(log.date).substring(0, 10) : 'today';

    // Handle split subjects (e.g. "Physics and Mathematics")
    const subTokens = rawSub.split(/,| and | & /i).map(s => s.trim()).filter(Boolean);
    const tokens = subTokens.length > 0 ? subTokens : [rawSub];
    const durationPerToken = duration / tokens.length;

    tokens.forEach(tok => {
      const normalizedSub = normalizeSubjectName(tok, activeSubjects);
      if (timeMap[normalizedSub] !== undefined) {
        timeMap[normalizedSub] += durationPerToken;
      } else {
        // If subject is active or unknown, attribute to closest
        timeMap[activeSubjects[0]] += durationPerToken;
      }

      if (!dailyTimeMap[dateKey]) {
        dailyTimeMap[dateKey] = {};
        activeSubjects.forEach(s => dailyTimeMap[dateKey][s] = 0);
      }
      if (dailyTimeMap[dateKey][normalizedSub] !== undefined) {
        dailyTimeMap[dateKey][normalizedSub] += durationPerToken;
      }
    });
  });

  const totalMinutes = Object.values(timeMap).reduce((a, b) => a + b, 0);
  const totalHours = Number((totalMinutes / 60).toFixed(1));

  // If no logs recorded in past 7 days
  if (totalMinutes <= 0) {
    const emptyDists: SubjectDistribution[] = activeSubjects.map((s, idx) => {
      const pTarget = normalizedTargets[s];
      const targetPct = Math.round(pTarget * 100);
      const colorMeta = SUBJECT_COLOR_MAP[s] || {
        color: FALLBACK_PALETTE[idx % FALLBACK_PALETTE.length],
        badgeColor: 'text-zinc-300 bg-zinc-800 border-zinc-700'
      };

      return {
        subject: s,
        actualMinutes: 0,
        actualPercentage: 0,
        targetPercentage: targetPct,
        deficitPercentage: targetPct,
        recommendedDailyAdjustmentMins: 0,
        pActual: 0,
        pTarget,
        error: pTarget,
        status: 'balanced',
        badgeColor: colorMeta.badgeColor,
        color: colorMeta.color
      };
    });

    const defaultAdjustments: Record<string, number> = {};
    activeSubjects.forEach(s => defaultAdjustments[s] = 0);

    return {
      equilibriumScore: 100,
      status: 'harmonious',
      statusLabel: 'Harmonious Parity (Awaiting Logs)',
      statusBadgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30',
      statusBorderColor: 'border-emerald-500/30',
      statusBgColor: 'bg-emerald-500/10',
      totalMinutes7Days: 0,
      totalHours7Days: 0,
      activeSubjectCount: N,
      subjectDistributions: emptyDists,
      neglectedSubjects: [],
      overAllocatedSubjects: [],
      actionablePrescription: 'No study logs found in the past 7 days. Start logging sessions to activate dynamic PID equilibrium tracking.',
      detailedPrescriptions: [
        'Log study sessions across Physics, Mathematics, and Chemistry to track subject distribution.',
        `Target allocation set to: ${activeSubjects.map(s => `${s} (${Math.round(normalizedTargets[s] * 100)}%)`).join(', ')}.`
      ],
      shannonEntropyRaw: Math.log(N),
      maxPossibleEntropy: Math.log(N),
      dailyAdjustments: defaultAdjustments
    };
  }

  // 1. Normalized Shannon Entropy Calculation
  // H(P) = - sum(p_i * ln(p_i))
  // H_max = ln(N)
  // E = (H(P) / H_max) * 100%
  let rawEntropy = 0;
  activeSubjects.forEach(s => {
    const p = timeMap[s] / totalMinutes;
    if (p > 0) {
      rawEntropy += -p * Math.log(p);
    }
  });

  const maxPossibleEntropy = N > 1 ? Math.log(N) : 1;
  const normalizedEntropy = N > 1
    ? Math.min(100, Math.max(0, Math.round((rawEntropy / maxPossibleEntropy) * 100)))
    : 100;

  // 2. Discrete PID Allocator Computation
  // Delta M_i = clamp(Kp * e_i + Ki * integral_i + Kd * derivative_i, -60, +90)
  // e_i = p_i^* - p_i
  const dailyDates = Object.keys(dailyTimeMap).sort();
  const hasDailyData = dailyDates.length >= 2;

  const distributions: SubjectDistribution[] = activeSubjects.map((s, idx) => {
    const actualMins = Math.round(timeMap[s]);
    const pActual = timeMap[s] / totalMinutes;
    const pTarget = normalizedTargets[s];
    const error = pTarget - pActual; // positive = deficit, negative = surplus

    // Proportional Term
    const P = PID_GAINS.Kp * error;

    // Integral Term over rolling days
    let integralTerm = error;
    if (hasDailyData) {
      let sumDailyErrors = 0;
      dailyDates.forEach(d => {
        const dSubMins = dailyTimeMap[d][s] || 0;
        const dTotal = Object.values(dailyTimeMap[d]).reduce((a, b) => a + b, 0);
        const dPActual = dTotal > 0 ? dSubMins / dTotal : pTarget;
        sumDailyErrors += (pTarget - dPActual);
      });
      integralTerm = sumDailyErrors / dailyDates.length;
    }
    const I = PID_GAINS.Ki * integralTerm;

    // Derivative Term (Change in error from previous day)
    let derivativeTerm = 0;
    if (hasDailyData && dailyDates.length >= 2) {
      const todayDate = dailyDates[dailyDates.length - 1];
      const prevDate = dailyDates[dailyDates.length - 2];
      
      const dTodaySub = dailyTimeMap[todayDate][s] || 0;
      const dTodayTot = Object.values(dailyTimeMap[todayDate]).reduce((a, b) => a + b, 0);
      const eToday = pTarget - (dTodayTot > 0 ? dTodaySub / dTodayTot : pTarget);

      const dPrevSub = dailyTimeMap[prevDate][s] || 0;
      const dPrevTot = Object.values(dailyTimeMap[prevDate]).reduce((a, b) => a + b, 0);
      const ePrev = pTarget - (dPrevTot > 0 ? dPrevSub / dPrevTot : pTarget);

      derivativeTerm = eToday - ePrev;
    }
    const D = PID_GAINS.Kd * derivativeTerm;

    // Unclamped PID output
    const rawPidOutput = P + I + D;

    // Clamped PID adjustment
    const clampedAdjustment = Math.max(
      PID_GAINS.minClamp,
      Math.min(PID_GAINS.maxClamp, Math.round(rawPidOutput))
    );

    const actualPct = Math.round(pActual * 100);
    const targetPct = Math.round(pTarget * 100);
    const deficitPct = targetPct - actualPct;

    let subStatus: 'neglected' | 'balanced' | 'surplus' = 'balanced';
    if (deficitPct >= 8) subStatus = 'neglected';
    else if (deficitPct <= -8) subStatus = 'surplus';

    const colorMeta = SUBJECT_COLOR_MAP[s] || {
      color: FALLBACK_PALETTE[idx % FALLBACK_PALETTE.length],
      badgeColor: 'text-zinc-300 bg-zinc-800 border-zinc-700'
    };

    return {
      subject: s,
      actualMinutes: actualMins,
      actualPercentage: actualPct,
      targetPercentage: targetPct,
      deficitPercentage: deficitPct,
      recommendedDailyAdjustmentMins: clampedAdjustment,
      pActual,
      pTarget,
      error,
      status: subStatus,
      badgeColor: colorMeta.badgeColor,
      color: colorMeta.color
    };
  });

  // 3. Status Classification based on Shannon Entropy
  let status: EquilibriumStatus = 'harmonious';
  let statusLabel = 'Harmonious Equilibrium';
  let statusBadgeColor = 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30';
  let statusBorderColor = 'border-emerald-500/30';
  let statusBgColor = 'bg-emerald-500/10';

  if (normalizedEntropy < 75) {
    status = 'severe_neglect';
    statusLabel = 'Severe Neglect Alert';
    statusBadgeColor = 'text-rose-400 bg-rose-950/60 border-rose-500/30';
    statusBorderColor = 'border-rose-500/30';
    statusBgColor = 'bg-rose-500/10';
  } else if (normalizedEntropy < 90) {
    status = 'mild_skew';
    statusLabel = 'Mild Subject Skew';
    statusBadgeColor = 'text-amber-400 bg-amber-950/60 border-amber-500/30';
    statusBorderColor = 'border-amber-500/30';
    statusBgColor = 'bg-amber-500/10';
  }

  // 4. Neglected vs Surplus Subject Lists
  const neglectedSubjects = distributions
    .filter(d => d.deficitPercentage > 5 || d.recommendedDailyAdjustmentMins > 0)
    .sort((a, b) => b.deficitPercentage - a.deficitPercentage);

  const overAllocatedSubjects = distributions
    .filter(d => d.deficitPercentage < -5 || d.recommendedDailyAdjustmentMins < 0)
    .sort((a, b) => a.deficitPercentage - b.deficitPercentage);

  // 5. Prescriptions Generation
  const dailyAdjustments: Record<string, number> = {};
  distributions.forEach(d => {
    dailyAdjustments[d.subject] = d.recommendedDailyAdjustmentMins;
  });

  const detailedPrescriptions: string[] = [];
  let actionablePrescription = '🌟 Study time is harmoniously balanced across all disciplines. Keep maintaining this optimal distribution!';

  if (neglectedSubjects.length > 0) {
    const primaryNeg = neglectedSubjects[0];
    const primaryOver = overAllocatedSubjects[0];

    const negAdjStr = `+${primaryNeg.recommendedDailyAdjustmentMins} mins ${primaryNeg.subject}`;
    const overAdjStr = primaryOver && primaryOver.recommendedDailyAdjustmentMins < 0
      ? `, reduce ${primaryOver.subject} by ${Math.abs(primaryOver.recommendedDailyAdjustmentMins)} mins`
      : '';

    actionablePrescription = `⚠️ ${primaryNeg.subject} is in a ${primaryNeg.deficitPercentage}% deficit (${primaryNeg.actualPercentage}% vs ${primaryNeg.targetPercentage}% target). Prescribed tomorrow: ${negAdjStr}${overAdjStr}.`;

    neglectedSubjects.forEach(neg => {
      detailedPrescriptions.push(
        `Deficit in ${neg.subject}: Currently at ${neg.actualPercentage}% (${neg.actualMinutes}m / ${totalHours}h) vs target ${neg.targetPercentage}%. Recommended: +${neg.recommendedDailyAdjustmentMins} mins.`
      );
    });

    overAllocatedSubjects.forEach(over => {
      detailedPrescriptions.push(
        `Surplus in ${over.subject}: Currently at ${over.actualPercentage}% (${over.actualMinutes}m / ${totalHours}h) vs target ${over.targetPercentage}%. Recommended reduction: ${Math.abs(over.recommendedDailyAdjustmentMins)} mins.`
      );
    });
  } else {
    detailedPrescriptions.push('All subjects are within the target parity tolerance (±5%).');
    detailedPrescriptions.push(`Current Shannon Entropy: ${normalizedEntropy}% / 100% (${statusLabel}).`);
  }

  return {
    equilibriumScore: normalizedEntropy,
    status,
    statusLabel,
    statusBadgeColor,
    statusBorderColor,
    statusBgColor,
    totalMinutes7Days: totalMinutes,
    totalHours7Days: totalHours,
    activeSubjectCount: N,
    subjectDistributions: distributions,
    neglectedSubjects,
    overAllocatedSubjects,
    actionablePrescription,
    detailedPrescriptions,
    shannonEntropyRaw: rawEntropy,
    maxPossibleEntropy,
    dailyAdjustments
  };
}