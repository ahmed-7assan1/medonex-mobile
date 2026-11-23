import React,{useEffect,useState}from'react';
import{createRoot}from'react-dom/client';
import PostCard from'@/components/community-mobile/PostCard';
import{useCommunityStore}from'@/components/community-mobile/store';

const scope=new URLSearchParams(location.hash.slice(1)).get('scope')||'';
export const emit=data=>{
  const message={...data,scope};
  if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify(message));
  else window.parent.postMessage(message,'*');
};
window.__communityEmit=emit;
window.__communityGuard=(method,path)=>emit({type:'guard',method:String(method||''),path:String(path||'').slice(0,200)});

/* Network isolation: card data arrives in the render payload; nothing is fetched here. */
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

const validPost=post=>post&&typeof post.id==='string'&&post.id.length<=200&&typeof post.content==='string'&&post.content.length<=20000&&Array.isArray(post.attachments)&&Array.isArray(post.hashtags);

function App(){
  const[data,setData]=useState(null);
  useEffect(()=>{
    window.renderCommunityCards=payload=>{
      if(payload?.scope!==scope)return;
      const posts=Array.isArray(payload.posts)?payload.posts.filter(validPost).slice(0,12):[];
      if(!posts.length)return;
      window.__COMMUNITY_DARK__=!!payload.dark;
      window.__COMMUNITY_ORIGIN__=typeof payload.origin==='string'&&/^https:\/\//.test(payload.origin)?payload.origin:'https://www.medonex.me';
      document.documentElement.className='medonex-font-variables '+(payload.dark?'dark':'');
      document.documentElement.dir=payload.direction==='rtl'?'rtl':'ltr';
      useCommunityStore.setState({posts});
      setData({posts});
    };
    const accept=event=>{if(event.source===window.parent&&event.data?.type==='render')window.renderCommunityCards(event.data)};
    window.addEventListener('message',accept);
    emit({type:'ready'});
    const observer=new ResizeObserver(()=>{const height=Math.ceil(document.documentElement.scrollHeight);if(height>0&&height<4000)emit({type:'height',height})});
    observer.observe(document.body);
    return()=>{window.removeEventListener('message',accept);observer.disconnect()};
  },[]);
  if(!data)return null;
  /* Source marquee block from dashboard/CommunityPostsCarousel.tsx, copied literally. */
  const posts=data.posts;
  return(
    <div className="mt-4 [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)] overflow-hidden py-4">
      <div className="flex gap-4 w-max animate-marquee hover:[animation-play-state:paused]">
        {[...posts,...posts].map((post,idx)=>(
          <div key={`${post.id}-${idx}`} className="w-[380px] shrink-0">
            <PostCard post={post} currentUserId={post.author?.id||''}/>
          </div>
        ))}
      </div>
    </div>
  );
}
createRoot(document.getElementById('root')).render(<App/>);
