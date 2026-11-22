import React, { useMemo, useState } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft, ArrowUpRight, ChevronRight, Sparkles, Share2, PlayCircle,
  FolderArchive, Mic2, Brain, CheckCircle2, AlignLeft, ListChecks,
  FileText, Heart, MessageCircle, File as FileIcon,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { FadeEdges } from '@/components/FadeEdges';
import { TABLET_BREAKPOINT } from '@/theme/tokens';
import { fixtureLecture } from '@/lib/fixtures';

type TabId = 'overview' | 'videos' | 'materials' | 'recordings' | 'flashcards' | 'questions' | 'notes' | 'checklist';

/** Section accent identity from the site's LectureExperienceClient. */
const SECTION_META: Record<string, { icon: any; label: string; subtitle: string; goal: string; tint: string; fg: string }> = {
  videos: { icon: PlayCircle, label: 'Videos', subtitle: 'Watch & review the lecture', goal: 'Watch', tint: 'rgba(99,102,241,0.12)', fg: '#6366F1' },
  materials: { icon: FolderArchive, label: 'Materials', subtitle: 'PDFs, slides & downloads', goal: 'Download', tint: 'rgba(245,158,11,0.12)', fg: '#D97706' },
  recordings: { icon: Mic2, label: 'Recordings', subtitle: 'Audio & video revisions', goal: 'Listen', tint: 'rgba(244,63,94,0.12)', fg: '#F43F5E' },
  flashcards: { icon: Brain, label: 'Flashcards', subtitle: 'Memorize with smart cards', goal: 'Practice', tint: 'rgba(139,92,246,0.12)', fg: '#8B5CF6' },
  questions: { icon: CheckCircle2, label: 'Questions', subtitle: 'Test yourself with MCQs', goal: 'Test', tint: 'rgba(16,185,129,0.12)', fg: '#10B981' },
  notes: { icon: AlignLeft, label: 'Notes', subtitle: 'Annotate & save your notes', goal: 'Write', tint: 'rgba(6,182,212,0.12)', fg: '#06B6D4' },
  checklist: { icon: ListChecks, label: 'Checklist', subtitle: 'Verify practical procedure steps', goal: 'Verify', tint: 'rgba(249,115,22,0.12)', fg: '#F97316' },
};
const START_PRIORITY: TabId[] = ['videos', 'flashcards', 'questions', 'materials', 'recordings', 'checklist', 'notes'];

/** /modules/[id]/lectures/[lectureId] — pixel match of the site's mobile
 *  lecture experience: compact top bar (back, title, AI sparkle), section
 *  tab strip with underline, and the Antigravity-style overview index
 *  ("Start here" hero card + 2-col section tiles). Fixture data until the
 *  wiring phase. */
export default function LectureScreen() {
  const { lectureId } = useLocalSearchParams<{ id: string; lectureId: string }>();
  const { st, fonts } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;

  const lecture = useMemo(() => fixtureLecture(lectureId ?? 'l1'), [lectureId]);
  const [active, setActive] = useState<TabId>('overview');
  const [notesMode, setNotesMode] = useState<'cards' | 'annotator'>('cards');

  const counts: Record<TabId, number | undefined> = {
    overview: undefined,
    videos: lecture.videos.length,
    materials: lecture.files.length,
    recordings: lecture.records.length,
    flashcards: lecture.flashcards.length,
    questions: lecture.questions.length,
    notes: undefined,
    checklist: lecture.checklist?.items.length,
  };
  const tabs = (Object.keys(SECTION_META) as TabId[]).filter((id) => id !== 'checklist' || lecture.checklist);
  const totalItems = tabs.reduce((sum, id) => sum + (counts[id] ?? 0), 0);

  const startSection = START_PRIORITY
    .map((id) => tabs.includes(id) ? id : null)
    .find((id): id is TabId => !!id && (counts[id] ?? 0) > 0) ?? null;
  const gridSections = tabs.filter((id) => id !== startSection);
  const lastIsWide = gridSections.length % 2 === 1;

  const kindLabel = lecture.type === 'PRACTICAL' ? t('lecture.practicalLecture') : t('lecture.lecture');

  const emptyPane = (icon: any, title: string, desc: string, fg: string) => {
    const Icon = icon;
    return (
      <View style={[styles.emptyCard, { backgroundColor: st.surface, borderColor: st.border }]}>
        <View style={[styles.emptyIcon, { backgroundColor: st.surfacePressed }]}>
          <Icon size={22} color={fg} />
        </View>
        <Text style={{ color: st.text, fontSize: 15, fontWeight: '600', fontFamily: fonts.sansBold }}>{title}</Text>
        <Text style={{ color: st.muted, fontSize: 13, marginTop: 6, textAlign: 'center' }}>{desc}</Text>
      </View>
    );
  };

  const ctaPill = (goal: string, fg: string) => (
    <View style={[styles.goalPill, { backgroundColor: fg }]}>
      <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '600' }}>{goal}</Text>
      <ArrowUpRight size={14} color="#FFF" strokeWidth={2.25} />
    </View>
  );

  const overviewPane = (
    <View>
      {/* Title block */}
      <View style={{ paddingHorizontal: 4, paddingBottom: 20, paddingTop: 4 }}>
        <Text style={{ color: st.muted, fontSize: 11, fontWeight: '600', letterSpacing: 1.1, textTransform: 'uppercase' }}>{kindLabel}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginTop: 8 }}>
          <Text style={{ flex: 1, color: st.text, fontSize: 24, lineHeight: 31, fontFamily: fonts.sansBold }}>{lecture.title}</Text>
          <Pressable style={[styles.shareBtn, { backgroundColor: st.surface, borderColor: st.border }]} accessibilityLabel={t('lecture.share')}>
            <Share2 size={16} color={st.text} />
          </Pressable>
        </View>
        <Text style={{ color: st.muted, fontSize: 13, marginTop: 8 }}>
          {tabs.length} {t('lecture.sections')}{totalItems > 0 ? ` · ${totalItems} ${t('lecture.items')}` : ''}
        </Text>
      </View>

      {/* Start here */}
      {startSection && (
        <Pressable
          onPress={() => setActive(startSection)}
          style={({ pressed }) => [
            styles.startCard,
            { backgroundColor: st.surface, borderColor: st.border },
            pressed && { backgroundColor: st.surfacePressed, transform: [{ scale: 0.985 }] },
          ]}
        >
          <View style={[styles.startChip, { backgroundColor: SECTION_META[startSection].tint, borderColor: SECTION_META[startSection].tint }]}>
            {React.createElement(SECTION_META[startSection].icon, { size: 24, color: SECTION_META[startSection].fg, strokeWidth: 1.75 })}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: st.muted, fontSize: 11, fontWeight: '600', letterSpacing: 1.1, textTransform: 'uppercase' }}>{t('lecture.startHere')}</Text>
            <Text numberOfLines={1} style={{ color: st.text, fontSize: 17, fontWeight: '600', marginTop: 6, fontFamily: fonts.sansBold }}>
              {SECTION_META[startSection].label}
            </Text>
            <Text numberOfLines={1} style={{ color: st.muted, fontSize: 13, marginTop: 4 }}>
              {counts[startSection]} {t('lecture.items')} · {SECTION_META[startSection].subtitle}
            </Text>
          </View>
          {ctaPill(SECTION_META[startSection].goal, SECTION_META[startSection].fg)}
        </Pressable>
      )}

      {/* Tile grid */}
      <View style={styles.tileGrid}>
        {gridSections.map((id, index) => {
          const meta = SECTION_META[id];
          const count = counts[id];
          const empty = count !== undefined && count === 0;
          const wide = lastIsWide && index === gridSections.length - 1;
          const Icon = meta.icon;
          return (
            <Pressable
              key={id}
              onPress={() => setActive(id)}
              style={({ pressed }) => [
                styles.tile,
                { backgroundColor: st.surface, borderColor: st.border },
                wide && styles.tileWide,
                empty && { opacity: 0.55 },
                pressed && { backgroundColor: st.surfacePressed, transform: [{ scale: 0.97 }] },
              ]}
            >
              {wide ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                  <View style={[styles.tileChip, { backgroundColor: meta.tint, borderColor: meta.tint }]}>
                    <Icon size={18} color={meta.fg} strokeWidth={1.85} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ color: st.text, fontSize: 15, fontWeight: '600', fontFamily: fonts.sansBold }}>{meta.label}</Text>
                    <Text numberOfLines={2} style={{ color: st.muted, fontSize: 12, marginTop: 4, lineHeight: 17 }}>{meta.subtitle}</Text>
                  </View>
                  {count !== undefined && (
                    <Text style={{ color: st.muted, fontSize: 13, fontWeight: '500', fontVariant: ['tabular-nums'] }}>
                      {empty ? t('lecture.empty') : count}
                    </Text>
                  )}
                  <ChevronRight size={18} color={st.muted} />
                </View>
              ) : (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <View style={[styles.tileChip, { backgroundColor: meta.tint, borderColor: meta.tint }]}>
                      <Icon size={18} color={meta.fg} strokeWidth={1.85} />
                    </View>
                    {count !== undefined && (
                      <Text style={{ color: st.muted, fontSize: 13, fontWeight: '500', fontVariant: ['tabular-nums'] }}>
                        {empty ? t('lecture.empty') : count}
                      </Text>
                    )}
                  </View>
                  <View style={{ marginTop: 12 }}>
                    <Text numberOfLines={1} style={{ color: st.text, fontSize: 15, fontWeight: '600', fontFamily: fonts.sansBold }}>{meta.label}</Text>
                    <Text numberOfLines={2} style={{ color: st.muted, fontSize: 12, marginTop: 4, lineHeight: 17 }}>{meta.subtitle}</Text>
                  </View>
                </>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const listPane = (id: TabId) => {
    const meta = SECTION_META[id];
    switch (id) {
      case 'videos':
        return lecture.videos.length === 0
          ? emptyPane(meta.icon, t('lecture.noVideos'), t('lecture.noVideosDesc'), meta.fg)
          : (
            <View style={{ gap: 12 }}>
              {lecture.videos.map((v) => (
                <Pressable key={v.id} style={({ pressed }) => [styles.mediaCard, { backgroundColor: st.surface, borderColor: st.border }, pressed && { backgroundColor: st.surfacePressed }]}>
                  <View style={[styles.thumb, { backgroundColor: meta.tint }]}>
                    <PlayCircle size={28} color={meta.fg} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={2} style={{ color: st.text, fontSize: 15, fontWeight: '600', lineHeight: 20, fontFamily: fonts.sans }}>{v.title}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Heart size={12} color={st.muted} />
                        <Text style={{ color: st.muted, fontSize: 12 }}>{v.likesCount}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <MessageCircle size={12} color={st.muted} />
                        <Text style={{ color: st.muted, fontSize: 12 }}>{v.commentsCount}</Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          );
      case 'materials':
        return lecture.files.length === 0
          ? emptyPane(meta.icon, t('lecture.noMaterials'), t('lecture.noMaterialsDesc'), meta.fg)
          : (
            <View style={[styles.insetCard, { backgroundColor: st.surface, borderColor: st.border }]}>
              {lecture.files.map((f, idx) => (
                <Pressable key={f.id} style={({ pressed }) => [styles.insetRow, idx > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: st.border }, pressed && { backgroundColor: st.surfacePressed }]}>
                  <View style={[styles.rowIcon, { backgroundColor: meta.tint }]}>
                    <FileText size={18} color={meta.fg} />
                  </View>
                  <Text numberOfLines={2} style={{ flex: 1, color: st.text, fontSize: 15, lineHeight: 20, fontFamily: fonts.sans }}>{f.name}</Text>
                  <ChevronRight size={18} color={st.muted} />
                </Pressable>
              ))}
            </View>
          );
      case 'recordings':
        return lecture.records.length === 0
          ? emptyPane(meta.icon, t('lecture.noRecordings'), t('lecture.noRecordingsDesc'), meta.fg)
          : (
            <View style={[styles.insetCard, { backgroundColor: st.surface, borderColor: st.border }]}>
              {lecture.records.map((r, idx) => (
                <Pressable key={r.id} style={({ pressed }) => [styles.insetRow, idx > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: st.border }, pressed && { backgroundColor: st.surfacePressed }]}>
                  <View style={[styles.rowIcon, { backgroundColor: meta.tint }]}>
                    <Mic2 size={18} color={meta.fg} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={2} style={{ color: st.text, fontSize: 15, lineHeight: 20, fontFamily: fonts.sans }}>{r.title}</Text>
                    <Text style={{ color: st.muted, fontSize: 12, marginTop: 2 }}>{r.sourceType}</Text>
                  </View>
                  <ChevronRight size={18} color={st.muted} />
                </Pressable>
              ))}
            </View>
          );
      case 'flashcards':
      case 'questions': {
        const count = counts[id] ?? 0;
        return count === 0
          ? emptyPane(meta.icon, t('lecture.emptySection'), t('lecture.emptySectionDesc'), meta.fg)
          : (
            <View style={[styles.emptyCard, { backgroundColor: st.surface, borderColor: st.border }]}>
              <View style={[styles.emptyIcon, { backgroundColor: meta.tint }]}>
                {React.createElement(meta.icon, { size: 26, color: meta.fg })}
              </View>
              <Text style={{ color: st.text, fontSize: 17, fontWeight: '700', fontFamily: fonts.sansBold }}>
                {count} {id === 'flashcards' ? t('lecture.cardsCount') : t('lecture.questionsCount')}
              </Text>
              <Text style={{ color: st.muted, fontSize: 13, marginTop: 6, textAlign: 'center' }}>{meta.subtitle}</Text>
              <View style={{ marginTop: 16 }}>{ctaPill(meta.goal, meta.fg)}</View>
            </View>
          );
      }
      case 'notes':
        return (
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <AlignLeft size={16} color={st.text} />
                <Text style={{ color: st.text, fontSize: 13, fontWeight: '500' }}>{t('lecture.notes')}</Text>
              </View>
              <View style={[styles.notesSwitch, { backgroundColor: st.surfacePressed }]}>
                {(['cards', 'annotator'] as const).map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => setNotesMode(m)}
                    style={[styles.notesSwitchBtn, notesMode === m && { backgroundColor: st.surface }]}
                  >
                    <Text style={{ color: notesMode === m ? st.text : st.muted, fontSize: 12, fontWeight: '500' }}>
                      {m === 'cards' ? t('lecture.notesCards') : t('lecture.notesAnnotator')}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={[styles.notesCard, { backgroundColor: st.surface, borderColor: st.border }]}>
              <Text style={{ color: st.text, fontSize: 15, lineHeight: 24, fontFamily: fonts.sans }}>{lecture.notesMarkdown}</Text>
            </View>
          </View>
        );
      case 'checklist':
        return !lecture.checklist ? null : (
          <View style={{ gap: 12 }}>
            {lecture.checklist.items.map((item, i) => (
              <View key={item.id} style={[styles.checkItem, { backgroundColor: st.surface, borderColor: st.border }]}>
                <View style={[styles.checkNum, { borderColor: st.border }]}>
                  <Text style={{ color: st.muted, fontSize: 10, fontWeight: '800' }}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: st.text, fontSize: 14, fontWeight: '700', fontFamily: fonts.sans }}>{item.content}</Text>
                  {item.isCritical && (
                    <View style={styles.criticalPill}>
                      <Text style={{ color: '#EF4444', fontSize: 8, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' }}>{t('lecture.criticalStep')}</Text>
                    </View>
                  )}
                </View>
                <View style={[styles.ptsChip, { backgroundColor: st.surfacePressed, borderColor: st.border }]}>
                  <Text style={{ color: st.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>+{item.points} pts</Text>
                </View>
              </View>
            ))}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: st.bg }]}>
      {/* Compact top bar — matches the site's mobile lecture toolbar */}
      <View style={{ paddingTop: insets.top }}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => (active === 'overview' ? (router.canGoBack() ? router.back() : router.replace('/(tabs)/modules' as never)) : setActive('overview'))}
            hitSlop={8}
            style={styles.iconBtn}
            accessibilityLabel={t('moduleDetail.back')}
          >
            <ArrowLeft size={19} color={st.text} strokeWidth={1.75} />
          </Pressable>
          <Text numberOfLines={1} style={[styles.topTitle, { color: st.text, fontFamily: fonts.sansBold }]}>{lecture.title}</Text>
          <Pressable hitSlop={8} style={styles.iconBtn} accessibilityLabel="Lecture AI">
            <Sparkles size={19} color={st.text} strokeWidth={1.75} />
          </Pressable>
        </View>

        {/* Section tab strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 4 }}
          style={{ flexGrow: 0 }}
        >
          {(['overview', ...tabs] as TabId[]).map((id) => (
            <Pressable key={id} onPress={() => setActive(id)} style={styles.tabBtn}>
              <Text style={{ color: active === id ? st.text : st.muted, fontSize: 13, fontWeight: '500' }}>
                {id === 'overview' ? t('lecture.overview') : SECTION_META[id].label}
              </Text>
              {active === id && <View style={[styles.tabUnderline, { backgroundColor: st.text }]} />}
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16, paddingTop: 12, paddingBottom: 120,
          maxWidth: isTablet ? 960 : undefined, alignSelf: isTablet ? 'center' : undefined, width: '100%',
        }}
      >
        {active === 'overview' ? overviewPane : listPane(active)}
      </ScrollView>

      {!isTablet && <FadeEdges top={false} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 56, paddingHorizontal: 16 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  topTitle: { flex: 1, fontSize: 15, fontWeight: '600' },
  tabBtn: { height: 44, justifyContent: 'center', paddingHorizontal: 12, position: 'relative' },
  tabUnderline: { position: 'absolute', left: 12, right: 12, bottom: 0, height: 2, borderRadius: 1 },
  shareBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  startCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth, padding: 16, marginBottom: 12,
  },
  startChip: { width: 48, height: 48, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  goalPill: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 36, borderRadius: 18, paddingHorizontal: 14 },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    width: '47%', flexGrow: 1, minHeight: 116, justifyContent: 'space-between',
    borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 14,
  },
  tileWide: { width: '100%', minHeight: 80, justifyContent: 'center' },
  tileChip: { width: 36, height: 36, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  emptyCard: {
    borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center',
    paddingVertical: 44, paddingHorizontal: 24,
  },
  emptyIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  mediaCard: { flexDirection: 'row', gap: 14, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 12, alignItems: 'center' },
  thumb: { width: 96, height: 64, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  insetCard: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  insetRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 12 },
  rowIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  notesSwitch: { flexDirection: 'row', borderRadius: 999, padding: 2, gap: 2 },
  notesSwitchBtn: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  notesCard: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 18 },
  checkItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 18 },
  checkNum: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  criticalPill: {
    alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999,
    backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(239,68,68,0.25)',
  },
  ptsChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth },
});
