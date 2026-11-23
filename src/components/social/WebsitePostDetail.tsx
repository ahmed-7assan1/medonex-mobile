import React,{useEffect,useMemo,useRef,useState}from'react';
import{ActivityIndicator,Alert,Linking,Modal,Platform,Pressable,Text,View}from'react-native';
import{Asset}from'expo-asset';import*as Crypto from'expo-crypto';import*as Clipboard from'expo-clipboard';import{WebView}from'react-native-webview';
import{useTranslation}from'react-i18next';import{useTheme}from'@/theme/ThemeContext';import{useAuth}from'@/lib/auth';
import{apiV1,API_V1_URL}from'@/lib/api';import{isFixtureMode}from'@/lib/fixtures';import{savedYouTubeTitle}from'@/lib/youtube-titles';
import{LectureVideoPlayer}from'@/components/lecture/LectureVideoPlayer';
import type{DesktopPost}from'@/lib/desktop-social';

const HTTPS=/^https:\/\/[^\s"']{1,1800}$/;
/** Actual source forum post detail sheet. Comments/mention search read through the native session; every write stays guarded inside the renderer and is reported here. */
export function WebsitePostDetail({post,onClose}:{post:DesktopPost|null;onClose:()=>void}){
 const{user}=useAuth();
 return post?<DetailFrame key={JSON.stringify([user?.id??'guest',post.id])} post={post} signedIn={!!user?.id} user={user} onClose={onClose}/>:null;
}
function DetailFrame({post,signedIn,user,onClose}:{post:DesktopPost;signedIn:boolean;user:any;onClose:()=>void}){
 const{isDark,colors}=useTheme(),{i18n}=useTranslation(),ar=i18n.language==='ar';
 const[scope]=useState(()=>Crypto.randomUUID()),[uri,setUri]=useState(''),[ready,setReady]=useState(false),[failed,setFailed]=useState(false),[reload,setReload]=useState(0),[youTube,setYouTube]=useState<string|null>(null);
 const frame=useRef<HTMLIFrameElement|null>(null),native=useRef<WebView>(null);
 const payload=useMemo(()=>{
  const attachments=(Array.isArray(post.attachments)?post.attachments:[]).filter(item=>item&&HTTPS.test(item.url||'')).slice(0,20).map(item=>({url:item.url,fileId:typeof item.id==='string'?item.id.slice(0,100):undefined,name:typeof item.name==='string'?item.name.slice(0,300):undefined,size:typeof item.size==='number'?item.size:undefined}));
  const counts=post.reactionCounts&&typeof post.reactionCounts==='object'?post.reactionCounts:{};
  const reactions:{type:string;userId:string}[]=[];
  for(const[type,count]of Object.entries(counts)){const total=Math.min(Math.max(0,count|0),500);for(let index=0;index<total;index++)reactions.push({type:String(type).slice(0,40),userId:index===0&&type===post.userReaction&&signedIn?String(user.id):''})}
  if(post.userReaction&&!reactions.some(r=>r.userId===String(user?.id))&&signedIn)reactions.push({type:String(post.userReaction).slice(0,40),userId:String(user.id)});
  return{
   scope,type:'render',dark:isDark,direction:i18n.dir(),initialTab:'post',
   origin:API_V1_URL.replace(/\/api\/v1$/,''),
   user:{id:signedIn?String(user.id).slice(0,100):undefined,role:typeof user?.role==='string'?user.role.slice(0,40):undefined,universityId:typeof user?.universityId==='string'?user.universityId.slice(0,100):undefined},
   post:{
    id:String(post.id).slice(0,200),content:String(post.content??'').slice(0,20000),createdAt:String(post.createdAt??''),
    authorId:post.author?.id?String(post.author.id).slice(0,100):undefined,
    universityId:typeof post.universityId==='string'?post.universityId.slice(0,100):undefined,
    author:post.author?{name:String(post.author.name??'Student').slice(0,200),image:post.author.avatarUrl&&HTTPS.test(post.author.avatarUrl)?post.author.avatarUrl:null,color:typeof post.author.color==='string'?post.author.color.slice(0,40):undefined,telegramVerified:!!post.author.telegramVerified}:null,
    hashtags:(post.hashtags??[]).slice(0,50).map(tag=>String(tag).slice(0,100)),
    attachments,
    imageUrl:post.imageUrl&&HTTPS.test(post.imageUrl)?post.imageUrl:null,
    reactions,
    _count:{comments:Math.max(0,post.commentCount|0)},comments:Math.max(0,post.commentCount|0),
    savedByMe:!!post.isSaved,
   },
  };
 },[post,scope,isDark,i18n.language,signedIn,user]);
 useEffect(()=>{let active=true;(async()=>{const asset=Asset.fromModule(require('../../../assets/post-detail.html'));if(Platform.OS!=='web')await asset.downloadAsync();if(active)setUri((Platform.OS==='web'?asset.uri:asset.localUri||asset.uri)+'#scope='+encodeURIComponent(scope))})().catch(()=>{if(active)setFailed(true)});return()=>{active=false}},[scope]);
 const respond=(message:object)=>{
  const body=JSON.stringify(message);
  if(Platform.OS==='web')frame.current?.contentWindow?.postMessage(message,'*');
  else native.current?.injectJavaScript(`(function(){var m=${body};if(m.type==='api-response')window.__postDetailApiResolve&&window.__postDetailApiResolve(m.id,m);else if(m.type==='yt-title-response')window.__postDetailYtResolve&&window.__postDetailYtResolve(m.key,m.title);})();true;`);
 };
 const readOnly=(what:string)=>Alert.alert(ar?'معاينة للقراءة فقط':'Read-only preview',ar?'ما اتبعتش حاجة. التفاعل من خلال الموقع. ('+what+')':'Nothing was sent. Interact through the website. ('+what+')');
 const receive=async(data:any)=>{
  if(data?.scope!==scope)return;
  if(data.type==='ready')setReady(true);
  else if(data.type==='error')setFailed(true);
  else if(data.type==='close')onClose();
  else if(data.type==='guard')readOnly(String(data.method||'write')+' '+String(data.path||'').split('/').slice(-1)[0]);
  else if(data.type==='toast')Alert.alert('',String(data.message||'').slice(0,300));
  else if(data.type==='copy'){try{await Clipboard.setStringAsync(String(data.text||'').slice(0,2000))}catch{}}
  else if(data.type==='open-url'&&typeof data.url==='string'&&/^https:\/\/((www\.)?(twitter|x)\.com|wa\.me|(www\.)?facebook\.com)\//.test(data.url))Linking.openURL(data.url).catch(()=>{});
  else if(data.type==='link'&&typeof data.href==='string'){
   if(HTTPS.test(data.href)){if(isFixtureMode())readOnly('download');else Linking.openURL(data.href).catch(()=>{})}
  }
  else if(data.type==='youtube'&&/^[A-Za-z0-9_-]{11}$/.test(String(data.id||'')))setYouTube(String(data.id));
  else if(data.type==='yt-title'&&typeof data.key==='string'&&/^[A-Za-z0-9_-]{11}$/.test(String(data.id||''))){
   if(isFixtureMode()){respond({type:'yt-title-response',scope,key:data.key.slice(0,60),title:'Video'});return}
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
   try{const title=await savedYouTubeTitle(String(data.id),controller.signal);respond({type:'yt-title-response',scope,key:data.key.slice(0,60),title})}catch{respond({type:'yt-title-response',scope,key:data.key.slice(0,60),title:'Video'})}finally{clearTimeout(timer)}
  }
  else if(data.type==='api'&&typeof data.id==='number'&&typeof data.path==='string'){
   const path=data.path,okPath=/^\/api\/v1\/(posts\/[A-Za-z0-9_-]{1,100}\/comments|mentions\/search\?q=[^&\s]{0,200})$/.test(path);
   if(!okPath){respond({type:'api-response',scope,id:data.id,ok:false,status:403,body:{error:'blocked'}});return}
   if(isFixtureMode()){respond({type:'api-response',scope,id:data.id,ok:true,status:200,body:path.includes('/comments')?[]:[]});return}
   try{
    const body=await apiV1.get<unknown>(path.slice('/api/v1'.length));
    const text=JSON.stringify(body??null);
    respond({type:'api-response',scope,id:data.id,ok:true,status:200,body:text.length<=600000?body:(Array.isArray(body)?[]:{})});
   }catch(error:any){respond({type:'api-response',scope,id:data.id,ok:false,status:typeof error?.status==='number'?error.status:500,body:{error:'failed'}})}
  }
 };
 const listener=useRef(receive);listener.current=receive;
 useEffect(()=>{if(Platform.OS!=='web')return;const accept=(event:MessageEvent)=>{if(event.source===frame.current?.contentWindow)listener.current(event.data)};window.addEventListener('message',accept);return()=>window.removeEventListener('message',accept)},[]);
 useEffect(()=>{if(!ready||failed||!payload)return;if(Platform.OS==='web')frame.current?.contentWindow?.postMessage(payload,'*');else native.current?.injectJavaScript('window.renderPostDetail&&window.renderPostDetail('+JSON.stringify(payload)+');true;')},[ready,failed,payload,reload]);
 useEffect(()=>{if(ready||failed)return;const timer=setTimeout(()=>setFailed(true),12000);return()=>clearTimeout(timer)},[ready,failed,reload]);
 return<Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent><View testID="website-post-detail" style={{flex:1,backgroundColor:'transparent'}}>
  {failed?<View style={{flex:1,backgroundColor:colors.background,alignItems:'center',justifyContent:'center',padding:24,gap:20}}><Text style={{fontFamily:'Arial',fontSize:15,color:colors.foreground}}>{ar?'تعذر فتح المنشور.':'This post could not open.'}</Text><Pressable accessibilityRole="button" accessibilityLabel="Retry post detail" onPress={()=>{setFailed(false);setReady(false);setReload(value=>value+1)}}><Text style={{color:colors.primary}}>{ar?'حاول تاني':'Retry'}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Close post detail" onPress={onClose}><Text style={{color:colors.foreground}}>{ar?'قفل':'Close'}</Text></Pressable></View>
  :<>{uri&&(Platform.OS==='web'?React.createElement('iframe',{key:reload,ref:frame,title:'Post detail',src:uri,sandbox:'allow-scripts',onError:()=>setFailed(true),style:{width:'100%',height:'100%',border:0,background:'transparent',opacity:ready?1:0}}):<WebView key={reload} ref={native} source={{uri}} style={{flex:1,backgroundColor:'transparent',opacity:ready?1:0}} allowFileAccessFromFileURLs={false} originWhitelist={['*']} allowFileAccess allowUniversalAccessFromFileURLs={false} sharedCookiesEnabled={false} thirdPartyCookiesEnabled={false} domStorageEnabled={false} cacheEnabled={false} javaScriptEnabled scrollEnabled={false} setSupportMultipleWindows={false} onError={()=>setFailed(true)} onMessage={event=>{try{if(event.nativeEvent.data.length<=20000)listener.current(JSON.parse(event.nativeEvent.data))}catch{}}} onShouldStartLoadWithRequest={request=>request.url.split('#')[0]===uri.split('#')[0]||request.url==='about:blank'}/>)}{!ready&&<View pointerEvents="none" style={{position:'absolute',inset:0,alignItems:'center',justifyContent:'center'}}><ActivityIndicator color={colors.mutedForeground}/></View>}</>}
  {youTube&&<Modal visible transparent animationType="fade" onRequestClose={()=>setYouTube(null)} statusBarTranslucent><Pressable accessibilityRole="button" accessibilityLabel="Close video" onPress={()=>setYouTube(null)} style={{flex:1,backgroundColor:'rgba(0,0,0,.7)',alignItems:'center',justifyContent:'center',padding:20}}><View style={{width:'100%',maxWidth:760}}><LectureVideoPlayer url={'https://www.youtube.com/watch?v='+youTube} title="Video" height={Math.min(420,760*9/16)}/></View></Pressable></Modal>}
 </View></Modal>;
}
