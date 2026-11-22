import type { QuizPaperCard } from '@/lib/quiz';

export const SCORE_COLORS = {
  blue: '#1A6BCC',
  indigo: '#4F46E5',
  emerald: '#059669',
  amber: '#D97706',
  red: '#DC2626',
} as const;

export function scoreColor(score: number): string {
  return score >= 70 ? SCORE_COLORS.emerald : score >= 50 ? SCORE_COLORS.amber : SCORE_COLORS.red;
}

/** Site: QuizCard.getQuizStatus. */
export function getQuizStatus(paper: Pick<QuizPaperCard, 'attemptCount' | 'bestScore' | 'inProgress'>) {
  const done = paper.attemptCount > 0;
  const needsRetry = done && (paper.bestScore ?? 0) <= 60;
  const statusColor = needsRetry ? SCORE_COLORS.red : SCORE_COLORS.blue;

  const cta = paper.inProgress
    ? { label: 'Resume', color: SCORE_COLORS.emerald }
    : done
      ? { label: 'Retry', color: SCORE_COLORS.red }
      : { label: 'Start', color: SCORE_COLORS.blue };

  const status = paper.inProgress
    ? { label: 'In Progress', color: SCORE_COLORS.amber, bg: 'rgba(217,119,6,.10)' }
    : needsRetry
      ? { label: 'Needs Retry', color: SCORE_COLORS.red, bg: 'rgba(220,38,38,.10)' }
      : done
        ? { label: 'Completed', color: SCORE_COLORS.emerald, bg: 'rgba(5,150,105,.10)' }
        : { label: 'Not Started', color: SCORE_COLORS.blue, bg: 'rgba(26,107,204,.10)' };

  return { statusColor, cta, status };
}
