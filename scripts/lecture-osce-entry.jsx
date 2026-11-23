import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Toaster} from 'react-hot-toast';
import {LectureClient} from '__LECTURE_OSCE__';
const scope=new URLSearchParams(location.hash.slice(1)).get('scope')||'';
const emit=data=>{const message={...data,scope};if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify(message));else parent.postMessage(message,'*')};
window.__osceEmit=emit;
window.addEventListener('error',()=>emit({type:'error'}));
function App(){
 const[config,setConfig]=useState(null);
 useEffect(()=>{
  let playing=false;
  const onPlay=()=>{if(!playing){playing=true;emit({type:'playing'})}};
  const pause=()=>{playing=false;document.querySelectorAll('video,audio,media-player').forEach(node=>{try{node.pause?.()}catch{}});document.querySelectorAll('iframe').forEach(frame=>{try{const url=new URL(frame.src);if(['https://www.youtube.com','https://www.youtube-nocookie.com'].includes(url.origin))frame.contentWindow?.postMessage(JSON.stringify({event:'command',func:'pauseVideo',args:[]}),url.origin)}catch{}})};
  const onPause=()=>{playing=false};
  window.pauseOsceMedia=owner=>{if(owner===scope)pause()};
  window.renderOsceProps=data=>{
   if(!data||data.scope!==scope)return;
   if(!Array.isArray(data.questions)||!data.questions.length||data.questions.length>5000||!Number.isFinite(data.width)||data.width<1||data.width>4096){emit({type:'error'});return}
   document.documentElement.classList.toggle('dark',!!data.dark);
   document.documentElement.dataset.theme=data.dark?'dark':'light';
   document.documentElement.dir=data.direction==='rtl'?'rtl':'ltr';
   document.body.className='lecture-mobile';
   document.body.style.width=data.width+'px';
   document.documentElement.style.setProperty('--osce-viewport-height',Math.max(1,Math.min(10000,Number(data.viewportHeight)||844))+'px');
   setConfig(data);
  };
  const receive=event=>{
   if(event.source===parent){if(event.data?.type==='render')window.renderOsceProps(event.data);if(event.data?.type==='pause'&&event.data.scope===scope)pause();return}
   if(!['https://www.youtube.com','https://www.youtube-nocookie.com'].includes(event.origin)||!Array.from(document.querySelectorAll('iframe')).some(frame=>frame.contentWindow===event.source))return;
   try{const data=typeof event.data==='string'?JSON.parse(event.data):event.data;const state=data?.event==='onStateChange'?data.info:data?.event==='infoDelivery'?data.info?.playerState:undefined;if(state===1)onPlay();else if(typeof state==='number')playing=false}catch{}
  };
  const observer=new ResizeObserver(()=>emit({type:'height',height:document.getElementById('root').getBoundingClientRect().height}));
  observer.observe(document.getElementById('root'));
  addEventListener('message',receive);document.addEventListener('play',onPlay,true);document.addEventListener('pause',onPause,true);emit({type:'ready'});
  return()=>{observer.disconnect();removeEventListener('message',receive);document.removeEventListener('play',onPlay,true);document.removeEventListener('pause',onPause,true);pause()};
 },[]);
 return config?<><LectureClient key={config.lectureId} flashcards={[]} questions={config.questions} mode="osce"/><Toaster/></>:null;
}
document.addEventListener('click',event=>{const anchor=event.target instanceof Element?event.target.closest('a[href]'):null;if(!anchor)return;event.preventDefault();try{const url=new URL(anchor.href);if(url.protocol==='https:')emit({type:'link',url:url.href})}catch{}},true);
createRoot(document.getElementById('root')).render(<App/>);
