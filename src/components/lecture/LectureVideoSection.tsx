import { useQuery } from "@tanstack/react-query";
import { apiV1 } from "@/lib/api";
import { useLiveEnabled } from "@/lib/query-mode";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  type TextStyle,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BookOpen,
  ChevronLeft,
  GraduationCap,
  Play,
  Share2,
  Sparkles,
  ThumbsUp,
  Video,
} from "lucide-react-native";
import { useTheme } from "@/theme/ThemeContext";
import { useStudentDimensions } from "@/lib/student-viewport";
import { useLecture } from "@/lib/lecture";
import { lectureTitleCase } from "@/lib/lecture-format";
import { isFixtureMode } from "@/lib/fixtures";
import { SCROLL_BOTTOM_PAD } from "@/theme/tokens";
import { ResourceState } from "@/components/ResourceState";
import { FadeEdges } from "@/components/FadeEdges";
import { FloatingStudentHeader } from "@/components/FloatingStudentHeader";
import { StudentOverlay } from "@/components/StudentOverlay";
import {LectureScrollContext,LectureSticky,LectureStickyRegion} from './LectureSticky';
import { LectureVideoPlayer } from "./LectureVideoPlayer";
const youtubeId = (url?: string) => {
  try {
    const u = new URL(url || "");
    if (u.protocol !== "https:") return null;
    if (u.hostname === "youtu.be")
      return u.pathname.slice(1).match(/^[A-Za-z0-9_-]{11}$/)?.[0] ?? null;
    if (
      ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(u.hostname)
    ) {
      const id = u.searchParams.get("v") || u.pathname.split("/")[2];
      return /^[A-Za-z0-9_-]{11}$/.test(id || "") ? id : null;
    }
  } catch {}
  return null;
};
function VideoBody({embedded,children,contentContainerStyle,scrollY,contentRef,...props}:any){if(embedded)return <View style={contentContainerStyle}>{children}</View>;return <Animated.ScrollView onScroll={Animated.event([{nativeEvent:{contentOffset:{y:scrollY}}}],{useNativeDriver:Platform.OS!=='web'})} scrollEventThrottle={16} {...props}><View ref={contentRef} collapsable={false} style={contentContainerStyle}>{children}</View></Animated.ScrollView>}
export function LectureVideoSection({
  variant = "studio",
  embedded = false,
}: {
  variant?: "studio" | "youtube";
  embedded?: boolean;
}) {
  const {
      id: moduleId,
      lectureId,
      v,
      video,
    } = useLocalSearchParams<{ id: string; lectureId: string; v?: string;video?:string }>(),
    resource = useLecture(lectureId ?? ""),
    lecture = resource.data,
    { colors, isDark } = useTheme(),
    { viewportWidth, viewportHeight, width } = useStudentDimensions(),
    insets = useSafeAreaInsets(),
    router = useRouter();
  const [activeId, setActiveId] = useState((embedded?video:v) ?? ""),
    [expanded, setExpanded] = useState(false),
    [playerWidth, setPlayerWidth] = useState(width);
  const scrollY=useRef(new Animated.Value(0)).current,scrollContent=useRef<View>(null);
  const ScrollShell=({children}:{children:React.ReactNode})=>embedded?<>{children}</>:<LectureScrollContext.Provider value={{scrollY,contentRef:scrollContent,revision:`${viewportWidth}:${lecture?.videos.length??0}`}}>{children}</LectureScrollContext.Provider>;
  useEffect(() => {
    setActiveId((embedded?video:v) ?? "");
    setExpanded(false);
  }, [lectureId, v, video, embedded]);
  const live = useLiveEnabled(),
    candidate =
      lecture?.videos.find((item) => item.id === activeId) ??
      lecture?.videos[0],
    ytId = youtubeId(candidate?.url),
    metadata = useQuery({
      queryKey: ["lecture-youtube-metadata", ytId],
      queryFn: () =>
        apiV1.get<{
          name?: string;
          thumbnail?: string;
          description?: string;
          viewCount?: string;
          likeCount?: string;
        }>(`/youtube/stats?videoId=${encodeURIComponent(ytId ?? "")}`),
      enabled: live && !!ytId,
      retry: false,
    }),
    meta = metadata.data;
  const desktop = viewportWidth >= 768,
    wide = viewportWidth >= 1024,
    studio = variant === "studio",
    bg = studio ? "#07080f" : isDark ? "#0f0f0f" : "#fafafa",
    fg = studio ? "#ffffff" : isDark ? "#f1f1f1" : "#0f0f0f",
    muted = studio ? "#4a4b6a" : isDark ? "#aaaaaa" : "#606060",
    surface = studio ? "#0c0d18" : isDark ? "#272727" : "#e9e9e9";
  const f = (
    size: number,
    color = fg,
    weight: TextStyle["fontWeight"] = "400",
    lineHeight = size * 1.65
  ): TextStyle => ({
    fontFamily: Platform.OS === "android" ? "sans-serif" : "Arial",
    fontSize: size,
    color,
    fontWeight: weight,
    lineHeight,
    letterSpacing: -0.15,
  });
  if (!lecture)
    return (
      <ResourceState
        title="Lecture videos"
        error={resource.error}
        onRetry={() => resource.refetch()}
      />
    );
  if (!lecture.subject || lecture.subject.module.id !== moduleId)
    return (
      <ResourceState
        title="Lecture videos"
        notFound
        onRetry={() => resource.refetch()}
      />
    );
  const hub = `/modules/${encodeURIComponent(
      moduleId
    )}/lectures/${encodeURIComponent(lectureId)}`,
    back = () => router.push(hub as never),
    videos = lecture.videos,
    active = videos.find((item) => item.id === activeId) ?? videos[0],
    index = Math.max(
      0,
      videos.findIndex((item) => item.id === active?.id)
    ),
    progress = videos.length
      ? Math.round(((index + 1) / videos.length) * 100)
      : 0,
    title = lectureTitleCase(lecture.title),
    blocked = (action: string) =>
      Alert.alert(
        "Read-only version",
        action + " is not sent from this version."
      );
  const openSource = () => {
    if (isFixtureMode()) {
      Alert.alert("Guest preview", "Sample videos stay on this device.");
      return;
    }
    try {
      const u = new URL(active?.url ?? "");
      if (u.protocol !== "https:") throw Error();
      void Linking.openURL(u.href).catch(() =>
        Alert.alert("Video unavailable", "The source could not open.")
      );
    } catch {
      Alert.alert(
        "Video unavailable",
        "This video has no supported source link."
      );
    }
  };
  const circle = (
    label: string,
    action: () => void,
    child: React.ReactNode
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={action}
      style={{
        padding: 8,
        borderRadius: 99,
        backgroundColor: studio ? "#13142a" : surface,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {child}
    </Pressable>
  );
  const floating =
    videos.length > 0 && !wide && !embedded ? (
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 24 + insets.bottom,
          alignItems: "center",
          zIndex: 50,
        }}
      >
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Lecture Sections"
          onPress={back}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 24,
            paddingVertical: 10,
            borderRadius: 99,
            borderWidth: studio ? 1 : 0,
            borderColor: "#1a1b2e",
            backgroundColor: studio ? "#0c0d18E6" : bg + "E6",
          }}
        >
          <ChevronLeft size={16} color={studio ? "#c7d2fe" : fg} />
          <Text style={f(12, studio ? "#c7d2fe" : fg, "700", 16)}>
            Lecture Sections
          </Text>
        </Pressable>
      </View>
    ) : null;
  const playlist = (
    <View
      testID="lecture-video-playlist"
      style={{
        width: wide
          ? studio
            ? viewportWidth >= 1280
              ? 420
              : 380
            : 402
          : "100%",
        minWidth: 0,
        borderRadius: studio ? 32 : 0,
        borderWidth: studio ? 1 : 0,
        borderColor: "#1a1b2e",
        backgroundColor: studio ? "#0c0d1899" : "transparent",
        overflow: "hidden",
      }}
    >
      {studio ? (
        <View
          style={{
            padding: 24,
            borderBottomWidth: 1,
            borderColor: "#1a1b2e",
            backgroundColor: "#13142a66",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                ...f(12, "#4f46e5", "800", 19.8),
                textTransform: "uppercase",
                letterSpacing: 3,
              }}
            >
              Curriculum Hub
            </Text>
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 99,
                borderWidth: 1,
                borderColor: "#4f46e54D",
                backgroundColor: "#1e1b4b",
              }}
            >
              <Text style={f(10, "#818cf8", "900", 16.5)}>STUDIO</Text>
            </View>
          </View>
          <Text
            style={{ ...f(18, "#ffffff", "800", 29.7), letterSpacing: -0.45 }}
          >
            Lecture Series
          </Text>
          <View
            style={{
              marginTop: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <BookOpen size={14} color={muted} />
            <Text style={{ ...f(11, muted, "700", 18.15), flex: 1 }}>
              {title}
            </Text>
          </View>
        </View>
      ) : (
        <View
          style={{
            marginBottom: 8,
            paddingHorizontal: 4,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              flex: 1,
            }}
          >
            <BookOpen size={14} color={muted} />
            <Text style={{ ...f(12, muted, "400", 16), flex: 1 }}>{title}</Text>
          </View>
          <Text
            style={{
              ...f(10, muted, "600", 16.5),
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {videos.length} videos
          </Text>
        </View>
      )}
      <ScrollView
        nestedScrollEnabled
        style={studio ? { maxHeight: Math.max(200, viewportHeight - 450) } : undefined}
        contentContainerStyle={{
          padding: studio ? (desktop ? 12 : 8) : 0,
          gap: studio ? (desktop ? 12 : 8) : 8,
        }}
      >
        {videos.map((video, i) => {
          const selected = active?.id === video.id,
            yt = youtubeId(video.url),
            thumbW = studio ? (viewportWidth >= 640 ? 100 : 80) : 168,
            thumbH = studio ? (viewportWidth >= 640 ? 60 : 48) : 94.5;
          return (
            <Pressable
              key={video.id}
              accessibilityRole="button"
              accessibilityLabel={"Play video " + video.title}
              accessibilityState={{ selected }}
              onPress={() => {
                setActiveId(video.id);
                setExpanded(false);
              }}
              style={{
                flexDirection: "row",
                gap: studio ? 12 : 8,
                padding: studio ? (desktop ? 12 : 10) : 6,
                borderRadius: studio ? (desktop ? 16 : 12) : 12,
                borderWidth: studio && selected ? 1 : 0,
                borderColor: "#4f46e54D",
                backgroundColor: selected
                  ? studio
                    ? "#4f46e51A"
                    : surface
                  : "transparent",
                overflow: "hidden",
              }}
            >
              {studio && selected && (
                <View
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    backgroundColor: "#4f46e5",
                  }}
                />
              )}
              <View
                style={{
                  width: thumbW,
                  height: thumbH,
                  borderRadius: studio && desktop ? 12 : 8,
                  backgroundColor: studio ? "#13142a" : surface,
                  overflow: "hidden",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {yt ? (
                  <Image
                    source={{
                      uri: `https://i.ytimg.com/vi/${yt}/mqdefault.jpg`,
                    }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                ) : (
                  <Video size={studio ? 20 : 24} color={muted} />
                )}{" "}
                {selected && (
                  <View
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: 0,
                      bottom: 0,
                      backgroundColor: studio ? "#4f46e566" : "#00000080",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 3,
                        alignItems: "flex-end",
                        height: 14,
                      }}
                    >
                      {[7, 14, 10].map((h, j) => (
                        <View
                          key={j}
                          style={{
                            width: 3,
                            height: h,
                            borderRadius: 2,
                            backgroundColor: "#fff",
                          }}
                        />
                      ))}
                    </View>
                  </View>
                )}
                {!studio && (
                  <View
                    style={{
                      position: "absolute",
                      bottom: 4,
                      right: 4,
                      paddingHorizontal: 4,
                      paddingVertical: 2,
                      borderRadius: 4,
                      backgroundColor: "#000000D9",
                    }}
                  >
                    <Text style={f(11, "#ffffff", "500", 18.15)}>
                      {String(i + 1).padStart(2, "0")}
                    </Text>
                  </View>
                )}
              </View>
              <View
                style={{
                  flex: 1,
                  minWidth: 0,
                  paddingTop: studio ? 0 : 2,
                  paddingRight: studio ? 0 : 4,
                  justifyContent: studio ? "center" : "flex-start",
                }}
              >
                <Text
                  numberOfLines={2}
                  style={f(
                    studio ? (desktop ? 13 : 12) : 14,
                    studio ? (selected ? "#818cf8" : "#c7d2fe") : fg,
                    studio ? "700" : "500",
                    studio ? (desktop ? 16.9 : 15.6) : 19.25
                  )}
                >
                  {video.title}
                </Text>
                <Text
                  style={{
                    ...f(
                      studio ? (desktop ? 10 : 9) : 12,
                      muted,
                      studio ? "700" : "400",
                      studio ? 16.5 : 16
                    ),
                    marginTop: 4,
                    textTransform: studio ? "uppercase" : "none",
                    letterSpacing: studio ? 0.5 : -0.15,
                  }}
                >
                  {studio
                    ? `${String(i + 1).padStart(2, "0")}  •  ${
                        video.sourceType || "Video"
                      }`
                    : video.sourceType || "Video"}
                </Text>
              </View>
              {!studio && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={"Share " + video.title}
                  onPress={() => blocked("A video share")}
                  style={{
                    width: 24,
                    height: 24,
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 4,
                  }}
                >
                  <Share2 size={16} color={muted} />
                </Pressable>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
      {!studio && !embedded && (
        <Pressable
          accessibilityRole="link"
          onPress={back}
          style={{
            marginTop: 24,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: surface,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <ChevronLeft size={16} color={fg} />
          <Text style={f(14, fg, "500", 20)}>Return to Lecture Sections</Text>
        </Pressable>
      )}
    </View>
  );
  return (
    <ScrollShell>
    <View style={{ flex: embedded?undefined:1, backgroundColor: embedded?"transparent":bg }}>
      <VideoBody embedded={embedded}
        scrollY={scrollY}
        contentRef={scrollContent}
        testID={"lecture-video-" + variant + "-scroll"}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          width: "100%",
          maxWidth: 1800,
          alignSelf: "center",
          paddingHorizontal: studio ? (wide ? 32 : 16) : wide ? 24 : 0,
          paddingTop:embedded?0:
            (desktop ? 0 : insets.top + 64) +
            (studio ? (wide ? 48 : 72) : desktop ? 32 : 40),
          paddingBottom: embedded?24:SCROLL_BOTTOM_PAD + insets.bottom,
        }}
      >
        {!videos.length ? (
          <View
            testID="lecture-video-empty"
            style={{
              minHeight: embedded?undefined:studio ? 230 : 700,
              borderRadius: studio ? 16 : 0,
              borderWidth: studio ? 1 : 0,
              borderStyle: "dashed",
              borderColor: colors.border,
              backgroundColor: studio ? colors.muted + "33" : "transparent",
              alignItems: "center",
              justifyContent: "center",
              gap: studio ? 12 : 16,
              paddingVertical: embedded?64:studio ? 64 : 0,
            }}
          >
            <Video
              size={studio ? 40 : 64}
              color={muted}
              opacity={studio ? 0.25 : 0.3}
            />
            <Text
              style={f(14, studio ? colors.mutedForeground : muted, "400", 20)}
            >
              {studio
                ? "No videos for this lecture"
                : "No videos for this lecture."}
            </Text>
            <Pressable
              accessibilityRole="link"
              onPress={back}
              style={{ marginTop: studio ? 32 : 0 }}
            >
              <Text
                style={f(14, studio ? colors.primary : "#3ea6ff", "500", 20)}
              >
                {studio ? "← Back to lecture sections" : "← Back to lecture"}
              </Text>
            </Pressable>
          </View>
        ) : (
          <LectureStickyRegion>
            {studio && (
              <LectureSticky enabled={!embedded} top={desktop?0:insets.top+64}>
              <View
                testID="video-studio-header"
                style={{
                  paddingVertical: desktop ? 16 : 12,
                  borderBottomWidth: 1,
                  borderColor: "#1a1b2e80",
                  backgroundColor: "#0c0d184D",
                  marginBottom: 48,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: desktop ? 16 : 12,
                    flex: 1,
                  }}
                >
                  {circle(
                    "Back to lecture",
                    back,
                    <ChevronLeft size={20} color="#818cf8" />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        ...f(desktop ? 10 : 8, muted, "900"),
                        textTransform: "uppercase",
                        letterSpacing: 2,
                      }}
                    >
                      Studio
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={f(desktop ? 14 : 13, "#c7d2fe", "900")}
                    >
                      {active.title}
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={f(desktop ? 10 : 9, muted, "900")}>
                      PROGRESS
                    </Text>
                    <Text style={f(desktop ? 12 : 11, colors.primary, "900")}>
                      {progress}%
                    </Text>
                  </View>
                  <View
                    style={{
                      height: desktop ? 40 : 36,
                      width: desktop ? 40 : 36,
                      borderWidth: 2,
                      borderColor: "#1a1b2e",
                      borderRadius: 99,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={f(9, colors.primary, "900")}>{progress}%</Text>
                  </View>
                </View>
              </View>
              </LectureSticky>
            )}
            <LectureStickyRegion>
            <View
              style={{
                flexDirection: wide ? "row" : "column",
                alignItems: "flex-start",
                gap: studio ? (wide ? 48 : 32) : 24,
              }}
            >
              <LectureStickyRegion
                style={{
                  flex: wide ? 1 : undefined,
                  width: wide ? undefined : "100%",
                  minWidth: 0,
                }}
              >
                {!studio && !wide && !embedded && (
                  <Pressable
                    accessibilityRole="link"
                    onPress={back}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 12,
                    }}
                  >
                    <ChevronLeft size={14} color={muted} />
                    <Text style={f(12, muted, "400", 16)}>Back to lecture</Text>
                  </Pressable>
                )}
                <LectureSticky enabled={embedded&&!studio&&!wide} top={(desktop?8:0)+(embedded&&!desktop?12:32)}>
                <View
                  testID="video-theater"
                  onLayout={(e) =>
                    setPlayerWidth((old) =>
                      old === e.nativeEvent.layout.width
                        ? old
                        : e.nativeEvent.layout.width
                    )
                  }
                  style={{
                    marginHorizontal: studio
                      ? desktop
                        ? 0
                        : -16
                      : wide
                      ? -8
                      : -12,
                    marginTop: studio || wide ? 0 : embedded&&!desktop?-12:-32,
                    borderRadius: studio ? (desktop ? 24 : 0) : wide ? 12 : 0,
                    overflow: "hidden",
                    backgroundColor: "#000",
                    borderWidth: studio ? 1 : 0,
                    borderColor: "#ffffff0D",
                  }}
                >
                  {isFixtureMode() ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Preview video"
                      onPress={openSource}
                      style={{
                        height: (playerWidth * 9) / 16,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Play size={42} color="#fff" />
                    </Pressable>
                  ) : active.url ? (
                    <LectureVideoPlayer
                      key={active.id}
                      url={active.url}
                      backupUrl={active.backupUrl}
                      title={active.title}
                      hideBranding={!studio}
                      height={Math.max(
                        100,
                        (playerWidth * 9) / 16 - (studio ? 2 : 0)
                      )}
                    />
                  ) : (
                    <View
                      style={{
                        height: (playerWidth * 9) / 16,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={f(14, "#aaa")}>
                        Video source unavailable
                      </Text>
                    </View>
                  )}
                </View></LectureSticky>
                <View
                  style={{
                    marginTop: studio ? 32 : 12,
                    padding: studio ? 4 : 0,
                    gap: studio ? 16 : 12,
                  }}
                >
                  <Text
                    testID="active-video-title"
                    style={{
                      ...f(
                        studio ? (desktop ? 28 : 20) : embedded&&viewportWidth<=768?20:wide ? 20 : 21.6,
                        fg,
                        studio ? "900" : wide ? "600" : "700",
                        studio ? (desktop ? 35 : 25) : embedded&&viewportWidth<=768?26:wide ? 28 : 29.7
                      ),
                      letterSpacing: studio
                        ? -(desktop ? 28 : 20) * 0.025
                        : -0.15,
                    }}
                  >
                    {active.title}
                  </Text>
                  <View
                    style={{
                      flexDirection: studio && desktop ? "row" : "column",
                      justifyContent: "space-between",
                      gap: studio ? 24 : 0,
                      paddingBottom: studio ? 16 : 0,
                      borderBottomWidth: studio ? 1 : 0,
                      borderColor: "#1a1b2e",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <View
                        style={{
                          height: studio && desktop ? 52 : 40,
                          width: studio && desktop ? 52 : 40,
                          borderRadius: studio ? 12 : 20,
                          backgroundColor: studio ? "#07080f" : "#4f46e5",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {meta?.thumbnail?.startsWith("https://") ? (
                          <Image
                            source={{ uri: meta.thumbnail }}
                            style={{
                              width: "100%",
                              height: "100%",
                              borderRadius: studio ? 12 : 20,
                            }}
                          />
                        ) : (
                          <GraduationCap
                            size={20}
                            color={studio ? colors.primary : "#fff"}
                          />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={f(
                            studio ? (desktop ? 16 : 14) : 14,
                            fg,
                            studio ? "900" : "500",
                            studio ? undefined : 17.5
                          )}
                        >
                          {meta?.name || "Instructor unavailable"}
                        </Text>
                        {studio && (
                          <Text
                            style={{
                              ...f(10, "#ffffff66", "700", 16.5),
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                            }}
                          >
                            {meta?.name
                              ? "Source channel"
                              : "Source metadata not loaded"}
                          </Text>
                        )}
                      </View>
                      {studio && (
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => blocked("A YouTube subscription")}
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            borderRadius: 12,
                            backgroundColor: "#ef4444",
                            marginLeft: desktop ? 16 : 0,
                          }}
                        >
                          <Text style={f(desktop ? 14 : 11, "#fff", "900")}>
                            Follow
                          </Text>
                        </Pressable>
                      )}
                    </View>
                    {studio && (
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: desktop ? "flex-end" : "space-around",
                          gap: 12,
                          padding: 8,
                          borderRadius: 16,
                          backgroundColor: desktop ? "transparent" : surface,
                        }}
                      >
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Like video"
                          onPress={() => blocked("A video like")}
                          style={{
                            flexDirection: desktop ? "row" : "column",
                            alignItems: "center",
                            gap: desktop ? 8 : 4,
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                          }}
                        >
                          <ThumbsUp size={16} color="#ffffff66" />
                          <Text style={f(12, "#ffffff66", "900")}>
                            {meta?.likeCount ??
                              (active.likesCountKnown
                                ? active.likesCount
                                : "Unavailable")}
                          </Text>
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="AI Summary"
                          onPress={() =>
                            Alert.alert(
                              "Summary unavailable",
                              "This read-only version does not request AI generation."
                            )
                          }
                          style={{
                            flexDirection: desktop ? "row" : "column",
                            alignItems: "center",
                            gap: desktop ? 8 : 4,
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                          }}
                        >
                          <Sparkles size={16} color={colors.primary} />
                          <Text
                            style={{
                              ...f(10, "#ffffff66", "400"),
                              textTransform: "uppercase",
                            }}
                          >
                            AI Summary
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                </View>
                {studio && (
                  <View
                    style={{
                      marginTop: 32,
                      padding: 24,
                      borderRadius: 16,
                      backgroundColor: "#0c0d1866",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 16,
                        marginBottom: 16,
                        alignItems: "center",
                      }}
                    >
                      <Text style={f(14, "#fff", "900")}>
                        {meta?.viewCount
                          ? meta.viewCount + " views"
                          : "Views unavailable"}
                      </Text>
                      <Text style={f(14, muted)}>•</Text>
                      <Text
                        style={{
                          ...f(11, "#818cf8", "600"),
                          fontStyle: "italic",
                          letterSpacing: 0.55,
                          textTransform: "uppercase",
                        }}
                      >
                        {active.sourceType || "Video source"}
                      </Text>
                    </View>
                    <Text
                      style={f(15, "#a0a1c0", "400", 27)}
                      numberOfLines={expanded ? undefined : 3}
                    >
                      {meta?.description?.replace(
                        /https?:\/\/[^\s]+/g,
                        "[Link Removed]"
                      ) ||
                        "No detailed description available for this lecture video."}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setExpanded((value) => !value)}
                      style={{ marginTop: 16 }}
                    >
                      <Text style={f(14, "#4f46e5", "700")}>
                        {expanded ? "Show less" : "...more"}
                      </Text>
                    </Pressable>
                  </View>
                )}
                {!active.url && (
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel="Open video source"
                    onPress={openSource}
                    style={{ marginTop: 16, alignSelf: "flex-start" }}
                  >
                    <Text style={f(12, studio ? "#818cf8" : muted, "500", 16)}>
                      Open source
                    </Text>
                  </Pressable>
                )}
              </LectureStickyRegion>
              <LectureSticky enabled={studio&&!embedded&&wide} top={100}>{playlist}</LectureSticky>
            </View>
            </LectureStickyRegion>
            {studio && (
              <Pressable
                accessibilityRole="link"
                onPress={back}
                style={{
                  marginTop: 64,
                  alignSelf: "center",
                  paddingHorizontal: wide ? 64 : 24,
                  paddingVertical: 16,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: "#1a1b2e",
                  backgroundColor: surface,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <ChevronLeft size={20} color="#c7d2fe" />
                <Text style={f(16, "#c7d2fe", "700")}>
                  Return to Lecture Sections
                </Text>
              </Pressable>
            )}
          </LectureStickyRegion>
        )}
      </VideoBody>
      {!embedded&&!desktop && <FloatingStudentHeader title="Library" />}
      {!embedded&&<FadeEdges color={bg} />}
      {floating}
    </View>
    </ScrollShell>
  );
}
export function LectureYouTubeSection() {
  return <LectureVideoSection variant="youtube" />;
}
