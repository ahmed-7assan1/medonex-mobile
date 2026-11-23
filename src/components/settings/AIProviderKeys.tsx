import React from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  CheckCircle2,
  Eye,
  Save,
  Sparkles,
  TestTube,
} from "lucide-react-native";
import { useTheme } from "@/theme/ThemeContext";
import { useAIProviderStatus } from "@/lib/ai-provider-status";
import { useStudentDimensions } from "@/lib/student-viewport";
import { isFixtureMode } from "@/lib/fixtures";
/** Source AiKeyManager layout. Native reads presence metadata, never key bytes. */
export function AIProviderKeys() {
  const { colors, fonts, isDark } = useTheme();
  const { viewportWidth } = useStudentDimensions();
  const phone = viewportWidth < 768;
  const resource = useAIProviderStatus();
  const guest = isFixtureMode();
  const guard = () =>
    Alert.alert(
      "Read-only preview",
      "No key was saved or tested. This app does not collect API keys. Manage keys on the website."
    );
  const text = colors.foreground;
  const muted = colors.mutedForeground;
  if (!resource.data)
    return (
      <View style={{ paddingVertical: 64, alignItems: "center", gap: 16 }}>
        {resource.error ? (
          <>
            <Text
              style={{
                color: muted,
                fontSize: 13,
                fontFamily: fonts.sans,
                textAlign: "center",
              }}
            >
              Provider status could not load. No demo status will replace your
              account data.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => resource.refetch()}
            >
              <Text style={{ color: text, fontFamily: fonts.sansBold }}>
                Try again
              </Text>
            </Pressable>
          </>
        ) : (
          <ActivityIndicator color={text} />
        )}
      </View>
    );
  return (
    <View
      style={{ width: "100%", maxWidth: 672, alignSelf: "center", gap: 16 }}
    >
      {guest && (
        <Text
          style={{
            fontSize: 12,
            lineHeight: 18,
            color: muted,
            fontFamily: fonts.sans,
          }}
        >
          Guest preview. Provider status has not been checked.
        </Text>
      )}
      <View
        style={{
          padding: 20,
          borderRadius: 28,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          gap: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isDark ? "#f59e0b1a" : "#fffbeb",
            }}
          >
            <Sparkles size={20} color="#f59e0b" />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text
              style={{
                fontSize: 10,
                fontFamily: fonts.sansBold,
                letterSpacing: 2,
                color: isDark ? "#ffffff4d" : "#94a3b8",
              }}
            >
              BYOK, BRING YOUR OWN KEY
            </Text>
            <Text
              style={{
                fontSize: 9,
                lineHeight: 14,
                fontFamily: fonts.sansSemiBold,
                color: isDark ? "#ffffff66" : "#94a3b8",
              }}
            >
              Only key-set status is read. Keys stay on the website.
            </Text>
          </View>
        </View>
        <View style={{ gap: 12 }}>
          {resource.data.providers.map((provider) => (
            <View
              key={provider.id}
              style={{
                padding: 16,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border + "99",
                backgroundColor: isDark ? "#ffffff0d" : "#0000001a",
                gap: 12,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    flex: 1,
                  }}
                >
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: colors.primary + "1a",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontFamily: fonts.sansBold,
                        color: colors.primary,
                      }}
                    >
                      {provider.name[0]}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: fonts.sansBold,
                      color: text,
                      flexShrink: 1,
                    }}
                  >
                    {provider.name}
                  </Text>
                </View>
                {provider.configured === true ? (
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 4,
                      alignItems: "center",
                    }}
                  >
                    <CheckCircle2 size={12} color="#10b981" />
                    <Text
                      style={{
                        fontSize: 10,
                        color: "#10b981",
                        fontFamily: fonts.sansBold,
                      }}
                    >
                      Key set
                    </Text>
                  </View>
                ) : provider.configured === null && !guest ? (
                  <Text
                    style={{
                      fontSize: 10,
                      color: muted,
                      fontFamily: fonts.sans,
                    }}
                  >
                    Status unavailable
                  </Text>
                ) : null}
              </View>
              <View
                style={{
                  borderWidth: 1,
                  borderColor: "#ffffff0f",
                  borderRadius: 12,
                  backgroundColor: isDark ? "#ffffff0d" : "#00000033",
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                }}
              >
                <TextInput
                  accessibilityLabel={provider.name + " API key, read-only"}
                  value=""
                  editable={false}
                  secureTextEntry
                  placeholder={
                    provider.configured === true
                      ? "A key is set on the website"
                      : "Keys are managed on the website"
                  }
                  placeholderTextColor={muted}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    height: 40,
                    fontSize: 12,
                    color: text,
                    fontFamily: fonts.sans,
                  }}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    "About " + provider.name + " key visibility"
                  }
                  onPress={guard}
                  style={{ padding: 4 }}
                >
                  <Eye size={14} color={muted} />
                </Pressable>
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={"Save " + provider.name + " key"}
                  onPress={guard}
                  style={{
                    height: phone ? 44 : 28,
                    borderRadius: 99,
                    paddingHorizontal: phone ? 20 : 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    backgroundColor: colors.primary,
                    opacity: 0.4,
                  }}
                >
                  <Save
                    size={phone ? 14 : 12}
                    color={colors.primaryForeground}
                  />
                  <Text
                    style={{
                      fontSize: phone ? 11 : 10,
                      fontFamily: fonts.sansBold,
                      letterSpacing: 0.5,
                      color: colors.primaryForeground,
                    }}
                  >
                    SAVE
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={"Test " + provider.name + " key"}
                  onPress={guard}
                  style={{
                    height: phone ? 44 : 28,
                    borderRadius: 99,
                    paddingHorizontal: phone ? 20 : 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    borderWidth: 1,
                    borderColor: colors.border,
                    opacity: provider.configured === true ? 1 : 0.4,
                  }}
                >
                  <TestTube size={phone ? 14 : 12} color={text} />
                  <Text
                    style={{
                      fontSize: phone ? 11 : 10,
                      fontFamily: fonts.sansBold,
                      letterSpacing: 0.5,
                      color: text,
                    }}
                  >
                    TEST
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </View>
      <Text
        style={{
          fontSize: 12,
          lineHeight: 18,
          color: muted,
          fontFamily: fonts.sans,
        }}
      >
        Read-only account preview. Saving and testing are not available here. No
        provider request is made.
      </Text>
    </View>
  );
}
