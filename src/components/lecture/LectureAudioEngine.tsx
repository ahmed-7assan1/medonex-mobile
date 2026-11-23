import React, { useEffect, useMemo, useRef, useState } from "react";
import { Platform, View } from "react-native";
import { WebView } from "react-native-webview";
import {listenForOtherMedia,announceMediaPlaying} from "@/lib/media-playback";
import * as Crypto from "expo-crypto";
export type AudioCommand = {
  playing: boolean;
  seek?: { time: number; nonce: number };
  rate: number;
  volume: number;
  loop?: boolean;
};
export type AudioStatus = {
  playing: boolean;
  time: number;
  duration: number;
  failed: boolean;
  ended?: boolean;
};
export function lectureAudioHtml(url: string, scope: string) {
  const data = JSON.stringify({ url, scope }).replace(/</g, "\\u003c");
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; media-src https:; style-src 'unsafe-inline'"></head><body><script>(()=>{const c=${data},a=new Audio();let lastSeek=null;const emit=failed=>{const m={scope:c.scope,type:'status',playing:!a.paused,time:Number.isFinite(a.currentTime)?a.currentTime:0,duration:Number.isFinite(a.duration)?a.duration:0,failed:!!failed,ended:!!a.ended};if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify(m));else window.parent.postMessage(m,'*')};window.updateLectureAudio=m=>{if(m?.scope!==c.scope)return;a.loop=!!m.loop;a.volume=Math.max(0,Math.min(1,m.volume));a.playbackRate=Math.max(.5,Math.min(2,m.rate));if(m.seek&&Number.isFinite(m.seek.time)&&lastSeek!==m.seek.nonce){lastSeek=m.seek.nonce;a.currentTime=Math.max(0,Math.min(a.duration||m.seek.time,m.seek.time))};if(m.playing)a.play().catch(()=>emit(true));else a.pause()};window.addEventListener('message',e=>{if(e.source===window.parent)window.updateLectureAudio(e.data)});for(const event of['loadedmetadata','timeupdate','play','pause','ended'])a.addEventListener(event,()=>emit(false));a.onerror=()=>emit(true);try{const u=new URL(c.url);if(u.protocol!=='https:')throw Error();a.preload='none';a.src=u.href;emit(false)}catch{emit(true)}})();</script></body></html>`;
}
/** Isolated audio decoder only. The page and every playback control stay native. */
export function LectureAudioEngine({
  url,
  command,
  onStatus,
  onInterrupt,
}: {
  url: string;
  command: AudioCommand;
  onStatus: (status: AudioStatus) => void;
  onInterrupt?: () => void;
}) {
  const scope = useRef(Crypto.randomUUID()).current,
    frame = useRef<HTMLIFrameElement | null>(null),
    native = useRef<WebView>(null),
    status = useRef(onStatus);
  status.current = onStatus;
  const latestCommand=useRef(command),interrupt=useRef(onInterrupt),wasPlaying=useRef(false);latestCommand.current=command;interrupt.current=onInterrupt;
  useEffect(()=>listenForOtherMedia(scope,()=>{const data={scope,...latestCommand.current,playing:false};if(Platform.OS==="web")frame.current?.contentWindow?.postMessage(data,"*");else native.current?.injectJavaScript("window.updateLectureAudio?.("+JSON.stringify(data)+");true;");interrupt.current?.()}),[scope]);
  const [ready, setReady] = useState(false);
  const html = useMemo(() => lectureAudioHtml(url, scope), [url, scope]);
  const receive = (data: any) => {
    if (
      data?.scope === scope &&
      data.type === "status" &&
      typeof data.playing === "boolean" &&
      typeof data.failed === "boolean" &&
      Number.isFinite(data.time) &&
      Number.isFinite(data.duration) &&
      data.time >= 0 &&
      data.duration >= 0
    ) {
      if(data.playing&&!wasPlaying.current)announceMediaPlaying(scope);wasPlaying.current=data.playing;
      status.current({
        playing: data.playing,
        time: data.time,
        duration: data.duration,
        failed: data.failed,
        ended: data.ended === true,
      });
    }
  };
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const listener = (event: MessageEvent) => {
      if (event.source === frame.current?.contentWindow) receive(event.data);
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [scope]);
  useEffect(() => {
    const data = { scope, ...command };
    if (Platform.OS === "web")
      frame.current?.contentWindow?.postMessage(data, "*");
    else
      native.current?.injectJavaScript(
        "window.updateLectureAudio?.(" + JSON.stringify(data) + ");true;"
      );
  }, [scope, command, ready]);
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        width: 1,
        height: 1,
        overflow: "hidden",
        opacity: 0,
      }}
    >
      {Platform.OS === "web" ? (
        React.createElement("iframe", {
          ref: frame,
          onLoad: () => setReady(true),
          title: "Lecture audio decoder",
          srcDoc: html,
          sandbox: "allow-scripts",
          allow: "autoplay",
          style: { width: 1, height: 1, border: 0 },
        })
      ) : (
        <WebView
          ref={native}
          source={{ html }}
          onLoadEnd={() => setReady(true)}
          originWhitelist={["*"]}
          sharedCookiesEnabled={false}
          thirdPartyCookiesEnabled={false}
          javaScriptEnabled
          mediaPlaybackRequiresUserAction={false}
          setSupportMultipleWindows={false}
          onMessage={(event) => {
            try {
              if (event.nativeEvent.data.length < 2048)
                receive(JSON.parse(event.nativeEvent.data));
            } catch {}
          }}
          onError={() =>
            status.current({
              playing: false,
              time: 0,
              duration: 0,
              failed: true,
            })
          }
          onShouldStartLoadWithRequest={(request) =>
            request.url === "about:blank"
          }
        />
      )}
    </View>
  );
}
