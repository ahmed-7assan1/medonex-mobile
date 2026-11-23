import {useEffect,useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {apiV1} from './api';
import {useLiveEnabled} from './query-mode';
export type SearchResult={id:string;label:string;sub:string;href:string;type:string};
export function useSearch(query:string){const [debounced,setDebounced]=useState(query.trim());useEffect(()=>{const timer=setTimeout(()=>setDebounced(query.trim()),300);return()=>clearTimeout(timer)},[query]);const live=useLiveEnabled();return useQuery({queryKey:['search',debounced],queryFn:async()=>{const raw=await apiV1.get<Record<string,SearchResult[]>>(`/search?q=${encodeURIComponent(debounced)}`);return ['lectures','quizzes','modules','users'].flatMap(type=>(raw[type]??[]).map(r=>({...r,type,href:type==='users'?`/profile/${r.id}`:r.href})))},enabled:live&&debounced.length>=2,retry:1})}
