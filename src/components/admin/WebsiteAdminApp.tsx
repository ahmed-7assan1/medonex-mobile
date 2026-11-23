import React,{useEffect,useMemo,useRef,useState}from'react';
import{ActivityIndicator,Alert,Linking,Platform,Text,View,useWindowDimensions}from'react-native';
import*as Clipboard from'expo-clipboard';
import{Asset}from'expo-asset';
import*as Crypto from'expo-crypto';
import{WebView}from'react-native-webview';
import{useRouter}from'expo-router';
import{useAuth}from'@/lib/auth';
import{useTheme}from'@/theme/ThemeContext';
import{useTranslation}from'react-i18next';
import{apiGetAbsolute}from'@/lib/api';

const ADMIN_ROLES=new Set(['ADMIN','SUPER_ADMIN','FACULTY_LEADER']);
const SAFE_GET=/^\/api\/[A-Za-z0-9/_?=&%.-]{0,480}$/;

/** Full-screen local render of the actual MedQs0 admin console. Reads bridge to native
    GETs (read-only); every write inside the frame is guarded and shown as unavailable. */
export function WebsiteAdminApp({route}:{route:string}){
  const{user,signOut}=useAuth();
  const{isDark,setThemeChoice}=useTheme();
  const{i18n}=useTranslation();
  const router=useRouter();
  const{width}=useWindowDimensions();
  const[scopeId]=useState(()=>Crypto.randomUUID());
  const[uri,setUri]=useState('');
  const[ready,setReady]=useState(false);
  const[failed,setFailed]=useState('');
  const frame=useRef<HTMLIFrameElement|null>(null);
  const native=useRef<WebView|null>(null);
  const role=user?.role||'';
  const allowed=!!user&&ADMIN_ROLES.has(role);

  useEffect(()=>{
    let active=true;
    setUri('');setReady(false);
    const asset=Asset.fromModule(require('../../../assets/admin-app.html'));
    void(async()=>{if(Platform.OS!=='web')await asset.downloadAsync();if(active)setUri((Platform.OS==='web'?asset.uri:asset.localUri||asset.uri)+'#scope='+scopeId)})().catch(()=>{if(active)setFailed('The admin console could not be loaded on this device.')});
    return()=>{active=false};
  },[scopeId]);

  const payload=useMemo(()=>({
    type:'render',scope:scopeId,route:route.slice(0,300),dark:isDark,direction:i18n.dir(),viewportWidth:width,
    siteName:'MedOneX',logoUrl:null,
    user:user?{id:user.id,email:user.email,name:user.name||'Admin',image:user.image||null,role}:null,
    adminScope:{role,universityId:user?.universityId??null,facultyId:null},
    data:{},
  }),[scopeId,route,isDark,i18n.language,width,user,role]);

  const post=(message:unknown)=>{
    if(Platform.OS==='web')frame.current?.contentWindow?.postMessage(message,'*');
    else native.current?.injectJavaScript('window.renderAdmin&&window.renderAdmin('+JSON.stringify(message)+');true;');
  };
  const answerFetch=(id:number,status:number,body:string)=>{
    const message={type:'fetch-result',scope:scopeId,id,status,body};
    if(Platform.OS==='web')frame.current?.contentWindow?.postMessage(message,'*');
    else native.current?.injectJavaScript('window.__adminFetchResult&&window.__adminFetchResult('+JSON.stringify(message)+');true;');
  };

  const receiveRef=useRef<(data:any)=>void>(()=>{});
  receiveRef.current=data=>{
    if(!data||data.scope!==scopeId)return;
    if(data.type==='ready')setReady(true);
    else if(data.type==='navigate'){
      const href=String(data.href||'');
      if(!href.startsWith('/')||href.length>500)return;
      if(data.replace)router.replace(href as never);else router.push(href as never);
    }
    else if(data.type==='back')router.back();
    else if(data.type==='guard')Alert.alert('Read-only admin','This admin action is not connected in the app yet. Nothing was sent and nothing changed.');
    else if(data.type==='toast')Alert.alert('',String(data.message||'').slice(0,300));
    else if(data.type==='copy'){void Clipboard.setStringAsync(String(data.text||'').slice(0,2000))}
    else if(data.type==='open-url'){const url=String(data.url||'');if(/^https:\/\//.test(url)&&url.length<=2000)void Linking.openURL(url)}
    else if(data.type==='theme'){const next=data.theme==='light'||data.theme==='dark'||data.theme==='system'?data.theme:null;if(next)setThemeChoice(next)}
    else if(data.type==='signout'){void signOut()}
    else if(data.type==='fetch-get'){
      const id=typeof data.id==='number'?data.id:0;
      const path=String(data.path||'');
      if(!id||!SAFE_GET.test(path)||path.includes('..')){answerFetch(id,403,JSON.stringify({error:'This read is not available in the app.'}));return}
      void apiGetAbsolute(path).then(res=>answerFetch(id,res.status,res.body)).catch(()=>answerFetch(id,503,JSON.stringify({error:'The admin data could not be loaded.'})));
    }
  };
  useEffect(()=>{
    if(Platform.OS!=='web')return;
    const handler=(event:MessageEvent)=>{
      if(event.source===frame.current?.contentWindow){
        const data=event.data;
        if(data&&data.type==='fetch-result')return;
        receiveRef.current(data);
      }
    };
    window.addEventListener('message',handler);
    return()=>window.removeEventListener('message',handler);
  },[]);
  useEffect(()=>{if(ready&&user)post(payload)},[ready,payload]);

  const gate=(!user||!allowed||failed)?(failed||(!user?'Sign in with an admin account to open the admin console.':'This account does not have admin access.')):'';
  if(gate)return<View style={{flex:1,alignItems:'center',justifyContent:'center',padding:24}}><Text style={{fontSize:14,lineHeight:22,textAlign:'center'}}>{gate}</Text></View>;
  return(
    <View testID="admin-app" style={{flex:1}}>
      {!ready&&<ActivityIndicator style={{position:'absolute',top:48,alignSelf:'center',zIndex:1}}/>}
      {uri&&(Platform.OS==='web'
        ?React.createElement('iframe',{ref:frame,title:'Admin console',src:uri,sandbox:'allow-scripts',style:{width:'100%',height:'100%',border:0,opacity:ready?1:0,display:'block'}})
        :<WebView ref={native} source={{uri}} style={{flex:1,opacity:ready?1:0}} originWhitelist={['*']} allowFileAccess allowFileAccessFromFileURLs={false} allowUniversalAccessFromFileURLs={false} javaScriptEnabled domStorageEnabled={false} sharedCookiesEnabled={false} thirdPartyCookiesEnabled={false} setSupportMultipleWindows={false} onShouldStartLoadWithRequest={request=>request.url===uri||request.url===uri.split('#')[0]||request.url==='about:blank'||request.url==='about:srcdoc'} onMessage={event=>{try{receiveRef.current(JSON.parse(event.nativeEvent.data))}catch{}}} onError={()=>setFailed('The admin console could not be loaded on this device.')}/>)}
    </View>
  );
}
