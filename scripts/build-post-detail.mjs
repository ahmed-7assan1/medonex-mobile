import{websiteCSS}from'./website-css.mjs';
import fs from'node:fs';import path from'node:path';import{createRequire}from'node:module';import{fileURLToPath}from'node:url';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url))),website=path.resolve(process.argv[2]||'../medqs-mobile-auth'),req=createRequire(website+'/package.json');

/** Bridged read-only apiFetch: GET comments/mention-search through native, every write guarded. */
const apiStub=`let __apiSeq=0;const __apiPending=new Map();
window.__postDetailApiResolve=(id,payload)=>{const resolve=__apiPending.get(id);__apiPending.delete(id);if(resolve)resolve({ok:!!payload?.ok,status:typeof payload?.status==='number'?payload.status:payload?.ok?200:500,json:async()=>payload?.body})};
export function apiFetch(path,options){
  const method=String(options?.method||'GET').toUpperCase(),url=String(path||'');
  if(method==='GET'&&/^\\/api\\/v1\\/(posts\\/[A-Za-z0-9_-]{1,100}\\/comments|mentions\\/search\\?q=[^&\\s]{0,200})$/.test(url)){
    const id=++__apiSeq;window.__postDetailEmit?.({type:'api',id,path:url});
    return new Promise(resolve=>__apiPending.set(id,resolve));
  }
  window.__postDetailGuard?.(method,url);
  return Promise.resolve({ok:false,status:403,json:async()=>({error:'Read-only preview. Nothing was sent.'})});
}`;
const toastStub=`export default{error:m=>window.__postDetailEmit?.({type:'toast',kind:'error',message:String(m||'').slice(0,300)}),success:m=>window.__postDetailEmit?.({type:'toast',kind:'success',message:String(m||'').slice(0,300)})}`;
const imageStub=`import React from'react';export default function Image({src,alt,width,height,fill,className,style}){const base=fill?{position:'absolute',inset:0,width:'100%',height:'100%'}:{width:typeof width==='number'?width:undefined,height:typeof height==='number'?height:undefined};return <img src={src} alt={alt||''} className={className} style={{...base,...style}}/>}`;
const linkStub=`import React from'react';export default function Link({href,children,...rest}){return <a href={typeof href==='string'?href:'#'} {...rest}>{children}</a>}`;
const dynamicStub=`export default function dynamic(){return()=>null}`;
const playerStub=`import React from'react';export default function ReactPlayer(){return null}`;
const storeStub=`export const useThemeStore=()=>({theme:window.__POST_DETAIL_DARK__?'dark':'light'})`;
const uploadStub=`export const uploadFileDirect=async()=>{window.__postDetailGuard?.('POST','/api/v1/upload');throw Error('Read-only preview')}`;
const voiceStub=`import React from'react';export function VoiceRecorder({onCancel}){React.useEffect(()=>{window.__postDetailGuard?.('POST','voice-comment');onCancel?.()},[]);return null}`;
const videoStub=`import React from'react';export function ProfessionalVideoPlayer({src,poster,className,playing,muted}){return <div className={className}><video src={src} poster={poster} controls playsInline autoPlay={!!playing} muted={!!muted} preload="metadata" style={{width:'100%',height:'100%'}}/></div>}`;
const youtubeStub=`import React from'react';export default function YouTubePlayer({videoId}){React.useEffect(()=>{window.__postDetailEmit?.({type:'youtube',id:String(videoId||'')})},[videoId]);return <div style={{position:'absolute',inset:0,borderRadius:14,background:'#000'}}/>}`;
const ytTitleImpl=`export async function fetchYouTubeTitle(id){if(titleCache[id])return titleCache[id];const key=(++__ytSeq)+':'+id;window.__postDetailEmit?.({type:'yt-title',key,id});return new Promise(resolve=>{__ytPending.set(key,title=>{const safe=typeof title==='string'&&title?title:'Video';titleCache[id]=safe;resolve(safe)});setTimeout(()=>{if(__ytPending.has(key)){__ytPending.delete(key);titleCache[id]='Video';resolve('Video')}},12000)})}`;

const result=await req('esbuild').build({stdin:{contents:fs.readFileSync(root+'/scripts/post-detail-entry.jsx','utf8'),loader:'jsx',resolveDir:website},tsconfig:website+'/tsconfig.json',bundle:true,jsx:'automatic',format:'iife',minify:true,write:false,define:{'process.env.NODE_ENV':'"production"','process.env':'{}'},plugins:[{name:'offline-post-detail',setup(b){
  b.onResolve({filter:/^@\/lib\/api-fetch$/},()=>({path:'api',namespace:'post-detail'}));
  b.onResolve({filter:/^react-hot-toast$/},()=>({path:'toast',namespace:'post-detail'}));
  b.onResolve({filter:/^next\/image$/},()=>({path:'image',namespace:'post-detail'}));
  b.onResolve({filter:/^next\/link$/},()=>({path:'link',namespace:'post-detail'}));
  b.onResolve({filter:/^next\/dynamic$/},()=>({path:'dynamic',namespace:'post-detail'}));
  b.onResolve({filter:/^react-player$/},()=>({path:'player',namespace:'post-detail'}));
  b.onResolve({filter:/^@\/lib\/store$/},()=>({path:'store',namespace:'post-detail'}));
  b.onResolve({filter:/^@\/lib\/upload-client$/},()=>({path:'upload',namespace:'post-detail'}));
  b.onResolve({filter:/VoiceRecorder$/},()=>({path:'voice',namespace:'post-detail'}));
  b.onResolve({filter:/ProfessionalVideoPlayer$/},()=>({path:'video',namespace:'post-detail'}));
  b.onResolve({filter:/YouTubePlayer$/},()=>({path:'youtube',namespace:'post-detail'}));
  b.onLoad({filter:/.*/,namespace:'post-detail'},args=>{
    const contents=args.path==='api'?apiStub:args.path==='toast'?toastStub:args.path==='image'?imageStub:args.path==='link'?linkStub:args.path==='dynamic'?dynamicStub:args.path==='player'?playerStub:args.path==='store'?storeStub:args.path==='upload'?uploadStub:args.path==='voice'?voiceStub:args.path==='video'?videoStub:youtubeStub;
    return{loader:args.path==='api'||args.path==='toast'||args.path==='dynamic'||args.path==='store'||args.path==='upload'?'ts':'tsx',resolveDir:website,contents};
  });
  b.onLoad({filter:/PostDetailModal\.tsx$/},args=>{
    let code=fs.readFileSync(args.path,'utf8');
    if(!code.includes('window.location.origin'))throw Error('Source post detail share URL contract changed');
    code=code.replace('window.location.origin',"(window.__POST_DETAIL_ORIGIN__||'https://www.medonex.me')");
    return{contents:code,loader:'tsx',resolveDir:path.dirname(args.path)};
  });
  b.onLoad({filter:/video-utils\.ts$/},args=>{
    let code=fs.readFileSync(args.path,'utf8');
    const marker='export async function fetchYouTubeTitle(id: string): Promise<string> {';
    const at=code.indexOf(marker);
    if(at<0)throw Error('Source video-utils title contract changed');
    code=code.slice(0,at)+'let __ytSeq=0;const __ytPending=new Map();window.__postDetailYtResolve=(key,title)=>{const resolve=__ytPending.get(key);__ytPending.delete(key);if(resolve)resolve(title)};'+ytTitleImpl+'\n';
    return{contents:code,loader:'ts',resolveDir:path.dirname(args.path)};
  });
}}]});
let fonts='';for(const[weight,suffix]of[[400,'Regular'],[700,'Bold']])fonts+=`@font-face{font-family:Cairo;src:url(data:font/ttf;base64,${fs.readFileSync(path.join(root,'node_modules/@expo-google-fonts/cairo',weight+suffix,`Cairo_${weight}${suffix}.ttf`)).toString('base64')});font-weight:${weight};font-display:swap}`;
const css=websiteCSS(website);
const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; font-src data:; connect-src 'none'; img-src https: data:; frame-src 'none'; media-src https:; form-action 'none'; base-uri 'none'"><style>${fonts}${css}html,body,#root{margin:0;min-height:100%;background:transparent!important}body{font-family:Arial,sans-serif;letter-spacing:-.15px}html[dir=rtl] body{font-family:Cairo,Arial,sans-serif}</style></head><body><div id="root"></div><script>${result.outputFiles[0].text.replaceAll('</script','<\\/script')}</script></body></html>`;
fs.writeFileSync(root+'/assets/post-detail.html',html);
console.log('Actual source post detail sheet bytes:',Buffer.byteLength(html));
