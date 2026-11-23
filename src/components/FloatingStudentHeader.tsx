import React, { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ArrowLeft,
  Bell,
  LogOut,
  Moon,
  Pencil,
  ShieldCheck,
  Sun,
  User,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/ThemeContext";
import { useAuth } from "@/lib/auth";
import { NotificationsSheet } from "./NotificationsSheet";
/** The website's non-flat student chrome, kept above its edge fades. */
export function FloatingStudentHeader({
  title,
  darkSurface = false,
}: {
  title: string;
  darkSurface?: boolean;
}) {
  const { st, colors, fonts, isDark, setThemeChoice } = useTheme();
  const { user, signOut } = useAuth();
  const { i18n } = useTranslation();
  const ar = i18n.dir() === "rtl";
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [notifications, setNotifications] = useState(false);
  const [menu, setMenu] = useState(false);
  const headerForeground = darkSurface ? "#fff" : colors.foreground;
  const darkChrome = darkSurface || isDark;
  const style = {
    ...styles.icon,
    backgroundColor: darkChrome
      ? "rgba(255,255,255,0.10)"
      : "rgba(255,255,255,0.70)",
    borderColor: darkChrome ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.10)",
  };
  const go = (path: string) => {
    setMenu(false);
    router.push(path as never);
  };
  return (
    <>
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: insets.top,
          left: 0,
          right: 0,
          zIndex: 10,
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: ar ? "row-reverse" : "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={style}
        >
          <ArrowLeft size={16} color={headerForeground} />
        </Pressable>
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            fontSize: 14,
            fontFamily: fonts.sansBold,
            color: headerForeground,
            textAlign: ar ? "right" : "left",
          }}
        >
          {title}
        </Text>
        <View style={{ flexDirection: ar ? "row-reverse" : "row", gap: 8 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            onPress={() => setNotifications(true)}
            style={style}
          >
            <Bell size={14} color={headerForeground} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isDark ? "Switch to light mode" : "Switch to dark mode"
            }
            onPress={() => setThemeChoice(isDark ? "light" : "dark")}
            style={style}
          >
            {isDark ? (
              <Sun size={14} color={headerForeground} />
            ) : (
              <Moon size={14} color={headerForeground} />
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Account menu"
            onPress={() => setMenu(true)}
            style={[style, { overflow: "hidden" }]}
          >
            {user?.image ? (
              <Image
                source={{ uri: user.image }}
                style={{ width: 36, height: 36 }}
              />
            ) : (
              <Text
                style={{
                  fontSize: 12,
                  color: headerForeground,
                  fontFamily: fonts.sansBold,
                }}
              >
                {(user?.name || "Guest")[0]}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
      <NotificationsSheet
        open={notifications}
        onClose={() => setNotifications(false)}
      />
      <Modal
        visible={menu}
        transparent
        animationType="fade"
        onRequestClose={() => setMenu(false)}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close account menu"
          style={StyleSheet.absoluteFill}
          onPress={() => setMenu(false)}
        />
        <View
          style={{
            position: "absolute",
            top: insets.top + 60,
            ...(ar ? { left: 16 } : { right: 16 }),
            width: 192,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: st.border,
            backgroundColor: st.surface,
            overflow: "hidden",
          }}
        >
          {[
            { label: "Profile", Icon: User, run: () => go("/profile") },
            { label: "Settings", Icon: Pencil, run: () => go("/settings") },
            ...(["ADMIN", "SUPER_ADMIN", "FACULTY_LEADER"].includes(user?.role || "")
              ? [{ label: "Admin dashboard", Icon: ShieldCheck, run: () => go("/admin/dashboard") }]
              : []),
            {
              label: "Sign Out",
              Icon: LogOut,
              danger: true,
              run: async () => {
                setMenu(false);
                try {
                  await signOut();
                  router.replace("/(auth)/login");
                } catch {
                  Alert.alert(
                    "Could not sign out",
                    "Please try again. Your session has not been cleared."
                  );
                }
              },
            },
          ].map((item) => (
            <Pressable
              key={item.label}
              accessibilityRole="button"
              onPress={item.run}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                flexDirection: ar ? "row-reverse" : "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <item.Icon size={14} color={item.danger ? "#f87171" : st.muted} />
              <Text
                style={{
                  fontSize: 12,
                  color: item.danger ? "#f87171" : st.text,
                  fontFamily: fonts.sansSemiBold,
                }}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Modal>
    </>
  );
}
const styles = StyleSheet.create({
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
