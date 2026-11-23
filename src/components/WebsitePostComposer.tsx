import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { Asset } from "expo-asset";
import * as Crypto from "expo-crypto";
import { WebView } from "react-native-webview";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/ThemeContext";
import { useForums } from "@/lib/community";
import { isFixtureMode } from "@/lib/fixtures";
import { ResourceState } from "@/components/ResourceState";
/** Locally packaged source rich editor. No token, account cookie or network access. */
export function WebsitePostComposer() {
  const { colors, isDark, fonts } = useTheme();
  const { i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const forums = useForums();
  const [scope] = useState(() => Crypto.randomUUID());
  const [uri, setUri] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);
  const native = useRef<WebView>(null);
  const frame = useRef<HTMLIFrameElement | null>(null);
  const guest = isFixtureMode();
  const payload = useMemo(
    () => ({
      scope,
      theme: isDark ? "dark" : "light",
      direction: i18n.dir(),
      forums: (forums.data || [])
        .filter((forum) => forum.status === "OPEN")
        .map(({ id, name, type }) => ({ id, name, type }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }),
    [scope, isDark, i18n.language, forums.data]
  );
  useEffect(() => {
    let active = true;
    (async () => {
      const asset = Asset.fromModule(
        require("../../assets/post-composer.html")
      );
      if (Platform.OS !== "web") await asset.downloadAsync();
      if (active)
        setUri(
          (Platform.OS === "web" ? asset.uri : asset.localUri || asset.uri) +
            "#scope=" +
            encodeURIComponent(scope)
        );
    })().catch(() => {
      if (active) setError(true);
    });
    return () => {
      active = false;
    };
  }, [scope, reload]);
  const receive = (message: any) => {
    if (!message || message.scope !== scope) return;
    if (message.type === "ready") setReady(true);
    else if (message.type === "back") {
      if (router.canGoBack()) router.back();
      else router.replace("/(tabs)/social");
    } else if (message.type === "guard")
      Alert.alert(
        "Read-only preview",
        "No post was published or file uploaded. Uploads and account changes are disabled in this preview."
      );
  };
  const listener = useRef(receive);
  listener.current = receive;
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const handle = (event: MessageEvent) => {
      if (event.source === frame.current?.contentWindow)
        listener.current(event.data);
    };
    window.addEventListener("message", handle);
    return () => window.removeEventListener("message", handle);
  }, []);
  useEffect(() => {
    if (!ready || error || !forums.data) return;
    const data = { type: "render", ...payload };
    if (Platform.OS === "web")
      frame.current?.contentWindow?.postMessage(data, "*");
    else
      native.current?.injectJavaScript(
        "window.renderComposer&&window.renderComposer(" +
          JSON.stringify(data) +
          ");true;"
      );
  }, [ready, error, payload, reload, forums.data]);
  useEffect(() => {
    if (!forums.data || !uri || ready || error) return;
    const timer = setTimeout(() => setError(true), 15000);
    return () => clearTimeout(timer);
  }, [ready, error, reload, uri, forums.data]);
  if (!forums.data)
    return (
      <ResourceState
        title="Create post"
        error={forums.error}
        onRetry={() => forums.refetch()}
      />
    );
  if (error)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          padding: 32,
          paddingTop: insets.top + 32,
          justifyContent: "center",
          alignItems: "center",
          gap: 20,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            lineHeight: 22,
            textAlign: "center",
            color: colors.foreground,
            fontFamily: fonts.sans,
          }}
        >
          The local composer could not load. No draft was saved or posted.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setError(false);
            setReady(false);
            setReload((value) => value + 1);
          }}
        >
          <Text
            style={{ color: colors.foreground, fontFamily: fonts.sansBold }}
          >
            Try again
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace("/(tabs)/social")}
        >
          <Text style={{ color: colors.mutedForeground }}>
            Back to community
          </Text>
        </Pressable>
      </View>
    );
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top,
      }}
    >
      {guest && (
        <Text
          style={{
            fontSize: 11,
            lineHeight: 17,
            paddingHorizontal: 16,
            paddingVertical: 5,
            color: colors.mutedForeground,
            fontFamily: fonts.sans,
          }}
        >
          Guest preview. Forum choices are samples.
        </Text>
      )}
      <View style={{ flex: 1 }}>
        {!ready && (
          <ActivityIndicator
            color={colors.foreground}
            style={{ position: "absolute", top: 48, alignSelf: "center" }}
          />
        )}
        {uri &&
          (Platform.OS === "web" ? (
            <iframe
              key={reload}
              ref={frame}
              title="Create post, local rich editor"
              src={uri}
              sandbox="allow-scripts"
              onError={() => setError(true)}
              style={{
                width: "100%",
                height: "100%",
                border: 0,
                opacity: ready ? 1 : 0,
                background: colors.background,
              }}
            />
          ) : (
            <WebView
              key={reload}
              ref={native}
              source={{ uri }}
              style={{
                flex: 1,
                backgroundColor: colors.background,
                opacity: ready ? 1 : 0,
              }}
              originWhitelist={["*"]}
              allowFileAccess
              allowFileAccessFromFileURLs={false}
              allowUniversalAccessFromFileURLs={false}
              javaScriptEnabled
              setSupportMultipleWindows={false}
              onError={() => setError(true)}
              onMessage={(event) => {
                try {
                  if (event.nativeEvent.data.length < 1000)
                    listener.current(JSON.parse(event.nativeEvent.data));
                } catch {}
              }}
              onShouldStartLoadWithRequest={(request) =>
                request.url === "about:blank" ||
                request.url.split("#")[0] === uri.split("#")[0]
              }
            />
          ))}
      </View>
    </View>
  );
}
