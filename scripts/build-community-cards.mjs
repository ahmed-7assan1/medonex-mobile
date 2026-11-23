import{websiteCSS}from'./website-css.mjs';
import fs from'node:fs';import path from'node:path';import{createRequire}from'node:module';import{fileURLToPath}from'node:url';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url))),website=path.resolve(process.argv[2]||'../medqs-mobile-auth'),req=createRequire(website+'/package.json');

/* Guard-only apiFetch: the card needs no reads; GETs fail quietly, writes raise the read-only guard. */
const apiStub=`export function apiFetch(path,options){const method=String(options?.method||'GET').toUpperCase();if(method!=='GET')window.__communityGuard?.(method,String(path||''));return Promise.resolve({ok:false,status:403,json:async()=>({error:'Read-only preview. Nothing was sent.'})})}`;
const toastStub=`export default{error:m=>window.__communityEmit?.({type:'toast',kind:'error',message:String(m||'').slice(0,300)}),success:m=>window.__communityEmit?.({type:'toast',kind:'success',message:String(m||'').slice(0,300)})}`;
const imageStub=`import React from'react';export default function Image({src,alt,width,height,fill,className,style}){const base=fill?{position:'absolute',inset:0,width:'100%',height:'100%'}:{width:typeof width==='number'?width:undefined,height:typeof height==='number'?height:undefined};return <img src={src} alt={alt||''} className={className} style={{...base,...style}}/>}`;
const linkStub=`import React from'react';export default function Link({href,children,...rest}){return <a href={typeof href==='string'?href:'#'} {...rest}>{children}</a>}`;
const navStub=`export const useRouter=()=>({push:()=>{},back:()=>{},replace:()=>{},refresh:()=>{}});export const usePathname=()=>'/';`;
const storeStub=`const state={posts:[],updatePost:(id,partial)=>{const post=state.posts.find(item=>item.id===id);if(post)Object.assign(post,partial)},removePost:id=>{state.posts=state.posts.filter(item=>item.id!==id)},openComments:id=>window.__communityEmit?.({type:'comments',id:String(id||'')}),openReport:(type,id)=>window.__communityEmit?.({type:'report',target:String(type||'post'),id:String(id||'')}),openComposer:()=>window.__communityGuard?.('POST','composer'),setLiked:(id,liked)=>{const post=state.posts.find(item=>item.id===id);if(post)post.userReaction=liked?'HEART':null},setLikesCount:(id,likes)=>{const post=state.posts.find(item=>item.id===id);if(post)post.likesCount=likes}};
export const pendingLikes=new Set();
export const useCommunityStore=selector=>selector(state);
useCommunityStore.getState=()=>state;
useCommunityStore.setState=partial=>Object.assign(state,partial);`;
const cardApiStub=`const blocked=action=>async()=>{window.__communityGuard?.('POST',action);throw Error('Read-only preview')};export const deletePost=blocked('delete-post');export const toggleBlock=blocked('block-user');`;
const sheetStub=`import React from'react';export function PostContentSheet({open,onOpenChange}){React.useEffect(()=>{if(open){window.__communityEmit?.({type:'study'});onOpenChange?.(false)}},[open]);return null}`;
const youtubeStub=`import React from'react';export default function YouTubePlayer({videoId,id}){const video=String(videoId||id||'');return <div role="button" aria-label="Play video" onClick={()=>window.__communityEmit?.({type:'youtube',id:video})} style={{position:'absolute',inset:0,background:'#000',cursor:'pointer'}}/>}`;

const result=await req('esbuild').build({stdin:{contents:fs.readFileSync(root+'/scripts/community-cards-entry.jsx','utf8'),loader:'jsx',resolveDir:website},tsconfig:website+'/tsconfig.json',bundle:true,jsx:'automatic',format:'iife',minify:true,write:false,define:{'process.env.NODE_ENV':'"production"','process.env':'{}'},plugins:[{name:'offline-community-cards',setup(b){
  b.onResolve({filter:/^@\/lib\/api-fetch$/},()=>({path:'api',namespace:'community-cards'}));
  b.onResolve({filter:/^react-hot-toast$/},()=>({path:'toast',namespace:'community-cards'}));
  b.onResolve({filter:/^next\/image$/},()=>({path:'image',namespace:'community-cards'}));
  b.onResolve({filter:/^next\/link$/},()=>({path:'link',namespace:'community-cards'}));
  b.onResolve({filter:/^next\/navigation$/},()=>({path:'navigation',namespace:'community-cards'}));
  b.onResolve({filter:/^@\/components\/community-mobile\/store$/},()=>({path:'store',namespace:'community-cards'}));
  b.onResolve({filter:/^\.\/store$/},()=>({path:'store',namespace:'community-cards'}));
  b.onResolve({filter:/^\.\/api$/},()=>({path:'card-api',namespace:'community-cards'}));
  b.onResolve({filter:/PostContentSheet$/},()=>({path:'sheet',namespace:'community-cards'}));
  b.onResolve({filter:/YouTubePlayer$/},()=>({path:'youtube',namespace:'community-cards'}));
  b.onLoad({filter:/.*/,namespace:'community-cards'},args=>{
    const contents=args.path==='api'?apiStub:args.path==='toast'?toastStub:args.path==='image'?imageStub:args.path==='link'?linkStub:args.path==='navigation'?navStub:args.path==='store'?storeStub:args.path==='card-api'?cardApiStub:args.path==='sheet'?sheetStub:youtubeStub;
    const tsOnly=args.path==='api'||args.path==='toast'||args.path==='navigation'||args.path==='store'||args.path==='card-api';
    return{loader:tsOnly?'ts':'tsx',resolveDir:website,contents};
  });
  b.onLoad({filter:/post-interactions\.ts$/},args=>{
    let code=fs.readFileSync(args.path,'utf8');
    if(!code.includes('window.location.origin'))throw Error('Source post link contract changed');
    code=code.replace('window.location.origin',"(window.__COMMUNITY_ORIGIN__||'https://www.medonex.me')");
    return{contents:code,loader:'ts',resolveDir:path.dirname(args.path)};
  });
}}]});
let fonts='';for(const[weight,suffix]of[[400,'Regular'],[700,'Bold']])fonts+=`@font-face{font-family:Cairo;src:url(data:font/ttf;base64,${fs.readFileSync(path.join(root,'node_modules/@expo-google-fonts/cairo',weight+suffix,`Cairo_${weight}${suffix}.ttf`)).toString('base64')});font-weight:${weight};font-display:swap}`;
const css=websiteCSS(website);
const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; font-src data:; connect-src 'none'; img-src https: data:; frame-src 'none'; media-src https:; form-action 'none'; base-uri 'none'"><style>${fonts}${css}html,body,#root{margin:0;min-height:100%;background:transparent!important}body{font-family:Arial,sans-serif;letter-spacing:-.15px}html[dir=rtl] body{font-family:Cairo,Arial,sans-serif}</style></head><body><div id="root"></div><script>${result.outputFiles[0].text.replaceAll('</script','<\\/script')}</script></body></html>`;
fs.writeFileSync(root+'/assets/community-cards.html',html);
console.log('Actual source community marquee cards bytes:',Buffer.byteLength(html));
