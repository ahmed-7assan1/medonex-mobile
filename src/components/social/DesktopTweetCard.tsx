import React, { useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SvgXml } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import {
  Bookmark,
  ChevronDown,
  FileText,
  Film,
  Link as LinkIcon,
  Table,
  BarChart3,
  Sparkles,
  Music,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/theme/ThemeContext";
import { API_V1_URL } from "@/lib/api";
import { isFixtureMode } from "@/lib/fixtures";
import type { DesktopPost } from "@/lib/desktop-social";
const icons = require("../../../assets/social-icons.json") as Record<
  string,
  string
>;
export function SocialSourceIcon({
  name,
  color,
  size = 18,
}: {
  name: string;
  color: string;
  size?: number;
}) {
  return (
    <SvgXml
      xml={(icons[name] || icons.Reply).replaceAll("currentColor", color)}
      width={size}
      height={size}
      style={{ flexShrink: 0 }}
    />
  );
}
export function socialMediaUrl(value?: string | null) {
  if (!value) return null;
  try {
    if (
      value.length < 16000000 &&
      /^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$/.test(value)
    )
      return value;
    if (isFixtureMode()) return null;
    const url = new URL(value, new URL(API_V1_URL).origin);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

export function socialAvatarColor(name: string, sidebar = false) {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const palette = sidebar
    ? [
        "#5b5ef7",
        "#10a37f",
        "#f59e0b",
        "#e84040",
        "#8b5cf6",
        "#06b6d4",
        "#f97316",
        "#ec4899",
      ]
    : [
        "#6366f1",
        "#8b5cf6",
        "#ec4899",
        "#f43f5e",
        "#10b981",
        "#06b6d4",
        "#3b82f6",
        "#f59e0b",
      ];
  return palette[Math.abs(hash) % palette.length];
}
function InitialAvatar({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/),
    initials = (
      parts.length >= 2
        ? parts[0][0] + parts[parts.length - 1][0]
        : name.slice(0, 2)
    )
      .toUpperCase()
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  return (
    <SvgXml
      width={48}
      height={48}
      xml={
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="' +
        socialAvatarColor(name) +
        '"/><text x="50" y="50" dy=".35em" text-anchor="middle" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="40" font-weight="700" fill="#ffffff">' +
        initials +
        "</text></svg>"
      }
    />
  );
}

export const socialReadOnly = () =>
  Alert.alert(
    "Read-only preview",
    "No reaction, follow, save, room membership or account setting was changed."
  );
export function DesktopTweetCard({
  post,
  onOpen,
  onComments,
  detail = false,
}: {
  post: DesktopPost;
  onOpen: () => void;
  onComments: () => void;
  detail?: boolean;
}) {
  const { colors, isDark } = useTheme(),
    { height } = useWindowDimensions(),
    router = useRouter();
  const [expanded, setExpanded] = useState(detail),
    [overflow, setOverflow] = useState(false),
    [liked, setLiked] = useState(!!post.userReaction),
    [saved, setSaved] = useState(post.isSaved);
  const clamp = Math.round(Math.min(280, Math.max(140, height * 0.2)));
  const anon = post.isAnonymous || !post.author,
    name = anon ? "Anonymous" : post.author!.name;
  const avatar = anon ? null : socialMediaUrl(post.author?.avatarUrl);
  const authorHandle = anon
    ? "anonymous"
    : (post.author?.handle || post.author?.name || "user")
        .toLowerCase()
        .replace(/\s+/g, "");
  const age = Date.now() - Date.parse(post.createdAt),
    seconds = Math.max(0, Math.floor(age / 1000));
  const timestamp = !Number.isFinite(seconds)
    ? ""
    : seconds < 60
    ? "now"
    : seconds < 3600
    ? Math.floor(seconds / 60) + "m"
    : seconds < 86400
    ? Math.floor(seconds / 3600) + "h"
    : Math.floor(seconds / 86400) + "d";
  const gray = isDark ? "#9ca3af" : "#6b7280";
  const attachments = (post.attachments || []) as any[],
    images = attachments
      .filter(
        (item) => item.type === "image" || item.type?.startsWith("image/")
      )
      .map((item) => item.url);
  if (!images.length && post.imageUrl) images.push(post.imageUrl);
  const links = post.content.match(/https?:\/\/[^\s]+/g) || [];
  const videos = links.filter((url) =>
    /youtube\.com|youtu\.be|vimeo\.com/.test(url)
  );
  const generalLink = !videos.length ? links[0] : null;
  const font = (
    size: number,
    color = colors.foreground,
    weight: "400" | "500" | "600" | "700" | "800" = "400"
  ) => ({
    fontFamily: "Arial",
    fontSize: size,
    lineHeight: size * 1.65,
    letterSpacing: -0.15,
    color,
    fontWeight: weight,
  });
  const openMedia = (url?: string) => {
    const target = socialMediaUrl(url);
    if (target)
      void Linking.openURL(target).catch(() =>
        Alert.alert("Link unavailable", "This attachment could not open.")
      );
    else onOpen();
  };
  const tile = (key: string, label: string, Icon: any, url?: string) => (
    <Pressable
      key={key}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={(event) => {
        event.stopPropagation();
        url ? openMedia(url) : onOpen();
      }}
      style={{
        width: 150,
        height: 150,
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border + "99",
        backgroundColor: colors.muted + "66",
        padding: 12,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: colors.primary + "1A",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <SocialSourceIcon
          name={
            Icon === Film
              ? "PlayIcon"
              : Icon === Music
              ? "MusicalNoteIcon"
              : Icon === FileText
              ? "DocumentTextIcon"
              : Icon === LinkIcon
              ? "LinkIcon"
              : Icon === Table
              ? "TableCellsIcon"
              : Icon === BarChart3
              ? "ChartBarIcon"
              : "SparklesIcon"
          }
          size={24}
          color={colors.primary}
        />
      </View>
      <Text
        numberOfLines={1}
        style={{
          ...font(11, colors.mutedForeground, "500"),
          lineHeight: 13.75,
          textAlign: "center",
          width: "100%",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
  const compact = (count: number) =>
    count > 0
      ? new Intl.NumberFormat("en-US", {
          notation: "compact",
          maximumFractionDigits: 1,
        }).format(count)
      : "";
  const iconButton = (
    label: string,
    icon: React.ReactNode,
    onPress: () => void,
    count?: number,
    color = colors.mutedForeground
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={(event) => {
        event.stopPropagation();
        onPress();
      }}
      style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 999,
        }}
      >
        {icon}
      </View>
      {typeof count === "number" && (
        <Text style={font(13, color, "500")}>{compact(count)}</Text>
      )}
    </Pressable>
  );
  const share = async () => {
    if (isFixtureMode()) {
      Alert.alert("Guest preview", "Sample posts cannot be shared.");
      return;
    }
    try {
      await Share.share({
        message: new URL(
          "/social?post=" + encodeURIComponent(post.id),
          new URL(API_V1_URL).origin
        ).href,
      });
    } catch {}
  };
  const change = (kind: "like" | "save") => {
    if (!isFixtureMode()) {
      socialReadOnly();
      return;
    }
    kind === "like" ? setLiked((value) => !value) : setSaved((value) => !value);
  };
  const media =
    images.length ||
    videos.length ||
    generalLink ||
    attachments.some((item) => item.type !== "image") ||
    post.tableData ||
    post.poll ||
    post.questions?.length ||
    post.flashcards ||
    post.sharedQuestion ||
    post.sharedQuestionData ||
    post.quizData;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={"Open post by " + name}
      onPress={detail ? undefined : onOpen}
      style={{
        width: "100%",
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: isDark ? "rgba(255,255,255,.1)" : "rgba(229,231,235,.8)",
        backgroundColor: isDark ? colors.card + "BF" : "rgba(255,255,255,.95)",
        ...(!isDark
          ? {
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowRadius: 1,
              shadowOffset: { width: 0, height: 1 },
            }
          : {}),
      }}
    >
      <View
        style={{
          flexDirection: "row",
          gap: 16,
          paddingHorizontal: 6,
          paddingTop: 6,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={"Profile of " + name}
          disabled={anon}
          onPress={(event) => {
            event.stopPropagation();
            if (post.author?.id && !anon)
              router.push(
                `/profile/${encodeURIComponent(post.author.id)}` as never
              );
          }}
          style={{
            width: 48,
            height: 48,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
            overflow: "visible",
            backgroundColor: colors.muted,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            {avatar ? (
              <Image
                source={{ uri: avatar }}
                style={{ width: 48, height: 48 }}
              />
            ) : (
              <InitialAvatar name={name} />
            )}
          </View>
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              inset: -2,
              borderRadius: 999,
              borderWidth: 2,
              borderColor: colors.primary + "33",
            }}
          />
        </Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Text
                style={{
                  ...font(15, isDark ? "#fff" : "#111827", "700"),
                  lineHeight: 20,
                }}
              >
                {name}
              </Text>
              {!anon && post.author?.telegramVerified && (
                <SocialSourceIcon name="Verified" color="#0ea5e9" />
              )}
              <Text style={{ ...font(15, gray), lineHeight: 20 }}>
                @{authorHandle}
              </Text>
              <Text style={{ ...font(15, "#9ca3af"), lineHeight: 20 }}>·</Text>
              <Text style={{ ...font(15, "#6b7280"), lineHeight: 20 }}>
                {timestamp}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Post options"
              onPress={(event) => {
                event.stopPropagation();
                Alert.alert("Post options", undefined, [
                  { text: "Open post", onPress: onOpen },
                  { text: "Cancel", style: "cancel" },
                ]);
              }}
            >
              <SocialSourceIcon name="Dots" color="#9ca3af" size={20} />
            </Pressable>
          </View>
          <View style={{ marginTop: 8 }}>
            <View
              style={{
                maxHeight: overflow && !expanded ? clamp : undefined,
                overflow: "hidden",
              }}
            >
              <View
                onLayout={(event) =>
                  setOverflow(event.nativeEvent.layout.height > clamp + 4)
                }
              >
                <Text
                  style={{
                    ...font(15, isDark ? "#f3f4f6" : "#1f2937"),
                    lineHeight: 24.375,
                  }}
                >
                  {post.content}
                </Text>
                {!!post.hashtags?.length && (
                  <View
                    style={{
                      marginTop: 8,
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    {post.hashtags.map((tag) => (
                      <Text key={tag} style={font(15, colors.primary, "500")}>
                        #{tag}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            </View>
            {overflow && !expanded && (
              <LinearGradient
                pointerEvents="none"
                colors={[
                  isDark ? colors.card + "00" : "#ffffff00",
                  isDark ? colors.card + "CC" : "#ffffffCC",
                  isDark ? colors.card : "#ffffff",
                ]}
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 40,
                }}
              />
            )}
            {overflow && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={expanded ? "Show less" : "Show more"}
                onPress={(event) => {
                  event.stopPropagation();
                  setExpanded((value) => !value);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  marginTop: 4,
                  zIndex: 10,
                }}
              >
                <Text
                  style={{ ...font(14, colors.primary, "600"), lineHeight: 20 }}
                >
                  {expanded ? "Show less" : "Show more"}
                </Text>
                <ChevronDown
                  size={16}
                  color={colors.primary}
                  style={
                    expanded ? { transform: [{ rotate: "180deg" }] } : undefined
                  }
                />
              </Pressable>
            )}
          </View>
          {
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 12 }}
              contentContainerStyle={{
                gap: 10,
                paddingBottom: 4,
                alignItems: "flex-start",
              }}
            >
              {images.slice(0, 8).map((url, index) => {
                const source = socialMediaUrl(url);
                return source ? (
                  <Pressable
                    key={"image" + index}
                    accessibilityRole="button"
                    accessibilityLabel="Open attached image"
                    onPress={(event) => {
                      event.stopPropagation();
                      openMedia(url);
                    }}
                  >
                    <Image
                      source={{ uri: source }}
                      style={{ width: 150, height: 150, borderRadius: 12 }}
                      resizeMode="cover"
                    />
                  </Pressable>
                ) : null;
              })}
              {videos.map((url, index) =>
                tile(
                  "youtube" + index,
                  videos.length > 1 ? "Video " + (index + 1) : "Video",
                  Film,
                  url
                )
              )}
              {attachments
                .filter(
                  (item) =>
                    item.type === "video" ||
                    item.type?.startsWith("video/") ||
                    /\.(mp4|mov|webm|avi|mkv)$/i.test(item.url)
                )
                .slice(0, 3)
                .map((item, index) =>
                  tile(
                    "video" + index,
                    item.name || "Video " + (index + 1),
                    Film,
                    item.url
                  )
                )}
              {attachments
                .filter(
                  (item) =>
                    item.type === "audio" || item.type?.startsWith("audio/")
                )
                .slice(0, 2)
                .map((item, index) =>
                  tile("audio" + index, item.name || "Audio", Music, item.url)
                )}
              {attachments
                .filter(
                  (item) => item.type === "file" || /pdf|doc/.test(item.type)
                )
                .slice(0, 5)
                .map((item, index) =>
                  tile(
                    "file" + index,
                    item.name || "Attachment",
                    FileText,
                    item.url
                  )
                )}
              {generalLink &&
                tile(
                  "link",
                  generalLink.replace(/^https?:\/\//, "").slice(0, 40),
                  LinkIcon,
                  generalLink
                )}
              {!!post.tableData && tile("table", "Table", Table)}
              {!!post.poll?.options &&
                tile("poll", post.poll.question || "Poll", BarChart3)}
              {!!(
                post.questions?.length ||
                post.quizData ||
                post.sharedQuestion ||
                post.sharedQuestionData ||
                post.flashcards
              ) &&
                tile(
                  "question",
                  post.questions?.length
                    ? post.questions.length +
                        " question" +
                        (post.questions.length > 1 ? "s" : "")
                    : post.flashcards
                    ? "Flashcards"
                    : "Practice question",
                  Sparkles
                )}
            </ScrollView>
          }
        </View>
      </View>
      <View
        style={{
          marginTop: 16,
          paddingTop: 12,
          paddingRight: 6,
          borderTopWidth: 1,
          borderColor: colors.border + "66",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 24 }}>
          {iconButton(
            "Like post",
            <SocialSourceIcon
              name={liked ? "LikeFilled" : "Like"}
              color={liked ? "#f43f5e" : colors.mutedForeground}
            />,
            () => change("like"),
            (post.likesCount || 0) +
              (liked && !post.userReaction
                ? 1
                : !liked && post.userReaction
                ? -1
                : 0),
            liked ? "#f43f5e" : colors.mutedForeground
          )}
          {iconButton(
            "Post comments",
            <SocialSourceIcon name="Reply" color={colors.mutedForeground} />,
            onComments,
            post.commentCount
          )}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {iconButton(
            "Share post",
            <SocialSourceIcon name="Share" color={colors.mutedForeground} />,
            () => void share()
          )}
          {iconButton(
            "Save post",
            <Bookmark
              size={18}
              color={saved ? colors.primary : colors.mutedForeground}
              fill={saved ? colors.primary : "transparent"}
            />,
            () => change("save")
          )}
        </View>
      </View>
    </Pressable>
  );
}
