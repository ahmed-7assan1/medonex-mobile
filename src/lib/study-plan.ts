import {useQuery} from '@tanstack/react-query';
import {api} from './api';
import {useLiveEnabled} from './query-mode';
import {FIXTURE_MODULE_BUNDLE,FIXTURE_COMPLETIONS,FIXTURE_TASKS,isFixtureMode,type FixtureTask} from './fixtures';
export type CurriculumModule={id:string;name:string;subjects:{id:string;name:string;lectures:{id:string;title:string}[]}[]};
export function useStudyPlan(){const query=useQuery({queryKey:['study-plan'],queryFn:()=>api.get<{modules:CurriculumModule[];completions:Record<string,boolean>}>('/study-plan'),enabled:useLiveEnabled(),retry:1});return {...query,data:isFixtureMode()?{modules:[FIXTURE_MODULE_BUNDLE.module],completions:FIXTURE_COMPLETIONS}:query.data}}
export function useTasks(date:Date){const start=new Date(date);start.setHours(0,0,0,0);const end=new Date(date);end.setHours(23,59,59,999);const key=start.toISOString();const query=useQuery({queryKey:['tasks',key],queryFn:()=>api.get<FixtureTask[]>(`/tasks?start=${encodeURIComponent(key)}&end=${encodeURIComponent(end.toISOString())}`),enabled:useLiveEnabled(),retry:1});return {...query,data:isFixtureMode()?FIXTURE_TASKS:query.data?.map(t=>({...t,priority:t.priority??'MEDIUM'}))}}
