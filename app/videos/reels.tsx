import{useStudentDimensions as useWindowDimensions}from'@/lib/student-viewport';
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
  } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Heart,
  MessageCircle,
  Music2,
  Play,
  Plus,
  Share2,
  Volume2,
  VolumeX,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StudentVideoPlayer } from "@/components/StudentVideoPlayer";
import { shareStudentVideo } from "@/components/StudentVideoCard";
import { ResourceState } from "@/components/ResourceState";
import {
  useStudentVideos,
  type StudentVideo,
  type StudentVideoPage,
} from "@/lib/videos";
import { isFixtureMode } from "@/lib/fixtures";
import { useTheme } from "@/theme/ThemeContext";
function Reel({
  video,
  active,
  width,
  height,
}: {
  video: StudentVideo;
  active: boolean;
  width: number;
  height: number;
}) {
  const { fonts } = useTheme();
  const router = useRouter();
  const guest = isFixtureMode();
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!active) setPlaying(false);
    else setPlaying(true);
  }, [active]);
  const readOnly = () =>
    Alert.alert(
      guest ? "Guest preview" : "Read-only on mobile",
      guest
        ? "Sample videos are local previews, not real media."
        : "Likes, comments, and follows are available on the website. No changes were made."
    );
  const goEducator = () => {
    if (video.channelId)
      router.push(
        ("/channels/" + encodeURIComponent(video.channelId)) as never
      );
  };
  const action = (
    label: string,
    Icon: typeof Heart,
    run: () => void,
    count?: string,
    small = false
  ) => (
    <View key={label} style={{ alignItems: "center", gap: 6 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={run}
        style={{
          width: small ? 48 : 56,
          height: small ? 48 : 56,
          borderRadius: small ? 12 : 16,
          backgroundColor: "#FFFFFF1A",
          borderWidth: 1,
          borderColor: "#FFFFFF1A",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={small ? 26 : 34} strokeWidth={1} color="#fff" />
      </Pressable>
      {count !== undefined && (
        <Text
          style={{
            fontSize: 11,
            fontFamily: fonts.sansBold,
            color: "#fff",
            letterSpacing: 1,
          }}
        >
          {count}
        </Text>
      )}
    </View>
  );
  return (
    <View
      style={{ width, height, backgroundColor: "#000", overflow: "hidden" }}
    >
      {active && !guest && video.url ? (
        <StudentVideoPlayer
          key={video.id}
          url={video.url}
          startTime={video.startTime}
          endTime={video.endTime}
          playing={playing}
          muted={muted}
          onPlayingChange={setPlaying}
          onProgress={setProgress}
        />
      ) : (
        <View
          style={{
            position: "absolute",
            inset: 0,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {video.thumbnail ? (
            <Image
              source={{ uri: video.thumbnail }}
              style={{ position: "absolute", width: "100%", height: "100%" }}
              resizeMode="contain"
            />
          ) : guest ? (
            <Text
              style={{
                fontFamily: fonts.sans,
                fontSize: 13,
                color: "#FFFFFF80",
                maxWidth: 240,
                textAlign: "center",
              }}
            >
              Guest preview. Sign in to play real curriculum videos.
            </Text>
          ) : null}
        </View>
      )}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 2,
          backgroundColor: "#FFFFFF33",
          zIndex: 6,
        }}
      >
        <View
          style={{
            height: 2,
            width: `${progress * 100}%`,
            backgroundColor: "#fff",
          }}
        />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={playing ? "Pause video" : "Play video"}
        onPress={() => (guest ? readOnly() : setPlaying((value) => !value))}
        style={{ position: "absolute", inset: 0, zIndex: 5 }}
      />
      {(!playing || guest) && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            inset: 0,
            alignItems: "center",
            justifyContent: "center",
            zIndex: 6,
          }}
        >
          <View
            style={{
              height: 80,
              width: 80,
              borderRadius: 40,
              backgroundColor: "#0006",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Play size={40} fill="#fff" color="#fff" />
          </View>
        </View>
      )}
      <View
        style={{
          position: "absolute",
          right: 16,
          bottom: 96,
          alignItems: "center",
          gap: 24,
          zIndex: 20,
        }}
      >
        {action(
          muted ? "Unmute video" : "Mute video",
          muted ? VolumeX : Volume2,
          () => setMuted((value) => !value),
          undefined,
          true
        )}
        {action("Like video", Heart, readOnly, String(video.likes))}
        {action(
          "Video comments",
          MessageCircle,
          readOnly,
          String(video.comments)
        )}
        {action("Share video", Share2, () => shareStudentVideo(video), "SHARE")}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open video educator"
          onPress={goEducator}
          disabled={!video.channelId}
          style={{
            marginTop: 16,
            height: 56,
            width: 56,
            borderRadius: 16,
            borderWidth: 2,
            borderColor: "#FFFFFF66",
            backgroundColor: "#FFFFFF26",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {video.channelThumbnail ? (
            <Image
              source={{ uri: video.channelThumbnail }}
              style={{ height: "100%", width: "100%", borderRadius: 14 }}
            />
          ) : (
            <Text
              style={{
                fontSize: 24,
                fontFamily: fonts.sansBold,
                color: "#fff",
              }}
            >
              {video.channelTitle[0]}
            </Text>
          )}
          <View
            style={{
              position: "absolute",
              bottom: -4,
              right: -4,
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: "#FFFFFF",
              borderWidth: 2,
              borderColor: "#000",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Plus size={10} color="#000" />
          </View>
        </Pressable>
      </View>
      <LinearGradient
        pointerEvents="none"
        colors={["transparent", "#0006", "#000C"]}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 240,
          zIndex: 8,
        }}
      />
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          bottom: 24,
          left: 24,
          right: 80,
          zIndex: 10,
          gap: 12,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              maxWidth: "100%",
              fontFamily: fonts.sansBold,
              fontSize: 18,
              color: "#fff",
            }}
          >
            @{video.channelTitle}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={readOnly}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 8,
              backgroundColor: "#FFFFFF1A",
              borderWidth: 1,
              borderColor: "#FFFFFF33",
            }}
          >
            <Text
              style={{
                fontFamily: fonts.sansBold,
                fontSize: 10,
                color: "#fff",
                letterSpacing: 1,
              }}
            >
              FOLLOW
            </Text>
          </Pressable>
        </View>
        <Text
          numberOfLines={3}
          style={{
            fontSize: 14,
            lineHeight: 21,
            color: "#FFFFFFE6",
            fontFamily: fonts.sansMedium,
          }}
        >
          {video.title}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              height: 24,
              width: 24,
              borderRadius: 12,
              backgroundColor: "#FFFFFF1A",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Music2 size={14} color="#fff" />
          </View>
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              fontFamily: fonts.sansBold,
              fontSize: 10,
              color: "#FFFFFFB3",
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            Lecture audio · {video.channelTitle}
          </Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={muted ? "Unmute video" : "Mute video"}
        onPress={() => setMuted((value) => !value)}
        style={{
          position: "absolute",
          top: 24,
          right: 24,
          zIndex: 20,
          width: 40,
          height: 40,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: "#FFFFFF1A",
          backgroundColor: "#0003",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {muted ? (
          <VolumeX size={20} color="#fff" />
        ) : (
          <Volume2 size={20} color="#fff" />
        )}
      </Pressable>
    </View>
  );
}
export default function ReelsScreen() {
  const { v } = useLocalSearchParams<{ v?: string }>();
  const initialId = typeof v === "string" ? v : "";
  const router = useRouter();
  const {viewportWidth, width, height } = useWindowDimensions();
  const tablet = viewportWidth >= 768;
  const insets = useSafeAreaInsets();
  const resource = useStudentVideos();
  const selected = useStudentVideos({ videoId: initialId });
  const client = useQueryClient();
  const cached =
    client
      .getQueriesData<InfiniteData<StudentVideoPage>>({
        queryKey: ["student-videos"],
      })
      .find(([key]) => key[1] === "")?.[1]
      ?.pages.flatMap((page) => page.items) || [];
  const videos = useMemo(
    () =>
      Array.from(
        new Map(
          [
            ...(cached.length ? cached : resource.items || []),
            ...(resource.items || []),
            ...(selected.items || []),
          ].map((video) => [video.id, video])
        ).values()
      ),
    [resource.items, selected.items, resource.data, selected.data]
  );
  const initialIndex = Math.max(
    0,
    videos.findIndex((video) => video.id === initialId)
  );
  const [active, setActive] = useState(initialIndex);
  const initialized = useRef(false);
  const list = useRef<FlatList<StudentVideo>>(null);
  const itemHeight = height - insets.top - insets.bottom - (tablet ? 64 : 0);
  const itemWidth = tablet ? Math.min(500, width - 120) : width;
  useEffect(() => {
    if (
      !initialized.current &&
      videos.length &&
      (!initialId || selected.items)
    ) {
      initialized.current = true;
      setActive(initialIndex);
    }
  }, [videos.length, !!selected.items]);
  useEffect(() => {
    if (initialized.current)
      list.current?.scrollToOffset({
        offset: active * itemHeight,
        animated: false,
      });
  }, [itemHeight]);
  const invalidSelected =
    !!initialId &&
    !selected.isLoading &&
    !!selected.items &&
    !selected.items.some((video) => video.id === initialId);
  const loading =
    !resource.items || (!!initialId && !selected.items && !selected.error);
  if (initialId && selected.error)
    return (
      <ResourceState
        title="Video"
        error={selected.error}
        onRetry={() => selected.refetch()}
      />
    );
  if (invalidSelected)
    return (
      <ResourceState
        title="Video"
        notFound
        onRetry={() => selected.refetch()}
      />
    );
  if (loading)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#000",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {resource.error ? (
          <ResourceState
            title="Videos"
            error={resource.error}
            onRetry={() => resource.refetch()}
          />
        ) : (
          <ActivityIndicator color="#fff" />
        )}
      </View>
    );
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#000",
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {videos.length === 0 ? (
        <View style={{ alignItems: "center", gap: 20 }}>
          <Text style={{ color: "#fff" }}>
            No curriculum videos are available.
          </Text>
          <Pressable accessibilityRole="button" onPress={() => router.back()}>
            <Text style={{ color: "#fff" }}>Back to Videos</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 32 }}>
          <View
            style={{
              width: itemWidth,
              height: itemHeight,
              borderRadius: tablet ? 40 : 0,
              overflow: "hidden",
              borderLeftWidth: 1,
              borderRightWidth: 1,
              borderColor: "#FFFFFF0D",
            }}
          >
            <FlatList
              ref={list}
              data={videos}
              initialScrollIndex={initialIndex}
              getItemLayout={(_, index) => ({
                length: itemHeight,
                offset: itemHeight * index,
                index,
              })}
              keyExtractor={(video) => video.id}
              renderItem={({ item, index }) => (
                <Reel
                  video={item}
                  active={index === active}
                  width={itemWidth}
                  height={itemHeight}
                />
              )}
              pagingEnabled
              snapToInterval={itemHeight}
              decelerationRate="fast"
              showsVerticalScrollIndicator={false}
              initialNumToRender={1}
              maxToRenderPerBatch={1}
              windowSize={3}
              onScroll={(event) => {
                const next = Math.max(
                  0,
                  Math.min(
                    videos.length - 1,
                    Math.round(event.nativeEvent.contentOffset.y / itemHeight)
                  )
                );
                if (next !== active) setActive(next);
              }}
              scrollEventThrottle={16}
              onEndReached={() => {
                if (resource.hasNextPage && !resource.isFetchingNextPage)
                  void resource.fetchNextPage();
              }}
              onEndReachedThreshold={0.4}
            />
          </View>
          {tablet && (
            <View style={{ gap: 16 }}>
              {[
                { Icon: ChevronUp, delta: -1, label: "Previous video" },
                { Icon: ChevronDown, delta: 1, label: "Next video" },
              ].map(({ Icon, delta, label }) => (
                <Pressable
                  key={label}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  disabled={
                    active + delta < 0 || active + delta >= videos.length
                  }
                  onPress={() =>
                    list.current?.scrollToOffset({
                      offset: (active + delta) * itemHeight,
                      animated: true,
                    })
                  }
                  style={{
                    height: 56,
                    width: 56,
                    borderRadius: 28,
                    borderWidth: 1,
                    borderColor: "#FFFFFF1A",
                    backgroundColor: "#FFFFFF0D",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity:
                      active + delta < 0 || active + delta >= videos.length
                        ? 0.2
                        : 1,
                  }}
                >
                  <Icon size={32} color="#fff" />
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to Videos"
        onPress={() => router.back()}
        style={{
          position: "absolute",
          top: insets.top + 24,
          left: 24,
          zIndex: 110,
          height: 48,
          width: 48,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: "#FFFFFF1A",
          backgroundColor: "#0003",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ArrowLeft size={24} color="#fff" />
      </Pressable>
    </View>
  );
}
