import { parseMicroLog } from './microLogParser';

const testCases = [
  {
    input: "Did 45m Physics electrostatics 20 questions 85% accuracy",
    expected: {
      subject: "Physics",
      durationMinutes: 45,
      problemsSolved: 20,
      accuracyPercent: 85
    }
  },
  {
    input: "2h math integration solved 35 problems 28 correct 7 wrong torque confusion",
    expected: {
      subject: "Mathematics",
      durationMinutes: 120,
      problemsSolved: 35,
      accuracyPercent: 80
    }
  },
  {
    input: "1.5 hrs chemistry organic reaction mechanisms 15 numericals 90% acc felt tired",
    expected: {
      subject: "Chemistry",
      durationMinutes: 90,
      problemsSolved: 15,
      accuracyPercent: 90,
      energyMood: "Fatigued"
    }
  },
  {
    input: "Physics kinematics 50 mins 12 qs high focus",
    expected: {
      subject: "Physics",
      durationMinutes: 50,
      problemsSolved: 12,
      energyMood: "High Energy"
    }
  },
  {
    input: "CS algorithms 90m 5 problems hyper focus",
    expected: {
      subject: "Computer Science",
      durationMinutes: 90,
      problemsSolved: 5,
      energyMood: "Peak Flow",
      focusScore: 10
    }
  }
];

console.log("=== Testing parseMicroLog ===");
let passed = 0;
const start = performance.now();

testCases.forEach((tc, idx) => {
  const result = parseMicroLog(tc.input);
  console.log(`\nTest Case ${idx + 1}: "${tc.input}"`);
  console.log(`Parsed:`, JSON.stringify(result, null, 2));

  let ok = true;
  if (result.subject !== tc.expected.subject) {
    console.error(`Subject mismatch: expected ${tc.expected.subject}, got ${result.subject}`);
    ok = false;
  }
  if (result.durationMinutes !== tc.expected.durationMinutes) {
    console.error(`Duration mismatch: expected ${tc.expected.durationMinutes}, got ${result.durationMinutes}`);
    ok = false;
  }
  if (result.problemsSolved !== tc.expected.problemsSolved) {
    console.error(`Problems mismatch: expected ${tc.expected.problemsSolved}, got ${result.problemsSolved}`);
    ok = false;
  }
  if (tc.expected.accuracyPercent !== undefined && result.accuracyPercent !== tc.expected.accuracyPercent) {
    console.error(`Accuracy mismatch: expected ${tc.expected.accuracyPercent}, got ${result.accuracyPercent}`);
    ok = false;
  }
  if (tc.expected.energyMood !== undefined && result.energyMood !== tc.expected.energyMood) {
    console.error(`Energy mismatch: expected ${tc.expected.energyMood}, got ${result.energyMood}`);
    ok = false;
  }
  if (ok) passed++;
});

const totalTime = performance.now() - start;
console.log(`\nResults: ${passed}/${testCases.length} passed in ${totalTime.toFixed(3)}ms (avg ${(totalTime / testCases.length).toFixed(4)}ms per parse)`);
