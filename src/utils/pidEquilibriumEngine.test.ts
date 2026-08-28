/**
 * Savantix (Aegis) — Unit Tests for Dynamic Subject Equilibrium & PID Allocator Engine
 */

import {
  calculateSubjectEquilibrium,
  normalizeSubjectName,
  normalizeWeights,
  loadTargetWeights,
  saveTargetWeights,
  resetTargetWeights,
  DEFAULT_TARGET_WEIGHTS,
  PID_GAINS
} from './pidEquilibriumEngine';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

console.log('--- Testing Dynamic Subject Equilibrium Matrix & PID Allocator Engine ---');

// Test 1: normalizeSubjectName
const activeSubjects = ['Physics', 'Mathematics', 'Chemistry'];
assert(normalizeSubjectName('physics', activeSubjects) === 'Physics', 'physics -> Physics');
assert(normalizeSubjectName('MATHEMATICS', activeSubjects) === 'Mathematics', 'MATHEMATICS -> Mathematics');
assert(normalizeSubjectName('Chemistry', activeSubjects) === 'Chemistry', 'Chemistry -> Chemistry');
assert(normalizeSubjectName('phy mechanics', activeSubjects) === 'Physics', 'phy mechanics -> Physics');
assert(normalizeSubjectName('Calculus Integration', activeSubjects) === 'Mathematics', 'Calculus Integration -> Mathematics');
assert(normalizeSubjectName('Organic Reactions', activeSubjects) === 'Chemistry', 'Organic Reactions -> Chemistry');
assert(normalizeSubjectName('', activeSubjects) === 'Physics', 'empty fallback');
console.log('✓ normalizeSubjectName passed');

// Test 2: normalizeWeights
const inputWeights = { Physics: 40, Mathematics: 40, Chemistry: 20 };
const normalized = normalizeWeights(inputWeights);
assert(Math.abs(normalized.Physics - 0.40) < 0.01, 'Physics normalized to 0.40');
assert(Math.abs(normalized.Mathematics - 0.40) < 0.01, 'Math normalized to 0.40');
assert(Math.abs(normalized.Chemistry - 0.20) < 0.01, 'Chem normalized to 0.20');
const sumWeights = Object.values(normalized).reduce((a, b) => a + b, 0);
assert(Math.abs(sumWeights - 1.0) < 0.001, 'Normalized weights sum to 1.0');
console.log('✓ normalizeWeights passed');

// Test 3: Empty logs handling
const emptyReport = calculateSubjectEquilibrium([]);
assert(emptyReport.equilibriumScore === 100, 'Empty logs give 100% score');
assert(emptyReport.status === 'harmonious', 'Empty logs status is harmonious');
assert(emptyReport.totalMinutes7Days === 0, 'Total minutes is 0');
assert(emptyReport.actionablePrescription.includes('No study logs found'), 'Correct empty prescription');
console.log('✓ Empty logs handling passed');

// Test 4: Perfect Parity Equilibrium (Equal time for 3 subjects)
const parityLogs = [
  { date: '2026-08-20', subject: 'Physics', durationMinutes: 120 },
  { date: '2026-08-21', subject: 'Mathematics', durationMinutes: 120 },
  { date: '2026-08-22', subject: 'Chemistry', durationMinutes: 120 }
];
const uniformWeights = { Physics: 1/3, Mathematics: 1/3, Chemistry: 1/3 };
const parityReport = calculateSubjectEquilibrium(parityLogs, uniformWeights);
assert(parityReport.equilibriumScore >= 98, `Parity score ${parityReport.equilibriumScore} >= 98`);
assert(parityReport.status === 'harmonious', 'Parity status is harmonious');
console.log('✓ Perfect parity Shannon Entropy passed');

// Test 5: Severe Skew / Neglect Detection
const skewedLogs = [
  { date: '2026-08-20', subject: 'Physics', durationMinutes: 600 },
  { date: '2026-08-21', subject: 'Physics', durationMinutes: 600 },
  { date: '2026-08-22', subject: 'Mathematics', durationMinutes: 300 }
  // Chemistry 0
];
const skewedReport = calculateSubjectEquilibrium(skewedLogs, { Physics: 0.35, Mathematics: 0.35, Chemistry: 0.30 });
assert(skewedReport.equilibriumScore < 75, `Skewed score ${skewedReport.equilibriumScore} < 75`);
assert(skewedReport.status === 'severe_neglect', 'Status is severe_neglect');
assert(skewedReport.neglectedSubjects.length > 0, 'Neglected subjects detected');
assert(skewedReport.actionablePrescription.includes('Chemistry'), 'Prescription names neglected Chemistry');
console.log('✓ Severe skew / neglect detection passed');

// Test 6: Discrete PID Output Calculation & Clamping [-60, +90]
const extremeLogs = [
  { date: '2026-08-20', subject: 'Physics', durationMinutes: 1000 }
];
const extremeReport = calculateSubjectEquilibrium(extremeLogs, { Physics: 0.35, Mathematics: 0.35, Chemistry: 0.30 });
extremeReport.subjectDistributions.forEach(d => {
  assert(d.recommendedDailyAdjustmentMins >= PID_GAINS.minClamp, `Adjustment >= ${PID_GAINS.minClamp}`);
  assert(d.recommendedDailyAdjustmentMins <= PID_GAINS.maxClamp, `Adjustment <= ${PID_GAINS.maxClamp}`);
});
const chemDist = extremeReport.subjectDistributions.find(d => d.subject === 'Chemistry');
const phyDist = extremeReport.subjectDistributions.find(d => d.subject === 'Physics');
assert(chemDist?.recommendedDailyAdjustmentMins === 45, `Chemistry gets PID output +45 mins (got ${chemDist?.recommendedDailyAdjustmentMins})`);
assert(phyDist?.recommendedDailyAdjustmentMins === PID_GAINS.minClamp, `Physics gets clamped min ${PID_GAINS.minClamp}`);

// Test upper clamp with high error
const highErrorReport = calculateSubjectEquilibrium(extremeLogs, { Physics: 0.20, Mathematics: 0.10, Chemistry: 0.70 });
const chemHighDist = highErrorReport.subjectDistributions.find(d => d.subject === 'Chemistry');
assert(chemHighDist?.recommendedDailyAdjustmentMins === PID_GAINS.maxClamp, `High deficit Chemistry clamped to max +90 mins`);
console.log('✓ Discrete PID clamping [-60, +90] and exact output passed');

// Test 7: Natural Language Prescription Formatting
const realisticLogs = [
  { date: '2026-08-20', subject: 'Physics', durationMinutes: 300 },
  { date: '2026-08-21', subject: 'Mathematics', durationMinutes: 300 },
  { date: '2026-08-22', subject: 'Chemistry', durationMinutes: 60 }
];
const realisticReport = calculateSubjectEquilibrium(realisticLogs, { Physics: 0.35, Mathematics: 0.35, Chemistry: 0.30 });
assert(realisticReport.actionablePrescription.includes('Chemistry'), 'Prescription mentions Chemistry');
assert(realisticReport.actionablePrescription.includes('deficit'), 'Prescription mentions deficit');
assert(realisticReport.actionablePrescription.includes('Prescribed tomorrow:'), 'Prescription contains Prescribed tomorrow:');
console.log('✓ Natural language prescription formatting passed');

console.log('--- All Dynamic Subject Equilibrium Engine Tests Passed! ---');

