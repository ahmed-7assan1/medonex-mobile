import{useStudentDimensions as useWindowDimensions}from'@/lib/student-viewport';
import React, { useMemo, useRef, useState } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, Modal, } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft, LayoutGrid, RotateCcw, Target, Trophy, Clock, Calendar,
  ChevronDown, ChevronUp, X,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { FadeEdges } from '@/components/FadeEdges';
import { TABLET_BREAKPOINT, SCROLL_BOTTOM_PAD } from '@/theme/tokens';
import { GLASS_OPACITY, PERF_TIER } from '@/theme/perf';
import { getQuizResult,setQuizResult,type QuizResult } from '@/lib/quiz-store';
import { QuizQuestionHeader, QuizQuestionContent } from '@/components/quiz/QuizQuestion';
import {ShareScoreCard} from '@/components/quiz/ShareScoreCard';

/** /quiz/results — pixel match of the site's attempt results page
 *  (quiz/attempt/[attemptId]/page.tsx + ResultsReview + ResultsChrome):
 *  glass top bar (back, question map, Try again pill), title + date/time
 *  pills, big glass score circle with score-colored ring, status pill,
 *  collapsible review rows, question-map sheet, retake sheet. Reads the
 *  last attempt from the in-memory quiz store until the wiring phase. */
export default function QuizResultsScreen(){return <QuizResultsView result={getQuizResult()}/>;}
export function QuizResultsView({result}:{result:QuizResult|null}) {
  const { colors, fonts, isDark } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {viewportWidth, width } = useWindowDimensions();
  const isTablet = viewportWidth >= TABLET_BREAKPOINT;

  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [mapOpen, setMapOpen] = useState(false);
  const [retakeOpen, setRetakeOpen] = useState(false);
  const reviewTop = useRef(0);
  const offsets = useRef<Record<number, number>>({});
  const scrollRef = useRef<ScrollView>(null);

  const glassBg = isDark ? `rgba(255,255,255,${GLASS_OPACITY.dark})` : `rgba(255,255,255,${GLASS_OPACITY.light})`;
  const glassRing = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.10)';

  const missed = useMemo(() => (result ? result.items.filter((i) => !i.isCorrect) : []), [result]);

  if (!result) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.mutedForeground, fontFamily: fonts.sans, textAlign:'center',padding:24 }}>{t('common.noPracticeResult',{defaultValue:'No practice result on this device yet.'})}</Text><Pressable accessibilityRole="button" onPress={()=>router.replace('/qbank')} style={{padding:16}}><Text style={{color:colors.primary,fontFamily:fonts.sansBold}}>{t('quiz.backToQuizzes')}</Text></Pressable>
      </View>
    );
  }

  const retryPath=`/quiz/${result.source==='lecture'?'lecture/':''}${encodeURIComponent(result.paperId)}`;
  const score = result.score;
  const accent = score >= 70 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';
  const accentFg = score >= 70 ? (isDark ? '#6EE7B7' : '#047857') : score >= 50 ? (isDark ? '#FCD34D' : '#B45309') : (isDark ? '#FCA5A5' : '#DC2626');
  const statusLabel = score >= 70 ? t('quiz.passed') : score >= 50 ? t('quiz.average') : t('quiz.needsWork');

  const mins = Math.floor(result.timeTaken / 60);
  const secs = result.timeTaken % 60;
  const dateLabel = result.createdAt&&Number.isFinite(Date.parse(result.createdAt))?new Date(result.createdAt).toLocaleDateString('en-US', { dateStyle: 'long' }):'Date unavailable';

  const toggleExpand = (i: number) => {
    // Keep one rich renderer mounted so long papers do not create a WebView per answer.
    setExpanded((prev) => prev.has(i) ? new Set() : new Set([i]));
  };

  const jumpTo = (i: number) => {
    setMapOpen(false);
    setExpanded(new Set([i]));
    setTimeout(() => {
      const y = offsets.current[i];
      if (typeof y === 'number') scrollRef.current?.scrollTo({ y: Math.max(0, reviewTop.current + y - 80), animated: PERF_TIER !== 'low' });
    }, 120);
  };

  const pill = (icon: React.ReactNode, label: string) => (
    <View style={[styles.metaPill, { backgroundColor: glassBg, borderColor: glassRing }]}>
      {icon}
      <Text style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: fonts.sans }}>{label}</Text>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {result?.localOnly&&<View style={{paddingTop:insets.top+8,paddingHorizontal:20,backgroundColor:colors.background}}><Text style={{color:colors.mutedForeground,fontSize:12,textAlign:'center'}}>Practice result on this device. Not saved to your account.</Text></View>}
      {/* Top bar: back / question map + try again */}
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <View style={styles.topRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('quiz.backToQuizzes')}
            onPress={() => router.replace('/qbank')}
            style={[styles.glassCircle, { backgroundColor: glassBg, borderColor: glassRing }]}
          >
            <ArrowLeft size={16} color={colors.foreground} />
          </Pressable>
          <View style={{ flex: 1 }} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('quiz.jumpToQuestion')}
            onPress={() => setMapOpen(true)}
            style={[styles.glassCircle, { backgroundColor: glassBg, borderColor: glassRing }]}
          >
            <LayoutGrid size={16} color={colors.foreground} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('quiz.tryAgain')}
            disabled={!result.paperId}
            onPress={() => (missed.length > 0 ? setRetakeOpen(true) : router.replace(retryPath as never))}
            style={[styles.tryPill, { backgroundColor: colors.primary }]}
          >
            <RotateCcw size={14} color={colors.primaryForeground} />
            <Text style={{ color: colors.primaryForeground, fontSize: 12, fontFamily: fonts.sansBold, letterSpacing: 1.2, textTransform: 'uppercase' }}>
              {t('quiz.tryAgain')}
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 64,
          paddingBottom: insets.bottom + SCROLL_BOTTOM_PAD,
          paddingHorizontal: 16,
          maxWidth: 768,
          width: '100%',
          alignSelf: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ color: colors.foreground, fontSize: 24, fontFamily: fonts.display, marginBottom: 4 }}>{result.title}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, marginBottom: 24 }}>
          {pill(<Calendar size={14} color={colors.mutedForeground} />, dateLabel)}
          {pill(<Clock size={14} color={colors.mutedForeground} />, `${mins}m ${String(secs).padStart(2, '0')}s`)}
          {!!result.focusLossCount&&pill(null,`${result.focusLossCount} tab switch${result.focusLossCount===1?'':'es'} recorded`)}
        </View>

        {/* Score — glass circle */}
        <View style={{ alignItems: 'center', gap: 20, marginBottom: 40 }}>
          <View style={[styles.scoreCircle, { backgroundColor: glassBg, borderColor: accent + '66' }]}>
            <Text style={{ color: accentFg, fontSize: 48, fontFamily: fonts.display }}>{score}%</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
            <View style={[styles.statusPill, { backgroundColor: accent + '1A', borderColor: accent + '4D' }]}>
              <Trophy size={14} color={accentFg} />
              <Text style={{ color: accentFg, fontSize: 12, fontFamily: fonts.sansBold }}>{statusLabel}</Text>
            </View>
            <View style={[styles.metaPill, { backgroundColor: glassBg, borderColor: glassRing }]}>
              <Text style={{ color: colors.mutedForeground, fontSize: 10, fontFamily: fonts.sansMedium }}>
                {t('quiz.correctLine', { c: result.correct, n: result.total })}{result.items.some(item=>item.question.questionType==='ESSAY')?' • essays count as partial credit':''}
              </Text>
            </View>
          </View>
          <ShareScoreCard result={result}/>
        </View>

        <Text style={{ color: colors.foreground, fontSize: 20, fontFamily: fonts.sansSemiBold, marginBottom: 16 }}>
          {t('quiz.reviewAnswers')}
        </Text>

        <View onLayout={event=>{reviewTop.current=event.nativeEvent.layout.y}} style={{ gap: 16 }}>
          {result.items.map((item, i) => {
            const isOpen = expanded.has(i);
            const snippet = item.question.body.replace(/\s+/g, ' ').trim().slice(0, 56);
            if (!isOpen) {
              return (
                <Pressable
                  key={item.question.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Review question ${i+1}`}
                  accessibilityState={{ expanded: false }}
                  onPress={() => toggleExpand(i)}
                  onLayout={(e) => { offsets.current[i] = e.nativeEvent.layout.y; }}
                  style={[styles.reviewRow, { backgroundColor: glassBg, borderColor: glassRing }]}
                >
                  <View style={[
                    styles.reviewNum,
                    item.isCorrect
                      ? { backgroundColor: 'rgba(16,185,129,0.10)', borderColor: 'rgba(16,185,129,0.4)' }
                      : { backgroundColor: 'rgba(239,68,68,0.10)', borderColor: 'rgba(239,68,68,0.4)' },
                  ]}>
                    <Text style={{ color: item.isCorrect ? '#059669' : '#DC2626', fontSize: 11, fontFamily: fonts.sansBold }}>{i + 1}</Text>
                  </View>
                  <Text numberOfLines={1} style={{ flex: 1, color: colors.foreground + 'D9', fontSize: 12, fontFamily: fonts.sansMedium }}>{snippet}</Text>
                  <ChevronDown size={16} color={colors.mutedForeground} />
                </Pressable>
              );
            }
            return (
              <View key={item.question.id} onLayout={(e) => { offsets.current[i] = e.nativeEvent.layout.y; }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Hide answer to question ${i+1}`}
                  accessibilityState={{ expanded: true }}
                  onPress={() => toggleExpand(i)}
                  style={[styles.hidePill, { backgroundColor: glassBg, borderColor: glassRing }]}
                >
                  <Text style={{ color: colors.mutedForeground, fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 1.4, textTransform: 'uppercase' }}>
                    {t('quiz.hideAnswer')}
                  </Text>
                  <ChevronUp size={16} color={colors.mutedForeground} />
                </Pressable>
                <QuizQuestionHeader question={item.question} index={i} />
                <QuizQuestionContent question={item.question} showResult selectedAnswer={item.chosen} essayReview={item.essayReview} />
              </View>
            );
          })}
        </View>
      </ScrollView>

      <FadeEdges top bottom />

      {/* Question map sheet */}
      <Modal visible={mapOpen} transparent animationType={PERF_TIER === 'low' ? 'none' : 'slide'} onRequestClose={() => setMapOpen(false)}>
        <Pressable accessibilityRole="button" style={styles.backdrop} onPress={() => setMapOpen(false)}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              isTablet
                ? [styles.sheetModal, { backgroundColor: colors.card, borderColor: colors.border }]
                : [styles.sheet, { backgroundColor: isDark ? 'rgba(20,20,22,0.97)' : 'rgba(255,255,255,0.97)', borderColor: glassRing, paddingBottom: Math.max(40, insets.bottom + 24) }],
            ]}
          >
            {!isTablet && <View style={[styles.grabber, { backgroundColor: colors.mutedForeground + '40' }]} />}
            <View style={styles.sheetHead}>
              <Text style={{ color: colors.mutedForeground, fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 1.4, textTransform: 'uppercase' }}>
                {t('quiz.jumpToQuestion')}
              </Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setMapOpen(false)} style={{ padding: 8 }}>
                <X size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <View style={styles.jumpGrid}>
                {result.items.map((item, i) => {
                  const borderColor = item.isCorrect ? '#10B981' : '#F87171';
                  const backgroundColor = item.isCorrect ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)';
                  const color = item.isCorrect ? '#047857' : '#B91C1C';
                  return (
                    <Pressable
                      key={item.question.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Question ${i + 1}`}
                      onPress={() => jumpTo(i)}
                      style={[styles.jumpBtn, { borderColor, backgroundColor }]}
                    >
                      <Text style={{ color, fontSize: 12, fontFamily: fonts.sansBold }}>{i + 1}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Retake sheet */}
      <Modal visible={retakeOpen} transparent animationType={PERF_TIER === 'low' ? 'none' : 'slide'} onRequestClose={() => setRetakeOpen(false)}>
        <Pressable accessibilityRole="button" style={styles.backdrop} onPress={() => setRetakeOpen(false)}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[styles.sheet, { backgroundColor: isDark ? 'rgba(20,20,22,0.97)' : 'rgba(255,255,255,0.97)', borderColor: glassRing, paddingBottom: Math.max(24, insets.bottom + 20) }, isTablet && styles.sheetModal, isTablet && { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            {!isTablet && <View style={[styles.grabber, { backgroundColor: colors.mutedForeground + '40' }]} />}
            <View style={{ paddingHorizontal: 20, paddingBottom: 6, paddingTop: isTablet ? 8 : 0 }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 1.4, textTransform: 'uppercase' }}>
                {t('quiz.retakeTitle')}
              </Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 14, marginTop: 6 }}>{t('quiz.retakeHint')}</Text>
            </View>
            <View style={{ paddingHorizontal: 16, gap: 10, marginTop: 8 }}>
              <Pressable
                accessibilityRole="button"
                onPress={() => { setRetakeOpen(false); router.replace(retryPath as never); }}
                style={[styles.optionRow, { backgroundColor: glassBg, borderColor: glassRing }]}
              >
                <View style={[styles.optionIcon, { backgroundColor: colors.primary + '1A' }]}>
                  <RotateCcw size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontSize: 14, fontFamily: fonts.sansBold }}>{t('quiz.retakeFull')}</Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{t('quiz.retakeFullSub')}</Text>
                </View>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => { setRetakeOpen(false); setQuizResult(result); router.replace(`${retryPath}?missed=1` as never); }}
                style={[styles.optionRow, { backgroundColor: glassBg, borderColor: glassRing }]}
              >
                <View style={[styles.optionIcon, { backgroundColor: 'rgba(139,92,246,0.12)' }]}>
                  <Target size={20} color="#8B5CF6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontSize: 14, fontFamily: fonts.sansBold }}>{t('quiz.reviewMissed')}</Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                    {t('quiz.missedLine', { n: missed.length })}
                  </Text>
                </View>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setRetakeOpen(false)}
                style={[styles.optionCancel, { backgroundColor: glassBg, borderColor: glassRing }]}
              >
                <Text style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: fonts.sansBold, letterSpacing: 1.2, textTransform: 'uppercase' }}>{t('quiz.cancel')}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  topRow: { height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 },
  glassCircle: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  tryPill: {
    height: 36, borderRadius: 18, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  metaPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4,
  },
  scoreCircle: {
    width: 176, height: 176, borderRadius: 88, borderWidth: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 4,
  },
  reviewRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8,
    overflow: 'hidden',
  },
  reviewNum: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  hidePill: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 999, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 8,
    marginBottom: 8,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1,
    maxHeight: '85%', overflow: 'hidden',
  },
  sheetModal: {
    alignSelf: 'center', width: '100%', maxWidth: 512, maxHeight: '80%',
    borderRadius: 16, borderWidth: 1, padding: 16, overflow: 'hidden',
  },
  grabber: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  sheetHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 8,
  },
  jumpGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20,
  },
  jumpBtn: {
    height: 44, minWidth: 44, borderRadius: 10, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  optionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, borderWidth: 1, padding: 14,
  },
  optionIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  optionCancel: {
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 16, borderWidth: 1, paddingVertical: 12, marginTop: 4,
  },
});
