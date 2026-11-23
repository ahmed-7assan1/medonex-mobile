import{useStudentDimensions as useWindowDimensions}from'@/lib/student-viewport';
import React from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeContext";
import { SCROLL_BOTTOM_PAD } from "@/theme/tokens";
import { MobilePageHeader } from "./MobilePageHeader";
import { FloatingStudentHeader } from "./FloatingStudentHeader";
import { FadeEdges } from "./FadeEdges";
export function StudentPageFrame({
  title,
  eyebrow,
  heading,
  subtitle,
  children,
  guestSample = false,
  maxWidth = 1152,
  flatPhone = true,
}: {
  title: string;
  eyebrow?: string;
  heading?: string;
  subtitle?: string;
  children: React.ReactNode;
  guestSample?: boolean;
  maxWidth?: number;
  flatPhone?: boolean;
}) {
  const {viewportWidth, width } = useWindowDimensions();
  const tablet = viewportWidth >= 768;
  const { st, colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: tablet || !flatPhone ? colors.background : st.bg,
        paddingTop: insets.top,
      }}
    >
      {!tablet &&
        (flatPhone ? (
          <View style={{ zIndex: 10 }}>
            <MobilePageHeader title={title} />
          </View>
        ) : (
          <FloatingStudentHeader title={title} />
        ))}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          width: "100%",
          maxWidth,
          alignSelf: "center",
          paddingHorizontal: tablet ? 24 : 16,
          paddingTop: tablet ? 32 : !flatPhone ? 72 : 12,
          paddingBottom: SCROLL_BOTTOM_PAD + insets.bottom,
        }}
      >
        {tablet && heading && (
          <View style={{ marginBottom: 40 }}>
            {eyebrow && (
              <Text
                style={{
                  fontSize: 11,
                  letterSpacing: 2,
                  fontFamily: fonts.sansBold,
                  color: colors.primary,
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                {eyebrow}
              </Text>
            )}
            <Text
              style={{
                fontSize: 46,
                lineHeight: 53,
                color: colors.foreground,
                fontFamily: fonts.display,
              }}
            >
              {heading}
            </Text>
            {subtitle && (
              <Text
                style={{
                  maxWidth: 760,
                  marginTop: 16,
                  fontSize: 16,
                  lineHeight: 25,
                  color: colors.mutedForeground,
                  fontFamily: fonts.sans,
                }}
              >
                {subtitle}
              </Text>
            )}
            <View
              style={{
                width: 80,
                height: 4,
                borderRadius: 4,
                backgroundColor: colors.primary + "33",
                marginTop: 32,
              }}
            />
          </View>
        )}
        {guestSample && (
          <Text
            style={{
              fontSize: 12,
              lineHeight: 18,
              color: st.muted,
              fontFamily: fonts.sans,
              marginBottom: 12,
            }}
          >
            Guest preview. Sample data stays on this device.
          </Text>
        )}
        {children}
      </ScrollView>
      <FadeEdges top bottom />
    </View>
  );
}
