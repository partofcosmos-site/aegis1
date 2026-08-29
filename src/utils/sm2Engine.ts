import { addDays } from 'date-fns';

const intervals = [3, 7, 21, 60]; // days between reviews

export function getNextReviewDate(repetitionCount: number): string {
  const days = intervals[Math.min(repetitionCount, intervals.length - 1)];
  return addDays(new Date(), days).toISOString().split('T')[0];
}
