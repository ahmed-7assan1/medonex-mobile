import React,{Suspense} from 'react';
import{createRoot}from'react-dom/client';
import{DrawMedClient}from'__DRAW_CLIENT__';
const native=Boolean(window.ReactNativeWebView);const emit=data=>window.ReactNativeWebView?.postMessage(JSON.stringify({...data,scope:new URLSearchParams(location.hash.slice(1)).get('scope')||'guest'}));
const rootFetch=window.fetch.bind(window);window.fetch=(input,...options)=>/^https?:\/\//.test(typeof input==='string'?input:input.url||'')?Promise.reject(new Error('The online shape library is unavailable in this offline workspace. Browse shape libraries on the website. Drawing and export stay available here.')):rootFetch(input,...options);
if(native){const original=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(this.download&&this.href.startsWith('blob:')){fetch(this.href).then(r=>r.blob()).then(blob=>{const reader=new FileReader();reader.onload=()=>emit({type:'export',name:this.download||'DrawMed.png',dataUrl:reader.result});reader.readAsDataURL(blob)});return}return original.call(this)}}
createRoot(document.getElementById('root')).render(<Suspense fallback={<div>Loading DrawMed…</div>}><DrawMedClient/></Suspense>);
