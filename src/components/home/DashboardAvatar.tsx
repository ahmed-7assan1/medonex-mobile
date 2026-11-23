import React,{useId}from'react';
import{Image}from'react-native';
import{SvgXml}from'react-native-svg';
import{socialMediaUrl}from'@/components/social/DesktopTweetCard';
/** Same high-resolution transforms and grayscale as the source desktop leaderboard. */
export function DashboardAvatar({uri,label,size,grayscale=false}:{uri:string;label:string;size:number;grayscale?:boolean}){
 const id='avatar'+useId().replace(/[^a-zA-Z0-9]/g,'');
 let source=socialMediaUrl(uri);if(!source)return null;
 const url=new URL(source);if(url.hostname==='lh3.googleusercontent.com')source=source.replace(/=s\d+(-c)?/,'=s512-c');else if(url.hostname==='res.cloudinary.com')source=source.replace(/\/image\/upload\//,'/image/upload/w_512,q_auto:best,c_fill,g_face/');
 if(!grayscale)return <Image source={{uri:source}} accessibilityLabel={label} style={{width:size,height:size}} resizeMode="cover"/>;
 const escaped=source.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
 const xml='<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 '+size+' '+size+'"><defs><filter id="'+id+'"><feColorMatrix type="saturate" values="0"/></filter></defs><image x="0" y="0" width="'+size+'" height="'+size+'" preserveAspectRatio="xMidYMid slice" href="'+escaped+'" filter="url(#'+id+')"/></svg>';
 return <SvgXml xml={xml} width={size} height={size} accessibilityLabel={label}/>;
}
