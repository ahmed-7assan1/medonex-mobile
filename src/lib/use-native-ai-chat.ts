import {useEffect,useRef,useState} from 'react';
import {useAuth} from './auth';
import {directAIReply,type AIMessage} from './native-ai';
export function useNativeAIChat(context='',contextId='main'){
 const {user,token,isGuest}=useAuth();const owner=user?.id||'';const identity=JSON.stringify([owner,contextId,token]);const current=useRef(identity);current.current=identity;
 const [stateIdentity,setStateIdentity]=useState(identity);
 const [messages,setMessages]=useState<AIMessage[]>([]),[draft,setDraft]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[source,setSource]=useState('');
 const running=useRef<AbortController|null>(null);
 useEffect(()=>{running.current?.abort();running.current=null;setStateIdentity(identity);setMessages([]);setDraft('');setError('');setSource('');setBusy(false);return()=>{running.current?.abort();running.current=null}},[identity,token]);
 const send=async()=>{
  const text=draft.trim();if(!text||running.current||stateIdentity!==identity)return;
  if(isGuest||!token||!owner){setError('Sign in to use your own AI provider.');return;}
  if(text.length>8000){setError('Keep each message under 8,000 characters.');return;}
  const account=current.current,controller=new AbortController();running.current=controller;
  const next:AIMessage[]=[...messages,{id:Date.now()+'.user',role:'user',text}];setMessages(next);setDraft('');setBusy(true);setError('');
  const timeout=setTimeout(()=>controller.abort(),60000);
  try{const reply=await directAIReply(owner,next,context,controller.signal);if(!controller.signal.aborted&&current.current===account){setMessages([...next,{id:Date.now()+'.assistant',role:'assistant',text:reply.text}]);setSource(reply.provider+' / '+reply.model)}}
  catch(e){if(current.current===account){setMessages(messages);setDraft(text);setError(controller.signal.aborted?'Request stopped. Your provider may still count work already started.':e instanceof Error?e.message:'AI request failed.');}}
  finally{clearTimeout(timeout);if(running.current===controller){running.current=null;if(current.current===account)setBusy(false)}}
 };
 return {messages:stateIdentity===identity?messages:[],draft:stateIdentity===identity?draft:'',setDraft,busy:stateIdentity===identity&&busy,error:stateIdentity===identity?error:'',source:stateIdentity===identity?source:'',send,cancel:()=>running.current?.abort(),clear:()=>{if(running.current)return;setMessages([]);setDraft('');setError('');setSource('')}};
}
