import{LinearGradient}from'expo-linear-gradient';
import React, { useRef, useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  type TextStyle,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import {
  AlignLeft,
  ArrowLeft,
  BookOpen,
  Brain,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  FolderArchive,
  Layers,
  ListChecks,
  Mic2,
  Microscope,
  Music2,
  Play,
  Radio,
  Sparkles,
  Star,
  X,
  Youtube,
} from "lucide-react-native";
import { useTheme } from "@/theme/ThemeContext";
import { useStudentDimensions } from "@/lib/student-viewport";
import { useLecture } from "@/lib/lecture";
import { useQuizData } from "@/lib/quiz-player";
import { lectureTitleCase } from "@/lib/lecture-format";
import { isFixtureMode } from "@/lib/fixtures";
import { saveOfflineFile, useOfflineDownloads } from "@/lib/offline-downloads";
import { SCROLL_BOTTOM_PAD } from "@/theme/tokens";
import { ResourceState } from "@/components/ResourceState";
import { FadeEdges } from "@/components/FadeEdges";
import { FloatingStudentHeader } from "@/components/FloatingStudentHeader";
import { WebsiteMarkdown } from "@/components/WebsiteMarkdown";
import { LectureFlashcardPractice } from "./LectureFlashcardSection";
import { LectureQuestionPractice } from "./LectureQuestionSection";
import { LectureVideoPlayer } from "./LectureVideoPlayer";
import { SpotifyRecordFrame } from "./SpotifyRecordFrame";
const meta: Record<string, { Icon: any; color: string; label: string }> = {
  overview: { Icon: Layers, color: "#8b5cf6", label: "Lecture Story" },
  materials: { Icon: FolderArchive, color: "#f97316", label: "Materials" },
  recordings: { Icon: Mic2, color: "#ec4899", label: "Recordings" },
  flashcards: { Icon: Brain, color: "#f59e0b", label: "Flashcards" },
  questions: { Icon: CheckCircle2, color: "#10b981", label: "Quiz" },
  notes: { Icon: AlignLeft, color: "#fb7185", label: "Notes" },
  checklist: { Icon: ListChecks, color: "#818cf8", label: "Checklist" },
};
const font = (
  size: number,
  color: string,
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
function FeedPanel({
  section,
  count,
  children,
}: {
  section: string;
  count?: number;
  children: React.ReactNode;
}) {
  const { colors } = useTheme(),
    { Icon, color, label } = meta[section];
  return (
    <View
      testID={"feed-section-" + section}
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderLeftWidth: 2,
        borderColor: color + "33",
        borderLeftColor: color + "33",
        backgroundColor: colors.card + "66",
        padding: 16,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <View
          style={{
            height: 36,
            width: 36,
            borderRadius: 12,
            backgroundColor: color + "1A",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={24} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={font(14, colors.foreground, "700", 20)}>{label}</Text>
          {count !== undefined && (
            <Text
              style={{
                ...font(10, colors.mutedForeground + "99", "700"),
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              {count} {count === 1 ? "item" : "items"}
            </Text>
          )}
        </View>
      </View>
      {children}
    </View>
  );
}
function FeedEmpty({ section, label }: { section: string; label: string }) {
  const { colors } = useTheme(),
    { Icon, color } = meta[section];
  return (
    <View style={{ paddingVertical: 32, alignItems: "center" }}>
      <View
        style={{
          height: 40,
          width: 40,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: color + "33",
          backgroundColor: color + "1A",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={20} color={color} />
      </View>
      <Text
        style={{
          ...font(12, colors.mutedForeground, "400", 16),
          marginTop: 12,
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </View>
  );
}
export function LectureFeedSection() {
  const { id: moduleId, lectureId } = useLocalSearchParams<{
      id: string;
      lectureId: string;
    }>(),
    resource = useLecture(lectureId ?? ""),
    lecture = resource.data,
    quiz = useQuizData(lectureId ?? "", "lecture"),
    { colors } = useTheme(),
    { viewportWidth, width, viewportHeight } = useStudentDimensions(),
    insets = useSafeAreaInsets(),
    router = useRouter(),
    offline = useOfflineDownloads();
  const [modal, setModal] = useState<
      "flashcards" | "questions" | "notes" | null
    >(null),
    [openRecord, setOpenRecord] = useState<string | null>(null),
    [completed, setCompleted] = useState<Set<string>>(new Set()),
    [downloading, setDownloading] = useState<string | null>(null),
    [recordWidth, setRecordWidth] = useState(width - 70);
  const page = useRef<ScrollView>(null);
  const desktop = viewportWidth >= 768;
  if (!lecture)
    return (
      <ResourceState
        title="Lecture feed"
        error={resource.error}
        onRetry={() => resource.refetch()}
      />
    );
  if (!lecture.subject || lecture.subject.module.id !== moduleId)
    return (
      <ResourceState
        title="Lecture feed"
        notFound
        onRetry={() => resource.refetch()}
      />
    );
  const title = lectureTitleCase(lecture.title),
    hub = `/modules/${encodeURIComponent(
      moduleId
    )}/lectures/${encodeURIComponent(lectureId)}`,
    questionCount =
      quiz.data?.questions.length ??
      (lecture.questionCount === 0 ? 0 : undefined),
    items = lecture.checklist?.items ?? [],
    extras = lecture.extras,
    done = completed.size;
  const toggle = (id: string) =>
    setCompleted((previous) => {
      const next = new Set(previous);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const open = (raw?: string) => {
    if (isFixtureMode()) {
      Alert.alert("Guest preview", "Sample media stays on this device.");
      return;
    }
    try {
      const url = new URL(raw ?? "");
      if (url.protocol !== "https:") throw Error();
      void Linking.openURL(url.href).catch(() =>
        Alert.alert("Media unavailable", "This link could not open.")
      );
    } catch {
      Alert.alert(
        "Media unavailable",
        "This item has no supported source link."
      );
    }
  };
  const download = async (file: (typeof lecture.files)[number]) => {
    if (isFixtureMode()) {
      Alert.alert(
        "Guest preview",
        "Sample files stay on this device. No file was downloaded."
      );
      return;
    }
    if (downloading) return;
    try {
      if (!file.url) throw Error("This file has no download link.");
      setDownloading(file.id);
      await saveOfflineFile(offline.scope, {
        ...file,
        url: file.url,
        moduleId,
        lectureId,
      });
      await offline.refresh();
      Alert.alert(
        "Saved offline",
        "This file is now available in Downloads on this device."
      );
    } catch (error) {
      Alert.alert(
        "Download unavailable",
        error instanceof Error
          ? error.message
          : "This file could not be downloaded."
      );
    } finally {
      setDownloading(null);
    }
  };
  const action = (
    label: string,
    color: string,
    Icon: any,
    onPress: () => void,
    outline = false
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: outline ? 1 : 0,
        borderColor: color + "4D",
        backgroundColor: outline ? color + "1A" : color,
      }}
    >
      <Icon
        size={14}
        color={outline ? color : color === "#f59e0b" ? "#451a03" : "#022c22"}
      />
      <Text
        style={{
          ...font(
            11,
            outline ? color : color === "#f59e0b" ? "#451a03" : "#022c22",
            "900"
          ),
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
  const ring = (size: number, stroke: number) => {
    const radius = size === 52 ? 22 : 13;
    return (
      <View style={{ width: size, height: size }}>
        <Svg
          width={size}
          height={size}
          style={{ transform: [{ rotate: "-90deg" }] }}
        >
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#ffffff14"
            strokeWidth={stroke}
            fill="none"
          />
          {lecture.isCompleted === true && (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#8b5cf6"
              strokeWidth={stroke}
              fill="none"
            />
          )}
        </Svg>
        {size === 52 && (
          <View
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              right: 0,
              bottom: 0,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={font(11, colors.foreground, "800")}>
              {lecture.isCompleted === undefined
                ? "?"
                : lecture.isCompleted
                ? "✓"
                : "—"}
            </Text>
          </View>
        )}
      </View>
    );
  };
  const continueStudy = () => router.push(hub as never),
    renderPractice = (
      content: React.ReactNode,
      nav?: React.ReactNode,
      header?: React.ReactNode
    ) => (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView
          contentContainerStyle={{
            paddingBottom: SCROLL_BOTTOM_PAD + insets.bottom,
          }}
          stickyHeaderIndices={header ? [0] : undefined}
        >
          {header}
          {content}
        </ScrollView>
        {nav}
      </View>
    );
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        ref={page}
        testID="lecture-feed-scroll"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: desktop ? 0 : insets.top + 64,
          paddingBottom: SCROLL_BOTTOM_PAD + insets.bottom,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 4,
          }}
        >
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push(`/modules/${moduleId}` as never)}
            style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <ArrowLeft size={12} color={colors.mutedForeground + "80"} />
            <Text
              style={{
                ...font(10, colors.mutedForeground + "80", "700"),
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              {lecture.subject.module.name}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Lecture AI"
            onPress={() =>
              Alert.alert(
                "Lecture AI",
                "Open AI Chat from the main menu. No AI request was sent."
              )
            }
            style={{
              height: 32,
              width: 32,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#8b5cf640",
              backgroundColor: "#8b5cf61A",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles size={14} color="#a78bfa" />
          </Pressable>
        </View>
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 16,
            gap: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 9,
                paddingVertical: 3,
                borderRadius: 99,
                backgroundColor: "#8b5cf61A",
                borderWidth: 1,
                borderColor: "#8b5cf640",
              }}
            >
              {lecture.type === "PRACTICAL" ? (
                <Microscope size={10} color="#a78bfa" />
              ) : (
                <BookOpen size={10} color="#a78bfa" />
              )}
              <Text
                style={{
                  ...font(9, "#a78bfa", "900"),
                  letterSpacing: 1.35,
                  textTransform: "uppercase",
                }}
              >
                {lecture.type === "PRACTICAL"
                  ? "Practical"
                  : lecture.subject.name || "Lecture"}
              </Text>
            </View>
            {lecture.order != null && (
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 2,
                  borderRadius: 99,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: "#ffffff0A",
                }}
              >
                <Text
                  style={{
                    ...font(9, colors.mutedForeground + "80", "700"),
                    letterSpacing: 0.9,
                  }}
                >
                  #{lecture.order}
                </Text>
              </View>
            )}
          </View>
          <Text
            testID="feed-title"
            style={{
              ...font(22, colors.foreground, "700", 27.5),
              letterSpacing: -0.55,
            }}
          >
            {title}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue studying"
            onPress={continueStudy}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: "transparent",
            }}
          >
            <LinearGradient pointerEvents="none" colors={["#8b5cf614","#ec48990D"]} start={{x:0,y:0}} end={{x:1,y:1}} style={{position:"absolute",left:0,right:0,top:0,bottom:0,borderRadius:16}}/>
            {ring(52, 4)}
            <View style={{ flex: 1 }}>
              <Text style={font(14, colors.foreground, "700", 20)}>
                Continue studying
              </Text>
              <Text style={font(11, colors.mutedForeground + "99")}>
                {lecture.isCompleted === true
                  ? "Lecture complete"
                  : lecture.isCompleted === false
                  ? "Lecture in progress"
                  : "Progress unavailable"}
              </Text>
            </View>
            <View
              style={{
                height: 32,
                width: 32,
                borderRadius: 12,
                backgroundColor: "#8b5cf6",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Play size={14} color="#2e1065" />
            </View>
          </Pressable>
        </View>
        <View style={{ paddingHorizontal: 16, gap: 16 }}>
          <FeedPanel section="overview">
            {typeof extras?.overviewStory === "string" &&
            extras.overviewStory ? (
              <View style={{ maxHeight: 144, overflow: "hidden" }}>
                <WebsiteMarkdown markdown={extras.overviewStory} />
              </View>
            ) : Array.isArray(extras?.overviewCards) &&
              extras.overviewCards.length ? (
              <View style={{ gap: 12 }}>
                {extras.overviewCards.slice(0, 2).map((card, i) => (
                  <View
                    key={i}
                    style={{
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.card + "99",
                      padding: 12,
                    }}
                  >
                    <Text
                      style={{
                        ...font(12, colors.foreground, "700", 16),
                        marginBottom: 4,
                      }}
                    >
                      {card.title}
                    </Text>
                    <Text
                      numberOfLines={2}
                      style={font(11, colors.mutedForeground)}
                    >
                      {card.body}
                    </Text>
                  </View>
                ))}
                {extras.overviewCards.length > 2 && (
                  <Text
                    style={{
                      ...font(10, "#8b5cf6", "700"),
                      textAlign: "center",
                    }}
                  >
                    +{extras.overviewCards.length - 2} more
                  </Text>
                )}
              </View>
            ) : (
              <FeedEmpty section="overview" label="No overview yet" />
            )}
          </FeedPanel>
          <FeedPanel section="materials" count={lecture.files.length}>
            {lecture.files.length ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginHorizontal: -16 }}
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingBottom: 4,
                  gap: 8,
                }}
              >
                {lecture.files.map((file) => {
                  const color = file.mimeType?.includes("pdf")
                    ? "#ef4444"
                    : file.mimeType?.includes("image")
                    ? "#0ea5e9"
                    : colors.mutedForeground;
                  return (
                    <View
                      key={file.id}
                      style={{
                        width: 112,
                        padding: 12,
                        gap: 8,
                        alignItems: "center",
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: colors.card + "99",
                      }}
                    >
                      <View
                        style={{
                          height: 36,
                          width: 36,
                          borderRadius: 8,
                          backgroundColor: color + "1A",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <FileText size={16} color={color} />
                      </View>
                      <Text
                        numberOfLines={1}
                        style={{
                          ...font(10, colors.foreground, "700"),
                          width: "100%",
                          textAlign: "center",
                        }}
                      >
                        {file.name}
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={"Download " + file.name}
                        onPress={() => void download(file)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          backgroundColor: colors.muted,
                        }}
                      >
                        <Download
                          size={10}
                          color={colors.mutedForeground + "CC"}
                        />
                        <Text
                          style={{
                            ...font(9, colors.mutedForeground + "CC", "700"),
                            letterSpacing: 0.9,
                          }}
                        >
                          {downloading === file.id ? "..." : "DL"}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <FeedEmpty section="materials" label="No materials yet" />
            )}
          </FeedPanel>
          <FeedPanel section="recordings" count={lecture.records.length}>
            {lecture.records.length ? (
              <View style={{ gap: 8 }}>
                {lecture.records.map((record) => {
                  let provider = "other",
                    embed = "";
                  try {
                    const u = new URL(record.url || "");
                    if (
                      u.protocol === "https:" &&
                      ["youtube.com", "www.youtube.com", "youtu.be"].includes(
                        u.hostname
                      )
                    )
                      provider = "youtube";
                    const m = u.pathname.match(
                      /^\/(track|episode|album)\/([a-zA-Z0-9]+)$/
                    );
                    if (
                      u.protocol === "https:" &&
                      u.hostname === "open.spotify.com" &&
                      m
                    ) {
                      provider = "spotify";
                      embed = `https://open.spotify.com/embed/${m[1]}/${m[2]}`;
                    }
                  } catch {}
                  const opened = openRecord === record.id,
                    color =
                      provider === "youtube"
                        ? "#ef4444"
                        : provider === "spotify"
                        ? "#22c55e"
                        : "#ec4899",
                    Icon =
                      provider === "youtube"
                        ? Youtube
                        : provider === "spotify"
                        ? Music2
                        : Radio;
                  return (
                    <View
                      key={record.id}
                      style={{
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: opened ? "#ec489933" : colors.border,
                        overflow: "hidden",
                      }}
                    >
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={"Play recording " + record.title}
                        onPress={() => setOpenRecord(opened ? null : record.id)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 12,
                          padding: 12,
                        }}
                      >
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            backgroundColor: color + "1A",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Icon size={16} color={color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            numberOfLines={1}
                            style={font(12, colors.foreground, "700")}
                          >
                            {record.title}
                          </Text>
                          <Text
                            style={{
                              ...font(9, colors.mutedForeground, "700"),
                              letterSpacing: 0.9,
                              textTransform: "uppercase",
                            }}
                          >
                            {provider === "other"
                              ? record.sourceType
                              : provider}
                          </Text>
                        </View>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 4,
                            borderRadius: 99,
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            backgroundColor: opened
                              ? "#ec489926"
                              : colors.muted,
                          }}
                        >
                          <Play
                            size={10}
                            color={opened ? "#ec4899" : colors.mutedForeground}
                          />
                          <Text
                            style={{
                              ...font(
                                9,
                                opened ? "#ec4899" : colors.mutedForeground,
                                "900"
                              ),
                              letterSpacing: 0.9,
                              textTransform: "uppercase",
                            }}
                          >
                            {opened ? "Now" : "Play"}
                          </Text>
                        </View>
                      </Pressable>
                      {opened && (
                        <View
                          onLayout={(e) =>
                            setRecordWidth(e.nativeEvent.layout.width)
                          }
                          style={{
                            borderTopWidth: 1,
                            borderColor: colors.border,
                          }}
                        >
                          {isFixtureMode() ? (
                            <Pressable
                              onPress={() => open(record.url)}
                              style={{ padding: 16 }}
                            >
                              <Text style={font(12, colors.primary, "700")}>
                                Open Recording
                              </Text>
                            </Pressable>
                          ) : provider === "spotify" ? (
                            <SpotifyRecordFrame url={embed} />
                          ) : provider === "youtube" && record.url ? (
                            <LectureVideoPlayer
                              url={record.url}
                              title={record.title}
                              height={(recordWidth * 9) / 16}
                            />
                          ) : (
                            <Pressable
                              accessibilityRole="link"
                              onPress={() => open(record.url)}
                              style={{
                                padding: 16,
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 8,
                              }}
                            >
                              <ExternalLink
                                size={14}
                                color={colors.mutedForeground}
                              />
                              <Text style={font(12, colors.primary, "700", 16)}>
                                Open Recording
                              </Text>
                            </Pressable>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            ) : (
              <FeedEmpty section="recordings" label="No recordings yet" />
            )}
          </FeedPanel>
          <FeedPanel section="flashcards" count={lecture.flashcards.length}>
            {lecture.flashcards.length ? (
              <View style={{ gap: 12 }}>
                <View
                  style={{
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#f59e0b33",
                    backgroundColor: "#f59e0b08",
                    padding: 16,
                  }}
                >
                  <Text
                    style={{
                      ...font(10, "#f59e0b", "700"),
                      textAlign: "center",
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      marginBottom: 8,
                    }}
                  >
                    Sample Card
                  </Text>
                  <Text
                    style={{
                      ...font(14, colors.foreground, "700", 22.75),
                      textAlign: "center",
                    }}
                  >
                    {lecture.flashcards[0].front}
                  </Text>
                </View>
                {action("Start Review", "#f59e0b", Play, () =>
                  setModal("flashcards")
                )}
              </View>
            ) : (
              <FeedEmpty section="flashcards" label="No flashcards yet" />
            )}
          </FeedPanel>
          <FeedPanel section="questions" count={questionCount}>
            {questionCount ? (
              <View style={{ gap: 12 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#10b98133",
                    backgroundColor: "#10b98108",
                    padding: 12,
                  }}
                >
                  <Star size={20} color="#10b981" />
                  <View>
                    <Text style={font(12, colors.foreground, "700", 16)}>
                      {questionCount} questions
                    </Text>
                    <Text style={font(10, colors.mutedForeground + "99")}>
                      Review your knowledge
                    </Text>
                  </View>
                </View>
                {action("Take Quiz", "#10b981", Play, () =>
                  setModal("questions")
                )}
              </View>
            ) : questionCount === 0 ? (
              <FeedEmpty section="questions" label="No quiz yet" />
            ) : (
              <Text style={font(12, colors.mutedForeground)}>
                {quiz.error ? "Quiz unavailable" : "Loading questions..."}
              </Text>
            )}
          </FeedPanel>
          <FeedPanel section="notes">
            {lecture.notesMarkdown ? (
              <View style={{ gap: 12 }}>
                <View
                  style={{
                    borderRadius: 12,
                    backgroundColor: colors.muted + "4D",
                    padding: 12,
                  }}
                >
                  <Text
                    numberOfLines={3}
                    style={font(11, colors.mutedForeground, "400", 17.875)}
                  >
                    {lecture.notesMarkdown
                      .replace(/[#*`\[\]]/g, "")
                      .slice(0, 100)
                      .trim()}
                    ...
                  </Text>
                </View>
                {action(
                  "Open & Annotate",
                  "#fb7185",
                  AlignLeft,
                  () => setModal("notes"),
                  true
                )}
              </View>
            ) : (
              <FeedEmpty section="notes" label="No notes yet" />
            )}
          </FeedPanel>
          {items.length > 0 && (
            <FeedPanel section="checklist" count={items.length}>
              <View style={{ gap: 12 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      height: 8,
                      flex: 1,
                      borderRadius: 99,
                      backgroundColor: colors.muted,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        height: 8,
                        width: `${Math.round((done / items.length) * 100)}%`,
                        backgroundColor: "#6366f1",
                        borderRadius: 99,
                      }}
                    />
                  </View>
                  <Text style={font(10, colors.mutedForeground, "700")}>
                    {done}/{items.length}
                  </Text>
                </View>
                <ScrollView
                  nestedScrollEnabled
                  style={{ maxHeight: 192 }}
                  contentContainerStyle={{ gap: 6 }}
                >
                  {items.map((item) => (
                    <Pressable
                      key={item.id}
                      accessibilityRole="checkbox"
                      accessibilityLabel={item.content}
                      accessibilityState={{ checked: completed.has(item.id) }}
                      aria-checked={completed.has(item.id)}
                      onPress={() => toggle(item.id)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        borderRadius: 12,
                        padding: 12,
                        backgroundColor: completed.has(item.id)
                          ? "#6366f10A"
                          : colors.card + "99",
                      }}
                    >
                      <View
                        style={{
                          height: 20,
                          width: 20,
                          borderRadius: 99,
                          borderWidth: 2,
                          borderColor: completed.has(item.id)
                            ? "#6366f1"
                            : colors.mutedForeground + "4D",
                          backgroundColor: completed.has(item.id)
                            ? "#6366f1"
                            : "transparent",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {completed.has(item.id) && (
                          <CheckCircle2 size={12} color="#fff" />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            ...font(
                              12,
                              completed.has(item.id)
                                ? colors.mutedForeground + "80"
                                : colors.foreground,
                              "700",
                              16
                            ),
                            textDecorationLine: completed.has(item.id)
                              ? "line-through"
                              : "none",
                          }}
                        >
                          {item.content}
                        </Text>
                        {item.isCritical && (
                          <View
                            style={{
                              alignSelf: "flex-start",
                              marginTop: 4,
                              borderRadius: 99,
                              backgroundColor: "#ef44441A",
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                            }}
                          >
                            <Text
                              style={{
                                ...font(8, "#ef4444", "900"),
                                letterSpacing: 0.8,
                                textTransform: "uppercase",
                              }}
                            >
                              Critical
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text
                        style={font(9, colors.mutedForeground + "66", "700")}
                      >
                        +{item.points}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </FeedPanel>
          )}
        </View>
      </ScrollView>
      <View
        style={{
          position: "absolute",
          left: 14,
          right: 14,
          bottom: 16 + insets.bottom,
          zIndex: 30,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border + "4D",
          backgroundColor: "#12121CE0",
          paddingHorizontal: 14,
          paddingVertical: 10,
        }}
      >
        {ring(32, 4)}
        <View style={{ flex: 1 }}>
          <Text style={font(11.5, colors.foreground, "700", 14.375)}>
            Continue studying
          </Text>
          <Text
            style={{
              ...font(9.5, colors.mutedForeground + "99", "400", 11.875),
              marginTop: 2,
            }}
          >
            Choose a lecture section
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open lecture sections"
          onPress={continueStudy}
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: "#8b5cf6",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Play size={16} color="#2e1065" />
        </Pressable>
      </View>
      {!desktop && <FloatingStudentHeader title="Library" />}
      <FadeEdges />
      <Modal
        visible={modal !== null}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setModal(null)}
      >
        <View
          style={{
            flex: 1,
            paddingTop: insets.top,
            backgroundColor: colors.background,
          }}
        >
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderColor: colors.border,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={font(14, colors.foreground, "700", 20)}>
              {modal === "questions"
                ? "Quiz"
                : modal === "flashcards"
                ? "Flashcards"
                : "Notes"}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close study section"
              onPress={() => setModal(null)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: colors.muted,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={16} color={colors.mutedForeground} />
            </Pressable>
          </View>
          {modal === "flashcards" ? (
            <LectureFlashcardPractice
              cards={lecture.flashcards}
              standalone={false}
              renderPage={renderPractice}
            />
          ) : modal === "questions" ? (
            <LectureQuestionPractice
              lectureId={lectureId}
              renderPage={renderPractice}
            />
          ) : modal === "notes" ? (
            <ScrollView
              contentContainerStyle={{
                padding: 20,
                paddingBottom: SCROLL_BOTTOM_PAD,
              }}
            >
              <Text
                style={{
                  ...font(12, colors.mutedForeground),
                  marginBottom: 16,
                }}
              >
                Read-only notes. Annotations are not saved from this version.
              </Text>
              <WebsiteMarkdown markdown={lecture.notesMarkdown} />
            </ScrollView>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}
