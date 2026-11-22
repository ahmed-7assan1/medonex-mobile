import React, { useState } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft, Users, ShieldCheck, CheckCircle2, MoreHorizontal, Activity,
  BookOpen, Plus, UserMinus,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { TABLET_BREAKPOINT } from '@/theme/tokens';
import { FIXTURE_TEAMS, FIXTURE_TEAM_MEMBERS, FIXTURE_TEAM_POSTS } from '@/lib/fixtures';
import { PostCard } from '@/components/social/PostCard';

type TabId = 'feed' | 'tasks' | 'flashcards' | 'leaderboard' | 'members';

/** /teams/[teamId] — pixel match of the site's TeamProfilePage: cover
 *  banner with bottom gradient + glass back, mobile stats row, overlapping
 *  rounded-[32] avatar, name + verified check, faculty line, Follow pill,
 *  About card, and the tab strip (Community Feed / Tasks / Flashcards /
 *  Leaderboard / Members) with its panes. Fixture data until wiring. */
export default function TeamProfileScreen() {
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const { colors, fonts, st } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;

  const team = FIXTURE_TEAMS.find((tm) => tm.id === teamId) ?? FIXTURE_TEAMS[0];
  const [tab, setTab] = useState<TabId>('feed');
  const [following, setFollowing] = useState(false);
  const [members, setMembers] = useState(FIXTURE_TEAM_MEMBERS);

  const initials = (name: string) =>
    name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  const tabs: { id: TabId; label: string }[] = [
    { id: 'feed', label: t('teams.feed') },
    { id: 'tasks', label: t('teams.tasks') },
    { id: 'flashcards', label: t('teams.flashcards') },
    { id: 'leaderboard', label: t('teams.leaderboard') },
    { id: 'members', label: t('teams.members') },
  ];

  return (
    <View style={[styles.root, { backgroundColor: st.bg }]}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}>
        {/* Cover */}
        <View style={[styles.cover, { backgroundColor: colors.muted + '66' }]}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.primary + '14' }]} />
          <LinearGradient
            pointerEvents="none"
            colors={[`${st.bg}00`, st.bg]}
            style={StyleSheet.absoluteFill}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            style={[styles.backBtn, { top: insets.top + 12, backgroundColor: st.surface + '99', borderColor: st.border }]}
          >
            <ArrowLeft size={20} color={st.text} />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 16, maxWidth: 1024, width: '100%', alignSelf: 'center' }}>
          {/* Mobile stats row */}
          {!isTablet && (
            <View style={[styles.statsRowMobile, { borderBottomColor: st.border }]}>
              {[
                { label: t('teams.followers'), value: team.followersCount + (following ? 1 : 0) },
                { label: t('teams.lectures'), value: team.lectures },
                { label: t('teams.posts'), value: team.posts },
              ].map((s, i) => (
                <React.Fragment key={s.label}>
                  {i > 0 && <View style={{ width: 1, height: 32, backgroundColor: st.border }} />}
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: st.muted, fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</Text>
                    <Text style={{ color: st.text, fontSize: 18, fontFamily: fonts.sansBold }}>{s.value}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          )}

          {/* Profile header */}
          <View style={[styles.profileHead, isTablet && { flexDirection: 'row', alignItems: 'flex-end', gap: 24 }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primary + '1A', borderColor: st.bg }]}>
              <Text style={{ color: colors.primary, fontSize: 44, fontFamily: fonts.display }}>{initials(team.name)}</Text>
            </View>
            <View style={{ flex: 1, gap: 12 }}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ color: st.text, fontSize: isTablet ? 36 : 28, fontFamily: fonts.display }}>{team.name}</Text>
                  <CheckCircle2 size={24} color={colors.primary} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <ShieldCheck size={16} color={colors.primary} />
                  <Text style={{ color: st.muted, fontSize: 11, fontFamily: fonts.sansBold, letterSpacing: 1.4, textTransform: 'uppercase' }}>{team.faculty}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: following }}
                  onPress={() => setFollowing((f) => !f)}
                  style={[
                    styles.followBtn,
                    following
                      ? { backgroundColor: st.surface, borderColor: st.border, borderWidth: 1 }
                      : { backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={{ color: following ? st.text : colors.primaryForeground, fontSize: 12, fontFamily: fonts.sansBold, letterSpacing: 1.4, textTransform: 'uppercase' }}>
                    {following ? t('teams.following') : t('teams.followTeam')}
                  </Text>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="More" style={[styles.moreBtn, { backgroundColor: st.surface, borderColor: st.border }]}>
                  <MoreHorizontal size={20} color={st.muted} />
                </Pressable>
              </View>
            </View>
          </View>

          {/* About */}
          <View style={[styles.about, { backgroundColor: st.surface, borderColor: st.border }]}>
            <Text style={{ color: isTablet ? colors.primary : st.muted, fontSize: 11, fontFamily: fonts.sansBold, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
              {t('teams.about')}
            </Text>
            <Text style={{ color: st.muted, fontSize: 16, fontFamily: fonts.sansMedium, lineHeight: 24 }}>{team.description}</Text>
          </View>

          {/* Tabs */}
          <View style={[styles.tabStrip, { borderBottomColor: st.border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 32, paddingHorizontal: 8 }}>
              {tabs.map((tb) => (
                <Pressable
                  key={tb.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: tab === tb.id }}
                  onPress={() => setTab(tb.id)}
                  style={[styles.tabBtn, tab === tb.id && { borderBottomColor: colors.primary }]}
                >
                  <Text style={{
                    color: tab === tb.id ? st.text : st.muted,
                    fontSize: 11, fontFamily: fonts.sansBold, letterSpacing: 1.4, textTransform: 'uppercase',
                  }}>
                    {tb.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Panes */}
          {tab === 'feed' && (
            <View style={{ gap: 16, marginTop: 24 }}>
              {FIXTURE_TEAM_POSTS.map((p) => (
                <PostCard key={p.id} post={p as never} />
              ))}
            </View>
          )}

          {tab === 'tasks' && (
            <View style={[styles.paneEmpty, { borderColor: st.border, backgroundColor: st.surface }]}>
              <Activity size={64} color="#10B98180" style={{ marginBottom: 24 }} />
              <Text style={{ color: st.text, fontSize: 20, fontFamily: fonts.sansBold, marginBottom: 8 }}>{t('teams.simulationTasks')}</Text>
              <Text style={{ color: st.muted, fontSize: 12, fontFamily: fonts.sansBold, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center', lineHeight: 18 }}>
                {t('teams.simulationTasksSub')}
              </Text>
            </View>
          )}

          {tab === 'flashcards' && (
            <View style={[styles.paneEmpty, { borderColor: st.border, backgroundColor: st.surface }]}>
              <BookOpen size={64} color="#6366F180" style={{ marginBottom: 24 }} />
              <Text style={{ color: st.text, fontSize: 20, fontFamily: fonts.sansBold, marginBottom: 8 }}>{t('teams.teamFlashcards')}</Text>
              <Text style={{ color: st.muted, fontSize: 12, fontFamily: fonts.sansBold, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center', lineHeight: 18 }}>
                {t('teams.teamFlashcardsSub')}
              </Text>
            </View>
          )}

          {tab === 'leaderboard' && (
            <View style={[styles.leaderboard, { backgroundColor: st.surface, borderColor: st.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                <Activity size={20} color="#F59E0B" />
                <Text style={{ color: st.text, fontSize: 16, fontFamily: fonts.sansBold, letterSpacing: 1.4, textTransform: 'uppercase' }}>
                  {t('teams.activeRankings')}
                </Text>
              </View>
              <View style={{ gap: 12 }}>
                {members.map((m, idx) => (
                  <View key={m.userId} style={[styles.rankRow, { backgroundColor: colors.muted + '4D' }]}>
                    <Text style={{ color: colors.primary, fontSize: 14, fontFamily: fonts.sansBold, width: 24 }}>#{idx + 1}</Text>
                    <View style={[styles.rankAvatar, { backgroundColor: colors.primary + '1A' }]}>
                      <Text style={{ color: colors.primary, fontSize: 12, fontFamily: fonts.sansBold }}>{initials(m.name)}</Text>
                    </View>
                    <Text style={{ color: st.text, fontSize: 14, fontFamily: fonts.sansMedium, flex: 1 }}>{m.name}</Text>
                    <Text style={{ color: st.muted, fontSize: 12, fontFamily: fonts.sansBold }}>{(members.length - idx) * 120} {t('teams.pts')}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {tab === 'members' && (
            <View style={{ gap: 12, marginTop: 24 }}>
              <Pressable accessibilityRole="button" style={[styles.addMember, { borderColor: st.border }]}>
                <Plus size={16} color={st.muted} />
                <Text style={{ color: st.muted, fontSize: 14, fontFamily: fonts.sansBold }}>{t('teams.addMember')}</Text>
              </Pressable>
              {members.map((m) => (
                <View key={m.userId} style={[styles.memberRow, { backgroundColor: st.surface, borderColor: st.border }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 }}>
                    <View style={[styles.memberAvatar, { backgroundColor: colors.muted }]}>
                      <Text style={{ color: colors.primary, fontSize: 14, fontFamily: fonts.sansBold }}>{initials(m.name)}</Text>
                    </View>
                    <View>
                      <Text style={{ color: st.text, fontSize: 14, fontFamily: fonts.sansBold }}>{m.name}</Text>
                      <View style={[styles.rolePill, m.role === 'LEADER' ? { backgroundColor: colors.primary + '33' } : { backgroundColor: colors.muted }]}>
                        <Text style={{ color: m.role === 'LEADER' ? colors.primary : st.muted, fontSize: 9, fontFamily: fonts.sansBold, letterSpacing: 1 }}>{m.role}</Text>
                      </View>
                    </View>
                  </View>
                  {m.role !== 'LEADER' && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Remove member"
                      onPress={() => setMembers((ms) => ms.filter((x) => x.userId !== m.userId))}
                      style={[styles.removeBtn, { backgroundColor: 'rgba(239,68,68,0.10)' }]}
                    >
                      <UserMinus size={16} color="#EF4444" />
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  cover: { height: 192, width: '100%', overflow: 'hidden' },
  backBtn: {
    position: 'absolute', left: 16, zIndex: 10,
    width: 40, height: 40, borderRadius: 20, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  statsRowMobile: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingVertical: 16, borderBottomWidth: 1, marginBottom: 24,
  },
  profileHead: { marginTop: -64, marginBottom: 32, gap: 16 },
  avatar: {
    width: 128, height: 128, borderRadius: 32, borderWidth: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  followBtn: {
    height: 36, borderRadius: 18, paddingHorizontal: 24, minWidth: 130,
    alignItems: 'center', justifyContent: 'center',
  },
  moreBtn: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  about: { borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 24, overflow: 'hidden' },
  tabStrip: { borderBottomWidth: 1 },
  tabBtn: {
    paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  paneEmpty: {
    borderRadius: 16, borderWidth: 1, borderStyle: 'dashed',
    alignItems: 'center', paddingVertical: 64, paddingHorizontal: 24, marginTop: 24,
  },
  leaderboard: { borderRadius: 16, borderWidth: 1, padding: 20, marginTop: 24 },
  rankRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12, padding: 12,
  },
  rankAvatar: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  addMember: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', paddingVertical: 16,
  },
  memberRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 16, borderWidth: 1, padding: 16,
  },
  memberAvatar: {
    width: 48, height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  rolePill: {
    alignSelf: 'flex-start', borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 2, marginTop: 4,
  },
  removeBtn: { padding: 8, borderRadius: 12 },
});
