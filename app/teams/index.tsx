import{useStudentDimensions as useWindowDimensions}from'@/lib/student-viewport';
import React, { useState } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, TextInput, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft, Search, Users, ShieldCheck, ArrowRight, Activity, BookOpen,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { FadeEdges } from '@/components/FadeEdges';
import { TABLET_BREAKPOINT, SCROLL_BOTTOM_PAD } from '@/theme/tokens';
import {useTeams} from '@/lib/teams';
import {ResourceState} from '@/components/ResourceState';
import { FIXTURE_TEAMS } from '@/lib/fixtures';

/** /teams — pixel match of the site's TeamsDirectory: search field, team
 *  cards (banner, faculty badge, overlapping rounded avatar, name,
 *  description, stats row + arrow circle). 1-col on phone, 3-col grid on
 *  tablet (site lg:grid-cols-3). Fixture data until the wiring phase. */
export default function TeamsScreen() {
  const { colors, fonts, st } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {viewportWidth, width } = useWindowDimensions();
  const isTablet = viewportWidth >= TABLET_BREAKPOINT;

  const [query, setQuery] = useState('');
  const resource=useTeams();
  const filtered = (resource.data??[]).filter(
    (team) =>
      team.name.toLowerCase().includes(query.toLowerCase()) ||
      team.faculty.toLowerCase().includes(query.toLowerCase()),
  );

  if(!resource.data)return <ResourceState error={resource.error} onRetry={()=>resource.refetch()} title={t('teams.title')}/>;

  const initials = (name: string) =>
    name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <View style={[styles.root, { backgroundColor: st.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.headerBtn}>
          <ArrowLeft size={19} color={st.text} />
        </Pressable>
        <Text style={{ color: st.text, fontSize: 15, fontFamily: fonts.sansSemiBold, flex: 1 }}>{t('teams.title')}</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + SCROLL_BOTTOM_PAD,
          maxWidth: 1024,
          width: '100%',
          alignSelf: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        {isTablet && (
          <View style={{ marginBottom: 32 }}>
            <Text style={{ color: colors.primary, fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: 4 }}>
              {t('teams.community')}
            </Text>
            <Text style={{ color: st.text, fontSize: 30, fontFamily: fonts.display, marginBottom: 8 }}>
              {t('teams.heading')}
            </Text>
            <Text style={{ color: st.muted, fontSize: 14, fontFamily: fonts.sansMedium, maxWidth: 640, lineHeight: 21 }}>
              {t('teams.subtitle')}
            </Text>
          </View>
        )}

        {/* Search */}
        <View style={[styles.search, { backgroundColor: st.surface, borderColor: st.border }, isTablet && { borderRadius: 999, height: 40 }]}>
          <Search size={16} color={st.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('teams.searchPlaceholder')}
            placeholderTextColor={st.muted}
            style={{ flex: 1, color: st.text, fontSize: 14, fontFamily: fonts.sans, padding: 0 }}
          />
        </View>

        <View style={[styles.grid, isTablet && { flexDirection: 'row', flexWrap: 'wrap' }]}>
          {filtered.map((team) => (
            <Pressable
              key={team.id}
              accessibilityRole="button"
              onPress={() => router.push(`/teams/${team.id}` as never)}
              style={[styles.card, { backgroundColor: st.surface, borderColor: st.border }, isTablet && { width: '31.5%', flexGrow: 1 }]}
            >
              {/* Banner */}
              <View style={[styles.banner, { backgroundColor: colors.muted + '66' }]}>
                {!!team.coverUrl&&<Image source={{uri:team.coverUrl}} style={StyleSheet.absoluteFill}/>}
                <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.primary + '1A' }]} />
                <View style={[styles.badge, { backgroundColor: st.surface, borderColor: st.border }]}>
                  <ShieldCheck size={12} color={colors.primary} />
                  <Text style={{ color: st.text, fontSize: 9, fontFamily: fonts.sansBold, letterSpacing: 1.4, textTransform: 'uppercase' }}>{team.faculty}</Text>
                </View>
              </View>

              {/* Body */}
              <View style={styles.cardBody}>
                <View style={[styles.avatar, { backgroundColor: colors.primary + '1A', borderColor: st.surface }]}>
                  <Text style={{ color: colors.primary, fontSize: 28, fontFamily: fonts.display }}>{initials(team.name)}</Text>{!!team.imageUrl&&<Image source={{uri:team.imageUrl}} style={StyleSheet.absoluteFill}/>}
                </View>
                <Text style={{ color: st.text, fontSize: 18, fontFamily: fonts.sansBold, marginBottom: 8 }}>{team.name}</Text>
                <Text numberOfLines={3} style={{ color: st.muted, fontSize: 14, fontFamily: fonts.sansMedium, lineHeight: 20, flex: 1 }}>
                  {team.description}
                </Text>

                <View style={[styles.statsRow, { borderTopColor: st.border }]}>
                  <View style={styles.stat}>
                    <Users size={16} color={st.muted + '66'} />
                    <Text style={{ color: st.muted, fontSize: 12, fontFamily: fonts.sansBold }}>{team.followersCount}</Text>
                  </View>
                  <View style={styles.stat}>
                    <BookOpen size={16} color={st.muted + '66'} />
                    <Text style={{ color: st.muted, fontSize: 12, fontFamily: fonts.sansBold }}>{team.lectures}</Text>
                  </View>
                  <View style={styles.stat}>
                    <Activity size={16} color={st.muted + '66'} />
                    <Text style={{ color: st.muted, fontSize: 12, fontFamily: fonts.sansBold }}>{team.posts}</Text>
                  </View>
                  <View style={[styles.arrowCircle, { backgroundColor: st.surfacePressed }]}>
                    <ArrowRight size={16} color={colors.primary} />
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        {filtered.length === 0 && (
          <View style={[styles.empty, { backgroundColor: st.surface, borderColor: st.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: st.surface, borderColor: st.border }]}>
              <Users size={28} color={st.muted} />
            </View>
            <Text style={{ color: st.text, fontSize: 16, fontFamily: fonts.sansBold }}>{t('teams.noTeams')}</Text>
            <Text style={{ color: st.muted, fontSize: 14, marginTop: 8 }}>{t('teams.noTeamsSub')}</Text>
          </View>
        )}
      </ScrollView>

      {!isTablet && <FadeEdges bottom />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingBottom: 4 },
  headerBtn: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 16, borderWidth: 1, height: 48,
    paddingHorizontal: 16, marginBottom: 32,
  },
  grid: { gap: 20 },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  banner: { height: 128, width: '100%', overflow: 'hidden' },
  badge: {
    position: 'absolute', top: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 4,
  },
  cardBody: { paddingHorizontal: 20, paddingBottom: 20, flex: 1 },
  avatar: {
    width: 96, height: 96, borderRadius: 16, borderWidth: 4,
    marginTop: -48, marginBottom: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    borderTopWidth: 1, paddingTop: 16, marginTop: 20,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  arrowCircle: {
    marginLeft: 'auto', width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  empty: { alignItems: 'center', paddingVertical: 80, borderRadius: 16, borderWidth: 1 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
});
