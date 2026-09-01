/**
 * Savantix (Aegis) — Institutional Attendance & Calendar Test Suite
 * @file attendanceInstitutional.test.ts
 * 
 * Verifies:
 * 1. The Bandhan School Aranghata institutional profile (Affiliation 2430453, CBSE 10+2 Class XI-Science).
 * 2. Session boundaries: Start date 2026-04-21, Lock date 2026-12-31, 139 total projected working days.
 * 3. Exact ground truth as of September 1, 2026: 71 working days held, 48 present, 23 absent.
 * 4. Specific logged absence dates (including 2026-08-28 Friday before Raksha Bandhan and 2026-09-01 Tuesday).
 * 5. Approved On-Duty Credits: 10 working days for IIT Kharagpur Kriti RISE IKITIES Program (2026-06-15 to 2026-06-26).
 * 6. 28 Official institutional holidays with correct classifications.
 * 7. 4 Major vacation windows (Summer, Puja, Diwali, Winter) and school days saved.
 * 8. 4 Examination & PTM milestones (PT1, Half-Yearly, PT2, Annual Exam).
 * 9. Subject roster integrity (6 CBSE Science subjects, practical day tags).
 * 10. Local storage persistence and state hydration with zero data loss.
 */

import {
  DEFAULT_PROFILE,
  DEFAULT_ABSENCES,
  DEFAULT_HOLIDAYS,
  DEFAULT_VACATIONS,
  DEFAULT_EXAMS,
  DEFAULT_ON_DUTY,
  DEFAULT_SUBJECTS,
  DEFAULT_INITIAL_STATE,
  INSTITUTIONAL_STORAGE_KEY,
  LEGACY_SUBJECTS_STORAGE_KEY,
  loadInstitutionalState,
  saveInstitutionalState
} from '../services/attendanceRegulatorService';

import {
  InstitutionalProfile,
  AbsenceEntry,
  HolidayEntry,
  VacationEntry,
  ExamMilestone,
  OnDutyCredit,
  SubjectAttendance
} from '../types/attendance';

// In-Memory localStorage mock for Node.js test runner
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

export async function runAttendanceInstitutionalTests(): Promise<void> {
  console.log('\n===============================================================');
  console.log('🏛️ RUNNING SUITE: Institutional Attendance & Calendar Tests');
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

  // 1. Institutional Profile Verification
  test('Institutional Profile: matches The Bandhan School Aranghata specifications', () => {
    assertEqual(DEFAULT_PROFILE.schoolName, 'The Bandhan School Aranghata', 'School Name');
    assertEqual(DEFAULT_PROFILE.affiliationNo, '2430453', 'CBSE Affiliation Number');
    assert(DEFAULT_PROFILE.board.includes('CBSE'), 'Affiliated Board must be CBSE');
    assert(DEFAULT_PROFILE.stream.includes('Class XI'), 'Academic stream must be Class XI');
    assert(DEFAULT_PROFILE.stream.includes('Science'), 'Academic stream must be Science');
    assertEqual(DEFAULT_PROFILE.sessionStart, '2026-04-21', 'Session Start Date');
    assertEqual(DEFAULT_PROFILE.lockDate, '2026-12-31', 'CBSE Attendance Lock Date');
    assertEqual(DEFAULT_PROFILE.totalWorkingDays, 139, 'Total projected working days');
  });

  // 2. Ground Truth Numbers Verification (Sept 1, 2026)
  test('Ground Truth Numbers: 71 held days, 48 present, 23 absent, 10 on-duty days', () => {
    assertEqual(DEFAULT_PROFILE.workingDaysHeld, 71, 'Working days held to date as of Sept 1, 2026');
    assertEqual(DEFAULT_PROFILE.presentDays, 48, 'Physically attended days');
    assertEqual(DEFAULT_PROFILE.absentDays, 23, 'Total absent days (20 logged + 1 today + 3 buffer)');
    assertEqual(DEFAULT_PROFILE.onDutyDays, 10, 'Approved on-duty days for IIT Kharagpur Kriti RISE');
    
    // Mathematical consistency check
    assert(
      DEFAULT_PROFILE.presentDays + DEFAULT_PROFILE.absentDays === DEFAULT_PROFILE.workingDaysHeld,
      'Present + Absent must equal working days held (48 + 23 = 71)'
    );
  });

  // 3. Approved On-Duty Credits Verification
  test('Approved On-Duty Credits: 10 working days at IIT Kharagpur Kriti RISE', () => {
    assert(Array.isArray(DEFAULT_ON_DUTY), 'On-duty credits must be an array');
    assertEqual(DEFAULT_ON_DUTY.length, 1, 'Exactly 1 on-duty credit record');

    const iitKgp = DEFAULT_ON_DUTY[0];
    assertEqual(iitKgp.program, 'Kriti RISE IKITIES Program', 'Program Name');
    assertEqual(iitKgp.institution, 'Indian Institute of Technology (IIT) Kharagpur', 'Host Institution');
    assertEqual(iitKgp.startDate, '2026-06-15', 'On-Duty Start Date');
    assertEqual(iitKgp.endDate, '2026-06-26', 'On-Duty End Date');
    assertEqual(iitKgp.workingDays, 10, 'Credited Working Days');
    assertEqual(iitKgp.status, 'APPROVED_ON_DUTY', 'Status must be APPROVED_ON_DUTY');
    assert(iitKgp.verificationRef.length > 0, 'Must have a verification reference code');
  });

  // 4. Logged Absences Schedule Verification
  test('Logged Absences: contains all 21 specific dates + 3 buffer records = 24 entries', () => {
    assert(Array.isArray(DEFAULT_ABSENCES), 'Absences must be an array');
    assertEqual(DEFAULT_ABSENCES.length, 24, 'Total absence entries (21 logged dates + 3 buffer entries)');

    // Verify critical user-corrected dates
    const aug28Absence = DEFAULT_ABSENCES.find(a => a.date === '2026-08-28');
    assert(!!aug28Absence, 'Absence on 2026-08-28 (Day before Raksha Bandhan) must exist');
    assertEqual(aug28Absence!.dayOfWeek, 'Friday', '2026-08-28 is Friday');
    assertEqual(aug28Absence!.isPracticalDay, true, '2026-08-28 is a Practical Day');

    const sept01Absence = DEFAULT_ABSENCES.find(a => a.date === '2026-09-01');
    assert(!!sept01Absence, 'Absence on 2026-09-01 (Today / Sept 1 2026) must exist');
    assertEqual(sept01Absence!.dayOfWeek, 'Tuesday', '2026-09-01 is Tuesday');
    assertEqual(sept01Absence!.category, 'exam_prep', '2026-09-01 category is exam_prep');

    // Verify first absence
    const firstAbsence = DEFAULT_ABSENCES.find(a => a.date === '2026-04-24');
    assert(!!firstAbsence, 'First absence on 2026-04-24 must exist');
    assertEqual(firstAbsence!.isPracticalDay, true, '2026-04-24 is Practical Day');

    // Verify practical days vs non-practical days
    const practicalAbsences = DEFAULT_ABSENCES.filter(a => a.isPracticalDay);
    assert(practicalAbsences.length >= 10, 'Must identify practical day absences');

    // Verify buffer absences
    const bufferAbsences = DEFAULT_ABSENCES.filter(a => a.category === 'buffer');
    assertEqual(bufferAbsences.length, 3, 'Must contain exactly 3 buffer absences');
  });

  // 5. Official Holiday Calendar Verification (28 Holidays)
  test('Official Holiday Calendar: exactly 28 gazetted and institutional holidays', () => {
    assert(Array.isArray(DEFAULT_HOLIDAYS), 'Holidays must be an array');
    assertEqual(DEFAULT_HOLIDAYS.length, 28, 'Must contain exactly 28 official holidays');

    const holidayNames = DEFAULT_HOLIDAYS.map(h => h.name);
    assert(holidayNames.includes('Good Friday'), 'Good Friday in holiday calendar');
    assert(holidayNames.includes('Dr. B.R. Ambedkar Jayanti'), 'Ambedkar Jayanti in holiday calendar');
    assert(holidayNames.includes('Bengali New Year (Poila Boishakh)'), 'Bengali New Year in holiday calendar');
    assert(holidayNames.includes("May Day (International Workers' Day)"), 'May Day in holiday calendar');
    assert(holidayNames.includes('Rabindra Jayanti'), 'Rabindra Jayanti in holiday calendar');
    assert(holidayNames.includes('Eid-ul-Zuha (Bakrid)'), 'Eid-ul-Zuha in holiday calendar');
    assert(holidayNames.includes('Muharram'), 'Muharram in holiday calendar');
    assert(holidayNames.includes('Rath Yatra'), 'Rath Yatra in holiday calendar');
    assert(holidayNames.includes('Independence Day'), 'Independence Day in holiday calendar');
    assert(holidayNames.includes('Milad-un-Nabi (Fateha-Dwaz-Daham)'), 'Milad-un-Nabi in holiday calendar');
    assert(holidayNames.includes('Janmashtami'), 'Janmashtami in holiday calendar');
    assert(holidayNames.includes('Mahatma Gandhi Jayanti'), 'Gandhi Jayanti in holiday calendar');
    assert(holidayNames.includes('Mahalaya'), 'Mahalaya in holiday calendar');
    assert(holidayNames.includes('Durga Puja (Maha Saptami)'), 'Durga Puja Saptami in holiday calendar');
    assert(holidayNames.includes('Durga Puja (Maha Ashtami / Navami)'), 'Durga Puja Ashtami in holiday calendar');
    assert(holidayNames.includes('Dussehra (Vijaya Dashami)'), 'Dussehra in holiday calendar');
    assert(holidayNames.includes('Lakshmi Puja'), 'Lakshmi Puja in holiday calendar');
    assert(holidayNames.includes('Kali Puja'), 'Kali Puja in holiday calendar');
    assert(holidayNames.includes('Diwali (Deepavali)'), 'Diwali in holiday calendar');
    assert(holidayNames.includes('Bhai Duj (Bhratri Dwitiya)'), 'Bhai Duj in holiday calendar');
    assert(holidayNames.includes('Guru Nanak Jayanti'), 'Guru Nanak Jayanti in holiday calendar');
    assert(holidayNames.includes('Christmas Day'), 'Christmas Day in holiday calendar');
    assert(holidayNames.includes('Swami Vivekananda Birthday (National Youth Day)'), 'Vivekananda Birthday in holiday calendar');
    assert(holidayNames.includes('Netaji Subhas Chandra Bose Birthday'), 'Netaji Birthday in holiday calendar');
    assert(holidayNames.includes('Republic Day'), 'Republic Day in holiday calendar');
    assert(holidayNames.includes('Saraswati Puja (Vasant Panchami)'), 'Saraswati Puja in holiday calendar');
    assert(holidayNames.includes('Id-ul-Fitr'), 'Id-ul-Fitr in holiday calendar');
    assert(holidayNames.includes('Dolyatra / Holi'), 'Dolyatra/Holi in holiday calendar');
  });

  // 6. Vacation Windows Verification (4 Windows)
  test('Vacation Windows: 4 major windows with school days saved', () => {
    assert(Array.isArray(DEFAULT_VACATIONS), 'Vacations must be an array');
    assertEqual(DEFAULT_VACATIONS.length, 4, 'Must have exactly 4 vacation windows');

    const summer = DEFAULT_VACATIONS.find(v => v.name === 'Summer Vacation');
    assert(!!summer, 'Summer Vacation window exists');
    assertEqual(summer!.startDate, '2026-05-18', 'Summer start');
    assertEqual(summer!.endDate, '2026-06-13', 'Summer end');
    assertEqual(summer!.calendarDays, 27, 'Summer calendar days');
    assertEqual(summer!.schoolDaysSaved, 20, 'Summer school days saved');

    const puja = DEFAULT_VACATIONS.find(v => v.name === 'Puja Vacation');
    assert(!!puja, 'Puja Vacation window exists');
    assertEqual(puja!.startDate, '2026-10-16', 'Puja start');
    assertEqual(puja!.endDate, '2026-10-26', 'Puja end');
    assertEqual(puja!.schoolDaysSaved, 7, 'Puja school days saved');

    const diwali = DEFAULT_VACATIONS.find(v => v.name === 'Diwali Break');
    assert(!!diwali, 'Diwali Break window exists');
    assertEqual(diwali!.startDate, '2026-11-09', 'Diwali start');
    assertEqual(diwali!.endDate, '2026-11-11', 'Diwali end');
    assertEqual(diwali!.schoolDaysSaved, 3, 'Diwali school days saved');

    const winter = DEFAULT_VACATIONS.find(v => v.name === 'Winter Vacation');
    assert(!!winter, 'Winter Vacation window exists');
    assertEqual(winter!.startDate, '2026-12-25', 'Winter start');
    assertEqual(winter!.endDate, '2027-01-02', 'Winter end');
    assertEqual(winter!.schoolDaysSaved, 6, 'Winter school days saved');

    const totalDaysSaved = DEFAULT_VACATIONS.reduce((sum, v) => sum + v.schoolDaysSaved, 0);
    assertEqual(totalDaysSaved, 36, 'Total school days saved across all 4 vacations must be 36');
  });

  // 7. Examination & PTM Milestones Verification (4 Milestones)
  test('Examination & PTM Milestones: 4 scheduled milestones with PTM dates', () => {
    assert(Array.isArray(DEFAULT_EXAMS), 'Exams must be an array');
    assertEqual(DEFAULT_EXAMS.length, 4, 'Must have exactly 4 exam milestones');

    const pt1 = DEFAULT_EXAMS.find(e => e.name.includes('Periodic Test 1'));
    assert(!!pt1, 'PT1 exists');
    assertEqual(pt1!.status, 'completed', 'PT1 status is completed');
    assertEqual(pt1!.ptmDate, '2026-07-18', 'PT1 PTM Date');

    const hy = DEFAULT_EXAMS.find(e => e.name.includes('Half-Yearly'));
    assert(!!hy, 'Half-Yearly exam exists');
    assertEqual(hy!.status, 'upcoming', 'Half-Yearly status is upcoming');
    assertEqual(hy!.startDate, '2026-09-14', 'Half-Yearly start date');
    assertEqual(hy!.endDate, '2026-09-25', 'Half-Yearly end date');
    assertEqual(hy!.ptmDate, '2026-10-03', 'Half-Yearly PTM Date');

    const pt2 = DEFAULT_EXAMS.find(e => e.name.includes('Periodic Test 2'));
    assert(!!pt2, 'PT2 exists');
    assertEqual(pt2!.startDate, '2026-12-11', 'PT2 start date');
    assertEqual(pt2!.endDate, '2026-12-18', 'PT2 end date');
    assertEqual(pt2!.ptmDate, '2026-12-24', 'PT2 PTM Date');

    const annual = DEFAULT_EXAMS.find(e => e.name.includes('Annual Exam'));
    assert(!!annual, 'Annual exam exists');
    assertEqual(annual!.startDate, '2027-03-01', 'Annual start date');
    assertEqual(annual!.endDate, '2027-03-12', 'Annual end date');
    assertEqual(annual!.ptmDate, '2027-03-20', 'Annual PTM Date');
  });

  // 8. Subject Roster Verification
  test('Subject Roster: 6 Class XI Science subjects with codes and practical tags', () => {
    assert(Array.isArray(DEFAULT_SUBJECTS), 'Subjects must be an array');
    assertEqual(DEFAULT_SUBJECTS.length, 6, 'Must have exactly 6 subjects');

    const physics = DEFAULT_SUBJECTS.find(s => s.code === '042');
    assert(!!physics, 'Physics 042 exists');
    assertEqual(physics!.isPracticalSubject, true, 'Physics has lab practicals');

    const chemistry = DEFAULT_SUBJECTS.find(s => s.code === '043');
    assert(!!chemistry, 'Chemistry 043 exists');
    assertEqual(chemistry!.isPracticalSubject, true, 'Chemistry has lab practicals');

    const math = DEFAULT_SUBJECTS.find(s => s.code === '041');
    assert(!!math, 'Mathematics 041 exists');
    assertEqual(math!.isPracticalSubject, false, 'Mathematics is theoretical');

    const webApp = DEFAULT_SUBJECTS.find(s => s.code === '803');
    assert(!!webApp, 'Web Application 803 exists');
    assertEqual(webApp!.isPracticalSubject, true, 'Web Application has lab practicals');

    const pe = DEFAULT_SUBJECTS.find(s => s.code === '048');
    assert(!!pe, 'Physical Education 048 exists');
    assertEqual(pe!.isPracticalSubject, true, 'Physical Education has practicals');

    const english = DEFAULT_SUBJECTS.find(s => s.code === '301');
    assert(!!english, 'English Core 301 exists');
    assertEqual(english!.isPracticalSubject, false, 'English Core is theoretical');
  });

  // 9. Storage Persistence & Zero Data Loss
  test('Persistence & Hydration: saves and reloads institutional state without corruption', () => {
    localStorage.clear();

    const initialState = loadInstitutionalState();
    assertEqual(initialState.profile.schoolName, 'The Bandhan School Aranghata', 'Initial state load fallback');

    // Save customized state
    const modifiedState = {
      ...initialState,
      profile: {
        ...initialState.profile,
        presentDays: 49,
        absentDays: 24,
        workingDaysHeld: 73
      }
    };
    saveInstitutionalState(modifiedState);

    // Verify localStorage keys were populated
    const rawInstitutional = localStorage.getItem(INSTITUTIONAL_STORAGE_KEY);
    assert(rawInstitutional !== null, 'Institutional storage key must be set');

    const rawLegacy = localStorage.getItem(LEGACY_SUBJECTS_STORAGE_KEY);
    assert(rawLegacy !== null, 'Legacy subjects key must also be maintained');

    // Rehydrate
    const rehydrated = loadInstitutionalState();
    assertEqual(rehydrated.profile.presentDays, 49, 'Rehydrated present days');
    assertEqual(rehydrated.profile.absentDays, 24, 'Rehydrated absent days');
    assertEqual(rehydrated.profile.workingDaysHeld, 73, 'Rehydrated working days held');
    assertEqual(rehydrated.holidays.length, 28, 'Holidays preserved');
    assertEqual(rehydrated.vacations.length, 4, 'Vacations preserved');
    assertEqual(rehydrated.exams.length, 4, 'Exams preserved');
  });

  console.log(`\n===============================================================`);
  console.log(`🎉 INSTITUTIONAL ATTENDANCE TESTS COMPLETE: ${passed}/${total} PASSED`);
  console.log(`===============================================================\n`);
}

if (typeof process !== 'undefined' && process.argv[1]?.includes('attendanceInstitutional.test')) {
  runAttendanceInstitutionalTests().catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
}
