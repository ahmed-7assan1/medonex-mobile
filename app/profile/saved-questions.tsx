import{useStudentDimensions as useWindowDimensions}from'@/lib/student-viewport';
import React from "react";
import { Pressable, Text, View, } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Bookmark } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeContext";
import { StudentPageFrame } from "@/components/StudentPageFrame";
import { ResourceState } from "@/components/ResourceState";
import { useStudentExtra } from "@/lib/student-extras";
import { isFixtureMode } from "@/lib/fixtures";
import { stripMarkdown } from "@/lib/stripMarkdown";
type SavedQuestion = {
  id: string;
  createdAt: string;
  question: {
    id: string;
    body: string;
    difficulty: string;
    questionType: string;
    lecture?: {
      title: string;
      subject?: { module?: { name: string } | null } | null;
    } | null;
  };
};
const types: Record<string, string> = {
  MCQ: "MCQ",
  MULTI_SELECT: "Multi select",
  TRUE_FALSE: "True / false",
  CASE_BASED: "Case-based",
  ESSAY: "Essay",
};
const context = (item: SavedQuestion) =>
  item.question.lecture?.subject?.module?.name
    ? item.question.lecture.subject.module.name +
      " • " +
      item.question.lecture.title
    : "Question Bank";
export default function SavedQuestionsScreen() {
  const { colors, st, fonts } = useTheme();
  const {viewportWidth, width } = useWindowDimensions();
  const tablet = viewportWidth >= 768;
  const router = useRouter();
  const resource = useStudentExtra<SavedQuestion[]>("/saved-questions", []);
  const saved = resource.data;
  if (!saved)
    return (
      <ResourceState
        title="Saved Questions"
        error={resource.error}
        onRetry={() => resource.refetch()}
      />
    );
  const text = tablet ? colors.foreground : st.text;
  const muted = tablet ? colors.mutedForeground : st.muted;
  return (
    <StudentPageFrame
      title="Saved Questions"
      maxWidth={896}
      guestSample={isFixtureMode()}
    >
      {tablet && (
        <>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace("/")}
            style={{
              flexDirection: "row",
              gap: 6,
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <ArrowLeft size={16} color={muted} />
            <Text
              style={{ fontSize: 14, color: muted, fontFamily: fonts.sans }}
            >
              Back to dashboard
            </Text>
          </Pressable>
          <View
            style={{
              flexDirection: "row",
              gap: 12,
              alignItems: "center",
              marginBottom: 32,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                backgroundColor: colors.primary + "1A",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bookmark size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontFamily: fonts.display, fontSize: 24, color: text }}
              >
                Saved Questions
              </Text>
              <Text
                style={{ fontFamily: fonts.sans, fontSize: 14, color: muted }}
              >
                Review questions you've bookmarked for later study.
              </Text>
            </View>
          </View>
        </>
      )}
      {saved.length === 0 ? (
        <View
          style={{
            borderRadius: 16,
            borderWidth: 1,
            borderColor: tablet ? colors.border : st.border,
            backgroundColor: tablet ? colors.card : st.surface,
            paddingHorizontal: 24,
            paddingVertical: tablet ? 80 : 56,
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: tablet ? "transparent" : st.surfacePressed,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <Bookmark size={tablet ? 40 : 24} strokeWidth={1.5} color={muted} />
          </View>
          <Text
            style={{
              fontSize: tablet ? 18 : 11,
              fontFamily: fonts.sansBold,
              letterSpacing: tablet ? 0 : 2,
              color: tablet ? muted : text,
              textTransform: tablet ? "none" : "uppercase",
            }}
          >
            No saved questions
          </Text>
          <Text
            style={{
              fontSize: tablet ? 14 : 13,
              fontFamily: fonts.sans,
              color: muted,
              marginTop: 8,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            Bookmark questions during quizzes to see them here
            {tablet ? "." : ""}
          </Text>
          {!tablet && (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/qbank")}
              style={{
                height: 44,
                marginTop: 24,
                width: "100%",
                borderRadius: 999,
                backgroundColor: st.pillFill,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: fonts.sansMedium,
                  color: st.pillText,
                }}
              >
                Browse question bank
              </Text>
            </Pressable>
          )}
        </View>
      ) : tablet ? (
        <View style={{ gap: 16 }}>
          {saved.map((item) => (
            <View
              key={item.id}
              style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.card,
                padding: 20,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    borderRadius: 20,
                    paddingHorizontal: 10,
                    paddingVertical: 3,
                    backgroundColor: colors.primary + "1A",
                    fontSize: 12,
                    color: colors.primary,
                    fontFamily: fonts.sansSemiBold,
                  }}
                >
                  {item.question.questionType}
                </Text>
                <Text style={{ fontSize: 12, color: muted }}>
                  Saved {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text
                numberOfLines={3}
                style={{
                  fontSize: 14,
                  fontFamily: fonts.sansMedium,
                  color: text,
                }}
              >
                {item.question.body}
              </Text>
              <View
                style={{
                  marginTop: 16,
                  paddingTop: 16,
                  borderTopWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 12, color: muted }}>
                  {context(item)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={{ gap: 24 }}>
          {["EASY", "MEDIUM", "HARD"].map((level) => {
            const items = saved.filter(
              (item) => item.question.difficulty === level
            );
            return items.length ? (
              <View key={level}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingHorizontal: 4,
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: fonts.sansBold,
                      letterSpacing: 2,
                      color: muted,
                    }}
                  >
                    {level}
                  </Text>
                  <Text style={{ fontSize: 11, color: muted }}>
                    {items.length}
                  </Text>
                </View>
                <View style={{ gap: 2 }}>
                  {items.map((item, index) => (
                    <View
                      key={item.id}
                      style={{
                        minHeight: 68,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 14,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        backgroundColor: st.surface,
                        borderTopLeftRadius: index === 0 ? 16 : 4,
                        borderTopRightRadius: index === 0 ? 16 : 4,
                        borderBottomLeftRadius:
                          index === items.length - 1 ? 16 : 4,
                        borderBottomRightRadius:
                          index === items.length - 1 ? 16 : 4,
                      }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 12,
                          backgroundColor: st.surfacePressed,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Bookmark size={18} color={text} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          numberOfLines={2}
                          style={{
                            fontSize: 15,
                            lineHeight: 20,
                            color: text,
                            fontFamily: fonts.sans,
                          }}
                        >
                          {stripMarkdown(item.question.body)}
                        </Text>
                        <Text
                          numberOfLines={1}
                          style={{
                            fontSize: 13,
                            lineHeight: 18,
                            color: muted,
                            fontFamily: fonts.sans,
                            marginTop: 4,
                          }}
                        >
                          {types[item.question.questionType] ||
                            item.question.questionType}{" "}
                          · {context(item)}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 11, color: muted }}>
                        {new Date(item.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null;
          })}
        </View>
      )}
    </StudentPageFrame>
  );
}
