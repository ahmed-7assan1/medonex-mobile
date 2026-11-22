import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Headphones, Play, Search, ArrowLeft, Clock, TrendingUp, CalendarClock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { TABLET_BREAKPOINT, SCROLL_BOTTOM_PAD } from '@/theme/tokens';
import { FIXTURE_EPISODES } from '@/lib/fixtures';
import { FadeEdges } from '@/components/FadeEdges';

/** /podcasts — pixel match of the site's PodcastsClient: hero with badge +
 *  display title + glass chips, featured latest-episode card with a big play
 *  button, search bar, episode grid. */
export default function PodcastsScreen() {
  const { t } = useTranslation();
  const { colors, fonts, st } = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [q, setQ] = useState('');

  const episodes = FIXTURE_EPISODES.filter((e) => !q || e.title.toLowerCase().includes(q.toLowerCase()) || e.show.toLowerCase().includes(q.toLowerCase()));
  const latest = FIXTURE_EPISODES[0];
  const cols = width >= 1024 ? 3 : width >= 600 ? 2 : 1;
  const cardW = (Math.min(width, 1080) - 32 - (cols - 1) * 14) / cols;

  const chip = (icon: React.ReactNode, label: string) => (
    <View key={label} style={[styles.glassChip, { borderColor: st.border, backgroundColor: st.surface }]}>
      {icon}
      <Text style={{ color: st.muted, fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 1.2, textTransform: 'uppercase' }}>{label}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: st.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + SCROLL_BOTTOM_PAD }}>
        <View style={{ width: '100%', maxWidth: 1080, alignSelf: 'center', paddingHorizontal: 16 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()}
            style={[styles.backBtn, { top: insets.top + 12, backgroundColor: st.surface, borderColor: st.border }]}>
            <ArrowLeft size={18} color={st.muted} />
          </Pressable>

          {/* Hero */}
          <View style={{ paddingTop: insets.top + 64, flexDirection: isTablet ? 'row' : 'column', gap: 28, alignItems: isTablet ? 'flex-end' : 'stretch' }}>
            <View style={{ flex: 1 }}>
              <View style={[styles.badge, { backgroundColor: colors.primary + '14', borderColor: colors.primary + '2E' }]}>
                <Headphones size={13} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 1.8, textTransform: 'uppercase' }}>{t('podcasts.badge')}</Text>
              </View>
              <Text style={{ color: st.text, fontSize: isTablet ? 54 : 40, fontFamily: fonts.display, letterSpacing: -1.2, lineHeight: isTablet ? 56 : 44, marginTop: 16 }}>
                {t('podcasts.title')}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
                {chip(<Headphones size={11} color={st.muted} />, t('podcasts.chipEpisodes', { count: FIXTURE_EPISODES.length }))}
                {chip(<Clock size={11} color={st.muted} />, t('podcasts.chipHours', { count: 6 }))}
                {chip(<CalendarClock size={11} color={st.muted} />, t('podcasts.chipWeekly'))}
              </View>
            </View>

            {/* Featured latest episode */}
            <View style={[styles.featured, { backgroundColor: st.surface, borderColor: st.border, width: isTablet ? 300 : '100%' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />
                <Text style={{ color: st.muted, fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 1.4, textTransform: 'uppercase' }}>{t('podcasts.latest')}</Text>
              </View>
              <View style={[styles.featuredArt, { backgroundColor: colors.primary + '1F' }]}>
                <View style={[styles.bigPlay, { backgroundColor: st.surface, borderColor: st.border }]}>
                  <Play size={24} color={colors.primary} fill={colors.primary} style={{ marginLeft: 3 }} />
                </View>
              </View>
              <Text style={{ color: st.text, fontSize: 16, fontFamily: fonts.sansBold }} numberOfLines={1}>{latest.title}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 }}>
                <Text style={{ color: st.muted, fontSize: 11.5, fontFamily: fonts.sans }}>{latest.show}</Text>
                <View style={[styles.miniChip, { borderColor: st.border }]}>
                  <Text style={{ color: st.muted, fontSize: 9, fontFamily: fonts.sansBold }}>{latest.duration}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Search */}
          <View style={[styles.search, { backgroundColor: st.surface, borderColor: st.border }]}>
            <Search size={17} color={st.muted} style={{ marginLeft: 14 }} />
            <TextInput
              value={q} onChangeText={setQ}
              placeholder={t('podcasts.search')}
              placeholderTextColor={st.muted + '99'}
              style={{ flex: 1, color: st.text, fontSize: 14.5, fontFamily: fonts.sans, paddingHorizontal: 10, height: 46 }}
            />
          </View>

          {/* Grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 18 }}>
            {episodes.map((e) => (
              <Pressable key={e.id} accessibilityRole="button" style={[styles.epCard, { backgroundColor: st.surface, borderColor: st.border, width: cardW }]}>
                <View style={[styles.epArt, { backgroundColor: colors.primary + '12' }]}>
                  <View style={[styles.epPlay, { backgroundColor: colors.primary }]}>
                    <Play size={15} color={colors.primaryForeground} fill={colors.primaryForeground} style={{ marginLeft: 2 }} />
                  </View>
                </View>
                <Text numberOfLines={2} style={{ color: st.text, fontSize: 15, fontFamily: fonts.sansBold, lineHeight: 20 }}>{e.title}</Text>
                <Text style={{ color: st.muted, fontSize: 12, fontFamily: fonts.sans, marginTop: 4 }}>{e.show}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: st.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Clock size={11} color={st.muted} />
                    <Text style={{ color: st.muted, fontSize: 10.5, fontFamily: fonts.sans }}>{e.duration}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <TrendingUp size={11} color={st.muted} />
                    <Text style={{ color: st.muted, fontSize: 10.5, fontFamily: fonts.sans }}>{e.plays}</Text>
                  </View>
                  <View style={{ flex: 1 }} />
                  <Text style={{ color: st.muted, fontSize: 10.5, fontFamily: fonts.sans }}>{e.date}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
      {!isTablet && <FadeEdges bottom />}
    </View>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    position: 'absolute', left: 16, zIndex: 10,
    width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start',
    borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6,
  },
  glassChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 13, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 6,
  },
  featured: { borderRadius: 24, borderWidth: 1, padding: 18 },
  featuredArt: { aspectRatio: 1, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  bigPlay: {
    width: 64, height: 64, borderRadius: 32, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  miniChip: { borderRadius: 9, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  search: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, marginTop: 26,
  },
  epCard: { borderRadius: 20, borderWidth: 1, padding: 14 },
  epArt: { aspectRatio: 16 / 9, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  epPlay: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
});
