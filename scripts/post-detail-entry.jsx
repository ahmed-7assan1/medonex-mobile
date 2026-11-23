import React,{useEffect,useState}from'react';
import{createRoot}from'react-dom/client';
import{PostDetailModal}from'@/components/forum/PostDetailModal';

const scope=new URLSearchParams(location.hash.slice(1)).get('scope')||'';
export const emit=data=>{
  const message={...data,scope};
  if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify(message));
  else window.parent.postMessage(message,'*');
};
window.__postDetailEmit=emit;
window.__postDetailGuard=(method,path)=>emit({type:'guard',method:String(method||''),path:String(path||'').slice(0,200)});

/* Network isolation: every read goes through the native bridge, writes are guarded. */
window.fetch=()=>Promise.reject(Error('Network disabled'));
window.XMLHttpRequest=function(){throw Error('Network disabled')};
window.WebSocket=function(){throw Error('Network disabled')};
window.open=url=>{if(typeof url==='string'&&/^https:\/\//.test(url)&&url.length<=2000)emit({type:'open-url',url});return null};
try{Object.defineProperty(navigator,'clipboard',{value:{writeText:text=>{emit({type:'copy',text:String(text).slice(0,2000)});return Promise.resolve()}},configurable:true})}catch{}

document.addEventListener('click',event=>{
  const node=event.target.closest?.('a');
  if(node){event.preventDefault();event.stopPropagation();const href=node.getAttribute('href');if(href&&href.length<=2000)emit({type:'link',href})}
},true);
window.addEventListener('error',()=>emit({type:'error'}));

function App(){
  const[data,setData]=useState(null);
  useEffect(()=>{
    window.renderPostDetail=payload=>{
      if(payload?.scope!==scope)return;
      const post=payload.post;
      if(!post||typeof post.id!=='string'||!post.id||post.id.length>200)return;
      if(typeof post.content!=='string'||post.content.length>20000)return;
      if(!Array.isArray(post.hashtags)||!Array.isArray(post.attachments)||!Array.isArray(post.reactions))return;
      window.__POST_DETAIL_DARK__=!!payload.dark;
      window.__POST_DETAIL_ORIGIN__=typeof payload.origin==='string'&&/^https:\/\//.test(payload.origin)?payload.origin:'https://www.medonex.me';
      document.documentElement.className='medonex-font-variables '+(payload.dark?'dark':'');
      document.documentElement.dir=payload.direction==='rtl'?'rtl':'ltr';
      setData(payload);
    };
    const accept=event=>{
      if(event.source!==window.parent)return;
      const message=event.data;
      if(message?.type==='render')window.renderPostDetail(message);
      else if(message?.type==='api-response'&&message.scope===scope)window.__postDetailApiResolve?.(message.id,message);
      else if(message?.type==='yt-title-response'&&message.scope===scope)window.__postDetailYtResolve?.(message.key,message.title);
    };
    window.addEventListener('message',accept);
    emit({type:'ready'});
    return()=>window.removeEventListener('message',accept);
  },[]);
  if(!data)return null;
  const user=data.user&&typeof data.user==='object'?data.user:{};
  return <PostDetailModal
    post={data.post}
    currentUserId={typeof user.id==='string'?user.id:undefined}
    currentUserRole={typeof user.role==='string'?user.role:undefined}
    currentUserUniversityId={typeof user.universityId==='string'?user.universityId:undefined}
    isOpen
    onClose={()=>emit({type:'close'})}
    initialTab={data.initialTab==='comments'?'comments':'post'}
  />;
}
createRoot(document.getElementById('root')).render(<App/>);
