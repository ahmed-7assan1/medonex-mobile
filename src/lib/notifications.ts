import {useQuery} from '@tanstack/react-query';
import {api} from './api';
import {useLiveEnabled} from './query-mode';
export type NotificationItem={id:string;channel:string;title:string;body:string;createdAt:string;read:boolean;linkUrl?:string|null;postId?:string|null};
export function useNotifications(open:boolean){const live=useLiveEnabled();return useQuery({queryKey:['notifications'],queryFn:()=>api.get<{notifications:NotificationItem[];unreadCount:number}>('/notifications'),enabled:live&&open,retry:1})}
