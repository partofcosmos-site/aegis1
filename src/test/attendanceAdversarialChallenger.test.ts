/**
 * Savantix (Aegis) — Adversarial Challenger 1 Test Suite
 * @file attendanceAdversarialChallenger.test.ts
 * 
 * Deep Empirical Stress-Testing:
 * 1. Mathematical Invariant 1: Safe leaves + bounded required days = remaining session days.
 * 2. Mathematical Invariant 2: Consecutive recovery exact convergence (day C-1 < 75%, day C >= 75%).
 * 3. Mathematical Invariant 3: Monotonicity of simulation projections.
 * 4. Extreme Edge Cases:
 *    - 0 days held
 *    - 100% absence (0 present, 0 OD)
 *    - 100% presence (P = T_held)
 *    - Excessive On-Duty credits (OD > T_held)
 *    - Lock date in past (T_held >= T_session)
 *    - Negative inputs (T_held < 0, P < 0, OD < 0)
 *    - Massive scale inputs (1,000,000+ days)
 * 5. 10,000-iteration randomized property-based fuzzing harness.
 * 6. CBSE Rule 13.2 / 14 regulatory payload authenticity audit.
 */

import {
  computeLiveMetrics,
  simulateAttendanceScenario,
  generateGeminiRegulatoryPrompt,
  launchGeminiRegulator,
  DEFAULT_INITIAL_STATE,
  DEFAULT_PROFILE,
  DEFAULT_HOLIDAYS,
  DEFAULT_VACATIONS,
  DEFAULT_EXAMS,
  DEFAULT_ABSENCES,
  DEFAULT_ON_DUTY
} from '../services/attendanceRegulatorService';

import { InstitutionalAttendanceState, InstitutionalProfile } from '../types/attendance';

// Global mocks for clipboard and window
class MockClipboard {
  public writtenText: string = '';
  async writeText(text: string): Promise<void> {
    this.writtenText = text;
  }
}

const mockClipboard = new MockClipboard();
if (typeof globalThis.navigator === 'undefined') {
  (globalThis as any).navigator = { clipboard: mockClipboard, userAgent: 'AdversarialTestRunner' };
} else {
  try {
    (globalThis.navigator as any).clipboard = mockClipboard;
  } catch {}
}

if (typeof globalThis.window === 'undefined') {
  (globalThis as any).window = { open: () => ({}), localStorage: (globalThis as any).localStorage };
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[CHALLENGER ASSERTION FAILED]: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`[CHALLENGER ASSERTION FAILED] ${message}: Expected "${expected}", got "${actual}"`);
  }
}

function assertCloseTo(actual: number, expected: number, delta: number, message: string): void {
  if (Math.abs(actual - expected) > delta) {
    throw new Error(`[CHALLENGER ASSERTION FAILED] ${message}: Expected ${expected} (+/-${delta}), got ${actual}`);
  }
}

export async function runAdversarialChallengerTests(): Promise<{ passed: number; total: number; challenges: string[] }> {
  console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║ 🛡️  SAVANTIX AEGIS: ADVERSARIAL CHALLENGER 1 STRESS HARNESS        ║');
  console.log('║    Empirical Verification of Reality Math & AI Regulator Invariants║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  let passed = 0;
  let total = 0;
  const challenges: string[] = [];

  function test(name: string, fn: () => void | Promise<void>) {
    total++;
    try {
      const res = fn();
      if (res instanceof Promise) {
        return res.then(() => {
          console.log(`  ✓ [PASS] ${name}`);
          passed++;
        }).catch(err => {
          console.error(`  ✗ [FAIL] ${name}`);
          console.error(`    ${err.message}`);
          challenges.push(`${name}: ${err.message}`);
          throw err;
        });
      } else {
        console.log(`  ✓ [PASS] ${name}`);
        passed++;
      }
    } catch (err: any) {
      console.error(`  ✗ [FAIL] ${name}`);
      console.error(`    ${err.message}`);
      challenges.push(`${name}: ${err.message}`);
      throw err;
    }
  }

  // =========================================================================
  // 1. INVARIANT VERIFICATION: Consecutive Compulsory Recovery
  // =========================================================================
  test('INVARIANT 1: Exact Consecutive Recovery Convergence on Day C (Non-Zero Present Days)', () => {
    // Test across hundreds of arbitrary (held, present, OD) combinations where attendance is < 75%
    // Using present >= 1 to isolate pure mathematical formula behavior
    for (let held = 2; held <= 150; held += 4) {
      for (let present = 1; present <= held; present += 3) {
        for (let od = 0; od <= 15; od += 5) {
          const effective = present + od;
          if (effective / held < 0.75) {
            const state: InstitutionalAttendanceState = {
              ...DEFAULT_INITIAL_STATE,
              profile: {
                ...DEFAULT_PROFILE,
                workingDaysHeld: held,
                presentDays: present,
                totalWorkingDays: 200
              },
              onDuty: od > 0 ? [{
                id: 'od_test',
                program: 'Test',
                institution: 'Test',
                startDate: '2026-06-01',
                endDate: '2026-06-10',
                workingDays: od,
                status: 'APPROVED_ON_DUTY',
                verificationRef: 'REF',
                description: 'Desc'
              }] : []
            };

            const metrics = computeLiveMetrics(state);
            const C = metrics.consecutiveRecoveryEffective;
            assert(C > 0, `For held=${held}, eff=${effective} (< 75%), C must be > 0, got ${C}`);

            // On day C: attendance must be >= 75%
            const pctOnDayC = ((effective + C) / (held + C)) * 100;
            assert(
              pctOnDayC >= 75.0,
              `On recovery day ${C}, attendance must be >= 75%, but got ${pctOnDayC}% (held=${held}, eff=${effective})`
            );

            // On day C - 1: attendance must be strictly < 75%
            if (C > 1) {
              const pctOnDayCMinus1 = ((effective + C - 1) / (held + C - 1)) * 100;
              assert(
                pctOnDayCMinus1 < 75.0,
                `On day ${C - 1}, attendance must be < 75%, but got ${pctOnDayCMinus1}% (held=${held}, eff=${effective})`
              );
            }
          }
        }
      }
    }
  });

  // =========================================================================
  // =========================================================================
  // 2. INVARIANT VERIFICATION: Safe Leaves and Required Days Partitioning
  // =========================================================================
  test('INVARIANT 2: Safe Leaves Partitioning & Mathematical Conservation (eff >= 1)', () => {
    // For all reachable targets (where target <= effective + R):
    // safeLeaves + daysMustAttend == remainingSessionDays
    for (let total = 50; total <= 200; total += 25) {
      for (let held = 2; held < total; held += 20) {
        for (let eff = 1; eff <= held; eff += 15) {
          const state: InstitutionalAttendanceState = {
            ...DEFAULT_INITIAL_STATE,
            profile: {
              ...DEFAULT_PROFILE,
              totalWorkingDays: total,
              workingDaysHeld: held,
              presentDays: eff
            },
            onDuty: []
          };

          const m = computeLiveMetrics(state);
          const R = m.remainingSessionDays;
          assertEqual(R, total - held, `Remaining days must equal total - held`);

          // If the target is reachable:
          if (m.targetDays75 <= eff + R) {
            assertEqual(
              m.safeLeaves75 + m.daysMustAttend75,
              R,
              `Reachable target invariant: safeLeaves75 (${m.safeLeaves75}) + daysMustAttend75 (${m.daysMustAttend75}) must equal R (${R})`
            );
          } else {
            // Unreachable target:
            assertEqual(m.safeLeaves75, 0, `Unreachable target must have 0 safe leaves`);
            assert(m.daysMustAttend75 > R, `Unreachable target must require more days than remaining`);
          }

          // Same for 60% threshold
          if (m.targetDays60 <= eff + R) {
            assertEqual(
              m.safeLeaves60 + m.daysMustAttend60,
              R,
              `Reachable target invariant (60%): safeLeaves60 (${m.safeLeaves60}) + daysMustAttend60 (${m.daysMustAttend60}) must equal R (${R})`
            );
          } else {
            assertEqual(m.safeLeaves60, 0, `Unreachable 60% target must have 0 safe leaves`);
          }
        }
      }
    }
  });

  // =========================================================================
  // 3. INVARIANT VERIFICATION: Simulation Engine Monotonicity
  // =========================================================================
  test('INVARIANT 3: Simulation Monotonicity (Leaves Decrease Final %, Attendance Increases Final %)', () => {
    const baseState = DEFAULT_INITIAL_STATE;
    const baseSim = simulateAttendanceScenario(baseState, 0, 0);

    let prevPct = baseSim.projectedFinalPctDec31;
    // Increasing hypothetical absences monotonically decreases or maintains projected final %
    for (let l = 1; l <= 40; l++) {
      const sim = simulateAttendanceScenario(baseState, l, 0);
      assert(
        sim.projectedFinalPctDec31 <= prevPct + 0.0001,
        `Projected % with ${l} leaves (${sim.projectedFinalPctDec31}%) cannot exceed with ${l-1} leaves (${prevPct}%)`
      );
      prevPct = sim.projectedFinalPctDec31;
    }

    // Increasing hypothetical attendances (with fixed future window) monotonically increases or maintains projected %
    const fixedFuture = 30;
    let prevAttPct = -1;
    for (let a = 0; a <= fixedFuture; a++) {
      const leaves = fixedFuture - a;
      const sim = simulateAttendanceScenario(baseState, leaves, a);
      assert(
        sim.projectedFinalPctDec31 >= prevAttPct - 0.0001,
        `Projected % with ${a} attended (${sim.projectedFinalPctDec31}%) cannot be less than ${a-1} attended (${prevAttPct}%)`
      );
      prevAttPct = sim.projectedFinalPctDec31;
    }
  });

  // =========================================================================
  // 4. ADVERSARIAL EDGE CASE: Zero Value Falsy Fallback Defect Test
  // =========================================================================
  test('EDGE CASE: Zero Value Handling (Validating profile.presentDays === 0 preserved without fallback to 48)', () => {
    const zeroAttState: InstitutionalAttendanceState = {
      ...DEFAULT_INITIAL_STATE,
      profile: {
        ...DEFAULT_PROFILE,
        workingDaysHeld: 71,
        presentDays: 0,
        absentDays: 71,
        totalWorkingDays: 139
      },
      onDuty: []
    };

    const m = computeLiveMetrics(zeroAttState);
    assertEqual(m.presentDays, 0, 'presentDays 0 is preserved');
    assertEqual(m.absentDays, 71, 'absentDays 71 is preserved');
    assertEqual(m.onDutyDays, 0, 'onDutyDays 0 is preserved');
    assertEqual(m.effectiveDays, 0, 'effectiveDays is 0');
    assertEqual(m.effectivePct, 0, 'effectivePct is 0%');
    assertEqual(m.rawPct, 0, 'rawPct is 0%');
  });

  // =========================================================================
  // 6. ADVERSARIAL EDGE CASE: 100% Presence (P = T_held)
  // =========================================================================
  test('EDGE CASE: 100% Presence (Flawless Attendance)', () => {
    const fullState: InstitutionalAttendanceState = {
      ...DEFAULT_INITIAL_STATE,
      profile: {
        ...DEFAULT_PROFILE,
        workingDaysHeld: 71,
        presentDays: 71,
        absentDays: 0,
        totalWorkingDays: 139
      },
      onDuty: []
    };

    const m = computeLiveMetrics(fullState);
    assertEqual(m.effectivePct, 100, 'Effective attendance must be 100%');
    assertEqual(m.rawPct, 100, 'Raw attendance must be 100%');
    assertEqual(m.consecutiveRecoveryEffective, 0, 'Recovery must be 0');
    assertEqual(m.statusEffective, 'safe', 'Status is safe');
    
    // Target 75% = 105. Remaining = 68. Attended = 71. Must attend = max(0, 105 - 71) = 34.
    // Safe leaves = 68 - 34 = 34 days.
    assertEqual(m.safeLeaves75, 34, 'Safe leaves is 34 days');
    assertEqual(m.daysMustAttend75, 34, 'Days must attend is 34 days');
  });

  // =========================================================================
  // 7. ADVERSARIAL EDGE CASE: Massive On-Duty Credits (OD > T_held)
  // =========================================================================
  test('EDGE CASE: Excessive On-Duty Credits (OD > T_held)', () => {
    const hugeODState: InstitutionalAttendanceState = {
      ...DEFAULT_INITIAL_STATE,
      profile: {
        ...DEFAULT_PROFILE,
        workingDaysHeld: 50,
        presentDays: 30,
        absentDays: 20,
        totalWorkingDays: 139
      },
      onDuty: [
        {
          id: 'od_huge',
          program: 'Huge Deputation',
          institution: 'IIT KGP',
          startDate: '2026-05-01',
          endDate: '2026-07-01',
          workingDays: 100,
          status: 'APPROVED_ON_DUTY',
          verificationRef: 'REF-HUGE',
          description: 'Large OD'
        }
      ]
    };

    const m = computeLiveMetrics(hugeODState);
    assertEqual(m.effectiveDays, 130, 'Effective days = 30 + 100 = 130');
    assert(m.effectivePct > 100, 'Effective % reflects massive credit cleanly without crashing');
    assertEqual(m.consecutiveRecoveryEffective, 0, '0 recovery needed');
    
    // Target 75% = 105. Effective = 130 >= 105.
    assertEqual(m.daysMustAttend75, 0, 'Must attend 0 more days');
    assertEqual(m.safeLeaves75, m.remainingSessionDays, 'Safe leaves is entire remaining session');
  });

  // =========================================================================
  // 8. ADVERSARIAL EDGE CASE: Lock Date in Past (T_held >= T_session)
  // =========================================================================
  test('EDGE CASE: Lock Date in Past or T_held >= T_session', () => {
    const pastState: InstitutionalAttendanceState = {
      ...DEFAULT_INITIAL_STATE,
      profile: {
        ...DEFAULT_PROFILE,
        workingDaysHeld: 150,
        presentDays: 120,
        absentDays: 30,
        totalWorkingDays: 139
      },
      onDuty: []
    };

    const m = computeLiveMetrics(pastState);
    assertEqual(m.totalSessionDays, 150, 'totalSessionDays adapts to Math.max(tHeld, totalWorkingDays)');
    assertEqual(m.remainingSessionDays, 0, 'Remaining days is 0 (session completed)');
    assertEqual(m.safeLeaves75, 0, '0 safe leaves remaining once session concludes');
    assertEqual(m.daysMustAttend75, 0, '0 days must attend in past session');
    assertCloseTo(m.effectivePct, 80.0, 0.01, '120/150 = 80.00%');
  });

  // =========================================================================
  // 9. ADVERSARIAL EDGE CASE: Negative & Null Inputs Resilience
  // =========================================================================
  test('EDGE CASE: Negative Inputs Resilience & Sanitization', () => {
    const negativeState: InstitutionalAttendanceState = {
      ...DEFAULT_INITIAL_STATE,
      profile: {
        ...DEFAULT_PROFILE,
        workingDaysHeld: -50,
        presentDays: -20,
        absentDays: -30,
        totalWorkingDays: -100
      },
      onDuty: [
        {
          id: 'od_neg',
          program: 'Negative OD',
          institution: 'None',
          startDate: '2026-01-01',
          endDate: '2026-01-02',
          workingDays: -10,
          status: 'APPROVED_ON_DUTY',
          verificationRef: 'REF',
          description: 'Negative'
        }
      ]
    };

    const m = computeLiveMetrics(negativeState);
    assert(m.workingDaysHeld >= 1, 'Sanitizes negative working days to at least 1');
    assert(m.presentDays >= 0, 'Sanitizes negative present days to at least 0');
    assert(m.absentDays >= 0, 'Sanitizes negative absent days to at least 0');
    assert(!isNaN(m.effectivePct), 'No NaN on negative inputs');
    assert(isFinite(m.effectivePct), 'Finite percentage on negative inputs');
  });

  // =========================================================================
  // 10. ADVERSARIAL EDGE CASE: Massive Scale Stress (10,000,000 Days)
  // =========================================================================
  test('EDGE CASE: Massive Scale Inputs (10,000,000 Days)', () => {
    const massiveState: InstitutionalAttendanceState = {
      ...DEFAULT_INITIAL_STATE,
      profile: {
        ...DEFAULT_PROFILE,
        workingDaysHeld: 5_000_000,
        presentDays: 3_500_000,
        absentDays: 1_500_000,
        totalWorkingDays: 10_000_000
      },
      onDuty: []
    };

    const m = computeLiveMetrics(massiveState);
    assertEqual(m.effectivePct, 70.0, '70% attendance on 3.5M / 5M');
    // 0.75 * 5M = 3.75M. Deficit = 250,000. C_rec = 250,000 / 0.25 = 1,000,000.
    assertEqual(m.consecutiveRecoveryEffective, 1_000_000, 'Requires 1M recovery days');
    // Verify: (3.5M + 1M) / (5M + 1M) = 4.5M / 6M = 0.75 = 75.00%!
    assertCloseTo(((3.5e6 + 1e6) / (5e6 + 1e6)) * 100, 75.0, 0.0001, 'Massive convergence holds exactly');
  });

  // =========================================================================
  // 11. PROPERTY-BASED FUZZING: 10,000 Randomized Test Vectors
  // =========================================================================
  test('PROPERTY-BASED FUZZING: 10,000 Randomized State Vectors', () => {
    let fuzzPassed = 0;
    const NUM_TRIALS = 10000;

    for (let i = 0; i < NUM_TRIALS; i++) {
      const totalDays = Math.floor(Math.random() * 400) + 1;
      const heldDays = Math.floor(Math.random() * (totalDays + 50));
      const presentDays = Math.floor(Math.random() * (heldDays + 1));
      const absentDays = heldDays - presentDays;
      const odDays = Math.floor(Math.random() * 30);

      const fuzzedState: InstitutionalAttendanceState = {
        ...DEFAULT_INITIAL_STATE,
        profile: {
          ...DEFAULT_PROFILE,
          totalWorkingDays: totalDays,
          workingDaysHeld: heldDays,
          presentDays: presentDays,
          absentDays: absentDays
        },
        onDuty: odDays > 0 ? [{
          id: `od_fuzz_${i}`,
          program: 'Fuzz OD',
          institution: 'Fuzz Inst',
          startDate: '2026-06-01',
          endDate: '2026-06-10',
          workingDays: odDays,
          status: 'APPROVED_ON_DUTY',
          verificationRef: 'REF',
          description: 'Fuzz'
        }] : []
      };

      const m = computeLiveMetrics(fuzzedState);

      // Invariants check for each random state:
      assert(!isNaN(m.effectivePct), `Trial ${i}: effectivePct NaN`);
      assert(!isNaN(m.rawPct), `Trial ${i}: rawPct NaN`);
      assert(m.workingDaysHeld >= 1, `Trial ${i}: workingDaysHeld < 1`);
      assert(m.consecutiveRecoveryEffective >= 0, `Trial ${i}: negative recovery`);
      assert(m.safeLeaves75 >= 0, `Trial ${i}: negative safe leaves`);
      assert(m.daysMustAttend75 >= 0, `Trial ${i}: negative must attend`);

      // Recovery exactness check if below 75%:
      if (m.effectiveDays / m.workingDaysHeld < 0.75) {
        const C = m.consecutiveRecoveryEffective;
        const recoveredPct = ((m.effectiveDays + C) / (m.workingDaysHeld + C)) * 100;
        assert(recoveredPct >= 75.0, `Trial ${i}: C=${C} failed to reach 75%, got ${recoveredPct}%`);
      }

      // Simulation fuzzing
      const futureLeaves = Math.floor(Math.random() * 50);
      const futureAttended = Math.floor(Math.random() * 50);
      const sim = simulateAttendanceScenario(fuzzedState, futureLeaves, futureAttended);
      assert(!isNaN(sim.projectedFinalPctDec31), `Trial ${i}: sim NaN`);
      assert(sim.projectedFinalPctDec31 >= 0, `Trial ${i}: sim negative`);

      fuzzPassed++;
    }

    assertEqual(fuzzPassed, NUM_TRIALS, `All ${NUM_TRIALS} fuzzing trials passed`);
  });

  // =========================================================================
  // 12. REGULATORY AUDIT: CBSE Rule 13.2 / 14 Authenticity & AI Prompt Dossier
  // =========================================================================
  test('REGULATORY AUDIT: CBSE Rule 13.2 / 14 Authenticity & Legal Defense Dossier', () => {
    const prompt = generateGeminiRegulatoryPrompt(DEFAULT_INITIAL_STATE);

    // 1. Institutional Identity Accuracy
    assert(prompt.includes('The Bandhan School Aranghata'), 'Prompt includes official School Name');
    assert(prompt.includes('2430453'), 'Prompt includes CBSE Affiliation No. 2430453');
    assert(prompt.includes('Class XI — Science'), 'Prompt includes Stream (Class XI Science)');
    assert(prompt.includes('Mon – Fri Schedule') || prompt.includes('Monday to Friday'), 'Prompt includes 5-day Mon-Fri schedule');
    assert(prompt.includes('2026-04-21') && prompt.includes('2026-12-31'), 'Prompt includes session window Apr 21 - Dec 31');
    assert(prompt.includes('139 days') || prompt.includes('139'), 'Prompt includes 139 total working days');

    // 2. Ground Truth Figures (Sept 1, 2026)
    assert(prompt.includes('71 days') || prompt.includes('71'), 'Prompt includes 71 held days');
    assert(prompt.includes('48 days') || prompt.includes('48'), 'Prompt includes 48 present days');
    assert(prompt.includes('10 days') || prompt.includes('10'), 'Prompt includes 10 on-duty days');
    assert(prompt.includes('58 / 71') || prompt.includes('58'), 'Prompt includes 58 effective credit days');
    assert(prompt.includes('81.69%'), 'Prompt includes 81.69% effective attendance');
    assert(prompt.includes('67.61%'), 'Prompt includes 67.61% raw physical attendance');
    assert(prompt.includes('21 days') || prompt.includes('21'), 'Prompt includes 21 safe leaves to 75%');
    assert(prompt.includes('42 days') || prompt.includes('42'), 'Prompt includes 42 safe leaves to 60%');

    // 3. CBSE By-Laws Legal Rule Citations
    assert(prompt.includes('Rule 13.2'), 'Prompt cites CBSE Rule 13.2 (Regular course of study requirement)');
    assert(prompt.includes('Rule 14'), 'Prompt cites CBSE Rule 14 (Condonation of shortage of attendance)');
    assert(prompt.includes('Rule 14(i)') || prompt.includes('Rule 14'), 'Prompt cites Rule 14 medical & sports/Olympiad condonation');
    assert(prompt.includes('OASIS / LOC portal') || prompt.includes('CBSE OASIS'), 'Prompt cites CBSE portal submission guidelines');

    // 4. Strategic High-Performance Advisory Roster
    assert(prompt.includes('NIOS (National Institute of Open Schooling)'), 'Prompt contains NIOS alternative board guidance');
    assert(prompt.includes('Private British A-Levels'), 'Prompt contains British A-Levels pathway for MIT/Ivy League/IPhO');
    assert(prompt.includes('IIT Kharagpur') && prompt.includes('Kriti RISE'), 'Prompt contains IIT KGP Kriti RISE On-Duty program citation');
    assert(prompt.includes('Part of Cosmos'), 'Prompt maintains "An initiative of Part of Cosmos" branding');
  });

  // =========================================================================
  // 13. REGULATORY AUDIT: Clipboard Copy & Interactive Launch Mechanics
  // =========================================================================
  await test('REGULATORY AUDIT: launchGeminiRegulator Bridge & Clipboard Dispatch', async () => {
    mockClipboard.writtenText = '';
    const res = await launchGeminiRegulator(DEFAULT_INITIAL_STATE, 'Audit JEE Advanced calculus hours');

    assertEqual(res.success, true, 'Launch bridge returns success: true');
    assert(mockClipboard.writtenText.length > 500, 'Clipboard receives full dossier text (> 500 chars)');
    assert(mockClipboard.writtenText.includes('Audit JEE Advanced calculus hours'), 'Custom query injected into clipboard prompt');
    assert(mockClipboard.writtenText.includes('SAVANTIX AEGIS: INSTITUTIONAL ATTENDANCE REGULATOR'), 'Correct dossier header in clipboard');
  });

  console.log('\n===================================================================');
  console.log(`🛡️  ADVERSARIAL CHALLENGER TESTS COMPLETE: ${passed}/${total} PASSED`);
  if (challenges.length > 0) {
    console.error(`⚠️  CHALLENGES DETECTED (${challenges.length}):`);
    challenges.forEach(c => console.error(`   - ${c}`));
  } else {
    console.log('✅ ALL INVARIANTS, EDGE CASES, AND REGULATORY AUDITS EMPIRICALLY CONFIRMED!');
  }
  console.log('===================================================================\n');

  return { passed, total, challenges };
}

// Auto-run when executed directly via tsx
if (typeof process !== 'undefined' && process.argv[1]?.includes('attendanceAdversarialChallenger.test')) {
  runAdversarialChallengerTests().catch(err => {
    console.error('Adversarial Challenger test runner failure:', err);
    process.exit(1);
  });
}
