import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Image,
  Alert,
  useWindowDimensions,
} from "react-native";
import { X, Send, MessageCircle, Heart } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/ThemeContext";
import { api } from "@/lib/api";
import { isFixtureMode } from "@/lib/fixtures";
import { useLiveEnabled } from "@/lib/query-mode";
import { Sheet } from "../Sheet";
import { timeAgo } from "./format";

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string; image?: string; handle?: string };
  replies?: Comment[];
  _count?: { likes: number };
};

// Mirrors the mobile site CommentsDrawer: 70vh sheet, floating send capsule
// (بيتشال) with a bottom fade gradient behind it, content scrolls under.
const CAPSULE_FADE_HEIGHT = 80;

export function CommentsSheet({
  postId,
  onClose,
}: {
  postId: string | null;
  onClose: () => void;
}) {
  const { st, fonts } = useTheme();
  const { i18n } = useTranslation();
  const ar = i18n.language === "ar";
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [sort, setSort] = useState<"top" | "newest" | "oldest">("top");
  const [draft, setDraft] = useState("");
  const live = useLiveEnabled();
  const resource = useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const [post, comments] = await Promise.all([
        api.get<{ content: string }>(`/posts/${encodeURIComponent(postId!)}`),
        api.get<Comment[]>(`/posts/${encodeURIComponent(postId!)}/comments`),
      ]);
      return { post, comments };
    },
    enabled: live && !!postId,
    retry: 1,
  });

  const comments = [...(resource.data?.comments ?? [])].sort((a, b) =>
    sort === "top"
      ? (b._count?.likes ?? 0) - (a._count?.likes ?? 0)
      : sort === "newest"
        ? Date.parse(b.createdAt) - Date.parse(a.createdAt)
        : Date.parse(a.createdAt) - Date.parse(b.createdAt)
  );

  const readOnly = () =>
    Alert.alert(
      ar ? "معاينة للقراءة فقط" : "Read-only preview",
      ar
        ? "التعليق ما اتبعتش. التعليق من خلال الموقع."
        : "Your comment has not been sent. Use the website to comment."
    );

  const row = (comment: Comment, reply = false) => (
    <View
      key={comment.id}
      style={{ flexDirection: "row", gap: 10, paddingVertical: 12, marginLeft: reply ? 36 : 0 }}
    >
      <View
        style={{
          width: reply ? 28 : 36,
          height: reply ? 28 : 36,
          borderRadius: 18,
          backgroundColor: st.surface,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {comment.author.image ? (
          <Image source={{ uri: comment.author.image }} style={{ width: "100%", height: "100%" }} />
        ) : (
          <Text style={{ color: st.text }}>{comment.author.name?.[0]}</Text>
        )}
      </View>
      <View style={{ flex: 1, gap: 5 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
          <Text style={{ color: st.text, fontSize: 13, fontFamily: fonts.sansBold }}>
            {comment.author.name}
          </Text>
          <Text style={{ color: st.muted, fontSize: 11 }}>{timeAgo(comment.createdAt)}</Text>
        </View>
        <Text style={{ color: st.text, fontSize: 14, lineHeight: 20 }}>{comment.content}</Text>
        <View style={{ flexDirection: "row", gap: 24, marginTop: 4 }}>
          <Pressable accessibilityRole="button" onPress={readOnly}>
            <Text style={{ color: st.muted, fontSize: 11 }}>{ar ? "رد" : "Reply"}</Text>
          </Pressable>
          <View style={{ flexDirection: "row", gap: 5 }}>
            <Heart size={12} color={st.muted} />
            <Text style={{ fontSize: 11, color: st.muted }}>{comment._count?.likes ?? 0}</Text>
          </View>
        </View>
        {comment.replies?.map((r) => row(r, true))}
      </View>
    </View>
  );

  return (
    <Sheet
      visible={!!postId}
      onClose={onClose}
      heightFraction={0.7}
      center={isDesktop}
      testID="comments-sheet"
    >
      <View style={{ flex: 1, backgroundColor: st.bg, borderWidth: 1, borderColor: st.border }}>
        <View style={{ alignItems: "center", paddingTop: 12 }}>
          <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: st.border }} />
        </View>
        <View style={{ height: 56, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <MessageCircle size={20} color={st.text} />
          <Text style={{ flex: 1, fontSize: 17, fontFamily: fonts.sansSemiBold, color: st.text }}>
            {ar ? "التعليقات" : "Comments"}
            {comments.length > 0 && (
              <Text style={{ fontSize: 12, color: st.muted }}> ({comments.length})</Text>
            )}
          </Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Close comments" onPress={onClose} style={{ padding: 10 }}>
            <X size={18} color={st.muted} />
          </Pressable>
        </View>
        <View
          style={{
            flexDirection: "row",
            gap: 20,
            paddingHorizontal: 20,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderColor: st.border,
          }}
        >
          {(["top", "newest", "oldest"] as const).map((s) => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: s === sort }}
              key={s}
              onPress={() => setSort(s)}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: fonts.sansSemiBold,
                  color: sort === s ? st.text : st.muted,
                }}
              >
                {ar
                  ? { top: "الأفضل", newest: "الأحدث", oldest: "الأقدم" }[s]
                  : { top: "Top", newest: "Newest", oldest: "Oldest" }[s]}
              </Text>
            </Pressable>
          ))}
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: CAPSULE_FADE_HEIGHT + 64 + insets.bottom,
          }}
        >
          {isFixtureMode() ? (
            <Text style={{ color: st.muted, fontSize: 14, textAlign: "center", paddingVertical: 60 }}>
              {ar
                ? "المنشور ده تجريبي ومفيش تعليقات حقيقية في وضع الضيف."
                : "This is a sample post. Live comments are unavailable in guest mode."}
            </Text>
          ) : resource.isLoading ? (
            <Text style={{ color: st.muted, textAlign: "center", padding: 40 }}>
              {ar ? "جاري التحميل..." : "Loading..."}
            </Text>
          ) : resource.isError ? (
            <View style={{ paddingVertical: 48, alignItems: "center", gap: 16 }}>
              <Text style={{ color: st.muted }}>{ar ? "تعذر تحميل التعليقات" : "Could not load comments"}</Text>
              <Pressable accessibilityRole="button" onPress={() => resource.refetch()}>
                <Text style={{ color: st.text }}>{ar ? "حاول تاني" : "Try again"}</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {!!resource.data?.post.content && (
                <Text
                  style={{
                    color: st.text,
                    fontSize: 15,
                    lineHeight: 22,
                    paddingVertical: 16,
                    borderBottomWidth: 1,
                    borderColor: st.border,
                  }}
                >
                  {resource.data.post.content}
                </Text>
              )}
              {comments.length ? (
                comments.map((c) => row(c))
              ) : (
                <View style={{ paddingVertical: 48, alignItems: "center", gap: 12 }}>
                  <MessageCircle size={32} color={st.muted} />
                  <Text style={{ color: st.muted, fontSize: 14 }}>
                    {ar ? "مفيش تعليقات لسه" : "No comments yet"}
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
        {/* Floating capsule (site parity): gradient fade behind, no welded bar. */}
        <View
          pointerEvents="box-none"
          style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
        >
          <LinearGradient
            pointerEvents="none"
            colors={[`${st.bg}00`, st.bg]}
            style={{ height: CAPSULE_FADE_HEIGHT }}
          />
          <View
            style={{
              backgroundColor: st.bg,
              paddingHorizontal: 16,
              paddingTop: 4,
              paddingBottom: 12 + insets.bottom,
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: "100%",
                maxWidth: 448,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                borderRadius: 28,
                paddingLeft: 16,
                paddingRight: 6,
                paddingVertical: 6,
                backgroundColor: st.surface,
                borderWidth: 1,
                borderColor: st.border,
              }}
            >
              <TextInput
                accessibilityLabel={ar ? "اكتب تعليق" : "Write a comment"}
                value={draft}
                onChangeText={setDraft}
                placeholder={ar ? "اكتب تعليق..." : "Write a comment..."}
                placeholderTextColor={st.muted}
                style={{ flex: 1, height: 40, color: st.text, fontSize: 14 }}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Send comment"
                onPress={readOnly}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: st.text,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Send size={16} color={st.bg} />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Sheet>
  );
}
