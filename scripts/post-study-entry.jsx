import React from'react';import{createRoot}from'react-dom/client';import{PostContentSheet}from'@/components/community-mobile/PostContentSheet';
const root=createRoot(document.getElementById('root'));const scope=decodeURIComponent(location.hash.replace(/^#scope=/,''));let active=false;
const send=data=>{const message={...data,scope};if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify(message));else window.parent.postMessage(message,'*')};
window.fetch=()=>Promise.reject(Error('Network disabled in the study sheet'));window.XMLHttpRequest=function(){throw Error('Network disabled in the study sheet')};window.WebSocket=function(){throw Error('Network disabled in the study sheet')};window.open=()=>null;
document.addEventListener('click',event=>{const link=event.target.closest?.('a');if(!link)return;event.preventDefault();event.stopPropagation();send({type:'link',url:link.getAttribute('href')??''})},true);
function render(data){if(!data||data.scope!==scope||!data.study)return;active=true;document.documentElement.className='medonex-font-variables '+(data.theme==='dark'?'dark':'');document.documentElement.dir=data.direction==='rtl'?'rtl':'ltr';root.render(<PostContentSheet open onOpenChange={open=>{if(!open){active=false;send({type:'close'})}}} {...data.study}/>)}
window.__studyGuard=()=>send({type:'guard'});
window.renderStudyProps=render;window.addEventListener('message',event=>{if(event.source===window.parent&&event.data?.type==='render')render(event.data)});window.addEventListener('error',()=>{if(active)send({type:'error'})});send({type:'ready'});
