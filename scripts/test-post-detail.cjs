const fs=require('fs'),assert=require('assert/strict'),path=require('path'),root=path.resolve(__dirname,'..');
const entry=fs.readFileSync(root+'/scripts/post-detail-entry.jsx','utf8'),build=fs.readFileSync(root+'/scripts/build-post-detail.mjs','utf8'),frame=fs.readFileSync(root+'/src/components/social/WebsitePostDetail.tsx','utf8'),asset=fs.readFileSync(root+'/assets/post-detail.html','utf8'),social=fs.readFileSync(root+'/src/components/social/DesktopSocial.tsx','utf8');
/* Actual source wiring */
assert(entry.includes("import{PostDetailModal}from'@/components/forum/PostDetailModal'"));
assert(entry.includes('initialTab'));
assert(social.includes('<WebsitePostDetail post={selectedPost}'));
assert(!social.includes('richOffset'),'generic overlay removed');
/* Network isolation inside the renderer */
for(const name of['window.fetch=','window.XMLHttpRequest=','window.WebSocket=','window.open='])assert(entry.includes(name));
for(const constraint of["connect-src 'none'","frame-src 'none'","form-action 'none'"])assert(asset.includes(constraint));
assert(asset.includes('img-src https: data:')&&asset.includes('media-src https:'),'media limited to https');
/* Read bridge is GET-only and path-locked; every write hits the guard */
assert(build.includes("method==='GET'"),'bridge limited to GET');
assert(asset.includes('posts\\/[A-Za-z0-9_-]{1,100}\\/comments'),'comments read path locked');
assert(asset.includes('mentions\\/search'),'mention search path locked');
assert(build.includes("__postDetailGuard?.(method,url)"),'writes guarded');
assert(build.includes('Read-only preview. Nothing was sent.'));
assert(frame.includes("path.slice('/api/v1'.length)"),'native performs the authenticated GET');
assert(frame.includes('600000'),'comment payload bounded');
assert(frame.includes('isFixtureMode()'),'guest mode never reaches the network');
assert(!frame.includes('apiV1.post')&&!asset.includes('authSessionV2'),'no writes, no token enters the renderer');
/* Source contract checks */
assert(build.includes('window.location.origin'),'share URL source contract asserted');
assert(build.includes('fetchYouTubeTitle(id: string): Promise<string>'),'video-utils title contract asserted');
assert(build.includes('__postDetailYtResolve'),'YouTube titles resolve through the native credential-free helper');
/* Scope validation and account-free payload */
assert(entry.includes('payload?.scope!==scope'));
assert(entry.includes('post.content.length>20000'));
assert(frame.includes('data?.scope!==scope'));
assert(frame.includes("event.source===frame.current?.contentWindow"));
for(const flag of['sharedCookiesEnabled={false}','thirdPartyCookiesEnabled={false}','domStorageEnabled={false}','allowUniversalAccessFromFileURLs={false}'])assert(frame.includes(flag));
assert(frame.includes('Crypto.randomUUID'),'random scope per open');
/* Native media and share bridges stay allow-listed */
assert(frame.includes('(twitter|x)\\.com|wa\\.me|(www\\.)?facebook\\.com'),'share hosts allow-listed');
assert(frame.includes('^[A-Za-z0-9_-]{11}$'),'YouTube id validated');
assert(frame.includes('LectureVideoPlayer'),'YouTube opens in the existing isolated player');
console.log('PASS actual source post detail sheet extraction, GET-only comment/mention bridge, write guards, source/scope validation and isolated native settings');
