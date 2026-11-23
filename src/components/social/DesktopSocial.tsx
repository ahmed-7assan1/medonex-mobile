import React, { useEffect, useMemo, useState,useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Bell,
  BookOpen,
  ChevronRight,
  Clock,
  Flame,
  Globe,
  Image as ImageIcon,
  Lock,
  Menu,
  Plus,
  SquarePen,
  Users,
  Video,
  X,
} from "lucide-react-native";
import { useTheme } from "@/theme/ThemeContext";
import { useAuth } from "@/lib/auth";
import { useForums, type RoomSummary } from "@/lib/community";
import {
  useDesktopForumFeed,
  useDesktopRooms,
  useSocialSidebar,
  type DesktopPost,
} from "@/lib/desktop-social";
import { useSavedPosts } from "@/lib/profile";
import { useNotifications } from "@/lib/notifications";
import { isFixtureMode } from "@/lib/fixtures";
import { SCROLL_BOTTOM_PAD } from "@/theme/tokens";
import { ResourceState } from "@/components/ResourceState";
import { CommentsSheet } from "./CommentsSheet";
import { WebsitePostDetail } from './WebsitePostDetail';
import { DesktopSavedPostCard } from './DesktopSavedPostCard';
import {
  DesktopTweetCard,
  SocialSourceIcon,
  socialMediaUrl,
  socialReadOnly,
  socialAvatarColor,
} from "./DesktopTweetCard";
import { timeAgo } from "./format";
type Page = "home" | "explore" | "rooms" | "notifications" | "saved";
const NAV: { id: Page; label: string; icon: string }[] = [
  { id: "home", label: "Home", icon: "HomeIcon" },
  { id: "explore", label: "Explore", icon: "MagnifyingGlassIcon" },
  { id: "rooms", label: "Rooms", icon: "ChatBubbleLeftRightIcon" },
  { id: "notifications", label: "Activity", icon: "BellIcon" },
  { id: "saved", label: "Saved", icon: "BookmarkIcon" },
];
/** Website OneXCommunity desktop grid, including its 960/1200px breakpoints. */
export function DesktopSocial() {
  const { colors, isDark, fonts } = useTheme(),
    { width, height } = useWindowDimensions(),
    insets = useSafeAreaInsets(),
    router = useRouter(),
    { user, isGuest } = useAuth(),
    params = useLocalSearchParams<{ post?: string }>();
  const [page, setPage] = useState<Page>("home"),
    [activeId, setActiveId] = useState(""),
    [sort, setSort] = useState<"recent" | "top">("recent"),
    [drawer, setDrawer] = useState(false),
    [roomModal, setRoomModal] = useState<"create" | "join" | null>(null),
    [notices, setNotices] = useState(false),
    [suggestions, setSuggestions] = useState(false),
    [selectedPost, setSelectedPost] = useState<DesktopPost | null>(null),
    [comments, setComments] = useState<string | null>(null);
  const forums = useForums(),
    selected =
      forums.data?.find((circle) => circle.id === activeId) || forums.data?.[0],
    feed = useDesktopForumFeed(selected?.id || ""),
    rooms = useDesktopRooms(),
    sidebar = useSocialSidebar(),
    saved = useSavedPosts(page === "saved"),
    notifications = useNotifications(page === "notifications" || notices);
  const small = width <= 960,
    compact = width <= 1200;
  const circles = useMemo(
    () =>
      [...(forums.data || [])].sort((a, b) => {
        const rank = (value: string) =>
          value === "GLOBAL" || value === "UNIVERSITY"
            ? 0
            : value === "SEMESTER"
            ? 1
            : 2;
        return rank(a.type) - rank(b.type);
      }),
    [forums.data]
  );
  const posts = useMemo(
    () =>
      [...(feed.data?.pages.flatMap((part) => part.items) || [])].sort((a, b) =>
        sort === "top"
          ? (b.likesCount || 0) * 2 +
            b.commentCount -
            ((a.likesCount || 0) * 2 + a.commentCount)
          : Date.parse(b.createdAt) - Date.parse(a.createdAt)
      ),
    [feed.data, sort]
  );
  useEffect(() => {
    if (params.post) setComments(params.post);
  }, [params.post]);
  const font = (
    size: number,
    color = colors.foreground,
    weight: "400" | "500" | "600" | "700" | "800" | "900" = "400"
  ) => ({
    fontFamily: "Arial",
    fontSize: size,
    lineHeight: size * 1.65,
    letterSpacing: -0.15,
    color,
    fontWeight: weight,
  });
  const card = {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 18,
  };
  const label = (value: string) => (
    <Text
      style={{
        ...font(10, colors.mutedForeground, "700"),
        letterSpacing: 1.2,
        textTransform: "uppercase",
      }}
    >
      {value}
    </Text>
  );
  const action = (text: string, onPress: () => void, primary = false) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={text}
      onPress={onPress}
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: primary ? 0 : 1,
        borderColor: colors.border,
        backgroundColor: primary ? colors.primary : "transparent",
      }}
    >
      <Text
        style={font(
          12,
          primary ? colors.primaryForeground : colors.mutedForeground,
          "700"
        )}
      >
        {text}
      </Text>
    </Pressable>
  );
  const loadError = (error: unknown, onRetry: () => void) => (
    <View style={{ padding: 24, alignItems: "center", gap: 12 }}>
      <Text
        style={{ ...font(12, colors.mutedForeground), textAlign: "center" }}
      >
        {error ? "This section could not load." : "Loading..."}
      </Text>
      {error ? (
        <Pressable accessibilityRole="button" onPress={onRetry}>
          <Text style={font(12, colors.primary, "700")}>Try again</Text>
        </Pressable>
      ) : (
        <ActivityIndicator color={colors.mutedForeground} />
      )}
    </View>
  );
  const choose = (id: Page) => {
    setPage(id);
    setDrawer(false);
  };
  const sidebarNavigation = (inDrawer = false) => (
    <View style={{ gap: 8 }}>
      {!inDrawer && (
        <View style={{ gap: 6 }}>
          {NAV.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={"Community " + item.label}
              accessibilityState={{ selected: page === item.id }}
              onPress={() => choose(item.id)}
              style={{
                width: "100%",
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 12,
                borderWidth: page === item.id ? 1 : 0,
                borderColor:
                  page === item.id ? colors.border + "99" : "transparent",
                backgroundColor:
                  page === item.id ? colors.muted + "B3" : "transparent",
              }}
            >
              <SocialSourceIcon
                name={item.icon}
                color={colors.foreground}
                size={18}
              />
              <Text
                style={font(
                  13.5,
                  page === item.id ? colors.foreground : colors.mutedForeground,
                  page === item.id ? "700" : "400"
                )}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      {inDrawer && (
        <View style={{ gap: 4, marginBottom: 8 }}>
          {NAV.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={"Community " + item.label}
              onPress={() => choose(item.id)}
              style={{
                padding: 10,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <SocialSourceIcon name={item.icon} color={colors.foreground} />
              <Text
                style={font(
                  14,
                  colors.foreground,
                  page === item.id ? "700" : "500"
                )}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      {!!circles.length && (
        <View
          style={{
            paddingTop: 12,
            marginTop: 4,
            borderTopWidth: 1,
            borderColor: colors.border + "66",
          }}
        >
          <Text
            style={{
              ...font(11, colors.mutedForeground, "700"),
              letterSpacing: 0.55,
              textTransform: "uppercase",
              width: 84,
              paddingHorizontal: 12,
              paddingBottom: 4,
            }}
          >
            Circles
          </Text>
          <View style={{ gap: 4 }}>
            {circles.map((circle) => (
              <Pressable
                key={circle.id}
                accessibilityRole="button"
                accessibilityLabel={"Circle " + circle.name}
                accessibilityState={{ selected: selected?.id === circle.id }}
                onPress={() => {
                  setActiveId(circle.id);
                  setPage("home");
                  setDrawer(false);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor:
                    selected?.id === circle.id
                      ? colors.primary + "40"
                      : "transparent",
                  backgroundColor:
                    selected?.id === circle.id
                      ? colors.primary + "1A"
                      : "transparent",
                }}
              >
                <SocialSourceIcon
                  name={
                    circle.type === "GLOBAL" || circle.type === "UNIVERSITY"
                      ? "GlobeAltIcon"
                      : "BookOpenIcon"
                  }
                  color={
                    selected?.id === circle.id
                      ? colors.primary
                      : colors.mutedForeground
                  }
                  size={16}
                />
                <Text
                  numberOfLines={1}
                  style={{
                    ...font(
                      12,
                      selected?.id === circle.id
                        ? colors.primary
                        : colors.mutedForeground,
                      "500"
                    ),
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {circle.name}
                </Text>
                {!!circle._count?.posts && (
                  <Text
                    style={{
                      ...font(
                        10,
                        selected?.id === circle.id
                          ? colors.primaryForeground
                          : colors.mutedForeground,
                        "700"
                      ),
                      backgroundColor:
                        selected?.id === circle.id
                          ? colors.primary
                          : colors.muted,
                      borderRadius: 99,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                    }}
                  >
                    {circle._count.posts}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        </View>
      )}
      {inDrawer && (
        <View
          style={{
            gap: 6,
            marginTop: 16,
            paddingTop: 16,
            borderTopWidth: 1,
            borderColor: colors.border,
          }}
        >
          {action(
            "+ Create Room",
            () => {
              setDrawer(false);
              setRoomModal("create");
            },
            true
          )}
          {action("+ Join Room", () => {
            setDrawer(false);
            setRoomModal("join");
          })}
        </View>
      )}
    </View>
  );
  const roomRow = (room: RoomSummary, joined: boolean) => (
    <View
      key={room.id}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.background,
        marginBottom: 12,
        gap: 10,
      }}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {room.isPublic ? (
            <Globe size={14} color={colors.foreground} />
          ) : (
            <Lock size={14} color={colors.foreground} />
          )}
          <Text style={{ ...font(13, colors.foreground, "600"), flex: 1 }}>
            {room.name}
          </Text>
        </View>
        <Text style={font(11, colors.mutedForeground)}>
          {room._count?.members ?? "N/A"} {joined ? "MEMBERS" : "members"}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={(joined ? "Open " : "Join ") + room.name}
        onPress={() =>
          joined
            ? router.push(`/rooms/${encodeURIComponent(room.id)}` as never)
            : setRoomModal("join")
        }
        style={{
          paddingHorizontal: joined ? 6 : 12,
          paddingVertical: 5,
          borderRadius: 8,
          backgroundColor: joined ? colors.muted : colors.primary,
        }}
      >
        {joined ? (
          <ChevronRight size={14} color={colors.primary} />
        ) : (
          <Text style={font(11, colors.primaryForeground, "700")}>Join</Text>
        )}
      </Pressable>
    </View>
  );
  const suggestedList = (all = false) => (
    <View style={{ gap: 2 }}>
      {(sidebar.data?.suggestedUsers || [])
        .slice(0, all ? 6 : 5)
        .map((person) => {
          const avatar = socialMediaUrl(person.image);
          return (
            <View
              key={person.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                padding: 8,
                borderRadius: 12,
              }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={"Profile of " + (person.name || "Student")}
                onPress={() =>
                  router.push(
                    `/profile/${encodeURIComponent(person.id)}` as never
                  )
                }
                style={{ position: "relative", width: 36, height: 36 }}
              >
                {avatar ? (
                  <Image
                    source={{ uri: avatar }}
                    style={{ width: 36, height: 36, borderRadius: 999 }}
                  />
                ) : (
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 999,
                      backgroundColor: socialAvatarColor(
                        person.name || "U",
                        true
                      ),
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={font(10.8, "#ffffff", "700")}>
                      {(person.name || "U").slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                )}
                {person.isOnline && (
                  <View
                    style={{
                      position: "absolute",
                      right: -1,
                      bottom: -1,
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      backgroundColor: "#22c55e",
                      borderWidth: 2,
                      borderColor: colors.card,
                    }}
                  />
                )}
              </Pressable>
              <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                <Text
                  numberOfLines={1}
                  style={font(13, colors.foreground, "700")}
                >
                  {person.name || "Student"}
                </Text>
                <Text
                  numberOfLines={1}
                  style={font(11, colors.mutedForeground)}
                >
                  New to MedOneX • Medical
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={"Follow " + (person.name || "Student")}
                onPress={socialReadOnly}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.primary,
                }}
              >
                <Plus size={14} color={colors.primaryForeground} />
              </Pressable>
            </View>
          );
        })}
    </View>
  );
  const activity = () => {
    const data = notifications.data?.notifications || [];
    return (
      <View
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 20,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: 16,
            paddingHorizontal: 20,
            borderBottomWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={font(16, colors.foreground, "700")}>Notifications</Text>
          {!!notifications.data?.unreadCount && (
            <Pressable accessibilityRole="button" onPress={socialReadOnly}>
              <Text style={font(12, colors.primary, "600")}>Mark all read</Text>
            </Pressable>
          )}
        </View>
        {!isGuest && !notifications.data ? (
          loadError(notifications.error, () => notifications.refetch())
        ) : !data.length ? (
          <View
            style={{
              paddingVertical: 60,
              paddingHorizontal: 20,
              alignItems: "center",
              gap: 12,
            }}
          >
            <Bell size={40} color={colors.mutedForeground} />
            <Text style={font(14, colors.mutedForeground)}>
              No notifications yet
            </Text>
          </View>
        ) : (
          <ScrollView
            style={{ maxHeight: height * 0.6 }}
            contentContainerStyle={{ paddingVertical: 8 }}
          >
            {data.slice(0, 50).map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={socialReadOnly}
                style={{
                  flexDirection: "row",
                  gap: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  borderBottomWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: item.read
                    ? "transparent"
                    : "rgba(91,94,247,.05)",
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    backgroundColor: item.read ? colors.muted : colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Bell
                    size={18}
                    color={
                      item.read
                        ? colors.mutedForeground
                        : colors.primaryForeground
                    }
                  />
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text
                    style={{
                      ...font(14, colors.foreground, item.read ? "500" : "700"),
                      lineHeight: 18.2,
                    }}
                  >
                    {item.title}
                  </Text>
                  <Text style={font(13, colors.mutedForeground)}>
                    {item.body}
                  </Text>
                  <Text
                    style={{
                      ...font(11, colors.mutedForeground),
                      marginTop: 1,
                    }}
                  >
                    {timeAgo(item.createdAt)}
                  </Text>
                </View>
                {!item.read && (
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      backgroundColor: colors.primary,
                      marginTop: 6,
                    }}
                  />
                )}
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };
  const emptyPosts = (savedPage = false) => (
    <View
      style={{
        ...card,
        borderRadius: 24,
        paddingVertical: 80,
        paddingHorizontal: 20,
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 20,
          backgroundColor: colors.primary + "14",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        {savedPage ? (
          <SocialSourceIcon
            name="BookmarkIcon"
            color={colors.primary}
            size={24}
          />
        ) : (
          <SquarePen size={24} color={colors.primary} />
        )}
      </View>
      <Text
        style={{
          ...font(17, colors.foreground, "800"),
          letterSpacing: -0.17,
          marginBottom: 8,
        }}
      >
        {savedPage ? "No saved posts" : "No posts yet"}
      </Text>
      <Text
        style={{
          ...font(13, colors.mutedForeground),
          lineHeight: 20.8,
          textAlign: "center",
        }}
      >
        {savedPage
          ? "Save posts you want to read later"
          : `Be the first to post in ${selected?.name || "this circle"}!`}
      </Text>
    </View>
  );
  if (!forums.data)
    return (
      <ResourceState
        title="Community"
        error={forums.error}
        onRetry={() => forums.refetch()}
      />
    );
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top,
      }}
    >
      <View
        testID="desktop-social-grid"
        style={{
          flex: 1,
          minHeight: 0,
          paddingHorizontal: 16,
          paddingTop: 16,
          flexDirection: "row",
          gap: small ? 0 : compact ? 12 : 16,
        }}
      >
        {!small && (
          <ScrollView
            testID="desktop-social-left"
            style={{
              width: compact ? 64 : 200,
              flexGrow: 0,
              overflow: "visible",
              marginTop: 56,
            }}
            contentContainerStyle={{ paddingBottom: SCROLL_BOTTOM_PAD }}
            showsVerticalScrollIndicator={false}
          >
            {sidebarNavigation()}
          </ScrollView>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <ScrollView
            testID="desktop-social-feed"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              width: small ? "100%" : "75%",
              alignSelf: "center",
              paddingHorizontal: 20,
              paddingTop: 32,
              paddingBottom: SCROLL_BOTTOM_PAD + insets.bottom,
              gap: 16,
            }}
          >
            <View style={{ height: 24 }} />
            {small && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 4,
                }}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open community menu"
                  onPress={() => setDrawer(true)}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 10,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.muted,
                  }}
                >
                  <Menu size={20} color={colors.foreground} />
                </Pressable>
                <Text
                  style={{ ...font(18, colors.foreground, "900"), flex: 1 }}
                >
                  {page === "home"
                    ? "OneX Community"
                    : page === "explore"
                    ? "Explore"
                    : page === "rooms"
                    ? "Rooms"
                    : page === "notifications"
                    ? "Notifications"
                    : "Saved Posts"}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Community notifications"
                  onPress={() => setNotices(true)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.muted,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Bell size={16} color={colors.mutedForeground} />
                </Pressable>
              </View>
            )}
            {isGuest && (
              <Text
                style={{
                  ...font(11, colors.mutedForeground),
                  textAlign: "center",
                }}
              >
                Guest preview. Posts are samples; account activity is not
                loaded.
              </Text>
            )}
            {page === "home" && (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 4,
                    gap: 8,
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Clock size={14} color={colors.primary} />
                    <Text
                      style={{
                        ...font(10, colors.primary, "700"),
                        letterSpacing: 1.4,
                        textTransform: "uppercase",
                        flexShrink: 1,
                      }}
                    >
                      {selected?.name || "Feed"} Activity
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    {(["recent", "top"] as const).map((value) => (
                      <Pressable
                        key={value}
                        accessibilityRole="button"
                        accessibilityLabel={
                          value === "recent" ? "Recent posts" : "Top posts"
                        }
                        accessibilityState={{ selected: sort === value }}
                        onPress={() => setSort(value)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                          paddingVertical: 6,
                          paddingHorizontal: 14,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor:
                            sort === value
                              ? colors.primary
                              : colors.border + "66",
                          backgroundColor:
                            sort === value
                              ? colors.primary
                              : colors.muted + "66",
                        }}
                      >
                        <Text
                          style={{
                            ...font(
                              12,
                              sort === value
                                ? colors.primaryForeground
                                : colors.mutedForeground,
                              "700"
                            ),
                            lineHeight: 16,
                          }}
                        >
                          {value === "recent" ? "⚡" : "🔥"}
                        </Text>
                        <Text
                          style={{
                            ...font(
                              12,
                              sort === value
                                ? colors.primaryForeground
                                : colors.mutedForeground,
                              "700"
                            ),
                            lineHeight: 16,
                          }}
                        >
                          {value === "recent" ? "Recent" : "Top"}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                {!selected ? (
                  emptyPosts()
                ) : !feed.data ? (
                  loadError(feed.error, () => feed.refetch())
                ) : posts.length ? (
                  <View style={{ gap: 12 }}>
                    {posts.map((post) => (
                      <DesktopTweetCard
                        key={post.id}
                        post={post}
                        onOpen={() => setSelectedPost(post)}
                        onComments={() => setComments(post.id)}
                      />
                    ))}
                    {feed.hasNextPage ? (
                      action(
                        feed.isFetchingNextPage
                          ? "Loading..."
                          : "Load more posts",
                        () => {
                          if (!feed.isFetchingNextPage)
                            void feed.fetchNextPage();
                        }
                      )
                    ) : (
                      <Text
                        style={{
                          ...font(12, colors.mutedForeground, "700"),
                          paddingVertical: 40,
                          paddingHorizontal: 20,
                          textAlign: "center",
                          opacity: 0.4,
                          textTransform: "uppercase",
                          letterSpacing: 0.6,
                        }}
                      >
                        You've reached the end
                      </Text>
                    )}
                  </View>
                ) : (
                  emptyPosts()
                )}
              </>
            )}
            {page === "explore" && (
              <>
                <View style={card}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 16,
                    }}
                  >
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 8,
                        backgroundColor: "#e8404026",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Flame size={14} color="#e84040" />
                    </View>
                    {label("Trending Now")}
                  </View>
                  {!sidebar.data ? (
                    loadError(sidebar.error, () => sidebar.refetch())
                  ) : !sidebar.data.trendingTags.length ? (
                    <Text
                      style={{
                        ...font(12, colors.mutedForeground),
                        paddingVertical: 40,
                        textAlign: "center",
                      }}
                    >
                      No trends yet
                    </Text>
                  ) : (
                    sidebar.data.trendingTags.slice(0, 10).map((tag) => (
                      <View
                        key={tag.id}
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          paddingVertical: 12,
                          paddingHorizontal: 14,
                          borderRadius: 12,
                        }}
                      >
                        <View style={{ gap: 4 }}>
                          <Text style={font(14, colors.foreground, "700")}>
                            #{tag.name}
                          </Text>
                          <Text style={font(11, colors.mutedForeground)}>
                            {tag.count} discussions
                          </Text>
                        </View>
                        <Text style={font(16, colors.mutedForeground)}>›</Text>
                      </View>
                    ))
                  )}
                </View>
                <View style={card}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 16,
                    }}
                  >
                    <BookOpen size={14} color={colors.primary} />
                    {label("Discover Rooms")}
                  </View>
                  {!rooms.data ? (
                    loadError(rooms.error, () => rooms.refetch())
                  ) : rooms.data.filter(
                      (room) => room.isPublic && !room.isJoined
                    ).length ? (
                    rooms.data
                      .filter((room) => room.isPublic && !room.isJoined)
                      .map((room) => roomRow(room, false))
                  ) : (
                    <Text
                      style={{
                        ...font(12, colors.mutedForeground),
                        paddingVertical: 40,
                        textAlign: "center",
                      }}
                    >
                      No rooms available
                    </Text>
                  )}
                </View>
              </>
            )}
            {page === "rooms" && (
              <>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {action("+ Create Room", () => setRoomModal("create"), true)}
                  {action("Join Room", () => setRoomModal("join"))}
                </View>
                {!rooms.data ? (
                  loadError(rooms.error, () => rooms.refetch())
                ) : (
                  <>
                    {!!rooms.data.filter((room) => room.isJoined).length && (
                      <View style={card}>
                        <View style={{ marginBottom: 12 }}>
                          {label(
                            "My Rooms (" +
                              rooms.data.filter((room) => room.isJoined)
                                .length +
                              ")"
                          )}
                        </View>
                        {rooms.data
                          .filter((room) => room.isJoined)
                          .map((room) => roomRow(room, true))}
                      </View>
                    )}
                    {!!rooms.data.filter(
                      (room) => room.isPublic && !room.isJoined
                    ).length && (
                      <View style={card}>
                        <View style={{ marginBottom: 12 }}>
                          {label("Public Rooms")}
                        </View>
                        {rooms.data
                          .filter((room) => room.isPublic && !room.isJoined)
                          .map((room) => roomRow(room, false))}
                      </View>
                    )}
                  </>
                )}
              </>
            )}
            {page === "notifications" && activity()}
            {page === "saved" &&
              (isGuest ? (
                emptyPosts(true)
              ) : !saved.data ? (
                loadError(saved.error, () => saved.refetch())
              ) : saved.data.pages.some((part) => part.posts.length) ? (
                <View style={{ gap: 12 }}>
                  {saved.data.pages
                    .flatMap((part) => part.posts)
                    .map((post) => (
                      <DesktopSavedPostCard key={post.id} post={post} onOpen={()=>setComments(post.id)}/>
                    ))}
                  {saved.hasNextPage &&
                    action("Load more saved posts", () => {
                      if (!saved.isFetchingNextPage) void saved.fetchNextPage();
                    })}
                </View>
              ) : (
                emptyPosts(true)
              ))}
          </ScrollView>
        </View>
        {!small && (
          <ScrollView
            testID="desktop-social-right"
            style={{
              width: compact ? 280 : 320,
              flexGrow: 0,
              maxHeight: height - 84,
              marginTop: 56,
            }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingVertical: 4,
              gap: 16,
              paddingBottom: SCROLL_BOTTOM_PAD,
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Create community post"
              onPress={() => router.push("/posts/new")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.card + "CC",
              }}
            >
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={font(10, colors.primaryForeground, "700")}>
                  {(user?.name || "You").slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <Text
                numberOfLines={1}
                style={{ ...font(12, colors.mutedForeground), flex: 1 }}
              >
                What's on your mind?
              </Text>
              <ImageIcon size={12} color={colors.mutedForeground} />
              <Video size={12} color={colors.mutedForeground} />
            </Pressable>
            <View
              accessibilityLabel="Website sidebar placeholder"
              style={{
                width: "100%",
                aspectRatio: 16 / 9,
                borderRadius: 16,
                borderWidth: 2,
                borderStyle: "dashed",
                borderColor: colors.border,
                backgroundColor: colors.muted + "33",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: "monospace",
                  fontSize: 11,
                  fontWeight: "700",
                  color: colors.mutedForeground,
                }}
              >
                320×180
              </Text>
            </View>
            <View
              style={{
                padding: 16,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border + "66",
                backgroundColor: colors.card + "B3",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 14,
                  gap: 8,
                }}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 9,
                      backgroundColor: "#6366f11F",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Users size={14} color="#6366f1" />
                  </View>
                  <Text
                    style={{
                      ...font(11, colors.foreground, "800"),
                      letterSpacing: 0.88,
                      textTransform: "uppercase",
                    }}
                  >
                    Suggested for you
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="See all suggestions"
                  onPress={() => setSuggestions(true)}
                >
                  <Text style={font(11, colors.primary, "700")}>See all</Text>
                </Pressable>
              </View>
              {!sidebar.data ? (
                loadError(sidebar.error, () => sidebar.refetch())
              ) : sidebar.data.suggestedUsers.length ? (
                suggestedList()
              ) : (
                <Text
                  style={{
                    ...font(12, colors.mutedForeground),
                    textAlign: "center",
                    paddingVertical: 20,
                  }}
                >
                  No suggestions yet
                </Text>
              )}
            </View>
          </ScrollView>
        )}
      </View>
      {small && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create community post"
          onPress={() => router.push("/posts/new")}
          style={{
            position: "absolute",
            right: 24,
            bottom: insets.bottom + 24,
            width: 48,
            height: 48,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card + "E6",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
        >
          <Plus size={20} color={colors.foreground} />
        </Pressable>
      )}
      <Modal
        visible={drawer}
        transparent
        animationType="fade"
        onRequestClose={() => setDrawer(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,.6)" }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close community menu"
            onPress={() => setDrawer(false)}
            style={{ position: "absolute", inset: 0 }}
          />
          <View
            style={{
              width: Math.min(width * 0.85, 320),
              height: "100%",
              backgroundColor: colors.card,
              borderRightWidth: 1,
              borderColor: colors.border,
              paddingTop: insets.top,
            }}
          >
            <View
              style={{
                paddingVertical: 16,
                paddingHorizontal: 20,
                borderBottomWidth: 1,
                borderColor: colors.border,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={font(16, colors.primary, "900")}>
                OneX Community
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close community menu"
                onPress={() => setDrawer(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.muted,
                }}
              >
                <X size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={{
                paddingVertical: 14,
                paddingHorizontal: 18,
                paddingBottom: SCROLL_BOTTOM_PAD,
              }}
            >
              {sidebarNavigation(true)}
            </ScrollView>
          </View>
        </View>
      </Modal>
      <SocialOverlay
        open={notices || suggestions}
        title={suggestions ? "Suggested for you" : "Notifications"}
        onClose={() => {
          setNotices(false);
          setSuggestions(false);
        }}
      >
        {suggestions ? suggestedList(true) : activity()}
      </SocialOverlay>
      <WebsitePostDetail post={selectedPost} onClose={() => setSelectedPost(null)} />
      <RoomPreviewModal mode={roomModal} onClose={() => setRoomModal(null)} />
      <CommentsSheet postId={comments} onClose={() => setComments(null)} />
    </View>
  );
}
function SocialOverlay({
  open,
  title,
  onClose,
  children,
  scrollRef,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  scrollRef?:React.RefObject<ScrollView|null>;
}) {
  const { colors } = useTheme(),
    { height, width } = useWindowDimensions(),
    insets = useSafeAreaInsets();
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,.75)",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={"Close " + title}
          onPress={onClose}
          style={{ position: "absolute", inset: 0 }}
        />
        <View
          style={{
            width: "100%",
            maxWidth: 640,
            maxHeight: height - insets.top - insets.bottom - 40,
            backgroundColor: colors.card,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              paddingVertical: 16,
              paddingHorizontal: 20,
              borderBottomWidth: 1,
              borderColor: colors.border,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{
                fontFamily: "Arial",
                fontSize: 16,
                fontWeight: "700",
                color: colors.foreground,
              }}
            >
              {title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={"Close " + title}
              onPress={onClose}
              style={{
                padding: 7,
                borderRadius: 10,
                backgroundColor: colors.muted,
              }}
            >
              <X size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>
          <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 12, gap: 12 }}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
function RoomPreviewModal({
  mode,
  onClose,
}: {
  mode: "create" | "join" | null;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const [name, setName] = useState(""),
    [description, setDescription] = useState(""),
    [code, setCode] = useState(""),
    [publicRoom, setPublicRoom] = useState(true),
    [limit, setLimit] = useState("10");
  useEffect(() => {
    setName("");
    setDescription("");
    setCode("");
    setPublicRoom(true);
    setLimit("10");
  }, [mode]);
  const style = {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.muted,
    color: colors.foreground,
    fontFamily: "Arial",
    fontSize: 14,
  };
  return (
    <SocialOverlay
      open={!!mode}
      title={mode === "join" ? "Join Room" : "Create Room"}
      onClose={onClose}
    >
      <View style={{ padding: 10, gap: 14 }}>
        <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
          Read-only preview. No room will be created or joined.
        </Text>
        {mode === "join" ? (
          <TextInput
            accessibilityLabel="Room invite code"
            value={code}
            onChangeText={(value) => setCode(value.toUpperCase())}
            maxLength={8}
            autoCapitalize="characters"
            placeholder="Enter code"
            placeholderTextColor={colors.mutedForeground}
            style={{
              ...style,
              fontSize: 20,
              fontWeight: "700",
              letterSpacing: 6,
              textAlign: "center",
            }}
          />
        ) : (
          <>
            <TextInput
              accessibilityLabel="Room name"
              value={name}
              onChangeText={setName}
              placeholder="Room name"
              placeholderTextColor={colors.mutedForeground}
              style={style}
            />
            <TextInput
              accessibilityLabel="Room description"
              value={description}
              onChangeText={setDescription}
              placeholder="Description (optional)"
              placeholderTextColor={colors.mutedForeground}
              style={style}
            />
            <View
              style={{
                ...style,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ color: colors.foreground, fontSize: 13 }}>
                Public room
              </Text>
              <Switch
                accessibilityLabel="Public room"
                value={publicRoom}
                onValueChange={setPublicRoom}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
                Member limit:
              </Text>
              <TextInput
                accessibilityLabel="Room member limit"
                value={limit}
                onChangeText={setLimit}
                keyboardType="number-pad"
                style={{
                  ...style,
                  width: 70,
                  textAlign: "center",
                  paddingVertical: 6,
                }}
              />
            </View>
          </>
        )}
        <View
          style={{
            flexDirection: "row",
            gap: 8,
            paddingTop: 16,
            borderTopWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={{
              flex: 1,
              padding: 10,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: colors.mutedForeground, fontWeight: "600" }}>
              Cancel
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              mode === "join" ? "Join Room preview" : "Create Room preview"
            }
            onPress={socialReadOnly}
            disabled={mode === "join" ? code.trim().length < 4 : !name.trim()}
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 12,
              backgroundColor: colors.primary,
              alignItems: "center",
              opacity: (mode === "join" ? code.trim().length < 4 : !name.trim())
                ? 0.5
                : 1,
            }}
          >
            <Text
              style={{ color: colors.primaryForeground, fontWeight: "700" }}
            >
              {mode === "join" ? "Join Room" : "Create Room"}
            </Text>
          </Pressable>
        </View>
      </View>
    </SocialOverlay>
  );
}
