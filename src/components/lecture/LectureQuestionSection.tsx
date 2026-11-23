import {lectureSurface} from '@/lib/lecture-surface';
import { StudentOverlay } from "../StudentOverlay";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,

  PanResponder,
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
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Flag,
  X,
} from "lucide-react-native";
import { useTheme } from "@/theme/ThemeContext";
import { useStudentDimensions } from "@/lib/student-viewport";
import { useLecture } from "@/lib/lecture";
import { useQuizData } from "@/lib/quiz-player";
import { lectureTitleCase } from "@/lib/lecture-format";
import { SCROLL_BOTTOM_PAD } from "@/theme/tokens";
import { ResourceState } from "@/components/ResourceState";
import { FadeEdges } from "@/components/FadeEdges";
import { Sheet } from "@/components/Sheet";
import { FloatingStudentHeader } from "@/components/FloatingStudentHeader";
import { QuizQuestionContent } from "@/components/quiz/WebsiteQuestionContent";
const shareIcon = require("../../../assets/lecture-share-icon.json")
  .share as string;
export function LectureQuestionSection() {
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
        title="Questions"
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
        testID="lecture-questions-scroll"
        stickyHeaderIndices={header ? [2] : undefined}
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
          testID="questions-breadcrumbs"
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
          <Text style={f(14, colors.foreground, "500", 20)}>Questions</Text>
        </View>
        <Text
          testID="questions-title"
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
          Questions — {title}
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
  return lecture.questionCount > 0 ? (
    <LectureQuestionPractice lectureId={lecture.id} renderPage={page} />
  ) : (
    page(
      <View
        testID="lecture-questions-empty"
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
          No questions for this lecture yet.
        </Text>
      </View>
    )
  );
}
export function LectureQuestionPractice({
  lectureId,
  renderPage,
  hub = false,
}: {
  lectureId: string;
  hub?: boolean;
  renderPage: (
    content: React.ReactNode,
    nav?: React.ReactNode,
    header?: React.ReactNode
  ) => React.ReactNode;
}) {
  const resource = useQuizData(lectureId, "lecture"),
    { colors, st:themeSt, isDark } = useTheme(),
    { viewportWidth, viewportHeight } = useStudentDimensions(),
    insets = useSafeAreaInsets();
  const [answers, setAnswers] = useState<Record<string, string>>({}),
    [revealed, setRevealed] = useState<Record<string, boolean>>({}),
    [index, setIndex] = useState(0),
    [flagged, setFlagged] = useState<Set<string>>(new Set()),
    [bookmarked, setBookmarked] = useState<Set<string>>(new Set()),
    [navigatorOpen, setNavigatorOpen] = useState(false);
  const questions = resource.data?.questions ?? [],
    q = questions[index],
    total = questions.length,
    answered = questions.filter((item) => !!answers[item.id]).length,
    phoneNav = viewportWidth < 640,
    hubMobile=hub&&viewportWidth<=768;
  const st=lectureSurface(themeSt,isDark,hubMobile);
  const state = useRef({ index, total });
  state.current = { index, total };
  const slide = useRef(new Animated.Value(0)).current;
  const nav = (next: number) => {
    const value = Math.max(0, Math.min(state.current.total - 1, next));
    if (value === state.current.index) return;
    slide.setValue(value > state.current.index ? 300 : -300);
    setIndex(value);
    Animated.spring(slide, {
      toValue: 0,
      useNativeDriver: true,
      damping: 30,
      stiffness: 300,
    }).start();
  };
  const navRef = useRef(nav);
  navRef.current = nav;
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 50 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) * 2,
        onPanResponderRelease: (_, gesture) => {
          const threshold = Math.max(100, viewportWidth * 0.18);
          if (gesture.dx < -threshold || gesture.vx < -0.4)
            navRef.current(state.current.index + 1);
          else if (gesture.dx > threshold || gesture.vx > 0.4)
            navRef.current(state.current.index - 1);
        },
      }),
    [viewportWidth]
  );
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const listener = (event: KeyboardEvent) => {
      const el = event.target as HTMLElement;
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(el?.tagName) ||
        el?.isContentEditable
      )
        return;
      if (["ArrowRight", "Enter"].includes(event.key)) {
        event.preventDefault();
        navRef.current(state.current.index + 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        navRef.current(state.current.index - 1);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);
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
  if (!resource.data)
    return (
      <ResourceState
        title="Questions"
        error={resource.error}
        onRetry={() => resource.refetch()}
      />
    );
  if (!q)
    return (
      <Text style={f(14, colors.mutedForeground)}>
        No questions for this lecture yet.
      </Text>
    );
  const toggle = (items: Set<string>, set: (next: Set<string>) => void) => {
    const next = new Set(items);
    next.has(q.id) ? next.delete(q.id) : next.add(q.id);
    set(next);
  };
  const ringSize = phoneNav ? 40 : 36,
    r = phoneNav ? 17 : 15,
    circ = 2 * Math.PI * r;
  const buttons = (
    <View
      accessibilityRole="toolbar"
      accessibilityLabel="Question navigation"
      style={{
        position: "relative",
        zIndex: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        paddingTop: phoneNav ? 8 : 0,
        paddingBottom: phoneNav ? Math.max(16, insets.bottom) : 0,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Previous question"
        disabled={index === 0}
        onPress={() => nav(index - 1)}
        style={{
          width: ringSize,
          height: ringSize,
          borderRadius: 99,
          backgroundColor: phoneNav ? st.surface : colors.card + "99",
          borderWidth: 1,
          borderColor: phoneNav ? st.border : colors.border + "4D",
          alignItems: "center",
          justifyContent: "center",
          opacity: index === 0 ? 0.35 : 1,
        }}
      >
        <ChevronLeft
          size={16}
          color={phoneNav ? st.text : colors.mutedForeground}
        />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${answered} of ${total} answered, jump to question`}
        accessibilityState={{ expanded: navigatorOpen }}
        onPress={() => setNavigatorOpen((value) => !value)}
        style={{
          width: ringSize,
          height: ringSize,
          borderRadius: 99,
          backgroundColor: phoneNav ? st.surface : colors.card + "99",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Svg
          width={ringSize}
          height={ringSize}
          style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}
        >
          <Circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={r}
            stroke={phoneNav ? st.border : colors.border}
            strokeWidth={2.5}
            fill="none"
          />
          <Circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={r}
            stroke={phoneNav ? "#2f80ed" : colors.primary}
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - answered / total)}
          />
        </Svg>
        <Text
          style={f(
            phoneNav ? 12 : 10,
            phoneNav ? st.text : colors.foreground,
            phoneNav ? "500" : "700",
            phoneNav ? 12 : 10
          )}
        >
          {answered}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Next question"
        disabled={index === total - 1}
        onPress={() => nav(index + 1)}
        style={{
          width: ringSize,
          height: ringSize,
          borderRadius: 99,
          backgroundColor: phoneNav ? st.surface : colors.card + "99",
          borderWidth: 1,
          borderColor: phoneNav ? st.border : colors.border + "4D",
          alignItems: "center",
          justifyContent: "center",
          opacity: index === total - 1 ? 0.35 : 1,
        }}
      >
        <ChevronRight
          size={16}
          color={phoneNav ? st.text : colors.mutedForeground}
        />
      </Pressable>
    </View>
  );
  const cells = (mobile = false) => (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        justifyContent: mobile ? "center" : "flex-start",
      }}
    >
      {questions.map((item, i) => {
        const done = !!answers[item.id],
          correct = !!revealed[item.id] && answers[item.id] === item.answer,
          wrong = !!revealed[item.id] && !correct,
          flag = flagged.has(item.id);
        const color =
          i === index
            ? colors.primary
            : flag
            ? "#d97706"
            : correct
            ? "#047857"
            : wrong
            ? "#b91c1c"
            : done
            ? colors.primary
            : colors.mutedForeground;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={`Question ${i + 1}${
              done ? ", answered" : ", unanswered"
            }${flag ? ", marked for review" : ""}`}
            accessibilityState={{ selected: i === index }}
            onPress={() => {
              nav(i);
              setNavigatorOpen(false);
            }}
            style={{
              height: 44,
              minWidth: 44,
              borderRadius: mobile ? 12 : 8,
              borderWidth: mobile ? 1 : 2,
              borderColor: flag
                ? "#e0a82e"
                : i === index
                ? colors.primary
                : correct
                ? "#10b981"
                : wrong
                ? "#f87171"
                : colors.border + "99",
              backgroundColor: flag
                ? "#f59e0b26"
                : correct
                ? isDark
                  ? "#064e3b33"
                  : "#ecfdf5"
                : wrong
                ? isDark
                  ? "#7f1d1d33"
                  : "#fef2f2"
                : colors.muted + "4D",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={f(mobile ? 13 : 12, color, mobile ? "500" : "700")}>
              {i + 1}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
  const header = (
    <View style={{width:"100%",maxWidth:896,alignSelf:"center",backgroundColor:hubMobile?st.bg:colors.background,paddingTop:hubMobile?6:0}}>
    {hubMobile&&viewportWidth<768&&<View accessibilityRole="progressbar" accessibilityLabel="Question position" accessibilityValue={{min:1,max:total,now:index+1}} style={{height:3,marginHorizontal:2,marginTop:2,marginBottom:14,borderRadius:2,backgroundColor:st.border,overflow:"hidden"}}><View style={{height:3,width:`${(index+1)/total*100}%`,backgroundColor:"#2f80ed"}}/></View>}
    <View
      testID="lecture-question-header"
      style={{
        width: "100%",
        maxWidth: 896,
        alignSelf: "center",
        backgroundColor: hubMobile?st.bg:colors.background,
        borderBottomWidth: viewportWidth >= 768&&!hubMobile ? 1 : 0,
        borderBottomColor: colors.border + "66",
        paddingHorizontal: hubMobile?2:viewportWidth >= 768 ? 24 : 20,
        paddingVertical: hubMobile?0:12,
        paddingBottom:hubMobile?10:12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      {hubMobile?<Text style={f(12,st.muted,"400",12)}>Question {index+1} of {total}</Text>:<View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: colors.background + "99",
          borderWidth: 1,
          borderColor:
            q.difficulty === "EASY"
              ? "#34d39999"
              : q.difficulty === "HARD"
              ? "#f8717199"
              : "#fbbf2499",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={f(12, colors.foreground, "700", 16)}>{index + 1}</Text>
      </View>}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        {viewportWidth >= 640 && (
          <Text
            style={{
              ...f(12, colors.mutedForeground, "400", 16),
              fontFamily: "monospace",
              marginRight: 4,
            }}
          >
            00:00
          </Text>
        )}
        {[
          {
            label: flagged.has(q.id)
              ? "Unflag question"
              : "Flag question for review",
            selected: flagged.has(q.id),
            action: () => toggle(flagged, setFlagged),
            Icon: Flag,
          },
          {
            label: bookmarked.has(q.id)
              ? "Remove bookmark"
              : "Bookmark question",
            selected: bookmarked.has(q.id),
            action: () => toggle(bookmarked, setBookmarked),
            Icon: bookmarked.has(q.id) ? BookmarkCheck : Bookmark,
          },
        ].map(({ label, selected, action, Icon }) => (
          <Pressable
            key={label}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityHint="Only for this practice session"
            accessibilityState={{ selected }}
            onPress={action}
            style={{
              width: hubMobile?32:30,
              height: hubMobile?32:30,
              borderRadius: 99,
              backgroundColor:hubMobile?st.surfacePressed:selected
                ? colors.primary + "26"
                : colors.card + "99",
              borderWidth: 1,
              borderColor: colors.border + "4D",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon
              size={16}
              color={hubMobile?(selected?"#2f80ed":st.muted):selected ? colors.primary : colors.foreground + "CC"}
              fill={selected && Icon === Flag ? colors.primary : "transparent"}
            />
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Share to community"
          onPress={() =>
            Alert.alert(
              "Read-only practice",
              "This practice does not send community posts."
            )
          }
          style={{
            width: hubMobile?32:30,
            height: hubMobile?32:30,
            borderRadius: 99,
            backgroundColor: hubMobile?st.surfacePressed:colors.card + "99",
            borderWidth: 1,
            borderColor: colors.border + "4D",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SvgXml
            xml={shareIcon.replaceAll("currentColor", hubMobile?st.muted:colors.foreground + "CC")}
            width={16}
            height={16}
          />
        </Pressable>
      </View>
    </View></View>
  );
  return renderPage(
    <View
      testID="lecture-question-practice"
      style={{ width: "100%", maxWidth: 896, alignSelf: "center" }}
    >
      <Animated.View
        {...pan.panHandlers}
        style={{
          width: "100%",
          minHeight: phoneNav ? Math.round(0.4 * viewportHeight) : 0,
          transform: [{ translateX: slide }],
        }}
      >
        <View
          testID="lecture-question-card"
          style={{
            borderRadius:hubMobile?0:16,
            borderWidth:hubMobile?0:1,
            borderColor: colors.border + "99",
            backgroundColor: hubMobile?"transparent":colors.background,
            overflow: "hidden",
          }}
        >
          {q.questionType === "MULTI_SELECT" ? (
            <View style={{ padding: 24, gap: 12 }}>
              <Text style={f(15)}>{q.body}</Text>
              <Text style={f(14, colors.mutedForeground)}>
                This question format needs the website for correct grading.
              </Text>
            </View>
          ) : (
            <QuizQuestionContent
              key={q.id}
              question={q}
              lectureReview
              hubReview={hub}
              hubMobile={hubMobile}
              showResult={!!revealed[q.id]}
              selectedAnswer={answers[q.id]}
              onAnswer={(key) => {
                setAnswers((previous) => ({ ...previous, [q.id]: key }));
                if (q.questionType !== "ESSAY")
                  setRevealed((previous) => ({ ...previous, [q.id]: true }));
              }}
            />
          )}
        </View>
      </Animated.View>
      {phoneNav ? (
        <View style={{ height: 80 + insets.bottom }} />
      ) : (
        <View style={{ marginTop: 16 }}>
          {buttons}
          {navigatorOpen && (
            <View
              accessibilityRole="summary"
              accessibilityLabel="Jump to question"
              style={{
                marginTop: 16,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border + "99",
                backgroundColor: colors.card,
                padding: 16,
              }}
            >
              <Text
                style={{
                  ...f(12, colors.mutedForeground, "600", 16),
                  textTransform: "uppercase",
                  letterSpacing: 0.3,
                  marginBottom: 8,
                }}
              >
                Jump to
              </Text>
              {cells()}
            </View>
          )}
        </View>
      )}
    </View>,
    phoneNav ? (
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
        }}
      >
        {buttons}
        <Sheet
          visible={navigatorOpen}
          autoHeight
          maxHeightFraction={0.85}
          onClose={() => setNavigatorOpen(false)}
          floating={
            navigatorOpen ? (
              <View
                pointerEvents="box-none"
                style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
              >
                <FadeEdges top={false} />
                {buttons}
              </View>
            ) : undefined
          }
        >
          <View
            accessibilityViewIsModal
            accessibilityRole="summary"
            accessibilityLabel="Jump to question"
            style={{
              backgroundColor: st.surface,
              paddingBottom: 64 + insets.bottom,
            }}
          >
                    <View
                      style={{
                        width: 40,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: "#5f5f68",
                        opacity: 0.6,
                        alignSelf: "center",
                        marginTop: 12,
                        marginBottom: 4,
                      }}
                    />
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingHorizontal: 16,
                        paddingBottom: 8,
                      }}
                    >
                      <Text style={f(11, st.muted, "500")}>
                        Jump to question · {answered}/{total} answered
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Close question navigator"
                        onPress={() => setNavigatorOpen(false)}
                        style={{ padding: 8 }}
                      >
                        <X size={20} color={st.muted} />
                      </Pressable>
                    </View>
                    <ScrollView
                      contentContainerStyle={{
                        paddingHorizontal: 16,
                        paddingTop: 8,
                        paddingBottom: 16,
                      }}
                    >
                      {cells(true)}
                    </ScrollView>
          </View>
        </Sheet>
      </View>
    ) : null,
    header
  );
}
