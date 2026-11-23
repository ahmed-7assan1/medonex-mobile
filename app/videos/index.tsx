import { useStudentDimensions as useWindowDimensions } from "@/lib/student-viewport";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Clapperboard,
  Clock,
  GraduationCap,
  Home,
  Play,
  Search,
  ShieldCheck,
  Star,
  Video,
  X,
  Youtube,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MobilePageHeader } from "@/components/MobilePageHeader";
import { FadeEdges } from "@/components/FadeEdges";
import { ResourceState } from "@/components/ResourceState";
import { StudentVideoCard } from "@/components/StudentVideoCard";
import { PostCard } from "@/components/social/PostCard";
import { useTheme } from "@/theme/ThemeContext";
import { isFixtureMode } from "@/lib/fixtures";
import { useStudentVideos, type StudentVideo } from "@/lib/videos";
import { useCommunityFeed, type Post } from "@/lib/community";
import { LIST_PERF } from "@/theme/perf";
import { SCROLL_BOTTOM_PAD } from "@/theme/tokens";
type Cell = { key: string; video?: StudentVideo; post?: Post; span: number };
export default function VideosScreen() {
  const { st, colors, fonts } = useTheme();
  const { viewportWidth, width } = useWindowDimensions();
  const tablet = viewportWidth >= 768;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [moduleId, setModuleId] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 500);
    return () => clearTimeout(timer);
  }, [query]);
  const resource = useStudentVideos({ q: debounced, moduleId });
  const feed = useCommunityFeed();
  const guest = isFixtureMode();
  const text = tablet ? colors.foreground : st.text;
  const muted = tablet ? colors.mutedForeground : st.muted;
  const contentWidth = Math.min(width, 1280) - (tablet ? 48 : 32);
  const columns = viewportWidth >= 1280 ? 4 : viewportWidth >= 1024 ? 3 : 2;
  const gap = tablet ? 32 : 12;
  const cardWidth = (contentWidth - gap * (columns - 1)) / columns;
  const items = resource.items?.filter(
    (video) =>
      !query ||
      [video.title, video.channelTitle, video.moduleName]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase())
  );
  const featured = resource.items?.[0];
  const rows = useMemo(() => {
    const cells: Cell[] = [];
    for (const [index, video] of (items || []).entries()) {
      cells.push({ key: video.id, video, span: 1 });
      const post = feed.data?.items[Math.floor(index / 4)];
      if ((index + 1) % 4 === 0 && post)
        cells.push({ key: "voice-" + post.id, post, span: tablet ? 1 : 2 });
    }
    const result: Cell[][] = [];
    let row: Cell[] = [];
    let used = 0;
    for (const cell of cells) {
      if (used + cell.span > columns) {
        result.push(row);
        row = [];
        used = 0;
      }
      row.push(cell);
      used += cell.span;
      if (used === columns) {
        result.push(row);
        row = [];
        used = 0;
      }
    }
    if (row.length) result.push(row);
    return result;
  }, [items, feed.data, columns, tablet]);
  const tag = (Icon: typeof Video, label: string) => (
    <View
      key={label}
      style={{
        flexDirection: "row",
        gap: 6,
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
      }}
    >
      <Icon size={12} color={colors.primary} />
      <Text
        style={{
          fontFamily: fonts.sansBold,
          fontSize: 10,
          letterSpacing: 1,
          color: muted,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
    </View>
  );
  const header = (
    <View>
      {guest && (
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 12,
            lineHeight: 18,
            color: muted,
            marginBottom: 12,
          }}
        >
          Guest preview. Sample videos are local previews, not playable
          recordings.
        </Text>
      )}
      {tablet && (
        <View
          style={{
            flexDirection: width >= 1024 ? "row" : "column",
            gap: 40,
            alignItems: "flex-end",
            borderBottomWidth: 1,
            borderColor: colors.border,
            paddingBottom: 40,
            marginBottom: 40,
          }}
        >
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                alignItems: "center",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: colors.border,
                alignSelf: "flex-start",
                marginBottom: 20,
              }}
            >
              <Video size={14} color={colors.primary} />
              <Text
                style={{
                  fontSize: 10,
                  letterSpacing: 2,
                  fontFamily: fonts.sansBold,
                  color: colors.primary,
                }}
              >
                VISUAL LEARNING LIBRARY
              </Text>
            </View>
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 72,
                lineHeight: 76,
                color: text,
              }}
            >
              Learn medicine,{"\n"}frame by frame.
            </Text>
            <Text
              style={{
                fontSize: 16,
                lineHeight: 24,
                color: muted,
                fontFamily: fonts.sansMedium,
                marginTop: 16,
                maxWidth: 448,
              }}
            >
              Curated medical lectures from top educators worldwide. Surgical
              recordings, clinical breakdowns, and exam-focused reviews.
            </Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 10,
                marginTop: 28,
              }}
            >
              {tag(ShieldCheck, "Curriculum-aligned")}
              {tag(Home, resource.instructors.length + " top educators")}
              {tag(Clock, "Watch on any device")}
            </View>
          </View>
          {viewportWidth >= 1024 && (
            <View
              style={{
                width: 420,
                borderRadius: 24,
                padding: 8,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open featured lecture"
                disabled={!featured}
                onPress={() =>
                  router.push({
                    pathname: "/videos/reels",
                    params: { v: featured!.id },
                  } as any)
                }
                style={{
                  aspectRatio: 16 / 10,
                  backgroundColor: colors.muted,
                  borderRadius: 18,
                  overflow: "hidden",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {featured?.thumbnail ? (
                  <Image
                    source={{ uri: featured.thumbnail }}
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                    }}
                  />
                ) : (
                  <Clapperboard size={40} color={muted} />
                )}
                <LinearGradient
                  colors={["transparent", "#0008"]}
                  style={{ position: "absolute", inset: 0 }}
                />
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: colors.background + "CC",
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Play
                    size={28}
                    color={colors.primary}
                    fill={colors.primary}
                  />
                </View>
                <View
                  style={{
                    position: "absolute",
                    left: 12,
                    right: 12,
                    bottom: 12,
                    flexDirection: "row",
                    gap: 8,
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                      minWidth: 0,
                      borderRadius: 20,
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                      backgroundColor: "#0008",
                      flexDirection: "row",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <GraduationCap size={14} color="#FFFFFFB3" />
                    <Text
                      numberOfLines={1}
                      style={{
                        flex: 1,
                        fontFamily: fonts.sansBold,
                        fontSize: 11,
                        color: "#fff",
                      }}
                    >
                      {featured?.title || "Featured lecture"}
                    </Text>
                  </View>
                  <Text
                    style={{
                      borderRadius: 20,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      backgroundColor: "#0008",
                      fontFamily: fonts.sansBold,
                      fontSize: 9,
                      letterSpacing: 1,
                      color: "#FFFFFFCC",
                    }}
                  >
                    FEATURED
                  </Text>
                </View>
              </Pressable>
              <View
                style={{
                  flexDirection: "row",
                  gap: 8,
                  padding: 8,
                  marginTop: 4,
                }}
              >
                {tag(Star, (resource.items?.length || 0) + " lectures")}
                {tag(Youtube, "HD + Reels")}
              </View>
            </View>
          )}
        </View>
      )}
      <View
        style={{
          flexDirection: viewportWidth >= 1024 ? "row" : "column",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <View
          style={{
            height: tablet ? 40 : 48,
            width: viewportWidth >= 1024 ? 480 : "100%",
            borderRadius: tablet ? 24 : 16,
            paddingHorizontal: 16,
            borderWidth: 1,
            borderColor: st.border,
            backgroundColor: st.surface,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Search size={16} color={muted} />
          <TextInput
            accessibilityLabel="Search video lectures"
            value={query}
            onChangeText={setQuery}
            placeholder="Search lecture titles..."
            placeholderTextColor={muted}
            style={{
              flex: 1,
              minWidth: 0,
              height: tablet ? 38 : 46,
              fontSize: 14,
              fontFamily: fonts.sans,
              color: text,
            }}
            returnKeyType="search"
            onSubmitEditing={() => setDebounced(query.trim())}
          />
          {resource.isFetching && !!query && (
            <ActivityIndicator size="small" color={muted} />
          )}{" "}
          {!!query && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => {
                setQuery("");
                setDebounced("");
              }}
            >
              <X size={16} color={muted} />
            </Pressable>
          )}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
        >
          {[{ id: "", name: "All" }, ...resource.modules.slice(0, 8)].map(
            (module) => (
              <Pressable
                key={module.id}
                accessibilityRole="button"
                aria-pressed={moduleId === module.id}
                onPress={() => setModuleId(module.id)}
                style={{
                  height: 36,
                  paddingHorizontal: 16,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor:
                    moduleId === module.id ? "transparent" : st.border,
                  backgroundColor:
                    moduleId === module.id ? st.pillFill : st.surface,
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: fonts.sansBold,
                    color: moduleId === module.id ? st.pillText : muted,
                  }}
                >
                  {module.name}
                </Text>
              </Pressable>
            )
          )}
        </ScrollView>
      </View>
      {resource.instructors.length > 0 && (
        <View style={{ marginBottom: 32 }}>
          <View
            style={{
              marginBottom: tablet ? 24 : 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            {tablet && <Star size={16} color={colors.primary} />}
            <View>
              {!tablet && (
                <Text
                  style={{
                    fontSize: 11,
                    letterSpacing: 2,
                    color: muted,
                    fontFamily: fonts.sansBold,
                    textTransform: "uppercase",
                  }}
                >
                  Media
                </Text>
              )}
              <Text
                style={{
                  fontSize: tablet ? 11 : 22,
                  lineHeight: tablet ? 16 : 28,
                  letterSpacing: tablet ? 2 : 0,
                  color: tablet ? muted : text,
                  fontFamily: fonts.sansBold,
                }}
              >
                {tablet ? "TOP EDUCATORS" : "Top Educators"}
              </Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 24, paddingBottom: 8 }}
          >
            {resource.instructors.map((instructor) => (
              <Pressable
                key={instructor.id}
                accessibilityRole="button"
                accessibilityLabel={"Open educator " + instructor.name}
                onPress={() =>
                  router.push(
                    ("/channels/" +
                      encodeURIComponent(instructor.youtubeId)) as never
                  )
                }
                style={{ alignItems: "center", gap: 12, width: 80 }}
              >
                <View
                  style={{
                    height: 80,
                    width: 80,
                    borderRadius: 24,
                    padding: 4,
                    borderWidth: 1,
                    borderColor: st.border,
                    backgroundColor: st.surface,
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                      borderRadius: 16,
                      backgroundColor: colors.muted,
                      overflow: "hidden",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {instructor.thumbnail ? (
                      <Image
                        source={{ uri: instructor.thumbnail }}
                        style={{ height: "100%", width: "100%" }}
                      />
                    ) : (
                      <Text
                        style={{
                          fontSize: 28,
                          fontFamily: fonts.sansBold,
                          color: text,
                        }}
                      >
                        {instructor.name[0]}
                      </Text>
                    )}
                  </View>
                </View>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 10,
                    letterSpacing: 1,
                    fontFamily: fonts.sansBold,
                    textTransform: "uppercase",
                    color: muted,
                  }}
                >
                  {instructor.name.split(" ")[0]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
      <View style={{ marginBottom: tablet ? 32 : 20 }}>
        {!tablet && (
          <Text
            style={{
              fontSize: 11,
              letterSpacing: 2,
              color: muted,
              fontFamily: fonts.sansBold,
              textTransform: "uppercase",
            }}
          >
            Media Sector
          </Text>
        )}
        <Text
          style={{
            fontFamily: fonts.sansBold,
            fontSize: tablet ? 30 : 22,
            lineHeight: tablet ? 37 : 28,
            color: text,
          }}
        >
          {query
            ? 'Results for "' + query + '"'
            : moduleId
            ? (resource.modules.find((module) => module.id === moduleId)
                ?.name || "Module") + " Lectures"
            : "Featured Lectures"}
        </Text>
      </View>
    </View>
  );
  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top,
        backgroundColor: tablet ? colors.background : st.bg,
      }}
    >
      <View style={{ zIndex: 10 }}>
        <MobilePageHeader title="Videos" />
      </View>
      <FlatList
        key={"grid-" + columns}
        data={rows}
        keyExtractor={(row) => row.map((cell) => cell.key).join("|")}
        renderItem={({ item: row }) => (
          <View style={{ flexDirection: "row", gap, marginBottom: gap }}>
            {row.map((cell) =>
              cell.video ? (
                <StudentVideoCard
                  key={cell.key}
                  video={cell.video}
                  width={cardWidth}
                />
              ) : (
                <View
                  key={cell.key}
                  style={{
                    width: cardWidth * cell.span + gap * (cell.span - 1),
                    padding: 8,
                    borderWidth: 1,
                    borderColor: st.border,
                    borderRadius: 16,
                    overflow: "hidden",
                    backgroundColor: st.surface,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      color: colors.primary,
                      fontFamily: fonts.sansBold,
                      letterSpacing: 2,
                      paddingHorizontal: 20,
                      paddingTop: 16,
                      paddingBottom: 8,
                    }}
                  >
                    STUDENT VOICE
                  </Text>
                  <PostCard post={cell.post!} />
                </View>
              )
            )}
          </View>
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={
          !resource.items ? (
            resource.error ? (
              <View style={{ minHeight: 300 }}>
                <ResourceState
                  error={resource.error}
                  onRetry={() => resource.refetch()}
                  title="Videos"
                />
              </View>
            ) : (
              <ActivityIndicator color={muted} style={{ margin: 50 }} />
            )
          ) : (
            <View
              style={{
                paddingVertical: 80,
                paddingHorizontal: 16,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: st.border,
                backgroundColor: st.surface,
                alignItems: "center",
                gap: 12,
              }}
            >
              <Clapperboard size={28} color={muted} />
              <Text
                style={{
                  fontFamily: fonts.sansBold,
                  fontSize: 14,
                  color: text,
                }}
              >
                No videos found
              </Text>
              <Text
                style={{ fontSize: 12, color: muted, fontFamily: fonts.sans }}
              >
                Try a different search or subject.
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          resource.items && resource.hasNextPage ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => resource.fetchNextPage()}
              disabled={resource.isFetchingNextPage}
              style={{ padding: 20, alignItems: "center" }}
            >
              {resource.isFetchingNextPage ? (
                <ActivityIndicator color={muted} />
              ) : (
                <Text
                  style={{
                    fontFamily: fonts.sansSemiBold,
                    fontSize: 13,
                    color: text,
                  }}
                >
                  Load more lectures
                </Text>
              )}
            </Pressable>
          ) : resource.items?.length ? (
            <Text
              style={{
                marginTop: 40,
                fontFamily: fonts.sansBold,
                fontSize: 10,
                letterSpacing: 3,
                color: muted,
                opacity: 0.3,
                textAlign: "center",
              }}
            >
              END OF CLINICAL CURRICULUM
            </Text>
          ) : null
        }
        onEndReached={() => {
          if (resource.hasNextPage && !resource.isFetchingNextPage)
            void resource.fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        {...LIST_PERF}
        contentContainerStyle={{
          width: "100%",
          maxWidth: 1280,
          alignSelf: "center",
          paddingHorizontal: tablet ? 24 : 16,
          paddingTop: tablet ? 40 : 16,
          paddingBottom: SCROLL_BOTTOM_PAD + insets.bottom,
        }}
      />
      <FadeEdges
        top={false}
        bottom
        color={tablet ? colors.background : st.bg}
      />
    </View>
  );
}
