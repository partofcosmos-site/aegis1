/**
 * circadianEngine.ts
 * Circadian Cognitive Load Scheduler — time-zone logic & recommendation generator
 * Feature 9: Circadian Energy Panel for Savantix Dashboard
 */

import { subDays, parseISO, isValid, startOfDay, endOfDay, isWithinInterval } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CircadianZoneId =
  | 'peak_working_memory'
  | 'high_analytical'
  | 'post_lunch_dip'
  | 'visual_spatial'
  | 'applied_practice'
  | 'consolidation_recall'
  | 'recovery';

export interface CircadianZone {
  id: CircadianZoneId;
  label: string;
  brainState: string;
  icon: string;
  /** Start minutes from midnight (e.g. 5*60+30 = 330) */
  startMinutes: number;
  /** End minutes from midnight (e.g. 9*60 = 540) */
  endMinutes: number;
  defaultRecommendations: string[];
  accentColor: string;
  borderColor: string;
  bgColor: string;
  glowColor: string;
  badgeBg: string;
}

export interface WeakSubject {
  subject: string;
  totalMinutes: number;
}

export interface TimelineSegment {
  zone: CircadianZone;
  widthFraction: number;
  isCurrent: boolean;
}

// ─── Zone Definitions ─────────────────────────────────────────────────────────

export const CIRCADIAN_ZONES: CircadianZone[] = [
  {
    id: 'peak_working_memory',
    label: 'Peak Working Memory',
    brainState: 'Peak Working Memory',
    icon: '🧠',
    startMinutes: 5 * 60 + 30,
    endMinutes:   9 * 60,
    defaultRecommendations: [
      'Tackle your hardest Olympiad numericals & proof construction',
      'Work on complex derivations requiring deep focus',
      'Attempt unseen problems from your weakest subject',
    ],
    accentColor:  'text-violet-300',
    borderColor:  'border-violet-500/40',
    bgColor:      'bg-violet-950/30',
    glowColor:    '#7c3aed',
    badgeBg:      'bg-violet-500/20 border-violet-500/40 text-violet-300',
  },
  {
    id: 'high_analytical',
    label: 'High Analytical',
    brainState: 'High Analytical',
    icon: '⚡',
    startMinutes: 9 * 60,
    endMinutes:   12 * 60,
    defaultRecommendations: [
      'Solve multi-step derivation problems and new concepts',
      'Study new chapters requiring strong analytical reasoning',
      'Attempt challenging problem sets from your weak areas',
    ],
    accentColor:  'text-indigo-300',
    borderColor:  'border-indigo-500/40',
    bgColor:      'bg-indigo-950/30',
    glowColor:    '#6366f1',
    badgeBg:      'bg-indigo-500/20 border-indigo-500/40 text-indigo-300',
  },
  {
    id: 'post_lunch_dip',
    label: 'Post-Lunch Dip',
    brainState: 'Post-Lunch Dip',
    icon: '😴',
    startMinutes: 12 * 60,
    endMinutes:   14 * 60,
    defaultRecommendations: [
      'Light revision of previously studied topics',
      'Flashcard review and formula scanning',
      'Re-read annotated notes — no new concepts',
    ],
    accentColor:  'text-amber-300',
    borderColor:  'border-amber-500/40',
    bgColor:      'bg-amber-950/20',
    glowColor:    '#f59e0b',
    badgeBg:      'bg-amber-500/20 border-amber-500/40 text-amber-300',
  },
  {
    id: 'visual_spatial',
    label: 'Visual-Spatial Energy',
    brainState: 'Visual-Spatial Energy',
    icon: '👁️',
    startMinutes: 14 * 60,
    endMinutes:   17 * 60,
    defaultRecommendations: [
      'Optics, geometry & stereochemistry problems',
      'Graph-based and diagram-heavy problem sets',
      'Coordinate geometry, 3D vectors, or wave optics',
    ],
    accentColor:  'text-cyan-300',
    borderColor:  'border-cyan-500/40',
    bgColor:      'bg-cyan-950/20',
    glowColor:    '#06b6d4',
    badgeBg:      'bg-cyan-500/20 border-cyan-500/40 text-cyan-300',
  },
  {
    id: 'applied_practice',
    label: 'Applied Practice',
    brainState: 'Applied Practice',
    icon: '🎯',
    startMinutes: 17 * 60,
    endMinutes:   20 * 60,
    defaultRecommendations: [
      'Past papers and timed mock sections',
      'Error correction — rework every mistake from today',
      'Full-length practice under exam conditions',
    ],
    accentColor:  'text-emerald-300',
    borderColor:  'border-emerald-500/40',
    bgColor:      'bg-emerald-950/20',
    glowColor:    '#10b981',
    badgeBg:      'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
  },
  {
    id: 'consolidation_recall',
    label: 'Consolidation & Recall',
    brainState: 'Consolidation & Recall',
    icon: '🔁',
    startMinutes: 20 * 60,
    endMinutes:   22 * 60,
    defaultRecommendations: [
      'Flashcard review and spaced repetition',
      "Error Vault re-read — consolidate today's mistakes",
      'Day logging: record what you learned and struggled with',
    ],
    accentColor:  'text-rose-300',
    borderColor:  'border-rose-500/40',
    bgColor:      'bg-rose-950/20',
    glowColor:    '#f43f5e',
    badgeBg:      'bg-rose-500/20 border-rose-500/40 text-rose-300',
  },
  {
    id: 'recovery',
    label: 'Recovery',
    brainState: 'Recovery',
    icon: '🌙',
    startMinutes: 22 * 60,
    endMinutes:   5 * 60 + 30, // next day
    defaultRecommendations: [
      'Rest. No hard studying.',
      'Light reading only — fiction, biography, or casual science',
      'Prepare and organize your study plan for tomorrow',
    ],
    accentColor:  'text-zinc-400',
    borderColor:  'border-zinc-600/40',
    bgColor:      'bg-zinc-900/30',
    glowColor:    '#71717a',
    badgeBg:      'bg-zinc-700/40 border-zinc-600/40 text-zinc-400',
  },
];

// ─── Time Helpers ─────────────────────────────────────────────────────────────

export function getMinutesFromMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function getCurrentZone(now: Date): CircadianZone {
  const m = getMinutesFromMidnight(now);
  const recovery = CIRCADIAN_ZONES.find(z => z.id === 'recovery')!;
  if (m >= recovery.startMinutes || m < recovery.endMinutes) return recovery;
  for (const zone of CIRCADIAN_ZONES) {
    if (zone.id === 'recovery') continue;
    if (m >= zone.startMinutes && m < zone.endMinutes) return zone;
  }
  return recovery;
}

export function getNextZone(current: CircadianZone): CircadianZone {
  const ids = CIRCADIAN_ZONES.map(z => z.id);
  const idx = ids.indexOf(current.id);
  return CIRCADIAN_ZONES[(idx + 1) % CIRCADIAN_ZONES.length];
}

export function getMinutesUntilNextZone(now: Date, currentZone: CircadianZone): number {
  const m = getMinutesFromMidnight(now);
  if (currentZone.id === 'recovery') {
    const minutesUntilMidnight = 24 * 60 - m;
    return minutesUntilMidnight + currentZone.endMinutes;
  }
  return currentZone.endMinutes - m;
}

export function formatCountdown(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const min = minutes % 60;
  if (h > 0 && min > 0) return `${h}h ${min}m`;
  if (h > 0) return `${h}h`;
  return `${min}m`;
}

// ─── Personalization ──────────────────────────────────────────────────────────

export function getWeakSubjectsFromLogs(logs: any[]): WeakSubject[] {
  const today = new Date();
  const sevenDaysAgo = subDays(today, 6);
  const start = startOfDay(sevenDaysAgo);
  const end   = endOfDay(today);
  const map: Record<string, number> = {};

  for (const log of logs || []) {
    if (!log.date) continue;
    const parsed = parseISO(log.date.substring(0, 10));
    if (!isValid(parsed) || !isWithinInterval(parsed, { start, end })) continue;
    const subjects = (log.subject || 'Uncategorized')
      .split(/,| and | & /i)
      .map((s: string) => s.trim())
      .filter(Boolean);
    const mins = Math.max(0, Number(log.durationMinutes) || 0);
    for (const s of subjects) {
      const key = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
      map[key] = (map[key] || 0) + mins;
    }
  }

  return Object.entries(map)
    .map(([subject, totalMinutes]) => ({ subject, totalMinutes }))
    .sort((a, b) => a.totalMinutes - b.totalMinutes);
}

export function getPersonalizedRecommendations(
  zone: CircadianZone,
  weakSubjects: WeakSubject[]
): string[] {
  if (weakSubjects.length === 0) return zone.defaultRecommendations;

  const top = weakSubjects.slice(0, 2).map(w => w.subject);
  const [first, second] = top;

  switch (zone.id) {
    case 'peak_working_memory':
      return [
        first  ? `Work on hardest numericals from ${first} (weakest this week)` : zone.defaultRecommendations[0],
        second ? `Proof construction or derivations in ${second}` : zone.defaultRecommendations[1],
        'Attempt 3–5 unseen Olympiad-level problems without hints',
      ];
    case 'high_analytical':
      return [
        first  ? `Study new concepts in ${first} — build analytical foundations` : zone.defaultRecommendations[0],
        second ? `Multi-step problem solving in ${second}` : zone.defaultRecommendations[1],
        'Derive key formulas from first principles for your target exam',
      ];
    case 'post_lunch_dip':
      return [
        first  ? `Light revision: scan formulas and key results in ${first}` : zone.defaultRecommendations[0],
        second ? `Flashcard review for ${second} key definitions` : zone.defaultRecommendations[1],
        'Re-read your annotated notes — no new problem solving',
      ];
    case 'visual_spatial':
      return [
        first  ? `Diagram-based problems in ${first} (geometry, graphs, spatial)` : zone.defaultRecommendations[0],
        second ? `Visual problem sets in ${second} — optics, wave diagrams` : zone.defaultRecommendations[1],
        'Sketch free-body or circuit diagrams for 5 unseen problems',
      ];
    case 'applied_practice':
      return [
        first  ? `Timed mock section from ${first} past papers — exam conditions` : zone.defaultRecommendations[0],
        second ? `Error correction in ${second} — rework every wrong answer from this week` : zone.defaultRecommendations[1],
        'Full past-paper attempt: 30 Qs in 45 mins — review all errors after',
      ];
    case 'consolidation_recall':
      return [
        first  ? `Spaced repetition flashcards for ${first}` : zone.defaultRecommendations[0],
        second ? `Error Vault re-read for ${second} — consolidate today's mistakes` : zone.defaultRecommendations[1],
        "Log today's session: what you learned, what needs revisiting tomorrow",
      ];
    default:
      return zone.defaultRecommendations;
  }
}

// ─── Timeline Builder ─────────────────────────────────────────────────────────

export function buildTimeline(currentZone: CircadianZone): TimelineSegment[] {
  const ordered = CIRCADIAN_ZONES.filter(z => z.id !== 'recovery');
  const recovery = CIRCADIAN_ZONES.find(z => z.id === 'recovery')!;
  const all = [...ordered, recovery];

  const durations = all.map(z => {
    if (z.id === 'recovery') return 24 * 60 - z.startMinutes + z.endMinutes;
    return z.endMinutes - z.startMinutes;
  });
  const total = durations.reduce((a, b) => a + b, 0);

  return all.map((zone, i) => ({
    zone,
    widthFraction: durations[i] / total,
    isCurrent: zone.id === currentZone.id,
  }));
}
