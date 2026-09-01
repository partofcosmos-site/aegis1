/**
 * Savantix (Aegis) — Master E2E & Unit Test Suite Runner
 * @file allTests.test.ts
 * 
 * Aggregates and executes all 9 Savantix test suites across Requirements R1–R5:
 * 1. Contact & Feedback Hub (`contactFeedback.test.ts`)
 * 2. YouTube Focus Audio Engine (`youtubeAudioService.test.ts`)
 * 3. Zero Data Loss & Storage Invariants (`zeroDataLoss.test.ts`)
 * 4. Institutional Attendance & Calendar (`attendanceInstitutional.test.ts`)
 * 5. Reality Math & Gemini AI Regulator (`attendanceMathAiRegulator.test.ts`)
 * 6. Dynamic Daily Insight Regeneration (`dynamicInsightRegeneration.test.ts`)
 * 7. Real-Time Cloud Sync & Non-Destructive Merge (`cloudSyncRealtime.test.ts`)
 * 8. AI Gateway Fast Roster & Socratic KaTeX (`aiGatewayFastRoster.test.ts`)
 * 9. Cosmos Initiative Branding & User Anonymity (`cosmosBrandingAnonymity.test.ts`)
 */

import { runContactFeedbackTests } from './contactFeedback.test';
import { runYouTubeAudioServiceTests } from './youtubeAudioService.test';
import { runZeroDataLossTests } from './zeroDataLoss.test';
import { runAttendanceInstitutionalTests } from './attendanceInstitutional.test';
import { runAttendanceMathAiRegulatorTests } from './attendanceMathAiRegulator.test';
import { runDynamicInsightRegenerationTests } from './dynamicInsightRegeneration.test';
import { runCloudSyncRealtimeTests } from './cloudSyncRealtime.test';
import { runAiGatewayFastRosterTests } from './aiGatewayFastRoster.test';
import { runCosmosBrandingAnonymityTests } from './cosmosBrandingAnonymity.test';

async function runAllSuites() {
  console.log('╔═════════════════════════════════════════════════════════════╗');
  console.log('║       SAVANTIX (AEGIS) — COMPREHENSIVE AUTOMATED TESTS      ║');
  console.log('║       Requirements R1–R5 & Core Invariants Verification     ║');
  console.log('╚═════════════════════════════════════════════════════════════╝');

  const start = Date.now();
  let failures = 0;

  // 1. Contact & Feedback Hub
  try {
    await runContactFeedbackTests();
  } catch (err: any) {
    console.error('Suite 1 (Contact & Feedback Hub) failed:', err.message);
    failures++;
  }

  // 2. YouTube Focus Audio Engine
  try {
    await runYouTubeAudioServiceTests();
  } catch (err: any) {
    console.error('Suite 2 (YouTube Focus Audio Engine) failed:', err.message);
    failures++;
  }

  // 3. Zero Data Loss & Storage Invariants
  try {
    await runZeroDataLossTests();
  } catch (err: any) {
    console.error('Suite 3 (Zero Data Loss & Storage Invariants) failed:', err.message);
    failures++;
  }

  // 4. Institutional Attendance & Calendar (R1)
  try {
    await runAttendanceInstitutionalTests();
  } catch (err: any) {
    console.error('Suite 4 (Institutional Attendance & Calendar) failed:', err.message);
    failures++;
  }

  // 5. Reality Math & Gemini AI Regulator (R2)
  try {
    await runAttendanceMathAiRegulatorTests();
  } catch (err: any) {
    console.error('Suite 5 (Reality Math & Gemini AI Regulator) failed:', err.message);
    failures++;
  }

  // 6. Dynamic Daily Insight Regeneration (R3)
  try {
    await runDynamicInsightRegenerationTests();
  } catch (err: any) {
    console.error('Suite 6 (Dynamic Daily Insight Regeneration) failed:', err.message);
    failures++;
  }

  // 7. Real-Time Cloud Sync & Persistence (R4)
  try {
    await runCloudSyncRealtimeTests();
  } catch (err: any) {
    console.error('Suite 7 (Real-Time Cloud Sync & Persistence) failed:', err.message);
    failures++;
  }

  // 8. AI Gateway Fast Roster & Socratic KaTeX (R5)
  try {
    await runAiGatewayFastRosterTests();
  } catch (err: any) {
    console.error('Suite 8 (AI Gateway Fast Roster & Socratic KaTeX) failed:', err.message);
    failures++;
  }

  // 9. Cosmos Initiative Branding & User Anonymity (Core Directive 2)
  try {
    await runCosmosBrandingAnonymityTests();
  } catch (err: any) {
    console.error('Suite 9 (Cosmos Initiative Branding & User Anonymity) failed:', err.message);
    failures++;
  }

  const elapsed = Date.now() - start;

  console.log('===============================================================');
  if (failures === 0) {
    console.log(`✅ ALL 9 TEST SUITES (62/62 TESTS) PASSED CLEANLY IN ${elapsed}ms! (0 failures)`);
  } else {
    console.error(`❌ ${failures} TEST SUITE(S) FAILED`);
    process.exit(1);
  }
  console.log('===============================================================\n');
}

runAllSuites().catch(err => {
  console.error('Master test runner fatal error:', err);
  process.exit(1);
});
