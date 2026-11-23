// Package the exact MedQs0 admin console (layout chrome + all 31 routable pages) as a local
// asset. Reads are bridged to native (read-only GETs); every write is guarded on device.
import{websiteCSS}from'./website-css.mjs';
import fs from'node:fs';import path from'node:path';import{createRequire}from'node:module';import{fileURLToPath}from'node:url';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url))),website=path.resolve(process.argv[2]||'../medqs-mobile-auth'),req=createRequire(website+'/package.json');

/* Server pages query Prisma directly. The stub replays per-route fixtures the native side
   injects (keyed `model.method`, consumed in call order) and otherwise returns the same
   empty/zero values a live empty database would, so pages render their exact source empty states. */
const prismaStub=`const data=()=>window.__ADMIN_DATA__||{};
const run=(model,method,args)=>{
  const queues=data().queries||{};
  const key=model+'.'+method;
  const queue=queues[key];
  if(Array.isArray(queue)&&queue.length)return queue.shift();
  if(method==='count'||method==='aggregate')return method==='count'?0:{};
  if(method==='findMany'||method==='groupBy'||method==='findManyRaw')return [];
  return null;
};
const modelProxy=model=>new Proxy({},{get:(target,method)=>{
  if(typeof method!=='string')return undefined;
  return args=>Promise.resolve(run(model,method,args));
}});
export const prisma=new Proxy({},{get:(target,prop)=>{
  if(prop==='$transaction')return items=>Promise.all(items);
  if(prop==='$queryRaw'||prop==='$executeRaw')return()=>Promise.resolve([]);
  if(prop==='$connect'||prop==='$disconnect')return()=>Promise.resolve();
  if(typeof prop!=='string')return undefined;
  return modelProxy(prop);
}});`;

const authStub=`export const auth=async()=>window.__ADMIN_SESSION__||null;`;
const tenantStub=`export const getSessionScope=async()=>window.__ADMIN_SCOPE__||null;
export const invalidateSessionScope=async()=>{};
export const isAdminRole=role=>role==='ADMIN'||role==='SUPER_ADMIN'||role==='FACULTY_LEADER';
export const isFacultyLeader=role=>role==='FACULTY_LEADER';
export const isTeacherRole=role=>role==='TEACHER';
export const isSuperAdmin=role=>role==='SUPER_ADMIN';
export const canManageContent=role=>isAdminRole(role)||isTeacherRole(role);
export const isScopedAdmin=scope=>!!scope&&!isSuperAdmin(scope.role);`;
const authUserStub=`export const getAuthenticatedUser=async()=>window.__ADMIN_SESSION__?.user||null;`;
const rbacStub=`export const enforceWithLegacyFallback=async()=>window.__ADMIN_SCOPE__||null;
export const AuthorizationError=class extends Error{};`;

/* apiFetch is Response-returning in the source; the bridged window.fetch already guards writes. */
const apiStub=`export const apiFetch=(input,init)=>window.fetch(input,init);`;
const toastStub=`const show=(kind)=>message=>window.__adminEmit?.({type:'toast',kind,message:String(message||'').slice(0,300)});
const api={success:show('success'),error:show('error'),loading:show('loading'),dismiss:()=>{}};
export default api;export const toast=api;`;

/* Theme follows the native app theme; choosing another theme asks native to switch, which
   re-renders the frame with the new dark flag (single source of truth stays native). */
const storeStub=`import{useSyncExternalStore}from'react';
const themeListeners=new Set();
const themeState={theme:window.__ADMIN_DARK__?'dark':'light',resolvedTheme:window.__ADMIN_DARK__?'dark':'light',setTheme:theme=>window.__adminEmit?.({type:'theme',theme:String(theme).slice(0,10)})};
export const __syncAdminTheme=dark=>{themeState.theme=dark?'dark':'light';themeState.resolvedTheme=themeState.theme;themeListeners.forEach(fn=>fn())};
export const useThemeStore=selector=>{useSyncExternalStore(fn=>{themeListeners.add(fn);return()=>themeListeners.delete(fn)},()=>themeState.theme);return selector?selector(themeState):themeState};
useThemeStore.getState=()=>themeState;
const notifListeners=new Set();let notifRevision=0;
const notifState={notifications:[],unread:0,
  setNotifications(raw){notifState.notifications=Array.isArray(raw)?raw:[];notifState.unread=notifState.notifications.filter(n=>!n.read).length;notifRevision++;notifListeners.forEach(fn=>fn())},
  addNotification(n){notifState.notifications=[n,...notifState.notifications];notifState.unread+=n.read?0:1;notifRevision++;notifListeners.forEach(fn=>fn())},
  markRead(id){window.__adminGuard?.('PUT','/api/v1/notifications/read');notifState.notifications=notifState.notifications.map(n=>n.id===id?{...n,read:true}:n);notifState.unread=Math.max(0,notifState.unread-1);notifRevision++;notifListeners.forEach(fn=>fn())},
  markAllRead(){window.__adminGuard?.('PUT','/api/v1/notifications/read-all');notifState.notifications=notifState.notifications.map(n=>({...n,read:true}));notifState.unread=0;notifRevision++;notifListeners.forEach(fn=>fn())},
  /* No polling in the local app: one read per open, driven by the native bridge. */
  fetchNotifications:async()=>{try{const res=await window.fetch('/api/v1/notifications');if(res.ok)notifState.setNotifications(await res.json())}catch{}},
  ensureNotificationsFresh:async()=>{},
  startPolling:()=>{},stopPolling:()=>{}};
export const useNotificationStore=selector=>{useSyncExternalStore(fn=>{notifListeners.add(fn);return()=>notifListeners.delete(fn)},()=>notifRevision);return selector?selector(notifState):notifState};
useNotificationStore.getState=()=>notifState;`;

const supabaseStub=`export const createClient=()=>({auth:{signOut:async()=>{window.__adminEmit?.({type:'signout'});return{}},getUser:async()=>({data:{user:window.__ADMIN_SESSION__?.user||null}})},channel:()=>({on(){return this},subscribe(){return this},unsubscribe:async()=>{}}),from:()=>({select:()=>({eq:()=>({single:async()=>({data:null,error:null}),order:()=>({limit:async()=>({data:[],error:null})})})})})});`;
const sidebarStoreStub=`export const isDesktopSidebarOpen=()=>true;export const subscribeDesktopSidebar=()=>()=>{};export const toggleDesktopSidebar=()=>{};`;
const appRouterStub=`export const useAppRouter=()=>({push:href=>window.__adminNav?.navigate(String(href||'')),replace:href=>window.__adminNav?.navigate(String(href||''),{replace:true}),back:()=>window.__adminEmit?.({type:'back'}),prefetch:()=>{},refresh:()=>{}});`;
const navStub=`import{useSyncExternalStore}from'react';
export const useRouter=()=>({push:href=>window.__adminNav?.navigate(String(href||'')),replace:href=>window.__adminNav?.navigate(String(href||''),{replace:true}),back:()=>window.__adminEmit?.({type:'back'}),forward:()=>{},prefetch:()=>{},refresh:()=>{}});
export const usePathname=()=>useSyncExternalStore(fn=>window.__adminNav.subscribe(fn),()=>window.__adminNav.getPath());
let cachedQuery='',cachedParams=new URLSearchParams('');
export const useSearchParams=()=>{const query=useSyncExternalStore(fn=>window.__adminNav.subscribe(fn),()=>window.__adminNav.getQuery());if(query!==cachedQuery){cachedQuery=query;cachedParams=new URLSearchParams(query)}return cachedParams};
export const useParams=()=>({});
export const redirect=href=>{throw{__adminRedirect:String(href)}};
export const notFound=()=>{throw{__adminUnknown:'not-found'}};
export const useSelectedLayoutSegment=()=>null;
export const useSelectedLayoutSegments=()=>[];`;
const linkStub=`import React from'react';
export default function Link({href,children,...rest}){return <a href={typeof href==='string'?href:'#'}{...rest}>{children}</a>}`;
const imageStub=`import React from'react';
export default function Image({src,alt,width,height,fill,className,style,priority}){const base=fill?{position:'absolute',inset:0,width:'100%',height:'100%'}:{width:typeof width==='number'?width:undefined,height:typeof height==='number'?height:undefined};return <img src={typeof src==='string'?src:''} alt={alt||''} className={className} style={{...base,...style}}/>}`;

/* next/dynamic keeps the source's lazy boundary: esbuild inlines the imported module in an
   iife bundle, so the stub resolves it on first mount and shows the source loading fallback. */
const dynamicStub=`import React from'react';
export default function dynamic(loader,opts){return function DynamicBoundary(props){const[Component,setComponent]=React.useState(null);React.useEffect(()=>{let alive=true;Promise.resolve().then(loader).then(module=>{if(alive)setComponent(()=>module&&module.default||module)}).catch(()=>{});return()=>{alive=false}},[]);if(Component)return <Component {...props}/>;const fallback=opts&&opts.loading;return fallback?React.createElement(fallback):null}}`;
const scriptStub=`import React from'react';export default function Script(){return null}`;

const sentryStub=`const noop=()=>{};const scope={setTag:noop,setContext:noop,setLevel:noop,setUser:noop,setExtra:noop};
export const captureException=noop;export const captureMessage=noop;export const captureEvent=noop;export const addBreadcrumb=noop;export const setUser=noop;export const setTag=noop;export const setContext=noop;export const setExtra=noop;export const setLevel=noop;export const configureScope=noop;export const withScope=fn=>fn(scope);export const init=noop;export const flush=async()=>true;export const close=async()=>true;export const startSpan=(opts,fn)=>typeof fn==='function'?fn():undefined;export const startInactiveSpan=()=>({end:noop});export const getCurrentScope=()=>scope;export default{captureException:noop,captureMessage:noop,init:noop};`;
const authProviderStub=`import React from'react';
export const useAuth=()=>({profile:null,user:window.__ADMIN_SESSION__?.user||null,loading:false,session:null});
export const SupabaseAuthProvider=({children})=><>{children}</>;export default SupabaseAuthProvider;`;

const stubs={
  prisma:{match:/^@\/lib\/prisma$/,loader:'ts',contents:prismaStub},
  auth:{match:/^@\/lib\/auth$/,loader:'ts',contents:authStub},
  tenant:{match:/^@\/lib\/tenant$/,loader:'ts',contents:tenantStub},
  authUser:{match:/^@\/lib\/get-authenticated-user$/,loader:'ts',contents:authUserStub},
  rbac:{match:/^@\/lib\/rbac\/authorization$/,loader:'ts',contents:rbacStub},
  api:{match:/^@\/lib\/api-fetch$/,loader:'ts',contents:apiStub},
  toast:{match:/^react-hot-toast$/,loader:'ts',contents:toastStub},
  store:{match:/^@\/lib\/store$/,loader:'jsx',contents:storeStub},
  supabase:{match:/^@\/lib\/supabase\/client$/,loader:'ts',contents:supabaseStub},
  sidebarStore:{match:/^@\/lib\/desktop-sidebar-store$/,loader:'ts',contents:sidebarStoreStub},
  appRouter:{match:/^@\/hooks\/useAppRouter$/,loader:'ts',contents:appRouterStub},
  navigation:{match:/^next\/navigation$/,loader:'jsx',contents:navStub},
  link:{match:/^(next\/link|@\/components\/system\/AppLink)$/,loader:'jsx',contents:linkStub},
  image:{match:/^next\/image$/,loader:'jsx',contents:imageStub},
  dynamic:{match:/^next\/dynamic$/,loader:'jsx',contents:dynamicStub},
  script:{match:/^next\/script$/,loader:'jsx',contents:scriptStub},
  sentry:{match:/^@sentry\/nextjs$/,loader:'ts',contents:sentryStub},
  authProvider:{match:/^@\/components\/providers\/SupabaseAuthProvider$/,loader:'jsx',contents:authProviderStub},
};

const result=await req('esbuild').build({stdin:{contents:fs.readFileSync(root+'/scripts/admin-entry.jsx','utf8'),loader:'jsx',resolveDir:website},tsconfig:website+'/tsconfig.json',bundle:true,jsx:'automatic',format:'iife',minify:true,write:false,define:{'process.env.NODE_ENV':'"production"','process.env':'{}'},plugins:[{name:'offline-admin',setup(b){
  for(const[key,stub]of Object.entries(stubs)){
    b.onResolve({filter:stub.match},()=>({path:key,namespace:'admin-stub'}));
  }
  b.onLoad({filter:/.*/,namespace:'admin-stub'},args=>{const stub=stubs[args.path];return{loader:stub.loader,resolveDir:website,contents:stub.contents}});
}}]});

let fonts='';for(const[weight,suffix]of[[400,'Regular'],[700,'Bold']])fonts+=`@font-face{font-family:Cairo;src:url(data:font/ttf;base64,${fs.readFileSync(path.join(root,'node_modules/@expo-google-fonts/cairo',weight+suffix,`Cairo_${weight}${suffix}.ttf`)).toString('base64')});font-weight:${weight};font-display:swap}`;
const css=websiteCSS(website);
/* Scrollbar-hiding rule copied literally from the admin group layout; the layout ships it
   inline so it must apply at every width below md in the frame too. */
const layoutStyle=`@media (max-width: 767px){
  html::-webkit-scrollbar, body::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
  html, body { -ms-overflow-style: none !important; scrollbar-width: none !important; }
  *::-webkit-scrollbar { display: none !important; }
  * { -ms-overflow-style: none; scrollbar-width: none; }
}`;
/* The site's own logo, inlined so the relative /medonex-logo-new.svg references in the
   chrome resolve identically inside the local frame (CSP allows data: images). */
const logoUri='data:image/svg+xml;base64,'+fs.readFileSync(website+'/public/medonex-logo-new.svg').toString('base64');
const bundleJs=result.outputFiles[0].text.replaceAll('/medonex-logo-new.svg',logoUri).replaceAll('</script','<\\/script');
const html=`<!doctype html><html class="medonex-font-variables"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; font-src data:; connect-src 'none'; img-src https: data:; frame-src 'none'; media-src https:; form-action 'none'; base-uri 'none'"><style>${fonts}${css}${layoutStyle}html,body,#root{margin:0;min-height:100%}body{background:hsl(var(--background));font-family:Arial,sans-serif;letter-spacing:-.15px}html[dir=rtl] body{font-family:Cairo,Arial,sans-serif}</style></head><body><div id="root"></div><script>${bundleJs}</script></body></html>`;
fs.writeFileSync(root+'/assets/admin-app.html',html);
console.log('Actual source admin console bytes:',Buffer.byteLength(html));
