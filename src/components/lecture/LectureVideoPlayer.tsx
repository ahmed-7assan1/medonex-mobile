import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Linking, Platform, Pressable, Text, View } from "react-native";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import { LECTURE_PLAYER_ORIGIN, nativeLecturePlayerDocument } from "@/lib/lecture-player-document";
import * as Crypto from "expo-crypto";
import { WebView } from "react-native-webview";
import { useTranslation } from "react-i18next";
import {listenForOtherMedia,announceMediaPlaying} from "@/lib/media-playback";
import { useTheme } from "@/theme/ThemeContext";
/** Isolated website Markdown content only. It receives no account or API credentials. */
export function LectureVideoPlayer({
  url,
  backupUrl,
  title,
  hideBranding = false,
  height,
}: {
  url: string;
  backupUrl?: string;
  title: string;
  hideBranding?: boolean;
  height: number;
}) {
  const { isDark, colors } = useTheme(),
    { i18n } = useTranslation();
  const [scope] = useState(() => Crypto.randomUUID()),
    [uri, setUri] = useState(""),
    [html, setHtml] = useState(""),
    [ready, setReady] = useState(false),
    [failed, setFailed] = useState(false),
    [reload, setReload] = useState(0);
  const frame = useRef<HTMLIFrameElement | null>(null),
    native = useRef<WebView>(null);
  const payload = useMemo(
    () => ({
      scope,
      url,
      backupUrl,
      title,
      hideBranding,
      theme: isDark ? "dark" : "light",
      direction: i18n.dir(),
    }),
    [scope, url, backupUrl, title, hideBranding, isDark, i18n.language]
  );
  useEffect(() => {
    let active = true;
    (async () => {
      const asset = Asset.fromModule(
        require("../../../assets/lecture-video-player.html")
      );
      if (Platform.OS === "web") {
        if (active) setUri(asset.uri + "#scope=" + encodeURIComponent(scope));
      } else {
        await asset.downloadAsync();
        if (!asset.localUri) throw Error("Packaged player unavailable");
        const text = await FileSystem.readAsStringAsync(asset.localUri);
        if (active) setHtml(nativeLecturePlayerDocument(text, scope));
      }
    })().catch(() => {
      if (active) setFailed(true);
    });
    return () => {
      active = false;
    };
  }, [scope]);
  const receive = (data: any) => {
    if (data?.scope !== scope) return;
    if (data.type === "playing") announceMediaPlaying(scope);
    if (data.type === "ready") setReady(true);
    if (data.type === "error") setFailed(true);
    if (data.type === "link" && typeof data.url === "string") {
      try {
        const url = new URL(data.url);
        if (url.protocol === "https:")
          void Linking.openURL(url.href).catch(() =>
            Alert.alert("Link unavailable", "This link could not open.")
          );
      } catch {}
    }
  };
  const listener = useRef(receive);
  listener.current = receive;
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const accept = (event: MessageEvent) => {
      if (event.source === frame.current?.contentWindow)
        listener.current(event.data);
    };
    window.addEventListener("message", accept);
    return () => window.removeEventListener("message", accept);
  }, []);
  useEffect(()=>listenForOtherMedia(scope,()=>{if(Platform.OS==='web')frame.current?.contentWindow?.postMessage({type:'pause',scope},'*');else native.current?.injectJavaScript('window.pauseLecturePlayer&&window.pauseLecturePlayer('+JSON.stringify(scope)+');true;')}),[scope]);
  useEffect(() => {
    if (!ready || failed) return;
    if (Platform.OS === "web")
      frame.current?.contentWindow?.postMessage(
        { type: "render", ...payload },
        "*"
      );
    else
      native.current?.injectJavaScript(
        "window.renderPlayerProps&&window.renderPlayerProps(" +
          JSON.stringify(payload) +
          ");true;"
      );
  }, [ready, failed, payload, reload]);
  if (failed)
    return (
      <View style={{ gap: 12 }}>
        <Text
          style={{ color: colors.foreground, fontSize: 14, lineHeight: 24 }}
        >
          Video playback unavailable.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setFailed(false);
            setReady(false);
            setReload((value) => value + 1);
          }}
        >
          <Text style={{ color: colors.mutedForeground }}>Retry video</Text>
        </Pressable>
      </View>
    );
  return (
    <View
      testID="lecture-video-player"
      style={{ width: "100%", height: Math.max(1, height) }}
    >
      {(Platform.OS === "web" ? uri : html) &&
        (Platform.OS === "web" ? (
          React.createElement("iframe", {
            key: reload,
            ref: frame,
            title: "Lecture video player",
            src: uri,
            sandbox: "allow-scripts allow-presentation",
            allow: "autoplay; fullscreen; picture-in-picture; encrypted-media",
            allowFullScreen: true,
            onError: () => setFailed(true),
            style: {
              width: "100%",
              height: "100%",
              border: 0,
              background: "transparent",
              opacity: ready ? 1 : 0,
            },
          })
        ) : (
          <WebView
            key={reload}
            ref={native}
            source={{ html, baseUrl: LECTURE_PLAYER_ORIGIN + "/" }}
            style={{
              flex: 1,
              backgroundColor: "transparent",
              opacity: ready ? 1 : 0,
            }}
            originWhitelist={["*"]}
            allowFileAccess={false}
            allowFileAccessFromFileURLs={false}
            allowUniversalAccessFromFileURLs={false}
            domStorageEnabled={false}
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction
            sharedCookiesEnabled={false}
            thirdPartyCookiesEnabled={false}
            javaScriptEnabled
            scrollEnabled={false}
            setSupportMultipleWindows={false}
            onError={() => setFailed(true)}
            onMessage={(event) => {
              try {
                if (event.nativeEvent.data.length < 10000)
                  listener.current(JSON.parse(event.nativeEvent.data));
              } catch {}
            }}
            onShouldStartLoadWithRequest={(request) => {
              if (
                request.url === LECTURE_PLAYER_ORIGIN + "/" ||
                request.url.startsWith("about:blank")
              )
                return true;
              try {
                const url = new URL(request.url);
                return (
                  !request.isTopFrame &&
                  url.protocol === "https:" &&
                  [
                    "www.youtube-nocookie.com",
                    "www.youtube.com",
                    "drive.google.com",
                  ].includes(url.hostname)
                );
              } catch {
                return false;
              }
            }}
          />
        ))}
    </View>
  );
}
