import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { usePathname, useRouter, useSegments } from "expo-router";
import {
  SafeAreaInsetsContext,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import {
  BarChart3,
  Bell,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Home,
  LogOut,
  Maximize,
  Menu,
  Minimize,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  SunMoon,
  User,
  Users,
} from "lucide-react-native";
import { useTheme } from "@/theme/ThemeContext";
import { useAuth } from "@/lib/auth";
import { useNotifications } from "@/lib/notifications";
import { StudentViewportContext } from "@/lib/student-viewport";
import { StudentPhoneCapsule } from './CapsuleTabBar';
import { NotificationsSheet } from "./NotificationsSheet";
const NAV = [
  { label: "Home", href: "/" },
  { label: "Modules", href: "/modules" },
  { label: "Social", href: "/social" },
  { label: "QBank", href: "/qbank" },
  { label: "AI-Chat", href: "/ai-chat" },
  { label: "DrawMed", href: "/drawmed" },
];
const GROUPS = [
  { label: "Overview", Icon: Home, links: [["Dashboard", "/"]] },
  {
    label: "Learn",
    Icon: BookOpen,
    links: [
      ["Lectures", "/modules"],
      ["Quizzes", "/qbank"],
      ["OneX Videos", "/videos"],
      ["Reels", "/videos/reels"],
      ["Podcasts", "/podcasts"],
    ],
  },
  {
    label: "Tools",
    Icon: BarChart3,
    links: [
      ["Study Tools", "/study-tools"],
      ["Taskat", "/taskat"],
    ],
  },
  {
    label: "Community",
    Icon: Users,
    links: [
      ["Community", "/social"],
      ["Leaderboard", "/leaderboard"],
    ],
  },
];
const sidebarKey = "medonex-student-sidebar-open";
export function DesktopStudentChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const { width, height } = useWindowDimensions();
  const path = usePathname();
  const segments = useSegments();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, fonts, isDark, setThemeChoice } = useTheme();
  const { user, isGuest, token, signOut } = useAuth();
  const desktop =
    width >= 768 &&
    String(segments[0]) !== "(auth)" &&
    !path.startsWith("/quiz") &&
    !path.startsWith('/admin') && path !== '/studio/sync' &&
    path !== '/ai-chat' && path !== '/social' &&
    (!!token || isGuest || ["/terms", "/about", "/founders"].includes(path));
  const [sidebar, setSidebar] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [account, setAccount] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [page, setPage] = useState({ width, height });
  useEffect(()=>{if(Platform.OS!=='web'&&!desktop&&fullscreen){StatusBar.setHidden(false,'fade');setFullscreen(false)}},[desktop,fullscreen]);
  const current = useNotifications(false);
  const name = user?.name || "Guest";
  const draw = path === "/drawmed";
  const videoTemplate =
    /^\/modules\/[^/]+\/lectures\/[^/]+\/video(?:\/|$)/.test(path);
  const matches = (href: string) =>
    href === "/"
      ? path === "/"
      : href === "/videos"
      ? path.startsWith("/videos") && !path.startsWith("/videos/reels")
      : path === href || path.startsWith(href + "/");
  const initial = GROUPS.filter((group) =>
    group.links.some(([, href]) => matches(href))
  ).map((group) => group.label);
  const [openGroups, setOpenGroups] = useState<string[]>(
    initial.length ? initial : ["Overview"]
  );
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const value =
          Platform.OS === "web"
            ? localStorage.getItem(sidebarKey)
            : await SecureStore.getItemAsync(sidebarKey);
        if (active) setSidebar(value === "true");
      } catch {}
    })();
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    setCollapsed(false);
    setAccount(false);
  }, [path]);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const change = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", change);
    return () => document.removeEventListener("fullscreenchange", change);
  }, []);
  const toggleSidebar = () =>
    setSidebar((value) => {
      const next = !value;
      try {
        if (Platform.OS === "web")
          localStorage.setItem(sidebarKey, String(next));
        else
          void SecureStore.setItemAsync(sidebarKey, String(next)).catch(
            () => {}
          );
      } catch {}
      return next;
    });
  const go = (href: string) => {
    setAccount(false);
    router.push(href as never);
  };
  const toggleFullscreen = () => {
    setAccount(false);
    if (Platform.OS === "web") {
      if (document.fullscreenElement)
        void document.exitFullscreen().catch(() => {});
      else
        void document.documentElement
          .requestFullscreen()
          .catch(() =>
            Alert.alert(
              "Full screen unavailable",
              "Your browser did not allow full screen."
            )
          );
    } else {
      StatusBar.setHidden(!fullscreen, "fade");
      setFullscreen((value) => !value);
    }
  };
  const avatar = (size: number) => (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.primary + "1A",
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {user?.image ? (
        <Image
          source={{ uri: user.image }}
          style={{ width: size, height: size }}
        />
      ) : (
        <Text
          style={{
            fontSize: size === 28 ? 11 : 14,
            fontFamily: fonts.sansBold,
            color: colors.foreground,
          }}
        >
          {name[0].toUpperCase()}
        </Text>
      )}
    </View>
  );
  const iconStyle = {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.card + "99",
    borderWidth: 1,
    borderColor: colors.border + "4D",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  };
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: desktop ? insets.top : 0,
      }}
    >
      <View
        style={{
          height: desktop && !collapsed ? 56 : 0,
          zIndex: 1001,
          overflow: "visible",
        }}
      >
        {desktop && !collapsed && (
          <View
            style={{
              height: 56,
              borderBottomWidth: 1,
              borderColor: colors.border + "4D",
              backgroundColor: colors.background + "E6",
              paddingLeft: width >= 1024 ? 24 : 16,
              paddingRight: draw ? 48 : width >= 1024 ? 32 : 24,
              flexDirection: "row",
              alignItems: "center",
              gap: 16,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Image
                  source={
                    isDark
                      ? require("../../assets/brand-dark.png")
                      : require("../../assets/brand-light.png")
                  }
                  accessibilityLabel="MedOneX"
                  style={{ width: 45, height: 45 }}
                />
              </View>
              {!videoTemplate && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    sidebar ? "Close sidebar" : "Open sidebar"
                  }
                  accessibilityState={{ expanded: sidebar }}
                  onPress={toggleSidebar}
                  style={{
                    width: 36,
                    height: 36,
                    marginLeft: -4,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 8,
                  }}
                >
                  <Menu size={20} color={colors.mutedForeground} />
                </Pressable>
              )}
            </View>
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 32,
              }}
            >
              {NAV.map((tab) => (
                <Pressable
                  key={tab.href}
                  accessibilityRole="button"
                  accessibilityLabel={tab.label}
                  accessibilityState={{ selected: matches(tab.href) }}
                  onPress={() => go(tab.href)}
                  style={{ paddingHorizontal: 4, paddingVertical: 4 }}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 13,
                      lineHeight: 14,
                      letterSpacing: -0.3,
                      fontFamily: fonts.sansBold,
                      color: matches(tab.href)
                        ? colors.foreground
                        : colors.mutedForeground + "99",
                    }}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View
              style={{ flexDirection: "row", gap: 8, alignItems: "center" }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Notifications"
                onPress={() => setNotifications(true)}
                style={iconStyle}
              >
                <Bell size={14} color={colors.mutedForeground} />
                {(current.data?.unreadCount || 0) > 0 && (
                  <View
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "#ef4444",
                      borderWidth: 2,
                      borderColor: colors.background,
                    }}
                  />
                )}
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Search"
                onPress={() => go("/search")}
                style={iconStyle}
              >
                <Search size={16} color={colors.mutedForeground} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={"Account menu for " + name}
                accessibilityState={{ expanded: account }}
                onPress={() => setAccount((value) => !value)}
                style={{
                  height: 36,
                  maxWidth: 210,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: colors.border + "80",
                  backgroundColor: colors.card + "99",
                  paddingVertical: 4,
                  paddingLeft: 4,
                  paddingRight: 10,
                  marginLeft: 4,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {avatar(28)}
                {width >= 1024 && (
                  <>
                    <Text
                      numberOfLines={1}
                      style={{
                        maxWidth: 132,
                        fontSize: 12,
                        fontFamily: fonts.sansSemiBold,
                        color: colors.foreground,
                      }}
                    >
                      {name}
                    </Text>
                    <ChevronDown size={14} color={colors.mutedForeground} />
                  </>
                )}
              </Pressable>
            </View>
            {draw && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Hide site navigation"
                onPress={() => setCollapsed(true)}
                style={{
                  position: "absolute",
                  right: 4,
                  top: 10,
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ChevronUp size={16} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>
        )}
        {desktop && collapsed && draw && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Show site navigation"
            onPress={() => setCollapsed(false)}
            style={{
              position: "absolute",
              right: 16,
              top: -1,
              width: 48,
              height: 19,
              borderBottomLeftRadius: 24,
              borderBottomRightRadius: 24,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.background + "E6",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronDown size={14} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>
      <View style={{ flex: 1, flexDirection: "row", minHeight: 0 }}>
        {desktop && sidebar && (
          <View
            accessibilityLabel="Student navigation"
            style={{
              width: 240,
              borderRightWidth: 1,
              borderColor: colors.border + "66",
              backgroundColor: colors.background + "F2",
            }}
          >
            <ScrollView
              contentContainerStyle={{
                paddingHorizontal: 12,
                paddingTop: 16,
                paddingBottom: 32,
              }}
            >
              {GROUPS.map((group) => (
                <View key={group.label}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{
                      expanded: openGroups.includes(group.label),
                    }}
                    onPress={() =>
                      setOpenGroups((value) =>
                        value.includes(group.label)
                          ? value.filter((item) => item !== group.label)
                          : [...value, group.label]
                      )
                    }
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 8,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <group.Icon size={16} color={colors.mutedForeground} />
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 14,
                        fontFamily: fonts.sansMedium,
                        color: colors.foreground,
                      }}
                    >
                      {group.label}
                    </Text>
                    {openGroups.includes(group.label) ? (
                      <ChevronUp size={14} color={colors.mutedForeground} />
                    ) : (
                      <ChevronDown size={14} color={colors.mutedForeground} />
                    )}
                  </Pressable>
                  {openGroups.includes(group.label) && (
                    <View
                      style={{
                        marginLeft: 24,
                        paddingLeft: 12,
                        borderLeftWidth: 1,
                        borderColor: colors.border,
                        gap: 2,
                        paddingBottom: 4,
                      }}
                    >
                      {group.links.map(([label, href]) => (
                        <Pressable
                          key={href}
                          accessibilityRole="button"
                          accessibilityState={{ selected: matches(href) }}
                          onPress={() => go(href)}
                          style={{ paddingVertical: 6 }}
                        >
                          <Text
                            style={{
                              fontSize: 14,
                              fontFamily: matches(href)
                                ? fonts.sansSemiBold
                                : fonts.sans,
                              color: matches(href)
                                ? colors.foreground
                                : colors.mutedForeground,
                            }}
                          >
                            {label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        )}
        <View
          style={{ flex: 1, minWidth: 0 }}
          testID="student-desktop-content"
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            setPage((value) =>
              value.width === width && value.height === height
                ? value
                : { width, height }
            );
          }}
        >
          <SafeAreaInsetsContext.Provider value={{ ...insets, top: desktop ? 0 : insets.top }}>
            <StudentViewportContext.Provider value={page}>
              {children}
            </StudentViewportContext.Provider>
          </SafeAreaInsetsContext.Provider>
        </View>
      </View>
      <StudentPhoneCapsule/>
      <NotificationsSheet
        open={notifications}
        onClose={() => setNotifications(false)}
      />
      <Modal
        visible={account}
        transparent
        animationType="fade"
        onRequestClose={() => setAccount(false)}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close account menu"
          onPress={() => setAccount(false)}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={{
            position: "absolute",
            top: insets.top + 56 + 8,
            right: width >= 1024 ? 32 : 24,
            width: 288,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border + "99",
            backgroundColor: colors.card + "F2",
            overflow: "hidden",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              padding: 16,
              borderBottomWidth: 1,
              borderColor: colors.border + "80",
            }}
          >
            {avatar(44)}
            <View style={{ flex: 1, gap: 4 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    flex: 1,
                    fontSize: 14,
                    fontFamily: fonts.sansBold,
                    color: colors.foreground,
                  }}
                >
                  {name}
                </Text>
                <Text
                  style={{
                    fontSize: 9,
                    fontFamily: fonts.sansBold,
                    color: colors.primary,
                    backgroundColor: colors.primary + "1A",
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 999,
                  }}
                >
                  {isGuest ? "Guest" : "Student"}
                </Text>
              </View>
              {user?.email && (
                <Text
                  numberOfLines={1}
                  style={{ fontSize: 12, color: colors.mutedForeground }}
                >
                  {user.email}
                </Text>
              )}
            </View>
          </View>
          {[
            { label: "Profile", Icon: User, run: () => go("/profile") },
            { label: "Settings", Icon: Settings, run: () => go("/settings") },
            ...(["ADMIN", "SUPER_ADMIN", "FACULTY_LEADER"].includes(user?.role || "")
              ? [{ label: "Admin dashboard", Icon: ShieldCheck, run: () => go("/admin/dashboard") }]
              : []),
          ].map((item) => (
            <Pressable
              accessibilityRole="button"
              key={item.label}
              onPress={item.run}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                flexDirection: "row",
                gap: 12,
                alignItems: "center",
              }}
            >
              <item.Icon size={16} color={colors.mutedForeground} />
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: fonts.sansSemiBold,
                  color: colors.foreground,
                }}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
          <View
            style={{
              height: 1,
              backgroundColor: colors.border + "66",
              marginVertical: 4,
            }}
          />
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              flexDirection: "row",
              gap: 12,
              alignItems: "center",
            }}
          >
            <SunMoon size={16} color={colors.mutedForeground} />
            <Text
              style={{
                flex: 1,
                fontSize: 12,
                fontFamily: fonts.sansSemiBold,
                color: colors.foreground,
              }}
            >
              Appearance
            </Text>
            <View
              style={{
                flexDirection: "row",
                padding: 2,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.muted + "B3",
              }}
            >
              {[
                { label: "Light mode", Icon: Sun, dark: false },
                { label: "Dark mode", Icon: Moon, dark: true },
              ].map((item) => (
                <Pressable
                  key={item.label}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  accessibilityState={{ selected: isDark === item.dark }}
                  onPress={() => setThemeChoice(item.dark ? "dark" : "light")}
                  style={{
                    width: 31,
                    height: 26,
                    borderRadius: 13,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor:
                      isDark === item.dark ? colors.background : "transparent",
                  }}
                >
                  <item.Icon
                    size={16}
                    color={
                      isDark === item.dark
                        ? item.dark
                          ? colors.primary
                          : "#f59e0b"
                        : colors.mutedForeground
                    }
                  />
                </Pressable>
              ))}
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={toggleFullscreen}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              flexDirection: "row",
              gap: 12,
              alignItems: "center",
            }}
          >
            {fullscreen ? (
              <Minimize size={16} color={colors.mutedForeground} />
            ) : (
              <Maximize size={16} color={colors.mutedForeground} />
            )}
            <Text
              style={{
                fontSize: 12,
                fontFamily: fonts.sansSemiBold,
                color: colors.foreground,
              }}
            >
              {fullscreen ? "Exit full screen" : "Full screen"}
            </Text>
          </Pressable>
          <View
            style={{
              height: 1,
              backgroundColor: colors.border + "66",
              marginVertical: 4,
            }}
          />
          <Pressable
            accessibilityRole="button"
            onPress={async () => {
              setAccount(false);
              try {
                await signOut();
                router.replace("/(auth)/login");
              } catch {
                Alert.alert("Could not sign out", "Please try again.");
              }
            }}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              flexDirection: "row",
              gap: 12,
              alignItems: "center",
            }}
          >
            <LogOut size={16} color="#ef4444" />
            <Text
              style={{
                fontSize: 12,
                fontFamily: fonts.sansSemiBold,
                color: "#ef4444",
              }}
            >
              Sign out
            </Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}
