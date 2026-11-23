import {useInfiniteQuery,useQuery} from '@tanstack/react-query';
import {api} from './api';
import {useLiveEnabled} from './query-mode';
import {FIXTURE_PROFILE_USERS,FIXTURE_PROFILE_POSTS,isFixtureMode,type FixtureProfileUser} from './fixtures';
import {normalizeFeedPost,type Post} from './community';
const rankColors:Record<string,string>={Newbie:'#64748B',Active:'#06B6D4',Contributor:'#8B5CF6',Expert:'#D97706',Elite:'#E11D48'};
export function normalizeProfile(raw:any,stats?:any):FixtureProfileUser{
 const u=raw.user;if(!u||typeof u.id!=='string')throw Error('Invalid profile response');
 const rank=u.hideRank?'':u.rank?.label||(u.points>=1500?'Elite':u.points>=500?'Expert':u.points>=200?'Contributor':u.points>=50?'Active':'Newbie');
 const count=typeof stats?.totalAttempts==='number'?stats.totalAttempts:u._count?.quizAttempts;
 const format=(n:number)=>n.toLocaleString('en-US');
 return {id:u.id,name:u.name||u.nickname||'Member',handle:u.handle||u.nickname||u.studentId||'user',bio:u.bio||'',university:u.university?.name||'',semester:u.semester?.name||'',rank,rankColor:rankColors[rank]||'#64748B',coverImage:u.coverImage||null,role:u.role,hideRank:u.hideRank===true,postCount:typeof u._count?.posts==='number'?u._count.posts:undefined,streak:typeof stats?.streak==='number'?stats.streak:undefined,joined:u.createdAt?new Date(u.createdAt).toLocaleDateString('en-US',{month:'long',year:'numeric',timeZone:'UTC'}):'',verified:u.telegramVerified===true,stats:[...(typeof u.points==='number'?[{label:'Experience points',value:format(u.points),accent:true}]:[]),...(typeof count==='number'?[{label:'Completed quizzes',value:format(count)}]:[]),...(typeof stats?.avgScore==='number'?[{label:'Average accuracy',value:`${stats.avgScore}%`}]:[]),...(typeof u._count?.followers==='number'?[{label:'Followers',value:u._count.followers>=1000?(u._count.followers/1000).toFixed(1)+'k':String(u._count.followers)}]:[])],quizHistory:(u.quizAttempts??[]).filter((q:any)=>typeof q.score==='number').map((q:any)=>({id:q.id,title:q.pastPaper?.title||q.lecture?.title||'Quiz',score:q.score,date:new Date(q.createdAt).toLocaleDateString()})),achievements:[]};
}
export function useProfile(id:string){
 const live=useLiveEnabled();const query=useQuery({queryKey:['profile',id],queryFn:async()=>{
  if(id==='me'){const [raw,posts]=await Promise.all([api.get<any>('/profile'),api.get<any>('/posts/mine?limit=60')]);return {user:normalizeProfile(raw,raw.profileStats),posts:(posts.posts??[]).map((p:any)=>normalizeFeedPost(p,raw.user.id)) as Post[],private:false,isFollowing:false,image:raw.user.image as string|null}}
  const raw=await api.get<any>(`/users/${encodeURIComponent(id)}`);return {user:normalizeProfile(raw,raw.profileStats),posts:(raw.posts??[]).map((p:any)=>normalizeFeedPost(p)) as Post[],private:Boolean(raw.user.isPrivate),isFollowing:Boolean(raw.isFollowing),image:raw.user.image as string|null};
 },enabled:live&&Boolean(id),retry:1});
 const fixture=FIXTURE_PROFILE_USERS[id];return {...query,data:isFixtureMode()?(fixture?{user:fixture,posts:(FIXTURE_PROFILE_POSTS[fixture.id]??[]) as unknown as Post[],private:false,isFollowing:false,image:null}:undefined):query.data,notFound:isFixtureMode()&&!fixture};
}
export function useSavedPosts(enabled:boolean){return useInfiniteQuery({queryKey:['saved-posts'],enabled:useLiveEnabled()&&enabled,retry:1,initialPageParam:1,queryFn:async({pageParam})=>{const raw=await api.get<{posts:any[];page:number;pages:number}>('/posts/saved?page='+pageParam+'&limit=20');return{posts:raw.posts.map(post=>normalizeFeedPost(post)),page:raw.page,pages:raw.pages}},getNextPageParam:page=>page.page<page.pages?page.page+1:undefined})}
