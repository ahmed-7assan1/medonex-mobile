import React, { useMemo } from 'react';
import { View, Text, ScrollView, Image, Pressable, StyleSheet } from 'react-native';
import { BookOpen, ClipboardList, Users, Video, Sparkles, Layers, Mic2, Youtube, Trophy } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { useHome } from '@/lib/home';

/** Tablet (>=768dp) home, following the site's desktop dashboard
 *  (DashboardDesktopView): centered max-width content, "Platform Services"
 *  card grid, then Top Learners. The left rail comes from the tabs layout. */
const SERVICES = [
  { key: 'modules', tag: 'Learn', title: 'Interactive Lectures', desc: 'Curated medical lectures by top instructors.', href: '/modules', icon: BookOpen },
  { key: 'qbank', tag: 'Practice', title: 'QBank & Quizzes', desc: 'Test your knowledge with high-yield questions.', href: '/qbank', icon: ClipboardList },
  { key: 'videos', tag: 'Watch', title: 'OneX Videos & Reels', desc: 'High-yield video content for quick revision.', href: '/videos', icon: Video },
  { key: 'social', tag: 'Connect', title: 'Community Hub', desc: 'Join discussions and collaborate with peers.', href: '/social', icon: Users },
  { key: 'recordings', tag: 'Record', title: 'Recordings', desc: 'Access all recorded sessions and rewatch anytime.', href: '/recordings', icon: Layers },
  { key: 'ai', tag: 'AI', title: 'AI Medical Tutor', desc: 'AI-powered assistant for medical learning.', href: '/ai-chat', icon: Sparkles },
  { key: 'podcasts', tag: 'Listen', title: 'Podcasts', desc: 'Medical podcasts on the go.', href: '/podcasts', icon: Mic2 },
  { key: 'reels', tag: 'Reels', title: 'OneX Reels', desc: 'Short medical reels.', href: '/videos/reels', icon: Youtube },
] as const;

export function TabletHome() {
  const { colors, fonts } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const home = useHome();
  const topUsers = useMemo(() => home.data?.topUsers ?? [], [home.data]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.h2, { color: colors.foreground, fontFamily: fonts.sansBold }]}>{t('home.platformServices')}</Text>
      <View style={styles.grid}>
        {SERVICES.map((s) => {
          const Icon = s.icon;
          return (
            <Pressable
              key={s.key}
              onPress={() => router.push(s.href as never)}
              style={({ pressed }) => [
                styles.serviceCard,
                { backgroundColor: colors.card, borderColor: colors.border },
                pressed && { opacity: 0.85 },
              ]}
            >
              <View style={[styles.serviceIcon, { backgroundColor: colors.secondary }]}>
                <Icon size={22} color={colors.foreground} />
              </View>
              <Text style={[styles.serviceTag, { color: colors.mutedForeground }]}>{s.tag.toUpperCase()}</Text>
              <Text style={[styles.serviceTitle, { color: colors.foreground, fontFamily: fonts.sansBold }]}>{s.title}</Text>
              <Text style={[styles.serviceDesc, { color: colors.mutedForeground }]}>{s.desc}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.h2, { color: colors.foreground, fontFamily: fonts.sansBold, marginTop: 40 }]}>
        {t('home.topLearners')}
      </Text>
      <View style={styles.leaders}>
        {topUsers.map((u, i) => (
          <View key={u.id} style={[styles.leaderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.leaderRow}>
              {u.image ? (
                <Image source={{ uri: u.image }} style={styles.leaderAvatar} />
              ) : (
                <View style={[styles.leaderAvatar, { backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ color: colors.foreground, fontWeight: '700' }}>{(u.name ?? '?').charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ color: colors.foreground, fontSize: 14, fontWeight: '600' }}>{u.name ?? '—'}</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{u.rank?.label ?? ''}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Trophy size={14} color={colors.gold0} />
                <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{u.points}</Text>
              </View>
            </View>
            <Text style={[styles.leaderRank, { color: colors.mutedForeground }]}>#{i + 1}</Text>
          </View>
        ))}
        {topUsers.length === 0 && (
          <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>{t('common.loading')}</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { maxWidth: 1504, width: '100%', alignSelf: 'center', paddingHorizontal: 32, paddingTop: 28, paddingBottom: 48 },
  h2: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  serviceCard: { width: '31%', flexGrow: 1, minWidth: 200, borderRadius: 22, borderWidth: 1, padding: 18, gap: 6 },
  serviceIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  serviceTag: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  serviceTitle: { fontSize: 15, fontWeight: '600' },
  serviceDesc: { fontSize: 12, lineHeight: 17 },
  leaders: { gap: 10 },
  leaderCard: { borderRadius: 16, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center' },
  leaderRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  leaderAvatar: { width: 40, height: 40, borderRadius: 999 },
  leaderRank: { fontSize: 12, fontWeight: '700', marginLeft: 12 },
});
