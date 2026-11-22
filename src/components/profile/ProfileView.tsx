import React, { useState } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft, Star, BadgeCheck, GraduationCap, CalendarDays, Flame,
  Share2, Settings, Lock, Award,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { TABLET_BREAKPOINT } from '@/theme/tokens';
import { FIXTURE_PROFILE_POSTS, type FixtureProfileUser } from '@/lib/fixtures';
import { PostCard } from '@/components/social/PostCard';
import { FadeEdges } from '@/components/FadeEdges';

type TabId = 'posts' | 'quizzes' | 'saved' | 'achievements';

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

/** Pixel match of the site's ProfileHeader + ProfileMobile/DesktopLayout:
 *  centered identity with rank-ring avatar and rank badge, stats grid
 *  (2 cols phone / 4 cols tablet), tab strip (Posts / Quizzes / Saved /
 *  Achievements) with the site's blue underline. */
export function ProfileView({ user, isOwn }: { user: FixtureProfileUser; isOwn: boolean }) {
  const { t } = useTranslation();
  const { colors, fonts, st } = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tab, setTab] = useState<TabId>('posts');
  const [following, setFollowing] = useState(false);

  const posts = FIXTURE_PROFILE_POSTS[user.id] ?? [];
  const tabs: { id: TabId; label: string }[] = [
    { id: 'posts', label: t('profile.posts') },
    { id: 'quizzes', label: t('profile.quizzes') },
    ...(isOwn ? [{ id: 'saved' as TabId, label: t('profile.saved') }] : []),
    { id: 'achievements', label: t('profile.achievements') },
  ];

  const avatarSize = isTablet ? 140 : 120;

  const header = (
    <View style={{ alignItems: 'center', paddingTop: isTablet ? 8 : 20 }}>
      {/* Avatar + rank ring + rank badge */}
      <View style={{ width: avatarSize + 16, height: avatarSize + 16, marginBottom: 14 }}>
        <LinearGradient
          colors={[user.rankColor, user.rankColor + '40']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: (avatarSize + 16) / 2 }]}
        />
        <View style={{
          position: 'absolute', top: 8, left: 8, width: avatarSize, height: avatarSize,
          borderRadius: avatarSize / 2, backgroundColor: st.bg,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <View style={{
            width: avatarSize - 12, height: avatarSize - 12, borderRadius: (avatarSize - 12) / 2,
            backgroundColor: colors.primary + '1A', alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ color: colors.primary, fontSize: avatarSize / 2.8, fontFamily: fonts.display }}>{initials(user.name)}</Text>
          </View>
        </View>
        <View style={[styles.rankBadge, { borderColor: user.rankColor + '55', shadowColor: st.bg }]}>
          <Star size={13} color="#E8C777" fill="#E8C777" />
          <Text style={{ color: '#E8C777', fontSize: 11.5, fontFamily: fonts.sansBold, letterSpacing: 0.4 }}>{user.rank}</Text>
        </View>
      </View>

      {/* Name + handle */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ color: st.text, fontSize: 22, fontFamily: fonts.display }}>{user.name}</Text>
        {user.verified && <BadgeCheck size={19} color="#1DA1F2" />}
      </View>
      <Text style={{ color: st.muted, fontSize: 15, fontFamily: fonts.sans, marginTop: 2 }}>@{user.handle}</Text>

      {/* Bio */}
      <Text style={{ color: st.text, fontSize: 14.5, lineHeight: 22, fontFamily: fonts.sans, textAlign: 'center', marginTop: 10, paddingHorizontal: 8 }}>
        {user.bio}
      </Text>

      {/* Meta line */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 14, rowGap: 6, marginTop: 10 }}>
        <View style={styles.metaItem}>
          <GraduationCap size={15} color={st.muted} />
          <Text style={{ color: st.muted, fontSize: 13.5, fontFamily: fonts.sans }}>{user.semester} — {user.university}</Text>
        </View>
        <View style={styles.metaItem}>
          <CalendarDays size={15} color={st.muted} />
          <Text style={{ color: st.muted, fontSize: 13.5, fontFamily: fonts.sans }}>{t('profile.joined', { date: user.joined })}</Text>
        </View>
        {user.streak > 0 && (
          <View style={styles.metaItem}>
            <Flame size={15} color={st.muted} />
            <Text style={{ color: st.muted, fontSize: 13.5, fontFamily: fonts.sans }}>{t('profile.dayStreak', { count: user.streak })}</Text>
          </View>
        )}
      </View>

      {/* Action pills */}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('profile.share')} style={[styles.iconPill, { borderColor: st.border }]}>
          <Share2 size={16} color={st.text} />
        </Pressable>
        {isOwn ? (
          <>
            <Pressable accessibilityRole="button" style={[styles.pill, { borderColor: st.border, borderWidth: 1 }]}>
              <Text style={{ color: st.text, fontSize: 14, fontFamily: fonts.sansBold }}>{t('profile.editProfile')}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={t('profile.settings')} onPress={() => router.push('/settings')} style={[styles.iconPill, { borderColor: st.border }]}>
              <Settings size={16} color={st.text} />
            </Pressable>
          </>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: following }}
            onPress={() => setFollowing((f) => !f)}
            style={[styles.pill, following ? { borderColor: st.border, borderWidth: 1 } : { backgroundColor: st.text }]}
          >
            <Text style={{ color: following ? st.text : st.bg, fontSize: 14, fontFamily: fonts.sansBold }}>
              {following ? t('profile.following') : t('profile.follow')}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  const stats = (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 20 }}>
      {user.stats.map((s) => (
        <View
          key={s.label}
          style={[
            styles.statCard,
            { width: isTablet ? (Math.min(width, 1080) - 32 - 36) / 4 : (width - 32 - 12) / 2 },
            s.accent
              ? { backgroundColor: '#E8C77714', borderColor: '#E8C77755' }
              : { backgroundColor: st.surface, borderColor: st.border },
          ]}
        >
          <Text style={{ color: s.accent ? '#E8C777' : st.text, fontSize: 24, fontFamily: fonts.sansBold, letterSpacing: -0.5 }}>{s.value}</Text>
          <Text style={{ color: st.muted, fontSize: 11.5, fontFamily: fonts.sans, marginTop: 6 }}>{t(`profile.stat.${s.label}`, s.label)}</Text>
        </View>
      ))}
    </View>
  );

  const pane = (
    <View style={{ paddingTop: 16 }}>
      {tab === 'posts' && posts.map((p) => <PostCard key={p.id} post={p as never} />)}
      {tab === 'quizzes' && (
        <View style={{ gap: 10 }}>
          {user.quizHistory.map((q) => (
            <View key={q.id} style={[styles.rowCard, { backgroundColor: st.surface, borderColor: st.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: st.text, fontSize: 15, fontFamily: fonts.sansBold }}>{q.title}</Text>
                <Text style={{ color: st.muted, fontSize: 12.5, fontFamily: fonts.sans, marginTop: 3 }}>{q.date}</Text>
              </View>
              <Text style={{ color: q.score >= 80 ? '#34C759' : '#E8C777', fontSize: 18, fontFamily: fonts.sansBold }}>{q.score}%</Text>
            </View>
          ))}
        </View>
      )}
      {tab === 'saved' && (FIXTURE_TEAM_POSTS_SAVED(user.id)).map((p) => <PostCard key={p.id} post={p as never} />)}
      {tab === 'achievements' && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {user.achievements.map((a) => (
            <View
              key={a.id}
              style={[
                styles.achCard,
                { width: isTablet ? (Math.min(width, 1080) - 32 - 36) / 4 : (width - 32 - 12) / 2, backgroundColor: st.surface, borderColor: st.border },
                !a.unlocked && { opacity: 0.45 },
              ]}
            >
              {a.unlocked ? <Award size={26} color="#E8C777" /> : <Lock size={24} color={st.muted} />}
              <Text style={{ color: st.text, fontSize: 14, fontFamily: fonts.sansBold, marginTop: 10, textAlign: 'center' }}>{a.title}</Text>
              <Text style={{ color: st.muted, fontSize: 12, fontFamily: fonts.sans, marginTop: 4, textAlign: 'center', lineHeight: 17 }}>{a.desc}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: st.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}>
        {/* Tablet: standalone fixed-style back button (desktop layout) */}
        <View style={{ width: '100%', maxWidth: 1080, alignSelf: 'center', paddingHorizontal: 16 }}>
          <View style={{ paddingTop: insets.top + (isTablet ? 16 : 8), alignItems: 'flex-start' }}>
            <Pressable
              accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()}
              style={[styles.iconPill, { borderColor: st.border, backgroundColor: st.surface + '99' }]}
            >
              <ArrowLeft size={16} color={st.muted} />
            </Pressable>
          </View>
          {header}
          {stats}
          {/* Tab strip — blue underline under the active label (site: #1D9BF0) */}
          <View style={[styles.tabStrip, { borderBottomColor: st.border }]}>
            {tabs.map((tb) => {
              const on = tab === tb.id;
              return (
                <Pressable key={tb.id} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => setTab(tb.id)} style={styles.tabBtn}>
                  <Text style={{ color: on ? st.text : st.muted, fontSize: 14, fontFamily: on ? fonts.sansBold : fonts.sans }}>{tb.label}</Text>
                  {on && <View style={styles.tabBar} />}
                </Pressable>
              );
            })}
          </View>
          {pane}
        </View>
      </ScrollView>
      {!isTablet && <FadeEdges bottom />}
    </View>
  );
}

function FIXTURE_TEAM_POSTS_SAVED(userId: string) {
  return (FIXTURE_PROFILE_POSTS[userId] ?? []).filter((p) => p.isSaved);
}

const styles = StyleSheet.create({
  rankBadge: {
    position: 'absolute', bottom: -4, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#11161d', borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 5, paddingLeft: 9,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pill: { height: 36, borderRadius: 18, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  iconPill: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  statCard: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 18 },
  tabStrip: { flexDirection: 'row', borderBottomWidth: 1, marginTop: 24 },
  tabBtn: { flex: 1, height: 52, alignItems: 'center', justifyContent: 'center', gap: 10 },
  tabBar: { height: 4, borderRadius: 2, backgroundColor: '#1D9BF0', alignSelf: 'stretch', marginHorizontal: 24, position: 'absolute', bottom: 0, left: 0, right: 0 },
  rowCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, padding: 16 },
  achCard: { borderRadius: 16, borderWidth: 1, padding: 18, alignItems: 'center' },
});
