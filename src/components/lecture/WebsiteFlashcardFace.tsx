import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Linking, Platform, Pressable, Text, View } from "react-native";
import { Asset } from "expo-asset";
import * as Crypto from "expo-crypto";
import { WebView } from "react-native-webview";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/ThemeContext";
/** Isolated website Markdown content only. It receives no account or API credentials. */
export function WebsiteFlashcardFace({
  front,
  back,
  flipped,
  height,
  viewportWidth,
  viewportHeight,
  onFlip,
  obsidian = false,
}: {
  front: string;
  back: string;
  flipped: boolean;
  height: number;
  viewportWidth: number;
  viewportHeight: number;
  onFlip: () => void;
  obsidian?: boolean;
}) {
  const { isDark, colors } = useTheme(),
    { i18n } = useTranslation();
  const [scope] = useState(() => Crypto.randomUUID()),
    [uri, setUri] = useState(""),
    [ready, setReady] = useState(false),
    [failed, setFailed] = useState(false),
    [reload, setReload] = useState(0);
  const frame = useRef<HTMLIFrameElement | null>(null),
    native = useRef<WebView>(null);
  const payload = useMemo(
    () => ({
      scope,
      obsidian,
      front,
      back,
      flipped,
      height,
      viewportWidth,
      viewportHeight,
      theme: isDark ? "dark" : "light",
      direction: i18n.dir(),
    }),
    [
      scope,
      obsidian,
      front,
      back,
      flipped,
      height,
      viewportWidth,
      viewportHeight,
      isDark,
      i18n.language,
    ]
  );
  useEffect(() => {
    let active = true;
    (async () => {
      const asset = Asset.fromModule(
        require("../../../assets/flashcard-face.html")
      );
      if (Platform.OS !== "web") await asset.downloadAsync();
      if (active)
        setUri(
          (Platform.OS === "web" ? asset.uri : asset.localUri || asset.uri) +
            "#scope=" +
            encodeURIComponent(scope)
        );
    })().catch(() => {
      if (active) setFailed(true);
    });
    return () => {
      active = false;
    };
  }, [scope]);
  const receive = (data: any) => {
    if (data?.scope !== scope) return;
    if (data.type === "ready") setReady(true);
    if (data.type === "flip") onFlip();
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
  useEffect(() => {
    if (!ready || failed) return;
    if (Platform.OS === "web")
      frame.current?.contentWindow?.postMessage(
        { type: "render", ...payload },
        "*"
      );
    else
      native.current?.injectJavaScript(
        "window.renderCardProps&&window.renderCardProps(" +
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
          {flipped ? back : front}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setFailed(false);
            setReady(false);
            setReload((value) => value + 1);
          }}
        >
          <Text style={{ color: colors.mutedForeground }}>Retry flashcard</Text>
        </Pressable>
      </View>
    );
  return (
    <View
      testID="website-flashcard-face"
      style={{ width: "100%", height: Math.max(1, height) }}
    >
      {uri &&
        (Platform.OS === "web" ? (
          React.createElement("iframe", {
            key: reload,
            ref: frame,
            title: "Flashcard face",
            src: uri,
            sandbox: "allow-scripts",
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
            source={{ uri }}
            style={{
              flex: 1,
              backgroundColor: "transparent",
              opacity: ready ? 1 : 0,
            }}
            originWhitelist={["*"]}
            allowFileAccess
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
                request.url.startsWith("file://") ||
                request.url.startsWith("about:blank")
              )
                return true;
              try {
                const url = new URL(request.url);
                return (
                  !request.isTopFrame &&
                  url.protocol === "https:" &&
                  url.hostname === "www.youtube-nocookie.com" &&
                  url.pathname.startsWith("/embed/")
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
