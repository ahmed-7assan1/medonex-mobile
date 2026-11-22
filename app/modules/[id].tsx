import React, { useMemo, useState } from 'react';
import {
  View, Text, Pressable, ScrollView, TextInput, StyleSheet,
  useWindowDimensions, RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search, X, ChevronRight, ChevronLeft, Layers, HelpCircle, FileText, Clock,
  Activity, Atom, Bone, Brain, Dna, FlaskConical, Microscope, Pill, Shield,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { TABLET_BREAKPOINT } from '@/theme/tokens';
import { useModuleBundle, BundleSubject, BundlePaper } from '@/lib/modules';
import { ApiError } from '@/lib/api';

const SUBJECT_ICONS: Record<string, any> = {
  Activity, Atom, Bone, Brain, Dna, FlaskConical, Layers, Microscope, Pill, Shield,
};

function getSubjectIcon(name: string, customIcon?: string | null) {
  if (customIcon && SUBJECT_ICONS[customIcon]) return SUBJECT_ICONS[customIcon];
  const n = name.toUpperCase();
  if (n.includes('ANAT')) return Bone;
  if (n.includes('HISTO')) return Microscope;
  if (n.includes('MICRO')) return Atom;
  if (n.includes('PARA')) return Shield;
  if (n.includes('PATHO')) return FlaskConical;
  if (n.includes('PHARMA')) return Pill;
  if (n.includes('PHYSIO')) return Activity;
  if (n.includes('NEURO') || n.includes('CNS')) return Brain;
  if (n.includes('BIOCHEM') || n.includes('GENETICS') || n.includes('DNA')) return Dna;
  return Layers;
}

function progressTone(progress: number, st: { text: string; muted: string }) {
  if (progress >= 70) return { text: '#10B981', bar: '#10B981' };
  if (progress > 0) return { text: '#F59E0B', bar: '#F59E0B' };
  return { text: st.muted, bar: st.text };
}

type MobileSubject = {
  id: string;
  name: string;
  icon: string | null;
  lectureCount: number;
  questionCount: number;
  progress: number;
};

/** /modules/[id] — pixel match of the site's phone module detail page:
 *  route title, subject search pill, "Subjects" inset-list rows with
 *  progress, and an "Assessments" inset list. Tablet renders the site's
 *  desktop arrangement (header card + curriculum grid + assessments grid).
 *  Guests see a sign-in empty state (the site redirects guests to /login). */
export default function ModuleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { st, fonts, colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;
  const bundle = useModuleBundle(id ?? '');
  const [query, setQuery] = useState('');

  const isGuest = bundle.error instanceof ApiError && bundle.error.status === 401;
  const isNotFound = bundle.error instanceof ApiError && bundle.error.status === 404;
  const mod = bundle.data?.module;

  const correctCounts = useMemo(() => {
    const out: Record<string, number> = {};
    const src = bundle.data?.correctBySubject ?? {};
    for (const [sid, arr] of Object.entries(src)) out[sid] = arr.length;
    return out;
  }, [bundle.data?.correctBySubject]);

  const subjects: MobileSubject[] = useMemo(() => {
    if (!mod) return [];
    return mod.subjects.map((s: BundleSubject) => {
      const questionCount = s.lectures.reduce((sum, l) => sum + l._count.questions, 0);
      const correct = correctCounts[s.id] ?? 0;
      return {
        id: s.id,
        name: s.name,
        icon: s.icon,
        lectureCount: s.lectures.length,
        questionCount,
        progress: questionCount > 0 ? Math.round((correct / questionCount) * 100) : 0,
      };
    });
  }, [mod, correctCounts]);

  const filteredSubjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter((s) => s.name.toLowerCase().includes(q));
  }, [query, subjects]);

  const totalLectures = mod ? mod.subjects.reduce((a, s) => a + s.lectures.length, 0) : 0;
  const totalQ = subjects.reduce((a, s) => a + s.questionCount, 0);
  const totalCorr = Object.values(correctCounts).reduce((a, n) => a + n, 0);
  const modPct = totalQ > 0 ? Math.round((totalCorr / totalQ) * 100) : 0;

  const header = (
    <View style={styles.titleRow}>
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/modules' as never))}
        hitSlop={12}
        style={[styles.backBtn, { backgroundColor: st.surface, borderColor: st.border }]}
        accessibilityLabel={t('moduleDetail.back')}
      >
        <ChevronLeft size={20} color={st.text} />
      </Pressable>
      <Text numberOfLines={1} style={[styles.title, { color: st.text, fontFamily: fonts.sansBold }]}>
        {mod?.name ?? t('tabs.modules')}
      </Text>
    </View>
  );

  let body: React.ReactNode = null;

  if (isGuest) {
    body = (
      <View style={[styles.emptyCard, { backgroundColor: st.surface, borderColor: st.border }]}>
        <View style={[styles.emptyIcon, { backgroundColor: st.surfacePressed, borderColor: st.border }]}>
          <Layers size={28} color={colors.primary} />
        </View>
        <Text style={{ color: st.text, fontSize: 15, fontWeight: '700', fontFamily: fonts.sansBold }}>{t('moduleDetail.signInTitle')}</Text>
        <Text style={{ color: st.muted, fontSize: 12, marginTop: 4, textAlign: 'center' }}>{t('moduleDetail.signInDesc')}</Text>
      </View>
    );
  } else if (isNotFound) {
    body = (
      <View style={[styles.emptyCard, { backgroundColor: st.surface, borderColor: st.border }]}>
        <Text style={{ color: st.text, fontSize: 15, fontWeight: '700', fontFamily: fonts.sansBold }}>{t('moduleDetail.notFound')}</Text>
        <Text style={{ color: st.muted, fontSize: 12, marginTop: 4, textAlign: 'center' }}>{t('moduleDetail.notFoundDesc')}</Text>
      </View>
    );
  } else if (!mod) {
    body = (
      <View style={{ gap: 12 }}>
        <View style={[styles.skel, { backgroundColor: st.surface, height: 44, borderRadius: 999 }]} />
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.skel, { backgroundColor: st.surface, height: 72, borderRadius: 18 }]} />
        ))}
      </View>
    );
  } else if (isTablet) {
    body = (
      <View style={{ gap: 28 }}>
        {/* Desktop header card */}
        <View style={[styles.deskHeader, { backgroundColor: st.surface, borderColor: st.border }]}>
          <View style={styles.deskHeaderRow}>
            <View style={[styles.deskIconWrap, { borderColor: colors.primary }]}>
              <View style={[styles.deskIconInner, { backgroundColor: st.bg }]}>
                <Brain size={28} color={colors.primary} />
              </View>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ color: colors.primary, fontSize: 9, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' }}>
                {t('moduleDetail.academicModule')}
              </Text>
              <Text numberOfLines={1} style={{ color: st.text, fontSize: 24, fontFamily: fonts.sansBold }}>{mod.name}.</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 6 }}>
                <HeaderStat value={String(totalLectures)} label={t('moduleDetail.lectures')} st={st} fonts={fonts} />
                <View style={{ width: 1, height: 28, backgroundColor: st.border }} />
                <HeaderStat value={String(totalQ)} label={t('moduleDetail.questions')} st={st} fonts={fonts} />
                <View style={{ width: 1, height: 28, backgroundColor: st.border }} />
                <HeaderStat value={`${modPct}%`} label={t('moduleDetail.mastery')} st={st} fonts={fonts}
                  valueColor={modPct >= 70 ? '#10B981' : modPct > 0 ? '#F59E0B' : st.muted} />
              </View>
            </View>
          </View>
        </View>

        {/* Curriculum grid */}
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <View style={{ width: 5, height: 26, borderRadius: 3, backgroundColor: colors.primary }} />
            <View>
              <Text style={{ color: st.text, fontSize: 22, fontFamily: fonts.sansBold }}>{t('moduleDetail.curriculum')}</Text>
              <Text style={{ color: st.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                {t('moduleDetail.disciplines')}
              </Text>
            </View>
          </View>
          <View style={styles.deskGrid}>
            {subjects.map((s) => {
              const IconComp = getSubjectIcon(s.name, s.icon);
              const tone = progressTone(s.progress, st);
              return (
                <Pressable
                  key={s.id}
                  onPress={() => router.push(`/modules/${mod.id}/subjects/${s.id}` as never)}
                  style={({ pressed }) => [
                    styles.deskSubjectCard,
                    { backgroundColor: st.surface, borderColor: st.border },
                    pressed && { backgroundColor: st.surfacePressed, transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={[styles.deskSubjectIcon, { backgroundColor: st.surfacePressed }]}>
                      <IconComp size={24} color={st.text} />
                    </View>
                    {s.questionCount > 0 && (
                      <View style={[styles.pctPill, { borderColor: st.border, backgroundColor: st.surfacePressed }]}>
                        <Text style={{ color: tone.text, fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>
                          {s.progress}% {t('moduleDetail.done')}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text numberOfLines={1} style={{ color: st.text, fontSize: 17, fontFamily: fonts.sansBold, marginTop: 14 }}>{s.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Layers size={12} color={st.muted} />
                      <Text style={{ color: st.muted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                        {s.lectureCount} {t('moduleDetail.lectures')}
                      </Text>
                    </View>
                    <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: st.border }} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <HelpCircle size={12} color={st.muted} />
                      <Text style={{ color: st.muted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                        {s.questionCount} {t('moduleDetail.questions')}
                      </Text>
                    </View>
                  </View>
                  {s.questionCount > 0 && (
                    <View style={{ height: 6, borderRadius: 3, backgroundColor: st.surfacePressed, marginTop: 16, overflow: 'hidden' }}>
                      <View style={{ height: 6, borderRadius: 3, backgroundColor: tone.bar, width: `${s.progress}%` }} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Assessments grid */}
        {mod.pastPapers.length > 0 && (
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <View style={{ width: 5, height: 26, borderRadius: 3, backgroundColor: '#8B5CF6' }} />
              <View>
                <Text style={{ color: st.text, fontSize: 22, fontFamily: fonts.sansBold }}>{t('moduleDetail.assessments')}</Text>
                <Text style={{ color: st.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  {t('moduleDetail.assessmentsSub')}
                </Text>
              </View>
            </View>
            <View style={styles.deskGrid4}>
              {mod.pastPapers.map((paper: BundlePaper) => (
                <Pressable
                  key={paper.id}
                  style={({ pressed }) => [
                    styles.deskPaperCard,
                    { backgroundColor: st.surface, borderColor: st.border },
                    pressed && { backgroundColor: st.surfacePressed },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={[styles.deskSubjectIcon, { backgroundColor: 'rgba(139,92,246,0.12)' }]}>
                      <FileText size={20} color="#8B5CF6" />
                    </View>
                    {paper.isInteractive && (
                      <View style={[styles.pctPill, { borderColor: 'rgba(139,92,246,0.25)', backgroundColor: 'rgba(139,92,246,0.1)' }]}>
                        <Text style={{ color: '#8B5CF6', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>
                          {t('moduleDetail.interactive')}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text numberOfLines={2} style={{ color: st.text, fontSize: 14, fontWeight: '700', marginTop: 12, lineHeight: 19 }}>
                    {paper.title}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 14, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: st.border }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} color={st.muted} />
                      <Text style={{ color: st.muted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>{paper.timeLimitMin || 0}m</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Activity size={12} color={st.muted} />
                      <Text style={{ color: st.muted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>{paper._count.attempts}</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  } else {
    body = (
      <View>
        {/* Search pill */}
        <View style={[styles.searchPill, { backgroundColor: st.surface, borderColor: st.border }]}>
          <Search size={17} color={st.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('moduleDetail.searchSubjects')}
            placeholderTextColor={st.muted}
            style={[styles.searchInput, { color: st.text, fontFamily: fonts.sans }]}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8} style={styles.clearBtn}>
              <X size={16} color={st.muted} />
            </Pressable>
          )}
        </View>

        {/* Subjects section */}
        <View style={styles.sectionHeader}>
          <Text style={{ color: st.text, fontSize: 15, fontWeight: '600', fontFamily: fonts.sansBold }}>{t('moduleDetail.subjects')}</Text>
          <Text style={{ color: st.muted, fontSize: 13, fontVariant: ['tabular-nums'] }}>
            {filteredSubjects.length}{query.trim() ? ` / ${subjects.length}` : ''}
          </Text>
        </View>

        {filteredSubjects.length === 0 ? (
          <View style={[styles.emptySubjects, { backgroundColor: st.surface, borderColor: st.border }]}>
            <Search size={20} color={st.muted} />
            <Text style={{ color: st.text, fontSize: 11, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', marginTop: 10 }}>
              {subjects.length === 0 ? t('moduleDetail.noSubjects') : t('moduleDetail.noMatchSubjects')}
            </Text>
            <Text style={{ color: st.muted, fontSize: 12, marginTop: 6, textAlign: 'center' }}>
              {subjects.length === 0 ? t('moduleDetail.noSubjectsDesc') : t('moduleDetail.noMatchSubjectsDesc')}
            </Text>
          </View>
        ) : (
          <View style={[styles.insetCard, { backgroundColor: st.surface, borderColor: st.border }]}>
            {filteredSubjects.map((subject, idx) => {
              const SubjectIcon = getSubjectIcon(subject.name, subject.icon);
              const tone = progressTone(subject.progress, st);
              return (
                <Pressable
                  key={subject.id}
                  onPress={() => router.push(`/modules/${mod.id}/subjects/${subject.id}` as never)}
                  style={({ pressed }) => [
                    styles.insetRow,
                    idx > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: st.border },
                    pressed && { backgroundColor: st.surfacePressed },
                  ]}
                >
                  <View style={[styles.rowIcon, { backgroundColor: st.surfacePressed }]}>
                    <SubjectIcon size={18} color={st.text} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ color: st.text, fontSize: 16, fontFamily: fonts.sans }}>{subject.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <Layers size={12} color={st.muted} />
                      <Text style={{ color: st.muted, fontSize: 13 }}>{subject.lectureCount}</Text>
                      <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: st.border }} />
                      <HelpCircle size={12} color={st.muted} />
                      <Text style={{ color: st.muted, fontSize: 13 }}>{subject.questionCount}</Text>
                    </View>
                  </View>
                  {subject.questionCount > 0 && (
                    <View style={{ alignItems: 'flex-end', gap: 4, width: 44 }}>
                      <Text style={{ color: tone.text, fontSize: 11, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{subject.progress}%</Text>
                      <View style={{ height: 4, width: 40, borderRadius: 2, backgroundColor: st.surfacePressed, overflow: 'hidden' }}>
                        <View style={{ height: 4, borderRadius: 2, backgroundColor: tone.bar, width: `${subject.progress}%` }} />
                      </View>
                    </View>
                  )}
                  <ChevronRight size={18} color={st.muted} />
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Assessments section */}
        {mod.pastPapers.length > 0 && (
          <View style={{ marginTop: 28 }}>
            <View style={styles.sectionHeader}>
              <Text style={{ color: st.text, fontSize: 15, fontWeight: '600', fontFamily: fonts.sansBold }}>{t('moduleDetail.assessments')}</Text>
              <Text style={{ color: st.muted, fontSize: 13, fontVariant: ['tabular-nums'] }}>{mod.pastPapers.length}</Text>
            </View>
            <View style={[styles.insetCard, { backgroundColor: st.surface, borderColor: st.border }]}>
              {mod.pastPapers.map((paper: BundlePaper, idx: number) => (
                <Pressable
                  key={paper.id}
                  style={({ pressed }) => [
                    styles.insetRow,
                    idx > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: st.border },
                    pressed && { backgroundColor: st.surfacePressed },
                  ]}
                >
                  <View style={[styles.rowIcon, { backgroundColor: st.surfacePressed }]}>
                    <FileText size={18} color={st.text} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={2} style={{ color: st.text, fontSize: 16, lineHeight: 21, fontFamily: fonts.sans }}>{paper.title}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <Clock size={12} color={st.muted} />
                      <Text style={{ color: st.muted, fontSize: 13 }}>{paper.timeLimitMin || 0}m</Text>
                      <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: st.border }} />
                      <Text style={{ color: st.muted, fontSize: 13 }}>{paper._count.attempts} {t('moduleDetail.attempts')}</Text>
                    </View>
                  </View>
                  <ChevronRight size={18} color={st.muted} />
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: st.bg, paddingTop: insets.top + 8 }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 60, maxWidth: isTablet ? 1100 : undefined, alignSelf: isTablet ? 'center' : undefined, width: '100%' }}
        refreshControl={
          <RefreshControl refreshing={bundle.isRefetching} onRefresh={() => bundle.refetch()} tintColor={st.muted} />
        }
      >
        {header}
        {body}
      </ScrollView>
    </View>
  );
}

function HeaderStat({ value, label, st, fonts, valueColor }: { value: string; label: string; st: any; fonts: any; valueColor?: string }) {
  return (
    <View style={{ alignItems: 'flex-start' }}>
      <Text style={{ color: valueColor ?? st.text, fontSize: 18, fontFamily: fonts.sansBold }}>{value}</Text>
      <Text style={{ color: st.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { flex: 1, fontSize: 20 },
  searchPill: {
    height: 44, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
  clearBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 4, marginTop: 22, marginBottom: 8,
  },
  insetCard: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  insetRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 12 },
  rowIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  emptyCard: {
    borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center',
    paddingVertical: 40, paddingHorizontal: 24, marginTop: 24,
  },
  emptyIcon: {
    width: 56, height: 56, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  emptySubjects: {
    borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center',
    paddingVertical: 36, paddingHorizontal: 24,
  },
  skel: { opacity: 0.6 },
  deskHeader: { borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, padding: 22 },
  deskHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  deskIconWrap: { width: 60, height: 60, borderRadius: 18, borderWidth: 2, padding: 3 },
  deskIconInner: { flex: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  deskGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  deskSubjectCard: { width: '31%', minWidth: 240, flexGrow: 1, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, padding: 20 },
  deskSubjectIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  pctPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
  deskGrid4: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  deskPaperCard: { width: '23%', minWidth: 210, flexGrow: 1, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 18 },
});
