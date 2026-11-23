import React,{useEffect,useState,Suspense}from'react';
import{createRoot}from'react-dom/client';
import{SiteConfigProvider}from'@/contexts/SiteConfigContext';
import{ConfirmProvider}from'@/contexts/ConfirmContext';
import{AdminMobileNav}from'@/components/admin/AdminMobileNav';
import{AdminMobilePills}from'@/components/admin/AdminMobilePills';
import{AdminSidebarNav}from'@/components/admin/AdminSidebarNav';
import{AdminSwipeLayout}from'@/components/admin/AdminSwipeLayout';
import{AdminBottomFade}from'@/components/admin/ui/AdminBottomFade';
import{DesktopTopBar}from'@/components/dashboard/DesktopTopBar';

import DashboardPage from'@/app/(admin)/admin/dashboard/page';
import FoundersPage from'@/app/(admin)/admin/founders/page';
import OgCardPage from'@/app/(admin)/admin/og-card/page';
import ReportsPage from'@/app/(admin)/admin/questions/reports/page';
import TeamsPage from'@/app/(admin)/admin/teams/page';
import TelegramPage from'@/app/(admin)/admin/telegram/page';
import TestimonialsPage from'@/app/(admin)/admin/testimonials/page';
import UsersPage from'@/app/(admin)/admin/users/page';
import UserProfilePage from'@/app/(admin)/admin/users/[id]/page';

import AdminMonitoringPage from'@/app/(admin)/admin/admin-monitoring/page';
import AdsPage from'@/app/(admin)/admin/ads/page';
import AiKeysPage from'@/app/(admin)/admin/ai-keys/page';
import AiStudioPage from'@/app/(admin)/admin/ai-studio/page';
import AtlasPage from'@/app/(admin)/admin/atlas/page';
import AuditLogsPage from'@/app/(admin)/admin/audit-logs/page';
import ChannelsPage from'@/app/(admin)/admin/channels/page';
import ContentPage from'@/app/(admin)/admin/content/page';
import ContentBrowserPage from'@/app/(admin)/admin/content-browser/page';
import ForumPage from'@/app/(admin)/admin/forum/page';
import LeaderboardPage from'@/app/(admin)/admin/leaderboard/page';
import PdfToolsPage from'@/app/(admin)/admin/pdf-tools/page';
import QuestionsPage from'@/app/(admin)/admin/questions/page';
import QuizAnalyticsPage from'@/app/(admin)/admin/quiz-analytics/page';
import QuizCreatorPage from'@/app/(admin)/admin/quiz-creator/page';
import QuizManagerPage from'@/app/(admin)/admin/quiz-manager/page';
import SecurityPage from'@/app/(admin)/admin/security/page';
import SettingsPage from'@/app/(admin)/admin/settings/page';
import SocialReportsPage from'@/app/(admin)/admin/social-reports/page';
import VideoAnalyticsPage from'@/app/(admin)/admin/video-analytics/page';
import WarningsPage from'@/app/(admin)/admin/warnings/page';
import StudioSyncPage from'@/app/(admin)/studio/sync/page';

const scope=new URLSearchParams(location.hash.slice(1)).get('scope')||'';
const emit=data=>{
  const message={...data,scope};
  if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify(message));
  else window.parent.postMessage(message,'*');
};
window.__adminEmit=emit;
window.__adminGuard=(method,path)=>emit({type:'guard',method:String(method||'').slice(0,10),path:String(path||'').slice(0,200)});

/* In-memory localStorage when the host blocks it (native WebView). */
try{localStorage.getItem('__admin_probe')}catch{
  const mem=new Map();
  Object.defineProperty(window,'localStorage',{value:{getItem:k=>mem.has(k)?mem.get(k):null,setItem:(k,v)=>mem.set(k,String(v)),removeItem:k=>mem.delete(k),clear:()=>mem.clear(),key:()=>null,get length(){return mem.size}}});
}

/* Route store shared by the next/navigation stubs and this shell. */
let currentPath='/admin/dashboard',currentQuery='';
const navListeners=new Set();
const notifyNav=()=>navListeners.forEach(fn=>fn());
window.__adminNav={
  getPath:()=>currentPath,
  getQuery:()=>currentQuery,
  getHref:()=>currentPath+(currentQuery?'?'+currentQuery:''),
  subscribe:fn=>{navListeners.add(fn);return()=>navListeners.delete(fn)},
  /* silent=true: native pushed this route to us; do not echo it back. */
  navigate:(href,opts={})=>{
    if(typeof href!=='string'||!href||href.length>500)return;
    const[rawPath,rawQuery]=href.split('?');
    const path=rawPath.startsWith('/')?rawPath:'/'+rawPath;
    const query=(rawQuery||'').slice(0,300);
    if(path===currentPath&&query===currentQuery)return;
    currentPath=path;currentQuery=query;
    if(!opts.silent)emit({type:'navigate',href:window.__adminNav.getHref(),replace:!!opts.replace});
    notifyNav();
  },
};

/* Bridged fetch: GETs are answered by the native side (read-only); every
   other method is guarded and never leaves the device. */
const pending=new Map();let fetchId=0;
window.__adminFetchResult=msg=>{const resolve=pending.get(msg&&msg.id);if(resolve){pending.delete(msg.id);resolve(msg)}};
const guardedBody=JSON.stringify({error:'Read-only preview. Nothing was sent.'});
window.fetch=(input,init)=>{
  const url=String(typeof input==='string'?input:input&&input.url||'');
  const method=String(init&&init.method||'GET').toUpperCase();
  if(method!=='GET'&&method!=='HEAD'&&method!=='OPTIONS'){
    window.__adminGuard(method,url);
    return Promise.resolve(new Response(guardedBody,{status:403,headers:{'Content-Type':'application/json'}}));
  }
  const id=++fetchId;
  return new Promise(resolve=>{
    pending.set(id,msg=>{
      const body=typeof msg.body==='string'?msg.body:JSON.stringify(msg.body==null?{}:msg.body);
      resolve(new Response(body,{status:typeof msg.status==='number'?msg.status:200,headers:{'Content-Type':'application/json'}}));
    });
    emit({type:'fetch-get',id,path:url.slice(0,500)});
    setTimeout(()=>{if(pending.has(id)){pending.delete(id);resolve(new Response(JSON.stringify({error:'The request timed out.'}),{status:504,headers:{'Content-Type':'application/json'}}))}},12000);
  });
};
window.XMLHttpRequest=function(){throw Error('Network disabled')};
window.WebSocket=function(){throw Error('Network disabled')};
window.open=url=>{if(typeof url==='string'&&/^https:\/\//.test(url)&&url.length<=2000)emit({type:'open-url',url});return null};
try{Object.defineProperty(navigator,'clipboard',{value:{writeText:text=>{emit({type:'copy',text:String(text).slice(0,2000)});return Promise.resolve()}},configurable:true})}catch{}

/* Anchor routing: admin links navigate inside this shell, every other app
   link goes to the native router, external links open natively. */
document.addEventListener('click',event=>{
  const node=event.target&&event.target.closest?event.target.closest('a'):null;
  if(!node)return;
  const href=node.getAttribute('href');
  if(!href||href==='#')return;
  event.preventDefault();event.stopPropagation();
  if(/^https:\/\//.test(href)){if(href.length<=2000)emit({type:'open-url',url:href});return}
  if(href.startsWith('/admin')||href.startsWith('/studio'))window.__adminNav.navigate(href);
  else if(href.startsWith('/')&&href.length<=500)emit({type:'navigate',href,replace:false});
},true);
window.addEventListener('error',()=>emit({type:'error'}));

const SERVER_PAGES={
  '/admin/dashboard':DashboardPage,
  '/admin/founders':FoundersPage,
  '/admin/og-card':OgCardPage,
  '/admin/questions/reports':ReportsPage,
  '/admin/teams':TeamsPage,
  '/admin/telegram':TelegramPage,
  '/admin/testimonials':TestimonialsPage,
  '/admin/users':UsersPage,
};
const CLIENT_PAGES={
  '/admin/admin-monitoring':AdminMonitoringPage,
  '/admin/ads':AdsPage,
  '/admin/ai-keys':AiKeysPage,
  '/admin/ai-studio':AiStudioPage,
  '/admin/atlas':AtlasPage,
  '/admin/audit-logs':AuditLogsPage,
  '/admin/channels':ChannelsPage,
  '/admin/content':ContentPage,
  '/admin/content-browser':ContentBrowserPage,
  '/admin/forum':ForumPage,
  '/admin/leaderboard':LeaderboardPage,
  '/admin/pdf-tools':PdfToolsPage,
  '/admin/questions':QuestionsPage,
  '/admin/quiz-analytics':QuizAnalyticsPage,
  '/admin/quiz-creator':QuizCreatorPage,
  '/admin/quiz-manager':QuizManagerPage,
  '/admin/security':SecurityPage,
  '/admin/settings':SettingsPage,
  '/admin/social-reports':SocialReportsPage,
  '/admin/video-analytics':VideoAnalyticsPage,
  '/admin/warnings':WarningsPage,
  '/studio/sync':StudioSyncPage,
};

async function resolveRoute(route){
  const[path,query]=String(route||'').split('?');
  const searchParams=Object.fromEntries(new URLSearchParams(query||''));
  if(path==='/admin'||path==='/admin/')throw{__adminRedirect:'/admin/dashboard'};
  const userMatch=path.match(/^\/admin\/users\/([^/]{1,100})$/);
  if(userMatch)return await UserProfilePage({params:{id:userMatch[1]},searchParams});
  const Server=SERVER_PAGES[path];
  if(Server)return await Server({params:{},searchParams});
  const Client=CLIENT_PAGES[path];
  if(Client)return <Client/>;
  throw{__adminUnknown:path};
}

/* Mirrors the admin group's error.tsx role: one crashing page must not take the shell down. */
class AdminErrorBoundary extends React.Component{
  constructor(props){super(props);this.state={failed:false}}
  static getDerivedStateFromError(){return{failed:true}}
  componentDidCatch(error){emit({type:'page-error',route:window.__adminNav.getHref().slice(0,200),message:String(error&&error.message||error).slice(0,300)+(error&&error.stack?(' | '+String(error.stack).replace(/\s+/g,' ').slice(0,600)):'')})}
  componentDidUpdate(prev){if(prev.routeKey!==this.props.routeKey&&this.state.failed)this.setState({failed:false})}
  render(){return this.state.failed?<p className="py-16 text-center text-sm text-muted-foreground">This admin page could not be rendered on this device.</p>:this.props.children}
}

function App(){
  const[config,setConfig]=useState(null);
  const[route,setRoute]=useState('');
  const[element,setElement]=useState(null);
  const[failed,setFailed]=useState('');

  useEffect(()=>{
    window.renderAdmin=payload=>{
      if(!payload||payload.scope!==scope)return;
      const user=payload.user&&typeof payload.user.id==='string'?payload.user:null;
      if(!user)return;
      const role=String(user.role||'ADMIN').slice(0,40);
      window.__ADMIN_SESSION__={user:{id:user.id.slice(0,100),email:String(user.email||'').slice(0,200),name:String(user.name||'Admin').slice(0,200),image:typeof user.image==='string'?user.image.slice(0,500):null,role,user_metadata:{role}}};
      window.__ADMIN_USER__=window.__ADMIN_SESSION__.user;
      window.__ADMIN_SCOPE__=payload.adminScope&&typeof payload.adminScope==='object'?payload.adminScope:{role:window.__ADMIN_USER__.role,universityId:null,facultyId:null};
      window.__ADMIN_DATA__=payload.data&&typeof payload.data==='object'?payload.data:{};
      window.__ADMIN_DARK__=!!payload.dark;
      document.documentElement.className='medonex-font-variables '+(payload.dark?'dark':'');
      document.documentElement.dataset.theme=payload.dark?'dark':'light';
      document.documentElement.dir=payload.direction==='rtl'?'rtl':'ltr';
      const siteName=String(payload.siteName||'MedOneX').slice(0,60);
      setConfig({siteName,logoUrl:typeof payload.logoUrl==='string'?payload.logoUrl.slice(0,500):null,user:window.__ADMIN_USER__,scope:window.__ADMIN_SCOPE__});
      const next=String(payload.route||'/admin/dashboard').slice(0,300);
      if(next!==window.__adminNav.getHref())window.__adminNav.navigate(next,{silent:true});
      else setRoute(next);
    };
    const off=window.__adminNav.subscribe(()=>setRoute(window.__adminNav.getHref()));
    const accept=event=>{if(event.source===window.parent&&event.data&&event.data.type==='render')window.renderAdmin(event.data)};
    window.addEventListener('message',accept);
    emit({type:'ready'});
    return()=>{window.removeEventListener('message',accept);off()};
  },[]);

  useEffect(()=>{
    if(!route||!config)return;
    let alive=true;
    setFailed('');
    (async()=>{
      try{
        const resolved=await resolveRoute(route);
        if(alive)setElement(resolved);
      }catch(error){
        if(error&&error.__adminRedirect){window.__adminNav.navigate(error.__adminRedirect,{replace:true});return}
        if(error&&error.__adminUnknown){if(alive){setElement(null);setFailed('unknown')}return}
        emit({type:'page-error',route:route.slice(0,200)});
        if(alive){setElement(null);setFailed('error')}
      }
    })();
    return()=>{alive=false};
  },[route,config]);

  if(!config)return null;
  const role=config.scope&&config.scope.role||config.user.role;
  const isSuperAdmin=role==='SUPER_ADMIN';
  const isFacultyLeader=role==='FACULTY_LEADER';
  const hubBadge=isSuperAdmin?'Platform':isFacultyLeader?'Faculty':'Doctor';
  const userName=config.user.name||'Admin';

  /* Chrome copied literally from src/app/(admin)/layout.tsx (PuterScript and the
     temporarily disabled user hero omitted; the layout source has them disabled/absent). */
  return(
    <SiteConfigProvider initial={{siteName:config.siteName,logoUrl:config.logoUrl}}>
    <ConfirmProvider>
      <div className="min-h-dvh overflow-x-clip font-sans antialiased scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{backgroundColor:'hsl(var(--background))',color:'var(--adm-txt-0)'}}>
        <AdminMobileNav siteName={config.siteName} hubBadge={hubBadge} isSuperAdmin={isSuperAdmin} isFacultyLeader={isFacultyLeader}/>
        <div className="hidden md:block sticky top-0 z-50 w-full bg-background/90 backdrop-blur-2xl backdrop-saturate-200 border-b border-border/30 supports-[backdrop-filter]:bg-background/80 will-change-transform pt-[env(safe-area-inset-top,0px)]" style={{contain:'paint',transform:'translateZ(0)',backfaceVisibility:'hidden'}}>
          <div className="w-full h-[56px] flex items-center pl-2 sm:pl-4 lg:pl-6 pr-4 sm:pr-6 lg:pr-8">
            <DesktopTopBar
              firstName={userName.split(' ')[0]||'Admin'}
              fullName={userName}
              email={config.user.email}
              userImage={config.user.image}
              adminMode
              isSuperAdmin={isSuperAdmin}
            />
          </div>
        </div>
        <div className="h-[var(--adm-topbar-h,calc(56px+env(safe-area-inset-top,0px)))] shrink-0 md:hidden" aria-hidden/>
        <AdminMobilePills isSuperAdmin={isSuperAdmin} isFacultyLeader={isFacultyLeader}/>
        <AdminBottomFade/>
        <AdminSwipeLayout isSuperAdmin={isSuperAdmin} isFacultyLeader={isFacultyLeader}>
          <div className="mx-auto flex w-full max-w-[1600px] items-start gap-6 px-4 md:px-6 lg:gap-8">
            <aside className="sticky top-[72px] hidden h-[calc(100dvh-88px)] w-60 shrink-0 flex-col overflow-y-auto border-e border-border/50 py-6 pe-4 md:flex">
              <div className="mb-5 px-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Workspace</p>
                <p className="mt-1 text-sm font-semibold text-foreground">Admin console</p>
              </div>
              <nav aria-label="Admin navigation" className="min-h-0 flex-1">
                <AdminSidebarNav isSuperAdmin={isSuperAdmin} isFacultyLeader={isFacultyLeader} desktop/>
              </nav>
            </aside>
            <main className="mx-auto w-full min-w-0 flex-1 max-w-none pb-24 md:pb-12">
              <Suspense fallback={null}>
                {failed==='error'?<p className="py-16 text-center text-sm text-muted-foreground">This admin page could not be rendered on this device.</p>:<AdminErrorBoundary routeKey={route}>{element}</AdminErrorBoundary>}
              </Suspense>
            </main>
          </div>
        </AdminSwipeLayout>
      </div>
    </ConfirmProvider>
    </SiteConfigProvider>
  );
}
createRoot(document.getElementById('root')).render(<App/>);
