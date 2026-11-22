import { useQuery } from '@tanstack/react-query';
import { FIXTURE_FEED, FIXTURE_FORUMS, isPreviewFixtures } from './fixtures';
import { api, apiV1, ApiError } from './api';

export type ForumType = 'GLOBAL' | 'UNIVERSITY' | 'FACULTY' | 'SEMESTER' | 'PRIVATE';

export interface Forum {
  id: string;
  name: string;
  type: ForumType;
  status: string;
  unreadCount?: number;
}

export interface TierInfo {
  tier: string;
  label: string;
  available: boolean;
}

export interface UserSummary {
  id: string;
  name: string;
  avatarUrl: string | null;
  rankLabel?: string | null;
  telegramVerified?: boolean;
  handle?: string | null;
}

export interface Attachment {
  id: string;
  type: 'image' | 'audio' | 'file';
  url: string;
  name?: string;
}

export interface Post {
  id: string;
  content: string;
  imageUrl: string | null;
  attachments: Attachment[];
  author: UserSummary | null;
  isAnonymous: boolean;
  forumId: string;
  forumName?: string;
  isPinned: boolean;
  hashtags: string[];
  reactionCounts: Record<string, number>;
  userReaction: string | null;
  commentCount: number;
  shareCount: number;
  isSaved: boolean;
  likesCount?: number;
  createdAt: string;
}

export interface RoomSummary {
  id: string;
  name: string;
  isPublic?: boolean;
  isJoined?: boolean;
  image?: string | null;
  _count?: { members: number; posts: number };
}

async function guestSafe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) return null;
    throw e;
  }
}

export const useForums = () => {
  const q = useQuery({ queryKey: ['forums'], queryFn: () => guestSafe(() => apiV1.get<Forum[]>('/forums')), staleTime: 5 * 60_000, enabled: !isPreviewFixtures() });
  // Pages phase: show fixture content when the backend is unreachable.
  return { ...q, data: isPreviewFixtures() ? FIXTURE_FORUMS : q.data ?? (q.isError ? FIXTURE_FORUMS : q.data) };
};

export const useTiers = () =>
  useQuery({ queryKey: ['community-tiers'], queryFn: () => guestSafe(() => apiV1.get<{ tiers: TierInfo[] }>('/community/tiers')), staleTime: 5 * 60_000 });

export const useCommunityFeed = (tier?: string) => {
  const q = useQuery({
    queryKey: ['community-feed', tier ?? 'default'],
    queryFn: () =>
      guestSafe(() =>
        apiV1.get<{ items: Post[]; nextCursor: string | null; hasMore: boolean }>(
          `/community/feed?limit=10${tier ? `&tier=${encodeURIComponent(tier)}` : ''}`,
        ),
      ),
    staleTime: 60_000,
    enabled: !isPreviewFixtures(),
  });
  // Pages phase: show fixture content when the backend is unreachable.
  return { ...q, data: isPreviewFixtures() ? FIXTURE_FEED : q.data ?? (q.isError ? FIXTURE_FEED : q.data) };
};

export const useRooms = () =>
  useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const [mine, all] = await Promise.all([
        guestSafe(() => api.get<RoomSummary[]>('/rooms/me')),
        guestSafe(() => apiV1.get<RoomSummary[]>('/rooms')),
      ]);
      if (mine === null && all === null) return null;
      return { myRoom: mine?.[0] ?? null, rooms: (all ?? []).filter((r) => r.id !== mine?.[0]?.id) };
    },
    staleTime: 5 * 60_000,
  });
