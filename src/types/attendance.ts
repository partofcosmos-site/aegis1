export type AbsenceCategory =
  | 'olympiad'
  | 'jee_prep'
  | 'self_study'
  | 'travel'
  | 'medical'
  | 'academic_deputation'
  | 'exam_prep'
  | 'buffer'
  | 'holiday_prep'
  | 'school_work'
  | 'recovery'
  | 'other';

export interface SubjectAttendance {
  id: string;
  code?: string;
  name: string;
  attended: number;
  total: number;
  required: number;
  color: string;
  isPracticalSubject?: boolean;
}

export interface AbsenceEntry {
  id: string;
  date: string;
  dayOfWeek: string;
  reason: string;
  category: AbsenceCategory;
  isPracticalDay: boolean;
  notes?: string;
}

export type HolidayClassification =
  | 'National'
  | 'Gazetted'
  | 'State / Regional'
  | 'State / Festive'
  | 'National / Festive'
  | 'State / Academic';

export interface HolidayEntry {
  id: string;
  date: string;
  dayOfWeek: string;
  name: string;
  classification: string;
  inVacationWindow?: string;
}

export interface VacationEntry {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  calendarDays: number;
  schoolDaysSaved: number;
  description: string;
}

export interface ExamMilestone {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  ptmDate: string;
  status: 'completed' | 'upcoming' | 'scheduled';
  strategicFocus?: string;
  syllabusPercentage?: number;
}

export interface OnDutyCredit {
  id: string;
  program: string;
  institution: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  status: 'APPROVED_ON_DUTY' | 'PENDING' | 'REJECTED';
  verificationRef: string;
  description: string;
}

export interface InstitutionalProfile {
  schoolName: string;
  affiliationNo: string;
  board: string;
  stream: string;
  sessionStart: string;
  lockDate: string;
  totalWorkingDays: number;
  workingDaysHeld: number;
  presentDays: number;
  absentDays: number;
  onDutyDays: number;
  subjects: SubjectAttendance[];
}

export interface AttendanceMetrics {
  workingDaysHeld: number;
  presentDays: number;
  onDutyDays: number;
  absentDays: number;
  totalSessionDays: number;
  remainingSessionDays: number;
  effectiveDays: number;
  effectivePct: number;
  rawPct: number;
  safeLeaves75: number;
  safeLeaves60: number;
  daysMustAttend75: number;
  daysMustAttend60: number;
  targetDays75: number;
  targetDays60: number;
  consecutiveRecoveryRaw: number;
  consecutiveRecoveryEffective: number;
  effectiveSurplusBuffer: number;
  statusEffective: 'safe' | 'warning' | 'danger';
  statusRaw: 'safe' | 'warning' | 'danger';
}

export interface SimulationResult {
  hypotheticalAbsences: number;
  hypotheticalAttended: number;
  projectedEffectiveDays: number;
  projectedHeldDays: number;
  projectedEffectivePct: number;
  projectedFinalPctDec31: number;
  meetsSafe75: boolean;
  meetsCondonation60: boolean;
}

export interface InstitutionalAttendanceState {
  profile: InstitutionalProfile;
  absences: AbsenceEntry[];
  holidays: HolidayEntry[];
  vacations: VacationEntry[];
  exams: ExamMilestone[];
  onDuty: OnDutyCredit[];
  lastUpdated: string;
}
