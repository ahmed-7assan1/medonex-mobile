import React, { useState } from "react";
import { Alert, Pressable, Share, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Award, BarChart3, BookOpen, Lock } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/ThemeContext";
import { useStudentDimensions } from "@/lib/student-viewport";
import {
  FIXTURE_PROFILE_POSTS,
  isFixtureMode,
  type FixtureProfileUser,
} from "@/lib/fixtures";
import { useSavedPosts } from "@/lib/profile";
import { useModulesCatalog } from "@/lib/modules";
import type { Post } from "@/lib/community";
import { PostCard } from "@/components/social/PostCard";
import { ProfilePhone } from "./ProfilePhone";
import { ProfileDesktop, profilePalette } from "./ProfileDesktop";
import { ProfilePostsGrid } from "./ProfilePostsGrid";
type TabId = "posts" | "quizzes" | "categories" | "saved" | "achievements";
/** The website uses its flat swipe profile on phones and luxury profile at768+. */
export function ProfileView({
  user,
  isOwn,
  posts = [],
  avatarUrl,
  privateForViewer = false,
  initialFollowing = false,
}: {
  user: FixtureProfileUser;
  isOwn: boolean;
  posts?: Post[];
  avatarUrl?: string | null;
  privateForViewer?: boolean;
  initialFollowing?: boolean;
}) {
  const { t } = useTranslation();
  const { st, fonts, isDark } = useTheme();
  const { viewportWidth, width } = useStudentDimensions();
  const desktop = viewportWidth >= 768;
  const palette = profilePalette(isDark);
  const p = desktop
    ? palette
    : {
        ...palette,
        text: st.text,
        muted: st.muted,
        surface: st.surface,
        border: st.border,
      };
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("posts");
  const [following, setFollowing] = useState(initialFollowing);
  const saved = useSavedPosts(isOwn && tab === "saved");
  const catalog = useModulesCatalog(isOwn && tab === "categories");
  const readOnly = () =>
    Alert.alert(
      "Read-only preview",
      "Use the website to change your account. No changes have been saved."
    );
  const onFollow = () =>
    isFixtureMode() ? setFollowing((value) => !value) : readOnly();
  const shareProfile = () => {
    if (isFixtureMode())
      Alert.alert("Guest preview", "Sample profiles cannot be shared.");
    else
      void Share.share({
        message: `https://www.medonex.me/${
          user.handle
            ? "@" + encodeURIComponent(user.handle)
            : "profile/u/" + encodeURIComponent(user.id)
        }`,
      }).catch(() => {});
  };
  const tabs: { id: TabId; label: string }[] = [
    { id: "posts", label: t("profile.posts") },
    { id: "quizzes", label: t("profile.quizzes") },
    ...(desktop ? [{ id: "categories" as const, label: "Categories" }] : []),
    ...(isOwn ? [{ id: "saved" as const, label: t("profile.saved") }] : []),
    { id: "achievements", label: t("profile.achievements") },
  ];
  const empty = (text: string) => (
    <View style={{ padding: 32, alignItems: "center", gap: 12 }}>
      <Text
        style={{
          fontSize: 13,
          lineHeight: 21,
          color: p.muted,
          fontFamily: fonts.sans,
          textAlign: "center",
        }}
      >
        {text}
      </Text>
    </View>
  );
  const postList = (items: Post[]) =>
    desktop ? (
      <ProfilePostsGrid posts={items} />
    ) : (
      items.map((post) => <PostCard key={post.id} post={post} />)
    );
  const renderPane = (id: TabId) => {
    if (privateForViewer) return empty("This profile is private.");
    if (id === "posts")
      return posts.length ? postList(posts) : empty("No visible posts.");
    if (id === "quizzes")
      return !isOwn && !isFixtureMode() ? (
        empty("Quiz history is not shared on this profile.")
      ) : user.quizHistory.length ? (
        <View style={{ gap: desktop ? 12 : 0 }}>
          {user.quizHistory.map((quiz) => {
            const color =
              quiz.score >= 80
                ? p.emerald
                : quiz.score >= 65
                ? p.gold
                : "#ff6b81";
            return (
              <Pressable
                key={quiz.id}
                accessibilityRole="button"
                disabled={!isOwn}
                onPress={() =>
                  router.push(
                    ("/quiz/attempt/" + encodeURIComponent(quiz.id)) as never
                  )
                }
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: desktop ? 16 : 12,
                  padding: desktop ? 16 : 12,
                  paddingHorizontal: 16,
                  borderRadius: desktop ? 16 : 0,
                  borderWidth: desktop ? 1 : 0,
                  borderBottomWidth: 1,
                  borderColor: p.border,
                  backgroundColor: desktop ? p.surface : "transparent",
                }}
              >
                {desktop && (
                  <View
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 14,
                      backgroundColor: p.emerald + "1f",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <BarChart3 size={22} color={p.emerald} />
                  </View>
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: desktop ? 14 : 15,
                      color: p.text,
                      fontFamily: fonts.sansBold,
                    }}
                  >
                    {quiz.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: desktop ? 11.5 : 13,
                      color: p.muted,
                      fontFamily: fonts.sans,
                      marginTop: 4,
                    }}
                  >
                    {quiz.date}
                  </Text>
                  <View
                    style={{
                      height: desktop ? 5 : 4,
                      borderRadius: 4,
                      overflow: "hidden",
                      marginTop: 10,
                      backgroundColor: desktop ? p.surface2 : p.border,
                    }}
                  >
                    <View
                      style={{
                        width: `${Math.max(0, Math.min(100, quiz.score))}%`,
                        height: "100%",
                        backgroundColor: color,
                      }}
                    />
                  </View>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text
                    style={{
                      fontFamily: fonts.sansBold,
                      fontSize: desktop ? 18 : 15,
                      color,
                    }}
                  >
                    {quiz.score}%
                  </Text>
                  {desktop && (
                    <Text
                      style={{
                        fontSize: 10.5,
                        color: p.muted,
                        fontFamily: fonts.sansSemiBold,
                        marginTop: 2,
                      }}
                    >
                      Score
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : (
        empty("No completed quizzes.")
      );
    if (id === "categories") {
      if (!isOwn)
        return empty(
          "Question categories and answer accuracy are not shared on this profile."
        );
      if (catalog.isLoading)
        return empty("Loading your question categories...");
      if (catalog.error)
        return (
          <Pressable
            accessibilityRole="button"
            onPress={() => catalog.refetch()}
          >
            {empty("Categories could not load. Tap to retry.")}
          </Pressable>
        );
      const modules = catalog.data?.view.sortedByLectures || [];
      return (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {modules.map((module, index) => {
            const color = [
              "#5fb0ff",
              "#3ee6a8",
              "#e8c777",
              "#ff6b81",
              "#a78bfa",
              "#ff8a3d",
            ][index % 6];
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={"Open " + module.name}
                onPress={() =>
                  router.push(
                    ("/modules/" + encodeURIComponent(module.id)) as never
                  )
                }
                key={module.id}
                style={{
                  width:
                    (Math.min(width, 1080) -
                      (viewportWidth >= 1024 ? 48 : 32) -
                      12) /
                    2,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: p.border,
                  backgroundColor: p.surface,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: color + "1f",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <BookOpen size={20} color={color} />
                  </View>
                  <Text
                    style={{
                      color: p.muted,
                      fontSize: 11,
                      fontFamily: fonts.sansBold,
                    }}
                  >
                    {module.questionsCount} questions
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: fonts.sansBold,
                    color: p.text,
                    marginTop: 12,
                  }}
                >
                  {module.name}
                </Text>
                <Text
                  style={{
                    fontSize: 11.5,
                    fontFamily: fonts.sansSemiBold,
                    color: p.muted,
                    marginTop: 3,
                  }}
                >
                  Answer accuracy: not available
                </Text>
                <View
                  style={{
                    height: 5,
                    borderRadius: 4,
                    backgroundColor: p.surface2,
                    marginTop: 10,
                  }}
                />
              </Pressable>
            );
          })}
          {modules.length === 0 && empty("No question categories available.")}
        </View>
      );
    }
    if (id === "saved") {
      const items = (
        isFixtureMode()
          ? (FIXTURE_PROFILE_POSTS[user.id] || []).filter(
              (post) => post.isSaved
            )
          : saved.data?.pages.flatMap((page) => page.posts) || []
      ) as Post[];
      return (
        <View style={{ gap: 16 }}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/profile/saved-questions")}
            style={{
              flexDirection: "row",
              gap: 12,
              alignItems: "center",
              padding: 16,
              borderRadius: desktop ? 16 : 0,
              borderWidth: desktop ? 1 : 0,
              borderBottomWidth: 1,
              borderColor: p.border,
              backgroundColor: desktop ? p.surface : "transparent",
            }}
          >
            <BookOpen size={20} color={p.gold} />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  color: p.text,
                  fontFamily: fonts.sansBold,
                }}
              >
                Saved questions
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: p.muted,
                  fontFamily: fonts.sans,
                  marginTop: 3,
                }}
              >
                Review your bookmarked questions
              </Text>
            </View>
          </Pressable>
          {items.length > 0
            ? postList(items)
            : saved.isLoading
            ? empty("Loading saved posts...")
            : !saved.error
            ? empty("No saved posts.")
            : null}
          {!!saved.error && (
            <Pressable
              accessibilityRole="button"
              onPress={() => saved.refetch()}
            >
              {empty("Saved posts could not load. Tap to retry.")}
            </Pressable>
          )}
          {saved.hasNextPage && (
            <Pressable
              accessibilityRole="button"
              disabled={saved.isFetchingNextPage}
              onPress={() => saved.fetchNextPage()}
            >
              {empty(saved.isFetchingNextPage ? "Loading..." : "Load more")}
            </Pressable>
          )}
        </View>
      );
    }
    if (id === "achievements")
      return user.achievements.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {user.achievements.map((item) => (
            <View
              key={item.id}
              style={{
                width: desktop
                  ? (Math.min(width, 1080) -
                      (viewportWidth >= 1024 ? 48 : 32) -
                      36) /
                    4
                  : (width - 44) / 2,
                padding: 18,
                alignItems: "center",
                borderWidth: 1,
                borderColor: p.border,
                borderRadius: 16,
                backgroundColor: p.surface,
                opacity: item.unlocked ? 1 : 0.45,
              }}
            >
              {item.unlocked ? (
                <Award size={26} color={p.gold} />
              ) : (
                <Lock size={24} color={p.muted} />
              )}
              <Text
                style={{
                  fontSize: 14,
                  color: p.text,
                  fontFamily: fonts.sansBold,
                  marginTop: 10,
                  textAlign: "center",
                }}
              >
                {item.title}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  lineHeight: 17,
                  color: p.muted,
                  fontFamily: fonts.sans,
                  marginTop: 4,
                  textAlign: "center",
                }}
              >
                {item.desc}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        empty("Achievement data is not available.")
      );
    return null;
  };
  if (!desktop)
    return (
      <ProfilePhone
        user={user}
        avatarUrl={avatarUrl}
        isOwn={isOwn}
        privateForViewer={privateForViewer}
        following={following}
        onFollow={onFollow}
        onShare={shareProfile}
        onEdit={readOnly}
        panels={tabs.map((item) => ({
          ...item,
          body: <View style={{ paddingTop: 16 }}>{renderPane(item.id)}</View>,
        }))}
        activeId={tab}
        onTabChange={(value) => setTab(value as TabId)}
      />
    );
  return (
    <ProfileDesktop
      user={user}
      avatarUrl={avatarUrl}
      isOwn={isOwn}
      isPrivate={privateForViewer}
      following={following}
      onFollow={onFollow}
      tabs={tabs}
      active={tab}
      onTab={(value) => setTab(value as TabId)}
    >
      {renderPane(tab)}
    </ProfileDesktop>
  );
}
