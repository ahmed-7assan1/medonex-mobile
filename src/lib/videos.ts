import {
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { api } from "./api";
import { useLiveEnabled } from "./query-mode";
import { isFixtureMode } from "./fixtures";
export type StudentVideo = {
  id: string;
  title: string;
  url: string;
  videoId: string | null;
  thumbnail: string | null;
  lectureId: string;
  lectureTitle: string;
  subjectName: string;
  moduleId: string | null;
  moduleName: string | null;
  channelId: string | null;
  channelTitle: string;
  channelThumbnail: string | null;
  likes: number;
  comments: number;
  source: string;
  startTime?: number | null;
  endTime?: number | null;
};
export type StudentEducator = {
  id: string;
  youtubeId: string;
  name: string;
  handle: string | null;
  thumbnail: string | null;
  description: string | null;
  subscribers: string | null;
  followersCount: number;
  isFollowing: boolean;
  isDiscovered: boolean;
  banner?: string | null;
};
export type StudentVideoPage = {
  items: StudentVideo[];
  total: number;
  page: number;
  hasMore: boolean;
  modules: { id: string; name: string }[];
  instructors: StudentEducator[];
  channel: StudentEducator | null;
};
export const VIDEO_PREVIEW_EDUCATOR: StudentEducator = {
  id: "sample-educator",
  youtubeId: "sample-educator",
  name: "Sample Educator",
  handle: "@sample.educator",
  thumbnail: null,
  description:
    "A local preview of the educator page. Sign in to view educators linked to your curriculum.",
  subscribers: null,
  followersCount: 0,
  isFollowing: false,
  isDiscovered: false,
};
const previewModules = [
  { id: "sample-anatomy", name: "Anatomy" },
  { id: "sample-physiology", name: "Physiology" },
];
export const VIDEO_PREVIEWS: StudentVideo[] = Array.from(
  { length: 6 },
  (_, index) => ({
    id: "sample-video-" + index,
    title: [
      "Introduction to anatomy",
      "The cardiac cycle",
      "Upper limb review",
      "Respiratory physiology",
      "Clinical anatomy",
      "Renal physiology",
    ][index],
    url: "",
    videoId: null,
    thumbnail: null,
    lectureId: "l1",
    lectureTitle: "Sample lecture",
    subjectName: index % 2 ? "Physiology" : "Anatomy",
    moduleId: previewModules[index % 2].id,
    moduleName: previewModules[index % 2].name,
    channelId: "sample-educator",
    channelTitle: "Sample Educator",
    channelThumbnail: null,
    likes: 0,
    comments: 0,
    source: "sample",
  })
);
export function useStudentVideos(
  filters: {
    q?: string;
    moduleId?: string;
    channelId?: string;
    videoId?: string;
  } = {}
) {
  const live = useLiveEnabled();
  const client = useQueryClient();
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters))
    if (value) params.set(key, value);
  const filterKey = params.toString();
  const query = useInfiniteQuery({
    queryKey: ["student-videos", filterKey],
    enabled: live,
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api.get<StudentVideoPage>(
        "/videos?" +
          filterKey +
          (filterKey ? "&" : "") +
          "page=" +
          pageParam +
          "&limit=12"
      ),
    getNextPageParam: (page) => (page.hasMore ? page.page + 1 : undefined),
    retry: 1,
  });
  const guest = isFixtureMode();
  const items = guest
    ? VIDEO_PREVIEWS.filter(
        (video) =>
          (!filters.q ||
            [video.title, video.moduleName, video.channelTitle]
              .join(" ")
              .toLowerCase()
              .includes(filters.q.toLowerCase())) &&
          (!filters.moduleId || video.moduleId === filters.moduleId) &&
          (!filters.channelId || video.channelId === filters.channelId) &&
          (!filters.videoId || video.id === filters.videoId)
      )
    : query.data
    ? Array.from(
        new Map(
          query.data.pages
            .flatMap((page) => page.items)
            .map((item) => [item.id, item])
        ).values()
      )
    : undefined;
  const pages = query.data?.pages || [];
  const cached = client
    .getQueriesData<InfiniteData<StudentVideoPage>>({
      queryKey: ["student-videos"],
    })
    .flatMap(
      ([, data]) => data?.pages.flatMap((page) => page.instructors) || []
    );
  const instructors = guest
    ? [VIDEO_PREVIEW_EDUCATOR]
    : Array.from(
        new Map(
          pages
            .flatMap((page) => page.instructors)
            .map((item) => [item.id, item])
        ).values()
      );
  const channel = filters.channelId
    ? guest
      ? filters.channelId === "sample-educator"
        ? VIDEO_PREVIEW_EDUCATOR
        : null
      : pages.find((page) => page.channel)?.channel ||
        cached.find(
          (item) =>
            item.id === filters.channelId ||
            item.youtubeId === filters.channelId
        ) ||
        null
    : null;
  return {
    ...query,
    items,
    modules: guest ? previewModules : pages[0]?.modules || [],
    instructors,
    channel,
    total: guest ? items?.length || 0 : pages[0]?.total || 0,
    hasNextPage: guest ? false : query.hasNextPage,
  };
}
