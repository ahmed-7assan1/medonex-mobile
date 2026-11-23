import React,{useEffect,useMemo,useRef,useState} from 'react';
import{ActivityIndicator,Alert,Linking,Platform,Pressable,Text,View}from'react-native';
import{Asset}from'expo-asset';
import*as Crypto from'expo-crypto';
import{WebView}from'react-native-webview';
import{useTranslation}from'react-i18next';
import{useTheme}from'@/theme/ThemeContext';
import{useAuth}from'@/lib/auth';
import{useStudentDimensions}from'@/lib/student-viewport';
import{useQuizData}from'@/lib/quiz-player';
import{ResourceState}from'@/components/ResourceState';
import{announceMediaPlaying,listenForOtherMedia}from'@/lib/media-playback';
import type{FixtureQuizQuestion}from'@/lib/fixtures';
import{osceMediaUrl as mediaUrl,osceQuestionContent}from'@/lib/osce-content';
/** Practical hub only. The standalone questions page remains ordinary practice. */
export function LectureOscePractice({lectureId}:{lectureId:string}){
 const resource=useQuizData(lectureId,'lecture'),{user}=useAuth(),{colors}=useTheme();
 if(!resource.data)return<ResourceState title="OSCE" error={resource.error} onRetry={()=>resource.refetch()}/>;
 if(!resource.data.questions.length)return<Text style={{color:colors.mutedForeground,fontSize:14}}>No questions for this lecture yet.</Text>;
 return<OsceSurface key={JSON.stringify([user?.id||'guest',lectureId])} lectureId={lectureId} questions={resource.data.questions}/>;
}
function OsceSurface({lectureId,questions}:{lectureId:string;questions:FixtureQuizQuestion[]}){
 const{colors,isDark}=useTheme(),{i18n}=useTranslation(),{viewportWidth,viewportHeight}=useStudentDimensions();
 const[scope]=useState(()=>Crypto.randomUUID()),[uri,setUri]=useState(''),[ready,setReady]=useState(false),[error,setError]=useState(false),[reload,setReload]=useState(0),[height,setHeight]=useState(500),[width,setWidth]=useState(0);
 const frame=useRef<HTMLIFrameElement|null>(null),native=useRef<WebView|null>(null);
 const safeQuestions=useMemo(()=>osceQuestionContent(questions,lectureId),[questions,lectureId]);
 const payload=useMemo(()=>({type:'render',scope,lectureId,questions:safeQuestions,width,viewportHeight,dark:isDark,direction:i18n.dir()}),[scope,lectureId,safeQuestions,width,viewportHeight,isDark,i18n.language]);
 const sendPause=()=>{if(Platform.OS==='web')frame.current?.contentWindow?.postMessage({type:'pause',scope},'*');else native.current?.injectJavaScript('window.pauseOsceMedia&&window.pauseOsceMedia('+JSON.stringify(scope)+');true;')};
 const pauseRef=useRef(sendPause);pauseRef.current=sendPause;
 useEffect(()=>listenForOtherMedia(scope,()=>pauseRef.current()),[scope]);
 useEffect(()=>{let active=true;setReady(false);setError(false);setUri('');const asset=Asset.fromModule(require('../../../assets/lecture-osce.html'));void(async()=>{if(Platform.OS!=='web')await asset.downloadAsync();if(active)setUri((Platform.OS==='web'?asset.uri:asset.localUri||asset.uri)+'#scope='+scope)})().catch(()=>{if(active)setError(true)});return()=>{active=false}},[scope,reload]);
 const receive=(data:any)=>{
  if(!data||data.scope!==scope)return;
  if(data.type==='ready')setReady(true);
  else if(data.type==='height'&&typeof data.height==='number'&&Number.isFinite(data.height)&&data.height>0&&data.height<=50000)setHeight(Math.ceil(data.height));
  else if(data.type==='error')setError(true);
  else if(data.type==='playing')announceMediaPlaying(scope);
  else if(data.type==='guard')Alert.alert('OSCE practice',data.action==='ai'?'AI grading and new AI explanations are not connected. No request was sent and no credits were used.':'Community sharing is not connected in this read-only practice. Nothing was posted.');
  else if(data.type==='link'&&typeof data.url==='string'){const url=mediaUrl(data.url);if(url)void Linking.openURL(url).catch(()=>Alert.alert('Link unavailable','This link could not open.'))}
 };
 const receiveRef=useRef(receive);receiveRef.current=receive;
 useEffect(()=>{if(Platform.OS!=='web')return;const listener=(event:MessageEvent)=>{if(event.source===frame.current?.contentWindow)receiveRef.current(event.data)};window.addEventListener('message',listener);return()=>window.removeEventListener('message',listener)},[]);
 useEffect(()=>{if(!ready||!width||error)return;if(Platform.OS==='web')frame.current?.contentWindow?.postMessage(payload,'*');else native.current?.injectJavaScript('window.renderOsceProps&&window.renderOsceProps('+JSON.stringify(payload)+');true;')},[ready,width,payload,error]);
 useEffect(()=>{if(!uri||ready||error)return;const timer=setTimeout(()=>setError(true),20000);return()=>clearTimeout(timer)},[uri,ready,error]);
 if(error)return<View style={{padding:24,gap:12}}><Text accessibilityRole="alert" style={{color:colors.destructive}}>The OSCE practice could not load. No answer was submitted.</Text><Pressable accessibilityRole="button" onPress={()=>setReload(value=>value+1)}><Text style={{color:colors.primary}}>Try again</Text></Pressable></View>;
 return<View testID="lecture-osce-practice" onLayout={event=>{const value=Math.round(event.nativeEvent.layout.width);if(value>0)setWidth(value)}} style={{width:'100%',height,overflow:'hidden'}}>
 {!ready&&<ActivityIndicator color={colors.primary} style={{position:'absolute',top:32,alignSelf:'center'}}/>}
 {uri&&(Platform.OS==='web'?React.createElement('iframe',{key:reload,ref:frame,title:'Practical lecture OSCE',src:uri,sandbox:'allow-scripts',allow:'fullscreen *; picture-in-picture *',allowFullScreen:true,onError:()=>setError(true),style:{width:Math.max(viewportWidth,width),height:'100%',border:0,background:'transparent',opacity:ready?1:0}}):<WebView key={reload} ref={native} source={{uri}} style={{width:Math.max(viewportWidth,width),height,backgroundColor:'transparent',opacity:ready?1:0}} javaScriptEnabled allowFileAccess allowFileAccessFromFileURLs={false} allowUniversalAccessFromFileURLs={false} domStorageEnabled={false} sharedCookiesEnabled={false} thirdPartyCookiesEnabled={false} originWhitelist={['*']} allowsInlineMediaPlayback allowsFullscreenVideo mediaPlaybackRequiresUserAction nestedScrollEnabled scrollEnabled={false} setSupportMultipleWindows={false} onShouldStartLoadWithRequest={request=>{if(request.url===uri||request.url===uri.split('#')[0]||request.url==='about:blank')return true;if(request.isTopFrame===false){try{const url=new URL(request.url);return['https://www.youtube.com','https://www.youtube-nocookie.com','https://drive.google.com'].includes(url.origin)}catch{}}return false}} onMessage={event=>{if(event.nativeEvent.data.length>200000)return;try{receiveRef.current(JSON.parse(event.nativeEvent.data))}catch{}}} onError={()=>setError(true)}/>)}
 </View>;
}
