import {useLocalSearchParams,useRouter} from 'expo-router';
import{useStudentDimensions}from'@/lib/student-viewport';
import{DesktopSocial}from'@/components/social/DesktopSocial';
import {CommentsSheet} from '@/components/social/CommentsSheet';
import { ResourceState } from '@/components/ResourceState';
import { MobilePageHeader } from '@/components/MobilePageHeader';
import React, { useEffect,useMemo, useState } from 'react';
import { View, Text, Pressable, FlatList, RefreshControl, StyleSheet,Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SquarePen, Users } from 'lucide-react-native';
import { GlassFab } from '@/components/GlassFab';
import { LIST_PERF } from '@/theme/perf';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { useForums, useCommunityFeed } from '@/lib/community';
import { ForumTabs } from '@/components/social/ForumTabs';
import { RoomsRow } from '@/components/social/RoomsRow';
import { PostCard } from '@/components/social/PostCard';
import { SCROLL_BOTTOM_PAD } from '@/theme/tokens';

/** OneX Community phone feed — forum tabs + rooms row + flat post rows,
 *  replicating community-mobile/CommunityFeed. Guests get the sign-in
 *  state (the site redirects guests to /login). */
export default function SocialScreen(){const{viewportWidth}=useStudentDimensions();return viewportWidth>=768?<DesktopSocial/>:<SocialPhone/>}
function SocialPhone() {
  const { st, colors, fonts, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const router=useRouter();
  const params=useLocalSearchParams<{post?:string}>();const [deepPost,setDeepPost]=useState<string|null>(null);
  useEffect(()=>{if(params.post)setDeepPost(params.post)},[params.post]);
  const forums = useForums();
  const [activeForum, setActiveForum] = useState<string | null>(null);
  const selectedForum=forums.data?.find(f=>f.id===activeForum)||forums.data?.[0];
  const selectedType=selectedForum?.type.toLowerCase()||'global';
  const feed = useCommunityFeed(selectedType==='private'?'global':selectedType);

  const posts = useMemo(() => selectedType==='private'?[]:feed.data?.items ?? [], [feed.data,selectedType]);
  const isGuest = forums.data === null || feed.data === null;

  if(!forums.data||!feed.data)return <ResourceState error={forums.error||feed.error} onRetry={()=>{forums.refetch();feed.refetch()}} title="Community"/>;

  return (
    <View style={[styles.root, { backgroundColor: st.bg, paddingTop: insets.top }]}>
      <MobilePageHeader title={i18n.language === 'ar' ? 'المجتمع' : 'Community'} />
      {forums.data && forums.data.length > 0 && (
        <ForumTabs forums={forums.data} activeId={activeForum ?? forums.data[0].id} onChange={setActiveForum} />
      )}

      <FlatList
        removeClippedSubviews
        windowSize={LIST_PERF.windowSize}
        maxToRenderPerBatch={LIST_PERF.maxToRenderPerBatch}
        initialNumToRender={LIST_PERF.initialNumToRender}
        data={posts}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PostCard post={item} />}
        ListHeaderComponent={<RoomsRow />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + SCROLL_BOTTOM_PAD }}
        refreshControl={
          <RefreshControl refreshing={feed.isRefetching} onRefresh={() => { forums.refetch(); feed.refetch(); }} tintColor={st.muted} />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View style={[styles.emptyIcon, { backgroundColor: st.surface, borderColor: st.border }]}>
              <Users size={28} color={colors.primary} />
            </View>
            <Text style={{ color: st.text, fontSize: 15, fontWeight: '700', fontFamily: fonts.sansBold }}>
              {selectedType==='private'?'Private forum not available in this version':isGuest ? t('social.signInTitle') : t('social.emptyTitle')}
            </Text>
            <Text style={{ color: st.muted, fontSize: 12, marginTop: 4, textAlign: 'center' }}>
              {isGuest ? t('social.signInDesc') : t('social.emptyDesc')}
            </Text>
          </View>
        }
      />

      {/* Create-post FAB — the site's new glass button style,
          pinned above the capsule (76px capsule + 12px gap + safe area). */}
      <View pointerEvents="box-none" style={[styles.fabWrap, { bottom: insets.bottom + 76 + 12 }]}>
        <GlassFab label="Create post" onPress={()=>router.push('/posts/new')}>
          <SquarePen size={18} color={isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)'} />
        </GlassFab>
      </View>
      <CommentsSheet postId={deepPost} onClose={()=>setDeepPost(null)}/>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  emptyWrap: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 80 },
  emptyIcon: { width: 64, height: 64, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  fabWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'flex-end', paddingRight: 16 },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
});
