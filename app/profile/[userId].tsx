import React from 'react';
import {useLocalSearchParams} from 'expo-router';
import {useAuth} from '@/lib/auth';
import {ProfileView} from '@/components/profile/ProfileView';
import {ResourceState} from '@/components/ResourceState';
import {useProfile} from '@/lib/profile';
export default function PublicProfileScreen(){const {userId}=useLocalSearchParams<{userId:string}>();const {user}=useAuth();const resource=useProfile(userId||'');const isOwn=!!resource.data&&resource.data.user.id===user?.id;if(!resource.data)return <ResourceState error={resource.error} notFound={resource.notFound} onRetry={()=>resource.refetch()} title="Profile"/>;return <ProfileView user={resource.data.user} posts={resource.data.posts} avatarUrl={resource.data.image} privateForViewer={resource.data.private&&!isOwn} initialFollowing={resource.data.isFollowing} isOwn={isOwn}/>}
