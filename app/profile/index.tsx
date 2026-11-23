import React from 'react';
import {ProfileView} from '@/components/profile/ProfileView';
import {ResourceState} from '@/components/ResourceState';
import {useProfile} from '@/lib/profile';
export default function OwnProfileScreen(){const resource=useProfile('me');if(!resource.data)return <ResourceState error={resource.error} onRetry={()=>resource.refetch()} title="Profile"/>;return <ProfileView user={resource.data.user} posts={resource.data.posts} avatarUrl={resource.data.image} isOwn/>}
