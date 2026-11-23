import React from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import { StudentPageFrame } from "@/components/StudentPageFrame";
import { ResourceState } from "@/components/ResourceState";
import { useStudentExtra } from "@/lib/student-extras";
import { isFixtureMode } from "@/lib/fixtures";
type Grant = {
  id: string;
  clientName: string;
  scopes: string;
  createdAt: string;
  lastUsedAt: string;
};
export default function ConnectionsScreen() {
  const { colors, fonts } = useTheme();
  const resource = useStudentExtra<{ grants: Grant[] }>(
    "/mcp/connections",
    { grants: [] },
    "v1"
  );
  if (!resource.data)
    return (
      <ResourceState
        title="Connected AI apps"
        error={resource.error}
        onRetry={() => resource.refetch()}
      />
    );
  return (
    <StudentPageFrame
      title="Connected AI apps"
      maxWidth={576}
      guestSample={isFixtureMode()}
    >
      <View style={{ gap: 16, direction: "rtl" }}>
        <Text
          style={{
            fontSize: 20,
            fontFamily: fonts.arabicBold,
            color: colors.foreground,
            textAlign: "right",
          }}
        >
          تطبيقات الذكاء الاصطناعي المربوطة
        </Text>
        <Text
          style={{
            fontSize: 14,
            lineHeight: 23,
            fontFamily: fonts.arabic,
            color: colors.mutedForeground,
            textAlign: "right",
          }}
        >
          هذه التطبيقات تقدر تقرأ محتوى سمسترك وبياناتك فقط. إلغاء الربط يوقف
          الوصول خلال 15 دقيقة كحد أقصى.
        </Text>
        <View
          style={{
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.muted + "66",
            padding: 12,
            direction: "ltr",
          }}
        >
          <Text
            selectable
            style={{
              fontSize: 14,
              fontFamily: fonts.sans,
              color: colors.foreground,
            }}
          >
            Server URL: https://mcp.medonex.me/mcp
          </Text>
        </View>
        {resource.data.grants.length === 0 && (
          <Text
            style={{
              fontSize: 14,
              color: colors.mutedForeground,
              textAlign: "right",
              fontFamily: fonts.arabic,
            }}
          >
            {isFixtureMode()
              ? "معاينة محلية. سجّل الدخول لعرض التطبيقات المربوطة بحسابك."
              : "لا توجد تطبيقات مربوطة."}
          </Text>
        )}
        {resource.data.grants.map((grant) => (
          <View
            key={grant.id}
            style={{
              flexDirection: "row-reverse",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 12,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: fonts.sansSemiBold,
                  color: colors.foreground,
                  textAlign: "right",
                }}
              >
                {grant.clientName}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.mutedForeground,
                  textAlign: "right",
                  fontFamily: fonts.arabic,
                }}
              >
                آخر استخدام:{" "}
                {new Date(grant.lastUsedAt).toLocaleDateString("ar-EG")}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="إلغاء الربط"
              onPress={() =>
                Alert.alert(
                  "للقراءة فقط",
                  "لم يتم إلغاء أي ربط. إدارة التطبيقات المربوطة متاحة على الموقع."
                )
              }
              style={{
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: "#f87171",
                  fontFamily: fonts.arabic,
                }}
              >
                إلغاء الربط
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
    </StudentPageFrame>
  );
}
