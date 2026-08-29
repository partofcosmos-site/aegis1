/**
 * Savantix (Aegis) — Edge Cases & Extreme Values Stress Test
 * 
 * Deep testing of edge-case inputs, NaN/null/undefined handling, extreme bounds,
 * and unusual data types across all 5 engines.
 */

import {
  calculateDynamicBreak,
  getFlowStage,
  formatFlowTime,
  formatEarnedBreak,
  loadFlowmodoroConfig,
  saveFlowmodoroConfig
} from '../src/utils/flowmodoroEngine';

import {
  parseMicroLog
} from '../src/utils/microLogParser';

import {
  calculateSACMData,
  classifyQuadrant,
  extractAccuracy
} from '../src/utils/sacmCalculator';

import {
  calculateSubjectEquilibrium,
  normalizeSubjectName,
  normalizeWeights,
  loadTargetWeights,
  saveTargetWeights
} from '../src/utils/pidEquilibriumEngine';

import {
  evaluateDayStep,
  evaluateElasticStreak,
  recomputeStreakFromHistory,
  getStreakHealthTier,
  getShieldTokenRack,
  getAntiFragileStreakBadge,
  DEFAULT_STREAK_STATE
} from '../src/utils/streakResilienceEngine';

let passed = 0;
let failed = 0;

function check(desc: string, cond: boolean) {
  if (cond) {
    passed++;
  } else {
    failed++;
    console.error(`[FAIL] ${desc}`);
  }
}

console.log('--- Running Deep Edge Case & Fuzzing Harness ---\n');

// 1. Flowmodoro Edge Cases
try {
  check('Flowmodoro NaN focus seconds', !isNaN(calculateDynamicBreak(NaN)));
  check('Flowmodoro Infinity focus seconds', calculateDynamicBreak(Infinity) === 1800);
  check('Flowmodoro negative focus seconds', calculateDynamicBreak(-1000) === 0);
  check('formatFlowTime(NaN)', typeof formatFlowTime(NaN) === 'string');
  check('formatFlowTime(-100)', formatFlowTime(-100) === '00:00');
  check('formatEarnedBreak(NaN)', typeof formatEarnedBreak(NaN) === 'string');
  check('formatEarnedBreak(-10)', formatEarnedBreak(-10) === '0 mins');
  check('getFlowStage(-10)', getFlowStage(-10).stage === 'ramp_up');
  check('getFlowStage(NaN)', typeof getFlowStage(NaN).stage === 'string');
} catch (err) {
  console.error('Flowmodoro exception:', err);
  failed++;
}

// 2. Micro-Logger Edge Cases
try {
  check('parseMicroLog(null as any)', parseMicroLog(null as any).subject === 'General');
  check('parseMicroLog(undefined as any)', parseMicroLog(undefined as any).subject === 'General');
  check('parseMicroLog("")', parseMicroLog('').subject === 'General');
  check('parseMicroLog whitespace only', parseMicroLog('   \n\t  ').subject === 'General');
  check('parseMicroLog special symbols', parseMicroLog('$$$ @@@ !!!').subject === 'General');
  check('parseMicroLog negative duration string', parseMicroLog('Physics -50 mins').durationMinutes === 1);
  check('parseMicroLog huge duration string', parseMicroLog('Physics 50000 mins').durationMinutes === 1440);
  check('parseMicroLog huge question count', parseMicroLog('Math 1000000 questions').problemsSolved === 1000000);
  check('parseMicroLog 0/0 fraction', parseMicroLog('Physics 0/0 correct').accuracyPercent === null);
  check('parseMicroLog 100/100 fraction', parseMicroLog('Physics 100/100 correct').accuracyPercent === 100);
  check('parseMicroLog 0/10 fraction', parseMicroLog('Physics 0/10 correct').accuracyPercent === 0);
} catch (err) {
  console.error('MicroLogParser exception:', err);
  failed++;
}

// 3. SACM Edge Cases
try {
  check('calculateSACMData(null as any)', calculateSACMData(null as any).totalSessionsEvaluated === 0);
  check('calculateSACMData([null, undefined, {}])', calculateSACMData([null, undefined, {}] as any).totalSessionsEvaluated === 1);
  
  const weirdSessions = [
    { durationMinutes: -50, problemsSolved: -10, accuracyPercent: -20 },
    { durationMinutes: 'invalid', problemsSolved: 'nan', accuracyPercent: null },
    { durationMinutes: 100000, problemsSolved: 1000000, accuracyPercent: 150 }
  ];
  const r = calculateSACMData(weirdSessions);
  check('calculateSACMData handles weird session inputs without NaN', !isNaN(r.overallAvgVelocity) && !isNaN(r.overallAvgAccuracy));
  check('extractAccuracy(null)', extractAccuracy(null) === 80);
  check('extractAccuracy(undefined)', extractAccuracy(undefined) === 80);
  check('extractAccuracy({ accuracyPercent: NaN })', extractAccuracy({ accuracyPercent: NaN }) === 80);
  check('classifyQuadrant(-5, -10)', classifyQuadrant(-5, -10) === 'Q4_Struggling');
  check('classifyQuadrant(10000, 10000)', classifyQuadrant(10000, 10000) === 'Q1_Mastery');
} catch (err) {
  console.error('SACM exception:', err);
  failed++;
}

// 4. PID Equilibrium Edge Cases
try {
  check('calculateSubjectEquilibrium(null as any)', calculateSubjectEquilibrium(null as any).equilibriumScore === 100);
  check('normalizeSubjectName(null as any, [])', typeof normalizeSubjectName(null as any, []) === 'string');
  check('normalizeSubjectName("", ["Physics"])', normalizeSubjectName('', ['Physics']) === 'Physics');
  check('normalizeWeights({})', Object.keys(normalizeWeights({})).length > 0);
  check('normalizeWeights({ Physics: 0, Math: 0, Chem: 0 })', Math.abs(Object.values(normalizeWeights({ Physics: 0, Math: 0, Chem: 0 })).reduce((a, b) => a + b, 0) - 1.0) < 0.001);
  check('normalizeWeights({ Physics: -10, Math: -20 })', Object.keys(normalizeWeights({ Physics: -10, Math: -20 })).length === 2);

  const corruptedLogs = [
    null,
    undefined,
    { subject: null, durationMinutes: 'invalid' },
    { subject: 'UnknownAlienSubject', durationMinutes: -500 },
    { subject: 'Physics, Chemistry and Math', durationMinutes: 180 }
  ];
  const eqReport = calculateSubjectEquilibrium(corruptedLogs as any);
  check('PID handles corrupted logs gracefully', !isNaN(eqReport.equilibriumScore));
  check('Multi-subject split handled without NaN', eqReport.totalMinutes7Days === 180);
} catch (err) {
  console.error('PID exception:', err);
  failed++;
}

// 5. Streak Resilience Edge Cases
try {
  check('evaluateDayStep with negative actual minutes', evaluateDayStep(DEFAULT_STREAK_STATE, '2026-08-28', -50, 120).nextState.currentHP <= 100);
  check('evaluateDayStep with negative target minutes', evaluateDayStep(DEFAULT_STREAK_STATE, '2026-08-28', 120, -10).nextState.activeStreakDays === 1);
  check('evaluateDayStep with NaN actual minutes', !isNaN(evaluateDayStep(DEFAULT_STREAK_STATE, '2026-08-28', NaN, 120).nextState.currentHP));
  check('getStreakHealthTier(-50)', getStreakHealthTier(-50).tier === 'crimson');
  check('getStreakHealthTier(150)', getStreakHealthTier(150).tier === 'emerald');
  check('getShieldTokenRack(-5)', getShieldTokenRack(-5).length === 3);
  check('getShieldTokenRack(10)', getShieldTokenRack(10).every(s => s.isCharged));
  check('recomputeStreakFromHistory([])', recomputeStreakFromHistory([]).currentHP >= 0);
  check('recomputeStreakFromHistory([{ date: "garbage", totalMinutes: "nan" }])', typeof recomputeStreakFromHistory([{ date: "garbage", totalMinutes: "nan" }]).currentHP === 'number');
} catch (err) {
  console.error('Streak exception:', err);
  failed++;
}

console.log(`\nEdge Case & Fuzzing Results: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('✅ ALL EDGE CASES PASSED EMPIRICALLY!');
}
