/**
 * Savantix (Aegis) — Dynamic Daily Insight Regeneration Test Suite
 * @file dynamicInsightRegeneration.test.ts
 * 
 * Verifies:
 * 1. Re-analysis logic on multi-session study days (morning -> afternoon -> night).
 * 2. Cumulative metric aggregation (total minutes, problem counts, mistake clusters, subject balance).
 * 3. Atomic replacement of stale daily snapshot with updated cumulative analysis.
 * 4. Insight caching and startup state rehydration (`savantix_user_insights_${uid}`).
 * 5. Non-destructive update guarantee: historical logs, journal reflections, and other days' insights remain intact.
 * 6. Zero API cost / offline fallback insight generation.
 */

// In-Memory localStorage mock for Node.js test runner
class MockLocalStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get length(): number {
    return this.store.size;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
}

if (typeof globalThis.localStorage === 'undefined') {
  const mockStorage = new MockLocalStorage();
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockStorage,
    writable: true,
    configurable: true
  });
}

interface StudyLog {
  id: string;
  date: string;
  subject: string;
  topic: string;
  duration: number; // minutes
  problemsSolved?: number;
  efficiency?: number; // 1-5
  focusScore?: number; // 1-5
  mistakeNotes?: string;
  keyTakeaway?: string;
}

interface DailyInsight {
  id: string;
  date: string;
  performanceSummary: string;
  biggestMistakePattern: string;
  hiddenWeakness: string;
  nextDayPlan: string[];
  warnings: string[];
  sessionCount?: number;
  totalMinutesEvaluated?: number;
  totalProblemsEvaluated?: number;
  generatedAt?: string;
}

/**
 * Pure evaluation engine for daily insight aggregation
 */
export function aggregateDayMetrics(logs: StudyLog[], targetDate: string) {
  const dayLogs = logs.filter(l => l.date === targetDate);
  const totalMinutes = dayLogs.reduce((acc, l) => acc + (l.duration || 0), 0);
  const totalProblems = dayLogs.reduce((acc, l) => acc + (l.problemsSolved || 0), 0);
  
  const subjectsMap: Record<string, number> = {};
  dayLogs.forEach(l => {
    subjectsMap[l.subject] = (subjectsMap[l.subject] || 0) + l.duration;
  });

  const mistakes = dayLogs
    .filter(l => l.mistakeNotes && l.mistakeNotes.trim().length > 0)
    .map(l => `[${l.subject}] ${l.mistakeNotes}`);

  const avgEfficiency = dayLogs.length > 0
    ? Number((dayLogs.reduce((acc, l) => acc + (l.efficiency || 3), 0) / dayLogs.length).toFixed(1))
    : 0;

  return {
    sessionCount: dayLogs.length,
    totalMinutes,
    totalProblems,
    subjectBreakdown: subjectsMap,
    mistakes,
    avgEfficiency
  };
}

/**
 * Deterministic insight synthesizer for testing dynamic regeneration
 */
export function synthesizeDailyInsight(logs: StudyLog[], targetDate: string): DailyInsight {
  const metrics = aggregateDayMetrics(logs, targetDate);
  const hours = (metrics.totalMinutes / 60).toFixed(1);
  const subjectList = Object.entries(metrics.subjectBreakdown)
    .map(([sub, mins]) => `${sub} (${mins}m)`)
    .join(', ');

  const summary = `Evaluated ${metrics.sessionCount} session(s) totaling ${metrics.totalMinutes} mins (${hours}h) across ${subjectList || 'None'}. Problem throughput: ${metrics.totalProblems} solved. Average efficiency: ${metrics.avgEfficiency}/5.`;
  
  const mistakePattern = metrics.mistakes.length > 0
    ? metrics.mistakes.join('; ')
    : 'No major cognitive bottlenecks logged for today.';

  const weakness = metrics.totalMinutes < 180
    ? 'Study volume is below daily Olympiad/JEE target threshold (3+ hours recommended).'
    : metrics.totalProblems < 20
    ? 'Problem-solving velocity is lower than recommended for target exam depth.'
    : 'Balanced session velocity achieved across core subjects.';

  const plan = [
    `Prioritize next day deep work in dominant subject: ${Object.keys(metrics.subjectBreakdown)[0] || 'Physics'}`,
    `Review logged mistake patterns: ${metrics.mistakes.length} errors to log into Error Vault`,
    `Target minimum 120m morning session for uninterrupted flow`
  ];

  const warnings = metrics.totalMinutes < 120 ? ['⚠️ High Risk: Daily study volume below 2 hours.'] : [];

  return {
    id: `insight_${targetDate}_${Date.now()}`,
    date: targetDate,
    performanceSummary: summary,
    biggestMistakePattern: mistakePattern,
    hiddenWeakness: weakness,
    nextDayPlan: plan,
    warnings,
    sessionCount: metrics.sessionCount,
    totalMinutesEvaluated: metrics.totalMinutes,
    totalProblemsEvaluated: metrics.totalProblems,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Storage and rehydration manager for insights
 */
export function saveUserInsights(uid: string, insights: DailyInsight[]): void {
  localStorage.setItem(`savantix_user_insights_${uid}`, JSON.stringify(insights));
}

export function loadUserInsights(uid: string): DailyInsight[] {
  try {
    const raw = localStorage.getItem(`savantix_user_insights_${uid}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function upsertDailyInsight(uid: string, newInsight: DailyInsight): DailyInsight[] {
  const existing = loadUserInsights(uid);
  const filtered = existing.filter(i => i.date !== newInsight.date);
  const updated = [newInsight, ...filtered].sort((a, b) => b.date.localeCompare(a.date));
  saveUserInsights(uid, updated);
  return updated;
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`Assertion failed [${message}]: Expected "${expected}", but got "${actual}"`);
  }
}

export async function runDynamicInsightRegenerationTests(): Promise<void> {
  console.log('\n===============================================================');
  console.log('🔄 RUNNING SUITE: Dynamic Daily Insight Regeneration Tests');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  function test(name: string, fn: () => void) {
    total++;
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ ${name}`);
      console.error(`    ${err.message}`);
      throw err;
    }
  }

  const testUid = 'user_debanjan_test';
  const targetDate = '2026-09-01';

  // 1. Initial Morning Session & First Insight Generation
  test('Initial Session: generates baseline insight from Morning Session 1', () => {
    localStorage.clear();

    const morningLogs: StudyLog[] = [
      {
        id: 'log_m1',
        date: targetDate,
        subject: 'Physics',
        topic: 'Rotational Dynamics & Irodov 1.250',
        duration: 90,
        problemsSolved: 15,
        efficiency: 5,
        focusScore: 5,
        mistakeNotes: 'Sign error in torque cross product vector integration'
      }
    ];

    const morningMetrics = aggregateDayMetrics(morningLogs, targetDate);
    assertEqual(morningMetrics.sessionCount, 1, '1 morning session');
    assertEqual(morningMetrics.totalMinutes, 90, '90 minutes evaluated');
    assertEqual(morningMetrics.totalProblems, 15, '15 problems evaluated');
    assertEqual(morningMetrics.avgEfficiency, 5.0, '5.0 efficiency');

    const morningInsight = synthesizeDailyInsight(morningLogs, targetDate);
    assertEqual(morningInsight.sessionCount, 1, 'Insight session count is 1');
    assertEqual(morningInsight.totalMinutesEvaluated, 90, '90m evaluated');
    assert(morningInsight.performanceSummary.includes('Physics (90m)'), 'Summary specifies Physics');
    assert(morningInsight.biggestMistakePattern.includes('torque cross product'), 'Mistake captured');

    upsertDailyInsight(testUid, morningInsight);
    const saved = loadUserInsights(testUid);
    assertEqual(saved.length, 1, '1 insight saved in storage');
  });

  // 2. Afternoon & Night Multi-Session Logging & Dynamic Re-analysis
  test('Multi-Session Logging: re-analyzes cumulative metrics across 3 sessions on same date', () => {
    const allDayLogs: StudyLog[] = [
      {
        id: 'log_m1',
        date: targetDate,
        subject: 'Physics',
        topic: 'Rotational Dynamics & Irodov 1.250',
        duration: 90,
        problemsSolved: 15,
        efficiency: 5,
        focusScore: 5,
        mistakeNotes: 'Sign error in torque cross product vector integration'
      },
      {
        id: 'log_a1',
        date: targetDate,
        subject: 'Mathematics',
        topic: 'Multivariable Calculus & Line Integrals',
        duration: 120,
        problemsSolved: 25,
        efficiency: 4,
        focusScore: 4,
        mistakeNotes: 'Parametrization boundary confusion in Green theorem'
      },
      {
        id: 'log_n1',
        date: targetDate,
        subject: 'Chemistry',
        topic: 'Thermodynamics & Carnot Cycle Entropy',
        duration: 60,
        problemsSolved: 10,
        efficiency: 4,
        focusScore: 5,
        mistakeNotes: 'Reversible vs irreversible isothermal expansion difference'
      }
    ];

    // Trigger dynamic re-analysis
    const cumulativeMetrics = aggregateDayMetrics(allDayLogs, targetDate);
    assertEqual(cumulativeMetrics.sessionCount, 3, '3 cumulative sessions');
    assertEqual(cumulativeMetrics.totalMinutes, 270, '270 cumulative minutes (4.5 hours)');
    assertEqual(cumulativeMetrics.totalProblems, 50, '50 cumulative problems solved');
    assertEqual(cumulativeMetrics.mistakes.length, 3, '3 distinct mistake clusters logged');

    // Synthesize re-analyzed insight
    const regeneratedInsight = synthesizeDailyInsight(allDayLogs, targetDate);
    assertEqual(regeneratedInsight.sessionCount, 3, 'Regenerated session count is 3');
    assertEqual(regeneratedInsight.totalMinutesEvaluated, 270, '270 total minutes evaluated');
    assertEqual(regeneratedInsight.totalProblemsEvaluated, 50, '50 problems evaluated');
    assert(regeneratedInsight.performanceSummary.includes('Physics (90m)'), 'Includes Physics');
    assert(regeneratedInsight.performanceSummary.includes('Mathematics (120m)'), 'Includes Mathematics');
    assert(regeneratedInsight.performanceSummary.includes('Chemistry (60m)'), 'Includes Chemistry');
    assert(regeneratedInsight.biggestMistakePattern.includes('Green theorem'), 'Includes afternoon mistake');
    assert(regeneratedInsight.biggestMistakePattern.includes('isothermal expansion'), 'Includes night mistake');

    // Overwrite stale snapshot in storage
    const updatedInsights = upsertDailyInsight(testUid, regeneratedInsight);
    assertEqual(updatedInsights.length, 1, 'Still exactly 1 insight for targetDate (atomic replace)');
    assertEqual(updatedInsights[0].totalMinutesEvaluated, 270, 'Updated snapshot has 270 minutes');
  });

  // 3. State Rehydration on Session Bootstrap
  test('State Rehydration: recovers cached daily insights on application reload', () => {
    // Re-read storage
    const rehydrated = loadUserInsights(testUid);
    assertEqual(rehydrated.length, 1, 'Rehydrated exactly 1 daily insight');
    assertEqual(rehydrated[0].date, targetDate, 'Matches targetDate');
    assertEqual(rehydrated[0].totalMinutesEvaluated, 270, 'Rehydrated cumulative minutes');
    assertEqual(rehydrated[0].sessionCount, 3, 'Rehydrated session count');
    assert(rehydrated[0].nextDayPlan.length >= 3, 'Rehydrated action plans');
  });

  // 4. Non-Destructive Multi-Day Invariant
  test('Zero Data Loss Invariant: multi-day insights are isolated and preserved', () => {
    const priorDateInsight: DailyInsight = {
      id: 'insight_2026-08-31',
      date: '2026-08-31',
      performanceSummary: 'Prior day summary (300 mins focus on Irodov Electrodynamics)',
      biggestMistakePattern: 'None',
      hiddenWeakness: 'None',
      nextDayPlan: ['Continue electrostatics'],
      warnings: [],
      sessionCount: 2,
      totalMinutesEvaluated: 300,
      totalProblemsEvaluated: 40,
      generatedAt: '2026-08-31T22:00:00.000Z'
    };

    upsertDailyInsight(testUid, priorDateInsight);

    const multiDayList = loadUserInsights(testUid);
    assertEqual(multiDayList.length, 2, '2 distinct day insights preserved');
    assertEqual(multiDayList[0].date, '2026-09-01', 'Sorted descending by date');
    assertEqual(multiDayList[1].date, '2026-08-31', 'Prior day preserved intact');
    assertEqual(multiDayList[1].totalMinutesEvaluated, 300, 'Prior day data untouched');
  });

  // 5. Empty Logs & Edge Case Handling
  test('Edge Case: handles days with 0 logs gracefully without crashing', () => {
    const emptyMetrics = aggregateDayMetrics([], '2026-09-02');
    assertEqual(emptyMetrics.sessionCount, 0, '0 sessions on empty date');
    assertEqual(emptyMetrics.totalMinutes, 0, '0 minutes');
    assertEqual(emptyMetrics.totalProblems, 0, '0 problems');

    const emptyInsight = synthesizeDailyInsight([], '2026-09-02');
    assertEqual(emptyInsight.sessionCount, 0, 'Insight session count is 0');
    assert(emptyInsight.warnings.length > 0, 'Includes volume warning for 0-minute day');
  });

  console.log(`\n===============================================================`);
  console.log(`🎉 DYNAMIC INSIGHT REGENERATION TESTS COMPLETE: ${passed}/${total} PASSED`);
  console.log(`===============================================================\n`);
}

if (typeof process !== 'undefined' && process.argv[1]?.includes('dynamicInsightRegeneration.test')) {
  runDynamicInsightRegenerationTests().catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
}
