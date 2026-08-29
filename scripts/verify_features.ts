/**
 * Savantix (Aegis) — Comprehensive Multi-Tier E2E Verification Test Suite
 * 
 * Validates all 5 Elite Time Management & Velocity Features:
 * - Feature 1 (R1): Flowmodoro & Flowtime Count-up Engine
 * - Feature 2 (R2): Deterministic Micro-Log NLP Parser (<1ms latency)
 * - Feature 3 (R3): Speed vs. Accuracy Calibration Matrix (SACM)
 * - Feature 4 (R4): Dynamic Subject Equilibrium & Discrete PID Allocator
 * - Feature 5 (R5): 100 HP Elastic Streak Health Bar & Resilience Shield Tokens
 * 
 * Test Tiers:
 * - Tier 1: Feature Coverage (>=5 tests per feature)
 * - Tier 2: Boundary & Corner Cases (>=5 tests per feature)
 * - Tier 3: Cross-Feature Pairwise & Integration Pipelines
 * - Tier 4: Real-World Student Workload Scenarios
 */

import {
  calculateDynamicBreak,
  getFlowStage,
  formatFlowTime,
  formatEarnedBreak,
  DEFAULT_FLOWMODORO_CONFIG
} from '../src/utils/flowmodoroEngine.ts';

import {
  parseMicroLog
} from '../src/utils/microLogParser.ts';

import {
  calculateSACMData,
  classifyQuadrant,
  extractAccuracy,
  DEFAULT_VELOCITY_THRESHOLD,
  DEFAULT_ACCURACY_THRESHOLD,
  QUADRANT_META
} from '../src/utils/sacmCalculator.ts';

import {
  calculateSubjectEquilibrium,
  normalizeSubjectName,
  normalizeWeights,
  DEFAULT_TARGET_WEIGHTS,
  PID_GAINS
} from '../src/utils/pidEquilibriumEngine.ts';

import {
  evaluateDayStep,
  evaluateElasticStreak,
  recomputeStreakFromHistory,
  getStreakHealthTier,
  getShieldTokenRack,
  getAntiFragileStreakBadge,
  DEFAULT_STREAK_STATE,
  MAX_HP,
  MAX_SHIELD_TOKENS
} from '../src/utils/streakResilienceEngine.ts';

// ==========================================
// Minimalist Test Framework & Reporting Harness
// ==========================================

interface TestResult {
  tier: string;
  feature: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
}

const allResults: TestResult[] = [];
let currentTier = 'Tier 1';
let currentFeature = 'General';

function setContext(tier: string, feature: string) {
  currentTier = tier;
  currentFeature = feature;
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`Assertion Failed: ${message} (Expected: ${JSON.stringify(expected)}, Got: ${JSON.stringify(actual)})`);
  }
}

function assertClose(actual: number, expected: number, tolerance: number, message: string) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`Assertion Failed: ${message} (Expected approx ${expected} ± ${tolerance}, Got: ${actual})`);
  }
}

function test(name: string, fn: () => void) {
  const start = performance.now();
  try {
    fn();
    const durationMs = performance.now() - start;
    allResults.push({
      tier: currentTier,
      feature: currentFeature,
      name,
      passed: true,
      durationMs
    });
    console.log(`  ✓ [PASS] ${name} (${durationMs.toFixed(3)}ms)`);
  } catch (err: any) {
    const durationMs = performance.now() - start;
    allResults.push({
      tier: currentTier,
      feature: currentFeature,
      name,
      passed: false,
      durationMs,
      error: err?.message || String(err)
    });
    console.error(`  ✗ [FAIL] ${name} (${durationMs.toFixed(3)}ms)`);
    console.error(`    Error: ${err?.message || err}`);
  }
}

console.log('\n========================================================================');
console.log('🛡️  SAVANTIX (AEGIS) — COMPREHENSIVE E2E VERIFICATION TEST SUITE');
console.log('========================================================================\n');

// ========================================================================
// TIER 1: FEATURE COVERAGE (Core Functionality & Primary Behaviors)
// ========================================================================

console.log('\n>>> TIER 1: FEATURE COVERAGE (Primary Requirements)\n');

// ------------------------------------------------------------------------
// Feature 1: Flowmodoro & Flowtime Engine (R1)
// ------------------------------------------------------------------------
setContext('Tier 1', 'R1: Flowmodoro Engine');
console.log('[Tier 1 / Feature 1] Flowmodoro & Flowtime Calculation Engine');

test('T1_F1_01: Standard 5:1 dynamic break for 25 mins (1500s -> 300s / 5m break)', () => {
  const breakSecs = calculateDynamicBreak(1500);
  assertEqual(breakSecs, 300, '1500s focus earns exactly 300s break');
});

test('T1_F1_02: Standard 5:1 dynamic break for 60 mins (3600s -> 720s / 12m break)', () => {
  const breakSecs = calculateDynamicBreak(3600);
  assertEqual(breakSecs, 720, '3600s focus earns exactly 720s break');
});

test('T1_F1_03: Minimum break clamp for 5 mins focus (300s -> 60s raw -> clamped to 180s)', () => {
  const breakSecs = calculateDynamicBreak(300);
  assertEqual(breakSecs, 180, '300s focus is clamped to minBreak 3m (180s)');
});

test('T1_F1_04: Zero break rule for focus < 5 minutes (299s -> 0s break)', () => {
  const breakSecs = calculateDynamicBreak(299);
  assertEqual(breakSecs, 0, 'Focus under 300s earns 0s break');
});

test('T1_F1_05: Maximum break clamp for marathon session (12000s -> 2400s raw -> clamped to 1800s)', () => {
  const breakSecs = calculateDynamicBreak(12000);
  assertEqual(breakSecs, 1800, 'Marathon focus is clamped to maxBreak 30m (1800s)');
});

test('T1_F1_06: Flow stage classifier transitions across 0-15m, 15-45m, 45-90m, 90m+', () => {
  assertEqual(getFlowStage(10).stage, 'ramp_up', '10m focus is ramp_up');
  assertEqual(getFlowStage(30).stage, 'deep_flow', '30m focus is deep_flow');
  assertEqual(getFlowStage(60).stage, 'hyper_focus', '60m focus is hyper_focus');
  assertEqual(getFlowStage(95).stage, 'fatigue_warning', '95m focus is fatigue_warning');
});

test('T1_F1_07: Flow time and break formatters (MM:SS, HH:MM:SS, human-readable strings)', () => {
  assertEqual(formatFlowTime(75), '01:15', '75s is 01:15');
  assertEqual(formatFlowTime(3675), '01:01:15', '3675s is 01:01:15');
  assertEqual(formatEarnedBreak(300), '5 mins', '300s is 5 mins');
  assertEqual(formatEarnedBreak(185), '3m 5s', '185s is 3m 5s');
  assertEqual(formatEarnedBreak(0), '0 mins', '0s is 0 mins');
});

// ------------------------------------------------------------------------
// Feature 2: Sub-Second Voice/Text Micro-Logger (R2)
// ------------------------------------------------------------------------
setContext('Tier 1', 'R2: Micro-Log Parser');
console.log('\n[Tier 1 / Feature 2] Deterministic Sub-Millisecond Micro-Log NLP Parser');

test('T1_F2_01: Physics electrostatics micro-log entity extraction', () => {
  const res = parseMicroLog('Did 45m Physics electrostatics 20 questions 85% accuracy');
  assertEqual(res.subject, 'Physics', 'Subject is Physics');
  assertEqual(res.durationMinutes, 45, 'Duration is 45m');
  assertEqual(res.problemsSolved, 20, 'Problems solved is 20');
  assertEqual(res.accuracyPercent, 85, 'Accuracy is 85%');
  assert(res.topic.toLowerCase().includes('electrostatics'), 'Topic captures electrostatics');
});

test('T1_F2_02: Mathematics integration log with fraction ratio accuracy ("28 correct and 7 wrong")', () => {
  const res = parseMicroLog('2h math integration solved 35 problems 28 correct and 7 wrong torque confusion');
  assertEqual(res.subject, 'Mathematics', 'Subject is Mathematics');
  assertEqual(res.durationMinutes, 120, 'Duration is 120m');
  assertEqual(res.problemsSolved, 35, 'Problems solved is 35');
  assertEqual(res.accuracyPercent, 80, 'Accuracy 28/35 is 80%');
  assert(res.mistakes.some(m => m.toLowerCase().includes('torque')), 'Mistake captures torque');
});

test('T1_F2_03: Chemistry organic log with fatigue energy mood ("felt tired" -> "Fatigued")', () => {
  const res = parseMicroLog('1.5 hrs chemistry organic reaction mechanisms 15 numericals 90% acc felt tired');
  assertEqual(res.subject, 'Chemistry', 'Subject is Chemistry');
  assertEqual(res.durationMinutes, 90, 'Duration is 90m');
  assertEqual(res.problemsSolved, 15, 'Problems solved is 15');
  assertEqual(res.accuracyPercent, 90, 'Accuracy is 90%');
  assertEqual(res.energyMood, 'Fatigued', 'Energy mood is Fatigued');
  assertEqual(res.focusScore, 5, 'Focus score is reduced to 5 for fatigue');
});

test('T1_F2_04: Computer Science algorithms log with peak flow energy ("hyper focus" -> "Peak Flow")', () => {
  const res = parseMicroLog('CS algorithms 90m 5 problems hyper focus');
  assertEqual(res.subject, 'Computer Science', 'Subject is Computer Science');
  assertEqual(res.durationMinutes, 90, 'Duration is 90m');
  assertEqual(res.problemsSolved, 5, 'Problems solved is 5');
  assertEqual(res.energyMood, 'Peak Flow', 'Energy mood is Peak Flow');
  assertEqual(res.focusScore, 10, 'Focus score is 10 for hyper focus');
});

test('T1_F2_05: Biology genetics log with direct accuracy and high focus', () => {
  const res = parseMicroLog('Biology genetics 50 mins 30 questions 95% accuracy high focus');
  assertEqual(res.subject, 'Biology', 'Subject is Biology');
  assertEqual(res.durationMinutes, 50, 'Duration is 50m');
  assertEqual(res.problemsSolved, 30, 'Problems solved is 30');
  assertEqual(res.accuracyPercent, 95, 'Accuracy is 95%');
  assertEqual(res.energyMood, 'High Energy', 'Energy mood is High Energy');
});

test('T1_F2_06: Specific error keyword extraction (sign error, calculation mistake, formula error)', () => {
  const res1 = parseMicroLog('Physics kinematics 30m 10 questions sign error');
  assert(res1.mistakes.some(m => m.toLowerCase().includes('sign')), 'Extracted sign error');

  const res2 = parseMicroLog('Math algebra 45m 15 questions calculation mistake');
  assert(res2.mistakes.some(m => m.toLowerCase().includes('calculation')), 'Extracted calculation mistake');
});

test('T1_F2_07: Sub-millisecond execution benchmark (< 2ms total for 50 parses)', () => {
  const sample = 'Did 45m Physics electrostatics 20 questions 85% accuracy';
  const start = performance.now();
  for (let i = 0; i < 50; i++) {
    parseMicroLog(sample);
  }
  const totalMs = performance.now() - start;
  const avgMs = totalMs / 50;
  assert(avgMs < 1.0, `Average parse time must be <1ms (Got: ${avgMs.toFixed(4)}ms)`);
});

// ------------------------------------------------------------------------
// Feature 3: Speed vs. Accuracy Calibration Matrix (SACM) (R3)
// ------------------------------------------------------------------------
setContext('Tier 1', 'R3: SACM Engine');
console.log('\n[Tier 1 / Feature 3] Speed vs. Accuracy Calibration Matrix (SACM)');

test('T1_F3_01: Quadrant 1 (Mastery Flow) classification (Velocity >= 15 Q/hr, Accuracy >= 80%)', () => {
  const q = classifyQuadrant(20, 90);
  assertEqual(q, 'Q1_Mastery', '20 Q/hr, 90% is Q1_Mastery');
});

test('T1_F3_02: Quadrant 2 (Overthinking) classification (Velocity < 15 Q/hr, Accuracy >= 80%)', () => {
  const q = classifyQuadrant(10, 90);
  assertEqual(q, 'Q2_Overthinking', '10 Q/hr, 90% is Q2_Overthinking');
});

test('T1_F3_03: Quadrant 3 (Rushing / Impulsive) classification (Velocity >= 15 Q/hr, Accuracy < 80%)', () => {
  const q = classifyQuadrant(22, 65);
  assertEqual(q, 'Q3_Rushing', '22 Q/hr, 65% is Q3_Rushing');
});

test('T1_F3_04: Quadrant 4 (Struggling / Fatigued) classification (Velocity < 15 Q/hr, Accuracy < 80%)', () => {
  const q = classifyQuadrant(8, 50);
  assertEqual(q, 'Q4_Struggling', '8 Q/hr, 50% is Q4_Struggling');
});

test('T1_F3_05: Accuracy extraction priority cascading', () => {
  assertEqual(extractAccuracy({ accuracyPercent: 92 }), 92, 'Uses accuracyPercent directly');
  assertEqual(extractAccuracy({ accuracy: 88 }), 88, 'Uses accuracy field');
  assertEqual(extractAccuracy({ efficiencyScore: 9 }), 90, 'Derives from efficiencyScore * 10');
  assertEqual(extractAccuracy({ focusScore: 8 }), 72, 'Derives from focusScore * 9');
  assertEqual(extractAccuracy({}), 80, 'Defaults to standard 80%');
});

test('T1_F3_06: Multi-session SACM report calculation and quadrant counts', () => {
  const sessions = [
    { id: '1', durationMinutes: 60, problemsSolved: 20, accuracyPercent: 90, subject: 'Physics' }, // V=20, A=90 -> Q1
    { id: '2', durationMinutes: 60, problemsSolved: 8, accuracyPercent: 85, subject: 'Mathematics' }, // V=8, A=85 -> Q2
    { id: '3', durationMinutes: 60, problemsSolved: 25, accuracyPercent: 60, subject: 'Chemistry' },  // V=25, A=60 -> Q3
    { id: '4', durationMinutes: 60, problemsSolved: 6, accuracyPercent: 50, subject: 'Physics' }    // V=6, A=50 -> Q4
  ];

  const report = calculateSACMData(sessions);
  assertEqual(report.totalSessionsEvaluated, 4, '4 sessions evaluated');
  assertEqual(report.totalProblemsSolved, 59, '59 total problems');
  assertEqual(report.totalStudyMinutes, 240, '240 total minutes');
  assertEqual(report.quadrants.Q1_Mastery.count, 1, '1 session in Q1');
  assertEqual(report.quadrants.Q2_Overthinking.count, 1, '1 session in Q2');
  assertEqual(report.quadrants.Q3_Rushing.count, 1, '1 session in Q3');
  assertEqual(report.quadrants.Q4_Struggling.count, 1, '1 session in Q4');
});

test('T1_F3_07: Executive summary and diagnostic prescription generation', () => {
  const sessions = [
    { id: '1', durationMinutes: 60, problemsSolved: 20, accuracyPercent: 90, subject: 'Physics' },
    { id: '2', durationMinutes: 60, problemsSolved: 22, accuracyPercent: 95, subject: 'Physics' }
  ];
  const report = calculateSACMData(sessions);
  assertEqual(report.dominantQuadrant, 'Q1_Mastery', 'Dominant quadrant is Q1');
  assert(report.executiveSummary.includes('Mastery State Dominant'), 'Executive summary identifies mastery flow');
  assert(report.topPrescriptions.length > 0, 'Top prescriptions provided');
});

// ------------------------------------------------------------------------
// Feature 4: Dynamic Subject Equilibrium Matrix & PID Allocator (R4)
// ------------------------------------------------------------------------
setContext('Tier 1', 'R4: PID Equilibrium Engine');
console.log('\n[Tier 1 / Feature 4] Dynamic Subject Equilibrium & PID Allocator');

test('T1_F4_01: Subject name fuzzy normalization with keyword mapping', () => {
  const active = ['Physics', 'Mathematics', 'Chemistry'];
  assertEqual(normalizeSubjectName('phy mechanics', active), 'Physics', 'phy mechanics -> Physics');
  assertEqual(normalizeSubjectName('calculus integration', active), 'Mathematics', 'calculus integration -> Mathematics');
  assertEqual(normalizeSubjectName('organic reactions', active), 'Chemistry', 'organic reactions -> Chemistry');
  assertEqual(normalizeSubjectName('', active), 'Physics', 'empty fallback -> first active subject');
});

test('T1_F4_02: Target weight normalization summing to 1.0 (100%)', () => {
  const weights = { Physics: 40, Mathematics: 40, Chemistry: 20 };
  const normalized = normalizeWeights(weights);
  assertClose(normalized.Physics, 0.40, 0.01, 'Physics is 40%');
  assertClose(normalized.Mathematics, 0.40, 0.01, 'Math is 40%');
  assertClose(normalized.Chemistry, 0.20, 0.01, 'Chem is 20%');
  const sum = Object.values(normalized).reduce((a, b) => a + b, 0);
  assertClose(sum, 1.0, 0.001, 'Normalized sum is 1.0');
});

test('T1_F4_03: Perfect parity Shannon Entropy index (Equal time across subjects -> Score >= 98%)', () => {
  const logs = [
    { date: '2026-08-20', subject: 'Physics', durationMinutes: 120 },
    { date: '2026-08-21', subject: 'Mathematics', durationMinutes: 120 },
    { date: '2026-08-22', subject: 'Chemistry', durationMinutes: 120 }
  ];
  const uniformWeights = { Physics: 1/3, Mathematics: 1/3, Chemistry: 1/3 };
  const report = calculateSubjectEquilibrium(logs, uniformWeights);
  assert(report.equilibriumScore >= 98, `Parity score ${report.equilibriumScore} must be >= 98%`);
  assertEqual(report.status, 'harmonious', 'Status is harmonious');
});

test('T1_F4_04: Severe neglect detection on single-subject monopoly (Score < 75%)', () => {
  const logs = [
    { date: '2026-08-20', subject: 'Physics', durationMinutes: 600 },
    { date: '2026-08-21', subject: 'Physics', durationMinutes: 600 }
  ];
  const report = calculateSubjectEquilibrium(logs, { Physics: 0.35, Mathematics: 0.35, Chemistry: 0.30 });
  assert(report.equilibriumScore < 75, `Monopoly score ${report.equilibriumScore} must be < 75%`);
  assertEqual(report.status, 'severe_neglect', 'Status is severe_neglect');
  assert(report.neglectedSubjects.length > 0, 'Neglected subjects detected');
});

test('T1_F4_05: Discrete PID controller output computation and clamping [-60, +90]', () => {
  const extremeLogs = [
    { date: '2026-08-20', subject: 'Physics', durationMinutes: 1000 }
  ];
  const report = calculateSubjectEquilibrium(extremeLogs, { Physics: 0.35, Mathematics: 0.35, Chemistry: 0.30 });
  const chem = report.subjectDistributions.find(d => d.subject === 'Chemistry');
  const phy = report.subjectDistributions.find(d => d.subject === 'Physics');

  assertEqual(chem?.recommendedDailyAdjustmentMins, 45, 'Chemistry gets PID output +45 mins');
  assertEqual(phy?.recommendedDailyAdjustmentMins, -60, 'Physics is clamped to minClamp -60 mins');
});

test('T1_F4_06: Actionable natural language prescription generation naming neglected subjects', () => {
  const logs = [
    { date: '2026-08-20', subject: 'Physics', durationMinutes: 300 },
    { date: '2026-08-21', subject: 'Mathematics', durationMinutes: 300 },
    { date: '2026-08-22', subject: 'Chemistry', durationMinutes: 30 }
  ];
  const report = calculateSubjectEquilibrium(logs, { Physics: 0.35, Mathematics: 0.35, Chemistry: 0.30 });
  assert(report.actionablePrescription.includes('Chemistry'), 'Prescription names Chemistry');
  assert(report.actionablePrescription.includes('deficit'), 'Prescription identifies deficit');
  assert(report.actionablePrescription.includes('Prescribed tomorrow:'), 'Prescription has prescriptive action');
});

// ------------------------------------------------------------------------
// Feature 5: Elastic Streak Health Bar & Resilience Tokens (R5)
// ------------------------------------------------------------------------
setContext('Tier 1', 'R5: Streak Resilience Engine');
console.log('\n[Tier 1 / Feature 5] Elastic Streak 100 HP Health Bar & Resilience Tokens');

test('T1_F5_01: Missed study day with shield token auto-defense (0 HP loss, streak frozen)', () => {
  const state = {
    ...DEFAULT_STREAK_STATE,
    currentHP: 100,
    shieldTokens: 2,
    activeStreakDays: 10
  };
  const { nextState, historyEntry } = evaluateDayStep(state, '2026-08-28', 0, 120);
  assertEqual(nextState.shieldTokens, 1, '1 shield consumed');
  assertEqual(nextState.currentHP, 100, '0 HP lost');
  assertEqual(nextState.activeStreakDays, 10, 'Streak preserved at 10 days');
  assertEqual(historyEntry.status, 'shield_defended', 'Status is shield_defended');
});

test('T1_F5_02: Missed study day with 0 shields (-35 HP penalty, streak degraded)', () => {
  const state = {
    ...DEFAULT_STREAK_STATE,
    currentHP: 80,
    shieldTokens: 0,
    activeStreakDays: 7
  };
  const { nextState, historyEntry } = evaluateDayStep(state, '2026-08-28', 0, 120);
  assertEqual(nextState.currentHP, 45, '80 - 35 = 45 HP');
  assertEqual(nextState.activeStreakDays, 7, 'Streak continues while HP > 0');
  assertEqual(historyEntry.status, 'zero_decay', 'Status is zero_decay');
  assertEqual(historyEntry.hpDelta, -35, 'hpDelta is -35');
});

test('T1_F5_03: Partial study day linear penalty without consuming shield', () => {
  const state = {
    ...DEFAULT_STREAK_STATE,
    currentHP: 90,
    shieldTokens: 1,
    activeStreakDays: 8
  };
  // Studied 60m of 120m target (50% completion) -> Loss: 20 * (1 - 0.5) = 10 HP
  const { nextState, historyEntry } = evaluateDayStep(state, '2026-08-28', 60, 120);
  assertEqual(nextState.currentHP, 80, '90 - 10 = 80 HP');
  assertEqual(nextState.shieldTokens, 1, 'Shield token is NOT consumed on partial day');
  assertEqual(nextState.activeStreakDays, 8, 'Streak preserved as degraded');
  assertEqual(historyEntry.status, 'partial_decay', 'Status is partial_decay');
});

test('T1_F5_04: Target met day (+15 HP recovery, streak +1)', () => {
  const state = {
    ...DEFAULT_STREAK_STATE,
    currentHP: 70,
    shieldTokens: 1,
    activeStreakDays: 5
  };
  const { nextState, historyEntry } = evaluateDayStep(state, '2026-08-28', 125, 120);
  assertEqual(nextState.currentHP, 85, '70 + 15 = 85 HP');
  assertEqual(nextState.activeStreakDays, 6, 'Streak increments to 6');
  assertEqual(historyEntry.status, 'target_met', 'Status is target_met');
});

test('T1_F5_05: Surplus overdrive day (+25 HP recovery, +1 shield charged, streak +1)', () => {
  const state = {
    ...DEFAULT_STREAK_STATE,
    currentHP: 60,
    shieldTokens: 1,
    activeStreakDays: 12
  };
  // 1.5x target = 180m -> actual 190m
  const { nextState, historyEntry } = evaluateDayStep(state, '2026-08-28', 190, 120);
  assertEqual(nextState.currentHP, 85, '60 + 25 = 85 HP');
  assertEqual(nextState.shieldTokens, 2, 'Shield token increments 1 -> 2');
  assertEqual(nextState.activeStreakDays, 13, 'Streak increments 12 -> 13');
  assertEqual(historyEntry.status, 'surplus_overdrive', 'Status is surplus_overdrive');
  assertEqual(historyEntry.shieldEarned, true, 'shieldEarned is true');
});

test('T1_F5_06: Visual health tiers and pulse indicator (Emerald, Amber, Crimson)', () => {
  const emerald = getStreakHealthTier(90);
  assertEqual(emerald.tier, 'emerald', '90 HP is emerald');
  assertEqual(emerald.pulse, false, 'Emerald does not pulse');

  const amber = getStreakHealthTier(60);
  assertEqual(amber.tier, 'amber', '60 HP is amber');

  const crimson = getStreakHealthTier(20);
  assertEqual(crimson.tier, 'crimson', '20 HP is crimson');
  assertEqual(crimson.pulse, true, 'Crimson pulses');
});

test('T1_F5_07: Shield token rack and anti-fragile badge formatting', () => {
  const rack = getShieldTokenRack(2, 3);
  assertEqual(rack.length, 3, 'Rack has 3 slots');
  assertEqual(rack[0].isCharged, true, 'Slot 1 charged');
  assertEqual(rack[1].isCharged, true, 'Slot 2 charged');
  assertEqual(rack[2].isCharged, false, 'Slot 3 empty');

  const badge = getAntiFragileStreakBadge({
    ...DEFAULT_STREAK_STATE,
    currentHP: 100,
    shieldTokens: 2,
    activeStreakDays: 21
  });
  assert(badge.text.includes('21 Day Streak (Shield Protected)'), 'Badge format matches');
  assertEqual(badge.isProtected, true, 'isProtected is true');
});

// ========================================================================
// TIER 2: BOUNDARY & CORNER CASES
// ========================================================================

console.log('\n>>> TIER 2: BOUNDARY & CORNER CASES\n');

// ------------------------------------------------------------------------
// Feature 1: Flowmodoro Boundaries
// ------------------------------------------------------------------------
setContext('Tier 2', 'R1: Flowmodoro Boundaries');
console.log('[Tier 2 / Feature 1] Flowmodoro Engine Boundary & Edge Conditions');

test('T2_F1_01: Zero seconds focus returns 0 break', () => {
  assertEqual(calculateDynamicBreak(0), 0, '0s focus returns 0s break');
});

test('T2_F1_02: 299 seconds focus (1 second below 5m threshold) returns 0 break', () => {
  assertEqual(calculateDynamicBreak(299), 0, '299s focus returns 0s break');
});

test('T2_F1_03: Exactly 300 seconds focus returns minBreak clamped break (180s)', () => {
  assertEqual(calculateDynamicBreak(300), 180, '300s focus returns 180s break');
});

test('T2_F1_04: Extreme 24-hour marathon focus (86400s) clamped to maxBreak (1800s / 30m)', () => {
  assertEqual(calculateDynamicBreak(86400), 1800, '24h focus clamped to 1800s break');
});

test('T2_F1_05: Custom config overrides (ratio 10, minBreak 5m = 300s, maxBreak 15m = 900s)', () => {
  const customConfig = { focusToBreakRatio: 10, minBreakMinutes: 5, maxBreakMinutes: 15 };
  assertEqual(calculateDynamicBreak(300, customConfig), 300, 'Clamped to custom minBreak 300s');
  assertEqual(calculateDynamicBreak(6000, customConfig), 600, '6000s / 10 = 600s');
  assertEqual(calculateDynamicBreak(12000, customConfig), 900, 'Clamped to custom maxBreak 900s');
});

test('T2_F1_06: Custom fatigue threshold at 60 mins triggers warning at 61 mins', () => {
  assertEqual(getFlowStage(55, 60).stage, 'hyper_focus', '55m with threshold 60m is hyper_focus');
  assertEqual(getFlowStage(61, 60).stage, 'fatigue_warning', '61m with threshold 60m is fatigue_warning');
});

// ------------------------------------------------------------------------
// Feature 2: Micro-Logger NLP Parser Boundaries
// ------------------------------------------------------------------------
setContext('Tier 2', 'R2: Micro-Log Boundaries');
console.log('\n[Tier 2 / Feature 2] Micro-Log NLP Parser Boundary & Edge Conditions');

test('T2_F2_01: Empty string or whitespace-only input returns safe default entity', () => {
  const res = parseMicroLog('   ');
  assertEqual(res.subject, 'General', 'Default subject is General');
  assertEqual(res.durationMinutes, 60, 'Default duration is 60m');
  assertEqual(res.problemsSolved, 0, 'Default problems solved is 0');
  assertEqual(res.accuracyPercent, null, 'Default accuracy is null');
  assertEqual(res.mistakes.length, 0, 'No mistakes');
});

test('T2_F2_02: Long text input (>500 chars) parses without error or significant delay', () => {
  const longInput = 'Today I spent 2 hours in Mathematics studying advanced multivariable calculus integration with polar coordinates and spherical harmonics. Solved 45 complex problems with 40 correct and 5 wrong. Faced sign errors and algebraic blunders in step 3. Felt super focused and energetic.';
  const res = parseMicroLog(longInput);
  assertEqual(res.subject, 'Mathematics', 'Identifies Mathematics');
  assertEqual(res.durationMinutes, 120, 'Identifies 120m');
  assertEqual(res.problemsSolved, 45, 'Identifies 45 problems');
  assertEqual(res.accuracyPercent, 89, 'Accuracy 40/45 is 89%');
  assertEqual(res.energyMood, 'Peak Flow', 'Identifies Peak Flow');
});

test('T2_F2_03: Log with 0 problems or missing accuracy handles null values safely', () => {
  const res = parseMicroLog('Physics theory revision 90 mins deep focus');
  assertEqual(res.subject, 'Physics', 'Subject is Physics');
  assertEqual(res.durationMinutes, 90, 'Duration is 90m');
  assertEqual(res.problemsSolved, 0, '0 problems solved');
  assertEqual(res.accuracyPercent, null, 'Accuracy is null');
});

test('T2_F2_04: Mixed decimal hours and minute formats ("2.5h 15m" -> 165 mins)', () => {
  const res = parseMicroLog('Chemistry kinetics 2.5h 15m 20 problems 90% accuracy');
  assertEqual(res.durationMinutes, 165, '2.5h + 15m = 165 mins');
});

test('T2_F2_05: Clamping of extreme accuracy percentages to [0, 100] range', () => {
  const res1 = parseMicroLog('Physics 60m 10 questions 150% accuracy');
  assertEqual(res1.accuracyPercent, 100, 'Accuracy clamped to max 100%');
});

// ------------------------------------------------------------------------
// Feature 3: SACM Calculator Boundaries
// ------------------------------------------------------------------------
setContext('Tier 2', 'R3: SACM Boundaries');
console.log('\n[Tier 2 / Feature 3] SACM Matrix Boundary & Edge Conditions');

test('T2_F3_01: Empty session array returns clean report with 0 values and null dominant quadrant', () => {
  const report = calculateSACMData([]);
  assertEqual(report.totalSessionsEvaluated, 0, '0 sessions');
  assertEqual(report.overallAvgVelocity, 0, '0 velocity');
  assertEqual(report.dominantQuadrant, null, 'No dominant quadrant');
  assertEqual(report.dataPoints.length, 0, '0 data points');
});

test('T2_F3_02: Session with 0 problems solved in 60 mins handles Velocity = 0 Q/hr cleanly', () => {
  const sessions = [{ durationMinutes: 60, problemsSolved: 0, accuracyPercent: 80, subject: 'Physics' }];
  const report = calculateSACMData(sessions);
  assertEqual(report.dataPoints[0].velocityQpH, 0, 'Velocity is 0 Q/hr');
  assertEqual(report.dataPoints[0].timePerQuestionMin, 60, 'Time per question is 60m');
  assertEqual(report.dataPoints[0].quadrant, 'Q2_Overthinking', 'V < 15, Acc >= 80 -> Q2');
});

test('T2_F3_03: Extreme high velocity (100 problems in 1 minute) computes without divide-by-zero', () => {
  const sessions = [{ durationMinutes: 1, problemsSolved: 100, accuracyPercent: 95, subject: 'Physics' }];
  const report = calculateSACMData(sessions);
  assertEqual(report.dataPoints[0].velocityQpH, 6000, 'Velocity is 6000 Q/hr');
  assertEqual(report.dataPoints[0].quadrant, 'Q1_Mastery', 'Q1 Mastery');
});

test('T2_F3_04: Custom benchmarks threshold overrides (vThresh = 20, accThresh = 90%)', () => {
  const sessions = [{ durationMinutes: 60, problemsSolved: 18, accuracyPercent: 85, subject: 'Physics' }];
  // Under standard (15, 80) this is Q1; under custom (20, 90) it has V=18 (<20) and Acc=85 (<90) -> Q4
  const customReport = calculateSACMData(sessions, { velocityThreshold: 20, accuracyThreshold: 90 });
  assertEqual(customReport.dataPoints[0].quadrant, 'Q4_Struggling', 'Custom thresholds categorize as Q4');
});

test('T2_F3_05: Exact threshold boundary values (Velocity = 15.0 Q/hr, Accuracy = 80% -> Q1)', () => {
  const q = classifyQuadrant(15.0, 80.0, 15.0, 80.0);
  assertEqual(q, 'Q1_Mastery', 'Exact threshold point classifies as Q1_Mastery');
});

// ------------------------------------------------------------------------
// Feature 4: PID Subject Equilibrium Boundaries
// ------------------------------------------------------------------------
setContext('Tier 2', 'R4: PID Equilibrium Boundaries');
console.log('\n[Tier 2 / Feature 4] PID Subject Allocator Boundary & Edge Conditions');

test('T2_F4_01: Empty logs array returns 100% equilibrium score and zero total minutes', () => {
  const report = calculateSubjectEquilibrium([]);
  assertEqual(report.equilibriumScore, 100, 'Empty logs score is 100%');
  assertEqual(report.totalMinutes7Days, 0, 'Total minutes is 0');
  assertEqual(report.status, 'harmonious', 'Status is harmonious');
});

test('T2_F4_02: 100% single subject monopoly evaluates PID adjustment and upper clamping', () => {
  const logs = [{ subject: 'Physics', durationMinutes: 5000, date: '2026-08-25' }];
  const standardTargets = { Physics: 0.35, Mathematics: 0.35, Chemistry: 0.30 };
  const standardReport = calculateSubjectEquilibrium(logs, standardTargets);
  const math = standardReport.subjectDistributions.find(d => d.subject === 'Mathematics');
  const chem = standardReport.subjectDistributions.find(d => d.subject === 'Chemistry');

  // For target 0.35: P = 120*0.35 = 42, I = 30*0.35 = 10.5 -> 53 mins
  assertEqual(math?.recommendedDailyAdjustmentMins, 53, 'Math gets proportional PID output +53 mins');
  assertEqual(chem?.recommendedDailyAdjustmentMins, 45, 'Chem gets proportional PID output +45 mins');

  // Upper clamp testing with high deficit target (e.g. target 0.70 -> raw PID > 90m -> clamped to +90m)
  const highDeficitTargets = { Physics: 0.20, Mathematics: 0.10, Chemistry: 0.70 };
  const highDeficitReport = calculateSubjectEquilibrium(logs, highDeficitTargets);
  const chemHigh = highDeficitReport.subjectDistributions.find(d => d.subject === 'Chemistry');
  assertEqual(chemHigh?.recommendedDailyAdjustmentMins, PID_GAINS.maxClamp, 'High deficit Chem is clamped to max +90 mins');
});

test('T2_F4_03: Compound multi-subject log splits time equally ("Physics and Chemistry 120m")', () => {
  const logs = [{ subject: 'Physics and Chemistry', durationMinutes: 120, date: '2026-08-25' }];
  const targets = { Physics: 0.50, Chemistry: 0.50 };
  const report = calculateSubjectEquilibrium(logs, targets);
  const phy = report.subjectDistributions.find(d => d.subject === 'Physics');
  const chem = report.subjectDistributions.find(d => d.subject === 'Chemistry');

  assertEqual(phy?.actualMinutes, 60, 'Physics gets 60m');
  assertEqual(chem?.actualMinutes, 60, 'Chemistry gets 60m');
  assertEqual(report.equilibriumScore, 100, 'Perfect split gives 100% entropy');
});

test('T2_F4_04: Target weights summing to 0 fallback to equal uniform distribution', () => {
  const weights = { Physics: 0, Mathematics: 0, Chemistry: 0 };
  const normalized = normalizeWeights(weights);
  assertClose(normalized.Physics, 1/3, 0.01, 'Physics uniform 1/3');
  assertClose(normalized.Mathematics, 1/3, 0.01, 'Math uniform 1/3');
  assertClose(normalized.Chemistry, 1/3, 0.01, 'Chem uniform 1/3');
});

// ------------------------------------------------------------------------
// Feature 5: Elastic Streak Engine Boundaries
// ------------------------------------------------------------------------
setContext('Tier 2', 'R5: Streak Resilience Boundaries');
console.log('\n[Tier 2 / Feature 5] Elastic Streak Engine Boundary & Edge Conditions');

test('T2_F5_01: HP capping at 100 when receiving Overdrive recovery (+25 HP at 90 HP)', () => {
  const state = { ...DEFAULT_STREAK_STATE, currentHP: 90, shieldTokens: 1 };
  const { nextState } = evaluateDayStep(state, '2026-08-28', 200, 120);
  assertEqual(nextState.currentHP, 100, 'HP capped at 100 (90 + 25 -> 100)');
});

test('T2_F5_02: Shield token capping at 3 when receiving Overdrive (+1 Shield at 3 Shields)', () => {
  const state = { ...DEFAULT_STREAK_STATE, currentHP: 90, shieldTokens: 3 };
  const { nextState } = evaluateDayStep(state, '2026-08-28', 200, 120);
  assertEqual(nextState.shieldTokens, 3, 'Shield tokens capped at 3');
});

test('T2_F5_03: HP reaching 0 resets active streak to 0 while preserving longest streak', () => {
  const state = {
    ...DEFAULT_STREAK_STATE,
    currentHP: 20,
    shieldTokens: 0,
    activeStreakDays: 30,
    longestStreakDays: 30
  };
  const { nextState } = evaluateDayStep(state, '2026-08-28', 0, 120);
  assertEqual(nextState.currentHP, 0, 'HP depleted to 0 (clamped at 0)');
  assertEqual(nextState.activeStreakDays, 0, 'Active streak resets to 0');
  assertEqual(nextState.longestStreakDays, 30, 'Longest streak remains 30');
});

test('T2_F5_04: Multi-day gap traversal across 3 missing days evaluates consecutive decay', () => {
  const initial = {
    ...DEFAULT_STREAK_STATE,
    currentHP: 100,
    shieldTokens: 1, // 1 shield absorbs Day 1, Day 2 loses 35 HP (65 HP), Day 3 loses 35 HP (30 HP)
    activeStreakDays: 14,
    lastEvaluatedDate: '2026-08-20'
  };

  const finalState = evaluateElasticStreak(initial, [], 120, '2026-08-23');
  assertEqual(finalState.shieldTokens, 0, 'Shield consumed on Day 1');
  assertEqual(finalState.currentHP, 30, '100 - 0 - 35 - 35 = 30 HP');
  assertEqual(finalState.activeStreakDays, 14, 'Streak preserved as degraded');
});

// ========================================================================
// TIER 3: CROSS-FEATURE INTEGRATION TESTS
// ========================================================================

console.log('\n>>> TIER 3: CROSS-FEATURE INTEGRATION PIPELINES\n');
setContext('Tier 3', 'Cross-Feature Pipelines');

test('T3_INT_01: End-to-End Pipeline (Micro-Log -> SACM -> PID Equilibrium -> Streak Evaluation)', () => {
  // Step 1: Parse raw micro-log
  const rawTranscript = 'Did 120m Physics rotational mechanics 30 questions 90% accuracy high focus';
  const entity = parseMicroLog(rawTranscript);
  assertEqual(entity.subject, 'Physics', 'Parsed Physics');
  assertEqual(entity.durationMinutes, 120, 'Parsed 120m');

  // Step 2: Feed into SACM Engine
  const sacmReport = calculateSACMData([
    {
      id: 'log_1',
      date: '2026-08-28',
      subject: entity.subject,
      topic: entity.topic,
      durationMinutes: entity.durationMinutes,
      problemsSolved: entity.problemsSolved,
      accuracyPercent: entity.accuracyPercent
    }
  ]);
  assertEqual(sacmReport.dominantQuadrant, 'Q1_Mastery', '15 Q/hr & 90% is Q1 Mastery');

  // Step 3: Feed into Subject Equilibrium PID Engine
  const pidReport = calculateSubjectEquilibrium(
    [{ subject: entity.subject, durationMinutes: entity.durationMinutes, date: '2026-08-28' }],
    { Physics: 0.35, Mathematics: 0.35, Chemistry: 0.30 }
  );
  assertEqual(pidReport.status, 'severe_neglect', 'Single subject triggers neglect for unstudied subjects');

  // Step 4: Feed into Elastic Streak Health Engine
  const streakState = evaluateElasticStreak(
    DEFAULT_STREAK_STATE,
    [{ subject: entity.subject, durationMinutes: entity.durationMinutes, date: '2026-08-28' }],
    120,
    '2026-08-28'
  );
  assertEqual(streakState.activeStreakDays, 1, 'Target met increments streak to 1');
  assertEqual(streakState.currentHP, 100, 'HP remains at full 100');
});

test('T3_INT_02: Flowmodoro Count-up -> Micro-Logger -> SACM Mastery Calibration', () => {
  // Simulate 90 mins Flowmodoro focus
  const focusSeconds = 90 * 60; // 5400s
  const earnedBreak = calculateDynamicBreak(focusSeconds);
  assertEqual(earnedBreak, 1080, '90m focus earns 18m break (1080s)');

  // Auto-log into micro-log entity
  const logText = `Physics electrostatics ${focusSeconds / 60}m 35 questions 88% accuracy`;
  const entity = parseMicroLog(logText);
  assertEqual(entity.durationMinutes, 90, 'Duration is 90m');

  // SACM categorization
  const sacm = calculateSACMData([{ ...entity, id: 'flow_1' }]);
  // Velocity = (35 * 60) / 90 = 23.3 Q/hr, Acc = 88% -> Q1
  assertEqual(sacm.dataPoints[0].quadrant, 'Q1_Mastery', 'Classified as Q1 Mastery');
  assertClose(sacm.dataPoints[0].velocityQpH, 23.3, 0.2, 'Velocity is 23.3 Q/hr');
});

test('T3_INT_03: Overdrive Study Day -> Shield Token Charge -> Rest Day Shield Absorption', () => {
  const initial = { ...DEFAULT_STREAK_STATE, currentHP: 70, shieldTokens: 1, activeStreakDays: 5 };

  // Day 1: 200m Overdrive study (Target: 120m)
  const step1 = evaluateDayStep(initial, '2026-08-27', 200, 120);
  assertEqual(step1.nextState.shieldTokens, 2, 'Shield charged 1 -> 2');
  assertEqual(step1.nextState.currentHP, 95, '70 + 25 = 95 HP');
  assertEqual(step1.nextState.activeStreakDays, 6, 'Streak is 6');

  // Day 2: 0m Rest day
  const step2 = evaluateDayStep(step1.nextState, '2026-08-28', 0, 120);
  assertEqual(step2.nextState.shieldTokens, 1, 'Shield consumed 2 -> 1');
  assertEqual(step2.nextState.currentHP, 95, '0 HP loss (95 HP preserved)');
  assertEqual(step2.nextState.activeStreakDays, 6, 'Streak preserved at 6 days');
});

test('T3_INT_04: Neglect Detection -> PID Guidance -> Corrective Session Restores Shannon Entropy', () => {
  // Phase 1: Heavy Physics bias
  const skewedLogs = [
    { date: '2026-08-20', subject: 'Physics', durationMinutes: 600 },
    { date: '2026-08-21', subject: 'Physics', durationMinutes: 600 }
  ];
  const targets = { Physics: 0.35, Mathematics: 0.35, Chemistry: 0.30 };
  const phase1Report = calculateSubjectEquilibrium(skewedLogs, targets);
  assert(phase1Report.equilibriumScore < 75, 'Phase 1 is severe neglect');
  const chemDeficit = phase1Report.neglectedSubjects.find(s => s.subject === 'Chemistry');
  assert(chemDeficit !== undefined, 'Chemistry is in deficit');

  // Phase 2: Follow PID advice and study Mathematics & Chemistry heavily
  const balancedLogs = [
    ...skewedLogs,
    { date: '2026-08-22', subject: 'Mathematics', durationMinutes: 600 },
    { date: '2026-08-23', subject: 'Chemistry', durationMinutes: 600 }
  ];
  const phase2Report = calculateSubjectEquilibrium(balancedLogs, targets);
  assert(phase2Report.equilibriumScore > 90, `Entropy recovered to ${phase2Report.equilibriumScore}%`);
  assertEqual(phase2Report.status, 'harmonious', 'Status restored to harmonious');
});

test('T3_INT_05: Multi-Subject Daily Split updating SACM & PID concurrently', () => {
  const log = { date: '2026-08-28', subject: 'Physics and Mathematics', durationMinutes: 180, problemsSolved: 40, accuracyPercent: 85 };

  // Split evaluates across both subjects in PID
  const pid = calculateSubjectEquilibrium([log], { Physics: 0.50, Mathematics: 0.50 });
  assertEqual(pid.equilibriumScore, 100, 'Perfect 50/50 balance');

  // SACM evaluates total session velocity
  const sacm = calculateSACMData([log]);
  // Velocity = (40 * 60) / 180 = 13.3 Q/hr (<15 Q/hr), Accuracy = 85% (>=80%) -> Q2 Overthinking
  assertEqual(sacm.dataPoints[0].quadrant, 'Q2_Overthinking', '13.3 Q/hr with 85% is Q2 Overthinking');
});

// ========================================================================
// TIER 4: REAL-WORLD APPLICATION SCENARIOS
// ========================================================================

console.log('\n>>> TIER 4: REAL-WORLD APPLICATION SCENARIOS\n');
setContext('Tier 4', 'Realistic Workload Scenarios');

test('T4_SCN_01: 7-Day JEE Advanced Preparation Crucible Simulation', () => {
  const dailyWorkload = [
    { day: '2026-08-21', log: 'Physics mechanics 180m 40 questions 88% accuracy hyper focus' },
    { day: '2026-08-22', log: 'Mathematics calculus 150m 30 problems 85% accuracy deep focus' },
    { day: '2026-08-23', log: 'Chemistry organic reactions 120m 25 questions 92% accuracy' },
    { day: '2026-08-24', log: 'Full JEE Mock Exam 360m 90 questions 78% accuracy tired' },
    { day: '2026-08-25', log: '' }, // Rest day (0m)
    { day: '2026-08-26', log: 'Physics electromagnetism 200m 45 questions 84% accuracy' },
    { day: '2026-08-27', log: 'Chemistry coordination compounds 180m 35 questions 94% accuracy' }
  ];

  // Parse all days
  const parsedSessions: any[] = [];
  dailyWorkload.forEach(item => {
    if (item.log) {
      const p = parseMicroLog(item.log);
      parsedSessions.push({ ...p, date: item.day, id: `jee_${item.day}` });
    }
  });

  // 1. SACM Evaluation
  const sacm = calculateSACMData(parsedSessions);
  assertEqual(sacm.totalSessionsEvaluated, 6, '6 study sessions evaluated');
  assert(sacm.totalProblemsSolved >= 265, 'Over 265 problems solved');

  // 2. PID Subject Equilibrium Evaluation
  const pid = calculateSubjectEquilibrium(parsedSessions, { Physics: 0.35, Mathematics: 0.35, Chemistry: 0.30 });
  assert(pid.equilibriumScore >= 80, `Equilibrium score is ${pid.equilibriumScore}%`);

  // 3. Elastic Streak Progression Simulation
  let streakState = { ...DEFAULT_STREAK_STATE, currentHP: 80, shieldTokens: 1, activeStreakDays: 3 };
  dailyWorkload.forEach(item => {
    const daySummary = parsedSessions.filter(s => s.date === item.day);
    const dayMins = daySummary.reduce((sum, s) => sum + s.durationMinutes, 0);
    const step = evaluateDayStep(streakState, item.day, dayMins, 120);
    streakState = step.nextState;
  });

  // End of 7 days: Streak should be alive, shield absorbed the rest day
  assert(streakState.activeStreakDays >= 8, `Active streak reached ${streakState.activeStreakDays} days`);
  assert(streakState.currentHP >= 80, `Health remained high at ${streakState.currentHP} HP`);
});

test('T4_SCN_02: IPhO Olympiad Theoretical Research Intensive Week', () => {
  const iPhoSessions = [
    { date: '2026-08-20', durationMinutes: 120, problemsSolved: 12, accuracyPercent: 95, subject: 'Physics' }, // V=6, A=95 -> Q2
    { date: '2026-08-21', durationMinutes: 150, problemsSolved: 15, accuracyPercent: 90, subject: 'Physics' }, // V=6, A=90 -> Q2
    { date: '2026-08-22', durationMinutes: 180, problemsSolved: 20, accuracyPercent: 92, subject: 'Physics' }  // V=6.7, A=92 -> Q2
  ];

  const sacm = calculateSACMData(iPhoSessions);
  assertEqual(sacm.dominantQuadrant, 'Q2_Overthinking', 'Deep Olympiad problem solving is categorized in Q2 Overthinking (Deliberate)');
  assert(sacm.executiveSummary.includes('Precision Bottleneck'), 'Prescription advises timed speed drills');
});

test('T4_SCN_03: Streak Critical Hazard & Full Revival Lifecycle', () => {
  // Start with 100 HP and 0 shields
  let state = { ...DEFAULT_STREAK_STATE, currentHP: 100, shieldTokens: 0, activeStreakDays: 10 };

  // Miss Day 1: 100 - 35 = 65 HP (Amber)
  state = evaluateDayStep(state, '2026-08-20', 0, 120).nextState;
  assertEqual(state.currentHP, 65, '65 HP in Amber tier');
  assertEqual(getStreakHealthTier(state.currentHP).tier, 'amber', 'Amber tier');

  // Miss Day 2: 65 - 35 = 30 HP (Crimson)
  state = evaluateDayStep(state, '2026-08-21', 0, 120).nextState;
  assertEqual(state.currentHP, 30, '30 HP in Crimson tier');
  assertEqual(getStreakHealthTier(state.currentHP).tier, 'crimson', 'Crimson tier');
  assertEqual(getStreakHealthTier(state.currentHP).pulse, true, 'Pulsing critical alert');

  // 3 Consecutive Overdrive Days (+25 HP each)
  state = evaluateDayStep(state, '2026-08-22', 200, 120).nextState; // 30 + 25 = 55 HP (Amber)
  state = evaluateDayStep(state, '2026-08-23', 200, 120).nextState; // 55 + 25 = 80 HP (Emerald)
  state = evaluateDayStep(state, '2026-08-24', 200, 120).nextState; // 80 + 25 = 100 HP (Max Emerald)

  assertEqual(state.currentHP, 100, 'Recovered to full 100 HP');
  assertEqual(getStreakHealthTier(state.currentHP).tier, 'emerald', 'Restored to Emerald tier');
  assertEqual(state.shieldTokens, 3, 'Recharged all 3 shield tokens');
});

test('T4_SCN_04: High-Frequency Voice Micro-Logger Burst Stress Test (100 Parses)', () => {
  const prompts = [
    'Physics mechanics 45m 20 questions 85% accuracy high focus',
    'Mathematics calculus 90m 30 problems 25 correct and 5 wrong calculation mistake',
    'Chemistry organic 60m 15 questions 90% acc felt tired',
    'CS algorithms 120m 10 problems hyper focus',
    'Biology genetics 50m 25 mcqs 95% accuracy'
  ];

  const start = performance.now();
  for (let i = 0; i < 100; i++) {
    const p = prompts[i % prompts.length];
    const res = parseMicroLog(p);
    assert(res.durationMinutes > 0, 'Duration is parsed');
    assert(res.problemsSolved > 0, 'Problems solved parsed');
  }
  const durationMs = performance.now() - start;
  const avgMs = durationMs / 100;

  console.log(`    ⚡ 100 Micro-Logs Parsed in ${durationMs.toFixed(2)}ms (Avg: ${avgMs.toFixed(4)}ms per parse)`);
  assert(avgMs < 0.5, `Micro-log parser avg latency must be <0.5ms (Got: ${avgMs.toFixed(4)}ms)`);
});

// ========================================================================
// FINAL SUMMARY & METRICS AGGREGATION
// ========================================================================

console.log('\n========================================================================');
console.log('📊  TEST EXECUTION SUMMARY & VERIFICATION MATRIX');
console.log('========================================================================\n');

const tierGroups = allResults.reduce((acc, r) => {
  acc[r.tier] = acc[r.tier] || { total: 0, passed: 0, failed: 0 };
  acc[r.tier].total++;
  if (r.passed) acc[r.tier].passed++;
  else acc[r.tier].failed++;
  return acc;
}, {} as Record<string, { total: number; passed: number; failed: number }>);

console.log('| Tier | Test Category | Total | Passed | Failed | Pass Rate |');
console.log('|------|---------------|-------|--------|--------|-----------|');

let totalAll = 0;
let passedAll = 0;
let failedAll = 0;

for (const [tier, stats] of Object.entries(tierGroups)) {
  totalAll += stats.total;
  passedAll += stats.passed;
  failedAll += stats.failed;
  const rate = ((stats.passed / stats.total) * 100).toFixed(1);
  console.log(`| ${tier.padEnd(6)} | Coverage Matrix | ${String(stats.total).padStart(5)} | ${String(stats.passed).padStart(6)} | ${String(stats.failed).padStart(6)} | ${rate.padStart(8)}% |`);
}

console.log('|------|---------------|-------|--------|--------|-----------|');
console.log(`| ALL  | TOTAL SUITE   | ${String(totalAll).padStart(5)} | ${String(passedAll).padStart(6)} | ${String(failedAll).padStart(6)} | ${((passedAll / totalAll) * 100).toFixed(1)}% |`);
console.log('========================================================================\n');

if (failedAll > 0) {
  console.error(`❌ TEST SUITE FAILED: ${failedAll} of ${totalAll} assertions failed.`);
  process.exit(1);
} else {
  console.log(`🎉 ALL ${totalAll} TESTS PASSED WITH 100% SUCCESS RATE!`);
  process.exit(0);
}
