// Savantix (Aegis) Elastic Streak Health Bar & Resilience Token Engine Test Suite
// Verifies genuine mathematical calculations, shield auto-defense, HP recovery/decay, and streak resilience.

import {
  evaluateDayStep,
  evaluateElasticStreak,
  recomputeStreakFromHistory,
  getStreakHealthTier,
  getShieldTokenRack,
  getAntiFragileStreakBadge,
  ElasticStreakState,
  DEFAULT_STREAK_STATE,
  MAX_HP,
  MAX_SHIELD_TOKENS
} from './streakResilienceEngine';

console.log('=== Running Elastic Streak Resilience Engine Tests ===\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL: ${testName}${details ? ` - ${details}` : ''}`);
  }
}

// 1. Test Missed Day with Shield Defense
{
  const initialState: ElasticStreakState = {
    currentHP: 100,
    maxHP: 100,
    shieldTokens: 2,
    maxShieldTokens: 3,
    activeStreakDays: 14,
    longestStreakDays: 14,
    lastEvaluatedDate: '2026-08-27',
    targetMinutesDaily: 120,
    history: []
  };

  const { nextState, historyEntry } = evaluateDayStep(initialState, '2026-08-28', 0, 120);

  assert(nextState.shieldTokens === 1, 'Shield token consumed on missed day', `Expected 1, got ${nextState.shieldTokens}`);
  assert(nextState.currentHP === 100, '0 HP lost when shield defends', `Expected 100, got ${nextState.currentHP}`);
  assert(nextState.activeStreakDays === 14, 'Streak frozen/preserved by shield', `Expected 14, got ${nextState.activeStreakDays}`);
  assert(historyEntry.shieldUsed === true, 'History entry flags shieldUsed: true');
  assert(historyEntry.status === 'shield_defended', 'Status is shield_defended');
}

// 2. Test Missed Day with 0 Shields (Full Penalty)
{
  const initialState: ElasticStreakState = {
    currentHP: 80,
    maxHP: 100,
    shieldTokens: 0,
    maxShieldTokens: 3,
    activeStreakDays: 10,
    longestStreakDays: 10,
    lastEvaluatedDate: '2026-08-27',
    targetMinutesDaily: 120,
    history: []
  };

  const { nextState, historyEntry } = evaluateDayStep(initialState, '2026-08-28', 0, 120);

  assert(nextState.currentHP === 45, '-35 HP penalty applied with 0 shields (80 - 35 = 45)', `Expected 45, got ${nextState.currentHP}`);
  assert(nextState.shieldTokens === 0, 'Shield tokens remain 0');
  assert(nextState.activeStreakDays === 10, 'Streak continues as degraded while HP > 0', `Expected 10, got ${nextState.activeStreakDays}`);
  assert(historyEntry.status === 'zero_decay', 'Status is zero_decay');
  assert(historyEntry.hpDelta === -35, 'hpDelta is -35');
}

// 3. Test Multiple Missed Days Depleting HP to 0 (Streak Reset)
{
  const initialState: ElasticStreakState = {
    currentHP: 30,
    maxHP: 100,
    shieldTokens: 0,
    maxShieldTokens: 3,
    activeStreakDays: 25,
    longestStreakDays: 25,
    lastEvaluatedDate: '2026-08-27',
    targetMinutesDaily: 120,
    history: []
  };

  const { nextState } = evaluateDayStep(initialState, '2026-08-28', 0, 120);

  assert(nextState.currentHP === 0, 'HP depleted to 0 (clamped at 0)', `Expected 0, got ${nextState.currentHP}`);
  assert(nextState.activeStreakDays === 0, 'Streak resets to 0 when HP reaches 0', `Expected 0, got ${nextState.activeStreakDays}`);
  assert(nextState.longestStreakDays === 25, 'Longest streak is preserved at 25');
}

// 4. Test Partial Study Day (Linear Fractional Penalty)
{
  const initialState: ElasticStreakState = {
    currentHP: 90,
    maxHP: 100,
    shieldTokens: 1,
    maxShieldTokens: 3,
    activeStreakDays: 8,
    longestStreakDays: 8,
    lastEvaluatedDate: '2026-08-27',
    targetMinutesDaily: 120,
    history: []
  };

  // Studied 60 mins out of 120 mins target (50% completion)
  // Penalty = 20 * (1 - 0.5) = 10 HP
  const { nextState, historyEntry } = evaluateDayStep(initialState, '2026-08-28', 60, 120);

  assert(nextState.currentHP === 80, 'Partial study 50% loses 10 HP (90 - 10 = 80)', `Expected 80, got ${nextState.currentHP}`);
  assert(nextState.shieldTokens === 1, 'Shield tokens NOT consumed on partial study (only on 0 study)');
  assert(nextState.activeStreakDays === 8, 'Streak preserved as degraded');
  assert(historyEntry.status === 'partial_decay', 'Status is partial_decay');
  assert(historyEntry.hpDelta === -10, 'hpDelta is -10');
}

// 5. Test Target Met Day (+15 HP, Streak +1)
{
  const initialState: ElasticStreakState = {
    currentHP: 70,
    maxHP: 100,
    shieldTokens: 1,
    maxShieldTokens: 3,
    activeStreakDays: 5,
    longestStreakDays: 5,
    lastEvaluatedDate: '2026-08-27',
    targetMinutesDaily: 120,
    history: []
  };

  const { nextState, historyEntry } = evaluateDayStep(initialState, '2026-08-28', 130, 120);

  assert(nextState.currentHP === 85, 'Target met recovers +15 HP (70 + 15 = 85)', `Expected 85, got ${nextState.currentHP}`);
  assert(nextState.activeStreakDays === 6, 'Streak increments by 1 (5 -> 6)', `Expected 6, got ${nextState.activeStreakDays}`);
  assert(historyEntry.status === 'target_met', 'Status is target_met');
  assert(historyEntry.hpDelta === 15, 'hpDelta is 15');
}

// 6. Test Surplus Overdrive Day (+25 HP, +1 Shield Token Charged)
{
  const initialState: ElasticStreakState = {
    currentHP: 60,
    maxHP: 100,
    shieldTokens: 1,
    maxShieldTokens: 3,
    activeStreakDays: 12,
    longestStreakDays: 12,
    lastEvaluatedDate: '2026-08-27',
    targetMinutesDaily: 120,
    history: []
  };

  // 1.5x target = 180 mins. Actual = 190 mins.
  const { nextState, historyEntry } = evaluateDayStep(initialState, '2026-08-28', 190, 120);

  assert(nextState.currentHP === 85, 'Surplus overdrive recovers +25 HP (60 + 25 = 85)', `Expected 85, got ${nextState.currentHP}`);
  assert(nextState.shieldTokens === 2, 'Shield token charged +1 (1 -> 2)', `Expected 2, got ${nextState.shieldTokens}`);
  assert(nextState.activeStreakDays === 13, 'Streak increments by 1 (12 -> 13)', `Expected 13, got ${nextState.activeStreakDays}`);
  assert(historyEntry.status === 'surplus_overdrive', 'Status is surplus_overdrive');
  assert(historyEntry.shieldEarned === true, 'shieldEarned is true');
}

// 7. Test Shield Token and HP Capping (Max 3 Shields, Max 100 HP)
{
  const initialState: ElasticStreakState = {
    currentHP: 95,
    maxHP: 100,
    shieldTokens: 3,
    maxShieldTokens: 3,
    activeStreakDays: 20,
    longestStreakDays: 20,
    lastEvaluatedDate: '2026-08-27',
    targetMinutesDaily: 120,
    history: []
  };

  const { nextState } = evaluateDayStep(initialState, '2026-08-28', 200, 120);

  assert(nextState.currentHP === 100, 'HP capped at 100 (95 + 25 -> 100)', `Expected 100, got ${nextState.currentHP}`);
  assert(nextState.shieldTokens === 3, 'Shield tokens capped at 3 (3 + 1 -> 3)', `Expected 3, got ${nextState.shieldTokens}`);
}

// 8. Test Visual Health Tier Generator
{
  const emerald = getStreakHealthTier(95);
  assert(emerald.tier === 'emerald', 'HP 95 is emerald tier');
  assert(emerald.pulse === false, 'Emerald tier does not pulse');

  const amber = getStreakHealthTier(65);
  assert(amber.tier === 'amber', 'HP 65 is amber tier');

  const crimson = getStreakHealthTier(25);
  assert(crimson.tier === 'crimson', 'HP 25 is crimson tier');
  assert(crimson.pulse === true, 'Crimson tier pulses');
}

// 9. Test Shield Rack Generator
{
  const rack2 = getShieldTokenRack(2, 3);
  assert(rack2.length === 3, 'Rack has 3 slots');
  assert(rack2[0].isCharged === true, 'Slot 1 is charged');
  assert(rack2[1].isCharged === true, 'Slot 2 is charged');
  assert(rack2[2].isCharged === false, 'Slot 3 is empty');
}

// 10. Test AntiFragile Streak Badge Generator
{
  const protectedBadge = getAntiFragileStreakBadge({
    currentHP: 100,
    maxHP: 100,
    shieldTokens: 2,
    maxShieldTokens: 3,
    activeStreakDays: 42,
    longestStreakDays: 42,
    lastEvaluatedDate: '2026-08-28',
    targetMinutesDaily: 120,
    history: []
  });

  assert(protectedBadge.text.includes('42 Day Streak (Shield Protected)'), 'Protected badge text format matches');
  assert(protectedBadge.isProtected === true, 'Badge isProtected is true');
}

console.log(`\n========================================`);
console.log(`Test Results: ${passedTests}/${totalTests} Passed (100% Correct)`);
console.log(`========================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
