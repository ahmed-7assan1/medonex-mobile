import {lectureSurface} from '@/lib/lecture-surface';
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
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
import { SvgXml } from "react-native-svg";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Check,
  MessageSquareWarning,
  Minus,
  RotateCcw,
  X,
  Zap,
} from "lucide-react-native";
import { useTheme } from "@/theme/ThemeContext";
import { useStudentDimensions } from "@/lib/student-viewport";
import { useLecture } from "@/lib/lecture";
import { lectureTitleCase } from "@/lib/lecture-format";
import { SCROLL_BOTTOM_PAD } from "@/theme/tokens";
import { ResourceState } from "@/components/ResourceState";
import { FadeEdges } from "@/components/FadeEdges";
import { FloatingStudentHeader } from "@/components/FloatingStudentHeader";
import { StudentOverlay } from "@/components/StudentOverlay";
import { WebsiteFlashcardFace } from "./WebsiteFlashcardFace";
const shareIcon = require("../../../assets/lecture-share-icon.json")
  .share as string;
export function LectureFlashcardSection() {
  const { id: moduleId, lectureId } = useLocalSearchParams<{
      id: string;
      lectureId: string;
    }>(),
    resource = useLecture(lectureId ?? ""),
    lecture = resource.data,
    { colors } = useTheme(),
    { viewportWidth, width } = useStudentDimensions(),
    insets = useSafeAreaInsets(),
    router = useRouter();
  const desktop = viewportWidth >= 768,
    hub = `/modules/${encodeURIComponent(
      moduleId ?? ""
    )}/lectures/${encodeURIComponent(lectureId ?? "")}`;
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
  if (!lecture)
    return (
      <ResourceState
        title="Flashcards"
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
  const title = lectureTitleCase(lecture.title),
    crumbs = [
      { label: "Modules", path: "/modules" },
      { label: subject.module.name, path: `/modules/${moduleId}`, max: 100 },
      {
        label: subject.name,
        path: `/modules/${moduleId}/subjects/${subject.id}`,
        max: 100,
      },
      { label: title, path: hub, max: 140 },
    ];
  const page = (
    content: React.ReactNode,
    nav: React.ReactNode = null,
    header: React.ReactNode = null
  ) => (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        testID="lecture-flashcards-scroll"
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
          testID="flashcards-breadcrumbs"
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
            marginBottom: 24,
          }}
        >
          {crumbs.map((crumb) => (
            <React.Fragment key={crumb.path}>
              <Pressable
                accessibilityRole="link"
                onPress={() => router.push(crumb.path as never)}
                style={{ maxWidth: crumb.max }}
              >
                <Text
                  numberOfLines={1}
                  style={f(14, colors.mutedForeground, "400", 20)}
                >
                  {crumb.label}
                </Text>
              </Pressable>
              <Text style={f(14, colors.mutedForeground, "400", 20)}>/</Text>
            </React.Fragment>
          ))}
          <Text style={f(14, colors.foreground, "500", 20)}>Flashcards</Text>
        </View>
        <Text
          testID="flashcards-title"
          style={{
            ...f(
              desktop ? 24 : 20,
              colors.foreground,
              "700",
              desktop ? 32 : 28
            ),
            letterSpacing: -(desktop ? 24 : 20) * 0.025,
            marginBottom: 24,
          }}
        >
          Flashcards — {title}
        </Text>
        {header}
        {content}
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push(hub as never)}
          style={{ marginTop: 32, alignSelf: "flex-start" }}
        >
          <Text style={f(14, colors.primary, "500", 20)}>
            ← Back to lecture sections
          </Text>
        </Pressable>
      </ScrollView>
      {nav && <StudentOverlay>{nav}</StudentOverlay>}
      {!desktop && <FloatingStudentHeader title="Library" />}
      <FadeEdges />
    </View>
  );
  return lecture.flashcards.length > 0 ? (
    <LectureFlashcardPractice cards={lecture.flashcards} renderPage={page} />
  ) : (
    page(
      <View
        testID="lecture-flashcards-empty"
        style={{
          paddingVertical: 48,
          borderRadius: 12,
          borderWidth: 1,
          borderStyle: "dashed",
          borderColor: colors.border,
        }}
      >
        <Text
          style={{
            ...f(14, colors.mutedForeground, "400", 20),
            textAlign: "center",
          }}
        >
          No flashcards for this lecture yet.
        </Text>
      </View>
    )
  );
}

export function LectureFlashcardPractice({
  cards,
  renderPage,
  standalone = true,
  obsidian = false,
}: {
  cards: { id: string; front: string; back: string }[];
  standalone?: boolean;
  obsidian?: boolean;
  renderPage: (
    content: React.ReactNode,
    nav?: React.ReactNode,
    header?: React.ReactNode
  ) => React.ReactNode;
}) {
  const { colors, st:themeSt, isDark } = useTheme(),
    { viewportWidth, viewportHeight, width } = useStudentDimensions(),
    insets = useSafeAreaInsets();
  const desktop = viewportWidth >= 768,hubMobile=obsidian&&viewportWidth<=768;
  const st=lectureSurface(themeSt,isDark,hubMobile);
  const [index, setIndex] = useState(0),
    [flipped, setFlipped] = useState(false),
    [jump, setJump] = useState(false);
  const [area, setArea] = useState(width - (desktop ? 48 : 32));
  const deck = useRef<ScrollView>(null),
    flip = useRef(new Animated.Value(0)).current;
  const slideWidth =
      (area + 16) *
      (viewportWidth >= 1024
        ? 736 / (area + 16)
        : viewportWidth >= 640
        ? 0.72
        : 0.88),
    cardWidth = slideWidth - 16,
    cardHeight = Math.min(viewportHeight * 0.52, 500),
    maxOffset = Math.max(0, slideWidth * cards.length - (area + 16));
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
  const to = (next: number) => {
    const n = Math.max(0, Math.min(cards.length - 1, next));
    setIndex(n);
    setFlipped(false);
    flip.setValue(0);
    deck.current?.scrollTo({
      x: Math.min(n * slideWidth, maxOffset),
      animated: true,
    });
  };
  const flipCard = () => {
    const next = !flipped;
    Animated.timing(flip, {
      toValue: next ? 1 : 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
    setFlipped(next);
  };
  const blocked = (action: string) =>
    Alert.alert(
      "Read-only practice",
      action + " is not sent from this version."
    );
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const handler = (event: KeyboardEvent) => {
      if (
        ["INPUT", "TEXTAREA"].includes((event.target as HTMLElement)?.tagName)
      )
        return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        to(index + 1);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        to(index - 1);
      }
      if (event.key === "Escape") setJump(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [index, slideWidth, maxOffset]);
  const header = (
    <View
      testID="flashcard-deck-header"
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
      }}
    >
      <View>
        <Text
          style={{
            ...f(11, hubMobile?"#5f5f68":colors.mutedForeground, hubMobile?"500":"600", hubMobile?17.05:18.15),
            textTransform: "uppercase",
            letterSpacing: 0.55,
          }}
        >
          Flashcard
        </Text>
        <Text
          style={{
            ...f(hubMobile?20:desktop ? 20 : 18, hubMobile?st.text:colors.foreground, hubMobile?"500":"700", hubMobile?31:28),
            letterSpacing: -(desktop ? 20 : 18) * 0.025,
          }}
        >
          {index + 1} <Text style={{ color: colors.mutedForeground }}>/</Text>{" "}
          {cards.length}
        </Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
        <View style={{ alignItems: "flex-end", gap: 4, paddingTop: 2 }}>
          <Text
            accessibilityLabel="Review status unavailable"
            style={f(12, isDark ? "#fbbf24" : "#d97706", "500", 16)}
          >
            Review status unavailable
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Restart flashcards"
            onPress={() => to(0)}
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <RotateCcw size={12} color={colors.mutedForeground} />
            <Text style={f(12, colors.mutedForeground, "400", 16)}>
              Restart
            </Text>
          </Pressable>
        </View>
        <View style={{ flexDirection: "row", gap: 4 }}>
          {[
            { label: "Report flashcard", Icon: MessageSquareWarning },
            { label: "Save flashcard", Icon: Bookmark },
            { label: "Share flashcard", Icon: null },
          ].map(({ label, Icon }) => (
            <Pressable
              key={label}
              accessibilityRole="button"
              accessibilityLabel={label}
              onPress={() => blocked(label)}
              style={{
                width:hubMobile?32:30,
                height:hubMobile?32:30,
                borderRadius: 15,
                borderWidth: 1,
                borderColor: colors.border + "4D",
                backgroundColor: hubMobile?st.surfacePressed:colors.card + "99",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {Icon ? (
                <Icon size={16} color={hubMobile?st.muted:colors.foreground + "CC"} />
              ) : (
                <SvgXml
                  xml={shareIcon.replaceAll(
                    "currentColor",
                    colors.foreground + "CC"
                  )}
                  width={15}
                  height={15}
                />
              )}
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
  const bottom = (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        paddingTop: 20,
        paddingBottom: Math.max(16, insets.bottom),
        alignItems: "center",
      }}
    >
      <View
        accessibilityRole="toolbar"
        accessibilityLabel="Flashcard navigation"
        style={{ flexDirection: "row", gap: 12, alignItems: "center" }}
      >
        {["previous", "jump", "next"].map((type, i) => (
          <Pressable
            key={type}
            accessibilityRole="button"
            accessibilityLabel={
              type === "jump"
                ? `Card ${index + 1} of ${cards.length}, jump to card`
                : type === "previous"
                ? "Previous card"
                : "Next card"
            }
            accessibilityState={
              type === "jump" ? { expanded: jump } : undefined
            }
            disabled={
              type === "previous"
                ? index === 0
                : type === "next"
                ? index === cards.length - 1
                : false
            }
            onPress={() =>
              type === "jump"
                ? setJump((v) => !v)
                : to(index + (i === 0 ? -1 : 1))
            }
            style={{
              width:hubMobile?40:36,
              height:hubMobile?40:36,
              borderRadius:hubMobile?20:18,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: hubMobile?st.surface:colors.card + "99",
              borderWidth: type === "jump" ? 0 : 1,
              borderColor: hubMobile?st.border:colors.border + "4D",
              opacity:
                (type === "previous" && index === 0) ||
                (type === "next" && index === cards.length - 1)
                  ? 0.4
                  : 1,
            }}
          >
            {type === "jump" ? (
              <>
                <Svg
                  width={hubMobile?40:36}
                  height={hubMobile?40:36}
                  style={{
                    position: "absolute",
                    transform: [{ rotate: "-90deg" }],
                  }}
                >
                  <Circle
                    cx={hubMobile?20:18}
                    cy={hubMobile?20:18}
                    r={hubMobile?17:15}
                    fill="none"
                    stroke={hubMobile?st.border:colors.border}
                    strokeWidth={2.5}
                  />
                  <Circle
                    cx={hubMobile?20:18}
                    cy={hubMobile?20:18}
                    r={hubMobile?17:15}
                    fill="none"
                    stroke={hubMobile?"#2f80ed":colors.primary}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * (hubMobile?17:15)}
                    strokeDashoffset={
                      2 * Math.PI * (hubMobile?17:15) * (1 - (index + 1) / cards.length)
                    }
                  />
                </Svg>
                <Text style={f(hubMobile?12:10, hubMobile?st.text:colors.foreground, hubMobile?"500":"700", hubMobile?12:10)}>
                  {index + 1}
                </Text>
              </>
            ) : type === "previous" ? (
              <ChevronLeft size={16} color={hubMobile?st.text:colors.mutedForeground} />
            ) : (
              <ChevronRight size={16} color={hubMobile?st.text:colors.mutedForeground} />
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
  const overlay = (
    <>
      {!desktop && standalone && (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: insets.top + 52,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderBottomWidth: 1,
            borderBottomColor: colors.border + "66",
            backgroundColor: colors.background + (isDark ? "BF" : "D9"),
            zIndex: 6,
          }}
        >
          {header}
        </View>
      )}
      {bottom}
      {jump && (
        <Modal
          visible
          transparent
          animationType="slide"
          onRequestClose={() => setJump(false)}
        >
          <View style={{ flex: 1, justifyContent: "flex-end" }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close card navigator backdrop"
              onPress={() => setJump(false)}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                backgroundColor: "#00000066",
              }}
            />
            <View
              accessibilityRole="summary"
              accessibilityLabel="Jump to card"
              style={{
                maxHeight: viewportHeight * 0.7,
                width: "100%",
                maxWidth: 512,
                alignSelf: "center",
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                borderTopWidth: 1,
                borderColor: colors.border + "66",
                backgroundColor: colors.background,
                paddingTop: 12,
              }}
            >
              <View
                style={{
                  height: 4,
                  width: 40,
                  borderRadius: 2,
                  alignSelf: "center",
                  backgroundColor: colors.mutedForeground + "40",
                  marginBottom: 4,
                }}
              />
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingBottom: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{
                    ...f(10, colors.mutedForeground, "900", 16),
                    letterSpacing: 1,
                    textTransform: "uppercase",
                  }}
                >
                  Jump to card
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close card navigator"
                  onPress={() => setJump(false)}
                  style={{ padding: 8 }}
                >
                  <X size={16} color={colors.mutedForeground} />
                </Pressable>
              </View>
              <ScrollView
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingBottom: 84 + insets.bottom,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    gap: 8,
                    paddingTop: 8,
                  }}
                >
                  {cards.map((card, i) => (
                    <Pressable
                      key={card.id}
                      accessibilityRole="button"
                      accessibilityLabel={"Card " + (i + 1)}
                      onPress={() => {
                        to(i);
                        setJump(false);
                      }}
                      style={{
                        minWidth: 44,
                        height: 44,
                        borderRadius: 8,
                        borderWidth: 2,
                        borderColor:
                          i === index ? colors.primary : colors.border,
                        backgroundColor:
                          i === index ? colors.primary + "1A" : colors.card,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text style={f(12, colors.foreground, "700", 16)}>
                        {i + 1}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
  return renderPage(
    <View
      testID="flashcard-practice"
      // Read the layout synchronously: Fabric resets synthetic events after
      // dispatch, so touching e.nativeEvent inside the deferred setState
      // updater crashes with "Cannot read property 'layout' of null" when
      // React runs the updater during a later render.
      onLayout={(e) => {
        const nextWidth = e.nativeEvent.layout.width;
        setArea((old) => (old === nextWidth ? old : nextWidth));
      }}
      style={{ width: "100%", gap: 24 }}
    >
      <View style={{ gap: 12 }}>
        {desktop || !standalone ? header : <View style={{ height: 56 }} />}
        <View
          accessibilityLabel="Review progress unavailable"
          style={{
            height:hubMobile?3:8,
            borderRadius: 99,
            backgroundColor: hubMobile?st.border:colors.muted,
            overflow: "hidden",
          }}
        />
      </View>
      <View style={{ marginHorizontal: -8, overflow: "hidden" }}>
        <ScrollView
          ref={deck}
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={slideWidth}
          onMomentumScrollEnd={(e) => {
            const offset = e.nativeEvent.contentOffset.x;
            const n =
              offset >= maxOffset - 1
                ? cards.length - 1
                : Math.round(offset / slideWidth);
            setIndex(Math.max(0, n));
            setFlipped(false);
          }}
        >
          {cards.map((card, i) => (
            <View
              key={card.id}
              style={{
                width: slideWidth,
                paddingHorizontal: 8,
                paddingVertical: 12,
                opacity: i === index ? 1 : 0.4,
              }}
            >
              <Animated.View
                testID={"flashcard-face-" + i}
                style={{
                  width: cardWidth,
                  height: cardHeight,
                  borderRadius:hubMobile?22:16,
                  borderWidth:1,
                  borderColor:
                    hubMobile?st.border:i === index && flipped
                      ? colors.primary + "40"
                      : colors.border + "B3",
                  overflow: "hidden",
                  ...(Platform.OS === "web"
                    ? { boxShadow: "0 20px 45px -20px rgba(0,0,0,.28)" }
                    : {}),
                  transform:
                    Platform.OS === "web"
                      ? []
                      : [
                          { perspective: 1200 },
                          {
                            rotateY: flip.interpolate({
                              inputRange: [0, 0.5, 1],
                              outputRange: ["0deg", "90deg", "0deg"],
                            }),
                          },
                        ],
                }}
              >
                <WebsiteFlashcardFace
                  front={card.front}
                  back={card.back}
                  flipped={i === index && flipped}
                  obsidian={hubMobile}
                  height={cardHeight - (hubMobile?0:2)}
                  viewportWidth={viewportWidth}
                  viewportHeight={viewportHeight}
                  onFlip={() => (i === index ? flipCard() : to(i))}
                />
              </Animated.View>
            </View>
          ))}
        </ScrollView>
      </View>
      <View
        style={{
          marginTop: 24,
          minHeight: 48,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {flipped ? (
          <View
            style={{
              flexDirection: "row",
              gap: viewportWidth >= 640 ? 24 : 16,
              alignItems: "flex-start",
            }}
          >
            {[
              { key: "again", label: "Again", Icon: RotateCcw },
              { key: "hard", label: "Hard", Icon: Minus },
              { key: "good", label: "Good", Icon: Check },
              { key: "easy", label: "Easy", Icon: Zap },
            ].map(({ key, label, Icon }) => (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={"Rate " + label}
                onPress={() => blocked("A flashcard review")}
                style={{ width:hubMobile?62:56, alignItems: "center", gap: 6 }}
              >
                <View
                  style={{
                    height: 48,
                    width: 48,
                    borderRadius: 24,
                    backgroundColor: hubMobile?st.surfacePressed:colors.card + "99",
                    borderWidth: 1,
                    borderColor: colors.border + "4D",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Icon size={20} color={hubMobile?({again:"#e5534b",hard:"#e0a82e",good:"#2f80ed",easy:"#34c38f"}[key]):colors.foreground + "D9"} />
                </View>
                <Text
                  style={{
                    ...f(hubMobile?12:9, hubMobile?st.muted:colors.mutedForeground, hubMobile?"400":"700", hubMobile?18:13.5),
                    letterSpacing: hubMobile?0:0.9,
                    textTransform: hubMobile?"none":"uppercase",
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={f(11, colors.mutedForeground, "400", 16.5)}>
            Reveal the card to rate it — navigate below
          </Text>
        )}
      </View>
      <View style={{ height: desktop ? 112 : 176 }} />
    </View>,
    overlay
  );
}
