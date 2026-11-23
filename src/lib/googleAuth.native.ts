import { useState } from 'react';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';
import { api, ApiError } from './api';
import type { AuthUser } from './auth';

import { ExchangeError } from './google-exchange';
export { ExchangeError } from './google-exchange';
let configuredFor='';
export function useGoogleSignIn(){
 const extra=Constants.expoConfig?.extra;
 const webClientId=extra?.googleWebClientId as string|undefined;
 const iosClientId=extra?.googleIosClientId as string|undefined;
 const configured=Boolean(webClientId&&(Platform.OS!=='ios'||iosClientId));
 const [busy,setBusy]=useState(false);
 const signIn=async():Promise<{token:string;user:AuthUser}>=>{
  if(!configured||!webClientId)throw new ExchangeError('config-missing','Google sign-in is not configured');
  if(busy)throw new ExchangeError('failed','Sign-in already running');
  setBusy(true);
  try{
   if(configuredFor!==webClientId){GoogleSignin.configure({webClientId,...(iosClientId?{iosClientId}:{}),offlineAccess:false,scopes:['email','profile']});configuredFor=webClientId}
   await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog:true});
   const result=await GoogleSignin.signIn();
   if(!isSuccessResponse(result))throw new ExchangeError('failed','cancelled');
   const idToken=result.data.idToken;
   if(!idToken)throw new ExchangeError('failed','Google returned no identity token');
   return await api.post<{token:string;user:AuthUser}>('/auth/google',{idToken});
  }catch(error){
   if(error instanceof ExchangeError)throw error;
   if(error instanceof ApiError){
    if(error.status===404)throw new ExchangeError('endpoint-missing','Google exchange is not deployed');
    const code=(error.body as {code?:string})?.code;
    if(code==='profile-required'||code==='account-link-required')throw new ExchangeError(code,code);
   }
   if(isErrorWithCode(error)){
    if(error.code===statusCodes.SIGN_IN_CANCELLED)throw new ExchangeError('failed','cancelled');
    if(error.code===statusCodes.PLAY_SERVICES_NOT_AVAILABLE)throw new ExchangeError('play-services','Google Play Services unavailable');
   }
   throw new ExchangeError('failed','Google sign-in failed');
  }finally{setBusy(false)}
 };
 return {signIn,busy,ready:configured,configured};
}
