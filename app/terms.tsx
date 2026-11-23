import{useStudentDimensions as useWindowDimensions}from'@/lib/student-viewport';
import React from "react";
import { Alert, Linking, Text, View, } from "react-native";
import { StudentPageFrame } from "@/components/StudentPageFrame";
import { useTheme } from "@/theme/ThemeContext";
import sections from "@/lib/student-terms.json";
const policyUrl = "https://www.medonex.me/docs/privacy";
export default function TermsScreen() {
  const { colors, st, fonts } = useTheme();
  const {viewportWidth, width } = useWindowDimensions();
  const tablet = viewportWidth >= 768;
  const open = (url: string) =>
    void Linking.openURL(url).catch(() =>
      Alert.alert("Link unavailable", "Please try again.")
    );
  return (
    <StudentPageFrame
      title="Terms of Use"
      eyebrow="Legal"
      heading="Terms of Use"
      subtitle="By using this platform you agree to use it responsibly and in line with your school's academic integrity rules."
      maxWidth={768}
    >
      <View style={{ gap: 24 }}>
        {sections.map((section) => (
          <View key={section.title}>
            <Text
              style={{
                fontSize: tablet ? 18 : 11,
                fontFamily: fonts.sansBold,
                letterSpacing: tablet ? 0 : 2,
                textTransform: tablet ? "none" : "uppercase",
                color: tablet ? colors.foreground : st.muted,
                marginBottom: 12,
              }}
            >
              {section.title}
            </Text>
            <Text
              selectable
              style={{
                fontSize: 14,
                lineHeight: 24,
                fontFamily: fonts.sans,
                color: colors.mutedForeground,
              }}
            >
              {section.body
                .split(/(Privacy Policy|support@medonex\.me)/)
                .map((part, index) =>
                  part === "Privacy Policy" ? (
                    <Text
                      key={index}
                      accessibilityRole="link"
                      onPress={() => open(policyUrl)}
                      style={{
                        textDecorationLine: "underline",
                        color: colors.foreground,
                      }}
                    >
                      {part}
                    </Text>
                  ) : part === "support@medonex.me" ? (
                    <Text
                      key={index}
                      accessibilityRole="link"
                      onPress={() => open("mailto:support@medonex.me")}
                      style={{
                        textDecorationLine: "underline",
                        color: colors.foreground,
                      }}
                    >
                      {part}
                    </Text>
                  ) : (
                    part
                  )
                )}
            </Text>
          </View>
        ))}
      </View>
    </StudentPageFrame>
  );
}
