import React,{useEffect,useRef,useState} from "react";
import { Platform, View, Pressable, Text } from "react-native";
import * as Crypto from "expo-crypto";
import {listenForOtherMedia,announceMediaPlaying} from "@/lib/media-playback";
import { WebView } from "react-native-webview";
/** Provider media only. No app session or message bridge enters this frame. */
export function SpotifyRecordFrame({ url }: { url: string }) {
  const scope=useRef(Crypto.randomUUID()).current,[interrupted,setInterrupted]=useState(false);
  let safe = "";
  try {
    const parsed = new URL(url);
    if (
      parsed.protocol === "https:" &&
      parsed.hostname === "open.spotify.com" &&
      /^\/embed\/(track|episode|album|show|playlist)\/[a-zA-Z0-9]+$/.test(
        parsed.pathname
      )
    )
      safe = parsed.href;
  } catch {}
  useEffect(()=>{if(!safe)return;setInterrupted(false);announceMediaPlaying(scope);return listenForOtherMedia(scope,()=>setInterrupted(true))},[scope,safe]);
  if (!safe) return null;
  if(interrupted)return <View style={{height:152,justifyContent:'center',alignItems:'center',gap:12,backgroundColor:'#121212',borderRadius:16,padding:20}}><Text style={{color:'#ffffff99',fontSize:13,textAlign:'center'}}>Spotify was closed to play the other media.</Text><Pressable accessibilityRole="button" accessibilityLabel="Reopen Spotify player" onPress={()=>{announceMediaPlaying(scope);setInterrupted(false)}}><Text style={{color:'#fff',fontSize:14,fontWeight:'600'}}>Reopen Spotify player</Text></Pressable></View>;
  return (
    <View
      style={{
        height: 152,
        width: "100%",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {Platform.OS === "web" ? (
        React.createElement("iframe", {
          title: "Spotify Full Player",
          src: safe,
          allow: "autoplay; encrypted-media; fullscreen; picture-in-picture",
          sandbox: "allow-scripts allow-same-origin allow-presentation",
          style: { border: 0, width: "100%", height: 152, borderRadius: 16 },
        })
      ) : (
        <WebView
          source={{ uri: safe }}
          sharedCookiesEnabled={false}
          thirdPartyCookiesEnabled={false}
          javaScriptEnabled
          setSupportMultipleWindows={false}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction
          onShouldStartLoadWithRequest={(request) => {
            try {
              const parsed = new URL(request.url);
              return (
                parsed.protocol === "https:" &&
                (request.isTopFrame !== true ||
                  (parsed.hostname === "open.spotify.com" &&
                    parsed.pathname.startsWith("/embed/")))
              );
            } catch {
              return request.url === "about:blank";
            }
          }}
        />
      )}
    </View>
  );
}
