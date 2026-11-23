import React, { useEffect, useMemo, useRef, useState } from "react";
import { Platform, View } from "react-native";
import { WebView } from "react-native-webview";
import * as Crypto from "expo-crypto";
import {
  spotifyPlayerHtml,
  normalizeSpotifyPlayback,
  type SpotifyPlayback,
} from "@/lib/spotify-player";
/** A data-origin frame keeps the SDK away from app credentials while allowing provider-origin messages. */
export function LectureSpotifyEngine({
  url,
  resume,
  onPlayback,
  onReady,
  onError,
}: {
  url: string;
  resume: number;
  onPlayback: (v: SpotifyPlayback) => void;
  onReady: (available: boolean) => void;
  onError: () => void;
}) {
  const scope = useRef(Crypto.randomUUID()).current,
    frame = useRef<HTMLIFrameElement | null>(null),
    callbacks = useRef({ onPlayback, onReady, onError });
  callbacks.current = { onPlayback, onReady, onError };
  const [initialResume] = useState(resume);
  const html = useMemo(
    () => spotifyPlayerHtml(url, scope, initialResume),
    [url, scope, initialResume]
  );
  const receive = (d: any) => {
    if (d?.scope !== scope) return;
    if (d.type === "ready" && typeof d.available === "boolean")
      callbacks.current.onReady(d.available);
    else if (d.type === "playback") {
      const state = normalizeSpotifyPlayback(d);
      if (state) callbacks.current.onPlayback(state);
    } else if (d.type === "error") callbacks.current.onError();
  };
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const handle = (e: MessageEvent) => {
      if (e.source === frame.current?.contentWindow) receive(e.data);
    };
    window.addEventListener("message", handle);
    return () => window.removeEventListener("message", handle);
  }, [scope]);
  return (
    <View style={{ height: "100%", width: "100%", backgroundColor: "#121212" }}>
      {Platform.OS === "web" ? (
        React.createElement("iframe", {
          ref: frame,
          title: "Persistent Spotify media",
          src: "data:text/html;charset=utf-8," + encodeURIComponent(html),
          sandbox: "allow-scripts allow-same-origin allow-presentation",
          allow: "autoplay; encrypted-media; fullscreen; picture-in-picture",
          style: { width: "100%", height: "100%", border: 0 },
        })
      ) : (
        <WebView
          source={{ html, baseUrl: "https://www.medonex.me" }}
          originWhitelist={["*"]}
          sharedCookiesEnabled={false}
          thirdPartyCookiesEnabled={false}
          javaScriptEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction
          setSupportMultipleWindows={false}
          onError={() => callbacks.current.onError()}
          onMessage={(e) => {
            try {
              if (e.nativeEvent.data.length < 2048)
                receive(JSON.parse(e.nativeEvent.data));
            } catch {}
          }}
          onShouldStartLoadWithRequest={(r) => {
            if (r.url === "about:blank") return true;
            try {
              const u = new URL(r.url);
              return (
                u.protocol === "https:" &&
                ((u.hostname === "www.medonex.me" && u.pathname === "/") ||
                  (r.isTopFrame !== true &&
                    u.hostname === "open.spotify.com" &&
                    u.pathname.startsWith("/embed/")))
              );
            } catch {
              return false;
            }
          }}
          style={{ flex: 1, backgroundColor: "#121212" }}
        />
      )}
    </View>
  );
}
