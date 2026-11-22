import React, { useMemo, useState } from 'react';
import {
  View, Text, Pressable, ScrollView, TextInput, StyleSheet, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search, X, ArrowLeft, Info, Activity, Heart, Eye, Zap, ArrowUpRight,
  Bone, Dumbbell, Brain, Wind, Utensils, Sparkles, BookOpen, Star, BrainCircuit,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { TABLET_BREAKPOINT } from '@/theme/tokens';
import { FIXTURE_ATLAS_SYSTEMS, FIXTURE_ATLAS_STRUCTURES, type FixtureAtlasStructure } from '@/lib/fixtures';
import { FadeEdges } from '@/components/FadeEdges';

const ICONS: Record<string, any> = {
  bone: Bone, dumbbell: Dumbbell, brain: Brain, wind: Wind, utensils: Utensils, heart: Heart, activity: Activity,
};

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  bone: { bg: '#14B8A61A', text: '#2DD4BF', border: '#14B8A633' },
  muscle: { bg: '#EF44441A', text: '#F87171', border: '#EF444433' },
  nerve: { bg: '#A855F71A', text: '#C084FC', border: '#A855F733' },
  organ: { bg: '#EC48991A', text: '#F472B6', border: '#EC489933' },
  vessel: { bg: '#F43F5E1A', text: '#FB7185', border: '#F43F5E33' },
};

const BG = '#0A0A0A';
const CARD = '#111115';
const LINE = 'rgba(255,255,255,0.06)';
const CYAN = '#22D3EE';

/** /atlas — pixel match of the site's AtlasPage: dark hero, search, system
 *  cards grid, structure grid per system, and an interactive detail view. */
export default function AtlasScreen() {
  const { t } = useTranslation();
  const { fonts } = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [activeSystem, setActiveSystem] = useState<string | null>(null);
  const [selected, setSelected] = useState<FixtureAtlasStructure | null>(null);
  const [search, setSearch] = useState('');
  const [bookmarked, setBookmarked] = useState(false);

  const activeSystemData = FIXTURE_ATLAS_SYSTEMS.find((s) => s.systemId === activeSystem) ?? null;
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return FIXTURE_ATLAS_STRUCTURES.filter((d) => {
      if (q) return d.name.toLowerCase().includes(q) || (d.clinical ?? '').toLowerCase().includes(q) || d.type.includes(q);
      return activeSystem ? d.systemId === activeSystem : true;
    });
  }, [activeSystem, search]);

  const cols = width >= 1100 ? 4 : width >= 768 ? 3 : width >= 480 ? 2 : 1;
  const cardW = (Math.min(width, 1280) - 48 - (cols - 1) * 16) / cols;

  const searchBar = (
    <View style={[styles.search, { backgroundColor: CARD }]}>
      <Search size={18} color="rgba(34,211,238,0.4)" style={{ marginLeft: 16 }} />
      <TextInput
        value={search}
        onChangeText={(v) => { setSearch(v); if (v) { setSelected(null); } }}
        placeholder={t('atlas.search')}
        placeholderTextColor="rgba(255,255,255,0.2)"
        style={{ flex: 1, color: '#fff', fontSize: 15, fontFamily: fonts.sansBold, paddingHorizontal: 12, height: 52 }}
      />
      {!!search && (
        <Pressable accessibilityRole="button" accessibilityLabel="Clear" onPress={() => setSearch('')} style={{ padding: 14 }}>
          <X size={15} color="rgba(255,255,255,0.3)" />
        </Pressable>
      )}
    </View>
  );

  /* ── Detail view ── */
  if (selected) {
    const tc = TYPE_COLORS[selected.type] ?? TYPE_COLORS.organ;
    return (
      <View style={{ flex: 1, backgroundColor: BG }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}>
          <View style={{ width: '100%', maxWidth: 1280, alignSelf: 'center', paddingHorizontal: 24, paddingTop: insets.top + 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Pressable accessibilityRole="button" onPress={() => setSelected(null)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ArrowLeft size={16} color="rgba(255,255,255,0.5)" />
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: fonts.sansBold, letterSpacing: 2, textTransform: 'uppercase' }}>{t('atlas.backToList')}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button" accessibilityState={{ selected: bookmarked }}
                onPress={() => setBookmarked((b) => !b)}
                style={[styles.bookmarkBtn, bookmarked ? { backgroundColor: '#F59E0B1A', borderColor: '#F59E0B4D' } : { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: LINE }]}
              >
                <Star size={14} color={bookmarked ? '#FBBF24' : 'rgba(255,255,255,0.5)'} fill={bookmarked ? '#FBBF24' : 'transparent'} />
                <Text style={{ color: bookmarked ? '#FBBF24' : 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: fonts.sansBold, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  {bookmarked ? t('atlas.bookmarked') : t('atlas.bookmark')}
                </Text>
              </Pressable>
            </View>

            <View style={{ flexDirection: isTablet ? 'row' : 'column', gap: 28, marginTop: 20 }}>
              {/* Left: visual + actions + notes */}
              <View style={{ flex: isTablet ? 0.45 : 1, gap: 20 }}>
                <View style={[styles.visual, { backgroundColor: CARD }]}>
                  <LinearGradient colors={['rgba(22,78,99,0.25)', 'rgba(0,0,0,0.4)', '#000']} style={StyleSheet.absoluteFill} />
                  {(() => { const SysIcon = ICONS[FIXTURE_ATLAS_SYSTEMS.find((s) => s.systemId === selected.systemId)?.iconName ?? 'activity'] ?? Activity;
                    return <SysIcon size={110} color={CYAN} style={{ opacity: 0.4 }} />; })()}
                  <View style={styles.visualTag}>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9.5, fontFamily: fonts.sansBold, letterSpacing: 2, textTransform: 'uppercase' }}>{t('atlas.visualization')}</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={[styles.aiBtn, { borderColor: CYAN + '66', borderWidth: 1, backgroundColor: '#1A1A1F' }]}>
                    <BrainCircuit size={15} color={CYAN} />
                    <Text style={{ color: '#fff', fontSize: 13, fontFamily: fonts.sansBold }}>{t('atlas.askAI')}</Text>
                  </View>
                  <LinearGradient colors={['#14B8A6', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.aiBtn}>
                    <Sparkles size={15} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 13, fontFamily: fonts.sansBold }}>{t('atlas.quickQuiz')}</Text>
                  </LinearGradient>
                </View>

                <View style={[styles.notesCard, { backgroundColor: CARD }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <BookOpen size={15} color={CYAN} />
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9.5, fontFamily: fonts.sansBold, letterSpacing: 2, textTransform: 'uppercase' }}>{t('atlas.notes')}</Text>
                  </View>
                  <TextInput
                    multiline
                    placeholder={t('atlas.notesPlaceholder')}
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    style={styles.notesInput}
                  />
                </View>
              </View>

              {/* Right: details */}
              <View style={{ flex: isTablet ? 0.55 : 1 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <View style={{ flex: 1, minWidth: 200 }}>
                    <Text style={{ color: '#fff', fontSize: isTablet ? 44 : 34, fontFamily: fonts.sansBold, letterSpacing: -1 }}>{selected.name}</Text>
                    {!!selected.latin && <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, fontStyle: 'italic', marginTop: 2 }}>{selected.latin}</Text>}
                  </View>
                  <View style={[styles.typeChip, { backgroundColor: tc.bg, borderColor: tc.border }]}>
                    <Text style={{ color: tc.text, fontSize: 9.5, fontFamily: fonts.sansBold, letterSpacing: 2, textTransform: 'uppercase' }}>{selected.type}</Text>
                  </View>
                </View>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15.5, lineHeight: 25, marginTop: 14, fontFamily: fonts.sans }}>{selected.desc}</Text>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 20 }}>
                  {selected.fn && <DetailCard icon={<Activity size={14} color={CYAN} />} title={t('atlas.fn')} body={selected.fn} fonts={fonts} w={isTablet ? '48%' : '100%'} />}
                  {selected.blood && <DetailCard icon={<Heart size={14} color="#FB7185" />} title={t('atlas.blood')} body={selected.blood} fonts={fonts} w={isTablet ? '48%' : '100%'} />}
                  {selected.nerve && <DetailCard icon={<Zap size={14} color="#FBBF24" />} title={t('atlas.nerve')} body={selected.nerve} fonts={fonts} w={isTablet ? '48%' : '100%'} />}
                  {!!selected.relations?.length && (
                    <View style={[styles.detailCard, { backgroundColor: CARD, width: isTablet ? '48%' : '100%' }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <Eye size={14} color="#34D399" />
                        <Text style={detailTitle(fonts)}>{t('atlas.relations')}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {selected.relations.map((r) => {
                          const match = FIXTURE_ATLAS_STRUCTURES.find((s) => s.name.toLowerCase() === r.toLowerCase());
                          return (
                            <Pressable key={r} accessibilityRole="button" disabled={!match} onPress={() => match && setSelected(match)}
                              style={[styles.relChip, { borderColor: match ? CYAN + '55' : LINE, backgroundColor: match ? CYAN + '14' : 'rgba(255,255,255,0.03)' }]}>
                              <Text style={{ color: match ? CYAN : 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: fonts.sansBold }}>{r}</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>

                {!!selected.clinical && (
                  <View style={[styles.detailCard, { backgroundColor: '#F59E0B0D', borderColor: '#F59E0B33', marginTop: 12 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Info size={14} color="#FBBF24" />
                      <Text style={[detailTitle(fonts), { color: '#FBBF24' }]}>{t('atlas.clinical')}</Text>
                    </View>
                    <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13.5, lineHeight: 21, fontFamily: fonts.sans }}>{selected.clinical}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
        {!isTablet && <FadeEdges bottom />}
      </View>
    );
  }

  /* ── Landing + system views ── */
  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}>
        {/* Hero */}
        <View style={{ height: isTablet ? 340 : 280, justifyContent: 'flex-end' }}>
          <LinearGradient colors={['rgba(8,145,178,0.35)', 'rgba(10,10,10,0.2)', BG]} style={StyleSheet.absoluteFill} />
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()}
            style={[styles.homeBtn, { top: insets.top + 14 }]}>
            <ArrowLeft size={18} color="#fff" />
          </Pressable>
          <View style={{ paddingHorizontal: 24, paddingBottom: 28, maxWidth: 1280, width: '100%', alignSelf: 'center' }}>
            <View style={styles.heroBadge}>
              <Activity size={13} color={CYAN} />
              <Text style={{ color: CYAN, fontSize: 9.5, fontFamily: fonts.sansBold, letterSpacing: 2.4, textTransform: 'uppercase' }}>
                {activeSystemData ? `${activeSystemData.label} Module` : t('atlas.badge')}
              </Text>
            </View>
            <Text style={{ color: '#fff', fontSize: isTablet ? 64 : 46, fontFamily: fonts.sansBold, letterSpacing: -2 }}>
              {activeSystemData ? `${activeSystemData.label}.` : 'Atlas.'}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: fonts.sansBold, letterSpacing: 1.6, textTransform: 'uppercase', marginTop: 6, maxWidth: 560 }}>
              {activeSystemData ? activeSystemData.desc : t('atlas.subtitle')}
            </Text>
          </View>
        </View>

        <View style={{ width: '100%', maxWidth: 1280, alignSelf: 'center', paddingHorizontal: 24 }}>
          {searchBar}

          {/* System view header */}
          {(activeSystem || !!search) && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18, marginTop: 6 }}>
              {!search && (
                <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => setActiveSystem(null)} style={styles.backCircle}>
                  <ArrowLeft size={18} color="rgba(255,255,255,0.5)" />
                </Pressable>
              )}
              <View>
                <Text style={{ color: '#fff', fontSize: 26, fontFamily: fonts.sansBold, letterSpacing: -0.8 }}>
                  {search ? t('atlas.results') : `${activeSystemData?.label} System`}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10.5, fontFamily: fonts.sansBold, letterSpacing: 1.6, textTransform: 'uppercase', marginTop: 3 }}>
                  {t('atlas.found', { count: filtered.length })}
                </Text>
              </View>
            </View>
          )}

          {/* System cards (landing) */}
          {!activeSystem && !search && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 20 }}>
              {FIXTURE_ATLAS_SYSTEMS.map((sys) => {
                const SysIcon = ICONS[sys.iconName] ?? Activity;
                const count = FIXTURE_ATLAS_STRUCTURES.filter((d) => d.systemId === sys.systemId).length;
                return (
                  <Pressable key={sys.systemId} accessibilityRole="button" onPress={() => setActiveSystem(sys.systemId)}
                    style={[styles.sysCard, { backgroundColor: CARD, width: cardW }]}>
                    <View style={[styles.sysIcon, { borderColor: LINE }]}>
                      <SysIcon size={26} color={sys.iconColor} />
                    </View>
                    <Text style={{ color: '#fff', fontSize: 16.5, fontFamily: fonts.sansBold, letterSpacing: -0.3 }}>{sys.label} System</Text>
                    <Text numberOfLines={2} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10.5, fontFamily: fonts.sansBold, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 4, lineHeight: 16 }}>{sys.desc}</Text>
                    <View style={styles.sysFooter}>
                      <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9.5, fontFamily: fonts.sansBold, letterSpacing: 1.6, textTransform: 'uppercase' }}>
                        {t('atlas.structures', { count })}
                      </Text>
                      <ArrowUpRight size={17} color={CYAN} />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Structure cards */}
          {(activeSystem || !!search) && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              {filtered.map((organ) => {
                const tc = TYPE_COLORS[organ.type] ?? TYPE_COLORS.organ;
                return (
                  <Pressable key={organ.id} accessibilityRole="button" onPress={() => setSelected(organ)}
                    style={[styles.sysCard, { backgroundColor: CARD, width: cardW }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={{ color: '#fff', fontSize: 15.5, fontFamily: fonts.sansBold, letterSpacing: -0.2 }}>{organ.name}</Text>
                        {!!organ.latin && <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11.5, fontStyle: 'italic', marginTop: 2 }}>{organ.latin}</Text>}
                      </View>
                      <View style={[styles.typeChip, { backgroundColor: tc.bg, borderColor: tc.border }]}>
                        <Text style={{ color: tc.text, fontSize: 8.5, fontFamily: fonts.sansBold, letterSpacing: 1.6, textTransform: 'uppercase' }}>{organ.type}</Text>
                      </View>
                    </View>
                    <Text numberOfLines={3} style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 18, marginTop: 10, flex: 1, fontFamily: fonts.sans }}>{organ.desc}</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: LINE }}>
                      <View style={[styles.relChip, { borderColor: LINE, backgroundColor: 'rgba(0,0,0,0.3)' }]}>
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9.5, fontFamily: fonts.sansBold }}>📍 {organ.region ?? 'General'}</Text>
                      </View>
                      {!!organ.clinical && (
                        <View style={[styles.relChip, { borderColor: '#F59E0B33', backgroundColor: '#F59E0B1A', flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                          <Info size={10} color="#FBBF24" />
                          <Text style={{ color: '#FBBF24', fontSize: 9.5, fontFamily: fonts.sansBold, textTransform: 'uppercase', letterSpacing: 0.6 }}>Clinical</Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              })}
              {filtered.length === 0 && (
                <View style={{ alignItems: 'center', width: '100%', paddingVertical: 60 }}>
                  <View style={[styles.backCircle, { width: 56, height: 56, borderRadius: 16, marginBottom: 12 }]}>
                    <Search size={22} color="rgba(34,211,238,0.5)" />
                  </View>
                  <Text style={{ color: '#fff', fontSize: 16, fontFamily: fonts.sansBold }}>{t('atlas.none')}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
      {!isTablet && <FadeEdges bottom />}
    </View>
  );
}

function DetailCard({ icon, title, body, fonts, w }: { icon: React.ReactNode; title: string; body: string; fonts: any; w: any }) {
  return (
    <View style={[styles.detailCard, { backgroundColor: CARD, width: w }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        {icon}
        <Text style={detailTitle(fonts)}>{title}</Text>
      </View>
      <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 20, fontFamily: fonts.sans }}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginTop: -4, marginBottom: 22,
  },
  homeBtn: {
    position: 'absolute', left: 24, width: 40, height: 40, borderRadius: 20, zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start',
    backgroundColor: 'rgba(34,211,238,0.1)', borderWidth: 1, borderColor: 'rgba(34,211,238,0.2)',
    borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 12,
  },
  sysCard: {
    borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    padding: 20, overflow: 'hidden',
  },
  sysIcon: {
    alignSelf: 'flex-start', padding: 12, borderRadius: 16, borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 14,
  },
  sysFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', width: '100%',
  },
  backCircle: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#1A1A1F',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center',
  },
  typeChip: { borderRadius: 7, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  relChip: { borderRadius: 7, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 4 },
  bookmarkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8,
  },
  visual: {
    aspectRatio: 1, borderRadius: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden', gap: 20,
  },
  visualTag: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.85)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  aiBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 24, paddingVertical: 14,
  },
  notesCard: { borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', padding: 18, gap: 10 },
  notesInput: {
    backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, color: 'rgba(255,255,255,0.8)',
    fontSize: 13.5, minHeight: 88, textAlignVertical: 'top',
  },
  detailCard: { borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', padding: 18 },
});

function detailTitle(fonts: any) {
  return {
    color: 'rgba(255,255,255,0.4)', fontSize: 9.5, fontFamily: fonts.sansBold,
    letterSpacing: 2, textTransform: 'uppercase' as const,
  };
}
