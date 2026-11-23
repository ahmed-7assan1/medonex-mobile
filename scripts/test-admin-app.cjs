const fs=require('fs'),assert=require('assert/strict');
const root='/home/sandbox/projects/medonex-mobile';
const html=fs.readFileSync(root+'/assets/admin-app.html','utf8');
assert(html.length>5_000_000,'admin bundle built');
assert(html.includes("default-src 'none'"),'CSP locked down');
assert(html.includes("connect-src 'none'"),'no network from the frame');
assert(html.includes('data:image/svg+xml;base64,'),'site logo inlined');
const entry=fs.readFileSync(root+'/scripts/admin-entry.jsx','utf8');
for(const route of['/admin/dashboard','/admin/users','/admin/questions','/admin/settings','/admin/security','/admin/audit-logs','/admin/content','/admin/channels','/admin/atlas','/studio/sync','/admin/forum','/admin/testimonials','/admin/social-reports','/admin/ads','/admin/teams','/admin/founders','/admin/leaderboard','/admin/warnings','/admin/og-card','/admin/admin-monitoring','/admin/video-analytics','/admin/content-browser','/admin/telegram','/admin/pdf-tools','/admin/ai-studio','/admin/ai-keys','/admin/quiz-analytics','/admin/quiz-manager','/admin/quiz-creator','/admin/questions/reports','/admin/admin-monitoring'])
  assert(entry.includes("'"+route+"'"),'route registered: '+route);
assert(entry.includes("/admin/users/"),'dynamic user route handled');
assert(entry.includes("__adminRedirect:'/admin/dashboard'"),'root redirect matches source');
const wrapper=fs.readFileSync(root+'/src/components/admin/WebsiteAdminApp.tsx','utf8');
assert(wrapper.includes("ADMIN_ROLES=new Set(['ADMIN','SUPER_ADMIN','FACULTY_LEADER'])"),'role gate matches the source layout roles');
assert(wrapper.includes('apiGetAbsolute'),'read-only GET bridge');
assert(wrapper.includes("type:'guard'")||wrapper.includes("'guard'"),'write guard surfaced');
const api=fs.readFileSync(root+'/src/lib/api.ts','utf8');
assert(api.includes('apiGetAbsolute')&&api.includes("method: 'GET'"),'absolute GET helper is GET-only');
const builder=fs.readFileSync(root+'/scripts/build-admin.mjs','utf8');
for(const stub of['prisma','next\\/navigation','next\\/dynamic','@sentry\\/nextjs','SupabaseAuthProvider','api-fetch'])
  assert(builder.includes(stub),'stub present: '+stub);
assert(builder.includes("if(method==='count'||method==='aggregate')"),'prisma replay defaults');

/* native shell + entry-point checks */
const siteLayout=fs.readFileSync('/home/sandbox/projects/medqs-mobile-auth/src/app/(admin)/layout.tsx','utf8');
const siteRoles=[...siteLayout.matchAll(/role === "([A-Z_]+)"/g)].map(m=>m[1]).sort();
assert(JSON.stringify(siteRoles)===JSON.stringify(['ADMIN','FACULTY_LEADER','SUPER_ADMIN']),'site admin gate roles unchanged: '+siteRoles);
assert(wrapper.includes("'ADMIN','SUPER_ADMIN','FACULTY_LEADER'"),'native gate matches site gate');

const m=wrapper.match(/SAFE_GET=(\/\^\\\/api\\\/.{1,120}?\/)\n/);
const safeGet=eval(wrapper.match(/SAFE_GET=(\/[^;]+?\/);/)[1]);
for(const ok of['/api/v1/admin/platform/security?days=7&limit=50','/api/v1/modules-all','/api/v1/admin/ai-settings','/api/v1/admin/platform/admin-monitoring?days=7&limit=50'])
  assert(safeGet.test(ok),'SAFE_GET accepts '+ok);
assert(wrapper.includes("path.includes('..')"),'wrapper rejects dot segments');
for(const bad of['https://evil.example/api/x','//evil.example/api/x','/admin/dashboard','/api/../etc','/api/x<script>','api/v1/x','/API/v1/x','/api/'+('a'.repeat(481))])
  assert(!safeGet.test(bad)||bad.includes('..'),'SAFE_GET rejects '+bad.slice(0,40));

assert(wrapper.includes("data.type==='guard'")&&wrapper.includes('Alert.alert'),'guard event raises the read-only alert');
assert(wrapper.includes("data.type==='ready'"),'ready event handled');
assert(wrapper.includes("signOut()"),'signout bridged');
assert(wrapper.includes('setThemeChoice'),'theme bridged');
assert(wrapper.includes("onShouldStartLoadWithRequest"),'WebView navigation locked to the local asset');

const entryRoutes=['app/admin/index.tsx','app/admin/[...path].tsx','app/studio/sync.tsx'];
for(const f of entryRoutes){const c=fs.readFileSync(root+'/'+f,'utf8');assert(c.includes('WebsiteAdminApp')||c.includes('Redirect'),f+' wired')}
const chrome=fs.readFileSync(root+'/src/components/DesktopStudentChrome.tsx','utf8');
assert(chrome.includes('/admin')&&chrome.includes('/studio/sync'),'student chrome yields to admin routes');
for(const menuFile of['src/components/FloatingStudentHeader.tsx','src/components/DesktopStudentChrome.tsx']){
  const c=fs.readFileSync(root+'/'+menuFile,'utf8');
  assert(c.includes('"Admin dashboard"'),menuFile+' has the admin entry');
  assert(c.includes('/admin/dashboard'),menuFile+' admin entry navigates to /admin/dashboard');
  assert(c.includes('["ADMIN", "SUPER_ADMIN", "FACULTY_LEADER"]'),menuFile+' uses the site gate roles');
  assert(c.includes('ShieldCheck'),menuFile+' uses the source ShieldCheck icon');
}
console.log('admin app bundle checks pass');
