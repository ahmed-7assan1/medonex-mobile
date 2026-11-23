import { useLiveEnabled } from './query-mode';
import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import { FIXTURE_HOME, isFixtureMode } from './fixtures';

/** Response of GET /api/mobile/home (MedQs0 src/app/api/mobile/home/route.ts). */
export interface HomeData {
  suggestedLectures?: Array<{ lectureId: string; moduleId: string; title: string; moduleName?: string; subjectName?: string; description?: string; imageUrl?: string | null }>;
  dailyTarget?: number;
  todayItemCount?: number;
  progressToNext?: number;
  user: {
    id: string;
    name: string | null;
    nickname: string | null;
    email: string;
    image: string | null;
    points: number;
    rank: { id: string; label: string; badge: string | null } | null;
    university: { id: string; name: string } | null;
    semester: { id: string; name: string } | null;
  };
  stats: {
    totalAttempts: number;
    avgScore: number;
    completedLectures: number;
    points: number;
    rank: { id: string; label: string; badge: string | null } | null;
    streak: number;
  };
  recentActivity: Array<{
    lastViewedAt: string;
    isCompleted?: boolean;
    lecture: {
      id: string;
      title: string;
      coverImageUrl?: string | null;
      subject: { id: string; name: string; module: { id: string; name: string } } | null;
    } | null;
  }>;
  suggestedPapers: Array<{
    id: string;
    title: string;
    module: { id: string; name: string } | null;
    _count?: { attempts: number };
  }>;
  todayTasks: Array<{ id: string; title: string; time?: string; completed?: boolean; isDone?: boolean; done?: boolean }>;
  unreadNotifs: number;
  adBanners: Array<{ id: string; imageUrl: string; linkUrl: string | null }>;
  topUsers: Array<{
    id: string;
    name: string | null;
    image: string | null;
    points: number;
    rank: { badge: string | null; label: string } | null;
  }>;
}

export function useHome() {
  const q = useQuery({
    queryKey: ['home'],
    queryFn: () => isFixtureMode() ? Promise.resolve(FIXTURE_HOME) : api.get<HomeData>('/home'),
    staleTime: 5 * 60 * 1000,
    enabled: useLiveEnabled(),
  });
  // Pages phase: show fixture content when the backend is unreachable.
  return { ...q, data: isFixtureMode() ? FIXTURE_HOME : q.data };
}

export function firstNameOf(name: string | null | undefined, email?: string): string {
  const n = (name ?? '').trim();
  if (n) return n.split(/\s+/)[0];
  return (email ?? 'there').split('@')[0];
}

/** Title-case like the site's toTitleCase (small words stay lowercase). */
const SMALL = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor', 'of', 'on', 'or', 'the', 'to', 'up', 'via']);
export function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/(\s+)/)
    .map((w, i) => (i === 0 || !SMALL.has(w) ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join('');
}
