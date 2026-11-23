import{useStudentDimensions as useWindowDimensions}from'@/lib/student-viewport';
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
  } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Check,
  GraduationCap,
  Heart,
  Search,
  Share2,
  Star,
  Users,
  Video,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/theme/ThemeContext";
import { isFixtureMode } from "@/lib/fixtures";
import { useStudentVideos } from "@/lib/videos";
import { SCROLL_BOTTOM_PAD } from "@/theme/tokens";
import { StudentPageFrame } from "./StudentPageFrame";
import { StudentVideoCard } from "./StudentVideoCard";
import { ResourceState } from "./ResourceState";
import { FloatingStudentHeader } from "./FloatingStudentHeader";
import { FadeEdges } from "./FadeEdges";
export function StudentEducatorScreen({
  id,
  variant,
}: {
  id: string;
  variant: "instructor" | "channel";
}) {
  const { st, colors, fonts } = useTheme();
  const {viewportWidth, width } = useWindowDimensions();
  const tablet = viewportWidth >= 768;
  const channelPage = variant === "channel";
  const resource = useStudentVideos({ channelId: id });
  const instructor = resource.channel;
  const guest = isFixtureMode();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [failed, setFailed] = useState(false);
  const text = channelPage ? "#FFFFFF" : colors.foreground;
  const muted = channelPage ? "#FFFFFF66" : colors.mutedForeground;
  const fullWidth =
    Math.min(width, 1280) - (channelPage ? 48 : tablet ? 48 : 32);
  const gridWidth =
    channelPage && viewportWidth >= 1024 ? fullWidth - 350 - 48 : fullWidth;
  const cols = channelPage
    ? tablet
      ? 2
      : 1
    : viewportWidth >= 1280
    ? 4
    : viewportWidth >= 1024
    ? 3
    : viewportWidth >= 640
    ? 2
    : 1;
  const gap = 24;
  const cardWidth = (gridWidth - gap * (cols - 1)) / cols;
  const videos =
    resource.items?.filter(
      (video) =>
        !search ||
        [video.title, video.subjectName, video.lectureTitle]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
    ) || [];
  const readOnly = () =>
    Alert.alert(
      guest ? "Guest preview" : "Read-only on mobile",
      guest
        ? "Sample educators are local previews."
        : "Follow and subscription changes are available on the website. No account changes were made."
    );
  const share = () => {
    if (guest)
      return Alert.alert("Guest preview", "Sample educators cannot be shared.");
    void Share.share({
      message:
        "https://www.medonex.me/" +
        (channelPage
          ? "channels/" + encodeURIComponent(instructor?.youtubeId || id)
          : "videos/instructor/" + encodeURIComponent(instructor?.id || id)),
    }).catch(() => {});
  };
  const loadMore = resource.hasNextPage ? (
    <Pressable
      accessibilityRole="button"
      onPress={() => resource.fetchNextPage()}
      disabled={resource.isFetchingNextPage}
      style={{ padding: 20, alignSelf: "center" }}
    >
      {resource.isFetchingNextPage ? (
        <ActivityIndicator color={text} />
      ) : (
        <Text
          style={{ fontFamily: fonts.sansSemiBold, fontSize: 13, color: text }}
        >
          Load more curriculum lectures
        </Text>
      )}
    </Pressable>
  ) : null;
  const pending = !instructor ? (
    <View style={{ minHeight: 400 }}>
      {resource.error ? (
        <ResourceState
          title="Educator"
          error={resource.error}
          onRetry={() => resource.refetch()}
        />
      ) : resource.isLoading ? (
        <ActivityIndicator color={muted} style={{ marginTop: 120 }} />
      ) : (
        <View style={{ padding: 32, alignItems: "center", gap: 16 }}>
          <Users size={40} color={muted} />
          <Text
            style={{ fontFamily: fonts.sansBold, fontSize: 22, color: text }}
          >
            {resource.hasNextPage
              ? "Educator details not loaded yet"
              : "Instructor not found"}
          </Text>
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 14,
              lineHeight: 21,
              color: muted,
              textAlign: "center",
            }}
          >
            {resource.hasNextPage
              ? "More curriculum pages are available. Load the next page to continue."
              : "The requested educator could not be located in your available curriculum."}
          </Text>
          {loadMore}
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace("/videos" as never)}
          >
            <Text style={{ fontFamily: fonts.sansBold, color: text }}>
              Back to Videos
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  ) : null;
  const avatar = (size: number) => (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: channelPage ? 40 : size / 2,
        borderWidth: 4,
        borderColor: channelPage ? "#0A0A0A" : colors.background,
        overflow: "hidden",
        backgroundColor: channelPage ? "#1A1A1A" : colors.muted,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {instructor?.thumbnail && !failed ? (
        <Image
          source={{ uri: instructor.thumbnail }}
          onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <Text
          style={{
            fontSize: size / 3,
            fontFamily: fonts.sansBold,
            color: text,
          }}
        >
          {instructor?.name[0]}
        </Text>
      )}
    </View>
  );
  const grid = (
    <View style={{ width: gridWidth }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: channelPage && viewportWidth < 640 ? "flex-start" : "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: channelPage ? 32 : 24,
          flexWrap: "wrap",
          paddingBottom: channelPage ? 16 : 0,
          borderBottomWidth: channelPage ? 1 : 0,
          borderColor: "#FFFFFF0D",
        }}
      >
        <View style={{ flexShrink: 1 }}>
          <Text
            style={{
              fontFamily: fonts.sansBold,
              fontSize: channelPage ? 20 : tablet ? 24 : 20,
              letterSpacing: channelPage ? 2 : 0,
              color: text,
            }}
          >
            {channelPage ? "AVAILABLE LECTURES" : "Academic Lectures"}
          </Text>
          {!channelPage && (
            <Text
              style={{
                fontSize: 12,
                color: muted,
                fontFamily: fonts.sansMedium,
                marginTop: 4,
              }}
            >
              High-yield content by {instructor?.name}
            </Text>
          )}
        </View>
        {channelPage ? (
          <View
            style={{
              height: 36,
              width: viewportWidth < 640 ? "100%" : 220,
              borderRadius: 12,
              backgroundColor: "#FFFFFF0D",
              borderWidth: 1,
              borderColor: "#FFFFFF0D",
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 12,
              gap: 8,
            }}
          >
            <Search size={16} color="#FFFFFF33" />
            <TextInput
              accessibilityLabel="Search in channel"
              value={search}
              onChangeText={setSearch}
              placeholder="Search in channel..."
              placeholderTextColor="#FFFFFF33"
              style={{
                height: 34,
                flex: 1,
                minWidth: 0,
                fontFamily: fonts.sans,
                fontSize: 12,
                color: "#fff",
              }}
            />
          </View>
        ) : viewportWidth >= 640 ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <GraduationCap size={16} color={colors.primary} />
            <Text
              style={{
                fontSize: 10,
                color: colors.primary,
                fontFamily: fonts.sansBold,
                letterSpacing: 1,
              }}
            >
              ACADEMIC FOCUS
            </Text>
          </View>
        ) : null}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap }}>
        {videos.map((video) => (
          <StudentVideoCard
            key={video.id}
            video={video}
            width={cardWidth}
            variant={variant}
          />
        ))}
      </View>
      {videos.length === 0 && (
        <View
          style={{
            paddingVertical: channelPage ? 80 : 96,
            paddingHorizontal: 20,
            borderRadius: 16,
            backgroundColor: channelPage ? "transparent" : colors.card,
            alignItems: "center",
            gap: 16,
          }}
        >
          <Video size={channelPage ? 64 : 32} color={muted} />
          <Text
            style={{
              fontSize: 18,
              fontFamily: fonts.sansBold,
              color: text,
              textAlign: "center",
            }}
          >
            {resource.hasNextPage
              ? "More curriculum pages are available"
              : channelPage
              ? "No matching lectures found"
              : "No linked videos"}
          </Text>
          <Text
            style={{
              fontSize: 12,
              lineHeight: 18,
              fontFamily: fonts.sans,
              color: muted,
              textAlign: "center",
              maxWidth: 300,
            }}
          >
            {resource.hasNextPage
              ? "Load more to check the next page."
              : instructor?.name +
                " has no matching lectures linked to your active semester."}
          </Text>
        </View>
      )}
      {loadMore}
    </View>
  );
  const about = (
    <View style={{ width: viewportWidth >= 1024 ? 350 : "100%", gap: 32 }}>
      <View
        style={{
          padding: 32,
          borderRadius: 32,
          borderWidth: 1,
          borderColor: "#FFFFFF0D",
          backgroundColor: "#FFFFFF05",
          gap: 24,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.sansBold,
            fontSize: 12,
            letterSpacing: 2,
            color: "#EF4444",
          }}
        >
          ABOUT THE EDUCATOR
        </Text>
        <Text
          style={{
            fontFamily: fonts.sansMedium,
            fontSize: 14,
            lineHeight: 23,
            color: "#FFFFFF99",
          }}
        >
          {instructor?.description || "No description provided."}
        </Text>
        <View style={{ gap: 12 }}>
          {["Global Rank", "Students Impacted"].map((label) => (
            <View
              key={label}
              style={{
                padding: 16,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#FFFFFF0D",
                backgroundColor: "#FFFFFF0D",
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.sansBold,
                  fontSize: 10,
                  color: "#FFFFFF66",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                {label}
              </Text>
              <Text
                style={{
                  fontFamily: fonts.sans,
                  fontSize: 12,
                  color: "#FFFFFF66",
                }}
              >
                Not provided
              </Text>
            </View>
          ))}
        </View>
      </View>
      <View>
        <Text
          style={{
            fontFamily: fonts.sansBold,
            fontSize: 10,
            color: "#FFFFFF33",
            letterSpacing: 2,
            marginBottom: 16,
            marginHorizontal: 16,
          }}
        >
          VERIFICATION STATUS
        </Text>
        <View
          style={{
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: "#FFFFFF1A",
            backgroundColor: "#FFFFFF0D",
          }}
        >
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 12,
              lineHeight: 18,
              color: "#FFFFFF99",
            }}
          >
            Partner status is not provided. Listing a video does not imply a
            partnership.
          </Text>
        </View>
      </View>
    </View>
  );
  if (channelPage)
    return (
      <View
        style={{ flex: 1, backgroundColor: "#0A0A0A", paddingTop: insets.top }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingBottom: SCROLL_BOTTOM_PAD + insets.bottom,
          }}
        >
          <View
            style={{ height: tablet ? 300 : 200, backgroundColor: "#1A1A1A" }}
          >
            {instructor?.banner ? (
              <Image
                source={{ uri: instructor.banner }}
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  opacity: 0.6,
                }}
              />
            ) : (
              <LinearGradient
                colors={["#7F1D1D66", "#0F172A66"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ position: "absolute", inset: 0 }}
              />
            )}
            <LinearGradient
              colors={["transparent", "#0A0A0A"]}
              style={{ position: "absolute", inset: 0 }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to Videos"
              onPress={() => router.replace("/videos" as never)}
              style={{
                position: "absolute",
                top: 80,
                left: 24,
                height: 40,
                width: 40,
                borderRadius: 20,
                backgroundColor: "#0006",
                borderWidth: 1,
                borderColor: "#FFFFFF1A",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ArrowLeft size={20} color="#fff" />
            </Pressable>
          </View>
          <View
            style={{
              width: "100%",
              maxWidth: 1280,
              alignSelf: "center",
              paddingHorizontal: 24,
              marginTop: -64,
              zIndex: 1,
            }}
          >
            {instructor ? (
              <>
                <View
                  style={{
                    flexDirection: tablet ? "row" : "column",
                    alignItems: "flex-end",
                    gap: 24,
                    marginBottom: 48,
                  }}
                >
                  {avatar(tablet ? 160 : 128)}
                  <View
                    style={{
                      flex: tablet ? 1 : undefined,
                      alignSelf: tablet ? undefined : "stretch",
                      gap: 16,
                      paddingBottom: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: fonts.sansBold,
                        fontSize: tablet ? 48 : 36,
                        letterSpacing: -1.5,
                        color: "#fff",
                      }}
                    >
                      {instructor.name}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: 24,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <Users size={16} color="#EF4444" />
                        <Text
                          style={{
                            fontSize: 12,
                            fontFamily: fonts.sansBold,
                            color: muted,
                            letterSpacing: 1,
                          }}
                        >
                          {instructor.subscribers || "N/A"} SUBSCRIBERS
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <Video size={16} color="#EF4444" />
                        <Text
                          style={{
                            fontSize: 12,
                            fontFamily: fonts.sansBold,
                            color: muted,
                            letterSpacing: 1,
                          }}
                        >
                          {resource.items?.length || 0}
                          {resource.hasNextPage ? "+" : ""} LECTURES LOADED
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      paddingBottom: 8,
                    }}
                  >
                    <Pressable
                      accessibilityRole="button"
                      onPress={readOnly}
                      style={{
                        paddingHorizontal: 32,
                        paddingVertical: 12,
                        borderRadius: 16,
                        backgroundColor: instructor.isFollowing
                          ? "#FFFFFF1A"
                          : "#EF4444",
                        flexDirection: "row",
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      <Star size={16} color="#fff" />
                      <Text
                        style={{
                          fontSize: 14,
                          color: "#fff",
                          fontFamily: fonts.sansBold,
                          letterSpacing: 1,
                        }}
                      >
                        {instructor.isFollowing ? "FOLLOWING" : "FOLLOW"}
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Share educator"
                      onPress={share}
                      style={{
                        padding: 12,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: "#FFFFFF0D",
                        backgroundColor: "#FFFFFF0D",
                      }}
                    >
                      <Share2 size={20} color={muted} />
                    </Pressable>
                  </View>
                </View>
                {guest && (
                  <Text
                    style={{
                      fontFamily: fonts.sans,
                      fontSize: 12,
                      lineHeight: 18,
                      color: muted,
                      marginBottom: 24,
                    }}
                  >
                    Guest preview. Sample educator and lecture data stays on
                    this device.
                  </Text>
                )}
                <View
                  style={{
                    flexDirection: viewportWidth >= 1024 ? "row" : "column",
                    gap: 48,
                  }}
                >
                  {grid}
                  {about}
                </View>
              </>
            ) : (
              pending
            )}
          </View>
        </ScrollView>
        {!tablet && <FloatingStudentHeader title="Channels" darkSurface />}
        <FadeEdges color="#0A0A0A" />
      </View>
    );
  return (
    <StudentPageFrame
      title="Videos"
      flatPhone={false}
      maxWidth={1280}
      guestSample={guest}
    >
      {instructor ? (
        <>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace("/videos" as never)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 32,
            }}
          >
            <ArrowLeft size={16} color={muted} />
            <Text
              style={{ fontFamily: fonts.sansBold, fontSize: 12, color: muted }}
            >
              Back to Hub
            </Text>
          </Pressable>
          <View
            style={{
              flexDirection: tablet ? "row" : "column",
              alignItems: "center",
              gap: 32,
              paddingBottom: 48,
              borderBottomWidth: 1,
              borderColor: colors.border,
              marginBottom: 48,
            }}
          >
            <LinearGradient
              colors={[
                colors.primary,
                colors.primary + "80",
                colors.primary + "1A",
              ]}
              style={{
                width: tablet ? 176 : 128,
                height: tablet ? 176 : 128,
                borderRadius: 100,
                padding: 4,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {avatar(tablet ? 168 : 120)}
            </LinearGradient>
            <View
              style={{
                flex: tablet ? 1 : undefined,
                width: tablet ? undefined : "100%",
                gap: 16,
                alignItems: tablet ? "flex-start" : "center",
              }}
            >
              <View style={{ alignItems: tablet ? "flex-start" : "center" }}>
                <Text
                  style={{
                    fontFamily: fonts.sansBold,
                    fontSize: tablet ? 48 : 30,
                    letterSpacing: -1,
                    color: text,
                    textAlign: tablet ? "left" : "center",
                  }}
                >
                  {instructor.name}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.sansSemiBold,
                    fontSize: tablet ? 18 : 14,
                    color: colors.primary,
                    marginTop: 4,
                  }}
                >
                  {instructor.handle ||
                    "@" + instructor.name.toLowerCase().replace(/\s/g, "")}
                </Text>
              </View>
              <View
                style={{ flexDirection: "row", gap: 24, alignItems: "center" }}
              >
                {[
                  {
                    value: instructor.subscribers || "N/A",
                    label: "Subscribers",
                  },
                  {
                    value: String(instructor.followersCount),
                    label: "MedQs Fans",
                  },
                  {
                    value:
                      String(resource.items?.length || 0) +
                      (resource.hasNextPage ? "+" : ""),
                    label: "Lectures loaded",
                  },
                ].map((stat, index) => (
                  <React.Fragment key={stat.label}>
                    {index > 0 && (
                      <View
                        style={{
                          height: 32,
                          width: 1,
                          backgroundColor: colors.border,
                        }}
                      />
                    )}
                    <View
                      style={{
                        alignItems: tablet ? "flex-start" : "center",
                        gap: 2,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: fonts.sansBold,
                          fontSize: tablet ? 24 : 20,
                          color: text,
                        }}
                      >
                        {stat.value}
                      </Text>
                      <Text
                        style={{
                          fontFamily: fonts.sansBold,
                          fontSize: 10,
                          letterSpacing: 1,
                          color: muted,
                          textTransform: "uppercase",
                        }}
                      >
                        {stat.label}
                      </Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
              <View
                style={{
                  flexDirection: "row",
                  gap: 12,
                  marginTop: 8,
                  width: tablet ? undefined : "100%",
                }}
              >
                <Pressable
                  accessibilityRole="button"
                  onPress={readOnly}
                  style={{
                    flex: tablet ? undefined : 1,
                    height: 36,
                    paddingHorizontal: 24,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: instructor.isFollowing
                      ? colors.border
                      : "transparent",
                    backgroundColor: instructor.isFollowing
                      ? colors.card
                      : colors.primary,
                    flexDirection: "row",
                    gap: 8,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Heart
                    size={16}
                    color={
                      instructor.isFollowing ? muted : colors.primaryForeground
                    }
                  />
                  <Text
                    style={{
                      fontFamily: fonts.sansBold,
                      fontSize: 12,
                      letterSpacing: 1,
                      color: instructor.isFollowing
                        ? muted
                        : colors.primaryForeground,
                    }}
                  >
                    {instructor.isFollowing ? "SUBSCRIBED" : "SUBSCRIBE"}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Share educator"
                  onPress={share}
                  style={{
                    height: 36,
                    width: 36,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Share2 size={16} color={muted} />
                </Pressable>
              </View>
            </View>
          </View>
          {grid}
        </>
      ) : (
        pending
      )}
    </StudentPageFrame>
  );
}
