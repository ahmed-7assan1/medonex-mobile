import React,{useEffect,useMemo,useRef,useState}from'react';
import{ActivityIndicator,Alert,Linking,Modal,Platform,Pressable,Text,View}from'react-native';
import{Asset}from'expo-asset';import*as Crypto from'expo-crypto';import*as Clipboard from'expo-clipboard';import{WebView}from'react-native-webview';
import{useTranslation}from'react-i18next';import{useTheme}from'@/theme/ThemeContext';
import{API_V1_URL}from'@/lib/api';import{isFixtureMode}from'@/lib/fixtures';
import{LectureVideoPlayer}from'@/components/lecture/LectureVideoPlayer';
import{CommentsSheet}from'@/components/social/CommentsSheet';
import{WebsitePostStudy}from'@/components/social/WebsitePostStudy';
import{WebsiteSavedAction}from'@/components/social/WebsiteSavedAction';
import type{Post}from'@/lib/community';

const HTTPS=/^https:\/\/[^\s"']{1,1800}$/;
const REACTION_KEYS=['HEART','THUMBS_UP','BRAIN','QUESTION','LIGHTBULB','HANDSHAKE'];
/** Actual source dashboard community marquee: community-mobile/PostCard in 380px columns, copied literally. Data arrives in the payload; every write stays guarded. */
export function WebsiteCommunityCards({posts}:{posts:Post[]}){
 const{isDark,colors}=useTheme(),{i18n}=useTranslation(),ar=i18n.language==='ar';
 const[scope]=useState(()=>Crypto.randomUUID()),[uri,setUri]=useState(''),[ready,setReady]=useState(false),[failed,setFailed]=useState(false),[reload,setReload]=useState(0),[height,setHeight]=useState(0);
 const[comments,setComments]=useState<string|null>(null),[studyPost,setStudyPost]=useState<Post|null>(null),[report,setReport]=useState<{id:string;name:string}|null>(null),[youTube,setYouTube]=useState<string|null>(null);
 const frame=useRef<HTMLIFrameElement|null>(null),native=useRef<WebView>(null);
 const ids=useMemo(()=>posts.map(post=>post.id).join(','),[posts]);
 const payload=useMemo(()=>{
  const mapped=posts.filter(post=>post&&typeof post.id==='string').slice(0,12).map(post=>{
   const counts:Record<string,number>={};for(const key of REACTION_KEYS)counts[key]=Math.max(0,(post.reactionCounts?.[key]??0)|0);
   return{
    id:String(post.id).slice(0,200),content:String(post.content??'').slice(0,20000),
    imageUrl:post.imageUrl&&HTTPS.test(post.imageUrl)?post.imageUrl:null,
    attachments:(Array.isArray(post.attachments)?post.attachments:[]).filter(item=>item&&HTTPS.test(item.url||'')).slice(0,20).map(item=>({id:String(item.id??'').slice(0,100),type:['image','audio','file'].includes(String(item.type))?String(item.type):'file',url:item.url,name:typeof item.name==='string'?item.name.slice(0,300):undefined})),
    author:post.author?{id:String(post.author.id??'').slice(0,100),name:String(post.author.name??'Student').slice(0,200),avatarUrl:post.author.avatarUrl&&HTTPS.test(post.author.avatarUrl)?post.author.avatarUrl:null,rankLabel:typeof post.author.rankLabel==='string'?post.author.rankLabel.slice(0,60):null,handle:typeof post.author.handle==='string'?post.author.handle.slice(0,100):null,telegramVerified:!!post.author.telegramVerified}:null,
    isAnonymous:!!post.isAnonymous,forumId:String(post.forumId??'').slice(0,100),forumName:typeof post.forumName==='string'?post.forumName.slice(0,120):undefined,
    audience:'UNIVERSITY',isPinned:!!post.isPinned,
    poll:post.poll??null,sharedQuestionData:post.sharedQuestionData??null,questions:post.questions??null,flashcards:post.flashcards??null,
    backgroundStyle:null,tableData:post.tableData??null,
    hashtags:(post.hashtags??[]).slice(0,50).map(tag=>String(tag).slice(0,100)),
    reactionCounts:counts,userReaction:post.userReaction&&REACTION_KEYS.includes(post.userReaction)?post.userReaction:null,
    commentCount:Math.max(0,post.commentCount|0),shareCount:Math.max(0,post.shareCount|0),isSaved:!!post.isSaved,likesCount:Math.max(0,(post.likesCount??0)|0),
    createdAt:String(post.createdAt??''),expiresAt:null,
   };
  });
  return{scope,type:'render',dark:isDark,direction:i18n.dir(),origin:API_V1_URL.replace(/\/api\/v1$/,''),posts:mapped};
 },[ids,isDark,i18n.language,scope]);
 useEffect(()=>{let active=true;(async()=>{const asset=Asset.fromModule(require('../../../assets/community-cards.html'));if(Platform.OS!=='web')await asset.downloadAsync();if(active)setUri((Platform.OS==='web'?asset.uri:asset.localUri||asset.uri)+'#scope='+encodeURIComponent(scope))})().catch(()=>{if(active)setFailed(true)});return()=>{active=false}},[scope]);
 const readOnly=(what:string)=>Alert.alert(ar?'معاينة للقراءة فقط':'Read-only preview',ar?'ما اتبعتش حاجة. التفاعل من خلال الموقع.':'Nothing was sent. Interact through the website.');
 const receive=async(data:any)=>{
  if(data?.scope!==scope)return;
  if(data.type==='ready')setReady(true);
  else if(data.type==='error')setFailed(true);
  else if(data.type==='height'&&typeof data.height==='number'&&data.height>0&&data.height<4000)setHeight(data.height);
  else if(data.type==='guard')readOnly(String(data.method||'write'));
  else if(data.type==='toast')Alert.alert('',String(data.message||'').slice(0,300));
  else if(data.type==='copy'){try{await Clipboard.setStringAsync(String(data.text||'').slice(0,2000))}catch{}}
  else if(data.type==='open-url'&&typeof data.url==='string'&&HTTPS.test(data.url)){if(isFixtureMode())readOnly('link');else Linking.openURL(data.url).catch(()=>{})}
  else if(data.type==='link'&&typeof data.href==='string'&&HTTPS.test(data.href)){if(isFixtureMode())readOnly('download');else Linking.openURL(data.href).catch(()=>{})}
  else if(data.type==='comments'&&typeof data.id==='string')setComments(data.id.slice(0,200));
  else if(data.type==='study'){const id=typeof data.id==='string'?data.id:null;setStudyPost(posts.find(post=>post.id===id)??posts.find(post=>(post.questions?.length||post.flashcards?.length))??null)}
  else if(data.type==='report'){const post=posts.find(item=>item.id===data.id);if(post)setReport({id:post.id,name:post.author?.name??'Student'})}
  else if(data.type==='youtube'&&/^[A-Za-z0-9_-]{11}$/.test(String(data.id||'')))setYouTube(String(data.id));
 };
 const listener=useRef(receive);listener.current=receive;
 useEffect(()=>{if(Platform.OS!=='web')return;const accept=(event:MessageEvent)=>{if(event.source===frame.current?.contentWindow)listener.current(event.data)};window.addEventListener('message',accept);return()=>window.removeEventListener('message',accept)},[]);
 useEffect(()=>{if(!ready||failed||!payload)return;if(Platform.OS==='web')frame.current?.contentWindow?.postMessage(payload,'*');else native.current?.injectJavaScript('window.renderCommunityCards&&window.renderCommunityCards('+JSON.stringify(payload)+');true;')},[ready,failed,payload,reload]);
 useEffect(()=>{if(ready||failed)return;const timer=setTimeout(()=>setFailed(true),12000);return()=>clearTimeout(timer)},[ready,failed,reload]);
 if(failed)return<View style={{padding:24,alignItems:'center',gap:12}}><Text style={{fontFamily:'Arial',fontSize:14,color:colors.foreground}}>{ar?'تعذر تحميل مجتمع الطلاب.':'Community cards could not load.'}</Text><Pressable accessibilityRole="button" accessibilityLabel="Retry community cards" onPress={()=>{setFailed(false);setReady(false);setReload(value=>value+1)}}><Text style={{color:colors.primary}}>{ar?'حاول تاني':'Retry'}</Text></Pressable></View>;
 return<View testID="website-community-cards" style={{overflow:'hidden'}}>
  {uri&&(Platform.OS==='web'?React.createElement('iframe',{key:reload,ref:frame,title:'Community posts',src:uri,sandbox:'allow-scripts',onError:()=>setFailed(true),style:{width:'100%',height:height||320,border:0,background:'transparent',opacity:ready?1:0}}):<View style={{height:height||320}}><WebView key={reload} ref={native} source={{uri}} style={{flex:1,backgroundColor:'transparent',opacity:ready?1:0}} allowFileAccessFromFileURLs={false} originWhitelist={['*']} allowFileAccess allowUniversalAccessFromFileURLs={false} sharedCookiesEnabled={false} thirdPartyCookiesEnabled={false} domStorageEnabled={false} cacheEnabled={false} javaScriptEnabled scrollEnabled={false} setSupportMultipleWindows={false} onError={()=>setFailed(true)} onMessage={event=>{try{if(event.nativeEvent.data.length<=20000)listener.current(JSON.parse(event.nativeEvent.data))}catch{}}} onShouldStartLoadWithRequest={request=>request.url.split('#')[0]===uri.split('#')[0]||request.url==='about:blank'}/></View>)}
  {!ready&&<View pointerEvents="none" style={{position:'absolute',inset:0,alignItems:'center',justifyContent:'center'}}><ActivityIndicator color={colors.mutedForeground}/></View>}
  <CommentsSheet postId={comments} onClose={()=>setComments(null)}/>
  {studyPost&&<WebsitePostStudy post={studyPost} open onClose={()=>setStudyPost(null)}/>}
  <WebsiteSavedAction kind={report?'report':null} name={report?.name??''} postId={report?.id??''} onClose={()=>setReport(null)}/>
  {youTube&&<Modal visible transparent animationType="fade" onRequestClose={()=>setYouTube(null)} statusBarTranslucent><Pressable accessibilityRole="button" accessibilityLabel="Close video" onPress={()=>setYouTube(null)} style={{flex:1,backgroundColor:'rgba(0,0,0,.7)',alignItems:'center',justifyContent:'center',padding:20}}><View style={{width:'100%',maxWidth:760}}><LectureVideoPlayer url={'https://www.youtube.com/watch?v='+youTube} title="Video" height={Math.min(420,760*9/16)}/></View></Pressable></Modal>}
 </View>;
}
