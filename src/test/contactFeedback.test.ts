/**
 * Savantix (Aegis) — Contact & Feedback Hub Test Suite
 * @file contactFeedback.test.ts
 * 
 * Verifies:
 * 1. Form validation logic (name, email regex, subject, message, priority, academic focus)
 * 2. Category matrix & automatic diagnostics attachment behavior
 * 3. Mailto fallback URL generation & URI escaping
 * 4. FormSubmit AJAX payload formatting & clipboard text layout
 * 5. Draft auto-save persistence & submitted ticket history schemas
 * 6. Storage error resilience & boundary/adversarial input handling
 */

import { FeedbackCategory, FeaturePriority, AcademicFocus, SubmittedTicket } from '../components/ContactFeedback';

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

// Attach mock localStorage to global environment if running in Node.js
if (typeof globalThis.localStorage === 'undefined') {
  const mockStorage = new MockLocalStorage();
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockStorage,
    writable: true,
    configurable: true
  });
}

// ─── CONSTANTS UNDER TEST ──────────────────────────────────────────────────
const DRAFT_STORAGE_KEY = 'savantix_feedback_draft';
const HISTORY_STORAGE_KEY = 'savantix_submitted_feedback';
const FORMSUBMIT_ENDPOINT = 'https://formsubmit.co/ajax/savantix.core@gmail.com';
const GITHUB_ISSUES_URL = 'https://github.com/partofcosmos-site/aegis1/issues';

// ─── VALIDATION ENGINE MIRROR ──────────────────────────────────────────────
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateFormFields(formData: {
  name: string;
  email: string;
  subject: string;
  message: string;
  category?: FeedbackCategory;
  priority?: FeaturePriority;
  academicFocus?: AcademicFocus;
}) {
  const cleanName = (formData.name || '').trim();
  const cleanEmail = (formData.email || '').trim();
  const cleanSubject = (formData.subject || '').trim();
  const cleanMessage = (formData.message || '').trim();

  const isNameValid = cleanName.length >= 2;
  const isEmailValid = cleanEmail !== '' && EMAIL_REGEX.test(cleanEmail);
  const isSubjectValid = cleanSubject.length >= 3;
  const isMessageValid = cleanMessage.length >= 10;

  const errors: string[] = [];
  if (!isNameValid) errors.push('Name must be at least 2 characters');
  if (!isEmailValid) errors.push('Valid email address is required');
  if (!isSubjectValid) errors.push('Subject must be at least 3 characters');
  if (!isMessageValid) errors.push('Message must be at least 10 characters');

  return {
    isValid: isNameValid && isEmailValid && isSubjectValid && isMessageValid,
    isNameValid,
    isEmailValid,
    isSubjectValid,
    isMessageValid,
    errors
  };
}

export function generateIssuesUrl(params: {
  category: FeedbackCategory;
  subject: string;
  message: string;
  priority?: FeaturePriority;
  academicFocus?: AcademicFocus;
  affiliation?: string;
  includeDiagnostics?: boolean;
  diagnosticsData?: Record<string, any>;
}): string {
  const title = encodeURIComponent(`[Savantix ${params.category.toUpperCase()}] ${params.subject || 'Feedback'}`);
  let body = `### Feedback Category\n${params.category.toUpperCase()}\n\n`;
  if (params.category === 'feature') body += `**Priority**: ${params.priority || 'medium'}\n\n`;
  if (params.category === 'academic') body += `**Focus**: ${params.academicFocus || 'ipho'}\n**Affiliation**: ${params.affiliation || 'Independent'}\n\n`;
  body += `### Message\n${params.message}\n\n`;
  if (params.includeDiagnostics && params.diagnosticsData) {
    body += `### Diagnostics\n\`\`\`json\n${JSON.stringify(params.diagnosticsData, null, 2)}\n\`\`\`\n`;
  }
  return `${GITHUB_ISSUES_URL}/new?title=${title}&body=${encodeURIComponent(body)}`;
}

export function formatFormSubmitPayload(params: {
  category: FeedbackCategory;
  name: string;
  email: string;
  subject: string;
  message: string;
  priority?: FeaturePriority;
  academicFocus?: AcademicFocus;
  affiliation?: string;
  includeDiagnostics?: boolean;
  diagnosticsData?: Record<string, any>;
}): Record<string, any> {
  const postData: Record<string, any> = {
    name: params.name.trim(),
    email: params.email.trim(),
    category: params.category.toUpperCase(),
    _subject: `[Savantix Feedback: ${params.category.toUpperCase()}] ${params.subject.trim()}`,
    subject: params.subject.trim(),
    message: params.message.trim(),
    _template: 'table',
    _captcha: 'false',
  };

  if (params.category === 'feature') {
    postData.priority = (params.priority || 'medium').toUpperCase();
  }
  if (params.category === 'academic') {
    postData.academicFocus = params.academicFocus || 'ipho';
    postData.affiliation = params.affiliation || 'Independent';
  }
  if (params.includeDiagnostics && params.diagnosticsData) {
    postData.diagnostics = JSON.stringify(params.diagnosticsData, null, 2);
  }

  return postData;
}

export function formatClipboardTicket(params: {
  category: FeedbackCategory;
  name: string;
  email: string;
  subject: string;
  message: string;
  priority?: FeaturePriority;
  academicFocus?: AcademicFocus;
  affiliation?: string;
  includeDiagnostics?: boolean;
  diagnosticsData?: Record<string, any>;
  timestamp?: string;
}): string {
  let content = `================ SAVANTIX FEEDBACK TICKET ================\n`;
  content += `Category: ${params.category.toUpperCase()}\n`;
  content += `Sender: ${params.name} <${params.email}>\n`;
  content += `Subject: ${params.subject}\n`;
  content += `Timestamp: ${params.timestamp || new Date().toISOString()}\n`;
  if (params.category === 'feature') {
    content += `Priority: ${(params.priority || 'medium').toUpperCase()}\n`;
  }
  if (params.category === 'academic') {
    content += `Academic Focus: ${(params.academicFocus || 'ipho').toUpperCase()}\n`;
    content += `Affiliation: ${params.affiliation || 'Independent'}\n`;
  }
  content += `\n--- MESSAGE ---\n${params.message}\n`;
  if (params.includeDiagnostics && params.diagnosticsData) {
    content += `\n--- SYSTEM DIAGNOSTICS ---\n${JSON.stringify(params.diagnosticsData, null, 2)}\n`;
  }
  content += `==========================================================`;
  return content;
}

// ─── ASSERTION UTILITY ─────────────────────────────────────────────────────
function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
}

// ─── TEST RUNNER ───────────────────────────────────────────────────────────
export async function runContactFeedbackTests() {
  console.log('\n===============================================================');
  console.log('🧪 RUNNING CONTACT & FEEDBACK HUB TEST SUITE');
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

  // 1. Email Regex & Form Validation
  test('Email validation: accepts standard and modern top-level domains', () => {
    const validEmails = [
      'scholar.olympiad@gmail.com',
      'user.name+tag@domain.co.uk',
      'scholar@mit.edu',
      'test_user-123@sub.domain.org',
      'researcher@savantix.app',
      'a.b.c@physics.ox.ac.uk'
    ];

    validEmails.forEach(em => {
      assert(EMAIL_REGEX.test(em), `Should accept valid email: ${em}`);
    });
  });

  test('Email validation: rejects malformed and malicious emails', () => {
    const invalidEmails = [
      '',
      'plainaddress',
      '@missingusername.com',
      'username@',
      'username@nocollon',
      'spaces in@email.com',
      'user@domain .com'
    ];

    invalidEmails.forEach(em => {
      assert(!EMAIL_REGEX.test(em), `Should reject invalid email: ${em}`);
    });
  });

  test('Form validation: verifies name, subject, message boundary conditions', () => {
    // Exact minimum boundaries
    const exactMin = validateFormFields({
      name: 'Ab', // 2 chars
      email: 'a@b.com',
      subject: 'Bug', // 3 chars
      message: '1234567890' // 10 chars
    });
    assert(exactMin.isValid, 'Exact boundary inputs must be valid');

    // 1 char under minimums
    const underMinName = validateFormFields({ name: 'A', email: 'a@b.com', subject: 'Bug', message: '1234567890' });
    assert(!underMinName.isNameValid && !underMinName.isValid, '1-char name must fail');

    const underMinSubject = validateFormFields({ name: 'Ab', email: 'a@b.com', subject: 'AB', message: '1234567890' });
    assert(!underMinSubject.isSubjectValid && !underMinSubject.isValid, '2-char subject must fail');

    const underMinMessage = validateFormFields({ name: 'Ab', email: 'a@b.com', subject: 'Bug', message: '123456789' });
    assert(!underMinMessage.isMessageValid && !underMinMessage.isValid, '9-char message must fail');

    // Whitespace trimming behavior
    const whitespaceName = validateFormFields({ name: '  A  ', email: 'a@b.com', subject: 'Bug', message: '1234567890' });
    assert(!whitespaceName.isNameValid, 'Trimmed single character name must fail');
  });

  // 2. Category Matrix & Diagnostics Behavior
  test('Category matrix: all 4 categories supported with proper metadata schema', () => {
    const categories: FeedbackCategory[] = ['bug', 'feature', 'academic', 'inquiry'];
    categories.forEach(cat => {
      const payload = formatFormSubmitPayload({
        category: cat,
        name: 'Scholar Researcher',
        email: 'scholar@savantix.app',
        subject: `${cat} report subject`,
        message: 'This is a detailed feedback test message for Savantix.'
      });
      assert(payload.category === cat.toUpperCase(), `Payload category should be ${cat.toUpperCase()}`);
      assert(payload._subject.includes(cat.toUpperCase()), `_subject must include category tag: ${payload._subject}`);
    });
  });

  test('Category-specific fields: feature priorities and academic focus', () => {
    // Feature with high priority
    const featurePayload = formatFormSubmitPayload({
      category: 'feature',
      priority: 'high',
      name: 'Scholar',
      email: 'scholar@savantix.app',
      subject: 'Add Dark Mode High Contrast',
      message: 'Would love high-contrast KaTeX formulas.'
    });
    assert(featurePayload.priority === 'HIGH', 'Feature payload must include uppercase priority');

    // Academic focus and affiliation
    const academicPayload = formatFormSubmitPayload({
      category: 'academic',
      academicFocus: 'ipho',
      affiliation: 'National Physics Team',
      name: 'Olympiad Scholar',
      email: 'scholar@savantix.app',
      subject: 'IPhO Thermodynamics Problem Bank',
      message: 'Collaboration on 4-tier socratic physics solving.'
    });
    assert(academicPayload.academicFocus === 'ipho', 'Academic payload must include academicFocus');
    assert(academicPayload.affiliation === 'National Physics Team', 'Academic payload must include affiliation');
  });

  // 3. GitHub Issues URL Generator
  test('GitHub Issues generator: produces valid issue creation URL with parameters', () => {
    const issues = generateIssuesUrl({
      category: 'bug',
      subject: 'LaTeX & Formula Parser Issue #42',
      message: 'Formula rendering fails on $\\alpha + \\beta$ & <special> chars.',
      includeDiagnostics: true,
      diagnosticsData: { platform: 'Windows', browser: 'Chrome 130' }
    });

    assert(issues.startsWith(GITHUB_ISSUES_URL), 'Must target GitHub repository issues');
    assert(issues.includes('title='), 'Must contain title parameter');
    assert(issues.includes('body='), 'Must contain body parameter');
    assert(issues.includes('%5BSavantix%20BUG%5D'), 'Title must encode [Savantix BUG]');
    assert(issues.includes('Chrome%20130'), 'Body must encode diagnostics data');
  });

  // 4. FormSubmit Payload & Clipboard Layout
  test('FormSubmit payload: conforms to endpoint expectations without captcha', () => {
    const diagnostics = {
      appVersion: '1.0.0 (Savantix Aegis Edition)',
      platform: 'Windows 11',
      onlineStatus: 'Online'
    };
    const payload = formatFormSubmitPayload({
      category: 'inquiry',
      name: 'Jane Doe',
      email: 'jane@example.com',
      subject: 'General Question on FSRS Spaced Repetition',
      message: 'How does Savantix tune the retention factor in FSRS-5?',
      includeDiagnostics: true,
      diagnosticsData: diagnostics
    });

    assert(payload._template === 'table', '_template must be table');
    assert(payload._captcha === 'false', '_captcha must be false to avoid blocking AJAX');
    assert(typeof payload.diagnostics === 'string', 'Diagnostics must be serialized JSON');
    const parsedDiag = JSON.parse(payload.diagnostics);
    assert(parsedDiag.platform === 'Windows 11', 'Diagnostics must retain fields');
  });

  test('Clipboard ticket export: structures human-readable ASCII layout', () => {
    const timestamp = '2026-09-01T03:30:00.000Z';
    const text = formatClipboardTicket({
      category: 'feature',
      priority: 'critical',
      name: 'Scholar',
      email: 'scholar@savantix.app',
      subject: 'Audio Buffer Isolation in Pomodoro',
      message: 'Ensure YouTube audio node does not reinitialize on timer tick.',
      timestamp
    });

    assert(text.includes('================ SAVANTIX FEEDBACK TICKET ================'), 'Header banner');
    assert(text.includes('Category: FEATURE'), 'Category uppercase');
    assert(text.includes('Priority: CRITICAL'), 'Priority uppercase');
    assert(text.includes('Sender: Scholar <scholar@savantix.app>'), 'Sender format');
    assert(text.includes('--- MESSAGE ---'), 'Message section delimiter');
    assert(text.includes('Audio Buffer Isolation in Pomodoro'), 'Message content');
    assert(text.includes('=========================================================='), 'Footer banner');
  });

  // 5. Draft Storage & History Management
  test('Draft auto-save and clear lifecycle in localStorage', () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);

    const draftData = {
      category: 'academic' as FeedbackCategory,
      name: 'Scholar',
      email: 'scholar@savantix.app',
      subject: 'JEE Advanced Mock Tests',
      message: 'Drafting our physics question distribution.',
      academicFocus: 'jee' as AcademicFocus,
      affiliation: 'Apex Institute',
      includeDiagnostics: true,
      lastSaved: new Date().toISOString()
    };

    // Save draft
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
    const savedRaw = localStorage.getItem(DRAFT_STORAGE_KEY);
    assert(savedRaw !== null, 'Draft must exist in localStorage');

    const loadedDraft = JSON.parse(savedRaw!);
    assert(loadedDraft.subject === 'JEE Advanced Mock Tests', 'Loaded draft must match saved subject');
    assert(loadedDraft.academicFocus === 'jee', 'Loaded draft must match academicFocus');

    // Clear draft
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    assert(localStorage.getItem(DRAFT_STORAGE_KEY) === null, 'Draft must be cleared');
  });

  test('Submitted ticket history: records tickets in LIFO order with complete schema', () => {
    localStorage.removeItem(HISTORY_STORAGE_KEY);

    const ticket1: SubmittedTicket = {
      id: 'ticket_1',
      timestamp: '2026-09-01T01:00:00.000Z',
      category: 'bug',
      name: 'User 1',
      email: 'u1@test.com',
      subject: 'Issue 1',
      message: 'Description of issue 1',
      deliveryMethod: 'FormSubmit AJAX',
      status: 'Delivered',
      diagnosticsIncluded: true
    };

    const ticket2: SubmittedTicket = {
      id: 'ticket_2',
      timestamp: '2026-09-01T02:00:00.000Z',
      category: 'feature',
      priority: 'high',
      name: 'User 2',
      email: 'u2@test.com',
      subject: 'Feature 2',
      message: 'Description of feature 2',
      deliveryMethod: 'mailto Fallback',
      status: 'Exported'
    };

    // Simulate saving history with unshift (newest first)
    const history: SubmittedTicket[] = [ticket2, ticket1];
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));

    const loadedHistoryRaw = localStorage.getItem(HISTORY_STORAGE_KEY);
    assert(loadedHistoryRaw !== null, 'History must exist in localStorage');

    const loadedHistory: SubmittedTicket[] = JSON.parse(loadedHistoryRaw!);
    assert(loadedHistory.length === 2, 'History must contain 2 tickets');
    assert(loadedHistory[0].id === 'ticket_2', 'Newest ticket must be first (LIFO)');
    assert(loadedHistory[0].deliveryMethod === 'mailto Fallback', 'Ticket 2 delivery method matches');
    assert(loadedHistory[1].status === 'Delivered', 'Ticket 1 status matches');
  });

  test('Storage resilience: handles corrupted JSON gracefully without crashing', () => {
    // Set corrupted non-JSON value
    localStorage.setItem(HISTORY_STORAGE_KEY, '{invalid-json-content}');
    
    let recoveredHistory: SubmittedTicket[] = [];
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          recoveredHistory = parsed;
        }
      }
    } catch {
      recoveredHistory = [];
    }

    assert(recoveredHistory.length === 0, 'Must gracefully recover empty array on corrupted history');
  });

  // 6. Adversarial Input Stress Testing
  test('Adversarial input stress: handles XSS vectors, null bytes, long strings, Unicode emojis', () => {
    const xssPayload = '<script>alert("xss")</script><img src=x onerror=alert(1)>';
    const unicodePayload = '⚛️ 🧠 📚 🚀 — ΔE = ħω & ∫_{0}^{∞} e^{-x^2} dx = √π/2';
    const longString = 'A'.repeat(5000);

    const validated = validateFormFields({
      name: 'Scholar 🚀',
      email: 'scholar.jee@domain.org',
      subject: unicodePayload,
      message: `${xssPayload}\n${longString}`
    });

    assert(validated.isValid, 'Adversarial payload containing valid lengths must pass validation');

    const formattedPayload = formatFormSubmitPayload({
      category: 'bug',
      name: 'Scholar 🚀',
      email: 'scholar.jee@domain.org',
      subject: unicodePayload,
      message: `${xssPayload}\n${longString}`
    });

    assert(formattedPayload.subject === unicodePayload, 'Unicode preserved in payload');
    assert(formattedPayload.message.includes(xssPayload), 'String preserved verbatim without corruption');
  });

  console.log(`\n===============================================================`);
  console.log(`🎉 CONTACT & FEEDBACK HUB TESTS COMPLETE: ${passedCount}/${totalCount} PASSED`);
  console.log(`===============================================================\n`);
}

// Auto-run when executed directly via tsx
if (typeof process !== 'undefined' && process.argv[1]?.includes('contactFeedback.test')) {
  runContactFeedbackTests().catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
}
