import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Alert,
  AppState,
  BackHandler,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Maximize2, X } from "lucide-react-native";
import * as Crypto from "expo-crypto";
import { usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/theme/ThemeContext";
import { useStudentDimensions } from "@/lib/student-viewport";
import { shouldShowStudentCapsule } from "@/lib/student-chrome";
import { isListeningComplete } from "@/lib/listening-history";
import { spotifyTarget, type SpotifyPlayback } from "@/lib/spotify-player";
import {
  listenForOtherMedia,
  announceMediaPlaying,
} from "@/lib/media-playback";
import { useLectureAudio } from "./LectureAudioProvider";
import { LectureSpotifyEngine } from "./LectureSpotifyEngine";
type Record = { id: string; title: string; url: string };
type State = {
  current: Record | null;
  sheetOpen: boolean;
  playing: boolean;
  play: (r: Record) => void;
  close: () => void;
};
const Context = createContext<State | null>(null);
export function useLectureSpotify() {
  const v = useContext(Context);
  if (!v) throw Error("Spotify provider missing");
  return v;
}
export function LectureSpotifyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, token, isGuest } = useAuth();
  const scope = !isGuest && token && user?.id ? user.id : "";
  return (
    <AccountSpotify key={scope || "guest"} account={scope}>
      {children}
    </AccountSpotify>
  );
}
function AccountSpotify({
  children,
  account,
}: {
  children: React.ReactNode;
  account: string;
}) {
  const audio = useLectureAudio(),
    { colors, isDark } = useTheme(),
    { viewportWidth, viewportHeight } = useStudentDimensions(),
    insets = useSafeAreaInsets(),
    path = usePathname(),
    desktop = viewportWidth >= 768;
  const scope = useRef(Crypto.randomUUID()).current,
    [current, setCurrent] = useState<Record | null>(null),
    [sheetOpen, setSheet] = useState(false),
    [resume, setResume] = useState(0),
    [status, setStatus] = useState<SpotifyPlayback>({
      time: 0,
      duration: 0,
      playing: false,
    }),
    [available, setAvailable] = useState<boolean | null>(null),
    [failed, setFailed] = useState(false);
  const state = useRef({ current, status }),
    save = useRef(audio.saveProgress),
    lastSave = useRef(0),
    request = useRef(0),
    live = useRef(true);
  state.current = { current, status };
  save.current = audio.saveProgress;
  const flush = () => {
    const s = state.current;
    if (s.current) save.current(s.current.id, { ...s.status, failed: false });
    lastSave.current = Date.now();
  };
  const close = () => {
    request.current++;
    flush();
    setCurrent(null);
    setSheet(false);
    setStatus({ time: 0, duration: 0, playing: false });
  };
  useEffect(() => {
    live.current = true;
    const off = listenForOtherMedia(scope, () => {
      request.current++;
      const s = state.current;
      if (s.current) {
        flush();
        setCurrent(null);
        setSheet(false);
        setStatus({ time: 0, duration: 0, playing: false });
      }
    });
    const app = AppState.addEventListener("change", (s) => {
      if (s !== "active") flush();
    });
    const hide = () => flush();
    if (typeof window !== "undefined")
      window.addEventListener("pagehide", hide);
    return () => {
      live.current = false;
      request.current++;
      off();
      app.remove();
      if (typeof window !== "undefined")
        window.removeEventListener("pagehide", hide);
      flush();
    };
  }, [scope]);
  useEffect(() => {
    if (!sheetOpen) return;
    const closeSheet = () => {
      flush();
      setSheet(false);
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      closeSheet();
      return true;
    });
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSheet();
    };
    if (typeof window !== "undefined") window.addEventListener("keydown", key);
    return () => {
      sub.remove();
      if (typeof window !== "undefined")
        window.removeEventListener("keydown", key);
    };
  }, [sheetOpen]);
  const play = (record: Record) => {
    if (!account) {
      Alert.alert("Guest preview", "Sample recordings stay on this device.");
      return;
    }
    const target = spotifyTarget(record.url);
    if (
      !target ||
      !record.id ||
      record.id.length > 512 ||
      ["__proto__", "constructor", "prototype"].includes(record.id)
    ) {
      Alert.alert(
        "Recording unavailable",
        "This Spotify recording has no supported secure media link."
      );
      return;
    }
    const mine = ++request.current;
    void audio.loadHistory().then((history) => {
      if (!live.current || request.current !== mine) return;
      if (
        state.current.current?.id === record.id &&
        state.current.current.url === target.url
      ) {
        setSheet(true);
        return;
      }
      flush();
      const progress = history[record.id]?.progress;
      setResume(progress && !isListeningComplete(progress) ? progress.time : 0);
      setStatus({ time: 0, duration: 0, playing: false });
      setAvailable(null);
      setFailed(false);
      state.current = {
        current: { ...record, url: target.url },
        status: { time: 0, duration: 0, playing: false },
      };
      setCurrent(state.current.current);
      setSheet(true);
      announceMediaPlaying(scope);
    });
  };
  const noticeHeight = failed || available === false ? 40 : 0;
  const bottom =
      (viewportWidth < 768 && shouldShowStudentCapsule(path) ? 48 : 0) +
      insets.bottom,
    fullHeight = Math.min(
      viewportHeight - (desktop ? 32 : insets.top + 64),
      (desktop ? 475 : 447 + insets.bottom) + noticeHeight
    ),
    fullWidth = desktop ? Math.min(512, viewportWidth - 32) : viewportWidth,
    miniWidth = Math.min(640, viewportWidth - (viewportWidth >= 640 ? 32 : 16)),
    font = Platform.OS === "android" ? "sans-serif" : "Arial";
  return (
    <Context.Provider
      value={{ current, sheetOpen, playing: status.playing, play, close }}
    >
      {children}
      {current && (
        <View
          testID="lecture-spotify-layer"
          pointerEvents="box-none"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 3000,
            elevation: 30,
          }}
        >
          {sheetOpen && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close Spotify backdrop"
              onPress={() => {
                flush();
                setSheet(false);
              }}
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: desktop ? "#000000CC" : "#000000B3",
                ...(!desktop && Platform.OS === "web"
                  ? ({ backdropFilter: "blur(4px)" } as any)
                  : {}),
              }}
            />
          )}
          <View
            accessibilityViewIsModal={sheetOpen}
            testID={
              sheetOpen ? "lecture-spotify-sheet" : "lecture-spotify-mini"
            }
            style={{
              position: "absolute",
              width: sheetOpen ? fullWidth : miniWidth,
              left: (viewportWidth - (sheetOpen ? fullWidth : miniWidth)) / 2,
              bottom: sheetOpen
                ? desktop
                  ? (viewportHeight - fullHeight) / 2
                  : 0
                : bottom,
              height: sheetOpen ? fullHeight : 122,
              borderRadius: sheetOpen ? (desktop ? 8 : 24) : 16,
              borderBottomLeftRadius:
                sheetOpen && !desktop ? 0 : sheetOpen ? 8 : 16,
              borderBottomRightRadius:
                sheetOpen && !desktop ? 0 : sheetOpen ? 8 : 16,
              backgroundColor: sheetOpen ? colors.background : "#121212",
              borderWidth: desktop || !sheetOpen ? 1 : 0,
              borderColor: sheetOpen ? colors.border + "66" : "#ffffff1a",
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px #00000066",
            }}
          >
            {sheetOpen && (
              <View
                key="header"
                style={{
                  paddingHorizontal: 20,
                  paddingTop: desktop ? 20 : 12,
                  paddingBottom: desktop ? 16 : 14,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border + "33",
                }}
              >
                <View style={{ flex: 1, paddingRight: desktop ? 32 : 0 }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: font,
                      fontSize: desktop ? 16 : 17,
                      fontWeight: "900",
                      lineHeight: desktop ? 24 : 28.05,
                      letterSpacing: desktop ? -0.4 : -0.425,
                      color: colors.foreground,
                    }}
                  >
                    {current.title}
                  </Text>
                  {desktop && (
                    <Text
                      style={{
                        fontFamily: font,
                        fontSize: 12,
                        fontWeight: "600",
                        lineHeight: 16,
                        color: colors.mutedForeground,
                        marginTop: 4,
                      }}
                    >
                      Spotify • Audio
                    </Text>
                  )}
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close Spotify sheet"
                  onPress={() => {
                    flush();
                    setSheet(false);
                  }}
                  style={{
                    width: desktop ? 16 : 36,
                    height: desktop ? 16 : 36,
                    borderRadius: 99,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: desktop
                      ? "transparent"
                      : colors.card + "99",
                    opacity: desktop ? 0.7 : 1,
                    ...(desktop
                      ? ({ position: "absolute", right: 16, top: 16 } as const)
                      : {}),
                  }}
                >
                  <X size={16} color={colors.mutedForeground} />
                </Pressable>
              </View>
            )}
            {sheetOpen && (
              <View
                key="glow"
                pointerEvents="none"
                style={{
                  position: "absolute",
                  top: desktop ? 81 : 63,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    position: "absolute",
                    left: -12,
                    right: -12,
                    top: desktop ? -12 : -16,
                    height: 416,
                    borderRadius: 32,
                    opacity: 0.75,
                    ...(Platform.OS === "web"
                      ? ({
                          backgroundImage:
                            "radial-gradient(60% 80% at 20% 30%, #4f46e5 0%, transparent 60%),radial-gradient(60% 80% at 80% 70%, #4f46e5 0%, transparent 60%)",
                          filter: "blur(64px)",
                        } as any)
                      : { boxShadow: "0 0 64px 16px #4f46e5bf" }),
                  }}
                />
              </View>
            )}
            <ScrollView
              key="media"
              scrollEnabled={sheetOpen}
              showsVerticalScrollIndicator={false}
              style={{
                height: sheetOpen ? fullHeight - (desktop ? 83 : 63) : 80,
                flexGrow: 0,
              }}
              contentContainerStyle={{
                paddingHorizontal: sheetOpen ? 20 : 0,
                paddingVertical: sheetOpen ? (desktop ? 20 : 16) : 0,
              }}
            >
              <View
                style={{
                  height: sheetOpen ? 352 : 80,
                  borderRadius: sheetOpen ? 16 : 0,
                  overflow: "hidden",
                  backgroundColor: "#121212",
                  boxShadow: sheetOpen ? "0 0 0 1px #ffffff1a" : undefined,
                }}
              >
                <LectureSpotifyEngine
                  key={current.id + "|" + current.url}
                  url={current.url}
                  resume={resume}
                  onReady={(v) => setAvailable(v)}
                  onError={() => setFailed(true)}
                  onPlayback={(next) => {
                    if (
                      !live.current ||
                      state.current.current?.id !== current.id ||
                      state.current.current.url !== current.url
                    )
                      return;
                    const was = state.current.status.playing;
                    state.current = {
                      current: state.current.current,
                      status: next,
                    };
                    setStatus(next);
                    if (next.playing && !was) announceMediaPlaying(scope);
                    if (!next.playing || Date.now() - lastSave.current >= 4000)
                      flush();
                  }}
                />
              </View>
              {sheetOpen && (failed || available === false) && (
                <Text
                  accessibilityRole="alert"
                  style={{
                    marginTop: 8,
                    fontFamily: font,
                    fontSize: 11,
                    lineHeight: 14,
                    color: colors.mutedForeground,
                  }}
                >
                  {failed
                    ? "Spotify could not load. Close and reopen this recording to try again."
                    : "Spotify controls are available inside the player. Listening progress is unavailable for this connection."}
                </Text>
              )}
            </ScrollView>
            {!sheetOpen && (
              <View
                key="footer"
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 8,
                  paddingVertical: 6,
                  gap: 8,
                  backgroundColor: "#00000066",
                }}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    flex: 1,
                    fontFamily: font,
                    fontSize: 12,
                    fontWeight: "700",
                    color: "#ffffffcc",
                    lineHeight: 16,
                  }}
                >
                  {current.title}
                </Text>
                <View style={{ flexDirection: "row", gap: 4 }}>
                  {[
                    [Maximize2, "Open Spotify player", () => setSheet(true)],
                    [X, "Close Spotify player", close],
                  ].map(([Icon, label, action]) => (
                    <Pressable
                      key={String(label)}
                      accessibilityRole="button"
                      accessibilityLabel={String(label)}
                      onPress={action as () => void}
                      style={{
                        height: 28,
                        width: 28,
                        borderRadius: 99,
                        backgroundColor: "#ffffff1a",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {React.createElement(Icon as any, {
                        size: 14,
                        color:
                          label === "Close Spotify player"
                            ? "#ffffffb3"
                            : "#fff",
                      })}
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>
      )}
    </Context.Provider>
  );
}
