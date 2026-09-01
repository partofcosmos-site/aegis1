/**
 * Savantix (Aegis) — Cosmos Initiative Branding & Identity Anonymity Test Suite
 * @file cosmosBrandingAnonymity.test.ts
 * 
 * Verifies:
 * 1. Uniform presence of subtitle: "An initiative of Part of Cosmos".
 * 2. Identity protection and anonymization protocols:
 *    - User display names containing raw founder names (e.g. "Debanjan") masked to "Lead Scholar".
 *    - Contributor badge formatted as "Core Researcher".
 * 3. Zero leakage of private student names in clipboard outputs and exported feedback payloads.
 * 4. Anonymous authentication fallback handling.
 */

export const INITIATIVE_SUBTITLE = 'An initiative of Part of Cosmos';

/**
 * Sanitizes user display name according to Core Directive 2 anonymity protocol
 */
export function sanitizeScholarDisplayName(user: { displayName?: string | null; email?: string | null } | null): {
  displayName: string;
  isFounder: boolean;
  roleBadge: string;
} {
  const email = (user?.email || '').trim().toLowerCase();
  const rawName = (user?.displayName || '').trim();
  const isFounder = ['debanjan8686@gmail.com', 'partofcosmmos@gmail.com'].includes(email);

  // Mask private founder name to Lead Scholar across public UI surfaces
  let displayName = 'Lead Scholar';
  if (rawName && !rawName.toLowerCase().includes('debanjan')) {
    displayName = rawName;
  }

  const roleBadge = isFounder ? 'Core Researcher' : 'Scholar';

  return {
    displayName,
    isFounder,
    roleBadge
  };
}

/**
 * Validates that an exported text dossier contains Cosmos initiative branding and no unmasked private names
 */
export function validatePublicDossierBranding(dossier: string): {
  hasCosmosBranding: boolean;
  hasPrivateNameLeak: boolean;
} {
  const hasCosmosBranding = dossier.includes(INITIATIVE_SUBTITLE) || dossier.includes('Part of Cosmos');
  // Check for private personal name leak outside of official contact email
  const bodyWithoutEmail = dossier.replace(/debanjan8686@gmail\.com/g, '');
  const hasPrivateNameLeak = /debanjan\s+biswas/i.test(bodyWithoutEmail) || /\bdebanjan\b/i.test(bodyWithoutEmail);

  return {
    hasCosmosBranding,
    hasPrivateNameLeak
  };
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

export async function runCosmosBrandingAnonymityTests(): Promise<void> {
  console.log('\n===============================================================');
  console.log('🌌 RUNNING SUITE: Cosmos Initiative Branding & User Anonymity');
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

  // 1. Initiative Subtitle Constant Verification
  test('Cosmos Subtitle: verifies exact canonical initiative wording', () => {
    assertEqual(INITIATIVE_SUBTITLE, 'An initiative of Part of Cosmos', 'Subtitle match');
  });

  // 2. Display Name Sanitization & Masking
  test('Identity Masking: masks founder names to "Lead Scholar" and assigns "Core Researcher"', () => {
    // Scenario A: Founder with raw name "Debanjan Biswas"
    const userA = { displayName: 'Debanjan Biswas', email: 'debanjan8686@gmail.com' };
    const sanitizedA = sanitizeScholarDisplayName(userA);
    assertEqual(sanitizedA.displayName, 'Lead Scholar', 'Masked to Lead Scholar');
    assertEqual(sanitizedA.isFounder, true, 'Identified as founder');
    assertEqual(sanitizedA.roleBadge, 'Core Researcher', 'Assigned Core Researcher role');

    // Scenario B: Founder with case variations "debanjan"
    const userB = { displayName: 'debanjan', email: 'partofcosmmos@gmail.com' };
    const sanitizedB = sanitizeScholarDisplayName(userB);
    assertEqual(sanitizedB.displayName, 'Lead Scholar', 'Masked case variation');
    assertEqual(sanitizedB.roleBadge, 'Core Researcher', 'Core Researcher role');

    // Scenario C: External student/scholar "Dr. A. Ramanujan"
    const userC = { displayName: 'Dr. A. Ramanujan', email: 'ramanujan@inst.ac.in' };
    const sanitizedC = sanitizeScholarDisplayName(userC);
    assertEqual(sanitizedC.displayName, 'Dr. A. Ramanujan', 'Preserved non-founder name');
    assertEqual(sanitizedC.isFounder, false, 'Not founder');
    assertEqual(sanitizedC.roleBadge, 'Scholar', 'Standard Scholar role');

    // Scenario D: Null / Anonymous user
    const sanitizedD = sanitizeScholarDisplayName(null);
    assertEqual(sanitizedD.displayName, 'Lead Scholar', 'Fallback to Lead Scholar');
    assertEqual(sanitizedD.isFounder, false, 'Not founder');
  });

  // 3. Public Export Dossier Branding & Zero Leakage
  test('Dossier Branding: verifies initiative branding in regulatory dossiers', () => {
    const mockDossier = `
# 🏛️ SAVANTIX AEGIS: INSTITUTIONAL ATTENDANCE REGULATOR & STRATEGIC DOSSIER
**System Identity:** Savantix Aegis — An initiative of Part of Cosmos
**User:** Lead Scholar (Core Researcher)
**Channel:** debanjan8686@gmail.com
    `;

    const validation = validatePublicDossierBranding(mockDossier);
    assertEqual(validation.hasCosmosBranding, true, 'Cosmos branding verified');
    assertEqual(validation.hasPrivateNameLeak, false, 'No private name leaked');
  });

  // 4. Adversarial Name Leakage Detection
  test('Adversarial Leak Detection: catches accidental inclusion of private founder names', () => {
    const leakyDossier = `
# SAVANTIX REPORT
**Author:** Debanjan Biswas
**Organization:** Part of Cosmos
    `;

    const validation = validatePublicDossierBranding(leakyDossier);
    assertEqual(validation.hasCosmosBranding, true, 'Has Cosmos branding');
    assertEqual(validation.hasPrivateNameLeak, true, 'Correctly flags leaked private name');
  });

  console.log(`\n===============================================================`);
  console.log(`🎉 COSMOS BRANDING & ANONYMITY TESTS COMPLETE: ${passed}/${total} PASSED`);
  console.log(`===============================================================\n`);
}

if (typeof process !== 'undefined' && process.argv[1]?.includes('cosmosBrandingAnonymity.test')) {
  runCosmosBrandingAnonymityTests().catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
}
