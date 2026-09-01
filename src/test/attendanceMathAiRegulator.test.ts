/**
 * Savantix (Aegis) — Attendance Reality Math & Gemini AI Regulator Test Suite
 * @file attendanceMathAiRegulator.test.ts
 * 
 * Verifies:
 * 1. Live Effective Attendance calculation: (48 + 10) / 71 = 58 / 71 = 81.69%.
 * 2. Raw Physical Attendance calculation: 48 / 71 = 67.61%.
 * 3. Dynamic safe leaves to Dec 31 CBSE lock date:
 *    - 75% limit: 21 days allowed
 *    - 60% condonation limit: 42 days allowed
 * 4. Consecutive compulsory recovery days formula: C_rec = max(0, ceil((0.75 * T_held - (P + OD)) / 0.25)).
 *    - Raw recovery: ceil((0.75 * 71 - 48) / 0.25) = ceil(5.25 / 0.25) = 21 days.
 *    - Effective recovery: ceil((0.75 * 71 - 58) / 0.25) = 0 days (Surplus = +4.75 days).
 * 5. Simulation engine (simulateAttendanceScenario) projecting hypothetical leaves and attendances.
 * 6. 1-Click Gemini AI Regulator prompt payload generation (CBSE Rule 13.2/14, dummy schooling, NIOS, British A-Levels).
 * 7. Clipboard copy & launcher mechanics (launchGeminiRegulator).
 * 8. Boundary conditions, zero working days, and adversarial parameters.
 */

import {
  computeLiveMetrics,
  simulateAttendanceScenario,
  generateGeminiRegulatoryPrompt,
  launchGeminiRegulator,
  DEFAULT_INITIAL_STATE
} from '../services/attendanceRegulatorService';

import { InstitutionalAttendanceState } from '../types/attendance';

// Global mocks for clipboard and window
class MockClipboard {
  public writtenText: string = '';
  async writeText(text: string): Promise<void> {
    this.writtenText = text;
  }
}

const mockClipboard = new MockClipboard();
if (typeof globalThis.navigator === 'undefined') {
  Object.defineProperty(globalThis, 'navigator', {
    value: { clipboard: mockClipboard },
    writable: true,
    configurable: true
  });
} else {
  try {
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: mockClipboard,
      writable: true,
      configurable: true
    });
  } catch {
    (globalThis.navigator as any).clipboard = mockClipboard;
  }
}

if (typeof globalThis.window === 'undefined') {
  Object.defineProperty(globalThis, 'window', {
    value: { open: () => ({}) },
    writable: true,
    configurable: true
  });
} else if (typeof (globalThis.window as any).open !== 'function') {
  (globalThis.window as any).open = () => ({});
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

function assertCloseTo(actual: number, expected: number, delta: number, message: string): void {
  if (Math.abs(actual - expected) > delta) {
    throw new Error(`Assertion failed [${message}]: Expected ${expected} (+/-${delta}), but got ${actual}`);
  }
}

export async function runAttendanceMathAiRegulatorTests(): Promise<void> {
  console.log('\n===============================================================');
  console.log('⚡ RUNNING SUITE: Attendance Reality Math & Gemini AI Regulator');
  console.log('===============================================================\n');

  if (typeof globalThis.navigator === 'undefined') {
    (globalThis as any).navigator = { clipboard: mockClipboard, userAgent: 'test' };
  } else {
    (globalThis.navigator as any).clipboard = mockClipboard;
  }
  if (typeof globalThis.window === 'undefined') {
    (globalThis as any).window = { open: () => ({}) };
  } else {
    (globalThis.window as any).open = () => ({});
  }

  let passed = 0;
  let total = 0;

  function test(name: string, fn: () => Promise<void> | void) {
    total++;
    try {
      const res = fn();
      if (res instanceof Promise) {
        return res.then(() => {
          console.log(`  ✓ ${name}`);
          passed++;
        }).catch(err => {
          console.error(`  ✗ ${name}`);
          console.error(`    ${err.message}`);
          throw err;
        });
      } else {
        console.log(`  ✓ ${name}`);
        passed++;
      }
    } catch (err: any) {
      console.error(`  ✗ ${name}`);
      console.error(`    ${err.message}`);
      throw err;
    }
  }

  // 1. Live Effective vs Raw Attendance Computation
  test('Live Attendance Math: computes 69.86% live attendance (51 present / 73 held)', () => {
    const metrics = computeLiveMetrics(DEFAULT_INITIAL_STATE);

    assertEqual(metrics.workingDaysHeld, 73, 'Working days held');
    assertEqual(metrics.presentDays, 41, 'Physically attended days');
    assertEqual(metrics.onDutyDays, 10, 'On-duty credits');
    assertEqual(metrics.effectiveDays, 51, 'Effective credit days (41 phys + 10 OD = 51)');
    
    // Effective percentage: 51 / 73 * 100 = 69.86%
    assertCloseTo(metrics.effectivePct, 69.86, 0.01, 'Effective percentage');
    
    // Raw percentage: 41 / 73 * 100 = 56.16%
    assertCloseTo(metrics.rawPct, 56.16, 0.01, 'Raw physical percentage');

    assertEqual(metrics.statusEffective, 'danger', 'Effective status < 70% is danger / warning');
    assertEqual(metrics.statusRaw, 'danger', 'Raw status < 70% is danger');
  });

  // 2. Safe Leaves to Dec 31 Lock Date
  test('Dec 31 Safe Leaves Projection: computes 13 days for 75% clean and 34 days for 60% floor', () => {
    const metrics = computeLiveMetrics(DEFAULT_INITIAL_STATE);

    assertEqual(metrics.totalSessionDays, 141, 'Total session days');
    assertEqual(metrics.remainingSessionDays, 68, 'Remaining working days (141 - 73 = 68)');

    // Target days for 75% across 141 days = ceil(0.75 * 141) = ceil(105.75) = 106 days
    assertEqual(metrics.targetDays75, 106, 'Target days for 75%');
    
    // Days must attend = max(0, 106 - 51) = 55 days
    assertEqual(metrics.daysMustAttend75, 55, 'Days must attend for 75%');
    
    // Safe leaves remaining = 68 - 55 = 13 days
    assertEqual(metrics.safeLeaves75, 13, 'Safe leaves for 75% limit');

    // Target days for 60% across 141 days = ceil(0.60 * 141) = ceil(84.6) = 85 days
    assertEqual(metrics.targetDays60, 85, 'Target days for 60%');
    
    // Days must attend for 60% = max(0, 85 - 51) = 34 days
    assertEqual(metrics.daysMustAttend60, 34, 'Days must attend for 60%');
    
    // Safe leaves remaining for 60% = 68 - 34 = 34 days
    assertEqual(metrics.safeLeaves60, 34, 'Safe leaves for 60% condonation limit');
  });

  // 3. Consecutive Recovery Formula
  test('Consecutive Compulsory Recovery Math: validates formula and buffer surplus', () => {
    const metrics = computeLiveMetrics(DEFAULT_INITIAL_STATE);

    // Raw physical recovery: (0.75 * 73 - 41) / 0.25 = (54.75 - 41) / 0.25 = 13.75 / 0.25 = 55 days
    assertEqual(metrics.consecutiveRecoveryRaw, 55, 'Raw consecutive recovery days required');

    // Effective recovery: (0.75 * 73 - 51) / 0.25 = 3.75 / 0.25 = 15 days
    assertEqual(metrics.consecutiveRecoveryEffective, 15, 'Effective consecutive recovery days is 15 days');
  });

  // 4. Custom Deficit Recovery Test
  test('Consecutive Recovery: correctly computes positive recovery days when effective falls below 75%', () => {
    const deficitState: InstitutionalAttendanceState = {
      ...DEFAULT_INITIAL_STATE,
      profile: {
        ...DEFAULT_INITIAL_STATE.profile,
        workingDaysHeld: 70,
        presentDays: 40, // 40 + 10 = 50 effective days
        absentDays: 30
      }
    };
    // 0.75 * 70 = 52.5. Effective = 50. Deficit = 2.5.
    // C_rec = ceil(2.5 / 0.25) = 10 consecutive days.
    const metrics = computeLiveMetrics(deficitState);
    assertEqual(metrics.effectiveDays, 50, 'Effective days');
    assertCloseTo(metrics.effectivePct, 71.43, 0.01, 'Effective percentage (50 / 70 = 71.43%)');
    assertEqual(metrics.consecutiveRecoveryEffective, 10, 'Must require 10 consecutive recovery days');
    assertEqual(metrics.statusEffective, 'warning', 'Status must be warning');
  });

  // 5. Hypothetical Scenario Simulation
  test('Simulation Engine: simulates future attendance trajectories accurately', () => {
    // Scenario 1: Take 10 additional leaves and attend 20 days
    const sim1 = simulateAttendanceScenario(DEFAULT_INITIAL_STATE, 10, 20);
    assertEqual(sim1.hypotheticalAbsences, 10, 'Simulated absences');
    assertEqual(sim1.hypotheticalAttended, 20, 'Simulated attended');
    assertEqual(sim1.projectedHeldDays, 73 + 30, 'Projected held days = 103');
    assertEqual(sim1.projectedEffectiveDays, 51 + 20, 'Projected effective days = 71');
    assertCloseTo(sim1.projectedEffectivePct, 68.93, 0.01, 'Projected effective % (71 / 103 = 68.93%)');
    assertEqual(sim1.meetsCondonation60, true, 'Meets 60% condonation floor');

    // Scenario 2: Take 30 additional leaves and attend only 5 days
    const sim2 = simulateAttendanceScenario(DEFAULT_INITIAL_STATE, 30, 5);
    assertEqual(sim2.meetsSafe75, false, 'Fails 75% target on Dec 31');
    assertEqual(sim2.meetsCondonation60, true, 'Still satisfies 60% condonation floor');
  });

  // 6. Gemini Regulatory Prompt Payload Generation
  test('Gemini AI Regulator Prompt: generates rich structured dossier with CBSE references', () => {
    const prompt = generateGeminiRegulatoryPrompt(DEFAULT_INITIAL_STATE);

    // Verify institutional identifiers
    assert(prompt.includes('The Bandhan School Aranghata'), 'Prompt includes School Name');
    assert(prompt.includes('2430453'), 'Prompt includes Affiliation Number');
    assert(prompt.includes('Class XI — Science'), 'Prompt includes Academic Stream');
    assert(prompt.includes('69.86%'), 'Prompt includes live effective percentage');
    assert(prompt.includes('56.16%'), 'Prompt includes live raw percentage');
    assert(prompt.includes('13 days'), 'Prompt includes 13 safe leaves to Dec 31');
    assert(prompt.includes('34 days'), 'Prompt includes 34 safe leaves for condonation');

    // Verify CBSE by-laws and strategic pathways
    assert(prompt.includes('CBSE Examination By-Laws Rule 13.2'), 'Prompt references Rule 13.2');
    assert(prompt.includes('Rule 14 Condonation'), 'Prompt references Rule 14');
    assert(prompt.includes('IIT Kharagpur') && prompt.includes('Kriti RISE'), 'Prompt references IIT KGP On-Duty Credit');
    assert(prompt.includes('NIOS (National Institute of Open Schooling)'), 'Prompt references NIOS guidance');
    assert(prompt.includes('Private British A-Levels'), 'Prompt references British A-Levels pathway');
    assert(prompt.includes('Part of Cosmos'), 'Prompt references Cosmos initiative branding');

    // Verify custom directive injection
    const customPrompt = generateGeminiRegulatoryPrompt(DEFAULT_INITIAL_STATE, 'Analyze Physics 042 practical attendance');
    assert(customPrompt.includes('Analyze Physics 042 practical attendance'), 'Custom user directive injected');
  });

  // 7. Launch Gemini Regulator Action & Clipboard Bridge
  await test('Launch Gemini Regulator Bridge: copies prompt to clipboard and opens web launcher', async () => {
    const result = await launchGeminiRegulator(DEFAULT_INITIAL_STATE);

    assertEqual(result.success, true, 'Launch result must be success');
    const text = mockClipboard.writtenText || (globalThis.navigator as any).clipboard?.writtenText || (globalThis.navigator as any).clipboard?.text || '';
    assert(text.length > 500, 'Must have written comprehensive prompt to clipboard');
    assert(text.includes('SAVANTIX AEGIS: INSTITUTIONAL ATTENDANCE REGULATOR'), 'Clipboard contains header');
  });

  // 8. Boundary Conditions & High/Low Attendance Stress
  test('Boundary Stress: handles 100% attendance and custom low attendance parameters', () => {
    // Custom low attendance scenario
    const lowState: InstitutionalAttendanceState = {
      ...DEFAULT_INITIAL_STATE,
      profile: {
        ...DEFAULT_INITIAL_STATE.profile,
        workingDaysHeld: 100,
        presentDays: 20,
        absentDays: 80,
        onDutyDays: 0,
        totalWorkingDays: 139
      },
      onDuty: []
    };

    const lowMetrics = computeLiveMetrics(lowState);
    assertEqual(lowMetrics.workingDaysHeld, 100, 'Working days held');
    assertEqual(lowMetrics.presentDays, 20, 'Present days');
    assertEqual(lowMetrics.effectivePct, 20, '20% attendance on 20/100');
    assertEqual(lowMetrics.statusEffective, 'danger', 'Status is danger');
    // 0.75 * 100 - 20 = 55 deficit -> ceil(55 / 0.25) = 220 recovery days
    assertEqual(lowMetrics.consecutiveRecoveryEffective, 220, 'Requires 220 consecutive recovery days');

    // Full 100% attendance scenario
    const fullState: InstitutionalAttendanceState = {
      ...DEFAULT_INITIAL_STATE,
      profile: {
        ...DEFAULT_INITIAL_STATE.profile,
        workingDaysHeld: 71,
        presentDays: 71,
        absentDays: 0,
        onDutyDays: 0,
        totalWorkingDays: 139
      },
      onDuty: []
    };
    const fullMetrics = computeLiveMetrics(fullState);
    assertEqual(fullMetrics.effectivePct, 100, '100% attendance');
    assertEqual(fullMetrics.safeLeaves75, 34, 'Full safe leaves margin (68 - (105 - 71) = 68 - 34 = 34)');
    assertEqual(fullMetrics.consecutiveRecoveryEffective, 0, '0 recovery needed');
  });

  // 9. Falsy Zero Preservation & Nullish Coalescing Verification
  test('Falsy Zero Preservation: preserves exact 0 values for presentDays, absentDays, and onDutyCredits', () => {
    const zeroState: InstitutionalAttendanceState = {
      ...DEFAULT_INITIAL_STATE,
      profile: {
        ...DEFAULT_INITIAL_STATE.profile,
        workingDaysHeld: 71,
        presentDays: 0,
        absentDays: 71,
        totalWorkingDays: 139
      },
      onDuty: []
    };

    const zeroMetrics = computeLiveMetrics(zeroState);
    assertEqual(zeroMetrics.presentDays, 0, 'presentDays 0 must be preserved without falling back to 48');
    assertEqual(zeroMetrics.absentDays, 71, 'absentDays 71 preserved');
    assertEqual(zeroMetrics.onDutyDays, 0, 'onDutyDays 0 preserved without falling back to 10');
    assertEqual(zeroMetrics.effectiveDays, 0, 'effectiveDays is 0');
    assertEqual(zeroMetrics.effectivePct, 0, 'effectivePct is 0%');
    assertEqual(zeroMetrics.rawPct, 0, 'rawPct is 0%');
    assertEqual(zeroMetrics.statusEffective, 'danger', 'status is danger');

    // Test explicit onDutyCredits: 0 on profile override
    const explicitZeroOdState: InstitutionalAttendanceState = {
      ...DEFAULT_INITIAL_STATE,
      profile: {
        ...DEFAULT_INITIAL_STATE.profile,
        workingDaysHeld: 50,
        presentDays: 25,
        absentDays: 25,
        onDutyDays: 0
      } as any,
      onDuty: []
    };
    const explicitZeroOdMetrics = computeLiveMetrics(explicitZeroOdState);
    assertEqual(explicitZeroOdMetrics.onDutyDays, 0, 'Explicit 0 on-duty is preserved');
    assertEqual(explicitZeroOdMetrics.effectiveDays, 25, 'Effective days reflects only present days');
  });

  console.log(`\n===============================================================`);
  console.log(`🎉 ATTENDANCE MATH & AI REGULATOR TESTS COMPLETE: ${passed}/${total} PASSED`);
  console.log(`===============================================================\n`);
}

if (typeof process !== 'undefined' && process.argv[1]?.includes('attendanceMathAiRegulator.test')) {
  runAttendanceMathAiRegulatorTests().catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
}
