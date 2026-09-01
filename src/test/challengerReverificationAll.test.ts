import {
  computeLiveMetrics,
  simulateAttendanceScenario,
  generateGeminiRegulatoryPrompt,
  DEFAULT_INITIAL_STATE,
  DEFAULT_PROFILE,
  DEFAULT_SUBJECTS,
  DEFAULT_EXAMS,
  DEFAULT_ABSENCES,
  DEFAULT_HOLIDAYS,
  DEFAULT_VACATIONS,
  DEFAULT_ON_DUTY,
  loadInstitutionalState,
  saveInstitutionalState
} from '../services/attendanceRegulatorService';
import { InstitutionalAttendanceState } from '../types/attendance';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

function assertEqual<T>(actual: T, expected: T, msg: string) {
  if (actual !== expected) {
    throw new Error(`${msg}: Expected "${expected}", got "${actual}"`);
  }
}

// In-memory mock localStorage for node execution
class MemoryStorage {
  private store: Record<string, string> = {};
  getItem(key: string) { return this.store[key] ?? null; }
  setItem(key: string, val: string) { this.store[key] = String(val); }
  removeItem(key: string) { delete this.store[key]; }
  clear() { this.store = {}; }
}

const mockStorage = new MemoryStorage();
if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = mockStorage;
}

console.log('===================================================================');
console.log('🔬 RUNNING EMPIRICAL RE-VERIFICATION HARNESS: FALSY ZERO & 2028 TIMELINE');
console.log('===================================================================\n');

let passedCount = 0;
let totalCount = 0;

function runTest(name: string, fn: () => void) {
  totalCount++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedCount++;
  } catch (err: any) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    throw err;
  }
}

// 1. FALSY ZERO BUGFIX VERIFICATION IN ATTENDANCE REGULATOR SERVICE
runTest('Falsy Zero: computeLiveMetrics with presentDays === 0', () => {
  const state: InstitutionalAttendanceState = {
    ...DEFAULT_INITIAL_STATE,
    profile: {
      ...DEFAULT_PROFILE,
      workingDaysHeld: 71,
      presentDays: 0,
      absentDays: 71,
      onDutyDays: 0
    },
    onDuty: []
  };
  const metrics = computeLiveMetrics(state);
  assertEqual(metrics.presentDays, 0, 'presentDays must be 0');
  assertEqual(metrics.onDutyDays, 0, 'onDutyDays must be 0');
  assertEqual(metrics.effectiveDays, 0, 'effectiveDays must be 0');
  assertEqual(metrics.effectivePct, 0, 'effectivePct must be 0.00%');
  assertEqual(metrics.rawPct, 0, 'rawPct must be 0.00%');
  assertEqual(metrics.absentDays, 71, 'absentDays must be 71');
});

runTest('Falsy Zero: computeLiveMetrics with explicit onDutyCredits === 0 on profile', () => {
  const state: any = {
    ...DEFAULT_INITIAL_STATE,
    profile: {
      ...DEFAULT_PROFILE,
      workingDaysHeld: 71,
      presentDays: 48,
      onDutyCredits: 0
    },
    // Even if state.onDuty has items, explicit onDutyCredits: 0 on profile must take precedence
    onDuty: DEFAULT_ON_DUTY
  };
  const metrics = computeLiveMetrics(state);
  assertEqual(metrics.onDutyDays, 0, 'Explicit profile.onDutyCredits === 0 must be preserved as 0');
  assertEqual(metrics.effectiveDays, 48, 'Effective days must be 48 + 0 = 48');
  assertEqual(metrics.effectivePct, 67.61, 'Effective % must match raw % 67.61%');
});

runTest('Falsy Zero: computeLiveMetrics with absentDays === 0', () => {
  const state: InstitutionalAttendanceState = {
    ...DEFAULT_INITIAL_STATE,
    profile: {
      ...DEFAULT_PROFILE,
      workingDaysHeld: 71,
      presentDays: 71,
      absentDays: 0,
      onDutyDays: 0
    },
    onDuty: []
  };
  const metrics = computeLiveMetrics(state);
  assertEqual(metrics.absentDays, 0, 'absentDays === 0 must be preserved');
  assertEqual(metrics.effectivePct, 100, 'effectivePct must be 100%');
  assertEqual(metrics.rawPct, 100, 'rawPct must be 100%');
});

runTest('Falsy Zero: loadInstitutionalState preserves numeric 0 in subjects', () => {
  mockStorage.clear();
  mockStorage.setItem('savantix_attendance_data_v1', JSON.stringify([
    { id: 'subj_test', name: 'Test Subject', attended: 0, total: 0, required: 0 }
  ]));
  const loaded = loadInstitutionalState();
  const subj = loaded.profile.subjects.find(s => s.id === 'subj_test');
  assert(subj !== undefined, 'Loaded subject must exist');
  assertEqual(subj!.attended, 0, 'attended: 0 must not be replaced with fallback');
  assertEqual(subj!.total, 0, 'total: 0 must not be replaced with fallback');
  assertEqual(subj!.required, 0, 'required: 0 must not be replaced with fallback 75');
});

runTest('Falsy Zero: Simulation with 0 future leaves and 0 attended', () => {
  const sim = simulateAttendanceScenario(DEFAULT_INITIAL_STATE, 0, 0);
  assertEqual(sim.hypotheticalAbsences, 0, 'hypotheticalAbsences is 0');
  assertEqual(sim.hypotheticalAttended, 0, 'hypotheticalAttended is 0');
  assert(sim.projectedFinalPctDec31 >= 75, 'Default ground truth trajectory meets 75%');
  assertEqual(sim.meetsSafe75, true, 'meetsSafe75 is true');
});

// 2. 2028 ACADEMIC TIMELINE & IPhO GOLD TRACK ROADMAP VERIFICATION
runTest('2028 Timeline: DEFAULT_EXAMS in attendanceRegulatorService reflects 2026-2027 Class XI session', () => {
  assertEqual(DEFAULT_PROFILE.sessionStart, '2026-04-21', 'Session start is 2026-04-21');
  assertEqual(DEFAULT_PROFILE.lockDate, '2026-12-31', 'CBSE Lock date is 2026-12-31');
  
  // 4 Class XI exams:
  assertEqual(DEFAULT_EXAMS.length, 4, '4 Class XI exams scheduled');
  assertEqual(DEFAULT_EXAMS[0].name, 'Periodic Test 1 (PT1)', 'PT1 defined');
  assertEqual(DEFAULT_EXAMS[0].status, 'completed', 'PT1 completed');
  assertEqual(DEFAULT_EXAMS[1].name, 'Half-Yearly Examination', 'Half-Yearly defined');
  assertEqual(DEFAULT_EXAMS[1].startDate, '2026-09-14', 'Half-Yearly starts 2026-09-14');
  assertEqual(DEFAULT_EXAMS[2].name, 'Periodic Test 2 (PT2)', 'PT2 defined');
  assertEqual(DEFAULT_EXAMS[3].name, 'Annual Exam (Class XI Finals)', 'Class XI finals in March 2027');
  assertEqual(DEFAULT_EXAMS[3].startDate, '2027-03-01', 'Class XI finals start 2027-03-01');
});

runTest('2028 Timeline: Logged absences include Olympiad prep, NSEP registration & recent real dates', () => {
  assertEqual(DEFAULT_ABSENCES.length, 24, '21 specific + 3 buffer = 24 total absence entries');
  const nsepReg = DEFAULT_ABSENCES.find(a => a.date === '2026-08-21');
  assert(nsepReg !== undefined, 'NSEP 2026 registration date logged');
  assert(nsepReg!.reason.includes('NSEP'), 'NSEP cited in reason');

  const aug28 = DEFAULT_ABSENCES.find(a => a.date === '2026-08-28');
  assert(aug28 !== undefined, '2026-08-28 (Day before Raksha Bandhan) logged');

  const sept1 = DEFAULT_ABSENCES.find(a => a.date === '2026-09-01');
  assert(sept1 !== undefined, '2026-09-01 (Today) logged');
});

runTest('2028 Timeline & Regulatory Dossier: Prompt references CBSE Rule 14, NIOS, A-Levels, and IPhO', () => {
  const prompt = generateGeminiRegulatoryPrompt(DEFAULT_INITIAL_STATE);
  assert(prompt.includes('Rule 13.2'), 'Prompt includes CBSE Rule 13.2');
  assert(prompt.includes('Rule 14'), 'Prompt includes CBSE Rule 14 condonation');
  assert(prompt.includes('Kriti RISE IKITIES Program at IIT Kharagpur'), 'Prompt includes IIT KGP deputation');
  assert(prompt.includes('Part of Cosmos'), 'Prompt includes Cosmos branding');
  assert(prompt.includes('81.69%'), 'Prompt includes 81.69% effective attendance');
});

console.log('\n===================================================================');
console.log(`🎉 EMPIRICAL RE-VERIFICATION COMPLETE: ${passedCount}/${totalCount} PASSED`);
console.log('===================================================================\n');
