import {useQuery} from '@tanstack/react-query';
import {api} from './api';
import {fixtureQuiz,isFixtureMode,type FixtureQuiz} from './fixtures';
import {useLiveEnabled} from './query-mode';
export type QuizData=FixtureQuiz&{websiteOnly?:boolean;source:'paper'|'lecture'};
export function normalizeQuiz(raw:any,source:'paper'|'lecture'):QuizData{const meta=raw.pastPaper??raw.lecture;const questions=Array.isArray(raw.questions)?raw.questions:[];return {id:meta.id,title:meta.title,timeLimitMin:meta.timeLimitMin??null,source,websiteOnly:meta.secureExamMode===true||questions.some((q:any)=>['ESSAY','MULTI_SELECT'].includes(q.questionType)),questions:questions.map((q:any)=>({...q,choices:Array.isArray(q.choices)?q.choices:[],explanation:q.explanation??'',difficulty:q.difficulty??'MEDIUM'}))}}
export function useQuizData(id:string,source:'paper'|'lecture'){const live=useLiveEnabled();const query=useQuery({queryKey:['quiz-player',source,id],queryFn:async()=>normalizeQuiz(await api.get<any>(`/${source==='lecture'?'lectures':'past-papers'}/${encodeURIComponent(id)}/questions`),source),enabled:live&&!!id,retry:1});return {...query,data:isFixtureMode()?{...fixtureQuiz(id),source}:query.data}}
