import {API_V1_URL,authHeaders} from './api';
import {isGuestMode} from './fixtures';
/** Credentials only accompany the first-party file-ID resolver, never raw storage URLs. */
export async function lectureFileDelivery(fileId:string,owner?:string):Promise<{url:string;headers:Record<string,string>}>{
 if(isGuestMode()||!fileId)throw Error('Sign in to download this file.');
 const auth=await authHeaders(undefined,owner);const token=auth.get('Authorization');
 if(!token)throw Error('Sign in again to download this file.');
 return {url:API_V1_URL+'/download-proxy?fileId='+encodeURIComponent(fileId),headers:{Authorization:token,Accept:'application/octet-stream'}};
}
