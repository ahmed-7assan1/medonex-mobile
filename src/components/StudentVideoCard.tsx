import React, { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  Share,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Bookmark, Clapperboard, Share2 } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeContext";
import { isFixtureMode } from "@/lib/fixtures";
import type { StudentVideo } from "@/lib/videos";
export function shareStudentVideo(video: StudentVideo) {
  if (isFixtureMode())
    return Alert.alert("Guest preview", "Sample videos cannot be shared.");
  void Share.share({
    title: video.title,
    message:
      "https://www.medonex.me/videos/reels?v=" + encodeURIComponent(video.id),
  }).catch(() => {});
}
export function StudentVideoCard({
  video,
  width,
  variant = "catalog",
}: {
  video: StudentVideo;
  width: number;
  variant?: "catalog" | "instructor" | "channel";
}) {
  const { st, colors, fonts } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const tablet = screenWidth >= 768;
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const catalog = variant === "catalog";
  const channel = variant === "channel";
  const text = channel ? "#FFFFFF" : tablet ? colors.foreground : st.text;
  const muted = channel
    ? "#FFFFFF66"
    : tablet
    ? colors.mutedForeground
    : st.muted;
  const pictureWidth = width - (channel ? 32 : 0);
  const open = () => {
    if (!catalog && video.moduleId && video.lectureId)
      router.push({
        pathname: "/modules/[id]/lectures/[lectureId]",
        params: {
          id: video.moduleId,
          lectureId: video.lectureId,
          tab: "videos",
        },
      });
    else
      router.push({
        pathname: "/videos/reels",
        params: { v: video.id },
      } as any);
  };
  return (
    <View
      style={{
        width,
        ...(channel
          ? {
              padding: 16,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: "#FFFFFF0D",
              backgroundColor: "#FFFFFF08",
            }
          : {}),
      }}
    >
      <View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={"Watch " + video.title}
          onPress={open}
          style={{
            width: pictureWidth,
            aspectRatio: 16 / 9,
            borderRadius: catalog ? (tablet ? 12 : 6) : 16,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: channel ? "#FFFFFF0D" : st.border,
            backgroundColor: channel ? "#1A1A1A" : colors.muted,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {video.thumbnail && !failed ? (
            <Image
              source={{ uri: video.thumbnail }}
              onError={() => setFailed(true)}
              style={{ position: "absolute", width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <Clapperboard size={30} color={muted} />
          )}
          {catalog && !tablet && (
            <>
              <LinearGradient
                colors={[
                  "transparent",
                  "rgba(11,11,11,0.18)",
                  "rgba(11,11,11,0.85)",
                ]}
                locations={[0, 0.48, 1]}
                style={{ position: "absolute", inset: 0 }}
              />
              <View
                style={{
                  position: "absolute",
                  left: 10,
                  right: 10,
                  bottom: 10,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  <View
                    style={{
                      height: 5,
                      width: 5,
                      borderRadius: 3,
                      backgroundColor: "#7D2040",
                    }}
                  />
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 9,
                      fontFamily: fonts.sansBold,
                      letterSpacing: 1.2,
                      textTransform: "uppercase",
                      color: "#FFFFFFBF",
                    }}
                  >
                    {video.moduleName || "Lecture"}
                  </Text>
                </View>
                <Text
                  numberOfLines={2}
                  style={{
                    fontSize: 12.5,
                    lineHeight: 17,
                    fontFamily: fonts.sansBold,
                    color: "#FFFFFF",
                  }}
                >
                  {video.title}
                </Text>
              </View>
            </>
          )}
          {catalog && video.source === "medqs" && (
            <View
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                borderRadius: 14,
                paddingHorizontal: 10,
                paddingVertical: 4,
                backgroundColor: "#0008",
                borderWidth: 1,
                borderColor: "#FFFFFF26",
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.sansBold,
                  fontSize: 9,
                  color: "#fff",
                  letterSpacing: 1.4,
                }}
              >
                OFFICIAL
              </Text>
            </View>
          )}
          {!catalog && !channel && (
            <View
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                borderRadius: 12,
                backgroundColor: "#0008",
                paddingHorizontal: 8,
                paddingVertical: 4,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.sansBold,
                  fontSize: 8,
                  color: "#fff",
                  textTransform: "uppercase",
                }}
              >
                {video.subjectName}
              </Text>
            </View>
          )}
        </Pressable>
        {catalog && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={"Share " + video.title}
            onPress={() => shareStudentVideo(video)}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              height: tablet ? 32 : 28,
              minWidth: 28,
              borderRadius: 18,
              backgroundColor: "#0009",
              borderWidth: 1,
              borderColor: "#FFFFFF26",
              paddingHorizontal: tablet ? 12 : 7,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 6,
            }}
          >
            <Share2 size={12} color="#fff" />
            {tablet && (
              <Text
                style={{
                  fontFamily: fonts.sansBold,
                  fontSize: 10,
                  letterSpacing: 1,
                  color: "#fff",
                }}
              >
                SHARE
              </Text>
            )}
          </Pressable>
        )}
      </View>
      {catalog && !tablet ? (
        <Text
          numberOfLines={1}
          style={{
            marginTop: 6,
            fontSize: 10,
            fontFamily: fonts.sansSemiBold,
            letterSpacing: 1,
            color: muted,
            textTransform: "uppercase",
          }}
        >
          {video.channelTitle}
        </Text>
      ) : catalog ? (
        <View style={{ marginTop: 12 }}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View
              style={{
                height: 44,
                width: 44,
                borderRadius: 22,
                backgroundColor: st.surface,
                borderWidth: 1,
                borderColor: st.border,
                overflow: "hidden",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {video.channelThumbnail ? (
                <Image
                  source={{ uri: video.channelThumbnail }}
                  style={{ width: 44, height: 44 }}
                />
              ) : (
                <Text style={{ fontFamily: fonts.sansBold, color: text }}>
                  {video.channelTitle[0]}
                </Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Pressable accessibilityRole="button" onPress={open}>
                <Text
                  numberOfLines={2}
                  style={{
                    fontSize: 14,
                    lineHeight: 19,
                    color: text,
                    fontFamily: fonts.sansBold,
                  }}
                >
                  {video.title}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={!video.channelId}
                onPress={() =>
                  router.push(
                    ("/channels/" +
                      encodeURIComponent(video.channelId!)) as never
                  )
                }
              >
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 11,
                    letterSpacing: 1,
                    marginTop: 4,
                    fontFamily: fonts.sansBold,
                    textTransform: "uppercase",
                    color: muted,
                  }}
                >
                  {video.channelTitle}
                </Text>
              </Pressable>
            </View>
          </View>
          {!!video.moduleName && (
            <Text
              style={{
                alignSelf: "flex-start",
                fontSize: 10,
                fontFamily: fonts.sansBold,
                letterSpacing: 1,
                color: muted,
                paddingHorizontal: 10,
                paddingVertical: 5,
                backgroundColor: st.surface,
                borderWidth: 1,
                borderColor: st.border,
                borderRadius: 14,
                marginTop: 12,
              }}
            >
              {video.moduleName}
            </Text>
          )}
        </View>
      ) : (
        <View
          style={{
            paddingHorizontal: 4,
            marginTop: channel ? 16 : 12,
            gap: channel ? 12 : 4,
          }}
        >
          <Pressable accessibilityRole="button" onPress={open}>
            <Text
              numberOfLines={2}
              style={{
                fontFamily: fonts.sansBold,
                fontSize: 14,
                lineHeight: 19,
                color: text,
              }}
            >
              {video.title}
            </Text>
          </Pressable>
          {channel ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <Text
                numberOfLines={1}
                style={{
                  flex: 1,
                  fontSize: 10,
                  fontFamily: fonts.sansBold,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: muted,
                }}
              >
                {video.subjectName || "Medical"}
              </Text>
              <Pressable accessibilityRole="button" onPress={open}>
                <Text
                  style={{
                    fontSize: 10,
                    letterSpacing: 1,
                    fontFamily: fonts.sansBold,
                    color: "#EF4444",
                  }}
                >
                  WATCH NOW
                </Text>
              </Pressable>
            </View>
          ) : (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Bookmark size={12} color={muted} />
              <Text
                numberOfLines={1}
                style={{
                  flex: 1,
                  fontFamily: fonts.sansMedium,
                  fontSize: 11,
                  color: muted,
                }}
              >
                {video.lectureTitle}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
