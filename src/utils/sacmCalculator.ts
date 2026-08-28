/**
 * Savantix (Aegis) — Speed vs. Accuracy Calibration Matrix (SACM) Engine
 * 
 * Mathematical calibration of Problem Solving Velocity (Q/hr) vs Accuracy (%)
 * across 4 cognitive quadrants for competitive STEM preparation (JEE Advanced, IPhO, Olympiads).
 */

export type SACMQuadrantId = 'Q1_Mastery' | 'Q2_Overthinking' | 'Q3_Rushing' | 'Q4_Struggling';

export interface SACMBenchmarks {
  velocityThreshold?: number; // default: 15 Q/hr
  accuracyThreshold?: number; // default: 80%
  subjectBenchmarks?: Record<string, { velocityThreshold: number; accuracyThreshold: number }>;
}

export interface SACMDataPoint {
  id: string;
  date: string;
  subject: string;
  topic: string;
  subtopic?: string;
  durationMinutes: number;
  problemsSolved: number;
  velocityQpH: number;          // Questions per hour (X-axis)
  timePerQuestionMin: number;   // Minutes per question
  accuracyPercent: number;      // Accuracy 0-100% (Y-axis)
  quadrant: SACMQuadrantId;
  quadrantLabel: string;
  color: string;
  badgeColor: string;
  diagnosticTag: string;
  efficiencyScore?: number;
  focusScore?: number;
  mistakes?: string[];
  rawText?: string;
}

export interface SACMQuadrantStats {
  id: SACMQuadrantId;
  name: string;
  shortName: string;
  psychologicalState: string;
  count: number;
  percentage: number;
  totalProblems: number;
  totalMinutes: number;
  avgVelocity: number;
  avgAccuracy: number;
  avgTimePerQuestion: number;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeColor: string;
  diagnostic: string;
  actionablePrescription: string;
  suggestedTechnique: string;
  idealFor: string;
}

export interface SACMSubjectCalibration {
  subject: string;
  sessionCount: number;
  totalProblems: number;
  totalMinutes: number;
  totalHours: number;
  avgVelocity: number;
  avgAccuracy: number;
  dominantQuadrant: SACMQuadrantId;
  quadrantBreakdown: Record<SACMQuadrantId, number>;
  calibrationStatus: 'mastery' | 'overthinking' | 'rushing' | 'struggling' | 'insufficient_data';
  recommendation: string;
}

export interface SACMReport {
  dataPoints: SACMDataPoint[];
  totalSessionsEvaluated: number;
  overallAvgVelocity: number;
  overallAvgAccuracy: number;
  overallAvgTimePerQuestion: number;
  totalProblemsSolved: number;
  totalStudyMinutes: number;
  quadrants: Record<SACMQuadrantId, SACMQuadrantStats>;
  quadrantList: SACMQuadrantStats[];
  dominantQuadrant: SACMQuadrantId | null;
  subjectCalibrations: SACMSubjectCalibration[];
  calibratedVelocityThreshold: number;
  calibratedAccuracyThreshold: number;
  executiveSummary: string;
  topPrescriptions: string[];
}

export const DEFAULT_VELOCITY_THRESHOLD = 15; // 15 Questions / Hour (4 mins / question)
export const DEFAULT_ACCURACY_THRESHOLD = 80; // 80% precision

export const QUADRANT_META: Record<SACMQuadrantId, {
  name: string;
  shortName: string;
  psychologicalState: string;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeColor: string;
  diagnostic: string;
  actionablePrescription: string;
  suggestedTechnique: string;
  idealFor: string;
}> = {
  Q1_Mastery: {
    name: 'Flow / Mastery Zone',
    shortName: 'Mastery Flow',
    psychologicalState: 'High Precision & High Velocity',
    color: '#10b981', // Emerald
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    badgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30',
    diagnostic: 'Optimal Fluidity: You are executing rapid problem solving with high accuracy (≥80% precision at ≥15 Q/hr). Core patterns and heuristics are internalized.',
    actionablePrescription: 'Escalate problem difficulty to Tier 3 / Olympiad / Irodov / Advanced multi-concept problems. Introduce high-pressure timed mock sections.',
    suggestedTechnique: 'Interleaved Hard Problem Sets & Olympiad Sprints',
    idealFor: 'JEE Adv Multi-Correct / IPhO Part 2'
  },
  Q2_Overthinking: {
    name: 'Deliberate / Overthinking Zone',
    shortName: 'Overthinking',
    psychologicalState: 'High Precision, Low Velocity',
    color: '#3b82f6', // Blue
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    badgeColor: 'text-blue-400 bg-blue-950/60 border-blue-500/30',
    diagnostic: 'Precision Bottleneck: High accuracy (≥80%) but slow pace (<15 Q/hr). You understand concepts deeply but may be over-verifying routine steps or missing algebraic shortcuts.',
    actionablePrescription: 'Practice timed speed-drills (e.g. 15 questions in 30 mins). Utilize dimensional analysis, approximation heuristics, and option elimination tricks.',
    suggestedTechnique: 'Timed Speed-Drills & Option Elimination Heuristics',
    idealFor: 'Speed Building on Known Chapters'
  },
  Q3_Rushing: {
    name: 'Rushing / Guessing Zone',
    shortName: 'Rushing / Impulsive',
    psychologicalState: 'Low Precision, High Velocity',
    color: '#f59e0b', // Amber
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    badgeColor: 'text-amber-400 bg-amber-950/60 border-amber-500/30',
    diagnostic: 'Impulsive Execution: High speed (≥15 Q/hr) but compromised accuracy (<80%). Prone to calculation blunders, sign errors, or skimming question constraints too fast.',
    actionablePrescription: 'Enforce a mandatory 30-second problem decomposition pause before writing formulas. Underline boundary conditions and double-check final unit dimensions.',
    suggestedTechnique: '30-Second Question Decomposition & Unit Checkpoints',
    idealFor: 'Negative Marking Elimination'
  },
  Q4_Struggling: {
    name: 'Struggling / Fatigued Zone',
    shortName: 'Struggling / Fatigued',
    psychologicalState: 'Low Precision, Low Velocity',
    color: '#ef4444', // Rose / Red
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    badgeColor: 'text-rose-400 bg-rose-950/60 border-rose-500/30',
    diagnostic: 'Cognitive Overload / Prerequisite Gap: Both speed and precision are depressed. Indicates foundational gaps in theory, uncalibrated question difficulty, or cognitive fatigue.',
    actionablePrescription: 'Downshift to foundational theory review and guided worked examples. Break derivations down step-by-step and enforce an active recovery break before retrying.',
    suggestedTechnique: 'First-Principles Theory Rebuild & Socratic Step-by-Step Breakdown',
    idealFor: 'Prerequisite Repair & Recovery'
  }
};

/**
 * Classify a session into one of the 4 SACM quadrants based on velocity and accuracy thresholds.
 */
export function classifyQuadrant(
  velocityQpH: number,
  accuracyPercent: number,
  vThresh: number = DEFAULT_VELOCITY_THRESHOLD,
  accThresh: number = DEFAULT_ACCURACY_THRESHOLD
): SACMQuadrantId {
  if (velocityQpH >= vThresh && accuracyPercent >= accThresh) {
    return 'Q1_Mastery';
  } else if (velocityQpH < vThresh && accuracyPercent >= accThresh) {
    return 'Q2_Overthinking';
  } else if (velocityQpH >= vThresh && accuracyPercent < accThresh) {
    return 'Q3_Rushing';
  } else {
    return 'Q4_Struggling';
  }
}

/**
 * Extract numerical accuracy (0-100%) from session data.
 * Prioritizes explicit `accuracyPercent`, then derives from `efficiencyScore * 10`,
 * or falls back to sensible defaults.
 */
export function extractAccuracy(session: any): number {
  if (session == null) return 80;

  if (typeof session.accuracyPercent === 'number' && !isNaN(session.accuracyPercent)) {
    return Math.min(100, Math.max(0, Math.round(session.accuracyPercent)));
  }

  if (typeof session.accuracy === 'number' && !isNaN(session.accuracy)) {
    return Math.min(100, Math.max(0, Math.round(session.accuracy)));
  }

  if (typeof session.efficiencyScore === 'number' && !isNaN(session.efficiencyScore) && session.efficiencyScore > 0) {
    return Math.min(100, Math.max(0, Math.round(session.efficiencyScore * 10)));
  }

  if (typeof session.focusScore === 'number' && !isNaN(session.focusScore) && session.focusScore > 0) {
    return Math.min(100, Math.max(0, Math.round(session.focusScore * 9)));
  }

  return 80; // Standard calibrated baseline
}

/**
 * Main calibration calculation function:
 * Transforms raw study sessions into a complete SACM Speed vs. Accuracy Calibration Report.
 */
export function calculateSACMData(
  sessions: any[] = [],
  benchmarks?: SACMBenchmarks
): SACMReport {
  const vThresh = benchmarks?.velocityThreshold ?? DEFAULT_VELOCITY_THRESHOLD;
  const accThresh = benchmarks?.accuracyThreshold ?? DEFAULT_ACCURACY_THRESHOLD;

  if (!Array.isArray(sessions) || sessions.length === 0) {
    const emptyQuadrants: Record<SACMQuadrantId, SACMQuadrantStats> = {
      Q1_Mastery: createEmptyQuadrantStats('Q1_Mastery'),
      Q2_Overthinking: createEmptyQuadrantStats('Q2_Overthinking'),
      Q3_Rushing: createEmptyQuadrantStats('Q3_Rushing'),
      Q4_Struggling: createEmptyQuadrantStats('Q4_Struggling')
    };

    return {
      dataPoints: [],
      totalSessionsEvaluated: 0,
      overallAvgVelocity: 0,
      overallAvgAccuracy: 0,
      overallAvgTimePerQuestion: 0,
      totalProblemsSolved: 0,
      totalStudyMinutes: 0,
      quadrants: emptyQuadrants,
      quadrantList: Object.values(emptyQuadrants),
      dominantQuadrant: null,
      subjectCalibrations: [],
      calibratedVelocityThreshold: vThresh,
      calibratedAccuracyThreshold: accThresh,
      executiveSummary: 'No study session data available for calibration yet. Complete or micro-log study sessions to generate your SACM matrix.',
      topPrescriptions: ['Begin logging study sessions with duration and problem counts to calibrate your speed-accuracy sweet spot.']
    };
  }

  // 1. Map Sessions to SACM Data Points
  const dataPoints: SACMDataPoint[] = [];
  const subjectMap: Record<string, {
    sessions: SACMDataPoint[];
    totalMinutes: number;
    totalProblems: number;
    quadrantCounts: Record<SACMQuadrantId, number>;
  }> = {};

  const quadrantBuckets: Record<SACMQuadrantId, SACMDataPoint[]> = {
    Q1_Mastery: [],
    Q2_Overthinking: [],
    Q3_Rushing: [],
    Q4_Struggling: []
  };

  let totalMinutes = 0;
  let totalProblems = 0;
  let sumVelocity = 0;
  let sumAccuracy = 0;
  let velocityCount = 0;

  sessions.forEach((s, idx) => {
    if (!s) return;

    const durationMinutes = Math.max(1, Math.round(Number(s.durationMinutes) || 0));
    const problemsSolved = Math.max(0, Math.round(Number(s.problemsSolved) || 0));
    const accuracyPercent = extractAccuracy(s);
    const subject = String(s.subject || 'General').trim() || 'General';
    const topic = String(s.topic || 'Study Session').trim() || 'Study Session';
    const date = s.date || new Date().toISOString().substring(0, 10);
    const id = String(s.id || `session_${idx}_${Date.now()}`);

    // Compute Velocity (Questions per Hour)
    // V = (problemsSolved * 60) / durationMinutes
    const velocityQpH = durationMinutes > 0
      ? Number(((problemsSolved * 60) / durationMinutes).toFixed(1))
      : 0;

    // Time per question (Minutes per Question)
    const timePerQuestionMin = problemsSolved > 0
      ? Number((durationMinutes / problemsSolved).toFixed(1))
      : durationMinutes;

    // Subject-specific threshold check if provided
    const subjectVThresh = benchmarks?.subjectBenchmarks?.[subject]?.velocityThreshold ?? vThresh;
    const subjectAccThresh = benchmarks?.subjectBenchmarks?.[subject]?.accuracyThreshold ?? accThresh;

    const quadrant = classifyQuadrant(velocityQpH, accuracyPercent, subjectVThresh, subjectAccThresh);
    const meta = QUADRANT_META[quadrant];

    const dataPoint: SACMDataPoint = {
      id,
      date,
      subject,
      topic,
      subtopic: s.subtopic || '',
      durationMinutes,
      problemsSolved,
      velocityQpH,
      timePerQuestionMin,
      accuracyPercent,
      quadrant,
      quadrantLabel: meta.name,
      color: meta.color,
      badgeColor: meta.badgeColor,
      diagnosticTag: meta.shortName,
      efficiencyScore: s.efficiencyScore,
      focusScore: s.focusScore,
      mistakes: Array.isArray(s.mistakes) ? s.mistakes : [],
      rawText: s.rawText || ''
    };

    dataPoints.push(dataPoint);
    quadrantBuckets[quadrant].push(dataPoint);

    totalMinutes += durationMinutes;
    totalProblems += problemsSolved;
    sumVelocity += velocityQpH;
    sumAccuracy += accuracyPercent;
    velocityCount++;

    // Subject Tracking
    if (!subjectMap[subject]) {
      subjectMap[subject] = {
        sessions: [],
        totalMinutes: 0,
        totalProblems: 0,
        quadrantCounts: {
          Q1_Mastery: 0,
          Q2_Overthinking: 0,
          Q3_Rushing: 0,
          Q4_Struggling: 0
        }
      };
    }
    subjectMap[subject].sessions.push(dataPoint);
    subjectMap[subject].totalMinutes += durationMinutes;
    subjectMap[subject].totalProblems += problemsSolved;
    subjectMap[subject].quadrantCounts[quadrant]++;
  });

  const totalSessions = dataPoints.length;
  const overallAvgVelocity = velocityCount > 0 ? Number((sumVelocity / velocityCount).toFixed(1)) : 0;
  const overallAvgAccuracy = velocityCount > 0 ? Math.round(sumAccuracy / velocityCount) : 0;
  const overallAvgTimePerQuestion = totalProblems > 0 ? Number((totalMinutes / totalProblems).toFixed(1)) : 0;

  // 2. Build Quadrant Statistics
  const quadrants: Record<SACMQuadrantId, SACMQuadrantStats> = {
    Q1_Mastery: buildQuadrantStats('Q1_Mastery', quadrantBuckets.Q1_Mastery, totalSessions),
    Q2_Overthinking: buildQuadrantStats('Q2_Overthinking', quadrantBuckets.Q2_Overthinking, totalSessions),
    Q3_Rushing: buildQuadrantStats('Q3_Rushing', quadrantBuckets.Q3_Rushing, totalSessions),
    Q4_Struggling: buildQuadrantStats('Q4_Struggling', quadrantBuckets.Q4_Struggling, totalSessions)
  };

  const quadrantList = [
    quadrants.Q1_Mastery,
    quadrants.Q2_Overthinking,
    quadrants.Q3_Rushing,
    quadrants.Q4_Struggling
  ];

  // 3. Determine Dominant Quadrant
  let dominantQuadrant: SACMQuadrantId | null = null;
  let maxCount = -1;
  for (const q of quadrantList) {
    if (q.count > maxCount && q.count > 0) {
      maxCount = q.count;
      dominantQuadrant = q.id;
    }
  }

  // 4. Subject Calibrations
  const subjectCalibrations: SACMSubjectCalibration[] = Object.entries(subjectMap).map(([subject, data]) => {
    const sCount = data.sessions.length;
    const sMinutes = data.totalMinutes;
    const sHours = Number((sMinutes / 60).toFixed(1));
    const sProblems = data.totalProblems;

    const sAvgVelocity = sMinutes > 0 ? Number(((sProblems * 60) / sMinutes).toFixed(1)) : 0;
    const sAvgAccuracy = sCount > 0
      ? Math.round(data.sessions.reduce((sum, item) => sum + item.accuracyPercent, 0) / sCount)
      : 0;

    let subDominant: SACMQuadrantId = 'Q1_Mastery';
    let subMax = -1;
    (Object.entries(data.quadrantCounts) as [SACMQuadrantId, number][]).forEach(([qId, count]) => {
      if (count > subMax) {
        subMax = count;
        subDominant = qId;
      }
    });

    let calibrationStatus: SACMSubjectCalibration['calibrationStatus'] = 'insufficient_data';
    let recommendation = '';

    if (sCount >= 1) {
      if (subDominant === 'Q1_Mastery') {
        calibrationStatus = 'mastery';
        recommendation = `Excellent flow in ${subject}. Maintain velocity and advance to Olympiad/JEE-Advanced level.`;
      } else if (subDominant === 'Q2_Overthinking') {
        calibrationStatus = 'overthinking';
        recommendation = `High precision in ${subject}, but speed is below target (${sAvgVelocity} Q/hr vs ${vThresh} Q/hr). Practice timed sets.`;
      } else if (subDominant === 'Q3_Rushing') {
        calibrationStatus = 'rushing';
        recommendation = `Fast pacing in ${subject} (${sAvgVelocity} Q/hr), but accuracy is ${sAvgAccuracy}%. Slow down to avoid negative marking.`;
      } else {
        calibrationStatus = 'struggling';
        recommendation = `Both speed and accuracy in ${subject} need attention. Revisit core theory and worked derivations.`;
      }
    }

    return {
      subject,
      sessionCount: sCount,
      totalProblems: sProblems,
      totalMinutes: sMinutes,
      totalHours: sHours,
      avgVelocity: sAvgVelocity,
      avgAccuracy: sAvgAccuracy,
      dominantQuadrant: subDominant,
      quadrantBreakdown: data.quadrantCounts,
      calibrationStatus,
      recommendation
    };
  }).sort((a, b) => b.totalMinutes - a.totalMinutes);

  // 5. Executive Summary & Top Prescriptions
  const { executiveSummary, topPrescriptions } = generateExecutiveSummary(
    dominantQuadrant,
    quadrants,
    overallAvgVelocity,
    overallAvgAccuracy,
    vThresh,
    accThresh,
    subjectCalibrations
  );

  return {
    dataPoints,
    totalSessionsEvaluated: totalSessions,
    overallAvgVelocity,
    overallAvgAccuracy,
    overallAvgTimePerQuestion,
    totalProblemsSolved: totalProblems,
    totalStudyMinutes: totalMinutes,
    quadrants,
    quadrantList,
    dominantQuadrant,
    subjectCalibrations,
    calibratedVelocityThreshold: vThresh,
    calibratedAccuracyThreshold: accThresh,
    executiveSummary,
    topPrescriptions
  };
}

/**
 * Helper to build empty quadrant stats
 */
function createEmptyQuadrantStats(quadrantId: SACMQuadrantId): SACMQuadrantStats {
  const meta = QUADRANT_META[quadrantId];
  return {
    id: quadrantId,
    name: meta.name,
    shortName: meta.shortName,
    psychologicalState: meta.psychologicalState,
    count: 0,
    percentage: 0,
    totalProblems: 0,
    totalMinutes: 0,
    avgVelocity: 0,
    avgAccuracy: 0,
    avgTimePerQuestion: 0,
    color: meta.color,
    bgColor: meta.bgColor,
    borderColor: meta.borderColor,
    badgeColor: meta.badgeColor,
    diagnostic: meta.diagnostic,
    actionablePrescription: meta.actionablePrescription,
    suggestedTechnique: meta.suggestedTechnique,
    idealFor: meta.idealFor
  };
}

/**
 * Helper to aggregate stats for a specific quadrant
 */
function buildQuadrantStats(
  quadrantId: SACMQuadrantId,
  points: SACMDataPoint[],
  totalSessions: number
): SACMQuadrantStats {
  const meta = QUADRANT_META[quadrantId];
  const count = points.length;
  const percentage = totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0;

  const totalProblems = points.reduce((sum, p) => sum + p.problemsSolved, 0);
  const totalMinutes = points.reduce((sum, p) => sum + p.durationMinutes, 0);

  const avgVelocity = count > 0
    ? Number((points.reduce((sum, p) => sum + p.velocityQpH, 0) / count).toFixed(1))
    : 0;

  const avgAccuracy = count > 0
    ? Math.round(points.reduce((sum, p) => sum + p.accuracyPercent, 0) / count)
    : 0;

  const avgTimePerQuestion = totalProblems > 0
    ? Number((totalMinutes / totalProblems).toFixed(1))
    : 0;

  return {
    id: quadrantId,
    name: meta.name,
    shortName: meta.shortName,
    psychologicalState: meta.psychologicalState,
    count,
    percentage,
    totalProblems,
    totalMinutes,
    avgVelocity,
    avgAccuracy,
    avgTimePerQuestion,
    color: meta.color,
    bgColor: meta.bgColor,
    borderColor: meta.borderColor,
    badgeColor: meta.badgeColor,
    diagnostic: meta.diagnostic,
    actionablePrescription: meta.actionablePrescription,
    suggestedTechnique: meta.suggestedTechnique,
    idealFor: meta.idealFor
  };
}

/**
 * Generate actionable STEM summary and prescriptions
 */
function generateExecutiveSummary(
  dominantQuadrant: SACMQuadrantId | null,
  quadrants: Record<SACMQuadrantId, SACMQuadrantStats>,
  overallAvgVelocity: number,
  overallAvgAccuracy: number,
  vThresh: number,
  accThresh: number,
  subjects: SACMSubjectCalibration[]
): { executiveSummary: string; topPrescriptions: string[] } {
  const topPrescriptions: string[] = [];

  if (!dominantQuadrant) {
    return {
      executiveSummary: 'Log additional study sessions to populate the Speed vs. Accuracy Calibration Matrix.',
      topPrescriptions: ['Log at least 3-5 study sessions across subjects to establish baseline calibration.']
    };
  }

  let executiveSummary = '';
  const q1Pct = quadrants.Q1_Mastery.percentage;
  const q2Pct = quadrants.Q2_Overthinking.percentage;
  const q3Pct = quadrants.Q3_Rushing.percentage;
  const q4Pct = quadrants.Q4_Struggling.percentage;

  if (dominantQuadrant === 'Q1_Mastery') {
    executiveSummary = `Mastery State Dominant (${q1Pct}% in Flow Zone). You maintain high velocity (${overallAvgVelocity} Q/hr) alongside sharp accuracy (${overallAvgAccuracy}%). Core cognitive representations are sound.`;
    topPrescriptions.push('Escalate difficulty to Tier 3 / Olympiad / Irodov / Advanced multi-concept problem sets.');
    topPrescriptions.push('Simulate full-length exam pressure with strict time limits to test endurance under cognitive stress.');
  } else if (dominantQuadrant === 'Q2_Overthinking') {
    executiveSummary = `Precision Bottleneck (${q2Pct}% in Overthinking Zone). High accuracy (${overallAvgAccuracy}%) is hindered by deliberate pacing (${overallAvgVelocity} Q/hr vs target ${vThresh} Q/hr).`;
    topPrescriptions.push('Execute 20-minute timed speed-sprints on familiar topics to build algebraic confidence.');
    topPrescriptions.push('Leverage dimensional analysis, symmetry arguments, and option elimination heuristics to bypass long computations.');
  } else if (dominantQuadrant === 'Q3_Rushing') {
    executiveSummary = `Impulsive Execution Risk (${q3Pct}% in Rushing Zone). Swift velocity (${overallAvgVelocity} Q/hr) is currently undermining precision (${overallAvgAccuracy}% vs target ${accThresh}%).`;
    topPrescriptions.push('Enforce a mandatory 30-second problem decomposition pause before writing any equations.');
    topPrescriptions.push('Underline edge cases, boundary conditions, and sign conventions in the question statement.');
  } else {
    executiveSummary = `Foundational Calibration Required (${q4Pct}% in Struggling/Fatigued Zone). Both velocity (${overallAvgVelocity} Q/hr) and accuracy (${overallAvgAccuracy}%) require recalibration.`;
    topPrescriptions.push('Downshift to foundational theory review and step-by-step worked derivations before timed problem solving.');
    topPrescriptions.push('Utilize Socratic breakdown techniques and prioritize active recovery breaks to avoid burnout.');
  }

  // Add subject-specific guidance if any subject has a noticeable bottleneck
  const bottleneckSubject = subjects.find(s => s.calibrationStatus === 'struggling' || s.calibrationStatus === 'rushing');
  if (bottleneckSubject) {
    topPrescriptions.push(`Focus attention on ${bottleneckSubject.subject}: ${bottleneckSubject.recommendation}`);
  }

  return { executiveSummary, topPrescriptions };
}
