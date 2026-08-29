/**
 * Savantix (Aegis) — Adversarial Stress Test Suite: State Persistence & Integration
 * Challenger 2 Verification Harness
 */

import {
  loadFlowmodoroConfig,
  saveFlowmodoroConfig,
  calculateDynamicBreak,
  getFlowStage,
  DEFAULT_FLOWMODORO_CONFIG,
  STORAGE_KEY_FLOWMODORO_CONFIG
} from "../src/utils/flowmodoroEngine.ts";

import {
  loadElasticStreakState,
  saveElasticStreakState,
  evaluateElasticStreak,
  evaluateDayStep,
  recomputeStreakFromHistory,
  aggregateLogsByDate,
  getStreakHealthTier,
  getShieldTokenRack,
  getAntiFragileStreakBadge,
  DEFAULT_STREAK_STATE,
  STORAGE_KEY_STREAK_RESILIENCE,
  MAX_HP,
  MAX_SHIELD_TOKENS
} from "../src/utils/streakResilienceEngine.ts";

import {
  loadTargetWeights,
  saveTargetWeights,
  resetTargetWeights,
  normalizeWeights,
  normalizeSubjectName,
  calculateSubjectEquilibrium,
  DEFAULT_TARGET_WEIGHTS,
  STORAGE_KEY_PID_WEIGHTS,
  PID_GAINS
} from "../src/utils/pidEquilibriumEngine.ts";

import {
  calculateSACMData,
  classifyQuadrant,
  extractAccuracy,
  DEFAULT_VELOCITY_THRESHOLD,
  DEFAULT_ACCURACY_THRESHOLD
} from "../src/utils/sacmCalculator.ts";

import {
  parseMicroLog
} from "../src/utils/microLogParser.ts";

// Mock localStorage for Node.js environment
class MockLocalStorage {
  private store: Map<string, string> = new Map();
  public shouldThrow: boolean = false;

  getItem(key: string): string | null {
    if (this.shouldThrow) throw new Error("QuotaExceededError: LocalStorage quota exceeded or storage disabled");
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    if (this.shouldThrow) throw new Error("QuotaExceededError: LocalStorage quota exceeded or storage disabled");
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    if (this.shouldThrow) throw new Error("QuotaExceededError");
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get length(): number {
    return this.store.size;
  }
}

const mockStorage = new MockLocalStorage();
(global as any).localStorage = mockStorage;
(global as any).window = { localStorage: mockStorage };

// -------------------------------------------------------------
// Test Runner Harness
// -------------------------------------------------------------
interface StressTestResult {
  category: string;
  testId: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
  details?: string;
}

const results: StressTestResult[] = [];
let activeCategory = "General";

function setCategory(cat: string) {
  activeCategory = cat;
}

function runStressTest(testId: string, name: string, fn: () => void) {
  const start = performance.now();
  try {
    fn();
    const durationMs = performance.now() - start;
    results.push({
      category: activeCategory,
      testId,
      name,
      passed: true,
      durationMs
    });
    console.log(`  ✓ [PASS] [${testId}] ${name} (${durationMs.toFixed(3)}ms)`);
  } catch (err: any) {
    const durationMs = performance.now() - start;
    results.push({
      category: activeCategory,
      testId,
      name,
      passed: false,
      durationMs,
      error: err?.message || String(err)
    });
    console.error(`  ✗ [FAIL] [${testId}] ${name} (${durationMs.toFixed(3)}ms)`);
    console.error(`    Details: ${err?.message || err}`);
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

function assertEqual<T>(actual: T, expected: T, msg: string) {
  if (actual !== expected) {
    throw new Error(`${msg} -> Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)}`);
  }
}

console.log("\n========================================================================");
console.log("⚡ ADVERSARIAL STRESS TEST SUITE: SAVANTIX AEGIS PERSISTENCE & INTEGRATION");
console.log("========================================================================\n");

// ========================================================================
// 1. LOCALSTORAGE CORRUPTION & SCHEMA UPGRADE INJECTIONS
// ========================================================================
setCategory("1. LocalStorage Schema & Corruption Resilience");

runStressTest("LS-01", "Flowmodoro Config: Handles corrupted JSON gracefully", () => {
  mockStorage.setItem(STORAGE_KEY_FLOWMODORO_CONFIG, "{malformed_json: 123, invalid");
  const cfg = loadFlowmodoroConfig();
  assertEqual(cfg.focusToBreakRatio, DEFAULT_FLOWMODORO_CONFIG.focusToBreakRatio, "Fallback focusToBreakRatio");
  assertEqual(cfg.minBreakMinutes, DEFAULT_FLOWMODORO_CONFIG.minBreakMinutes, "Fallback minBreakMinutes");
  assertEqual(cfg.maxBreakMinutes, DEFAULT_FLOWMODORO_CONFIG.maxBreakMinutes, "Fallback maxBreakMinutes");
});

runStressTest("LS-02", "Flowmodoro Config: Handles null, empty string, and primitive values", () => {
  mockStorage.setItem(STORAGE_KEY_FLOWMODORO_CONFIG, "");
  assertEqual(loadFlowmodoroConfig().focusToBreakRatio, 5, "Empty string returns default");

  mockStorage.setItem(STORAGE_KEY_FLOWMODORO_CONFIG, "12345");
  assertEqual(loadFlowmodoroConfig().focusToBreakRatio, 5, "Number returns default");

  mockStorage.setItem(STORAGE_KEY_FLOWMODORO_CONFIG, "\"a plain string\"");
  assertEqual(loadFlowmodoroConfig().focusToBreakRatio, 5, "String returns default");

  mockStorage.setItem(STORAGE_KEY_FLOWMODORO_CONFIG, "true");
  assertEqual(loadFlowmodoroConfig().focusToBreakRatio, 5, "Boolean returns default");

  mockStorage.setItem(STORAGE_KEY_FLOWMODORO_CONFIG, "[1,2,3]");
  assertEqual(loadFlowmodoroConfig().focusToBreakRatio, 5, "Array returns default");
});

runStressTest("LS-03", "Flowmodoro Config: Handles partial schema and non-numeric string values", () => {
  mockStorage.setItem(STORAGE_KEY_FLOWMODORO_CONFIG, JSON.stringify({
    focusToBreakRatio: "not-a-number",
    minBreakMinutes: "10",
    autoStartEarnedBreak: true
  }));
  const cfg = loadFlowmodoroConfig();
  assertEqual(cfg.focusToBreakRatio, DEFAULT_FLOWMODORO_CONFIG.focusToBreakRatio, "NaN ratio falls back to default");
  assertEqual(cfg.minBreakMinutes, 10, "Numeric string minBreak parsed to number");
  assertEqual(cfg.maxBreakMinutes, DEFAULT_FLOWMODORO_CONFIG.maxBreakMinutes, "Missing maxBreak defaults");
  assertEqual(cfg.autoStartEarnedBreak, true, "Boolean parsed");
});

runStressTest("LS-04", "Streak Resilience: Handles corrupt JSON and truncated data", () => {
  mockStorage.setItem(STORAGE_KEY_STREAK_RESILIENCE, "{\"currentHP\": 50, \"shieldTokens\": 2, \"history\": [");
  const state = loadElasticStreakState();
  assertEqual(state.currentHP, 100, "Corrupt JSON falls back to default 100 HP");
  assertEqual(state.shieldTokens, 2, "Default shields returned");
  assert(Array.isArray(state.history), "History is an array");
});

runStressTest("LS-05", "Streak Resilience: Clamps out-of-range HP and Shield values", () => {
  mockStorage.setItem(STORAGE_KEY_STREAK_RESILIENCE, JSON.stringify({
    currentHP: 99999,
    shieldTokens: -50,
    activeStreakDays: "25",
    longestStreakDays: -10,
    targetMinutesDaily: "abc",
    history: "not an array"
  }));
  const state = loadElasticStreakState();
  assertEqual(state.currentHP, 100, "HP clamped to MAX_HP (100)");
  assertEqual(state.shieldTokens, 0, "Negative shield tokens clamped to 0");
  assertEqual(state.activeStreakDays, 25, "String streak converted to number");
  assertEqual(state.longestStreakDays, 0, "Negative longest streak clamped to 0");
  assertEqual(state.targetMinutesDaily, 120, "Invalid target minutes defaults to 120");
  assert(Array.isArray(state.history) && state.history.length === 0, "Invalid history defaults to empty array");
});

runStressTest("LS-06", "PID Weights: Handles corrupted JSON and non-object values", () => {
  mockStorage.setItem(STORAGE_KEY_PID_WEIGHTS, "<<<invalid_json>>>");
  const weights = loadTargetWeights();
  assertEqual(weights.Physics, DEFAULT_TARGET_WEIGHTS.Physics, "Physics default");
  assertEqual(weights.Mathematics, DEFAULT_TARGET_WEIGHTS.Mathematics, "Math default");
  assertEqual(weights.Chemistry, DEFAULT_TARGET_WEIGHTS.Chemistry, "Chem default");
});

runStressTest("LS-07", "PID Weights: Normalizes chaotic, zero, and unnormalized weights", () => {
  const zeroWeights = normalizeWeights({ Physics: 0, Mathematics: 0, Chemistry: 0 });
  assert(Math.abs(zeroWeights.Physics - 1/3) < 0.01, "Zero weights split uniformly");
  assert(Math.abs(zeroWeights.Mathematics - 1/3) < 0.01, "Zero weights split uniformly");

  const bigWeights = normalizeWeights({ Physics: 300, Mathematics: 100 });
  assertEqual(bigWeights.Physics, 0.75, "300/(300+100) = 0.75");
  assertEqual(bigWeights.Mathematics, 0.25, "100/(300+100) = 0.25");

  const negWeights = normalizeWeights({ Physics: -50, Mathematics: 50, Chemistry: 50 });
  assertEqual(negWeights.Physics, 0, "Negative weight normalized to 0");
  assertEqual(negWeights.Mathematics, 0.5, "50/100 = 0.5");
  assertEqual(negWeights.Chemistry, 0.5, "50/100 = 0.5");
});

runStressTest("LS-08", "LocalStorage Storage Exception Resilience (QuotaExceeded / Disabled)", () => {
  mockStorage.shouldThrow = true;
  try {
    const cfg = loadFlowmodoroConfig();
    assertEqual(cfg.focusToBreakRatio, 5, "Fallback config on storage error");
    saveFlowmodoroConfig(cfg);
    
    const streak = loadElasticStreakState();
    assertEqual(streak.currentHP, 100, "Fallback streak on storage error");
    saveElasticStreakState(streak);

    const weights = loadTargetWeights();
    assertEqual(weights.Physics, DEFAULT_TARGET_WEIGHTS.Physics, "Fallback weights on error");
    saveTargetWeights(weights);
  } finally {
    mockStorage.shouldThrow = false;
  }
});

// ========================================================================
// 2. CHAOTIC ADVERSARIAL INPUTS & MICRO-LOG PARSER STRESS
// ========================================================================
setCategory("2. Adversarial Micro-Log Parser Stress");

runStressTest("NLP-01", "Handles SQL injection, XSS, and script tags safely", () => {
  const xssInput = "<script>alert(1)</script> SELECT * FROM users; Physics kinematics 45m 15 questions 90% acc";
  const res = parseMicroLog(xssInput);
  assertEqual(res.subject, "Physics", "Parsed Physics despite injected code");
  assertEqual(res.durationMinutes, 45, "Parsed 45 mins");
  assertEqual(res.problemsSolved, 15, "Parsed 15 questions");
  assertEqual(res.accuracyPercent, 90, "Parsed 90% accuracy");
});

runStressTest("NLP-02", "Handles 10,000 character massive string flood without crash or slowdown", () => {
  const padding = "lorem ipsum dolor sit amet ".repeat(400);
  const massiveInput = `${padding} did 2 hours chemistry organic reaction mechanisms solved 50 problems 80% accuracy ${padding}`;
  const start = performance.now();
  const res = parseMicroLog(massiveInput);
  const dur = performance.now() - start;
  assertEqual(res.subject, "Chemistry", "Detected Chemistry");
  assertEqual(res.durationMinutes, 120, "Parsed 2 hours = 120 mins");
  assertEqual(res.problemsSolved, 50, "Parsed 50 problems");
  assertEqual(res.accuracyPercent, 80, "Parsed 80% accuracy");
  assert(dur < 25, `Execution took ${dur.toFixed(2)}ms (< 25ms SLA)`);
});

runStressTest("NLP-03", "Handles extreme and conflicting numbers (negative, zero, massive numbers)", () => {
  const crazyInput = "studied for -30 minutes solved 99999999 questions 200% accuracy in Mathematics";
  const res = parseMicroLog(crazyInput);
  assertEqual(res.subject, "Mathematics", "Subject is Math");
  assert(res.durationMinutes >= 1 && res.durationMinutes <= 1440, "Duration bounded between 1 and 1440");
  assertEqual(res.problemsSolved, 99999999, "Problems solved parsed");
  assert(res.accuracyPercent !== null && res.accuracyPercent <= 100, "Accuracy clamped <= 100%");
});

runStressTest("NLP-04", "Handles multi-subject collision keywords (e.g. Physical Chemistry vs Physics)", () => {
  const res = parseMicroLog("45m physical chemistry thermodynamics equilibrium 20 problems 90%");
  assertEqual(res.subject, "Chemistry", "Physical Chemistry attributed to Chemistry (longer match prioritized)");
});

runStressTest("NLP-05", "Handles zero-width characters, emojis, and odd unicode", () => {
  const unicodeInput = "🔥⚡ Did 1.5h \u200B\u200C\u200D Physics rotation 25 questions \uFEFF accuracy: 92% mistakes: sign error";
  const res = parseMicroLog(unicodeInput);
  assertEqual(res.subject, "Physics", "Physics detected");
  assertEqual(res.durationMinutes, 90, "1.5h = 90 mins");
  assertEqual(res.problemsSolved, 25, "25 questions");
  assertEqual(res.accuracyPercent, 92, "92% accuracy");
  assert(res.mistakes.some(m => m.toLowerCase().includes("sign error")), "Mistake extracted");
});

runStressTest("NLP-06", "Fractions and ratio accuracy parsing (\"18/20 right\", \"24 correct and 6 wrong\")", () => {
  const res1 = parseMicroLog("Mathematics algebra 18/20 correct 45 mins");
  assertEqual(res1.subject, "Mathematics", "Subject Math");
  assertEqual(res1.accuracyPercent, 90, "18/20 = 90%");
  assertEqual(res1.problemsSolved, 20, "20 total problems from fraction");

  const res2 = parseMicroLog("Physics optics 24 correct and 6 wrong 60 mins");
  assertEqual(res2.subject, "Physics", "Subject Physics");
  assertEqual(res2.accuracyPercent, 80, "24/(24+6) = 80%");
  assertEqual(res2.problemsSolved, 30, "30 total problems");
});

// ========================================================================
// 3. SACM CALIBRATION MATRIX BOUNDARIES & INVARIANTS
// ========================================================================
setCategory("3. SACM Calibration Pipeline Invariant Stress");

runStressTest("SACM-01", "Handles empty, null, undefined, and corrupt session arrays", () => {
  const r1 = calculateSACMData([]);
  assertEqual(r1.totalSessionsEvaluated, 0, "0 sessions for empty array");
  assertEqual(r1.dominantQuadrant, null, "No dominant quadrant");
  assertEqual(r1.quadrantList.length, 4, "4 quadrants defined");

  const r2 = calculateSACMData([null as any, undefined as any, {} as any]);
  assertEqual(r2.totalSessionsEvaluated, 1, "Evaluated 1 non-null object");
  assertEqual(r2.quadrants.Q1_Mastery.count + r2.quadrants.Q2_Overthinking.count + r2.quadrants.Q3_Rushing.count + r2.quadrants.Q4_Struggling.count, 1, "Buckets sum to 1");
});

runStressTest("SACM-02", "Invariant: Quadrant counts and percentages sum strictly to total sessions", () => {
  const sessions = [
    { id: "1", durationMinutes: 60, problemsSolved: 30, accuracyPercent: 95 },
    { id: "2", durationMinutes: 60, problemsSolved: 5, accuracyPercent: 90 },
    { id: "3", durationMinutes: 60, problemsSolved: 25, accuracyPercent: 60 },
    { id: "4", durationMinutes: 60, problemsSolved: 6, accuracyPercent: 50 },
    { id: "5", durationMinutes: 30, problemsSolved: 15, accuracyPercent: 85 }
  ];
  const report = calculateSACMData(sessions);
  assertEqual(report.totalSessionsEvaluated, 5, "Total 5 sessions");
  assertEqual(report.quadrants.Q1_Mastery.count, 2, "2 in Q1");
  assertEqual(report.quadrants.Q2_Overthinking.count, 1, "1 in Q2");
  assertEqual(report.quadrants.Q3_Rushing.count, 1, "1 in Q3");
  assertEqual(report.quadrants.Q4_Struggling.count, 1, "1 in Q4");
  assertEqual(report.dominantQuadrant, "Q1_Mastery", "Dominant is Q1");

  const sumPct = report.quadrantList.reduce((acc, q) => acc + q.percentage, 0);
  assertEqual(sumPct, 100, "Percentages sum to 100%");
});

runStressTest("SACM-03", "Extreme velocity and duration sessions do not generate NaN or Infinity", () => {
  const extremeSessions = [
    { durationMinutes: 0, problemsSolved: 0, accuracyPercent: 0 },
    { durationMinutes: 1, problemsSolved: 10000, accuracyPercent: 100 },
    { durationMinutes: 10000, problemsSolved: 1, accuracyPercent: 100 },
    { durationMinutes: 60, problemsSolved: 0, efficiencyScore: 0 }
  ];
  const report = calculateSACMData(extremeSessions);
  assert(!isNaN(report.overallAvgVelocity) && isFinite(report.overallAvgVelocity), "Avg velocity is finite");
  assert(!isNaN(report.overallAvgAccuracy) && isFinite(report.overallAvgAccuracy), "Avg accuracy is finite");
  assert(!isNaN(report.overallAvgTimePerQuestion) && isFinite(report.overallAvgTimePerQuestion), "Avg time/Q is finite");
});

runStressTest("SACM-04", "Extract accuracy fallback sequence verification", () => {
  assertEqual(extractAccuracy({ accuracyPercent: 95 }), 95, "Direct accuracyPercent");
  assertEqual(extractAccuracy({ accuracy: 88 }), 88, "Fallback to accuracy field");
  assertEqual(extractAccuracy({ efficiencyScore: 9 }), 90, "Fallback to efficiencyScore * 10");
  assertEqual(extractAccuracy({ focusScore: 10 }), 90, "Fallback to focusScore * 9");
  assertEqual(extractAccuracy({}), 80, "Default baseline 80%");
  assertEqual(extractAccuracy(null), 80, "Null returns 80%");
});

// ========================================================================
// 4. SHANNON ENTROPY & PID EQUILIBRIUM ALLOCATOR INVARIANTS
// ========================================================================
setCategory("4. Shannon Entropy & PID Allocator Invariant Stress");

runStressTest("PID-01", "Shannon Entropy Bounds: Must be exactly in [0, 100%]", () => {
  const monopolyLogs = [{ subject: "Physics", durationMinutes: 600, date: "2026-08-28" }];
  const monopolyReport = calculateSubjectEquilibrium(monopolyLogs, DEFAULT_TARGET_WEIGHTS);
  assertEqual(monopolyReport.equilibriumScore, 0, "Monopoly has 0% entropy");
  assertEqual(monopolyReport.status, "severe_neglect", "Severe neglect triggered");

  const equalLogs = [
    { subject: "Physics", durationMinutes: 100, date: "2026-08-28" },
    { subject: "Mathematics", durationMinutes: 100, date: "2026-08-28" },
    { subject: "Chemistry", durationMinutes: 100, date: "2026-08-28" }
  ];
  const equalReport = calculateSubjectEquilibrium(equalLogs, { Physics: 0.3333, Mathematics: 0.3333, Chemistry: 0.3334 });
  assertEqual(equalReport.equilibriumScore, 100, "Equal split has 100% normalized entropy");
  assertEqual(equalReport.status, "harmonious", "Harmonious status");
});

runStressTest("PID-02", "PID Output Clamping: Corrections strictly confined to [-60m, +90m]", () => {
  const neglectedLogs = [
    { subject: "Physics", durationMinutes: 1200, date: "2026-08-27" },
    { subject: "Physics", durationMinutes: 1200, date: "2026-08-28" }
  ];
  const report = calculateSubjectEquilibrium(neglectedLogs, DEFAULT_TARGET_WEIGHTS);
  for (const dist of report.subjectDistributions) {
    assert(
      dist.recommendedDailyAdjustmentMins >= PID_GAINS.minClamp &&
      dist.recommendedDailyAdjustmentMins <= PID_GAINS.maxClamp,
      `Adjustment for ${dist.subject} (${dist.recommendedDailyAdjustmentMins}m) within [${PID_GAINS.minClamp}, ${PID_GAINS.maxClamp}]`
    );
  }
  // Formula check: Error = 0.35 - 0 = 0.35. P = 120*0.35 = 42, I = 30*0.35 = 10.5, D = 0 -> Total = 53 mins
  assertEqual(report.dailyAdjustments["Mathematics"], 53, "Math correction calculated correctly");
  assertEqual(report.dailyAdjustments["Physics"], -60, "Over-allocated Physics clamped at -60m");
});

runStressTest("PID-03", "Compound subjects split and attributed proportionally without crash", () => {
  const compoundLogs = [
    { subject: "Physics and Mathematics", durationMinutes: 120, date: "2026-08-28" },
    { subject: "Chemistry & Mathematics", durationMinutes: 60, date: "2026-08-28" }
  ];
  const report = calculateSubjectEquilibrium(compoundLogs, DEFAULT_TARGET_WEIGHTS);
  assertEqual(report.totalMinutes7Days, 180, "120 + 60 = 180 minutes total");
  const phyDist = report.subjectDistributions.find(d => d.subject === "Physics")!;
  const mathDist = report.subjectDistributions.find(d => d.subject === "Mathematics")!;
  const chemDist = report.subjectDistributions.find(d => d.subject === "Chemistry")!;
  assertEqual(phyDist.actualMinutes, 60, "60m attributed to Physics");
  assertEqual(mathDist.actualMinutes, 90, "60m + 30m = 90m attributed to Mathematics");
  assertEqual(chemDist.actualMinutes, 30, "30m attributed to Chemistry");
});

runStressTest("PID-04", "Fuzzy subject normalization across aliases and keyword ontologies", () => {
  const activeSubs = ["Physics", "Mathematics", "Chemistry"];
  assertEqual(normalizeSubjectName("phy", activeSubs), "Physics", "phy -> Physics");
  assertEqual(normalizeSubjectName("calculus", activeSubs), "Mathematics", "calculus -> Mathematics");
  assertEqual(normalizeSubjectName("organic chem", activeSubs), "Chemistry", "organic chem -> Chemistry");
  assertEqual(normalizeSubjectName("Unknown Subject", activeSubs), "Unknown Subject", "Unknown subject retained cleanly");
});

// ========================================================================
// 5. ELASTIC STREAK & SHIELD TOKEN TEMPORAL SIMULATIONS
// ========================================================================
setCategory("5. Elastic Streak Health & Shield Temporal Lifecycle");

runStressTest("STR-01", "Multi-day Gap: 2 Shields defend 2 missed days, 3rd missed day causes -35 HP decay", () => {
  let state = { ...DEFAULT_STREAK_STATE, shieldTokens: 2, currentHP: 100, activeStreakDays: 10, lastEvaluatedDate: "2026-08-01" };
  
  const d1 = evaluateDayStep(state, "2026-08-02", 0, 120);
  assertEqual(d1.nextState.shieldTokens, 1, "Shields reduced from 2 to 1");
  assertEqual(d1.nextState.currentHP, 100, "HP protected at 100");
  assertEqual(d1.nextState.activeStreakDays, 10, "Streak preserved at 10");
  assertEqual(d1.historyEntry.status, "shield_defended", "Status is shield_defended");

  const d2 = evaluateDayStep(d1.nextState, "2026-08-03", 0, 120);
  assertEqual(d2.nextState.shieldTokens, 0, "Shields reduced from 1 to 0");
  assertEqual(d2.nextState.currentHP, 100, "HP protected at 100");
  assertEqual(d2.nextState.activeStreakDays, 10, "Streak preserved at 10");

  const d3 = evaluateDayStep(d2.nextState, "2026-08-04", 0, 120);
  assertEqual(d3.nextState.shieldTokens, 0, "0 shields");
  assertEqual(d3.nextState.currentHP, 65, "HP reduced to 65");
  assertEqual(d3.nextState.activeStreakDays, 10, "Streak maintained in degraded amber tier");

  const d4 = evaluateDayStep(d3.nextState, "2026-08-05", 0, 120);
  assertEqual(d4.nextState.currentHP, 30, "HP reduced to 30");
  assertEqual(getStreakHealthTier(d4.nextState.currentHP).tier, "crimson", "Crimson tier active");

  const d5 = evaluateDayStep(d4.nextState, "2026-08-06", 0, 120);
  assertEqual(d5.nextState.currentHP, 0, "HP depleted to 0");
  assertEqual(d5.nextState.activeStreakDays, 0, "Streak broken and reset to 0");
});

runStressTest("STR-02", "Surplus Overdrive Recovery & Shield Token Recharge", () => {
  let state = { ...DEFAULT_STREAK_STATE, currentHP: 40, shieldTokens: 0, activeStreakDays: 5, lastEvaluatedDate: "2026-08-10" };

  const d1 = evaluateDayStep(state, "2026-08-11", 180, 120);
  assertEqual(d1.historyEntry.status, "surplus_overdrive", "Overdrive status");
  assertEqual(d1.nextState.currentHP, 65, "HP recovered from 40 to 65 (+25)");
  assertEqual(d1.nextState.shieldTokens, 1, "1 shield token recharged");
  assertEqual(d1.nextState.activeStreakDays, 6, "Streak increased to 6");

  const d2 = evaluateDayStep(d1.nextState, "2026-08-12", 240, 120);
  assertEqual(d2.nextState.currentHP, 90, "HP recovered to 90 (+25)");
  assertEqual(d2.nextState.shieldTokens, 2, "2nd shield token recharged");
  assertEqual(d2.nextState.activeStreakDays, 7, "Streak increased to 7");
});

runStressTest("STR-03", "365-Day High-Velocity Lifecycle Simulation Determinism", () => {
  // Generate 365 days of synthetic study data ending today:
  // - 5 days overdrive (180m)
  // - 1 day rest (0m)
  // - 1 day partial (60m)
  const syntheticLogs: any[] = [];
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().substring(0, 10);
    const dayOfWeek = (365 - i) % 7;

    if (dayOfWeek < 5) {
      syntheticLogs.push({ date: dateStr, durationMinutes: 180, subject: "Physics" });
    } else if (dayOfWeek === 5) {
      // Rest day (0 mins)
    } else {
      syntheticLogs.push({ date: dateStr, durationMinutes: 60, subject: "Mathematics" });
    }
  }

  const start = performance.now();
  const recomputed = recomputeStreakFromHistory(syntheticLogs, 120, 2);
  const elapsed = performance.now() - start;

  assert(recomputed.currentHP >= 80, `Final HP should be resilient (Got: ${recomputed.currentHP})`);
  assert(recomputed.shieldTokens >= 1, `Shield tokens maintained (Got: ${recomputed.shieldTokens})`);
  assert(recomputed.activeStreakDays > 50, `Active streak maintained anti-fragile (Got: ${recomputed.activeStreakDays})`);
  assert(elapsed < 50, `365-day recomputation took ${elapsed.toFixed(2)}ms (< 50ms)`);
});

runStressTest("STR-04", "Leap Year Transition & Cross-Year Boundary Handling", () => {
  const leapLogs = [
    { date: "2024-02-28", durationMinutes: 120, subject: "Physics" },
    { date: "2024-02-29", durationMinutes: 120, subject: "Mathematics" },
    { date: "2024-03-01", durationMinutes: 120, subject: "Chemistry" }
  ];
  const initial = { ...DEFAULT_STREAK_STATE, lastEvaluatedDate: "2024-02-27", activeStreakDays: 0, currentHP: 100 };
  const evaluated = evaluateElasticStreak(initial, leapLogs, 120, "2024-03-01");
  assertEqual(evaluated.activeStreakDays, 3, "Streak cleanly counts 3 days across leap year");
});

// ========================================================================
// 6. RAPID BURST MICRO-LOGS & INTEGRATION SIMULATION
// ========================================================================
setCategory("6. Rapid Burst Pipeline Integration Stress");

runStressTest("INT-01", "100 Rapid Sequential Micro-Logs Parsed and Aggregated into SACM & PID", () => {
  const rawInputs = [
    "45m Physics mechanics solved 15 questions 85% accuracy",
    "1.5h Chemistry organic aldehydes 25 questions 92% accuracy mistakes: reagent error",
    "2h Mathematics calculus integration 30 questions 24 correct and 6 wrong",
    "30m Physics kinematics 10 questions 100% accuracy in the zone",
    "1h Chemistry physical electrochemistry 20 questions 75% accuracy distracted"
  ];

  const parsedLogs: any[] = [];
  const startNlp = performance.now();
  for (let i = 0; i < 100; i++) {
    const input = rawInputs[i % rawInputs.length];
    const parsed = parseMicroLog(input);
    parsedLogs.push({
      id: `log_${i}`,
      date: "2026-08-28",
      ...parsed
    });
  }
  const nlpDuration = performance.now() - startNlp;
  const avgNlpLatency = nlpDuration / 100;
  assert(avgNlpLatency < 0.5, `Average NLP latency ${avgNlpLatency.toFixed(3)}ms per log (< 0.5ms SLA)`);

  const sacmReport = calculateSACMData(parsedLogs);
  assertEqual(sacmReport.totalSessionsEvaluated, 100, "SACM evaluated all 100 sessions");
  assert(sacmReport.overallAvgVelocity > 0, "Positive velocity");
  assert(sacmReport.overallAvgAccuracy > 0, "Positive accuracy");

  const pidReport = calculateSubjectEquilibrium(parsedLogs, DEFAULT_TARGET_WEIGHTS);
  assertEqual(pidReport.totalMinutes7Days, parsedLogs.reduce((s, l) => s + l.durationMinutes, 0), "PID total minutes match");
  assert(pidReport.equilibriumScore >= 80, `Equilibrium score is balanced (Got: ${pidReport.equilibriumScore}%)`);
});

runStressTest("INT-02", "Simulated AppContext Dual-Storage and Guest Mode Switching", () => {
  mockStorage.clear();

  mockStorage.setItem("savantix_is_guest", "true");
  const guestLog1 = { id: "g1", subject: "Physics", durationMinutes: 60, date: "2026-08-28" };
  mockStorage.setItem("savantix_guest_logs", JSON.stringify([guestLog1]));

  const loadedGuestLogs = JSON.parse(mockStorage.getItem("savantix_guest_logs") || "[]");
  assertEqual(loadedGuestLogs.length, 1, "Guest log preserved");
  assertEqual(loadedGuestLogs[0].subject, "Physics", "Guest log content intact");

  mockStorage.removeItem("savantix_is_guest");
  const authUser = { uid: "usr_abc123", email: "scholar@savantix.app", displayName: "Scholar" };
  mockStorage.setItem("savantix_user_session", JSON.stringify(authUser));
  const userLog1 = { id: "u1", subject: "Mathematics", durationMinutes: 90, date: "2026-08-28" };
  mockStorage.setItem(`savantix_user_logs_${authUser.uid}`, JSON.stringify([userLog1]));

  const loadedUserLogs = JSON.parse(mockStorage.getItem(`savantix_user_logs_${authUser.uid}`) || "[]");
  assertEqual(loadedUserLogs.length, 1, "User log preserved separately");
  assertEqual(loadedUserLogs[0].subject, "Mathematics", "User log content intact");

  const guestLogsAfter = JSON.parse(mockStorage.getItem("savantix_guest_logs") || "[]");
  assertEqual(guestLogsAfter.length, 1, "Guest logs remained isolated");
});

// ========================================================================
// TEST REPORT SUMMARY
// ========================================================================
console.log("\n========================================================================");
console.log("📊 ADVERSARIAL STRESS TEST EXECUTION SUMMARY");
console.log("========================================================================\n");

const totalTests = results.length;
const passedTests = results.filter(r => r.passed).length;
const failedTests = results.filter(r => !r.passed).length;

console.log(`Total Stress Tests: ${totalTests}`);
console.log(`Passed:             ${passedTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
console.log(`Failed:             ${failedTests}`);

if (failedTests > 0) {
  console.error("\n❌ FAILED TESTS:");
  results.filter(r => !r.passed).forEach(r => {
    console.error(`  - [${r.testId}] (${r.category}) ${r.name}`);
    console.error(`    Error: ${r.error}`);
  });
  process.exit(1);
} else {
  console.log("\n🌟 ALL ADVERSARIAL STRESS & PERSISTENCE TESTS PASSED FLAWLESSLY!");
  process.exit(0);
}
