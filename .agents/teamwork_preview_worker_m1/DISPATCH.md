## 2026-09-01T10:14:12Z

You are Worker 1 for Savantix (Aegis).
Working directory: C:\Users\white\master-hub\aegis1\.agents\teamwork_preview_worker_m1
Project root: C:\Users\white\master-hub\aegis1
Original request file: C:\Users\white\master-hub\aegis1\.agents\ORIGINAL_REQUEST.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your task: Implement Milestones M1 & M2 (Historical Attendance & Institutional Calendar Ingestion, Attendance Reality Math, and Zero-Cost Gemini Web AI Regulator Bridge).

File Boundaries & Write Ownership:
You EXCLUSIVELY own and modify:
- `src/components/AttendanceTracker.tsx`
- `src/components/AttendanceCalculator.tsx`
- `src/types/attendance.ts`
- `src/services/attendanceRegulatorService.ts` (if needed)

Read Explorer 1's detailed survey reports in:
- `C:\Users\white\master-hub\aegis1\.agents\teamwork_preview_explorer_survey_3_1\analysis.md`
- `C:\Users\white\master-hub\aegis1\.agents\teamwork_preview_explorer_survey_3_1\handoff.md`

Specifications to implement:
1. Academic Record Ingestion (The Bandhan School Aranghata, Affiliation 2430453, CBSE 10+2, Class XI-Science, Mon-Fri schedule):
   - Session Start: `2026-04-21`, Lock Date: `2026-12-31`, Projected working days: 139.
   - Ground Truth as of Sept 1, 2026: Working days held to date = 71 days.
   - Present days = 48 days. Absent days = 23 days (20 previous logged dates + 2026-08-28 Friday before Raksha Bandhan + 2026-09-01 Tuesday + 3 buffer).
   - Approved On-Duty Credits = 10 working days for *Kriti RISE IKITIES Program at IIT Kharagpur* (`2026-06-15` to `2026-06-26`, Status: APPROVED_ON_DUTY).
2. Live Metrics & Reality Math Engine:
   - Live Effective Attendance: `(48 + 10) / 71 = 58 / 71 = 81.69%`. (Raw: `48 / 71 = 67.61%`).
   - Dynamic safe future leaves to Dec 31 (68 working days remaining):
     - Target safe threshold 75%: `68 - (ceil(0.75 * 139) - 58) = 68 - (105 - 58) = 21 days`.
     - Target condonation threshold 60%: `68 - (ceil(0.60 * 139) - 58) = 68 - (84 - 58) = 42 days`.
   - Consecutive compulsory recovery formula: `C_rec = max(0, ceil((0.75 * T_held - (P + OD)) / 0.25))`.
3. Comprehensive Calendar Ledgers:
   - 28 Official Institutional Holidays (Good Friday, Ambedkar Jayanti, Bengali New Year, May Day, Rabindra Jayanti, Eid-ul-Zuha, Muharram, Rath Yatra, Independence Day, Milad-un-Nabi, Janmashtami, Gandhi Jayanti, Mahalaya, Dussehra, Lakshmi Puja, Kali Puja, Diwali, Bhai Duj, Guru Nanak Jayanti, Christmas, Swami Vivekananda Birthday, Netaji Birthday, Republic Day, Saraswati Puja, Id-ul-Fitr, Dolyatra, Holi).
   - 4 Vacation Windows: Summer Vacation (2026-05-18 to 2026-06-13), Puja Vacation (2026-10-16 to 2026-10-26), Diwali Break (2026-11-09 to 2026-11-11), Winter Vacation (2026-12-25 to 2027-01-02).
   - 4 Examination & PTM Milestones: PT1 (Completed), Half-Yearly (2026-09-14 to 2026-09-25, PTM 2026-10-03), PT2 (2026-12-11 to 2026-12-18, PTM 2026-12-24), Annual Exam (2027-03-01 to 2027-03-12, PTM 2027-03-20).
   - Full absence schedule with reason details and practical day flags.
4. Zero-Cost Gemini AI Regulator Bridge:
   - 1-Click "Launch Attendance AI Regulator" button that opens `https://gemini.google.com/app` and copies a rich, structured prompt payload to `navigator.clipboard`.
   - Embeds CBSE Rule 13.2 / 14 by-laws, dummy schooling vs NIOS vs British A-Levels analysis, integrated coaching balancing, and medical condonation documentation protocol.
5. Local Persistence & Non-Destructive Storage:
   - Use `savantix_attendance_institutional_v1` while preserving `savantix_attendance_data_v1` so subject stats remain intact.
6. Verify your implementation by running `& "C:\Program Files\nodejs\node.exe" node_modules/typescript/bin/tsc --noEmit`.
