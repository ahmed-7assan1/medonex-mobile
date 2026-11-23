import React from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useStudentDimensions } from "@/lib/student-viewport";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  Moon,
  Settings,
  Sun,
  Award,
  BadgeCheck,
  Bookmark,
  CheckSquare,
  Flame,
  GraduationCap,
  LayoutGrid,
  Search,
  Star,
} from "lucide-react-native";
import { useTheme } from "@/theme/ThemeContext";
import { isFixtureMode, type FixtureProfileUser } from "@/lib/fixtures";
import { SCROLL_BOTTOM_PAD } from "@/theme/tokens";
import { FadeEdges } from "@/components/FadeEdges";
const icons: Record<string, typeof Star> = {
  posts: LayoutGrid,
  quizzes: CheckSquare,
  categories: Search,
  saved: Bookmark,
  achievements: Award,
};
export function profilePalette(dark: boolean) {
  return dark
    ? {
        bg: "#07090c",
        bg1: "#0c1015",
        surface: "#131922",
        surface2: "#171f2a",
        text: "#f3f5f7",
        muted: "#7f8996",
        border: "#FFFFFF12",
        glass: "#FFFFFF08",
        gold: "#e8c777",
        goldGlow: "#e8c77759",
        emerald: "#3ee6a8",
        amber: "#ff8a3d",
        amberText: "#ffd8b0",
        amberLight: "#ffbf94",
      }
    : {
        bg: "#faf8f4",
        bg1: "#f3f0ea",
        surface: "#fff",
        surface2: "#f7f4ee",
        text: "#1a1d21",
        muted: "#74808d",
        border: "#0a0a0a17",
        glass: "#0a0a0a06",
        gold: "#b8863f",
        goldGlow: "#b8863f38",
        emerald: "#0f9d6f",
        amber: "#e0761f",
        amberText: "#8a4a12",
        amberLight: "#f29a56",
      };
}
export function ProfileDesktop({
  user,
  avatarUrl,
  isOwn,
  isPrivate,
  following,
  onFollow,
  tabs,
  active,
  onTab,
  children,
}: {
  user: FixtureProfileUser;
  avatarUrl?: string | null;
  isOwn: boolean;
  isPrivate: boolean;
  following: boolean;
  onFollow: () => void;
  tabs: { id: string; label: string }[];
  active: string;
  onTab: (id: string) => void;
  children: React.ReactNode;
}) {
  const { isDark, colors, fonts, setThemeChoice } = useTheme();
  const router = useRouter();
  const { width, viewportWidth } = useStudentDimensions();
  const p = profilePalette(isDark);
  const contentWidth =
    Math.min(1080, width) - (viewportWidth >= 1024 ? 48 : 32);
  const ring = user.hideRank ? "#64748b" : user.rankColor;
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: 16,
          left: 24,
          right: 24,
          zIndex: 10,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: colors.border + "4D",
            backgroundColor: colors.card + "99",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowLeft size={16} color={colors.mutedForeground} />
        </Pressable>
        {isOwn && (
          <View style={{ gap: 8 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                isDark ? "Switch to light mode" : "Switch to dark mode"
              }
              onPress={() => setThemeChoice(isDark ? "light" : "dark")}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.border + "4D",
                backgroundColor: colors.card + "99",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isDark ? (
                <Sun size={16} color={colors.mutedForeground} />
              ) : (
                <Moon size={16} color={colors.mutedForeground} />
              )}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Settings"
              onPress={() => router.push("/settings")}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.border + "4D",
                backgroundColor: colors.card + "99",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Settings size={16} color={colors.mutedForeground} />
            </Pressable>
          </View>
        )}
      </View>
      <LinearGradient
        pointerEvents="none"
        colors={[p.bg, p.bg1, p.bg]}
        locations={[0, 0.4, 1]}
        style={{ position: "absolute", inset: 0 }}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          maxWidth: 1080,
          width: "100%",
          alignSelf: "center",
          paddingHorizontal: viewportWidth >= 1024 ? 24 : 16,
          paddingTop: 20,
          paddingBottom: SCROLL_BOTTOM_PAD,
        }}
      >
        {isFixtureMode() && (
          <Text
            style={{
              color: p.muted,
              fontSize: 12,
              fontFamily: fonts.sans,
              marginBottom: 16,
              paddingHorizontal: 44,
            }}
          >
            Guest preview. This is sample profile data, not a live account.
          </Text>
        )}
        <View style={{ alignItems: "center", paddingHorizontal: 8 }}>
          <View style={{ width: 140, height: 140 }}>
            <LinearGradient
              colors={[ring, ring + "66"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: "absolute", inset: -6, borderRadius: 80 }}
            />
            <View
              style={{
                position: "absolute",
                inset: 4,
                padding: 4,
                borderRadius: 72,
                backgroundColor: p.bg,
              }}
            >
              <View
                style={{
                  flex: 1,
                  borderRadius: 70,
                  overflow: "hidden",
                  backgroundColor: isDark ? "#22303c" : "#e7e1d5",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {avatarUrl ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    style={{ width: "100%", height: "100%" }}
                  />
                ) : (
                  <Text
                    style={{
                      fontSize: 44,
                      fontFamily: fonts.display,
                      color: p.text,
                    }}
                  >
                    {user.name
                      .split(/\s+/)
                      .map((word) => word[0])
                      .slice(0, 2)
                      .join("")}
                  </Text>
                )}
              </View>
            </View>
            {!!user.rank && !user.hideRank && (
              <View
                style={{
                  position: "absolute",
                  bottom: -6,
                  alignSelf: "center",
                  paddingLeft: 9,
                  paddingRight: 12,
                  paddingVertical: 5,
                  borderRadius: 999,
                  backgroundColor: "#11171f",
                  borderWidth: 1,
                  borderColor: p.goldGlow,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Star size={14} fill={p.gold} color={p.gold} />
                <Text
                  style={{
                    color: p.gold,
                    fontSize: 11.5,
                    fontFamily: fonts.sansBold,
                    letterSpacing: 0.4,
                  }}
                >
                  {user.rank}
                </Text>
              </View>
            )}
          </View>
          <View
            style={{ alignItems: "center", marginTop: 24, maxWidth: "100%" }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                maxWidth: "100%",
              }}
            >
              <Text
                style={{
                  fontSize: 26,
                  lineHeight: 32,
                  fontFamily: fonts.display,
                  color: colors.foreground,
                  textAlign: "center",
                }}
              >
                {user.name}
              </Text>
              {user.verified && (
                <BadgeCheck
                  size={18}
                  color={user.role === "SUPER_ADMIN" ? "#e8c777" : "#1da1f2"}
                />
              )}
            </View>
            <Text
              style={{
                fontSize: 13.5,
                fontFamily: fonts.sansMedium,
                color: colors.mutedForeground,
                marginTop: 3,
              }}
            >
              @{user.handle || "user"}
            </Text>
            {!!(user.university || user.semester) && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 12,
                  borderRadius: 999,
                  paddingHorizontal: 16,
                  paddingVertical: 7,
                  borderWidth: 1,
                  borderColor: p.border,
                  backgroundColor: p.glass,
                }}
              >
                <GraduationCap size={15} color={p.emerald} />
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: fonts.sansMedium,
                    color: colors.foreground + "CC",
                  }}
                >
                  {[user.semester, user.university].filter(Boolean).join(" — ")}
                </Text>
              </View>
            )}
            <View
              style={{
                marginTop: 16,
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: 10,
              }}
            >
              <LinearGradient
                colors={["#ff8a3d29", "#ff47571a"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  height: 36,
                  paddingLeft: 14,
                  paddingRight: 16,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: "#ff8a3d66",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                <Flame size={17} color={p.amber} />
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: fonts.sansBold,
                    color: p.amberText,
                  }}
                >
                  {typeof user.streak === "number" ? user.streak : "N/A"}
                </Text>
                <Text
                  style={{
                    fontSize: 11.5,
                    fontFamily: fonts.sansSemiBold,
                    color: p.amberLight,
                  }}
                >
                  day streak
                </Text>
              </LinearGradient>
              <View
                style={{
                  height: 36,
                  borderRadius: 999,
                  paddingHorizontal: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  borderWidth: 1,
                  borderColor: p.border,
                  backgroundColor: p.glass,
                }}
              >
                <Star size={13} fill={p.gold} color={p.gold} />
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: fonts.sansBold,
                    color: p.gold,
                  }}
                >
                  Membership N/A
                </Text>
              </View>
            </View>
            {isOwn && !isPrivate && !!user.bio && (
              <Text
                style={{
                  maxWidth: 480,
                  marginTop: 16,
                  fontSize: 13.5,
                  lineHeight: 25.65,
                  textAlign: "center",
                  fontFamily: fonts.sans,
                  color: colors.foreground + "B3",
                }}
              >
                {user.bio}
              </Text>
            )}
            {!isOwn && (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: following }}
                onPress={onFollow}
                style={{
                  marginTop: 20,
                  height: 42,
                  paddingHorizontal: 22,
                  borderRadius: 12,
                  backgroundColor: following ? p.glass : p.gold,
                  borderWidth: 1,
                  borderColor: p.goldGlow,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 13.5,
                    fontFamily: fonts.sansBold,
                    color: following ? p.text : p.bg,
                  }}
                >
                  {following ? "Following" : "Follow"}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
        {isPrivate ? (
          <View
            style={{
              marginTop: 24,
              padding: 32,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#f9731633",
              backgroundColor: "#f973160d",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontFamily: fonts.sansBold,
                color: "#f97316",
                textAlign: "center",
              }}
            >
              This profile is private
            </Text>
          </View>
        ) : (
          <>
            <View
              style={{
                marginTop: 20,
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              {user.stats.map((stat, index) => (
                <View
                  key={stat.label + index}
                  style={{
                    width: (contentWidth - 36) / 4,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: stat.accent ? p.goldGlow : p.border,
                    backgroundColor: p.surface,
                    paddingHorizontal: 16,
                    paddingVertical: 18,
                    overflow: "hidden",
                  }}
                >
                  {stat.accent && (
                    <LinearGradient
                      colors={[p.gold + "24", p.gold + "0a"]}
                      style={{ position: "absolute", inset: 0 }}
                    />
                  )}
                  <Text
                    style={{
                      fontSize: 24,
                      lineHeight: 26,
                      fontFamily: fonts.sansBold,
                      letterSpacing: -0.5,
                      color: stat.accent ? p.gold : p.text,
                    }}
                  >
                    {stat.value}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11.5,
                      fontFamily: fonts.sansSemiBold,
                      color: p.muted,
                      marginTop: 6,
                    }}
                  >
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 1 }}
              style={{ marginTop: 24 }}
            >
              <View
                accessibilityRole="tablist"
                style={{
                  flexGrow: 1,
                  flexDirection: "row",
                  gap: 4,
                  borderRadius: 14,
                  padding: 6,
                  borderWidth: 1,
                  borderColor: p.border,
                  backgroundColor: p.surface,
                }}
              >
                {tabs.map((tab) => {
                  const Icon = icons[tab.id] || Star;
                  return (
                    <Pressable
                      key={tab.id}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: active === tab.id }}
                      onPress={() => onTab(tab.id)}
                      style={{
                        flexGrow: 1,
                        flexShrink: 0,
                        minWidth: 105,
                        flexDirection: "row",
                        gap: 6,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 10,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                      }}
                    >
                      <Icon
                        size={15}
                        color={active === tab.id ? p.gold : p.muted}
                      />
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 12.5,
                          fontFamily: fonts.sansBold,
                          color: active === tab.id ? p.gold : p.muted,
                        }}
                      >
                        {tab.label}
                      </Text>
                      {active === tab.id && (
                        <View
                          style={{
                            position: "absolute",
                            left: 8,
                            right: 8,
                            bottom: -1,
                            height: 2.5,
                            borderRadius: 4,
                            backgroundColor: p.gold,
                          }}
                        />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
            <View style={{ marginTop: 20 }}>{children}</View>
          </>
        )}
      </ScrollView>
      <FadeEdges color={p.bg} />
    </View>
  );
}
