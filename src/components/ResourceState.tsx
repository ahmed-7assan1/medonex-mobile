import React from 'react';
import {View,Text,Pressable,ActivityIndicator} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useRouter} from 'expo-router';
import {useTranslation} from 'react-i18next';
import {ArrowLeft,RefreshCw,WifiOff} from 'lucide-react-native';
import {useTheme} from '@/theme/ThemeContext';
import {useAuth} from '@/lib/auth';
import {ApiError} from '@/lib/api';

export function ResourceState({error,onRetry,title,message,notFound=false}:{message?:string;error?:unknown;onRetry:()=>unknown;title?:string;notFound?:boolean}){
 const {st,fonts}=useTheme();const {i18n}=useTranslation();const ar=i18n.language==='ar';const {signOut}=useAuth();const router=useRouter();const insets=useSafeAreaInsets();
 const expired=error instanceof ApiError&&error.status===401;
 const forbidden=error instanceof ApiError&&error.status===403;
 const missing=notFound||(error instanceof ApiError&&error.status===404);
 const loading=!error&&!missing;
 const heading=expired?(ar?'سجّل الدخول تاني':'Please sign in again'):forbidden?(ar?'مش متاح لحسابك':'Not available for this account'):missing?(ar?'المحتوى غير موجود':'Content not found'):(ar?'تعذر تحميل البيانات':'Could not load your data');
 return <View style={{flex:1,backgroundColor:st.bg,paddingTop:insets.top}}>
  <View style={{height:56,paddingHorizontal:16,flexDirection:'row',alignItems:'center',gap:12}}><Pressable accessibilityRole="button" accessibilityLabel={ar?'رجوع':'Back'} onPress={()=>router.canGoBack()?router.back():router.replace('/modules')} style={{width:44,height:44,alignItems:'center',justifyContent:'center'}}><ArrowLeft size={20} color={st.text}/></Pressable><Text style={{fontSize:17,color:st.text,fontFamily:fonts.sansSemiBold}}>{title}</Text></View>
  <View style={{flex:1,alignItems:'center',justifyContent:'center',paddingHorizontal:28,paddingBottom:insets.bottom+100,gap:16}}>
   {loading?<><ActivityIndicator color={st.muted}/><Text style={{fontSize:14,color:st.muted}}>{ar?'جاري التحميل...':'Loading...'}</Text></>:<><WifiOff size={32} color={st.muted}/><Text style={{fontSize:17,color:st.text,fontFamily:fonts.sansSemiBold,textAlign:'center'}}>{heading}</Text><Text style={{fontSize:14,color:st.muted,lineHeight:21,textAlign:'center'}}>{message||(expired?(ar?'سجّل الدخول تاني عشان تفتح بيانات حسابك.':'Sign in again to load your account data.'):missing?(ar?'المحتوى ده اتحذف أو الرابط مش صحيح.':'This content was removed or the link is no longer valid.'):(ar?'راجع اتصال الإنترنت وجرب تاني. مش هنعرض بيانات تجريبية بدل بيانات حسابك.':'Check your connection and try again. Demo data will not replace your account data.'))}</Text>
   <Pressable accessibilityRole="button" onPress={async()=>{if(expired){await signOut();router.replace('/(auth)/login')}else onRetry()}} style={{marginTop:8,borderRadius:22,height:44,paddingHorizontal:24,backgroundColor:st.text,flexDirection:'row',alignItems:'center',gap:8}}><RefreshCw size={16} color={st.bg}/><Text style={{fontSize:14,color:st.bg,fontFamily:fonts.sansSemiBold}}>{expired?(ar?'تسجيل الدخول':'Sign in'):(ar?'حاول تاني':'Try again')}</Text></Pressable></>}
  </View>
 </View>;
}
