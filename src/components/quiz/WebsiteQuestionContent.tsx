import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { Asset } from "expo-asset";
import * as Crypto from "expo-crypto";
import { WebView } from "react-native-webview";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/theme/ThemeContext";
import type { FixtureQuizQuestion } from "@/lib/fixtures";
/** The same content component used by the website. No session or API token is
 * passed to the isolated renderer. The app keeps selection and practice state. */
export function QuizQuestionContent({
  question,
  showResult,
  selectedAnswer,
  onAnswer,
  essayReview,
  lectureReview = false,
  hubReview = false,
  hubMobile = false,
}: {
  question: FixtureQuizQuestion;
  showResult: boolean;
  lectureReview?: boolean;
  hubReview?: boolean;
  hubMobile?: boolean;
  selectedAnswer?: string;
  onAnswer?: (key: string) => void;
  essayReview?: import("@/lib/quiz-store").EssayReview | null;
}) {
  const { isDark, st } = useTheme();
  const { i18n } = useTranslation();
  const [scope] = useState(() => Crypto.randomUUID());
  const [uri, setUri] = useState("");
  const [ready, setReady] = useState(false);
  const [height, setHeight] = useState(180);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);
  const native = useRef<WebView>(null);
  const frame = useRef<HTMLIFrameElement | null>(null);
  const payload = useMemo(
    () => ({
      scope,
      question,
      showResult,
      selectedAnswer,
      essayReview,
      lectureReview,
      hubReview,
      hubMobile,
      theme: isDark ? "dark" : "light",
      direction: i18n.dir(),
    }),
    [
      scope,
      question,
      showResult,
      selectedAnswer,
      essayReview,
      lectureReview,
      hubReview,
      hubMobile,
      isDark,
      i18n.language,
    ]
  );
  const current = useRef({ question, showResult, onAnswer, lectureReview });
  current.current = { question, showResult, onAnswer, lectureReview };
  useEffect(() => {
    let active = true;
    (async () => {
      const asset = Asset.fromModule(
        require("../../../assets/quiz-content.html")
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
  }, [scope]);
  const receive = (message: any) => {
    if (!message || message.scope !== scope) return;
    if (message.type === "ready") setReady(true);
    else if (
      message.type === "height" &&
      typeof message.height === "number" &&
      Number.isFinite(message.height) &&
      message.height > 0 &&
      message.height <= 50000
    )
      setHeight(message.height);
    else if (
      message.type === "answer" &&
      !current.current.showResult &&
      message.questionId === current.current.question.id &&
      (current.current.question.choices.some(
        (choice) => choice.key === message.key
      ) ||
        (current.current.lectureReview &&
          current.current.question.questionType === "ESSAY" &&
          typeof message.key === "string" &&
          message.key.length <= 20000))
    )
      current.current.onAnswer?.(message.key);
    else if (message.type === "link" && typeof message.url === "string") {
      try {
        const url = new URL(message.url);
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
    const handle = (event: MessageEvent) => {
      if (event.source === frame.current?.contentWindow)
        listener.current(event.data);
    };
    window.addEventListener("message", handle);
    return () => window.removeEventListener("message", handle);
  }, []);
  useEffect(() => {
    if (!ready || error) return;
    if (Platform.OS === "web")
      frame.current?.contentWindow?.postMessage(
        { type: "render", ...payload },
        "*"
      );
    else
      native.current?.injectJavaScript(
        "window.renderQuestionProps&&window.renderQuestionProps(" +
          JSON.stringify(payload) +
          ");true;"
      );
  }, [ready, payload, error, reload]);
  if (error)
    return (
      <View style={{ padding: 24, gap: 16, alignItems: "center" }}>
        <Text style={{ color: st.text, textAlign: "center" }}>
          This question could not display. No answer was recorded.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setError(false);
            setReady(false);
            setReload((value) => value + 1);
          }}
        >
          <Text style={{ color: st.text }}>Try again</Text>
        </Pressable>
      </View>
    );
  return (
    <View
      style={{
        height: Math.max(1, height),
        width: "100%",
        backgroundColor: "transparent",
      }}
    >
      {!ready && (
        <ActivityIndicator
          color={st.muted}
          style={{ position: "absolute", top: 40, alignSelf: "center" }}
        />
      )}
      {uri &&
        (Platform.OS === "web" ? (
          React.createElement("iframe", {
            key: reload,
            ref: frame,
            title: "Question content",
            src: uri,
            sandbox: "allow-scripts",
            onError: () => setError(true),
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
            onError={() => setError(true)}
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
