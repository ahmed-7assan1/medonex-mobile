import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  type TextStyle,
} from "react-native";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Tag,
  Users,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SvgXml } from "react-native-svg";
import { useRouter } from "expo-router";
import { useTheme } from "@/theme/ThemeContext";
import { useStudentDimensions } from "@/lib/student-viewport";
import {
  useStudentExtra,
  BOARD_PREVIEW,
  type LeaderboardData,
  type BoardPlayer,
} from "@/lib/student-extras";
import { useCommunityFeed, type Post } from "@/lib/community";
import { FIXTURE_FEED, isFixtureMode } from "@/lib/fixtures";
import { WebsiteCommunityCards } from "./WebsiteCommunityCards";
import { FadeEdges } from "@/components/FadeEdges";
import { DashboardAvatar } from './DashboardAvatar';
import { SCROLL_BOTTOM_PAD } from "@/theme/tokens";
const content = require("../../../assets/dashboard-content.json") as {
  communitySubtitle:string;
  offers: {
    id: number;
    imageSrc: string;
    imageAlt: string;
    tag: string;
    title: string;
    description: string;
    brandName: string;
    href: string;
  }[];
  features: {
    quote: string;
    author: string;
    role: string;
    company: string;
    image: string;
  }[];
};
const dashboardIcons =
  require("../../../assets/dashboard-icons.json") as Record<string, string[]>;
function SourceSvg({
  kind,
  index,
  color,
  width,
  height,
  style,
}: {
  kind: string;
  index: number;
  color: string;
  width: number;
  height: number;
  style?: any;
}) {
  return (
    <SvgXml
      pointerEvents="none"
      xml={dashboardIcons[kind][index].replaceAll("currentColor", color)}
      width={width}
      height={height}
      style={style}
    />
  );
}
const FAMILY = Platform.select({
  web: "Arial",
  ios: "Arial",
  default: "sans-serif",
});
const MONO = Platform.select({
  web: "monospace",
  ios: "Menlo",
  default: "monospace",
});
const font = (
  size: number,
  color: string,
  weight: TextStyle["fontWeight"] = "400"
): TextStyle => ({
  fontFamily: FAMILY,
  fontSize: size,
  lineHeight:
    (
      { 12: 16, 14: 20, 16: 24, 18: 28, 20: 28, 30: 36, 48: 48 } as Record<
        number,
        number
      >
    )[size] ?? size * 1.65,
  letterSpacing: -0.15,
  color,
  fontWeight: weight,
});
function useReducedMotion() {
  const [value, setValue] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setValue);
    const event = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setValue
    );
    return () => event.remove();
  }, []);
  return value;
}

/** Source DashboardDesktopView. Physical viewport controls breakpoints; page width follows the sidebar. */
export function TabletHome() {
  const { colors } = useTheme();
  const { viewportWidth } = useStudentDimensions();
  const padding = viewportWidth >= 1024 ? 32 : 24;
  const board = useStudentExtra<LeaderboardData>(
    "/leaderboard?limit=8",
    BOARD_PREVIEW
  );
  const feed = useCommunityFeed("university");
  const posts = isFixtureMode() ? FIXTURE_FEED.items : feed.data?.items ?? [];
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        testID="desktop-dashboard-scroll"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: SCROLL_BOTTOM_PAD }}
      >
        <View
          testID="desktop-dashboard-content"
          style={{
            width: "100%",
            maxWidth: 1504,
            alignSelf: "center",
            paddingHorizontal: padding,
            gap: 48,
            paddingTop: 48,
            paddingBottom: 48,
          }}
        >
          {isFixtureMode() && (
            <Text
              style={{
                ...font(11, colors.mutedForeground),
                textAlign: "center",
                paddingTop: 12,
              }}
            >
              Sample data, not a real account
            </Text>
          )}
          <FeatureCarousel />
          <OfferCarousel />
          {board.data?.leaderboard.length ? (
            <LearnerSection users={board.data.leaderboard.slice(0, 8)} />
          ) : board.isError ? (
            <SectionUnavailable name="Top Learners" />
          ) : null}
          {posts.length ? (
            <CommunitySection posts={posts.slice(0, 6)} />
          ) : feed.isError ? (
            <SectionUnavailable name="Community" />
          ) : null}
        </View>
      </ScrollView>
      <FadeEdges color={colors.background} />
    </View>
  );
}
function SectionUnavailable({ name }: { name: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        padding: 32,
        borderWidth: 1,
        borderColor: colors.border + "4D",
        borderRadius: 16,
        backgroundColor: colors.card + "66",
        alignItems: "center",
      }}
    >
      <Text style={font(14, colors.mutedForeground)}>
        {name} is temporarily unavailable.
      </Text>
    </View>
  );
}
function FeatureCarousel() {
  const { colors } = useTheme();
  const [index, setIndex] = useState(0);
  const quoteOpacity=useRef(new Animated.Value(1)).current;
  const reduced = useReducedMotion();
  useEffect(()=>{if(reduced){quoteOpacity.setValue(1);return;}quoteOpacity.setValue(0);const animation=Animated.timing(quoteOpacity,{toValue:1,duration:400,useNativeDriver:Platform.OS!=='web',isInteraction:false});animation.start();return()=>animation.stop()},[index,reduced,quoteOpacity]);
  useEffect(() => {
    if (reduced) return;
    const timer = setInterval(
      () => setIndex((value) => (value + 1) % content.features.length),
      6000
    );
    return () => clearInterval(timer);
  }, [reduced]);
  const current = content.features[index];
  return (
    <View
      testID="desktop-dashboard-features"
      style={{ paddingTop: 24, paddingBottom: 40, alignItems: "center" }}
    >
      <View style={{ width: "100%", maxWidth: 1024, position: "relative" }}>
        <Text
          pointerEvents="none"
          style={{
            ...font(448, colors.foreground + "08", "700"),
            position: "absolute",
            left: -32,
            top: "50%",
            lineHeight: 448,
            letterSpacing: -22.4,
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </Text>
        <View style={{ flexDirection: "row" }}>
          <View
            style={{
              width: 81,
              borderRightWidth: 1,
              borderColor: colors.border,
              paddingRight: 64,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: 16,
                height: 67.2,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SvgXml width={16} height={67.2} xml={'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 67.2"><text x="8" y="33.6" text-anchor="middle" dominant-baseline="middle" font-family="monospace" font-size="12" letter-spacing="1.2" fill="'+colors.mutedForeground+'" transform="rotate(90 8 33.6)">FEATURES</text></svg>'}/>
            </View>
            <View
              style={{
                width: 1,
                height: 128,
                backgroundColor: colors.border,
                marginTop: 32,
              }}
            >
              <View
                style={{
                  width: 1,
                  height: (128 * (index + 1)) / content.features.length,
                  backgroundColor: colors.foreground,
                }}
              />
            </View>
          </View>
          <View
            style={{
              flex: 1,
              minWidth: 0,
              paddingLeft: 64,
              paddingVertical: 24,
            }}
          >
            <View
              style={{
                alignSelf: "flex-start",
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 12,
                paddingVertical: 4,
                marginBottom: 33,
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: colors.primary,
                }}
              />
              <Text
                style={{
                  fontFamily: MONO,
                  fontSize: 12,
                  lineHeight: 16,
                  color: colors.mutedForeground,
                  letterSpacing: -0.15,
                }}
              >
                {current.company}
              </Text>
            </View>
            <Animated.View
              testID="desktop-dashboard-quote"
              style={{
                opacity:quoteOpacity,
                transform:[{translateY:quoteOpacity.interpolate({inputRange:[0,1],outputRange:[20,0]})}],
                minHeight: 140,
                marginBottom: 48,
                flexDirection: "row",
                flexWrap: "wrap",
                alignContent: "flex-start",
              }}
            >
              {current.quote.split(" ").map((word, i) => (
                <Text
                  key={i}
                  style={{
                    ...font(48, colors.foreground, "300"),
                    lineHeight: 48,
                    letterSpacing: -1.2,
                    marginRight: 14.4,
                  }}
                >
                  {word}
                </Text>
              ))}
            </Animated.View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: 24,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 16,
                  flexShrink: 1,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 1,
                    backgroundColor: colors.foreground,
                  }}
                />
                <View style={{ flexShrink: 1 }}>
                  <Text style={font(16, colors.foreground, "500")}>
                    {current.author}
                  </Text>
                  <Text style={font(14, colors.mutedForeground)}>
                    {current.role}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: "flex-end", gap: 16 }}>
                <View
                  style={{
                    width: 280,
                    height: 180,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 16,
                    overflow: "hidden",
                    backgroundColor: colors.card,
                  }}
                >
                  <Image
                    source={{ uri: current.image }}
                    accessibilityLabel={current.author}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    pointerEvents="none"
                    colors={["#00000000", "#00000000", "#00000066"]}
                    style={{ position: "absolute", inset: 0 }}
                  />
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  {[-1, 1].map((direction) => (
                    <Pressable
                      key={direction}
                      accessibilityRole="button"
                      accessibilityLabel={
                        direction < 0 ? "Previous feature" : "Next feature"
                      }
                      onPress={() =>
                        setIndex(
                          (value) =>
                            (value + direction + content.features.length) %
                            content.features.length
                        )
                      }
                      style={({ pressed }) => ({
                        width: 48,
                        height: 48,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 24,
                        alignItems: "center",
                        justifyContent: "center",
                        transform: [{ scale: pressed ? 0.95 : 1 }],
                      })}
                    >
                      {direction < 0 ? (
                        <SourceSvg
                          kind="feature"
                          index={0}
                          color={colors.foreground}
                          width={18}
                          height={18}
                        />
                      ) : (
                        <SourceSvg
                          kind="feature"
                          index={1}
                          color={colors.foreground}
                          width={18}
                          height={18}
                        />
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
function EdgeFades({ solid = false }: { solid?: boolean }) {
  const { colors } = useTheme();
  return (
    <>
      {[false, true].map((right) => (
        <LinearGradient
          key={String(right)}
          pointerEvents="none"
          colors={
            solid
              ? [colors.background, colors.background + "00"]
              : [
                  colors.background + "8C",
                  colors.background + "59",
                  colors.background + "2E",
                  colors.background + "0F",
                  colors.background + "00",
                ]
          }
          locations={solid ? undefined : [0, 0.3, 0.55, 0.8, 1]}
          start={{ x: right ? 1 : 0, y: 0 }}
          end={{ x: right ? 0 : 1, y: 0 }}
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            width: solid ? 128 : 112,
            ...(right ? { right: 0 } : { left: 0 }),
            zIndex: 5,
          }}
        />
      ))}
    </>
  );
}
function OfferCarousel() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const ref = useRef<ScrollView>(null);
  const x = useRef(0),
    width = useRef(0);
  return (
    <View testID="desktop-dashboard-services">
      <Text
        style={{
          ...font(20, colors.foreground, "700"),
          lineHeight: 28,
          letterSpacing: -0.5,
          marginBottom: 16,
        }}
      >
        Platform Services
      </Text>
      <View onLayout={(e) => (width.current = e.nativeEvent.layout.width)}>
        <ScrollView
          ref={ref}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={(e) => (x.current = e.nativeEvent.contentOffset.x)}
          scrollEventThrottle={16}
          contentContainerStyle={{ gap: 24, paddingBottom: 16 }}
        >
          {content.offers.map((offer) => (
            <Pressable
              key={offer.id}
              accessibilityRole="button"
              accessibilityLabel={offer.title}
              onPress={() => router.push(offer.href as never)}
              style={{
                width: 300,
                height: 380,
                borderRadius: 16,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.card,
              }}
            >
              <Image
                source={{ uri: offer.imageSrc }}
                accessibilityLabel={offer.imageAlt}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 190,
                }}
                resizeMode="cover"
              />
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 190,
                  padding: 20,
                  backgroundColor: colors.card,
                  justifyContent: "space-between",
                }}
              >
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Tag
                      size={16}
                      color={colors.primary}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={font(12, colors.mutedForeground)}>
                      {offer.tag}
                    </Text>
                  </View>
                  <Text
                    style={{
                      ...font(20, colors.cardForeground, "700"),
                      lineHeight: 25,
                    }}
                  >
                    {offer.title}
                  </Text>
                  <Text
                    style={{
                      ...font(14, colors.mutedForeground),
                      lineHeight: 20,
                    }}
                  >
                    {offer.description}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: 16,
                    borderTopWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <Image
                      source={
                        isDark
                          ? require("../../../assets/brand-dark.png")
                          : require("../../../assets/brand-light.png")
                      }
                      style={{ width: 32, height: 32 }}
                      resizeMode="contain"
                    />
                    <Text style={font(12, colors.cardForeground, "600")}>
                      {offer.brandName}
                    </Text>
                  </View>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: colors.secondary,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ArrowRight size={16} color={colors.secondaryForeground} />
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
        <EdgeFades />
        {[-1, 1].map((direction) => (
          <Pressable
            key={direction}
            accessibilityRole="button"
            accessibilityLabel={
              direction < 0 ? "Scroll services left" : "Scroll services right"
            }
            onPress={() =>
              ref.current?.scrollTo({
                x: Math.max(0, x.current + direction * width.current * 0.8),
                animated: true,
              })
            }
            style={({ hovered }: any) => ({
              position: "absolute",
              top: "50%",
              marginTop: -20,
              ...(direction < 0 ? { left: 8 } : { right: 8 }),
              zIndex: 10,
              width: 40,
              height: 40,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.background + "CC",
              alignItems: "center",
              justifyContent: "center",
              opacity: Platform.OS === "web" ? (hovered ? 1 : 0) : 1,
            })}
          >
            {direction < 0 ? (
              <ChevronLeft size={24} color={colors.foreground} />
            ) : (
              <ChevronRight size={24} color={colors.foreground} />
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}
function MarqueeRow({
  children,
  width,
  gap = 24,
  duration = 40000,
}: {
  children: React.ReactNode[];
  width: number;
  gap?: number;
  duration?: number;
}) {
  const reduced = useReducedMotion();
  const offset = useRef(new Animated.Value(0)).current;
  const animation = useRef<Animated.CompositeAnimation | null>(null);
  useEffect(() => {
    offset.setValue(0);
    if (reduced || !children.length) return;
    animation.current = Animated.loop(
      Animated.timing(offset, {
        toValue: -(children.length * (width + gap)),
        duration,
        useNativeDriver: Platform.OS !== "web",
        isInteraction: false,
        easing: (value) => value,
      })
    );
    animation.current.start();
    return () => animation.current?.stop();
  }, [children.length, width, gap, duration, reduced, offset]);
  if (reduced)
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap }}
      >
        {children}
      </ScrollView>
    );
  return (
    <View
      onPointerEnter={() => animation.current?.stop()}
      onPointerLeave={() => animation.current?.start()}
      style={{ overflow: "hidden" }}
    >
      <Animated.View
        style={{
          flexDirection: "row",
          gap,
          width: children.length * (width + gap) * 2,
          transform: [{ translateX: offset }],
        }}
      >
        {[0, 1].flatMap((repeat) =>
          children.map((child, index) => (
            <View key={repeat + "-" + index} style={{ width }}>
              {child}
            </View>
          ))
        )}
      </Animated.View>
    </View>
  );
}
function SectionHeading({ community = false }: { community?: boolean }) {
  const { colors, isDark } = useTheme();
  return (
    <View
      style={{
        maxWidth: 1024,
        alignSelf: "center",
        width: "100%",
        alignItems: "center",
        paddingHorizontal: 24,
        marginBottom: community ? 40 : 64,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#2563eb",
          marginBottom: 24,
        }}
      >
        {community ? (
          <MessageCircle size={24} color="#fff" />
        ) : (
          <SourceSvg
            kind="leaderboard"
            index={1}
            color="#fff"
            width={24}
            height={24}
          />
        )}
      </View>
      <View
        style={{ position: "relative", alignSelf: "center", marginBottom: 16 }}
      >
        <SourceSvg
          kind="leaderboard"
          index={2}
          color={isDark ? "#404040" : "#e5e5e5"}
          width={96}
          height={86}
          style={{ position: "absolute", top: -8, right: -32 }}
        />
        <Text
          style={{
            ...font(48, isDark ? "#f5f5f5" : "#171717", "500"),
            lineHeight: 48,
            letterSpacing: -1.2,
            textAlign: "center",
          }}
        >
          {community ? "Community Voices" : "Top Learners"}
        </Text>
      </View>
      <Text
        style={{
          ...font(15, isDark ? "#a3a3a3" : "#525252"),
          maxWidth: 672,
          textAlign: "center",
        }}
      >
        {community
          ? content.communitySubtitle
          : "Celebrating our most dedicated learners who inspire the community."}
      </Text>
    </View>
  );
}
function LearnerSection({ users }: { users: BoardPlayer[] }) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const {viewportWidth}=useStudentDimensions();
  const [hovered,setHovered]=useState<string|null>(null);
  const first = users[0];
  const image = (user: BoardPlayer,compact=false) =>
    user.image ? (
      <DashboardAvatar uri={user.image} label={user.name||'Learner'} size={compact?56:254} grayscale={!compact&&hovered!==user.id}/>
    ) : (
      <LinearGradient
        colors={[colors.primary + "33", colors.primary + "0D"]}
        style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
      >
        <Text style={font(compact?15:30, compact?colors.primary:colors.foreground, compact?'700':'900')}>
          {user.name?.charAt(0).toUpperCase() || "?"}
        </Text>
      </LinearGradient>
    );
  return (
    <View
      testID="desktop-dashboard-learners"
      style={{ paddingVertical: 96, overflow: "hidden" }}
    >
      <SourceSvg
        kind="leaderboard"
        index={0}
        color={isDark ? "#262626" : "#e5e5e5"}
        width={460}
        height={154}
        style={{ position: "absolute", right: 0, bottom: 0 }}
      />
      <SectionHeading />
      <View style={{ position: "relative", padding: 8 }}>
        <MarqueeRow width={256}>
          {users.map((user) => (
            <Pressable
              key={user.id}
              accessibilityRole="button"
              accessibilityLabel={"Open learner " + (user.name || "Student")}
              onHoverIn={()=>setHovered(user.id)} onHoverOut={()=>setHovered(null)}
              onPress={() => router.push(`/profile/${user.id}` as never)}
              style={{
                width: 256,
                height: 256,
                borderRadius: 16,
                overflow: "hidden",
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border + "33",
              }}
            >
              {image(user)}
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  width: "100%",
                  borderRadius: 8,
                  padding: 8,
                  backgroundColor: isDark ? "#262626CC" : "#f5f5f5D9",
                }}
              >
                <Text
                  numberOfLines={1}
                  style={font(15, isDark ? "#f5f5f5" : "#171717", "600")}
                >
                  {user.name || "Student"}
                </Text>
                <Text style={font(14, isDark ? "#a3a3a3" : "#525252")}>
                  {user.points.toLocaleString()} XP
                </Text>
              </View>
            </Pressable>
          ))}
        </MarqueeRow>
        <EdgeFades solid />
      </View>
      <View
        style={{
          marginTop: 80,
          paddingHorizontal: viewportWidth>=1024?0:24,
          maxWidth: 768,
          alignSelf: "center",
          width: "100%",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            ...font(20, isDark ? "#f5f5f5" : "#171717", "500"),
            lineHeight: 28,
            textAlign: "center",
            marginBottom: 32,
          }}
        >
          The exceptional support from our top learners truly inspires us. Their
          dedication drives the whole community forward!
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={"Open top learner " + (first.name || "Student")}
          onPress={() => router.push(`/profile/${first.id}` as never)}
          style={{ alignItems: "center", gap: 12 }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              overflow: "hidden",
            }}
          >
            {image(first,true)}
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={font(15, isDark ? "#f5f5f5" : "#171717", "600")}>
              {first.name || "Top Learner"}
            </Text>
            <Text style={font(14, isDark ? "#a3a3a3" : "#525252")}>
              Rank #{first.position || 1} · {first.points.toLocaleString()} XP
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}
function CommunitySection({ posts }: { posts: Post[] }) {
  const { colors } = useTheme();
  return (
    <View testID="desktop-dashboard-community">
      <SectionHeading community />
      <View style={{ marginTop: 16 }}>
        <WebsiteCommunityCards posts={posts} />
      </View>
    </View>
  );
}
