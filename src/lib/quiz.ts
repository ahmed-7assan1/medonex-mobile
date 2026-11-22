import { useQuery } from '@tanstack/react-query';
import { apiV1, ApiError } from './api';
import { FIXTURE_PAST_PAPERS, isPreviewFixtures } from './fixtures';

export interface QuizPaperAttempt { id: string; score: number; createdAt: string; }

export interface QuizPaperCard {
  id: string;
  title: string;
  moduleName: string;
  timeLimitMin: number | null;
  isInteractive: boolean;
  questionCount: number;
  attemptCount: number;
  bestScore: number | null;
  attempts: QuizPaperAttempt[];
  inProgress: boolean;
  kind?: 'paper' | 'lecture';
}

export interface PastPapersResponse {
  cards: QuizPaperCard[];
  paperCount: number;
  completedPapers: number;
  avgScore: number;
  isAdmin: boolean;
}

export type QuizFilter = 'all' | 'in_progress' | 'completed' | 'not_started';

/** /api/v1/past-papers/cards — 401 for guests (the site redirects to /login). */
export function usePastPapers() {
  const q = useQuery({
    queryKey: ['past-papers'],
    queryFn: async () => {
      try {
        return await apiV1.get<PastPapersResponse>('/past-papers/cards');
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null; // guest
        throw e;
      }
    },
    staleTime: 5 * 60 * 1000,
    enabled: !isPreviewFixtures(),
  });
  // Pages phase: show fixture content when the backend is unreachable.
  return { ...q, data: isPreviewFixtures() ? FIXTURE_PAST_PAPERS : q.data ?? (q.isError ? FIXTURE_PAST_PAPERS : q.data) };
}
