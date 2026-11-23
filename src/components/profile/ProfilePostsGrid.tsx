import React, { useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { StudentVideoPlayer } from "@/components/StudentVideoPlayer";
import { LinearGradient } from "expo-linear-gradient";
import {
  BookOpen,
  FileText,
  Heart,
  MessageCircle,
  Play,
  X,
} from "lucide-react-native";
import { useTheme } from "@/theme/ThemeContext";
import { useStudentDimensions } from "@/lib/student-viewport";
import { isFixtureMode } from "@/lib/fixtures";
import type { Post } from "@/lib/community";
import { PostCard } from "@/components/social/PostCard";
import { profilePalette } from "./ProfileDesktop";
function youtubeId(content: string) {
  for (const match of content.matchAll(/https?:\/\/[^\s<>]+/g)) {
    try {
      const url = new URL(match[0]);
      const host = url.hostname.toLowerCase().replace(/^www\./, "");
      const id =
        host === "youtu.be"
          ? url.pathname.slice(1).split("/")[0]
          : ["youtube.com", "m.youtube.com"].includes(host)
          ? url.searchParams.get("v") ||
            url.pathname.match(/^\/(?:shorts|embed)\/([^/]+)/)?.[1]
          : null;
      if (id && /^[\w-]{11}$/.test(id)) return id;
    } catch {}
  }
  return null;
}
/** Source PostsGrid: three square luxury cards, actual attachment kinds and counts. */
export function ProfilePostsGrid({ posts }: { posts: Post[] }) {
  const { width, viewportWidth } = useStudentDimensions();
  const { isDark, fonts, colors } = useTheme();
  const p = profilePalette(isDark);
  const [active, setActive] = useState<Post | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const activeVideo = active ? youtubeId(active.content) : null;
  const openLink = (raw: string) => {
    if (isFixtureMode()) {
      Alert.alert("Guest preview", "Sample attachments cannot be opened.");
      return;
    }
    try {
      const url = new URL(raw);
      if (url.protocol !== "https:") throw Error();
      void Linking.openURL(url.toString()).catch(() =>
        Alert.alert("Link unavailable", "The attachment could not be opened.")
      );
    } catch {
      Alert.alert(
        "Link unavailable",
        "This attachment has no supported HTTPS link."
      );
    }
  };
  const [hover, setHover] = useState<string | null>(null);
  const size =
    (Math.min(width, 1080) - (viewportWidth >= 1024 ? 48 : 32) - 32) / 3;
  return (
    <>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
        {posts.map((post) => {
          const id = youtubeId(post.content);
          const file = post.attachments?.find((item) => item.type === "file");
          const image =
            post.imageUrl ||
            post.attachments?.find((item) => item.type === "image")?.url;
          const kind = id ? "video" : file ? "file" : image ? "image" : "text";
          const lecture = [
            ...post.content.matchAll(/@\[([^\]]+)\]\(LECTURE:([^)]+)\)/g),
          ][0];
          const caption = post.content
            .replace(/@\[([^\]]+)\]\((?:USER|LECTURE|MODULE):[^)]+\)/g, "")
            .trim();
          const lines = caption.split("\n").filter(Boolean);
          const multiline = lines.length > 1;
          return (
            <Pressable
              key={post.id}
              accessibilityRole="button"
              accessibilityLabel={
                "Open post: " + (file?.name || caption || "Post").slice(0, 100)
              }
              onPress={() => {
                setPlaying(false);
                setMuted(true);
                setActive(post);
              }}
              onHoverIn={() => setHover(post.id)}
              onHoverOut={() => setHover(null)}
              style={{
                width: size,
                height: size,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: p.border,
                overflow: "hidden",
                backgroundColor: p.surface,
              }}
            >
              <LinearGradient
                colors={[p.surface, p.surface2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ position: "absolute", inset: 0 }}
              />
              {kind === "image" && !!image && (
                <Image
                  source={{ uri: image }}
                  style={{ position: "absolute", inset: 0 }}
                  resizeMode="cover"
                />
              )}
              {kind === "video" && (
                <>
                  <View
                    style={{
                      position: "absolute",
                      inset: 0,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {!isFixtureMode() && (
                      <Image
                        source={{
                          uri:
                            "https://img.youtube.com/vi/" +
                            id +
                            "/maxresdefault.jpg",
                        }}
                        style={{ position: "absolute", inset: 0 }}
                        resizeMode="cover"
                      />
                    )}
                    <View
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 26,
                        borderWidth: 1,
                        borderColor: "#ffffff2e",
                        backgroundColor: "#06080b8c",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Play size={20} color="white" fill="white" />
                    </View>
                  </View>
                </>
              )}
              {kind === "file" && (
                <View
                  style={{
                    flex: 1,
                    padding: 20,
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                  }}
                >
                  <View
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: 16,
                      backgroundColor: p.emerald + "1f",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FileText size={22} color={p.emerald} />
                  </View>
                  <Text
                    numberOfLines={2}
                    style={{
                      fontFamily: fonts.sansSemiBold,
                      fontSize: 13.5,
                      textAlign: "center",
                      color: p.text,
                    }}
                  >
                    {file?.name || "Attachment"}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: p.muted,
                      fontFamily: fonts.sans,
                    }}
                  >
                    File
                  </Text>
                </View>
              )}
              {kind === "text" && (
                <View
                  style={{
                    flex: 1,
                    padding: lecture ? 16 : 20,
                    justifyContent: lecture ? "flex-start" : "center",
                    alignItems: lecture ? "stretch" : "center",
                    gap: 14,
                  }}
                >
                  <LinearGradient
                    pointerEvents="none"
                    colors={[p.emerald + "20", "transparent"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0.6, y: 1 }}
                    style={{ position: "absolute", inset: 0 }}
                  />
                  {!!lecture && (
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 10,
                        alignItems: "center",
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: p.emerald + "4d",
                        backgroundColor: p.emerald + "1a",
                      }}
                    >
                      <View
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: p.emerald + "29",
                        }}
                      >
                        <BookOpen size={17} color={p.emerald} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          numberOfLines={1}
                          style={{
                            fontSize: 12,
                            fontFamily: fonts.sansBold,
                            color: p.emerald,
                          }}
                        >
                          {lecture[1]}
                        </Text>
                        <Text
                          style={{
                            fontSize: 9.5,
                            letterSpacing: 1,
                            fontFamily: fonts.sansBold,
                            color: p.muted,
                          }}
                        >
                          LECTURE
                        </Text>
                      </View>
                    </View>
                  )}
                  {multiline ? (
                    <View style={{ gap: 6 }}>
                      <Text
                        numberOfLines={lecture ? 1 : 2}
                        style={{
                          fontSize: lecture ? 15 : 17,
                          fontFamily: fonts.sansBold,
                          lineHeight: 22,
                          textAlign: lecture ? "left" : "center",
                          color: p.text,
                        }}
                      >
                        {lines[0]}
                      </Text>
                      <Text
                        numberOfLines={4}
                        style={{
                          fontSize: 13.5,
                          lineHeight: 20,
                          fontFamily: fonts.sansMedium,
                          textAlign: lecture ? "left" : "center",
                          color: p.muted,
                        }}
                      >
                        {lines.slice(1).join("\n")}
                      </Text>
                    </View>
                  ) : (
                    <Text
                      numberOfLines={5}
                      style={{
                        fontSize: 16,
                        lineHeight: 26.4,
                        fontFamily: fonts.sansSemiBold,
                        color: p.text,
                        textAlign: lecture ? "left" : "center",
                      }}
                    >
                      {caption}
                    </Text>
                  )}
                  <LinearGradient
                    colors={[p.emerald, p.gold]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      width: lecture ? 36 : 28,
                      height: 3,
                      borderRadius: 3,
                      marginTop: lecture ? "auto" : 0,
                    }}
                  />
                </View>
              )}
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  top: 8,
                  ...(kind === "text" ? { right: 8 } : { left: 8 }),
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  borderRadius: 99,
                  borderWidth: 1,
                  borderColor: "#ffffff1f",
                  backgroundColor: "#06080b8c",
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    letterSpacing: 0.6,
                    color:
                      kind === "file"
                        ? p.emerald
                        : kind === "video"
                        ? p.gold
                        : "#ffffffd9",
                    fontFamily: fonts.sansBold,
                    textTransform: "uppercase",
                  }}
                >
                  {kind === "video"
                    ? "Video"
                    : kind === "file"
                    ? "File"
                    : post.forumName || "Post"}
                </Text>
              </View>
              {hover === post.id && (
                <LinearGradient
                  pointerEvents="none"
                  colors={["transparent", "#0009"]}
                  style={{
                    position: "absolute",
                    inset: 0,
                    flexDirection: "row",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                    padding: 10,
                  }}
                >
                  {[
                    [Heart, post.likesCount ?? post.reactionCounts?.HEART ?? 0],
                    [MessageCircle, post.commentCount],
                  ].map(([Icon, count], index) => {
                    const Glyph = Icon as typeof Heart;
                    return (
                      <View
                        key={index}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Glyph
                          size={13}
                          color="white"
                          fill={index === 0 ? "white" : "transparent"}
                        />
                        <Text
                          style={{
                            fontSize: 11,
                            color: "white",
                            fontFamily: fonts.sansBold,
                          }}
                        >
                          {String(count)}
                        </Text>
                      </View>
                    );
                  })}
                </LinearGradient>
              )}
            </Pressable>
          );
        })}
      </View>
      <Modal
        visible={!!active}
        transparent
        animationType="fade"
        onRequestClose={() => setActive(null)}
      >
        <View
          style={{
            flex: 1,
            padding: 24,
            backgroundColor: "#0009",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close post"
            onPress={() => setActive(null)}
            style={{ position: "absolute", inset: 0 }}
          />
          <View
            style={{
              width: "100%",
              maxWidth: 720,
              maxHeight: "90%",
              borderRadius: 24,
              borderWidth: 1,
              borderColor: p.border,
              backgroundColor: colors.background,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: 54,
                paddingHorizontal: 20,
                alignItems: "center",
                flexDirection: "row",
              }}
            >
              <Text
                style={{
                  flex: 1,
                  color: p.text,
                  fontFamily: fonts.sansBold,
                  fontSize: 16,
                }}
              >
                Post
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close post"
                onPress={() => setActive(null)}
                style={{ padding: 8 }}
              >
                <X size={20} color={p.muted} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
              {activeVideo && !isFixtureMode() && (
                <View>
                  <View style={{ width: "100%", aspectRatio: 16 / 9 }}>
                    <StudentVideoPlayer
                      key={activeVideo}
                      url={"https://www.youtube.com/watch?v=" + activeVideo}
                      playing={playing}
                      muted={muted}
                      onPlayingChange={setPlaying}
                    />
                  </View>
                  <View style={{ flexDirection: "row", gap: 20, padding: 16 }}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setPlaying((value) => !value)}
                    >
                      <Text
                        style={{ color: p.text, fontFamily: fonts.sansBold }}
                      >
                        {playing ? "Pause" : "Play"}
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setMuted((value) => !value)}
                    >
                      <Text
                        style={{ color: p.text, fontFamily: fonts.sansBold }}
                      >
                        {muted ? "Unmute" : "Mute"}
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() =>
                        openLink(
                          "https://www.youtube.com/watch?v=" + activeVideo
                        )
                      }
                    >
                      <Text
                        style={{ color: p.gold, fontFamily: fonts.sansBold }}
                      >
                        Open original
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}
              {active && <PostCard post={active} />}
              {active?.attachments
                ?.filter((item) => item.type === "file")
                .map((file) => (
                  <Pressable
                    key={file.id}
                    accessibilityRole="button"
                    onPress={() => openLink(file.url)}
                    style={{
                      margin: 16,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: p.border,
                      borderRadius: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <FileText size={20} color={p.emerald} />
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 13,
                        color: p.text,
                        fontFamily: fonts.sansSemiBold,
                      }}
                    >
                      {file.name || "Open attachment"}
                    </Text>
                  </Pressable>
                ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
