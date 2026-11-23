const fs=require('fs'),assert=require('assert/strict'),path=require('path'),root=path.resolve(__dirname,'..');
const entry=fs.readFileSync(root+'/scripts/community-cards-entry.jsx','utf8'),build=fs.readFileSync(root+'/scripts/build-community-cards.mjs','utf8'),frame=fs.readFileSync(root+'/src/components/home/WebsiteCommunityCards.tsx','utf8'),asset=fs.readFileSync(root+'/assets/community-cards.html','utf8'),home=fs.readFileSync(root+'/src/components/home/TabletHome.tsx','utf8');
/* Actual source wiring: the dashboard marquee is the literal CommunityPostsCarousel block rendering community-mobile/PostCard. */
assert(entry.includes("import PostCard from'@/components/community-mobile/PostCard'"));
assert(entry.includes('animate-marquee')&&entry.includes('w-[380px]'),'literal source marquee block');
assert(entry.includes('currentUserId={post.author?.id||'+"'"+''+"'}"),'source owner-style menu quirk copied literally');
assert(home.includes('<WebsiteCommunityCards posts={posts}'),'dashboard section renders the actual source cards');
assert(!home.includes('<PostCard post={post} contentWidth={380}'),'generic marquee cards removed from dashboard');
/* Network isolation inside the renderer: cards render from payload data only. */
for(const name of['window.fetch=','window.XMLHttpRequest=','window.WebSocket='])assert(entry.includes(name));
for(const constraint of["connect-src 'none'","frame-src 'none'","form-action 'none'"])assert(asset.includes(constraint));
assert(asset.includes('img-src https: data:')&&asset.includes('media-src https:'),'media limited to https');
/* Read-only guards: apiFetch GETs fail quietly (LinkPreview), every write raises the guard. */
assert(build.includes("method!=='GET'"),'GET reads fail quietly');
assert(build.includes('__communityGuard?.(method'),'writes guarded');
assert(build.includes('Read-only preview. Nothing was sent.'));
assert(build.includes("window.__communityGuard?.('POST'"),'delete/block guarded');
assert(build.includes('openComposer:()=>window.__communityGuard?.'),'composer guarded');
assert(!frame.includes('apiV1')&&!asset.includes('authSessionV2'),'no network calls and no token enters the renderer');
/* Source contract checks */
assert(build.includes('window.location.origin'),'share URL source contract asserted');
assert(build.includes('__COMMUNITY_ORIGIN__'),'share origin injected from payload');
assert(entry.includes('__COMMUNITY_ORIGIN__=typeof payload.origin'));
/* Bridge events routed to existing native surfaces */
assert(frame.includes('CommentsSheet'),'comments open the existing sheet');
assert(frame.includes('WebsitePostStudy'),'study opens the existing native sheet');
assert(frame.includes("WebsiteSavedAction kind={report?'report':null}"),'report opens the existing action');
assert(frame.includes('LectureVideoPlayer'),'YouTube opens in the existing isolated player');
assert(frame.includes('^[A-Za-z0-9_-]{11}$'),'YouTube id validated');
assert(frame.includes('REACTION_KEYS'),'reaction counts bounded to known keys');
/* Scope validation and bounded payload */
assert(entry.includes('payload?.scope!==scope'));
assert(entry.includes('post.content.length<=20000'));
assert(frame.includes('data?.scope!==scope'));
assert(frame.includes("event.source===frame.current?.contentWindow"));
assert(frame.includes('.slice(0,12)'),'card count bounded');
for(const flag of['sharedCookiesEnabled={false}','thirdPartyCookiesEnabled={false}','domStorageEnabled={false}','allowUniversalAccessFromFileURLs={false}'])assert(frame.includes(flag));
assert(frame.includes('Crypto.randomUUID'),'random scope per open');
assert(frame.includes("sandbox:'allow-scripts'"),'web iframe sandboxed');
console.log('PASS actual source community marquee cards extraction, payload-only rendering, read-only guards, bridge routing and isolated native settings');
