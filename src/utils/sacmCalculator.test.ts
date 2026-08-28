/**
 * Unit Tests for Speed vs Accuracy Calibration Matrix (SACM) Engine
 */

import {
  calculateSACMData,
  classifyQuadrant,
  extractAccuracy,
  DEFAULT_VELOCITY_THRESHOLD,
  DEFAULT_ACCURACY_THRESHOLD
} from './sacmCalculator';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

console.log('--- Testing SACM Calculator Engine ---');

// Test 1: Classify Quadrants
assert(classifyQuadrant(20, 90) === 'Q1_Mastery', '20 Q/hr, 90% should be Q1');
assert(classifyQuadrant(10, 90) === 'Q2_Overthinking', '10 Q/hr, 90% should be Q2');
assert(classifyQuadrant(20, 70) === 'Q3_Rushing', '20 Q/hr, 70% should be Q3');
assert(classifyQuadrant(10, 70) === 'Q4_Struggling', '10 Q/hr, 70% should be Q4');
console.log('✓ Quadrant classification passed');

// Test 2: Accuracy Extraction
assert(extractAccuracy({ accuracyPercent: 95 }) === 95, 'extract explicit accuracyPercent');
assert(extractAccuracy({ efficiencyScore: 8 }) === 80, 'extract from efficiencyScore * 10');
assert(extractAccuracy({ focusScore: 10 }) === 90, 'extract from focusScore');
assert(extractAccuracy({}) === 80, 'fallback accuracy');
console.log('✓ Accuracy extraction passed');

// Test 3: Empty sessions handling
const emptyReport = calculateSACMData([]);
assert(emptyReport.totalSessionsEvaluated === 0, 'Empty report has 0 sessions');
assert(emptyReport.dataPoints.length === 0, 'Empty data points');
assert(emptyReport.dominantQuadrant === null, 'Dominant quadrant is null');
console.log('✓ Empty sessions handling passed');

// Test 4: Realistic Mock Sessions
const mockSessions = [
  // Session 1: 60 mins, 20 problems, 90% acc => V = 20 Q/hr, Acc = 90% => Q1
  {
    id: 's1',
    date: '2026-08-20',
    subject: 'Physics',
    topic: 'Rotational Mechanics',
    durationMinutes: 60,
    problemsSolved: 20,
    accuracyPercent: 90
  },
  // Session 2: 90 mins, 10 problems, 85% acc => V = 6.67 Q/hr, Acc = 85% => Q2
  {
    id: 's2',
    date: '2026-08-21',
    subject: 'Mathematics',
    topic: 'Definite Integration',
    durationMinutes: 90,
    problemsSolved: 10,
    accuracyPercent: 85
  },
  // Session 3: 45 mins, 18 problems, 60% acc => V = 24 Q/hr, Acc = 60% => Q3
  {
    id: 's3',
    date: '2026-08-22',
    subject: 'Chemistry',
    topic: 'Organic Reaction Mechanisms',
    durationMinutes: 45,
    problemsSolved: 18,
    accuracyPercent: 60
  },
  // Session 4: 60 mins, 8 problems, 50% acc => V = 8 Q/hr, Acc = 50% => Q4
  {
    id: 's4',
    date: '2026-08-23',
    subject: 'Physics',
    topic: 'Electromagnetism',
    durationMinutes: 60,
    problemsSolved: 8,
    accuracyPercent: 50
  }
];

const report = calculateSACMData(mockSessions);
assert(report.totalSessionsEvaluated === 4, 'Evaluated 4 sessions');
assert(report.totalProblemsSolved === 56, 'Total problems 56');
assert(report.totalStudyMinutes === 255, 'Total minutes 255');
assert(report.quadrants.Q1_Mastery.count === 1, 'Q1 count is 1');
assert(report.quadrants.Q2_Overthinking.count === 1, 'Q2 count is 1');
assert(report.quadrants.Q3_Rushing.count === 1, 'Q3 count is 1');
assert(report.quadrants.Q4_Struggling.count === 1, 'Q4 count is 1');
assert(report.subjectCalibrations.length === 3, '3 subjects identified (Physics, Math, Chem)');

console.log('✓ Realistic session calculations passed');
console.log('--- All SACM Engine Tests Succeeded! ---');
