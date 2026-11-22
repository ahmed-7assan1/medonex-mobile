import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SquarePen, Users } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { useForums, useCommunityFeed } from '@/lib/community';
import { ForumTabs } from '@/components/social/ForumTabs';
import { RoomsRow } from '@/components/social/RoomsRow';
import { PostCard } from '@/components/social/PostCard';

/** OneX Community phone feed — forum tabs + rooms row + flat post rows,
 *  replicating community-mobile/CommunityFeed. Guests get the sign-in
 *  state (the site redirects guests to /login). */
export default function SocialScreen() {
  const { st, colors, fonts, isDark } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const forums = useForums();
  const [activeForum, setActiveForum] = useState<string | null>(null);
  const feed = useCommunityFeed();

  const posts = useMemo(() => feed.data?.items ?? [], [feed.data]);
  const isGuest = forums.data === null || feed.data === null;

  return (
    <View style={[styles.root, { backgroundColor: st.bg, paddingTop: insets.top }]}>
      {forums.data && forums.data.length > 0 && (
        <ForumTabs forums={forums.data} activeId={activeForum ?? forums.data[0].id} onChange={setActiveForum} />
      )}

      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PostCard post={item} />}
        ListHeaderComponent={<RoomsRow />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={
          <RefreshControl refreshing={feed.isRefetching} onRefresh={() => { forums.refetch(); feed.refetch(); }} tintColor={st.muted} />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View style={[styles.emptyIcon, { backgroundColor: st.surface, borderColor: st.border }]}>
              <Users size={28} color={colors.primary} />
            </View>
            <Text style={{ color: st.text, fontSize: 15, fontWeight: '700', fontFamily: fonts.sansBold }}>
              {isGuest ? t('social.signInTitle') : t('social.emptyTitle')}
            </Text>
            <Text style={{ color: st.muted, fontSize: 12, marginTop: 4, textAlign: 'center' }}>
              {isGuest ? t('social.signInDesc') : t('social.emptyDesc')}
            </Text>
          </View>
        }
      />

      {/* Create-post FAB — pinned above the capsule like the site
          (76px capsule + 12px gap + safe area). */}
      <View pointerEvents="box-none" style={[styles.fabWrap, { bottom: insets.bottom + 76 + 12 }]}>
        <Pressable
          accessibilityLabel="Create post"
          onPress={() => { /* composer sheet — later phase */ }}
          style={({ pressed }) => [
            styles.fab,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.70)',
              borderColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.10)',
            },
            pressed && { transform: [{ scale: 0.95 }] },
          ]}
        >
          <SquarePen size={18} color={isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)'} />
        </Pressable>
      </View>
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
