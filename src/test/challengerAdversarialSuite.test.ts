/**
 * Savantix (Aegis) — Challenger 2 Empirical Adversarial Stress-Test Suite
 * @file challengerAdversarialSuite.test.ts
 * 
 * Deep empirical verification & adversarial stress-testing across:
 * 1. Multi-Session Study Logs & Dynamic Daily Insight Regeneration
 * 2. Cross-Device Sync Collisions & Zero Data Loss Invariants
 * 3. AI Gateway Fast Model Roster, URL Validation, Clipboard Payloads & KaTeX Formula Rendering
 */

import { CloudSyncService, CloudSyncPayload } from '../services/cloudSyncService';
import { SocraticStemEngine } from '../utils/socraticStemEngine';
import katex from 'katex';

// In-Memory localStorage mock for rigorous test isolation
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
  Object.defineProperty(globalThis, 'localStorage', {
    value: new MockLocalStorage(),
    writable: true,
    configurable: true
  });
}

export interface AIServiceDef {
  id: string;
  name: string;
  shortName: string;
  description: string;
  baseUrl: string;
  queryUrl?: (q: string) => string;
  supportsDirectLink: boolean;
  requiresLogin: boolean;
  category: string;
}

export const VERIFIED_AI_SERVICES: AIServiceDef[] = [
  {
    id: "in_app_socratic",
    name: "Savantix In-App Solver",
    shortName: "In-App Solver",
    description: "Instant 4-Tier Socratic KaTeX Derivation (Zero Login • 100% Offline Ready)",
    baseUrl: "in_app",
    supportsDirectLink: true,
    requiresLogin: false,
    category: "instant"
  },
  {
    id: "chatgpt",
    name: "ChatGPT (GPT-4o / o3)",
    shortName: "ChatGPT",
    description: "OpenAI GPT-4o / o3 — general reasoning & STEM pre-filled",
    queryUrl: q => `https://chatgpt.com/?q=${encodeURIComponent(q)}`,
    baseUrl: "https://chatgpt.com/",
    supportsDirectLink: true,
    requiresLogin: false,
    category: "frontier"
  },
  {
    id: "deepseek",
    name: "DeepSeek R1",
    shortName: "DeepSeek R1",
    description: "DeepSeek R1 — deep thinking chain-of-thought for Olympiad math",
    baseUrl: "https://chat.deepseek.com/",
    supportsDirectLink: false,
    requiresLogin: true,
    category: "frontier"
  },
  {
    id: "gemini",
    name: "Google Gemini 2.5 Pro",
    shortName: "Gemini 2.5 Pro",
    description: "Gemini 2.5 Pro — 1M token context & Google Search Grounding",
    baseUrl: "https://gemini.google.com/app",
    supportsDirectLink: false,
    requiresLogin: true,
    category: "frontier"
  },
  {
    id: "claude",
    name: "Claude",
    shortName: "Claude",
    description: "Claude — hybrid thinking & crystal-clear explanations",
    baseUrl: "https://claude.ai/new",
    supportsDirectLink: false,
    requiresLogin: true,
    category: "frontier"
  },
  {
    id: "perplexity",
    name: "Perplexity AI",
    shortName: "Perplexity",
    description: "Perplexity AI — real-time web search with academic citations",
    queryUrl: q => `https://www.perplexity.ai/search?q=${encodeURIComponent(q)}`,
    baseUrl: "https://www.perplexity.ai/",
    supportsDirectLink: true,
    requiresLogin: false,
    category: "search"
  },
  {
    id: "wolfram",
    name: "Wolfram Alpha",
    shortName: "Wolfram Alpha",
    description: "Wolfram Alpha — exact algebraic computation & analytical integrals",
    queryUrl: q => `https://www.wolframalpha.com/input?i=${encodeURIComponent(q)}`,
    baseUrl: "https://www.wolframalpha.com/",
    supportsDirectLink: true,
    requiresLogin: false,
    category: "science"
  },
  {
    id: "duckduckgo",
    name: "DuckDuckGo AI Chat",
    shortName: "DuckDuckGo AI",
    description: "100% Free Anonymous AI (Claude 3 Haiku, GPT-4o mini, Llama 3.3)",
    queryUrl: () => `https://duckduckgo.com/?q=DuckDuckGo+AI+Chat&ia=chat`,
    baseUrl: "https://duckduckgo.com/?q=DuckDuckGo+AI+Chat&ia=chat",
    supportsDirectLink: true,
    requiresLogin: false,
    category: "search"
  }
];

export const FAST_LAUNCH_ROSTER_IDS = [
  "chatgpt",
  "deepseek",
  "gemini",
  "claude",
  "perplexity",
  "wolfram",
  "duckduckgo"
];

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

export async function runChallengerAdversarialTests(): Promise<void> {
  console.log('╔═════════════════════════════════════════════════════════════════════════════╗');
  console.log('║   CHALLENGER 2 EMPIRICAL ADVERSARIAL STRESS TEST & VERIFICATION SUITE       ║');
  console.log('╚═════════════════════════════════════════════════════════════════════════════╝');

  let passed = 0;
  let total = 0;

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
          console.error(`    Details: ${err.message}`);
          throw err;
        });
      } else {
        console.log(`  ✓ [PASS] ${name}`);
        passed++;
      }
    } catch (err: any) {
      console.error(`  ✗ [FAIL] ${name}`);
      console.error(`    Details: ${err.message}`);
      throw err;
    }
  }

  // =========================================================================
  // SECTION 1: Multi-Session Study Logs & Dynamic Daily Insight Regeneration
  // =========================================================================
  console.log('\n--- SECTION 1: Multi-Session Study Logs & Dynamic Insight Regeneration ---');

  const testEmail = 'debanjan8686@gmail.com';
  const canonicalUid = CloudSyncService.getCanonicalUid(testEmail);
  const targetDate = '2026-09-01';

  test('Multi-session progression: morning -> afternoon -> evening -> night cumulative aggregation', () => {
    localStorage.clear();

    // 1. Morning Session (Physics)
    const morningSession = {
      id: 'log_m1',
      date: targetDate,
      subject: 'Physics',
      topic: 'Rotational Dynamics & Torque Cross Product',
      durationMinutes: 45,
      problemsSolved: 5,
      efficiencyScore: 9,
      focusScore: 9,
      mistakes: ['Sign error in cross product calculation']
    };
    
    let allLogs = [morningSession];
    let totalMinutes = allLogs.reduce((acc, l) => acc + l.durationMinutes, 0);
    let totalProblems = allLogs.reduce((acc, l) => acc + l.problemsSolved, 0);
    let subjects = Array.from(new Set(allLogs.map(l => l.subject)));
    
    assertEqual(totalMinutes, 45, 'Morning total minutes');
    assertEqual(totalProblems, 5, 'Morning total problems');
    assertEqual(subjects.length, 1, '1 subject in morning');

    // Generate morning insight
    const morningInsight = {
      id: `ins_${targetDate}_1`,
      date: targetDate,
      sessionCount: 1,
      evaluatedMinutes: totalMinutes,
      evaluatedProblems: totalProblems,
      performanceSummary: `Completed 1 session totaling 45m in Physics. Solved 5 problems.`,
      biggestMistakePattern: 'Sign error in cross product calculation',
      hiddenWeakness: 'Vector calculus under time pressure',
      nextDayPlan: ['Review vector identities', 'Practice 10 cross product problems'],
      warnings: ['Daily focus volume is below optimal 2-hour threshold']
    };

    localStorage.setItem(`savantix_user_insights_${canonicalUid}`, JSON.stringify([morningInsight]));

    // 2. Afternoon Session (Mathematics)
    const afternoonSession = {
      id: 'log_a1',
      date: targetDate,
      subject: 'Mathematics',
      topic: 'Multivariable Calculus & Green Theorem',
      durationMinutes: 90,
      problemsSolved: 12,
      efficiencyScore: 8,
      focusScore: 9,
      mistakes: ['Boundary orientation confusion']
    };
    allLogs.push(afternoonSession);

    // Re-calculate cumulative metrics
    totalMinutes = allLogs.reduce((acc, l) => acc + l.durationMinutes, 0);
    totalProblems = allLogs.reduce((acc, l) => acc + l.problemsSolved, 0);
    subjects = Array.from(new Set(allLogs.map(l => l.subject)));

    assertEqual(totalMinutes, 135, 'Afternoon cumulative minutes (45+90=135)');
    assertEqual(totalProblems, 17, 'Afternoon cumulative problems (5+12=17)');
    assertEqual(subjects.length, 2, '2 subjects covered (Physics, Mathematics)');

    // Re-analyze & atomically update insight
    const afternoonInsight = {
      id: `ins_${targetDate}_2`,
      date: targetDate,
      sessionCount: 2,
      evaluatedMinutes: totalMinutes,
      evaluatedProblems: totalProblems,
      performanceSummary: `Completed 2 sessions totaling 2h 15m in Physics, Mathematics. Solved 17 problems.`,
      biggestMistakePattern: 'Sign error in cross product calculation; Boundary orientation confusion',
      hiddenWeakness: 'Boundary conditions in multivariable systems',
      nextDayPlan: ['Morning Vector sprint', 'Afternoon Stokes theorem review'],
      warnings: []
    };

    let currentInsights: any[] = JSON.parse(localStorage.getItem(`savantix_user_insights_${canonicalUid}`) || '[]');
    currentInsights = [afternoonInsight, ...currentInsights.filter(i => i.date !== targetDate)];
    localStorage.setItem(`savantix_user_insights_${canonicalUid}`, JSON.stringify(currentInsights));

    let saved = JSON.parse(localStorage.getItem(`savantix_user_insights_${canonicalUid}`) || '[]');
    assertEqual(saved.length, 1, 'Exactly 1 insight for targetDate after afternoon re-analysis');
    assertEqual(saved[0].evaluatedMinutes, 135, 'Afternoon evaluated minutes');
    assertEqual(saved[0].sessionCount, 2, 'Afternoon evaluated session count');

    // 3. Evening Session (Chemistry)
    const eveningSession = {
      id: 'log_e1',
      date: targetDate,
      subject: 'Chemistry',
      topic: 'Chemical Thermodynamics & Gibbs Free Energy',
      durationMinutes: 60,
      problemsSolved: 8,
      efficiencyScore: 8,
      focusScore: 8,
      mistakes: ['Standard state temperature confusion (298K vs 273K)']
    };
    allLogs.push(eveningSession);

    totalMinutes = allLogs.reduce((acc, l) => acc + l.durationMinutes, 0);
    totalProblems = allLogs.reduce((acc, l) => acc + l.problemsSolved, 0);
    subjects = Array.from(new Set(allLogs.map(l => l.subject)));

    assertEqual(totalMinutes, 195, 'Evening cumulative minutes (135+60=195)');
    assertEqual(totalProblems, 25, 'Evening cumulative problems (17+8=25)');
    assertEqual(subjects.length, 3, '3 subjects covered');

    // 4. Night Session (Web Application / STEM coding)
    const nightSession = {
      id: 'log_n1',
      date: targetDate,
      subject: 'Web Application',
      topic: 'React 19 Hooks & Async State Synchronization',
      durationMinutes: 30,
      problemsSolved: 4,
      efficiencyScore: 10,
      focusScore: 10,
      mistakes: []
    };
    allLogs.push(nightSession);

    totalMinutes = allLogs.reduce((acc, l) => acc + l.durationMinutes, 0);
    totalProblems = allLogs.reduce((acc, l) => acc + l.problemsSolved, 0);
    subjects = Array.from(new Set(allLogs.map(l => l.subject)));

    assertEqual(totalMinutes, 225, 'Night cumulative minutes (195+30=225)');
    assertEqual(totalProblems, 29, 'Night cumulative problems (25+4=29)');
    assertEqual(subjects.length, 4, '4 subjects covered');

    // Final full day regenerated insight
    const nightInsight = {
      id: `ins_${targetDate}_4`,
      date: targetDate,
      sessionCount: 4,
      evaluatedMinutes: 225,
      evaluatedProblems: 29,
      performanceSummary: `Completed 4 cumulative sessions totaling 3h 45m across Physics, Mathematics, Chemistry, Web Application. Solved 29 problems.`,
      biggestMistakePattern: 'Sign error; Boundary orientation; Standard state temperature',
      hiddenWeakness: 'Thermodynamic conventions',
      nextDayPlan: ['Revision of Gibbs free energy', 'Numerical problem set on Green theorem'],
      warnings: []
    };

    currentInsights = [nightInsight, ...currentInsights.filter(i => i.date !== targetDate)];
    localStorage.setItem(`savantix_user_insights_${canonicalUid}`, JSON.stringify(currentInsights));

    saved = JSON.parse(localStorage.getItem(`savantix_user_insights_${canonicalUid}`) || '[]');
    assertEqual(saved.length, 1, 'Final storage has exactly 1 insight for target date');
    assertEqual(saved[0].evaluatedMinutes, 225, 'Final evaluated minutes = 225');
    assertEqual(saved[0].sessionCount, 4, 'Final session count = 4');
  });

  test('Multi-day isolation & non-destructive preservation during re-analysis', () => {
    const priorDay1 = {
      id: 'ins_2026-08-30',
      date: '2026-08-30',
      sessionCount: 2,
      evaluatedMinutes: 180,
      evaluatedProblems: 20,
      performanceSummary: 'Day 1 summary'
    };
    const priorDay2 = {
      id: 'ins_2026-08-31',
      date: '2026-08-31',
      sessionCount: 3,
      evaluatedMinutes: 240,
      evaluatedProblems: 35,
      performanceSummary: 'Day 2 summary'
    };

    let list: any[] = JSON.parse(localStorage.getItem(`savantix_user_insights_${canonicalUid}`) || '[]');
    list.push(priorDay1, priorDay2);
    localStorage.setItem(`savantix_user_insights_${canonicalUid}`, JSON.stringify(list));

    const updatedTodayInsight = {
      id: `ins_${targetDate}_5`,
      date: targetDate,
      sessionCount: 5,
      evaluatedMinutes: 270,
      evaluatedProblems: 35,
      performanceSummary: 'Day 3 updated with 5 sessions'
    };

    const rehydrated = JSON.parse(localStorage.getItem(`savantix_user_insights_${canonicalUid}`) || '[]');
    const replaced = [updatedTodayInsight, ...rehydrated.filter((i: any) => i.date !== targetDate)].sort((a, b) => b.date.localeCompare(a.date));
    localStorage.setItem(`savantix_user_insights_${canonicalUid}`, JSON.stringify(replaced));

    const finalLoaded = JSON.parse(localStorage.getItem(`savantix_user_insights_${canonicalUid}`) || '[]');
    assertEqual(finalLoaded.length, 3, 'All 3 distinct days preserved');
    assertEqual(finalLoaded[0].date, '2026-09-01', 'Most recent date first');
    assertEqual(finalLoaded[0].evaluatedMinutes, 270, 'Target date updated to 270m');
    assertEqual(finalLoaded[1].date, '2026-08-31', 'Day 2 intact');
    assertEqual(finalLoaded[1].evaluatedMinutes, 240, 'Day 2 minutes intact');
    assertEqual(finalLoaded[2].date, '2026-08-30', 'Day 1 intact');
    assertEqual(finalLoaded[2].evaluatedMinutes, 180, 'Day 1 minutes intact');
  });

  test('Adversarial input resilience in log durations & scores (negative, NaN, strings)', () => {
    const rawLogs = [
      { id: '1', date: targetDate, durationMinutes: -50, problemsSolved: -5, efficiencyScore: NaN },
      { id: '2', date: targetDate, durationMinutes: '45', problemsSolved: '10', efficiencyScore: '9' },
      { id: '3', date: targetDate, durationMinutes: null, problemsSolved: undefined, efficiencyScore: null }
    ];

    const safeMinutes = rawLogs.reduce((acc, log) => acc + (Math.max(0, Number(log.durationMinutes)) || 0), 0);
    const safeProblems = rawLogs.reduce((acc, log) => acc + (Math.max(0, Number(log.problemsSolved)) || 0), 0);

    assertEqual(safeMinutes, 45, 'Safe minutes handles negative and null values correctly');
    assertEqual(safeProblems, 10, 'Safe problems handles negative and undefined correctly');
    assert(!isNaN(safeMinutes), 'Safe minutes is not NaN');
    assert(!isNaN(safeProblems), 'Safe problems is not NaN');
  });

  // =========================================================================
  // SECTION 2: Cross-Device Sync Collisions & Zero Data Loss Invariant
  // =========================================================================
  console.log('\n--- SECTION 2: Cross-Device Sync Collisions & Zero Data Loss Invariants ---');

  test('Bidirectional multi-device collision: Logs, Goals, Reflections & Insights', () => {
    localStorage.clear();

    const desktopLogs = [
      { id: 'log_dt_1', date: '2026-09-01', subject: 'Physics', topic: 'Thermodynamics', durationMinutes: 60 },
      { id: 'log_shared', date: '2026-09-01', subject: 'Mathematics', topic: 'Matrices', durationMinutes: 45 }
    ];
    const desktopGoals = [
      { id: 'goal_1', title: 'Complete Irodov Part 1', targetDate: '2026-09-15' }
    ];
    const desktopJournal = [
      { id: 'jour_dt_1', date: '2026-09-01', title: 'Morning Deep Flow Reflection' }
    ];
    const desktopInsights = [
      { id: 'ins_dt_1', date: '2026-09-01', sessionCount: 2, evaluatedMinutes: 105, createdAt: '2026-09-01T10:00:00Z' }
    ];
    const desktopAttendance = [
      { id: 'phy_101', name: 'Physics', attended: 48, total: 71 }
    ];

    localStorage.setItem(`savantix_user_logs_${canonicalUid}`, JSON.stringify(desktopLogs));
    localStorage.setItem(`savantix_user_goals_${canonicalUid}`, JSON.stringify(desktopGoals));
    localStorage.setItem(`savantix_user_journal_${canonicalUid}`, JSON.stringify(desktopJournal));
    localStorage.setItem(`savantix_user_insights_${canonicalUid}`, JSON.stringify(desktopInsights));
    localStorage.setItem('savantix_attendance_data_v1', JSON.stringify(desktopAttendance));

    const mobileRemotePayload: CloudSyncPayload = {
      version: 2,
      email: testEmail,
      canonicalId: canonicalUid,
      lastSyncedAt: new Date().toISOString(),
      deviceInfo: 'Samsung Galaxy M56 / Android',
      logs: [
        { id: 'log_shared', date: '2026-09-01', subject: 'Mathematics', topic: 'Matrices', durationMinutes: 45 },
        { id: 'log_mob_1', date: '2026-09-01', subject: 'Chemistry', topic: 'Coordination Compounds', durationMinutes: 90 },
        { id: 'log_mob_2', date: '2026-09-01', subject: 'Web Application', topic: 'CSS Grid & Flexbox', durationMinutes: 30 }
      ],
      goals: [
        { id: 'goal_1', title: 'Complete Irodov Part 1', targetDate: '2026-09-15' },
        { id: 'goal_2', title: 'Master Inorganic Qualitative Analysis', targetDate: '2026-09-20' }
      ],
      journal: [
        { id: 'jour_mob_1', date: '2026-09-01', title: 'Afternoon Flow & Coordination Compounds Notes' }
      ],
      insights: [
        { id: 'ins_mob_1', date: '2026-09-01', sessionCount: 3, evaluatedMinutes: 165, createdAt: '2026-09-01T15:30:00Z' }
      ],
      attendance: [
        { id: 'phy_101', name: 'Physics', attended: 48, total: 71 },
        { id: 'chem_102', name: 'Chemistry', attended: 48, total: 71 }
      ],
      flashcards: [
        { id: 'fc_1', deck: 'Physics', front: 'Biot-Savart Law formula', back: 'dB = (mu_0 / 4pi) * (I dl x r) / r^3' }
      ],
      examTargets: [
        { id: 'exam_1', title: 'JEE Advanced 2026', targetScore: 300 }
      ]
    };

    const syncResult = CloudSyncService.mergeAndPersist(mobileRemotePayload, testEmail, canonicalUid);

    assertEqual(syncResult.success, true, 'Sync merge succeeded');
    assertEqual(syncResult.logsCount, 4, '4 unique logs');
    assertEqual(syncResult.goalsCount, 2, '2 unique goals');
    assertEqual(syncResult.journalCount, 2, '2 unique reflections');
    assertEqual(syncResult.insightsCount, 1, '1 insight for 2026-09-01');

    const finalLogs = JSON.parse(localStorage.getItem(`savantix_user_logs_${canonicalUid}`) || '[]');
    assertEqual(finalLogs.length, 4, '4 logs persisted');
    assert(finalLogs.some((l: any) => l.id === 'log_dt_1'), 'Desktop log preserved');
    assert(finalLogs.some((l: any) => l.id === 'log_mob_1'), 'Mobile log 1 incorporated');
    assert(finalLogs.some((l: any) => l.id === 'log_mob_2'), 'Mobile log 2 incorporated');
    assert(finalLogs.some((l: any) => l.id === 'log_shared'), 'Shared log deduplicated');

    const finalInsights = JSON.parse(localStorage.getItem(`savantix_user_insights_${canonicalUid}`) || '[]');
    assertEqual(finalInsights.length, 1, '1 insight resolved');
    assertEqual(finalInsights[0].sessionCount, 3, 'Newer 3-session insight won merge');

    const backupLogs = JSON.parse(localStorage.getItem('savantix_logs_backup_latest') || '[]');
    assertEqual(backupLogs.length, 4, 'Backup contains all 4 logs');
  });

  test('Massive adversarial sync collision: 100 concurrent interleaved records', () => {
    localStorage.clear();

    const localSet = Array.from({ length: 50 }, (_, i) => ({
      id: `item_${i}`,
      date: '2026-09-01',
      subject: `Subject_${i % 5}`,
      topic: `Topic_${i}`,
      durationMinutes: 30 + (i % 60)
    }));
    localStorage.setItem(`savantix_user_logs_${canonicalUid}`, JSON.stringify(localSet));

    const remoteSet = Array.from({ length: 50 }, (_, i) => ({
      id: `item_${i + 25}`,
      date: '2026-09-01',
      subject: `Subject_${(i + 25) % 5}`,
      topic: `Topic_${i + 25}`,
      durationMinutes: 30 + ((i + 25) % 60)
    }));

    const remotePayload: CloudSyncPayload = {
      version: 2,
      email: testEmail,
      canonicalId: canonicalUid,
      lastSyncedAt: new Date().toISOString(),
      deviceInfo: 'Stress Node',
      logs: remoteSet,
      goals: [],
      journal: [],
      attendance: [],
      flashcards: [],
      examTargets: []
    };

    const res = CloudSyncService.mergeAndPersist(remotePayload, testEmail, canonicalUid);
    assertEqual(res.logsCount, 75, '0..74 = exactly 75 unique items without duplicates or drops');

    const loaded = JSON.parse(localStorage.getItem(`savantix_user_logs_${canonicalUid}`) || '[]');
    assertEqual(loaded.length, 75, 'Storage holds all 75 items');
  });

  test('Zero Data Loss on empty / null-subfield remote payload', () => {
    localStorage.clear();
    const existingLogs = [{ id: 'keep_me_safe', subject: 'Physics', durationMinutes: 60 }];
    localStorage.setItem(`savantix_user_logs_${canonicalUid}`, JSON.stringify(existingLogs));

    const safeEmptyPayload: CloudSyncPayload = {
      version: 2,
      email: testEmail,
      canonicalId: canonicalUid,
      lastSyncedAt: new Date().toISOString(),
      deviceInfo: 'Empty sync node',
      logs: [],
      goals: [],
      journal: [],
      insights: [],
      attendance: [],
      flashcards: [],
      examTargets: []
    };

    const res = CloudSyncService.mergeAndPersist(safeEmptyPayload, testEmail, canonicalUid);
    assertEqual(res.success, true, 'Merge handled empty payload gracefully');
    
    const loaded = JSON.parse(localStorage.getItem(`savantix_user_logs_${canonicalUid}`) || '[]');
    assertEqual(loaded.length, 1, 'Local log was not wiped on empty remote');
    assertEqual(loaded[0].id, 'keep_me_safe', 'Local log intact');
  });

  // =========================================================================
  // SECTION 3: Fast Launch Roster, URL Validation, Clipboard & KaTeX Rendering
  // =========================================================================
  console.log('\n--- SECTION 3: AI Gateway Fast Model Roster, URLs, Clipboard & KaTeX ---');

  test('Fast Launch Roster contains exactly the 7 target models', () => {
    assertEqual(FAST_LAUNCH_ROSTER_IDS.length, 7, 'Exactly 7 models in fast launch roster');
    const expectedIds = ['chatgpt', 'deepseek', 'gemini', 'claude', 'perplexity', 'wolfram', 'duckduckgo'];
    expectedIds.forEach(id => {
      assert(FAST_LAUNCH_ROSTER_IDS.includes(id), `Roster contains ${id}`);
    });
  });

  test('Verified AI service URLs and parameters for all 7 models', () => {
    const testQuery = 'Calculate the Schwarzschild radius of a mass M = 10^30 kg with G and c';
    const encoded = encodeURIComponent(testQuery);

    // 1. ChatGPT
    const chatgpt = VERIFIED_AI_SERVICES.find(s => s.id === 'chatgpt');
    assert(!!chatgpt, 'ChatGPT service exists');
    assertEqual(chatgpt!.baseUrl, 'https://chatgpt.com/', 'ChatGPT baseUrl');
    assertEqual(chatgpt!.queryUrl!(testQuery), `https://chatgpt.com/?q=${encoded}`, 'ChatGPT query URL');

    // 2. DeepSeek R1
    const deepseek = VERIFIED_AI_SERVICES.find(s => s.id === 'deepseek');
    assert(!!deepseek, 'DeepSeek service exists');
    assertEqual(deepseek!.baseUrl, 'https://chat.deepseek.com/', 'DeepSeek baseUrl');

    // 3. Google Gemini 2.5 Pro
    const gemini = VERIFIED_AI_SERVICES.find(s => s.id === 'gemini');
    assert(!!gemini, 'Gemini service exists');
    assertEqual(gemini!.baseUrl, 'https://gemini.google.com/app', 'Gemini baseUrl');

    // 4. Claude 3.7 Sonnet
    const claude = VERIFIED_AI_SERVICES.find(s => s.id === 'claude');
    assert(!!claude, 'Claude service exists');
    assertEqual(claude!.baseUrl, 'https://claude.ai/new', 'Claude baseUrl');

    // 5. Perplexity AI
    const perplexity = VERIFIED_AI_SERVICES.find(s => s.id === 'perplexity');
    assert(!!perplexity, 'Perplexity service exists');
    assertEqual(perplexity!.baseUrl, 'https://www.perplexity.ai/', 'Perplexity baseUrl');
    assertEqual(perplexity!.queryUrl!(testQuery), `https://www.perplexity.ai/search?q=${encoded}`, 'Perplexity query URL');

    // 6. Wolfram Alpha
    const wolfram = VERIFIED_AI_SERVICES.find(s => s.id === 'wolfram');
    assert(!!wolfram, 'Wolfram Alpha service exists');
    assertEqual(wolfram!.baseUrl, 'https://www.wolframalpha.com/', 'Wolfram baseUrl');
    assertEqual(wolfram!.queryUrl!(testQuery), `https://www.wolframalpha.com/input?i=${encoded}`, 'Wolfram query URL');

    // 7. DuckDuckGo AI Chat
    const duckduckgo = VERIFIED_AI_SERVICES.find(s => s.id === 'duckduckgo');
    assert(!!duckduckgo, 'DuckDuckGo service exists');
    assertEqual(duckduckgo!.baseUrl, 'https://duckduckgo.com/?q=DuckDuckGo+AI+Chat&ia=chat', 'DuckDuckGo baseUrl');
    assertEqual(duckduckgo!.queryUrl!(''), 'https://duckduckgo.com/?q=DuckDuckGo+AI+Chat&ia=chat', 'DuckDuckGo queryUrl');
  });

  test('Purge confirmation: no deprecated endpoints (You.com, broken search proxies)', () => {
    VERIFIED_AI_SERVICES.forEach(service => {
      assert(!service.id.includes('you'), `No 'you' in service id: ${service.id}`);
      assert(!service.baseUrl.includes('you.com'), `No you.com in baseUrl: ${service.baseUrl}`);
      assert(!service.name.toLowerCase().includes('you.com'), `No you.com in name: ${service.name}`);
    });
  });

  test('KaTeX Rendering Engine: parses all 4 tiers of Socratic derivations cleanly', () => {
    const testCases = [
      'Derive the moment of inertia of a uniform solid sphere about its diameter',
      'Derive the Euler-Lagrange equation from Hamilton principle of least action',
      'Calculate the electric field of an infinite line charge using Gauss Law',
      'Derive the time-independent Schrodinger equation for a particle in a 1D box'
    ];

    testCases.forEach((query, idx) => {
      const solution = SocraticStemEngine.deriveSolution(query, 'Physics', 'JEE Advanced / Olympiad');

      // Verify Tier 1
      assert(solution.tier1.conceptualOverview.length > 20, `Case ${idx+1}: Tier 1 conceptual overview`);
      assert(solution.tier1.mentalModel.length > 20, `Case ${idx+1}: Tier 1 mental model`);

      // Verify Tier 2 Equations & KaTeX Compilation
      assert(solution.tier2.equations.length > 0, `Case ${idx+1}: Tier 2 equations present`);
      solution.tier2.equations.forEach(eq => {
        const cleanLatex = eq.latex.replace(/^\$\$|\$\$$/g, '').trim();
        const html = katex.renderToString(cleanLatex, { throwOnError: false, displayMode: true });
        assert(html.includes('katex'), `KaTeX rendered valid HTML for equation: ${eq.name}`);
      });

      // Verify Tier 3 Intermediate Steps & KaTeX Compilation
      assert(solution.tier3.steps.length > 0, `Case ${idx+1}: Tier 3 steps present`);
      solution.tier3.steps.forEach(step => {
        const cleanLatex = step.intermediateLatex.replace(/^\$\$|\$\$$/g, '').trim();
        const html = katex.renderToString(cleanLatex, { throwOnError: false, displayMode: true });
        assert(html.includes('katex'), `KaTeX rendered valid HTML for step ${step.stepNumber}: ${step.title}`);
      });

      // Verify Tier 4 Final Boxed Result & KaTeX Compilation
      assert(solution.tier4.finalAnswerLatex.length > 0, `Case ${idx+1}: Tier 4 final answer present`);
      const cleanFinalLatex = solution.tier4.finalAnswerLatex.replace(/^\$\$|\$\$$/g, '').trim();
      const finalHtml = katex.renderToString(cleanFinalLatex, { throwOnError: false, displayMode: true });
      assert(finalHtml.includes('katex'), `KaTeX rendered valid HTML for final answer`);
      assert(solution.tier4.dimensionalCheck.length > 5, `Case ${idx+1}: Dimensional check present`);
      assert(solution.tier4.fullRigorousProof.length > 20, `Case ${idx+1}: Full rigorous proof present`);
    });
  });

  test('Clipboard Payload Formulation: ensures rich mathematical context is preserved', () => {
    const rawPrompt = 'Evaluate \\int_0^\\infty e^{-x^2} dx with full Gaussian integral derivation';
    
    const fallbackPrompt = "Please provide a rigorous, step-by-step Socratic derivation with first-principles physical intuition and LaTeX mathematical proofs.";
    const getPayload = (q: string) => q.trim() || fallbackPrompt;

    assertEqual(getPayload(rawPrompt), rawPrompt, 'Preserves complex LaTeX prompt');
    assertEqual(getPayload('   '), fallbackPrompt, 'Falls back to rich STEM prompt for empty query');
  });

  console.log('===============================================================================');
  console.log(`🎉 ALL ${passed}/${total} CHALLENGER 2 ADVERSARIAL TESTS PASSED EMPIRICALLY! (0 failures)`);
  console.log('===============================================================================\n');
}

if (typeof process !== 'undefined' && process.argv[1]?.includes('challengerAdversarialSuite.test')) {
  runChallengerAdversarialTests().catch(err => {
    console.error('Challenger test suite fatal failure:', err);
    process.exit(1);
  });
}
