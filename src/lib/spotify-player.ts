export type SpotifyTarget = { uri: string; embedUrl: string; url: string };
export function spotifyTarget(raw: string): SpotifyTarget | null {
  try {
    const u = new URL(raw);
    if (
      u.protocol !== "https:" ||
      u.hostname !== "open.spotify.com" ||
      u.username ||
      u.password
    )
      return null;
    const m = u.pathname.match(
      /^\/(?:embed\/)?(?:intl-[a-z-]+\/)?(track|episode|show|album|playlist|artist)\/([A-Za-z0-9]{1,128})\/?$/
    );
    return m
      ? {
          uri: `spotify:${m[1]}:${m[2]}`,
          embedUrl: `https://open.spotify.com/embed/${m[1]}/${m[2]}`,
          url: `https://open.spotify.com/${m[1]}/${m[2]}`,
        }
      : null;
  } catch {
    return null;
  }
}
export type SpotifyPlayback = {
  time: number;
  duration: number;
  playing: boolean;
};
export function normalizeSpotifyPlayback(raw: unknown): SpotifyPlayback | null {
  const d = raw as any;
  if (
    !d ||
    typeof d !== "object" ||
    typeof d.position !== "number" ||
    typeof d.duration !== "number" ||
    typeof d.isPaused !== "boolean" ||
    !Number.isFinite(d.position) ||
    !Number.isFinite(d.duration) ||
    d.position < 0 ||
    d.duration < 0 ||
    d.position > 3_600_000_000 ||
    d.duration > 3_600_000_000
  )
    return null;
  return {
    time: d.position / 1000,
    duration: d.duration / 1000,
    playing: !d.isPaused,
  };
}
export function spotifyPlayerHtml(raw: string, scope: string, resumeAt = 0) {
  const target = spotifyTarget(raw);
  const data = JSON.stringify({
    target,
    scope,
    resumeAt: Number.isFinite(resumeAt) ? Math.max(0, resumeAt) : 0,
  }).replace(/</g, "\\u003c");
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="strict-origin-when-cross-origin"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' https://open.spotify.com https://embed-cdn.spotifycdn.com; frame-src https://open.spotify.com; style-src 'unsafe-inline'; connect-src https://open.spotify.com; img-src https: data:"><style>html,body,#host,iframe{margin:0;width:100%!important;height:100%!important;border:0;background:#121212}body{overflow:hidden}</style></head><body><div id="host"><div id="mount"></div></div><script>(()=>{const c=${data};let controller=null,closed=false,available=false,restored=c.resumeAt<5;const emit=data=>{const m={...data,scope:c.scope};if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify(m));else parent.postMessage(m,'*')};const fallback=()=>{if(closed||available||!c.target)return;closed=true;const f=document.createElement('iframe');f.title='Spotify player';f.src=c.target.embedUrl;f.allow='autoplay; encrypted-media; fullscreen; picture-in-picture';document.getElementById('host').replaceChildren(f);emit({type:'ready',available:false})};if(!c.target){emit({type:'error'});return}window.pauseSpotifyPlayer=owner=>{if(owner!==c.scope)return;try{controller?.pause?.()}catch{}};window.addEventListener('message',e=>{if(e.source===parent&&e.data?.type==='pause')window.pauseSpotifyPlayer(e.data.scope)});const timer=setTimeout(fallback,8000);window.onSpotifyIframeApiReady=api=>{if(closed)return;try{api.createController(document.getElementById('mount'),{uri:c.target.uri,width:'100%',height:352},value=>{if(closed){value.destroy?.();return}controller=value;available=true;clearTimeout(timer);value.addListener('error',()=>emit({type:'error'}));value.addListener('playback_update',event=>{const d=event?.data;if(!d||typeof d.position!=='number'||typeof d.duration!=='number'||typeof d.isPaused!=='boolean'||!Number.isFinite(d.position)||!Number.isFinite(d.duration)||d.position<0||d.duration<0||d.position>3600000000||d.duration>3600000000)return;if(!restored&&!d.isPaused&&!d.isBuffering){restored=true;if(d.position/1000<c.resumeAt-3&&(d.duration<=0||c.resumeAt<d.duration/1000-2))try{value.seek(Math.floor(c.resumeAt))}catch{}}emit({type:'playback',position:d.position,duration:d.duration,isPaused:d.isPaused})});emit({type:'ready',available:true})})}catch{fallback()}};const s=document.createElement('script');s.src='https://open.spotify.com/embed/iframe-api/v1';s.async=true;s.onerror=fallback;document.body.appendChild(s)})();</script></body></html>`;
}
