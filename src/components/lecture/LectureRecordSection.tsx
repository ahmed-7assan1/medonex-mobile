import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
  type TextStyle,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { apiV1 } from "@/lib/api";
import { SpotifyRecordFrame } from "./SpotifyRecordFrame";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Clock,
  ExternalLink,
  GraduationCap,
  Headphones,
  Pause,
  Play,
  Settings2,
  Share2,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react-native";
import { useTheme } from "@/theme/ThemeContext";
import { useStudentDimensions } from "@/lib/student-viewport";
import { useLecture } from "@/lib/lecture";
import { lectureTitleCase } from "@/lib/lecture-format";
import { isFixtureMode } from "@/lib/fixtures";
import { ResourceState } from "@/components/ResourceState";
import { FadeEdges } from "@/components/FadeEdges";
import { FloatingStudentHeader } from "@/components/FloatingStudentHeader";
import { SCROLL_BOTTOM_PAD } from "@/theme/tokens";
import {
  LectureAudioEngine,
  type AudioCommand,
  type AudioStatus,
} from "./LectureAudioEngine";
const time = (value: number) =>
  Number.isFinite(value)
    ? `${Math.floor(value / 60)
        .toString()
        .padStart(2, "0")}:${Math.floor(value % 60)
        .toString()
        .padStart(2, "0")}`
    : "00:00";
export function LectureRecordSection() {
  const {
      id: moduleId,
      lectureId,
      r,
    } = useLocalSearchParams<{ id: string; lectureId: string; r?: string }>(),
    resource = useLecture(lectureId ?? ""),
    lecture = resource.data,
    { colors, isDark } = useTheme(),
    { viewportWidth, width } = useStudentDimensions(),
    router = useRouter(),
    insets = useSafeAreaInsets();
  const desktop = viewportWidth >= 768,
    wide = viewportWidth >= 1024;
  const [activeId, setActiveId] = useState(r ?? ""),
    [playing, setPlaying] = useState(false),
    [rate, setRate] = useState(1),
    [volume, setVolume] = useState(1),
    [showSpeed, setShowSpeed] = useState(false),
    [progressWidth, setProgressWidth] = useState(1),
    [showEmbed, setShowEmbed] = useState(false),
    [seek, setSeek] = useState<AudioCommand["seek"]>(),
    [status, setStatus] = useState<AudioStatus>({
      time: 0,
      duration: 0,
      playing: false,
      failed: false,
    });
  useEffect(() => {
    setActiveId(r ?? "");
    setPlaying(false);
    setShowEmbed(false);
  }, [r, lectureId]);
  const records = lecture?.records ?? [],
    active = records.find((item) => item.id === (activeId || records[0]?.id));
  let mediaHost = "",
    spotifyEmbed = "",
    driveUrl = "";
  try {
    const parsed = new URL(active?.url ?? "");
    if (parsed.protocol === "https:") {
      mediaHost = parsed.hostname;
      const match = parsed.pathname.match(
        /^\/(track|episode|album|show|playlist)\/([a-zA-Z0-9]+)$/
      );
      if (mediaHost === "open.spotify.com" && match)
        spotifyEmbed =
          "https://open.spotify.com/embed/" + match[1] + "/" + match[2];
      if (mediaHost === "drive.google.com") {
        const id =
          parsed.pathname.match(/^\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1] ||
          parsed.searchParams.get("id");
        if (id && /^[a-zA-Z0-9_-]+$/.test(id))
          driveUrl =
            "https://drive.google.com/uc?export=download&id=" +
            encodeURIComponent(id);
      }
    }
  } catch {}
  const isSpotify = !!spotifyEmbed,
    isYoutube = ["youtu.be", "youtube.com", "www.youtube.com"].includes(
      mediaHost
    );
  const metadata = useQuery<{
    title?: string;
    artist?: string;
    image?: string;
    type?: string;
    preview_url?: string;
  }>({
    queryKey: ["lecture-audio-metadata", active?.url],
    queryFn: () =>
      apiV1.get(
        "/spotify/metadata?url=" + encodeURIComponent(active?.url ?? "")
      ),
    enabled: !isFixtureMode() && isSpotify,
    retry: false,
  });
  const preview = (() => {
    try {
      const url = new URL(metadata.data?.preview_url ?? "");
      return url.protocol === "https:" ? url.href : "";
    } catch {
      return "";
    }
  })();
  const audioUrl = preview || driveUrl || active?.url;
  const command = useMemo(
    () => ({ playing, rate, volume, seek }),
    [playing, rate, volume, seek]
  );
  const f = (
    size: number,
    color = colors.foreground,
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
  const hub = `/modules/${encodeURIComponent(
    moduleId ?? ""
  )}/lectures/${encodeURIComponent(lectureId ?? "")}`;
  if (!lecture)
    return (
      <ResourceState
        title="Audio Records"
        error={resource.error}
        onRetry={() => resource.refetch()}
      />
    );
  const subject = lecture.subject;
  if (!subject || subject.module.id !== moduleId)
    return (
      <ResourceState
        title="Lecture"
        notFound
        onRetry={() => resource.refetch()}
      />
    );
  const title = lectureTitleCase(lecture.title);
  const openSource = () => {
    if (isFixtureMode()) {
      Alert.alert("Guest preview", "Sample recordings stay on this device.");
      return;
    }
    try {
      const url = new URL(active?.url ?? "");
      if (url.protocol !== "https:") throw Error();
      void Linking.openURL(url.href).catch(() =>
        Alert.alert(
          "Audio unavailable",
          "The original recording could not open."
        )
      );
    } catch {
      Alert.alert("Audio unavailable", "This recording has no supported link.");
    }
  };
  const external = (isSpotify && !preview) || isYoutube;
  const jump = (seconds: number) =>
    setSeek({
      time: Math.max(0, Math.min(status.duration, status.time + seconds)),
      nonce: Date.now(),
    });
  const toggle = () => {
    if (isFixtureMode()) {
      Alert.alert("Guest preview", "Sample recordings stay on this device.");
      return;
    }
    if (isSpotify && !preview) {
      setShowEmbed(true);
      return;
    }
    if (isYoutube) {
      openSource();
      return;
    }
    setPlaying((value) => !value);
  };
  const control = (label: string, Icon: any, action: () => void, size = 20) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={action}
      style={{ padding: 8 }}
    >
      <Icon size={size} color="#ffffff66" />
    </Pressable>
  );
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        testID="lecture-record-scroll"
        contentContainerStyle={{
          width: "100%",
          maxWidth:
            viewportWidth - width > 120
              ? 1240
              : viewportWidth - width > 1
              ? 1360
              : 1520,
          alignSelf: "center",
          paddingHorizontal: desktop ? 24 : 16,
          paddingTop: (desktop ? 0 : insets.top + 64) + (desktop ? 48 : 44),
          paddingBottom: insets.bottom + SCROLL_BOTTOM_PAD,
        }}
      >
        <View
          testID="record-breadcrumbs"
          style={{
            flexDirection: "row",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 24,
          }}
        >
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push("/modules")}
          >
            <Text style={f(13, colors.mutedForeground + "99")}>Modules</Text>
          </Pressable>
          <Text style={{ ...f(11, colors.mutedForeground), opacity: 0.18 }}>
            ›
          </Text>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push(`/modules/${moduleId}` as never)}
            style={{ maxWidth: 150 }}
          >
            <Text
              numberOfLines={1}
              style={f(13, colors.mutedForeground + "99")}
            >
              {subject.module.name}
            </Text>
          </Pressable>
          <Text style={{ ...f(11, colors.mutedForeground), opacity: 0.18 }}>
            ›
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View
              style={{
                borderRadius: 999,
                backgroundColor: colors.primary + "1A",
                paddingHorizontal: 10,
                paddingVertical: 2,
                boxShadow: "0 0 0 1px " + colors.primary + "33",
              }}
            >
              <Text
                style={{
                  ...f(10, colors.primary, "700"),
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                }}
              >
                {subject.name}
              </Text>
            </View>
            <Text style={f(13, colors.foreground, "500")}>{title}</Text>
          </View>
        </View>
        <View style={{ marginBottom: 40, gap: 16 }}>
          <Text
            testID="record-title"
            style={{
              ...f(30, colors.primary, "700", 36),
              letterSpacing: -0.75,
            }}
          >
            {title}{" "}
            <Text style={{ color: colors.foreground, opacity: 0.6 }}>
              Audio Records
            </Text>
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                borderRadius: 999,
                backgroundColor: colors.muted + "80",
                paddingHorizontal: 14,
                paddingVertical: 6,
              }}
            >
              <GraduationCap size={14} color={colors.mutedForeground} />
              <Text style={f(12, colors.mutedForeground, "600")}>
                {subject.name}
              </Text>
            </View>
            {viewportWidth >= 640 && (
              <View
                style={{
                  width: 1,
                  height: 16,
                  backgroundColor: colors.border + "99",
                  marginHorizontal: 4,
                }}
              />
            )}
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <View style={{ flexDirection: "row", gap: 4 }}>
                {records.map((item, index) => (
                  <View
                    key={item.id}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor:
                        index === 0 ? colors.primary : colors.muted,
                    }}
                  />
                ))}
              </View>
              <Text style={f(13, colors.mutedForeground, "500")}>
                {records.length} {records.length === 1 ? "Track" : "Tracks"}
              </Text>
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Clock size={16} color={colors.mutedForeground + "66"} />
              <Text style={f(13, colors.mutedForeground, "500")}>Listen</Text>
            </View>
          </View>
        </View>
        {!records.length ? (
          <View
            testID="record-empty"
            style={{
              alignItems: "center",
              gap: 12,
              borderRadius: 16,
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: colors.border,
              backgroundColor: colors.muted + "33",
              paddingVertical: 64,
            }}
          >
            <Headphones size={40} color={colors.mutedForeground + "40"} />
            <Text style={f(14, colors.mutedForeground, "400", 20)}>
              No audio records found for this lecture
            </Text>
            <Pressable
              onPress={() => router.push(hub as never)}
              style={{ marginTop: 32 }}
            >
              <Text style={f(14, colors.primary, "500", 20)}>
                ← Back to lecture hub
              </Text>
            </Pressable>
          </View>
        ) : (
          <View
            style={{
              flexDirection: wide ? "row" : "column",
              alignItems: "flex-start",
              gap: 24,
            }}
          >
            <View
              testID="record-main"
              style={{
                flex: wide ? 1 : undefined,
                width: wide ? undefined : "100%",
                minWidth: 0,
              }}
            >
              {active && (
                <View
                  style={{
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      padding: 24,
                      backgroundColor: "#00000066",
                      borderBottomWidth: 1,
                      borderBottomColor: "#ffffff0D",
                    }}
                  >
                    <LinearGradient
                      colors={["#121212", "#1e1e1e"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        borderRadius: 32,
                        borderWidth: 1,
                        borderColor: "#ffffff0D",
                        padding: desktop ? 32 : 24,
                      }}
                    >
                      {showEmbed && spotifyEmbed ? (
                        <View style={{ gap: 16 }}>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <Text
                              style={{
                                ...f(12, colors.primary, "900", 16),
                                letterSpacing: 1.2,
                                textTransform: "uppercase",
                              }}
                            >
                              Spotify Full Player
                            </Text>
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel="Back to MedOneX UI"
                              onPress={() => setShowEmbed(false)}
                              style={{
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 999,
                                backgroundColor: "#ffffff0D",
                              }}
                            >
                              <Text style={f(10, "#ffffff99", "700")}>
                                ‹ Back to MedOneX UI
                              </Text>
                            </Pressable>
                          </View>
                          <SpotifyRecordFrame url={spotifyEmbed} />
                        </View>
                      ) : (
                        <View
                          style={{
                            flexDirection: desktop ? "row" : "column",
                            alignItems: "center",
                            gap: 32,
                          }}
                        >
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Play cover audio"
                            onPress={toggle}
                            style={{
                              width: desktop ? 192 : 160,
                              height: desktop ? 192 : 160,
                              borderRadius: 16,
                              borderWidth: 1,
                              borderColor: "#ffffff1A",
                              backgroundColor: colors.primary + "1A",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {metadata.isFetching ? (
                              <ActivityIndicator
                                color={colors.primary + "80"}
                              />
                            ) : metadata.data?.image ? (
                              <Image
                                source={{ uri: metadata.data.image }}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  borderRadius: 16,
                                }}
                                resizeMode="cover"
                              />
                            ) : (
                              <Headphones
                                size={64}
                                color={colors.primary + "66"}
                              />
                            )}
                          </Pressable>
                          <View
                            style={{
                              flex: desktop ? 1 : undefined,
                              width: desktop ? undefined : "100%",
                              minWidth: 0,
                            }}
                          >
                            <View style={{ marginBottom: 24 }}>
                              <View
                                style={{
                                  alignSelf: "flex-start",
                                  borderRadius: 6,
                                  backgroundColor: colors.primary + "33",
                                  paddingHorizontal: 8,
                                  paddingVertical: 2,
                                  marginBottom: 8,
                                }}
                              >
                                <Text
                                  style={{
                                    ...f(10, colors.primary, "900"),
                                    letterSpacing: 1,
                                    textTransform: "uppercase",
                                  }}
                                >
                                  {isSpotify
                                    ? "Spotify " +
                                      (metadata.data?.type || "Record")
                                    : isYoutube
                                    ? "YouTube Record"
                                    : driveUrl
                                    ? "Google Drive Record"
                                    : "MedOneX Native"}
                                </Text>
                              </View>
                              <Text
                                numberOfLines={1}
                                style={{
                                  ...f(
                                    desktop ? 30 : 24,
                                    "#fff",
                                    "900",
                                    desktop ? 36 : 32
                                  ),
                                  letterSpacing: -(desktop ? 30 : 24) * 0.025,
                                }}
                              >
                                {metadata.isFetching
                                  ? "Loading track..."
                                  : metadata.data?.title || active.title}
                              </Text>
                              <Text
                                numberOfLines={1}
                                style={{
                                  ...f(14, "#ffffff80", "700", 20),
                                  marginTop: 4,
                                }}
                              >
                                {metadata.isFetching
                                  ? "Fetching artist..."
                                  : metadata.data?.artist ||
                                    "MedOneX Academic Audio"}
                              </Text>
                            </View>
                            <View style={{ marginBottom: 24, gap: 8 }}>
                              <Pressable
                                accessibilityRole="adjustable"
                                accessibilityLabel="Audio position"
                                accessibilityValue={{
                                  min: 0,
                                  max: Math.round(status.duration),
                                  now: Math.round(status.time),
                                  text:
                                    time(status.time) +
                                    " of " +
                                    time(status.duration),
                                }}
                                accessibilityActions={[
                                  {
                                    name: "increment",
                                    label: "Forward ten seconds",
                                  },
                                  {
                                    name: "decrement",
                                    label: "Back ten seconds",
                                  },
                                ]}
                                onAccessibilityAction={(event) =>
                                  jump(
                                    event.nativeEvent.actionName === "increment"
                                      ? 10
                                      : -10
                                  )
                                }
                                onLayout={(event) =>
                                  setProgressWidth(
                                    Math.max(1, event.nativeEvent.layout.width)
                                  )
                                }
                                onPress={(event) => {
                                  if (status.duration > 0)
                                    setSeek({
                                      time:
                                        Math.max(
                                          0,
                                          Math.min(
                                            1,
                                            event.nativeEvent.locationX /
                                              progressWidth
                                          )
                                        ) * status.duration,
                                      nonce: Date.now(),
                                    });
                                }}
                                style={{
                                  height: 6,
                                  backgroundColor: "#ffffff1A",
                                  borderRadius: 999,
                                  overflow: "hidden",
                                }}
                              >
                                <View
                                  style={{
                                    height: 6,
                                    width: `${Math.min(
                                      100,
                                      (status.time / (status.duration || 1)) *
                                        100
                                    )}%`,
                                    backgroundColor: colors.primary,
                                  }}
                                />
                              </Pressable>
                              <View
                                style={{
                                  flexDirection: "row",
                                  justifyContent: "space-between",
                                }}
                              >
                                <Text
                                  style={{
                                    ...f(11, "#ffffff66", "700"),
                                    letterSpacing: -0.55,
                                  }}
                                >
                                  {time(status.time)}
                                </Text>
                                <Text
                                  style={{
                                    ...f(11, "#ffffff66", "700"),
                                    letterSpacing: -0.55,
                                  }}
                                >
                                  {time(status.duration)}
                                </Text>
                              </View>
                            </View>
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                            >
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  gap: 16,
                                }}
                              >
                                {control("Back ten seconds", SkipBack, () =>
                                  jump(-10)
                                )}
                                <Pressable
                                  accessibilityRole="button"
                                  accessibilityLabel={
                                    playing ? "Pause audio" : "Play audio"
                                  }
                                  onPress={toggle}
                                  style={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: 32,
                                    backgroundColor: isDark
                                      ? colors.card
                                      : "#fff",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  {playing ? (
                                    <Pause
                                      size={32}
                                      color={
                                        isDark ? colors.foreground : "#000"
                                      }
                                    />
                                  ) : (
                                    <Play
                                      size={32}
                                      color={
                                        isDark ? colors.foreground : "#000"
                                      }
                                    />
                                  )}
                                </Pressable>
                                {control(
                                  "Forward ten seconds",
                                  SkipForward,
                                  () => jump(10)
                                )}
                              </View>
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                {desktop && (
                                  <View
                                    style={{
                                      flexDirection: "row",
                                      alignItems: "center",
                                      gap: 12,
                                      marginRight: 16,
                                      paddingHorizontal: 16,
                                      paddingVertical: 8,
                                      borderRadius: 16,
                                      borderWidth: 1,
                                      borderColor: "#ffffff0D",
                                      backgroundColor: "#ffffff0D",
                                    }}
                                  >
                                    <Volume2 size={16} color="#ffffff66" />
                                    <Pressable
                                      accessibilityRole="adjustable"
                                      accessibilityLabel="Audio volume"
                                      accessibilityValue={{
                                        min: 0,
                                        max: 100,
                                        now: Math.round(volume * 100),
                                      }}
                                      accessibilityActions={[
                                        { name: "increment", label: "Louder" },
                                        { name: "decrement", label: "Quieter" },
                                      ]}
                                      onAccessibilityAction={(event) =>
                                        setVolume((value) =>
                                          Math.max(
                                            0,
                                            Math.min(
                                              1,
                                              value +
                                                (event.nativeEvent
                                                  .actionName === "increment"
                                                  ? 0.1
                                                  : -0.1)
                                            )
                                          )
                                        )
                                      }
                                      onPress={(event) =>
                                        setVolume(
                                          Math.max(
                                            0,
                                            Math.min(
                                              1,
                                              event.nativeEvent.locationX / 80
                                            )
                                          )
                                        )
                                      }
                                      style={{
                                        width: 80,
                                        height: 20,
                                        justifyContent: "center",
                                      }}
                                    >
                                      <View
                                        style={{
                                          height: 6,
                                          borderRadius: 99,
                                          backgroundColor: "#ffffff66",
                                        }}
                                      >
                                        <View
                                          style={{
                                            height: 6,
                                            borderRadius: 99,
                                            width: `${volume * 100}%`,
                                            backgroundColor: "#fff",
                                          }}
                                        />
                                      </View>
                                      <View
                                        style={{
                                          position: "absolute",
                                          left: volume * 64,
                                          width: 16,
                                          height: 16,
                                          borderRadius: 8,
                                          backgroundColor: "#fff",
                                        }}
                                      />
                                    </Pressable>
                                  </View>
                                )}
                                <Pressable
                                  accessibilityRole="button"
                                  accessibilityLabel="Audio speed"
                                  onPress={() =>
                                    setShowSpeed((value) => !value)
                                  }
                                  style={{
                                    height: 40,
                                    paddingHorizontal: 16,
                                    borderRadius: 16,
                                    borderWidth: 1,
                                    borderColor: "#ffffff0D",
                                    backgroundColor: "#ffffff0D",
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 6,
                                  }}
                                >
                                  <Settings2 size={14} color="#ffffff99" />
                                  <Text style={f(11, "#ffffff99", "900")}>
                                    {rate}x
                                  </Text>
                                </Pressable>
                                {
                                  <Pressable
                                    accessibilityRole="button"
                                    accessibilityLabel="Share recording"
                                    style={{
                                      width: 40,
                                      height: 40,
                                      borderRadius: 16,
                                      borderWidth: 1,
                                      borderColor: "#ffffff0D",
                                      backgroundColor: "#ffffff0D",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                    onPress={() => {
                                      if (isFixtureMode()) {
                                        Alert.alert(
                                          "Guest preview",
                                          "Sample recording links cannot be shared."
                                        );
                                        return;
                                      }
                                      if (active.url)
                                        void Share.share({
                                          message: active.url,
                                        }).catch(() =>
                                          Alert.alert(
                                            "Share unavailable",
                                            "This recording could not be shared."
                                          )
                                        );
                                    }}
                                  >
                                    <Share2 size={16} color="#ffffff99" />
                                  </Pressable>
                                }
                              </View>
                            </View>
                            {showSpeed && (
                              <View
                                style={{
                                  alignSelf: "flex-end",
                                  backgroundColor: "#282828",
                                  borderRadius: 16,
                                  padding: 8,
                                  marginTop: 12,
                                }}
                              >
                                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((value) => (
                                  <Pressable
                                    key={value}
                                    accessibilityRole="button"
                                    accessibilityLabel={
                                      "Playback speed " + value
                                    }
                                    onPress={() => {
                                      setRate(value);
                                      setShowSpeed(false);
                                    }}
                                    style={{
                                      paddingHorizontal: 16,
                                      paddingVertical: 8,
                                      borderRadius: 8,
                                      backgroundColor:
                                        value === rate
                                          ? colors.primary
                                          : "transparent",
                                    }}
                                  >
                                    <Text
                                      style={f(
                                        12,
                                        value === rate
                                          ? colors.primaryForeground
                                          : "#ffffff99",
                                        "700"
                                      )}
                                    >
                                      {value}x
                                    </Text>
                                  </Pressable>
                                ))}
                              </View>
                            )}
                            {status.failed && (
                              <Text
                                accessibilityRole="alert"
                                style={{ ...f(12, "#fff"), marginTop: 12 }}
                              >
                                This recording could not play here. Use Open
                                Source to listen.
                              </Text>
                            )}
                          </View>
                        </View>
                      )}
                    </LinearGradient>
                  </View>
                  <View
                    style={{
                      padding: desktop ? 24 : 16,
                      flexDirection: "row",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 16,
                    }}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={{
                          ...f(20, colors.foreground, "700", 28),
                          letterSpacing: -0.5,
                        }}
                      >
                        {active.title}
                      </Text>
                      <View
                        style={{
                          alignSelf: "flex-start",
                          marginTop: 4,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 999,
                          backgroundColor: colors.primary + "1A",
                        }}
                      >
                        <Text
                          style={{
                            ...f(14, colors.primary, "500", 20),
                            letterSpacing: -0.35,
                          }}
                        >
                          Audio Stream
                        </Text>
                      </View>
                    </View>
                    <Pressable
                      accessibilityRole="link"
                      accessibilityLabel="Open Source"
                      onPress={openSource}
                      style={{
                        height: 36,
                        paddingHorizontal: 16,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: colors.muted + "66",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <ExternalLink size={16} color={colors.mutedForeground} />
                      <Text style={f(14, colors.foreground, "500", 20)}>
                        Open Source
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
            <View
              testID="record-playlist"
              style={{
                width: wide ? 340 : "100%",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.card + "80",
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                  backgroundColor: colors.muted + "33",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View>
                  <Text style={f(14, colors.foreground, "600", 20)}>
                    Lecture Tracks
                  </Text>
                  <Text
                    style={{ ...f(11, colors.mutedForeground), marginTop: 2 }}
                  >
                    {records.length} {records.length === 1 ? "Track" : "Tracks"}
                  </Text>
                </View>
                <Headphones size={16} color={colors.primary} />
              </View>
              <ScrollView nestedScrollEnabled style={{ maxHeight: 480 }}>
                {records.map((record, index) => {
                  const selected = active?.id === record.id;
                  return (
                    <Pressable
                      key={record.id}
                      accessibilityRole="button"
                      accessibilityLabel={"Select recording " + record.title}
                      accessibilityState={{ selected }}
                      onPress={() => {
                        setActiveId(record.id);
                        setPlaying(false);
                        setShowEmbed(false);
                        setSeek(undefined);
                        setStatus({
                          playing: false,
                          time: 0,
                          duration: 0,
                          failed: false,
                        });
                      }}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 14,
                        flexDirection: "row",
                        alignItems: "flex-start",
                        gap: 12,
                        backgroundColor: selected
                          ? colors.primary + "0D"
                          : "transparent",
                        borderBottomWidth: index < records.length - 1 ? 1 : 0,
                        borderBottomColor: "#ffffff0D",
                      }}
                    >
                      <View
                        style={{
                          width: 24,
                          alignItems: "center",
                          marginTop: 2,
                          opacity: 0.6,
                        }}
                      >
                        {selected ? (
                          <Play size={14} color={colors.primary} />
                        ) : (
                          <Text style={f(12, colors.mutedForeground)}>
                            {index + 1}
                          </Text>
                        )}
                      </View>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text
                          numberOfLines={1}
                          style={f(
                            14,
                            selected ? colors.primary : colors.foreground,
                            "600",
                            20
                          )}
                        >
                          {record.title}
                        </Text>
                        <Text
                          numberOfLines={1}
                          style={{
                            ...f(
                              12,
                              selected
                                ? colors.primary + "B3"
                                : colors.mutedForeground + "B3",
                              "500",
                              16
                            ),
                            marginTop: 2,
                          }}
                        >
                          Audio Session
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        )}
      </ScrollView>
      {audioUrl && !external && !isFixtureMode() && (
        <LectureAudioEngine
          key={active?.id + "-" + audioUrl}
          url={audioUrl}
          command={command}
          onInterrupt={()=>setPlaying(false)}
          onStatus={(next) => {
            setStatus(next);
            if (!next.playing) setPlaying(false);
          }}
        />
      )}
      {!desktop && <FloatingStudentHeader title="Library" />}
      <FadeEdges />
    </View>
  );
}
