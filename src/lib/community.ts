import {useQuery,useInfiniteQuery} from '@tanstack/react-query';
import{normalizeRichPost,type RichPostData}from'./post-rich';
import {FIXTURE_FEED,FIXTURE_FORUMS,isFixtureMode} from './fixtures';
import {api,apiV1} from './api';
import {useLiveEnabled} from './query-mode';
import {useAuth} from './auth';
export type ForumType='GLOBAL'|'UNIVERSITY'|'FACULTY'|'SEMESTER'|'PRIVATE';
export interface Forum{id:string;name:string;type:ForumType;status:string;unreadCount?:number;_count?:{posts:number}}
export interface TierInfo{tier:string;label:string;available:boolean;forumId?:string|null;forumName?:string|null}
export interface UserSummary{id:string;name:string;avatarUrl:string|null;rankLabel?:string|null;telegramVerified?:boolean;handle?:string|null;role?:string|null;color?:string|null}
export interface Attachment{id:string;type:string;url:string;name?:string;size?:number}
export interface Post extends RichPostData{link?:string|null;updatedAt?:string|null;universityId?:string|null;id:string;content:string;imageUrl:string|null;attachments:Attachment[];author:UserSummary|null;isAnonymous:boolean;forumId:string;forumName?:string;isPinned:boolean;hashtags:string[];reactionCounts:Record<string,number>;userReaction:string|null;commentCount:number;shareCount:number;isSaved:boolean;likesCount?:number;createdAt:string}
export interface RoomSummary{id:string;name:string;isPublic?:boolean;isJoined?:boolean;image?:string|null;_count?:{members:number;posts:number}}
interface FeedPost extends Partial<Post>{author?:any;_count?:{likes?:number;comments?:number};likedByMe?:boolean;savedByMe?:boolean;reactions?:any}
export function normalizeFeedPost(p:FeedPost,userId?:string,forumName?:string):Post{
 const reactions:{type:string;userId:string}[]=Array.isArray(p.reactions)?p.reactions:[];
 const counts:Record<string,number>={};for(const r of reactions)counts[r.type]=(counts[r.type]??0)+1;
 return {...normalizeRichPost(p),link:typeof p.link==='string'?p.link:undefined,updatedAt:typeof p.updatedAt==='string'?p.updatedAt:undefined,universityId:typeof p.universityId==='string'?p.universityId:undefined,id:p.id!,content:p.content??'',imageUrl:p.imageUrl??null,attachments:Array.isArray(p.attachments)?p.attachments:[],author:p.author?{id:p.author.id,name:p.author.name??'Student',avatarUrl:p.author.image??p.author.avatarUrl??null,rankLabel:p.author.rank?.label??p.author.rankLabel??null,handle:p.author.handle,telegramVerified:p.author.telegramVerified,role:p.author.role,color:typeof p.author.color==='string'?p.author.color:undefined}:null,isAnonymous:Boolean(p.isAnonymous),forumId:p.forumId??'',forumName:p.forumName??forumName,isPinned:Boolean(p.isPinned),hashtags:(p.hashtags??[]).map((h:any)=>typeof h==='string'?h:h.hashtag?.name??h.name??'').filter(Boolean),reactionCounts:counts,userReaction:reactions.find(r=>r.userId===userId)?.type??(p.likedByMe||(p as any).isLiked?'HEART':null),commentCount:p._count?.comments??(p as any).commentsCount??p.commentCount??0,shareCount:(p._count as any)?.shares??p.shareCount??0,isSaved:Boolean(p.savedByMe??p.isSaved),likesCount:p._count?.likes??p.likesCount??p.reactions?.total??0,createdAt:p.createdAt??new Date(0).toISOString()};
}
export function useForums(){
 const q=useQuery({queryKey:['forums'],queryFn:()=>apiV1.get<Forum[]>('/forums'),staleTime:300000,enabled:useLiveEnabled()});
 return {...q,data:isFixtureMode()?FIXTURE_FORUMS:q.data};
}
export function useTiers(){return useQuery({queryKey:['community-tiers'],queryFn:()=>isFixtureMode()?Promise.resolve({tiers:[] as TierInfo[]}):apiV1.get<{tiers:TierInfo[]}>('/community/tiers'),staleTime:300000,enabled:useLiveEnabled()})}
export function useCommunityFeed(tier='global'){
 const {user}=useAuth();
 const q=useQuery({queryKey:['community-feed',tier],queryFn:async()=>{
  const response=await apiV1.get<{data:FeedPost[];nextCursor:string|null;hasMore:boolean;forum?:{name:string}}>(`/community/feed?limit=20&tier=${encodeURIComponent(tier)}`);
  return {items:response.data.map(p=>normalizeFeedPost(p,user?.id,response.forum?.name)),nextCursor:response.nextCursor,hasMore:response.hasMore};
 },staleTime:60000,enabled:useLiveEnabled()});
 const forum=FIXTURE_FORUMS.find(f=>f.type.toLowerCase()===tier);
 return {...q,data:isFixtureMode()?{...FIXTURE_FEED,items:FIXTURE_FEED.items.filter(p=>!forum||p.forumId===forum.id)}:q.data};
}
export function useRooms(){return useQuery({queryKey:['rooms'],queryFn:async()=>{
 if(isFixtureMode())return {myRoom:null,rooms:[] as RoomSummary[]};
 const [mine,all]=await Promise.all([api.get<RoomSummary[]>('/rooms/me'),apiV1.get<RoomSummary[]>('/rooms')]);
 return {myRoom:mine[0]??null,rooms:all.filter(r=>r.id!==mine[0]?.id)};
 },staleTime:300000,enabled:useLiveEnabled()})}
