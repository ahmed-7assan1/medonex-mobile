import React, { useMemo, useState } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet,
  useWindowDimensions, RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronRight, ChevronLeft, Layers, HelpCircle, FileText, BookOpen,
  Microscope, PlayCircle, Clock,
  Activity, Atom, Bone, Brain, Dna, FlaskConical, Pill, Shield,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { FadeEdges } from '@/components/FadeEdges';
import { TABLET_BREAKPOINT, SCROLL_BOTTOM_PAD } from '@/theme/tokens';
import { useModuleBundle } from '@/lib/modules';
import { ApiError } from '@/lib/api';
import { FIXTURE_MODULE_BUNDLE } from '@/lib/fixtures';

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

type LectureRow = {
  id: string;
  title: string;
  type: string;
  questionsCount: number;
  filesCount: number;
};

/** /modules/[id]/subjects/[subjectId] — pixel match of the site's phone
 *  subject page: route title, Lectures/Practical capsule switcher, and an
 *  inset list of lecture rows. Tablet renders the site's desktop header
 *  card + tab pills + lecture grid. Data comes from the module bundle.
 *  Guests see a sign-in empty state (site redirects guests to /login). */
export default function SubjectLecturesScreen() {
  const { id: moduleId, subjectId } = useLocalSearchParams<{ id: string; subjectId: string }>();
  const { st, fonts, colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;
  const bundle = useModuleBundle(moduleId ?? '');
  const [activeTab, setActiveTab] = useState<'lectures' | 'practical'>('lectures');

  // Pages phase: fixtures stand in for live data until wiring (Ahmed, 22 Nov).
  const failed = bundle.error instanceof ApiError;
  const mod = (bundle.data ?? (failed ? FIXTURE_MODULE_BUNDLE : undefined))?.module;
  const subject = mod?.subjects.find((s) => s.id === subjectId);

  const { lectures, practicalLectures } = useMemo(() => {
    const all: LectureRow[] = (subject?.lectures ?? []).map((l: any) => ({
      id: l.id,
      title: l.title,
      type: l.type ?? 'LECTURE',
      questionsCount: l._count?.questions ?? 0,
      filesCount: Array.isArray(l.files) ? l.files.length : 0,
    }));
    return {
      lectures: all.filter((l) => l.type !== 'PRACTICAL'),
      practicalLectures: all.filter((l) => l.type === 'PRACTICAL'),
    };
  }, [subject]);

  const hasPractical = practicalLectures.length > 0;
  const current = activeTab === 'practical' ? practicalLectures : lectures;
  const practical = activeTab === 'practical';

  const header = (
    <View style={styles.titleRow}>
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace(`/modules/${moduleId}` as never))}
        hitSlop={12}
        style={[styles.backBtn, { backgroundColor: st.surface, borderColor: st.border }]}
        accessibilityLabel={t('moduleDetail.back')}
      >
        <ChevronLeft size={20} color={st.text} />
      </Pressable>
      <Text numberOfLines={1} style={[styles.title, { color: st.text, fontFamily: fonts.sansBold }]}>
        {subject?.name ?? t('tabs.modules')}
      </Text>
    </View>
  );

  let body: React.ReactNode = null;

  if (!subject) {
    body = (
      <View style={{ gap: 12 }}>
        <View style={{ backgroundColor: st.surface, height: 44, borderRadius: 999, opacity: 0.6 }} />
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={{ backgroundColor: st.surface, height: 72, borderRadius: 18, opacity: 0.6 }} />
        ))}
      </View>
    );
  } else if (isTablet) {
    const SubjectIcon = getSubjectIcon(subject.name, subject.icon);
    body = (
      <View style={{ gap: 24 }}>
        {/* Desktop header card */}
        <View style={[styles.deskHeader, { backgroundColor: st.surface, borderColor: st.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <Pressable onPress={() => router.push('/(tabs)/modules' as never)}>
              <Text style={{ color: st.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' }}>Hub</Text>
            </Pressable>
            <ChevronRight size={8} color={st.muted} />
            <Pressable onPress={() => router.push(`/modules/${moduleId}` as never)}>
              <Text numberOfLines={1} style={{ color: st.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', maxWidth: 140 }}>
                {mod?.name}
              </Text>
            </Pressable>
            <ChevronRight size={8} color={st.muted} />
            <Text numberOfLines={1} style={{ color: colors.primary, fontSize: 9, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', maxWidth: 180 }}>
              {subject.name}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={[styles.deskSubjectIcon, { backgroundColor: st.surfacePressed }]}>
              <SubjectIcon size={28} color={st.text} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ color: colors.primary, fontSize: 9, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' }}>
                {t('subject.discipline')}
              </Text>
              <Text numberOfLines={1} style={{ color: st.text, fontSize: 24, fontFamily: fonts.sansBold }}>{subject.name}.</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
              <DeskStat value={subject.lectures.length} label={t('subject.lectures')} st={st} fonts={fonts} />
              <View style={{ width: 1, height: 30, backgroundColor: st.border }} />
              <DeskStat value={lectures.length} label={t('subject.theory')} st={st} fonts={fonts} />
              {hasPractical && (
                <>
                  <View style={{ width: 1, height: 30, backgroundColor: st.border }} />
                  <DeskStat value={practicalLectures.length} label={t('subject.practical')} st={st} fonts={fonts} />
                </>
              )}
            </View>
          </View>
        </View>

        {/* Tab pills */}
        <View style={[styles.deskTabs, { backgroundColor: st.surface, borderColor: st.border }]}>
          <Pressable
            onPress={() => setActiveTab('lectures')}
            style={[styles.deskTab, activeTab === 'lectures' && { backgroundColor: colors.primary }]}
          >
            <BookOpen size={14} color={activeTab === 'lectures' ? '#FFF' : st.muted} />
            <Text style={{ color: activeTab === 'lectures' ? '#FFF' : st.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' }}>
              {t('subject.lectures')}
            </Text>
          </Pressable>
          {hasPractical && (
            <Pressable
              onPress={() => setActiveTab('practical')}
              style={[styles.deskTab, activeTab === 'practical' && { backgroundColor: '#4F46E5' }]}
            >
              <Microscope size={14} color={activeTab === 'practical' ? '#FFF' : st.muted} />
              <Text style={{ color: activeTab === 'practical' ? '#FFF' : st.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                {t('subject.practical')}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Section heading */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 5, height: 26, borderRadius: 3, backgroundColor: practical ? '#6366F1' : colors.primary }} />
            <View>
              <Text style={{ color: st.text, fontSize: 22, fontFamily: fonts.sansBold }}>
                {practical ? t('subject.clinicalSessions') : t('subject.lectureSeries')}
              </Text>
              <Text style={{ color: st.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                {practical ? t('subject.clinicalSub') : t('subject.seriesSub')}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: st.border, backgroundColor: st.surface }}>
            <Clock size={14} color={colors.primary} />
            <Text style={{ color: st.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
              {current.length} {t('subject.items')}
            </Text>
          </View>
        </View>

        {/* Lecture grid */}
        {current.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: st.surface, borderColor: st.border }]}>
            <BookOpen size={28} color={st.muted} />
            <Text style={{ color: st.muted, fontSize: 12, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', marginTop: 12 }}>
              {t('subject.preparing')}
            </Text>
          </View>
        ) : (
          <View style={styles.deskGrid}>
            {current.map((lecture, idx) => (
              <Pressable
                key={lecture.id}
                onPress={() => router.push(`/modules/${moduleId}/lectures/${lecture.id}` as never)}
                style={({ pressed }) => [
                  styles.deskLectureCard,
                  { backgroundColor: st.surface, borderColor: st.border },
                  pressed && { backgroundColor: st.surfacePressed, transform: [{ scale: 0.98 }] },
                ]}
              >
                <View style={[styles.deskLectureIcon, practical ? { backgroundColor: 'rgba(99,102,241,0.12)' } : { backgroundColor: st.surfacePressed }]}>
                  {practical ? <Microscope size={20} color="#6366F1" /> : <PlayCircle size={20} color={st.muted} />}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={2} style={{ color: st.text, fontSize: 15, fontFamily: fonts.sansBold, lineHeight: 20 }}>{lecture.title}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <Text style={{ color: st.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                      {practical ? t('subject.skill') : t('subject.step')} {idx + 1}
                    </Text>
                    {lecture.questionsCount > 0 && <HelpCircle size={11} color={colors.primary} />}
                    {lecture.filesCount > 0 && <FileText size={11} color="#60A5FA" />}
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    );
  } else {
    body = (
      <View>
        {/* Capsule switcher */}
        {hasPractical && (
          <View style={[styles.switcher, { backgroundColor: st.surfacePressed }]}>
            <Pressable
              onPress={() => setActiveTab('lectures')}
              style={[styles.switcherBtn, activeTab === 'lectures' && { backgroundColor: st.surface }]}
            >
              <BookOpen size={16} color={activeTab === 'lectures' ? st.text : st.muted} />
              <Text style={{ color: activeTab === 'lectures' ? st.text : st.muted, fontSize: 14, fontWeight: '500' }}>
                {t('subject.lectures')}
              </Text>
              <Text style={{ color: activeTab === 'lectures' ? st.text : st.muted, fontSize: 12, opacity: 0.7, fontVariant: ['tabular-nums'] }}>
                {lectures.length}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('practical')}
              style={[styles.switcherBtn, activeTab === 'practical' && { backgroundColor: st.surface }]}
            >
              <Microscope size={16} color={activeTab === 'practical' ? st.text : st.muted} />
              <Text style={{ color: activeTab === 'practical' ? st.text : st.muted, fontSize: 14, fontWeight: '500' }}>
                {t('subject.practical')}
              </Text>
              <Text style={{ color: activeTab === 'practical' ? st.text : st.muted, fontSize: 12, opacity: 0.7, fontVariant: ['tabular-nums'] }}>
                {practicalLectures.length}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Section header */}
        <View style={styles.sectionHeader}>
          <Text style={{ color: st.text, fontSize: 15, fontWeight: '600', fontFamily: fonts.sansBold }}>
            {practical ? t('subject.clinicalSessions') : t('subject.lectures')}
          </Text>
          <Text style={{ color: st.muted, fontSize: 13, fontVariant: ['tabular-nums'] }}>{current.length}</Text>
        </View>

        {current.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: st.surface, borderColor: st.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: st.surfacePressed }]}>
              <BookOpen size={20} color={st.muted} />
            </View>
            <Text style={{ color: st.text, fontSize: 15, fontWeight: '600', fontFamily: fonts.sansBold }}>{t('subject.beingPrepared')}</Text>
            <Text style={{ color: st.muted, fontSize: 14, marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
              {t('subject.beingPreparedDesc')}
            </Text>
          </View>
        ) : (
          <View style={[styles.insetCard, { backgroundColor: st.surface, borderColor: st.border }]}>
            {current.map((lecture, idx) => {
              const LectureIcon = practical ? Microscope : PlayCircle;
              return (
                <Pressable
                  key={lecture.id}
                  onPress={() => router.push(`/modules/${moduleId}/lectures/${lecture.id}` as never)}
                  style={({ pressed }) => [
                    styles.insetRow,
                    idx > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: st.border },
                    pressed && { backgroundColor: st.surfacePressed },
                  ]}
                >
                  <View style={[styles.rowIcon, { backgroundColor: st.surfacePressed }]}>
                    <LectureIcon size={18} color={st.text} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={2} style={{ color: st.text, fontSize: 16, fontWeight: '500', lineHeight: 21, letterSpacing: -0.1, fontFamily: fonts.sans }}>
                      {lecture.title}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <Text style={{ color: st.muted, fontSize: 13, fontWeight: '600' }}>
                        {practical ? t('subject.skill') : t('subject.step')} {idx + 1}
                      </Text>
                      {lecture.questionsCount > 0 && <HelpCircle size={12} color={st.muted} />}
                      {lecture.filesCount > 0 && <FileText size={12} color={st.muted} />}
                    </View>
                  </View>
                  <ChevronRight size={18} color={st.muted} />
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: st.bg, paddingTop: insets.top + 8 }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + SCROLL_BOTTOM_PAD, maxWidth: isTablet ? 1100 : undefined, alignSelf: isTablet ? 'center' : undefined, width: '100%' }}
        refreshControl={
          <RefreshControl refreshing={bundle.isRefetching} onRefresh={() => bundle.refetch()} tintColor={st.muted} />
        }
      >
        {header}
        {body}
      </ScrollView>
      {!isTablet && <FadeEdges />}
    </View>
  );
}

function DeskStat({ value, label, st, fonts }: { value: number; label: string; st: any; fonts: any }) {
  return (
    <View style={{ alignItems: 'flex-end' }}>
      <Text style={{ color: st.text, fontSize: 18, fontFamily: fonts.sansBold }}>{value}</Text>
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
  switcher: { flexDirection: 'row', borderRadius: 999, padding: 4, marginBottom: 20 },
  switcherBtn: {
    flex: 1, minHeight: 40, borderRadius: 999, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 4, marginBottom: 8,
  },
  insetCard: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  insetRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 12 },
  rowIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  emptyCard: {
    borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center',
    paddingVertical: 44, paddingHorizontal: 24, marginTop: 8,
  },
  emptyIcon: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  deskHeader: { borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, padding: 22 },
  deskSubjectIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  deskTabs: { flexDirection: 'row', alignSelf: 'flex-start', gap: 4, padding: 6, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  deskTab: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 22, paddingVertical: 10, borderRadius: 10 },
  deskGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  deskLectureCard: {
    width: '23%', minWidth: 220, flexGrow: 1, flexDirection: 'row', gap: 14,
    borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 16, alignItems: 'flex-start',
  },
  deskLectureIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
