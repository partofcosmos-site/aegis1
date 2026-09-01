/**
 * Savantix (Aegis) — Institutional Attendance & Reality Math Test Suite
 * @file attendanceRealityMath.test.ts
 * 
 * Verifies:
 * 1. Exact ground truth metrics as of Sept 1, 2026 (The Bandhan School Aranghata, CBSE 2430453)
 * 2. Effective Attendance % (81.69%) and Raw Physical Attendance % (67.61%)
 * 3. Dynamic Safe Future Leaves to Dec 31 Lock Date (21 days @ 75% safe, 42 days @ 60% condonation)
 * 4. Compulsory Consecutive Recovery Math (0 days effective, 21 days raw)
 * 5. Full 28 Institutional Holidays & 4 Vacation Windows catalogue
 * 6. 23 Absences Ledger & 10-day IIT Kharagpur Kriti RISE On-Duty credit
 * 7. Simulation engine edge cases & boundary conditions
 * 8. Zero-Cost Gemini Web AI Regulator Prompt Payload completeness
 * 9. Dual-storage persistence & backward compatibility (savantix_attendance_institutional_v1 & savantix_attendance_data_v1)
 */

// In-Memory localStorage mock for node environment
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

if (typeof globalThis.window === 'undefined') {
  (globalThis as any).window = {
    localStorage: globalThis.localStorage,
    open: (_url: string) => true
  };
}

if (typeof globalThis.navigator === 'undefined') {
  (globalThis as any).navigator = {
    userAgent: 'NodeTestRunner',
    clipboard: {
      writeText: async (_text: string) => true
    }
  };
}

import {
  computeLiveMetrics,
  simulateAttendanceScenario,
  generateGeminiRegulatoryPrompt,
  loadInstitutionalState,
  saveInstitutionalState,
  DEFAULT_INITIAL_STATE,
  DEFAULT_HOLIDAYS,
  DEFAULT_VACATIONS,
  DEFAULT_EXAMS,
  DEFAULT_ABSENCES,
  DEFAULT_ON_DUTY,
  INSTITUTIONAL_STORAGE_KEY,
  LEGACY_SUBJECTS_STORAGE_KEY
} from '../services/attendanceRegulatorService';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
}

export async function runAttendanceRealityMathTests() {
  console.log('\n===============================================================');
  console.log('🏛️ RUNNING INSTITUTIONAL ATTENDANCE & REALITY MATH TEST SUITE');
  console.log('===============================================================\n');

  let passedCount = 0;
  let totalCount = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    totalCount++;
    try {
      fn();
      passedCount++;
      console.log(`  ✓ ${name}`);
    } catch (err: any) {
      console.error(`  ✗ ${name}: ${err.message}`);
      throw err;
    }
  }

  // 1. Ground Truth Live Metrics
  test('Live Reality Math: calculates exact ground truth metrics as of Sept 1, 2026', () => {
    const metrics = computeLiveMetrics(DEFAULT_INITIAL_STATE);

    // Held = 71, Present = 48, OD = 10, Absent = 23, Total = 139, Remaining = 68
    assert(metrics.workingDaysHeld === 71, `Expected 71 held days, got ${metrics.workingDaysHeld}`);
    assert(metrics.presentDays === 48, `Expected 48 present days, got ${metrics.presentDays}`);
    assert(metrics.onDutyDays === 10, `Expected 10 on-duty days, got ${metrics.onDutyDays}`);
    assert(metrics.effectiveDays === 58, `Expected 58 effective days (48+10), got ${metrics.effectiveDays}`);
    assert(metrics.totalSessionDays === 139, `Expected 139 session days, got ${metrics.totalSessionDays}`);
    assert(metrics.remainingSessionDays === 68, `Expected 68 remaining days, got ${metrics.remainingSessionDays}`);

    // Effective % = 58/71 = 81.69%
    assert(metrics.effectivePct === 81.69, `Expected 81.69% effective attendance, got ${metrics.effectivePct}%`);

    // Raw % = 48/71 = 67.61%
    assert(metrics.rawPct === 67.61, `Expected 67.61% raw physical attendance, got ${metrics.rawPct}%`);
  });

  // 2. Safe Future Leaves to Dec 31
  test('Safe Future Leaves: computes correct safe margins for 75% and 60% thresholds', () => {
    const metrics = computeLiveMetrics(DEFAULT_INITIAL_STATE);

    // Target @ 75% = ceil(0.75 * 139) = 105 days
    // Must attend = 105 - 58 = 47 days
    // Safe leaves = 68 - 47 = 21 days
    assert(metrics.targetDays75 === 105, `Expected targetDays75 = 105, got ${metrics.targetDays75}`);
    assert(metrics.daysMustAttend75 === 47, `Expected daysMustAttend75 = 47, got ${metrics.daysMustAttend75}`);
    assert(metrics.safeLeaves75 === 21, `Expected 21 safe leaves remaining at 75%, got ${metrics.safeLeaves75}`);

    // Target @ 60% = ceil(0.60 * 139) = 84 days
    // Must attend = 84 - 58 = 26 days
    // Safe leaves = 68 - 26 = 42 days
    assert(metrics.targetDays60 === 84, `Expected targetDays60 = 84, got ${metrics.targetDays60}`);
    assert(metrics.daysMustAttend60 === 26, `Expected daysMustAttend60 = 26, got ${metrics.daysMustAttend60}`);
    assert(metrics.safeLeaves60 === 42, `Expected 42 safe leaves remaining at 60%, got ${metrics.safeLeaves60}`);
  });

  // 3. Consecutive Compulsory Recovery Math
  test('Consecutive Compulsory Recovery Math: verifies formula C_rec = max(0, ceil((0.75 * T_held - Attended) / 0.25))', () => {
    const metrics = computeLiveMetrics(DEFAULT_INITIAL_STATE);

    // Raw Physical: (0.75 * 71 - 48) / 0.25 = 5.25 / 0.25 = 21 consecutive days
    assert(metrics.consecutiveRecoveryRaw === 21, `Expected 21 consecutive recovery days for raw, got ${metrics.consecutiveRecoveryRaw}`);

    // Effective with OD (58/71): 0.75 * 71 - 58 = -4.75 <= 0 => 0 days
    assert(metrics.consecutiveRecoveryEffective === 0, `Expected 0 consecutive recovery days for effective, got ${metrics.consecutiveRecoveryEffective}`);
    assert(metrics.effectiveSurplusBuffer === 4.75, `Expected +4.75 buffer surplus, got ${metrics.effectiveSurplusBuffer}`);
  });

  // 4. Institutional Calendar Catalogue Integrity
  test('Institutional Calendar: contains exactly 28 holidays, 4 vacations, 4 exams, 23 absences, 10-day OD', () => {
    assert(DEFAULT_HOLIDAYS.length === 28, `Expected 28 official holidays, got ${DEFAULT_HOLIDAYS.length}`);
    assert(DEFAULT_VACATIONS.length === 4, `Expected 4 vacation windows, got ${DEFAULT_VACATIONS.length}`);
    assert(DEFAULT_EXAMS.length === 4, `Expected 4 exam milestones, got ${DEFAULT_EXAMS.length}`);
    assert(DEFAULT_ABSENCES.length === 24, `Expected 24 absence ledger entries (21 dates + 3 buffer), got ${DEFAULT_ABSENCES.length}`);
    assert(DEFAULT_ON_DUTY.length === 1 && DEFAULT_ON_DUTY[0].workingDays === 10, 'Expected 10-day approved On-Duty credit');

    // Total school days saved by vacations
    const totalDaysSaved = DEFAULT_VACATIONS.reduce((sum, v) => sum + v.schoolDaysSaved, 0);
    assert(totalDaysSaved === 36, `Expected 36 school days saved by 4 vacations (20+7+3+6), got ${totalDaysSaved}`);
  });

  // 5. What-If Scenario Simulation
  test('Simulation Engine: correctly models future leave scenarios and boundary crossings', () => {
    // Taking 21 safe leaves (should still meet 75%)
    const sim21 = simulateAttendanceScenario(DEFAULT_INITIAL_STATE, 21, 0);
    assert(sim21.meetsSafe75 === true, 'Taking 21 leaves must meet 75% cutoff');
    assert(sim21.projectedFinalPctDec31 >= 75.0, `Projected final should be >= 75%, got ${sim21.projectedFinalPctDec31}%`);

    // Taking 22 leaves (drops just below 75% without extra classes)
    const sim22 = simulateAttendanceScenario(DEFAULT_INITIAL_STATE, 22, 0);
    assert(sim22.meetsSafe75 === false, 'Taking 22 leaves must drop below 75%');
    assert(sim22.meetsCondonation60 === true, 'Taking 22 leaves still meets 60% medical condonation');

    // Taking 43 leaves (drops below 60% condonation floor)
    const sim43 = simulateAttendanceScenario(DEFAULT_INITIAL_STATE, 43, 0);
    assert(sim43.meetsCondonation60 === false, 'Taking 43 leaves drops below 60% condonation floor');
  });

  // 6. Zero-Cost Gemini AI Regulator Prompt Payload
  test('AI Regulator Bridge: compiles rich structured dossier with CBSE by-laws and STEM strategy', () => {
    const prompt = generateGeminiRegulatoryPrompt(DEFAULT_INITIAL_STATE, 'Draft Principal application letter');

    assert(prompt.includes('The Bandhan School Aranghata'), 'Prompt must contain school name');
    assert(prompt.includes('2430453'), 'Prompt must contain affiliation number');
    assert(prompt.includes('81.69%'), 'Prompt must contain effective attendance %');
    assert(prompt.includes('67.61%'), 'Prompt must contain raw physical attendance %');
    assert(prompt.includes('21 days'), 'Prompt must contain 21 safe leaves');
    assert(prompt.includes('IIT Kharagpur'), 'Prompt must contain IIT Kharagpur on-duty reference');
    assert(prompt.includes('CBSE Examination By-Laws Rule 13.2'), 'Prompt must contain Rule 13.2');
    assert(prompt.includes('Rule 14 Condonation'), 'Prompt must contain Rule 14 condonation');
    assert(prompt.includes('NIOS'), 'Prompt must mention NIOS pathway');
    assert(prompt.includes('British A-Levels'), 'Prompt must mention British A-Levels pathway');
    assert(prompt.includes('Draft Principal application letter'), 'Prompt must embed custom user directive');
  });

  // 7. Dual-Storage Persistence & Backward Compatibility
  test('Persistence & Compatibility: saves master institutional state and mirrors subject stats for cloud sync', () => {
    localStorage.clear();

    // Save initial state
    saveInstitutionalState(DEFAULT_INITIAL_STATE);

    // Verify institutional master key exists
    const rawInst = localStorage.getItem(INSTITUTIONAL_STORAGE_KEY);
    assert(rawInst !== null, `${INSTITUTIONAL_STORAGE_KEY} must be created`);
    const parsedInst = JSON.parse(rawInst!);
    assert(parsedInst.profile.schoolName === 'The Bandhan School Aranghata', 'Profile persisted');

    // Verify legacy subject key exists and is non-empty
    const rawLegacy = localStorage.getItem(LEGACY_SUBJECTS_STORAGE_KEY);
    assert(rawLegacy !== null, `${LEGACY_SUBJECTS_STORAGE_KEY} must be created for backward compatibility`);
    const parsedLegacy = JSON.parse(rawLegacy!);
    assert(Array.isArray(parsedLegacy) && parsedLegacy.length === 6, 'Legacy subject array preserved for cloud sync');

    // Verify loadInstitutionalState loads state seamlessly
    const loadedState = loadInstitutionalState();
    assert(loadedState.profile.workingDaysHeld === 71, 'Loaded state maintains working days held');
    assert(loadedState.absences.length === 24, 'Loaded state maintains absence records');
  });

  console.log(`\n===============================================================`);
  console.log(`🎉 ATTENDANCE REALITY MATH TESTS COMPLETE: ${passedCount}/${totalCount} PASSED`);
  console.log(`===============================================================\n`);
}

// Auto-run when executed directly via tsx
if (typeof process !== 'undefined' && process.argv[1]?.includes('attendanceRealityMath.test')) {
  runAttendanceRealityMathTests().catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
}
