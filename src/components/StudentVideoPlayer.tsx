import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import {listenForOtherMedia,announceMediaPlaying} from "@/lib/media-playback";
import { useTheme } from "@/theme/ThemeContext";
export function studentPlayerHtml(
  url: string,
  scope: string,
  startTime?: number | null,
  endTime?: number | null
) {
  const position = (value: unknown) => {
    if (typeof value === "number" && Number.isFinite(value))
      return Math.max(0, Math.floor(value));
    if (typeof value !== "string") return 0;
    const seconds = Number(value);
    if (Number.isFinite(seconds)) return Math.max(0, Math.floor(seconds));
    const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
    return match
      ? Number(match[1] || 0) * 3600 +
          Number(match[2] || 0) * 60 +
          Number(match[3] || 0)
      : 0;
  };
  let start = position(startTime),
    end = position(endTime);
  try {
    const parsed = new URL(url);
    if (startTime == null)
      start = position(
        parsed.searchParams.get("start") || parsed.searchParams.get("t")
      );
    if (endTime == null) end = position(parsed.searchParams.get("end"));
  } catch {}
  if (end <= start) end = 0;
  const data = JSON.stringify({ url, scope, start, end }).replace(
    /</g,
    "\\u003c"
  );
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="strict-origin-when-cross-origin"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' https://www.youtube.com https://s.ytimg.com; frame-src https://www.youtube.com https://www.youtube-nocookie.com; style-src 'unsafe-inline'; media-src https:; img-src https: data:; connect-src https://www.youtube.com"><style>html,body,#player,video,iframe{margin:0;width:100%;height:100%;border:0;background:#000}body{overflow:hidden}video{object-fit:contain}</style></head><body><div id="player"></div><script>(()=>{const config=${data};let player=null;let video=null;let desired={playing:false,muted:true};const emit=message=>{const data={...message,scope:config.scope};if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify(data));else window.parent.postMessage(data,'*')};window.studentMediaUpdate=next=>{if(!next||next.scope!==config.scope)return;desired={playing:!!next.playing,muted:!!next.muted};if(video){video.muted=desired.muted;if(desired.playing)video.play().catch(()=>emit({type:'state',playing:false}));else video.pause()}if(player&&typeof player.playVideo==='function'){if(desired.muted)player.mute();else player.unMute();if(desired.playing)player.playVideo();else player.pauseVideo()}};window.addEventListener('message',event=>{if(event.source===window.parent&&event.data?.type==='command')window.studentMediaUpdate(event.data)});let parsed;try{parsed=new URL(config.url);if(parsed.protocol!=='https:')throw Error()}catch{emit({type:'error'});return}let id=null;if(['youtube.com','www.youtube.com','m.youtube.com','youtu.be'].includes(parsed.hostname)){id=parsed.hostname==='youtu.be'?parsed.pathname.slice(1):parsed.searchParams.get('v')||parsed.pathname.match(/^\\/(?:shorts|embed)\\/([A-Za-z0-9_-]{11})/)?.[1]}if(id&&/^[A-Za-z0-9_-]{11}$/.test(id)){window.onYouTubeIframeAPIReady=()=>{player=new YT.Player('player',{host:'https://www.youtube-nocookie.com',videoId:id,playerVars:{playsinline:1,controls:0,rel:0,autoplay:0,enablejsapi:1,start:config.start,...(config.end?{end:config.end}:{}),origin:'https://www.medonex.me'},events:{onReady:()=>{emit({type:'ready'});setInterval(()=>{const duration=config.end||player.getDuration();emit({type:'progress',progress:Math.max(0,Math.min(1,(player.getCurrentTime()-config.start)/(duration-config.start||1)))})},500)},onStateChange:event=>{if([1,2,0].includes(event.data))emit({type:'state',playing:event.data===1});if(event.data===0&&desired.playing){player.seekTo(config.start);player.playVideo()}},onError:()=>emit({type:'error'})}})};const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.onerror=()=>emit({type:'error'});document.body.appendChild(script)}else if(!id&&!['youtube.com','www.youtube.com','m.youtube.com','youtu.be'].includes(parsed.hostname)){video=document.createElement('video');video.playsInline=true;video.loop=false;video.onended=()=>{video.currentTime=config.start;if(desired.playing)video.play().catch(()=>emit({type:'state',playing:false}))};video.preload='metadata';video.muted=true;video.src=parsed.href;video.onloadedmetadata=()=>{if(config.start>0)video.currentTime=config.start};video.ontimeupdate=()=>{const duration=config.end||video.duration;emit({type:'progress',progress:Math.max(0,Math.min(1,(video.currentTime-config.start)/(duration-config.start||1)))});if(config.end&&video.currentTime>=config.end){video.currentTime=config.start;if(desired.playing)video.play().catch(()=>{})}};video.oncanplay=()=>emit({type:'ready'});video.onplay=()=>emit({type:'state',playing:true});video.onpause=()=>emit({type:'state',playing:false});video.onerror=()=>emit({type:'error'});document.getElementById('player').replaceWith(video)}else emit({type:'error'})})();</script></body></html>`;
}
/** Isolated media surface. It receives only a public/selected media URL and
 * playback state, never an app session, cookies, or account-read capability. */
export function StudentVideoPlayer({
  url,
  playing,
  muted,
  startTime,
  endTime,
  onPlayingChange,
  onProgress,
}: {
  url: string;
  playing: boolean;
  muted: boolean;
  startTime?: number | null;
  endTime?: number | null;
  onPlayingChange: (playing: boolean) => void;
  onProgress?: (progress: number) => void;
}) {
  const { fonts } = useTheme();
  const scope = useRef("media-" + Date.now() + "-" + Math.random()).current;
  const native = useRef<WebView>(null);
  const frame = useRef<any>(null);
  const latest=useRef({muted,onPlayingChange}),wasPlaying=useRef(false);latest.current={muted,onPlayingChange};
  useEffect(()=>listenForOtherMedia(scope,()=>{const command={type:'command',scope,playing:false,muted:latest.current.muted};if(Platform.OS==='web')frame.current?.contentWindow?.postMessage(command,'*');else native.current?.injectJavaScript('window.studentMediaUpdate?.('+JSON.stringify(command)+');true;');latest.current.onPlayingChange(false)}),[scope]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);
  const html = useMemo(
    () => studentPlayerHtml(url, scope, startTime, endTime),
    [url, scope, startTime, endTime, reload]
  );
  const accept = (data: any) => {
    if (!data || data.scope !== scope) return;
    if (data.type === "ready") {
      setReady(true);
      setError(false);
    } else if (data.type === "state" && typeof data.playing === "boolean"){
      if(data.playing&&!wasPlaying.current)announceMediaPlaying(scope);wasPlaying.current=data.playing;
      onPlayingChange(data.playing);
    }
    else if (
      data.type === "progress" &&
      typeof data.progress === "number" &&
      Number.isFinite(data.progress)
    )
      onProgress?.(Math.max(0, Math.min(1, data.progress)));
    else if (data.type === "error") setError(true);
  };
  useEffect(() => {
    setReady(false);
    setError(false);
  }, [html]);
  useEffect(() => {
    if (ready || error) return;
    const timer = setTimeout(() => setError(true), 15000);
    return () => clearTimeout(timer);
  }, [html, ready, error]);
  useEffect(() => {
    if (!ready) return;
    const command = { type: "command", scope, playing, muted };
    if (Platform.OS === "web")
      frame.current?.contentWindow?.postMessage(command, "*");
    else
      native.current?.injectJavaScript(
        "window.studentMediaUpdate?.(" + JSON.stringify(command) + ");true;"
      );
  }, [playing, muted, ready, scope]);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const listener = (event: MessageEvent) => {
      if (event.source === frame.current?.contentWindow) accept(event.data);
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [scope, onPlayingChange, onProgress]);
  const retry = () => {
    setReady(false);
    setError(false);
    setReload((value) => value + 1);
  };
  return (
    <View
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#000",
        zIndex: error ? 7 : 0,
      }}
    >
      {!error &&
        (Platform.OS === "web" ? (
          React.createElement("iframe", {
            key: reload,
            ref: frame,
            title: "Lecture video player",
            srcDoc: html,
            sandbox: "allow-scripts",
            allow: "autoplay; encrypted-media; fullscreen; picture-in-picture",
            style: { width: "100%", height: "100%", border: 0 },
          })
        ) : (
          <WebView
            key={reload}
            ref={native}
            source={{ html, baseUrl: "https://www.medonex.me" }}
            originWhitelist={["*"]}
            sharedCookiesEnabled={false}
            thirdPartyCookiesEnabled={false}
            javaScriptEnabled
            allowsInlineMediaPlayback
            allowsFullscreenVideo
            mediaPlaybackRequiresUserAction={false}
            setSupportMultipleWindows={false}
            style={{ flex: 1, backgroundColor: "#000" }}
            onMessage={(event) => {
              try {
                if (event.nativeEvent.data.length < 2048)
                  accept(JSON.parse(event.nativeEvent.data));
              } catch {}
            }}
            onError={() => setError(true)}
            onShouldStartLoadWithRequest={(request) => {
              if (request.url === "about:blank") return true;
              try {
                const value = new URL(request.url);
                return (
                  value.protocol === "https:" &&
                  ((value.hostname === "www.medonex.me" &&
                    value.pathname === "/") ||
                    (request.isTopFrame !== true &&
                      ["www.youtube.com", "www.youtube-nocookie.com"].includes(
                        value.hostname
                      ) &&
                      value.pathname.startsWith("/embed/")))
                );
              } catch {
                return false;
              }
            }}
          />
        ))}
      {!ready && !error && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            inset: 0,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator color="#fff" />
        </View>
      )}
      {error && (
        <View
          style={{
            flex: 1,
            padding: 36,
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontFamily: fonts.sansSemiBold,
              fontSize: 15,
              textAlign: "center",
            }}
          >
            This video could not play here.
          </Text>
          <Text
            style={{
              color: "#FFFFFF99",
              fontFamily: fonts.sans,
              fontSize: 12,
              lineHeight: 18,
              textAlign: "center",
            }}
          >
            It may be unavailable, or the provider may not allow embedded
            playback.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={retry}
            style={{ padding: 12 }}
          >
            <Text style={{ color: "#fff", fontFamily: fonts.sansBold }}>
              Try again
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              try {
                if (new URL(url).protocol === "https:")
                  void Linking.openURL(url).catch(() => {});
              } catch {}
            }}
            style={{ padding: 12 }}
          >
            <Text style={{ color: "#fff", fontFamily: fonts.sansBold }}>
              Open original video
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
