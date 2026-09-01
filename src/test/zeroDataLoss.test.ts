/**
 * Savantix (Aegis) — Zero Data Loss & Storage Invariant Test Suite
 * @file zeroDataLoss.test.ts
 * 
 * Verifies:
 * 1. Complete inventory & integrity of all 31+ localStorage keys in Savantix
 * 2. Non-destructive union merge guarantees in CloudSyncService across logs, goals, reflections, attendance, flashcards
 * 3. Secondary fail-safe backup preservation (savantix_logs_backup_latest)
 * 4. Deterministic canonical user ID generation (CloudSyncService.getCanonicalUid)
 * 5. Debanjan Historical Baseline Seed Invariant (seedDebanjanHistoryIfEmpty)
 * 6. Resiliency against corrupt storage, partial writes, and empty states without data loss
 */

// ─── IN-MEMORY LOCALSTORAGE MOCK FOR NODE ENVIRONMENT ───────────────────────
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

// Attach mock localStorage, window, navigator to global environment if in Node.js
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
    location: { origin: 'http://localhost:3000' }
  };
}

if (typeof globalThis.navigator === 'undefined') {
  (globalThis as any).navigator = {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SavantixZeroDataLoss/1.0'
  };
}

import { CloudSyncService, CloudSyncPayload } from '../services/cloudSyncService';
import { seedDebanjanHistoryIfEmpty, getDebanjanHistoricalSeedData } from '../utils/debanjanHistoryData';

// ─── SAVANTIX PERSISTENT STORAGE REGISTRY (31+ KEYS) ───────────────────────
export interface StorageKeyDefinition {
  keyPattern: string;
  category: 'core_session' | 'study_data' | 'guest_cache' | 'tools_cache' | 'feedback_hub' | 'audio_focus';
  description: string;
  isDynamic: boolean;
  nonDestructiveRequirement: boolean;
}

export const SAVANTIX_STORAGE_REGISTRY: StorageKeyDefinition[] = [
  // Core Session & Cloud Sync
  { keyPattern: 'savantix_user_session', category: 'core_session', description: 'Cached authenticated user session info', isDynamic: false, nonDestructiveRequirement: true },
  { keyPattern: 'savantix_is_guest', category: 'core_session', description: 'Guest mode toggle flag', isDynamic: false, nonDestructiveRequirement: true },
  { keyPattern: 'savantix_last_cloud_sync_time', category: 'core_session', description: 'Timestamp of last successful bidirectional sync', isDynamic: false, nonDestructiveRequirement: false },
  
  // User Study Logs & Primary Entities
  { keyPattern: 'savantix_user_logs_${uid}', category: 'study_data', description: 'User study logs with duration, topic, mistakes, focus score', isDynamic: true, nonDestructiveRequirement: true },
  { keyPattern: 'savantix_user_goals_${uid}', category: 'study_data', description: 'User goals with milestones and progress percentage', isDynamic: true, nonDestructiveRequirement: true },
  { keyPattern: 'savantix_user_journal_${uid}', category: 'study_data', description: 'User daily reflections and socratic cognitive logs', isDynamic: true, nonDestructiveRequirement: true },
  { keyPattern: 'savantix_user_insights_${uid}', category: 'study_data', description: 'AI-generated study insights and recommendations', isDynamic: true, nonDestructiveRequirement: true },
  { keyPattern: 'savantix_user_profile_${uid}', category: 'study_data', description: 'User target exams and study hour configurations', isDynamic: true, nonDestructiveRequirement: true },
  { keyPattern: 'savantix_logs_backup_latest', category: 'study_data', description: 'Fail-safe secondary backup copy of all study logs', isDynamic: false, nonDestructiveRequirement: true },

  // Guest State Cache
  { keyPattern: 'savantix_guest_logs', category: 'guest_cache', description: 'Guest study logs cache', isDynamic: false, nonDestructiveRequirement: true },
  { keyPattern: 'savantix_guest_insights', category: 'guest_cache', description: 'Guest AI insights cache', isDynamic: false, nonDestructiveRequirement: true },
  { keyPattern: 'savantix_guest_goals', category: 'guest_cache', description: 'Guest goals cache', isDynamic: false, nonDestructiveRequirement: true },
  { keyPattern: 'savantix_guest_journal', category: 'guest_cache', description: 'Guest reflections cache', isDynamic: false, nonDestructiveRequirement: true },
  { keyPattern: 'savantix_guest_chat_sessions', category: 'guest_cache', description: 'Guest AI chat sessions list', isDynamic: false, nonDestructiveRequirement: true },
  { keyPattern: 'savantix_guest_session_${sessionId}', category: 'guest_cache', description: 'Guest individual chatbot conversation history', isDynamic: true, nonDestructiveRequirement: true },

  // Specialized STEM & Habit Tools
  { keyPattern: 'savantix_attendance_data_v1', category: 'tools_cache', description: 'School/College attendance subject metrics & thresholds', isDynamic: false, nonDestructiveRequirement: true },
  { keyPattern: 'savantix_exam_targets', category: 'tools_cache', description: 'Exam countdown target dates and subjects', isDynamic: false, nonDestructiveRequirement: true },
  { keyPattern: 'savantix_flashcards', category: 'tools_cache', description: 'Universal FSRS spaced repetition flashcard decks', isDynamic: false, nonDestructiveRequirement: true },
  { keyPattern: 'savantix_flashcards_${uid}', category: 'tools_cache', description: 'User-specific flashcard decks and review ratings', isDynamic: true, nonDestructiveRequirement: true },
  { keyPattern: 'savantix_streak_resilience_state_v1', category: 'tools_cache', description: '100 HP health bar & resilience shield tokens', isDynamic: false, nonDestructiveRequirement: true },
  { keyPattern: 'savantix_stem_scratchpad_data', category: 'tools_cache', description: 'High-DPI scratchpad drawing canvas strokes & backup', isDynamic: false, nonDestructiveRequirement: true },
  { keyPattern: 'savantix_flowmodoro_state', category: 'tools_cache', description: 'Flowmodoro stopwatch elapsed time and break balance', isDynamic: false, nonDestructiveRequirement: true },
  { keyPattern: 'savantix_pid_equilibrium_v1', category: 'tools_cache', description: 'Subject equilibrium matrix PID target weights', isDynamic: false, nonDestructiveRequirement: true },
  { keyPattern: 'savantix_parallel_router_models', category: 'tools_cache', description: 'Decentralized multi-provider AI model selection', isDynamic: false, nonDestructiveRequirement: true },
  { keyPattern: 'savantix_ai_vault_keys', category: 'tools_cache', description: 'Client-side encrypted BYOK AI provider API keys', isDynamic: false, nonDestructiveRequirement: true },
  { keyPattern: 'savantix_chat_session_${uid}_${sessionId}', category: 'tools_cache', description: 'User individual chatbot conversation thread', isDynamic: true, nonDestructiveRequirement: true },

  // Contact & Community Feedback Hub
  { keyPattern: 'savantix_feedback_draft', category: 'feedback_hub', description: 'Contact form in-progress message draft auto-save', isDynamic: false, nonDestructiveRequirement: true },
  { keyPattern: 'savantix_submitted_feedback', category: 'feedback_hub', description: 'Sent feedback tickets history and delivery statuses', isDynamic: false, nonDestructiveRequirement: true },

  // Distraction-Free YouTube Audio Engine
  { keyPattern: 'savantix_bad_yt_ids_v1', category: 'audio_focus', description: 'Restricted video IDs blacklist memory & cache', isDynamic: false, nonDestructiveRequirement: true },
  { keyPattern: 'savantix_user_custom_yt_tags_v1', category: 'audio_focus', description: 'User-customized one-tap focus tags', isDynamic: false, nonDestructiveRequirement: true },
  { keyPattern: 'savantix_recent_played_yt_v1', category: 'audio_focus', description: 'Non-repeating circular queue recent video IDs', isDynamic: false, nonDestructiveRequirement: true },
  { keyPattern: 'savantix_custom_yt_tracks_v1', category: 'audio_focus', description: 'User-saved custom YouTube audio streams', isDynamic: false, nonDestructiveRequirement: true },
  { keyPattern: 'savantix_google_yt_api_key_v1', category: 'audio_focus', description: 'Optional Google YouTube Data API v3 key', isDynamic: false, nonDestructiveRequirement: true },
  { keyPattern: 'savantix_yt_search_cache_v1', category: 'audio_focus', description: 'Cached YouTube search queries & metadata', isDynamic: false, nonDestructiveRequirement: true }
];

// ─── ASSERTION HELPER ──────────────────────────────────────────────────────
function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
}

// ─── TEST SUITE ────────────────────────────────────────────────────────────
export async function runZeroDataLossTests() {
  console.log('\n===============================================================');
  console.log('🛡️ RUNNING ZERO DATA LOSS & STORAGE INVARIANT TEST SUITE');
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

  // 1. Registry Verification (31+ persistent keys)
  test('Storage Registry: defines at least 31 persistent keys across all application domains', () => {
    assert(SAVANTIX_STORAGE_REGISTRY.length >= 31, `Expected at least 31 keys in registry, found ${SAVANTIX_STORAGE_REGISTRY.length}`);
    const keyPatterns = new Set(SAVANTIX_STORAGE_REGISTRY.map(k => k.keyPattern));
    assert(keyPatterns.size === SAVANTIX_STORAGE_REGISTRY.length, 'All registered storage key patterns must be unique');
  });

  // 2. Canonical UID Mapping
  test('Canonical UID: produces deterministic, sanitized cloud partition IDs', () => {
    const canonical1 = CloudSyncService.getCanonicalUid('debanjan8686@gmail.com');
    assert(canonical1 === 'deb_sync_debanjan8686_gmail_com', `Expected 'deb_sync_debanjan8686_gmail_com', got '${canonical1}'`);

    const canonicalUpper = CloudSyncService.getCanonicalUid('DEBANJAN8686@GMAIL.COM');
    assert(canonicalUpper === canonical1, 'Email canonicalization must be case-insensitive');

    const canonicalGuest = CloudSyncService.getCanonicalUid('');
    assert(canonicalGuest === 'guest_user', 'Empty email maps to guest_user');
  });

  // 3. Non-Destructive Union Merge for Study Logs
  test('Non-Destructive Union: preserves 100% of local logs and seamlessly incorporates remote logs', () => {
    localStorage.clear();

    const testEmail = 'debanjan8686@gmail.com';
    const testUid = 'user_deb_123';
    const canonicalId = CloudSyncService.getCanonicalUid(testEmail);
    const localLogsKey = `savantix_user_logs_${testUid}`;

    // Local study logs (User logged session on Device A)
    const localLogA = {
      id: 'log_local_1',
      date: '2026-08-30',
      subject: 'Physics',
      topic: 'Electrostatics Boundary Conditions',
      durationMinutes: 90,
      problemsSolved: 15,
      efficiencyScore: 9,
      focusScore: 10
    };
    const localLogB = {
      id: 'log_local_2',
      date: '2026-08-31',
      subject: 'Mathematics',
      topic: 'Multivariable Calculus Jacobians',
      durationMinutes: 120,
      problemsSolved: 25,
      efficiencyScore: 8,
      focusScore: 9
    };
    localStorage.setItem(localLogsKey, JSON.stringify([localLogA, localLogB]));

    // Remote snapshot (Device B synced a different session)
    const remoteLogC = {
      id: 'log_remote_3',
      date: '2026-08-29',
      subject: 'Chemistry',
      topic: 'Thermodynamic Potentials & Gibbs Free Energy',
      durationMinutes: 75,
      problemsSolved: 10,
      efficiencyScore: 9,
      focusScore: 8
    };
    const remotePayload: CloudSyncPayload = {
      version: 2,
      email: testEmail,
      canonicalId,
      lastSyncedAt: new Date().toISOString(),
      deviceInfo: 'test-runner',
      logs: [localLogA, remoteLogC], // Remote has localLogA and remoteLogC
      goals: [],
      journal: [],
      attendance: [],
      flashcards: [],
      examTargets: []
    };

    // Execute merge
    const result = CloudSyncService.mergeAndPersist(remotePayload, testEmail, testUid);
    assert(result.success, 'Merge must return success: true');
    assert(result.logsCount === 3, `Expected 3 logs after union merge, got ${result.logsCount}`);

    // Verify local storage has all 3 logs (A, B, C)
    const mergedLogsRaw = localStorage.getItem(localLogsKey);
    assert(mergedLogsRaw !== null, 'Merged logs must exist in local storage');
    const mergedLogs = JSON.parse(mergedLogsRaw!);
    assert(mergedLogs.length === 3, `Merged logs array length must be 3, got ${mergedLogs.length}`);

    const ids = new Set(mergedLogs.map((l: any) => l.id));
    assert(ids.has('log_local_1'), 'Local Log A must be preserved');
    assert(ids.has('log_local_2'), 'Local Log B (Device A only) must NEVER be lost');
    assert(ids.has('log_remote_3'), 'Remote Log C (Device B) must be added');

    // Verify secondary backup copy savantix_logs_backup_latest is updated
    const backupRaw = localStorage.getItem('savantix_logs_backup_latest');
    assert(backupRaw !== null, 'savantix_logs_backup_latest must be created');
    const backupLogs = JSON.parse(backupRaw!);
    assert(backupLogs.length === 3, 'Backup copy must contain all 3 logs');
  });

  // 4. Non-Destructive Union Merge for Goals & Journal
  test('Non-Destructive Union: merges goals and reflections without erasing user milestones', () => {
    localStorage.clear();

    const testEmail = 'debanjan8686@gmail.com';
    const testUid = 'user_deb_123';
    const localGoalsKey = `savantix_user_goals_${testUid}`;
    const localJournalKey = `savantix_user_journal_${testUid}`;

    // Local goals and reflections
    const localGoal = { id: 'goal_1', title: 'Master IPhO Electromagnetism', progress: 80 };
    const localJournal = { id: 'journal_1', date: '2026-08-30', title: 'Reflection on Lagrangian Mechanics' };
    localStorage.setItem(localGoalsKey, JSON.stringify([localGoal]));
    localStorage.setItem(localJournalKey, JSON.stringify([localJournal]));

    // Remote goals and reflections
    const remoteGoal = { id: 'goal_2', title: 'Solve 100 JEE Advanced Calculus Problems', progress: 40 };
    const remoteJournal = { id: 'journal_2', date: '2026-08-31', title: 'Flowmodoro 4-hour deep session' };

    const remotePayload: CloudSyncPayload = {
      version: 2,
      email: testEmail,
      canonicalId: CloudSyncService.getCanonicalUid(testEmail),
      lastSyncedAt: new Date().toISOString(),
      deviceInfo: 'test-runner',
      logs: [],
      goals: [localGoal, remoteGoal],
      journal: [remoteJournal],
      attendance: [],
      flashcards: [],
      examTargets: []
    };

    CloudSyncService.mergeAndPersist(remotePayload, testEmail, testUid);

    // Verify Goals
    const mergedGoals = JSON.parse(localStorage.getItem(localGoalsKey)!);
    assert(mergedGoals.length === 2, `Goals count must be 2, got ${mergedGoals.length}`);
    const goalIds = new Set(mergedGoals.map((g: any) => g.id));
    assert(goalIds.has('goal_1') && goalIds.has('goal_2'), 'Both local and remote goals must be present');

    // Verify Reflections
    const mergedJournal = JSON.parse(localStorage.getItem(localJournalKey)!);
    assert(mergedJournal.length === 2, `Journal count must be 2, got ${mergedJournal.length}`);
    const journalIds = new Set(mergedJournal.map((j: any) => j.id));
    assert(journalIds.has('journal_1') && journalIds.has('journal_2'), 'Both local and remote reflections preserved');
  });

  // 5. Non-Destructive Union for Attendance, Flashcards, Exam Targets
  test('Non-Destructive Union: merges attendance tracker and flashcard decks', () => {
    localStorage.clear();

    const testEmail = 'debanjan8686@gmail.com';
    const testUid = 'user_deb_123';

    const localAtt = [{ id: 'att_phy', name: 'Physics Lectures', attended: 28, total: 30 }];
    const remoteAtt = [{ id: 'att_chem', name: 'Chemistry Lab', attended: 14, total: 15 }];
    localStorage.setItem('savantix_attendance_data_v1', JSON.stringify(localAtt));

    const localFc = [{ id: 'fc_1', front: 'Maxwell Ampere Law', deck: 'Physics' }];
    const remoteFc = [{ id: 'fc_2', front: 'Taylor Series Expansion', deck: 'Math' }];
    localStorage.setItem('savantix_flashcards', JSON.stringify(localFc));

    const remotePayload: CloudSyncPayload = {
      version: 2,
      email: testEmail,
      canonicalId: CloudSyncService.getCanonicalUid(testEmail),
      lastSyncedAt: new Date().toISOString(),
      deviceInfo: 'test-runner',
      logs: [],
      goals: [],
      journal: [],
      attendance: [...localAtt, ...remoteAtt],
      flashcards: [...remoteFc],
      examTargets: [{ exam: 'JEE Advanced 2026', date: '2026-05-24' }]
    };

    CloudSyncService.mergeAndPersist(remotePayload, testEmail, testUid);

    const mergedAtt = JSON.parse(localStorage.getItem('savantix_attendance_data_v1')!);
    assert(mergedAtt.length === 2, 'Attendance must contain both classes');

    const mergedFc = JSON.parse(localStorage.getItem('savantix_flashcards')!);
    assert(mergedFc.length === 2, 'Flashcards must contain both local and remote cards');

    const targets = JSON.parse(localStorage.getItem('savantix_exam_targets')!);
    assert(targets.length === 1 && targets[0].exam === 'JEE Advanced 2026', 'Exam targets synced');
  });

  // 6. Debanjan Historical Baseline Seed Invariant
  test('Debanjan Baseline Seed: seeds full historical dataset (100 logs, 6 goals, 13 reflections) non-destructively', () => {
    localStorage.clear();

    const userUid = 'deb_sync_debanjan8686_gmail_com';
    const initialSeed = seedDebanjanHistoryIfEmpty(userUid);
    assert(initialSeed !== null, 'seedDebanjanHistoryIfEmpty must return seeded data on empty cache');

    assert(initialSeed.mergedLogs.length === 100, `Expected 100 historical study logs, got ${initialSeed.mergedLogs.length}`);
    assert(initialSeed.mergedGoals.length === 6, `Expected 6 historical goals, got ${initialSeed.mergedGoals.length}`);
    assert(initialSeed.mergedJournal.length === 13, `Expected 13 historical reflections, got ${initialSeed.mergedJournal.length}`);

    // If user subsequently adds a new study log, re-seeding must NOT overwrite or duplicate
    const newCustomLog = {
      id: 'custom_new_log_1',
      uid: userUid,
      date: '2026-09-01',
      subject: 'Physics',
      topic: 'Quantum Mechanics Schrödinger Wave Equation',
      durationMinutes: 100,
      problemsSolved: 20,
      createdAt: new Date().toISOString()
    };
    const currentLogs = JSON.parse(localStorage.getItem(`savantix_user_logs_${userUid}`)!);
    currentLogs.unshift(newCustomLog);
    localStorage.setItem(`savantix_user_logs_${userUid}`, JSON.stringify(currentLogs));

    // Re-seed call
    const secondSeed = seedDebanjanHistoryIfEmpty(userUid);
    assert(secondSeed !== null, 'Second seed call returns merged dataset');
    const finalLogs = JSON.parse(localStorage.getItem(`savantix_user_logs_${userUid}`)!);
    assert(finalLogs.length === 101, `Expected 101 logs (1 custom + 100 historical), got ${finalLogs.length}`);
    assert(finalLogs[0].id === 'custom_new_log_1', 'Custom user log must be preserved at top of list');
  });

  // 7. Storage Resilience: Graceful Handling of Corrupt / Partial Data
  test('Storage Resilience: handles corrupted JSON keys without crashing or data loss', () => {
    localStorage.setItem('savantix_user_logs_corrupt_test', '{broken:json,,');
    localStorage.setItem('savantix_user_goals_corrupt_test', '["incomplete');

    // getLocalSnapshot should not throw
    let snapshot: CloudSyncPayload | null = null;
    try {
      snapshot = CloudSyncService.getLocalSnapshot('test@savantix.app', 'corrupt_test');
    } catch (e: any) {
      assert(false, `getLocalSnapshot threw error on corrupted storage: ${e.message}`);
    }

    assert(snapshot !== null, 'Snapshot must be generated successfully');
    assert(Array.isArray(snapshot.logs) && snapshot.logs.length === 0, 'Logs fallback to empty array safely');
    assert(Array.isArray(snapshot.goals) && snapshot.goals.length === 0, 'Goals fallback to empty array safely');
  });

  console.log(`\n===============================================================`);
  console.log(`🎉 ZERO DATA LOSS TESTS COMPLETE: ${passedCount}/${totalCount} PASSED`);
  console.log(`===============================================================\n`);
}

// Auto-run when executed directly via tsx
if (typeof process !== 'undefined' && process.argv[1]?.includes('zeroDataLoss.test')) {
  runZeroDataLossTests().catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
}
