import {useQuery} from '@tanstack/react-query';
import {apiV1} from './api';
import {useLiveEnabled} from './query-mode';
import {isFixtureMode,FIXTURE_TEAMS,FIXTURE_TEAM_MEMBERS,type FixtureTeam} from './fixtures';
export type Team=FixtureTeam&{imageUrl?:string;coverUrl?:string;isFollowing?:boolean;myRole?:string|null};
export type Member={userId:string;name:string;role:string;image?:string|null;points?:number};
export function normalizeTeam(t:any):Team{return {id:t.id,name:t.name,description:t.description??'',faculty:t.faculty?.name??'',followersCount:t.followersCount??t._count?.followers??0,lectures:t._count?.lectures??0,posts:t._count?.posts??0,imageUrl:t.imageUrl,coverUrl:t.coverUrl,isFollowing:t.isFollowing,myRole:t.myRole}}
export function useTeams(){const query=useQuery({queryKey:['teams'],queryFn:async()=>(await apiV1.get<any[]>('/teams')).map(normalizeTeam),enabled:useLiveEnabled(),retry:1});return {...query,data:(isFixtureMode()?FIXTURE_TEAMS:query.data) as Team[]|undefined}}
export function useTeam(id:string){const query=useQuery({queryKey:['team',id],queryFn:async()=>{const [raw,members]=await Promise.all([apiV1.get<any>(`/teams/${encodeURIComponent(id)}`),apiV1.get<any[]>(`/teams/${encodeURIComponent(id)}/members`)]);return {team:normalizeTeam(raw),members:members.map((m):Member=>({userId:m.userId,name:m.user.name,role:m.role,image:m.user.image,points:m.user.points}))}},enabled:useLiveEnabled()&&Boolean(id),retry:1});const team=FIXTURE_TEAMS.find(t=>t.id===id);return {...query,data:isFixtureMode()?(team?{team:team as Team,members:FIXTURE_TEAM_MEMBERS as Member[]}:undefined):query.data,notFound:isFixtureMode()&&!team}}
