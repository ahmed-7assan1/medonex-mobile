import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { api, apiV1 } from "./api";
import { useAuth } from "./auth";
import { useLiveEnabled } from "./query-mode";
import { FIXTURE_FEED, isFixtureMode } from "./fixtures";
import { normalizeFeedPost, type Post } from "./community";
export type DesktopPost = Post & {
  tableData?: unknown;
  poll?: any;
  questions?: any[];
  flashcards?: any;
  sharedQuestion?: any;
  sharedQuestionData?: any;
  quizData?: any;
};
export function normalizeDesktopPost(raw: any, userId?: string): DesktopPost {
  return normalizeFeedPost(raw,userId) as DesktopPost;
}
export function useDesktopForumFeed(forumId: string) {
  const live = useLiveEnabled(),
    { user } = useAuth();
  const query = useInfiniteQuery({
    queryKey: ["desktop-forum-feed", forumId],
    enabled: live && !!forumId,
    initialPageParam: null as string | null,
    retry: 1,
    queryFn: async ({ pageParam }) => {
      const result = await apiV1.get<{
        data: any[];
        nextCursor: string | null;
        hasMore: boolean;
      }>(
        "/community/feed?tier=global&forumId=" +
          encodeURIComponent(forumId) +
          "&limit=10" +
          (pageParam ? "&cursor=" + encodeURIComponent(pageParam) : "")
      );
      return {
        items: result.data.map((post) => normalizeDesktopPost(post, user?.id)),
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      };
    },
    getNextPageParam: (page) =>
      page.hasMore && page.nextCursor ? page.nextCursor : undefined,
  });
  return {
    ...query,
    data: isFixtureMode()
      ? {
          pages: [
            {
              items: FIXTURE_FEED.items.filter(
                (post) => post.forumId === forumId
              ) as DesktopPost[],
              nextCursor: null,
              hasMore: false,
            },
          ],
          pageParams: [null],
        }
      : query.data,
  };
}
export function useSocialSidebar() {
  const query = useQuery({
    queryKey: ["social-sidebar"],
    enabled: useLiveEnabled(),
    retry: 1,
    staleTime: 120000,
    queryFn: () =>
      api.get<{
        suggestedUsers: {
          id: string;
          name: string | null;
          image: string | null;
          isOnline: boolean;
        }[];
        trendingTags: { id: string; name: string; count: number }[];
      }>("/social-sidebar"),
  });
  return {
    ...query,
    data: isFixtureMode()
      ? { suggestedUsers: [], trendingTags: [] }
      : query.data,
  };
}
export function useDesktopRooms() {
  const query = useQuery({
    queryKey: ["desktop-social-rooms"],
    enabled: useLiveEnabled(),
    retry: 1,
    staleTime: 120000,
    queryFn: async () => {
      const [mine, all] = await Promise.all([
        api.get<import("./community").RoomSummary[]>("/rooms/me"),
        apiV1.get<import("./community").RoomSummary[]>("/rooms"),
      ]);
      const joined = new Set(mine.map((room) => room.id));
      return [...mine, ...all.filter((room) => !joined.has(room.id))].map(
        (room) => ({ ...room, isJoined: joined.has(room.id) })
      );
    },
  });
  return { ...query, data: isFixtureMode() ? [] : query.data };
}
