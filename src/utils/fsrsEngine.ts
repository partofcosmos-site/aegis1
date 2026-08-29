import { parseISO, differenceInDays } from 'date-fns';

export interface RevisionCard {
  subject: string;
  topic: string;
  daysAgo: number;
  type: 'stability' | 'consolidation' | 'decay';
}

export function generateMorningRevisionSprint(logs: any[], today: Date): {
  stabilityCard: RevisionCard | null;
  consolidationCard: RevisionCard | null;
  decayCard: RevisionCard | null;
} {
  const groups: Record<string, { subject: string; topic: string; mostRecentDate: Date }> = {};

  for (const log of logs) {
    if (!log.subject || !log.topic || !log.date) continue;
    const key = `${log.subject.toLowerCase()}|${log.topic.toLowerCase()}`;
    const logDate = parseISO(log.date.substring(0, 10));

    if (!groups[key] || logDate > groups[key].mostRecentDate) {
      groups[key] = {
        subject: log.subject,
        topic: log.topic,
        mostRecentDate: logDate
      };
    }
  }

  const stability: RevisionCard[] = [];
  const consolidation: RevisionCard[] = [];
  const decay: RevisionCard[] = [];

  for (const key in groups) {
    const group = groups[key];
    const daysSince = differenceInDays(today, group.mostRecentDate);

    if (daysSince >= 21) {
      stability.push({ subject: group.subject, topic: group.topic, daysAgo: daysSince, type: 'stability' });
    } else if (daysSince >= 7 && daysSince < 21) {
      consolidation.push({ subject: group.subject, topic: group.topic, daysAgo: daysSince, type: 'consolidation' });
    } else if (daysSince >= 2 && daysSince < 7) {
      decay.push({ subject: group.subject, topic: group.topic, daysAgo: daysSince, type: 'decay' });
    }
  }

  // Prioritize most urgent (longest days ago within bucket)
  stability.sort((a, b) => b.daysAgo - a.daysAgo);
  consolidation.sort((a, b) => b.daysAgo - a.daysAgo);
  decay.sort((a, b) => b.daysAgo - a.daysAgo);

  return {
    stabilityCard: stability[0] || null,
    consolidationCard: consolidation[0] || null,
    decayCard: decay[0] || null
  };
}
