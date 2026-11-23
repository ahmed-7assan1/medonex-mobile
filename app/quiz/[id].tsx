import{useStudentDimensions as useWindowDimensions}from'@/lib/student-viewport';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, Modal, TextInput,
  Linking, PanResponder, Animated, KeyboardAvoidingView, Platform,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  LogOut, ChevronLeft, ChevronRight, CheckCheck, X, BookOpen, GraduationCap,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { FadeEdges } from '@/components/FadeEdges';
import { TABLET_BREAKPOINT, SCROLL_BOTTOM_PAD } from '@/theme/tokens';
import { GLASS_OPACITY, PERF_TIER } from '@/theme/perf';
import { fixtureQuiz, type FixtureQuizQuestion } from '@/lib/fixtures';
import { QuizQuestionHeader, QuizQuestionContent } from '@/components/quiz/QuizQuestion';
import {ResourceState} from '@/components/ResourceState';
import {useQuizData,type QuizData} from '@/lib/quiz-player';
import { setQuizResult, getQuizResult } from '@/lib/quiz-store';

/** /quiz/[id] — pixel match of the site's QuizClient (quiz/QuizClient.tsx):
 *  glass top bar (exit, tutor/exam toggle, session clock, submit pill),
 *  question card header + content, swipe between questions, bottom glass
 *  nav with prev / progress-ring navigator / next, jump-to-question sheet
 *  (bottom sheet on phone, centered modal on tablet), exit & submit
 *  confirmations and a report sheet. Fixture data until the wiring phase. */
export default function QuizResourceScreen(){
 const {id:rawId,lectureId,missed}=useLocalSearchParams<{id?:string;lectureId?:string;missed?:string}>();const id=lectureId||rawId||'';const source=lectureId?'lecture':'paper';const resource=useQuizData(id,source);const {st,fonts}=useTheme();const router=useRouter();const {i18n}=useTranslation();const ar=i18n.language==='ar';
 if(!resource.data)return <ResourceState error={resource.error} onRetry={()=>resource.refetch()} title="Quiz"/>;
 if(resource.data.websiteOnly)return <View style={{flex:1,backgroundColor:st.bg,padding:28,justifyContent:'center',alignItems:'center',gap:20}}><Text style={{color:st.text,fontSize:20,fontFamily:fonts.sansBold,textAlign:'center'}}>{resource.data.title}</Text><Text style={{color:st.muted,fontSize:14,lineHeight:22,textAlign:'center'}}>{ar?'الاختبار ده محتاج تصحيح آمن أو أسئلة مقالية. افتحه على الموقع عشان ما نعرضش تصحيح غير صحيح.':'This quiz uses secure grading or a question format that must be taken on the website. Open it there for correct grading.'}</Text><Pressable accessibilityRole="button" onPress={()=>Linking.openURL(`https://www.medonex.me/quiz/${source==='lecture'?'lecture/':''}${id}`)} style={{backgroundColor:st.text,padding:16,borderRadius:24}}><Text style={{color:st.bg}}>{ar?'فتح على الموقع':'Open on website'}</Text></Pressable><Pressable accessibilityRole="button" onPress={()=>router.back()}><Text style={{color:st.muted}}>{ar?'رجوع':'Back'}</Text></Pressable></View>;
 if(!resource.data.questions.length)return <ResourceState notFound onRetry={()=>resource.refetch()} title="Quiz"/>;
 const previous=missed==='1'?getQuizResult():null;
 const missedIds=new Set(previous&&previous.paperId===id&&(previous.source||'paper')===source?previous.items.filter(item=>!item.isCorrect).map(item=>item.question.id):[]);
 const quiz=missed==='1'?{...resource.data,questions:resource.data.questions.filter(q=>missedIds.has(q.id))}:resource.data;
 if(!quiz.questions.length)return <ResourceState notFound onRetry={()=>router.back()} title="No missed questions stored on this device" message="There are no missed questions from this practice result to retry."/>;
 return <QuizPlayerScreen key={`${source}/${id}/${missed||'all'}`} quiz={quiz}/>;
}
function QuizPlayerScreen({quiz}:{quiz:QuizData}) {
  const { id, missed } = useLocalSearchParams<{ id: string; missed?: string }>();
  const { colors, fonts, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {viewportWidth, width } = useWindowDimensions();
  const isTablet = viewportWidth >= TABLET_BREAKPOINT;

  const [questions] = useState<FixtureQuizQuestion[]>(quiz.questions);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [examMode, setExamMode] = useState(false);
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportNote, setReportNote] = useState('');
  const [reportSent, setReportSent] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  // Slide transition between questions (skipped on low-tier devices).
  const slide = useRef(new Animated.Value(0)).current;
  const animateTo = (dir: number) => {
    if (PERF_TIER === 'low') return;
    slide.setValue(dir * 40);
    Animated.timing(slide, { toValue: 0, duration: 220, useNativeDriver: true }).start();
  };

  const navigateTo = (i: number, dir: number) => {
    setCurrentIndex(i);
    animateTo(dir);
  };

  const currentIndexRef=useRef(currentIndex);currentIndexRef.current=currentIndex;
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 60 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
      onPanResponderRelease: (_e, g) => {
        const index=currentIndexRef.current;
        if (g.dx < -60 && index < questions.length - 1) navigateTo(index + 1, 1);
        else if (g.dx > 60 && index > 0) navigateTo(index - 1, -1);
      },
    }),
  ).current;

  const q = questions[currentIndex];
  const answeredCount = questions.filter((qq) => answers[qq.id]).length;
  const pct = questions.length ? (answeredCount / questions.length) * 100 : 0;

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  const toggleSet = (set: Set<string>, setter: (s: Set<string>) => void, key: string) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key); else next.add(key);
    setter(next);
  };

  const onSelectAnswer = (key: string) => {
    setAnswers((a) => ({ ...a, [q.id]: key }));
    if (!examMode) setRevealed((r) => ({ ...r, [q.id]: true }));
  };

  const submit = () => {
    const items = questions.map((question) => ({
      question,
      chosen: answers[question.id],
      isCorrect: answers[question.id] === question.answer,
    }));
    const correct = items.filter((i) => i.isCorrect).length;
    setQuizResult({
      paperId: quiz.id,
      source:quiz.source,
      localOnly:true,
      title: quiz.title,
      score: Math.round((correct / questions.length) * 100),
      correct,
      total: questions.length,
      timeTaken: seconds,
      items,
    });
    router.replace('/quiz/results' as never);
  };

  const glassBg = isDark ? `rgba(255,255,255,${GLASS_OPACITY.dark})` : `rgba(255,255,255,${GLASS_OPACITY.light})`;
  const glassRing = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.10)';

  const toggleBtn = (active: boolean, label: string, onPress: () => void, icon: React.ReactNode) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.toggleBtn, active && { backgroundColor: colors.primary + '26' }]}
    >
      {icon}
    </Pressable>
  );

  const ringSize = 36;
  const ringR = 15;
  const ringC = 2 * Math.PI * ringR;

  const navStateFor = (qq: FixtureQuizQuestion, i: number) => {
    const done = !!answers[qq.id];
    const rev = !!revealed[qq.id];
    const choice = answers[qq.id];
    const correct = !examMode && rev && choice === qq.answer;
    const wrong = !examMode && rev && choice != null && choice !== qq.answer;
    const isFlagged = flagged.has(qq.id);
    if (i === currentIndex) return { borderColor: colors.primary, backgroundColor: colors.primary + '0D', color: colors.foreground, ring: colors.primary + '4D' };
    if (isFlagged) return { borderColor: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.16)', color: '#B45309' };
    if (correct) return { borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.10)', color: '#047857' };
    if (wrong) return { borderColor: '#F87171', backgroundColor: 'rgba(239,68,68,0.10)', color: '#B91C1C' };
    if (done) return { borderColor: colors.primary + '80', backgroundColor: colors.primary + '1A', color: colors.primary };
    return { borderColor: colors.border, backgroundColor: colors.muted + '4D', color: colors.mutedForeground };
  };

  const jumpGrid = (
    <View style={styles.jumpGrid}>
      {questions.map((qq, i) => {
        const s = navStateFor(qq, i);
        return (
          <Pressable
            key={qq.id}
            accessibilityRole="button"
            accessibilityLabel={`Question ${i + 1}`}
            onPress={() => { navigateTo(i, i > currentIndex ? 1 : -1); setNavigatorOpen(false); }}
            style={[styles.jumpBtn, { borderColor: s.borderColor, backgroundColor: s.backgroundColor }, i === currentIndex && { borderWidth: 2 }]}
          >
            <Text style={{ color: s.color, fontSize: 12, fontFamily: fonts.sansBold }}>{i + 1}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]} {...pan.panHandlers}>
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <View style={styles.topRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('quiz.exit')}
            onPress={() => setExitOpen(true)}
            style={[styles.glassCircle, { backgroundColor: glassBg, borderColor: glassRing }]}
          >
            <LogOut size={16} color={colors.foreground} />
          </Pressable>

          <View style={{ flex: 1 }} />

          <View style={[styles.modeCapsule, { backgroundColor: glassBg, borderColor: glassRing }]}>
            {toggleBtn(!examMode, t('quiz.tutorMode'), () => setExamMode(false),
              <BookOpen size={15} color={!examMode ? colors.primary : colors.mutedForeground} fill={!examMode ? colors.primary : 'transparent'} />)}
            {toggleBtn(examMode, t('quiz.examMode'), () => setExamMode(true),
              <GraduationCap size={15} color={examMode ? colors.primary : colors.mutedForeground} fill={examMode ? colors.primary : 'transparent'} />)}
          </View>

          {!isTablet && (
            <Text style={{ color: colors.mutedForeground, fontSize: 12, fontVariant: ['tabular-nums'], marginHorizontal: 8 }}>{mm}:{ss}</Text>
          )}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('quiz.submitQuiz')}
            onPress={() => setSubmitOpen(true)}
            style={[styles.submitPill, { backgroundColor: colors.primary }]}
          >
            <CheckCheck size={16} color={colors.primaryForeground} />
            {isTablet && (
              <Text style={{ color: colors.primaryForeground, fontSize: 12, fontFamily: fonts.sansBold, letterSpacing: 1.2, textTransform: 'uppercase' }}>
                {t('quiz.submitQuiz')}
              </Text>
            )}
          </Pressable>
        </View>
      </View>

      <Text style={{position:'absolute',top:insets.top+59,left:16,right:16,zIndex:6,color:colors.mutedForeground,fontSize:10,textAlign:'center'}}>{i18n.language==='ar'?'تدريب على الجهاز فقط. الإجابات والعلامات مش بتتحفظ في حسابك.':'Local practice only. Answers, flags and bookmarks are not saved to your account.'}</Text>
      {/* Question */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 88,
          paddingBottom: insets.bottom + SCROLL_BOTTOM_PAD,
          paddingHorizontal: 16,
          maxWidth: 896,
          width: '100%',
          alignSelf: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        <QuizQuestionHeader
          question={q}
          index={currentIndex}
          sessionLabel={`${mm}:${ss}`}
          showClock={isTablet}
          flagged={flagged.has(q.id)}
          bookmarked={bookmarked.has(q.id)}
          onToggleFlag={() => toggleSet(flagged, setFlagged, q.id)}
          onToggleBookmark={() => toggleSet(bookmarked, setBookmarked, q.id)}
          onReport={() => { setReportSent(false); setReportOpen(true); }}
        />
        <Animated.View style={PERF_TIER === 'low' ? undefined : { transform: [{ translateX: slide }] }}>
          <QuizQuestionContent
            question={q}
            showResult={examMode ? false : !!revealed[q.id]}
            selectedAnswer={answers[q.id]}
            onAnswer={onSelectAnswer}
          />
        </Animated.View>
      </ScrollView>

      {/* Bottom nav: prev / progress ring / next */}
      <View style={[styles.bottomNav, { paddingBottom: Math.max(16, insets.bottom) }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('quiz.prev')}
          disabled={currentIndex === 0}
          onPress={() => navigateTo(Math.max(currentIndex - 1, 0), -1)}
          style={[styles.glassCircle, { backgroundColor: glassBg, borderColor: glassRing }, currentIndex === 0 && { opacity: 0.4 }]}
        >
          <ChevronLeft size={16} color={colors.mutedForeground} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('quiz.jumpToQuestion')}
          onPress={() => setNavigatorOpen((o) => !o)}
          style={[styles.glassCircle, { backgroundColor: glassBg, borderColor: glassRing }]}
        >
          <Svg width={ringSize} height={ringSize} viewBox="0 0 36 36" style={StyleSheet.absoluteFill}>
            <Circle cx={18} cy={18} r={ringR} fill="none" stroke={colors.border} strokeWidth={2.5} />
            <Circle
              cx={18} cy={18} r={ringR} fill="none"
              stroke={colors.primary} strokeWidth={2.5} strokeLinecap="round"
              strokeDasharray={ringC}
              strokeDashoffset={ringC * (1 - pct / 100)}
              rotation={-90} origin="18,18"
            />
          </Svg>
          <Text style={{ color: colors.foreground, fontSize: 10, fontFamily: fonts.sansBold, fontVariant: ['tabular-nums'] }}>{answeredCount}</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('quiz.next')}
          disabled={currentIndex >= questions.length - 1}
          onPress={() => navigateTo(Math.min(currentIndex + 1, questions.length - 1), 1)}
          style={[styles.glassCircle, { backgroundColor: glassBg, borderColor: glassRing }, currentIndex >= questions.length - 1 && { opacity: 0.4 }]}
        >
          <ChevronRight size={16} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <FadeEdges top bottom />

      {/* Jump to question: bottom sheet on phone, centered modal on tablet */}
      <Modal visible={navigatorOpen} transparent animationType={PERF_TIER === 'low' ? 'none' : 'slide'} onRequestClose={() => setNavigatorOpen(false)}>
        <Pressable accessibilityRole="button" style={styles.backdrop} onPress={() => setNavigatorOpen(false)}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              isTablet
                ? [styles.jumpModal, { backgroundColor: colors.card, borderColor: colors.border }]
                : [styles.jumpSheet, { backgroundColor: isDark ? 'rgba(20,20,22,0.97)' : 'rgba(255,255,255,0.97)', borderColor: glassRing, paddingBottom: Math.max(40, insets.bottom + 24) }],
            ]}
          >
            {!isTablet && <View style={[styles.grabber, { backgroundColor: colors.mutedForeground + '40' }]} />}
            <View style={styles.jumpHead}>
              <Text style={{ color: colors.mutedForeground, fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 1.4, textTransform: 'uppercase' }}>
                {t('quiz.jumpToQuestion')}
              </Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setNavigatorOpen(false)} style={styles.jumpClose}>
                <X size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: isTablet ? 480 : 420 }} showsVerticalScrollIndicator={false}>
              {jumpGrid}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Exit confirmation */}
      <ConfirmSheet
        visible={exitOpen}
        onClose={() => setExitOpen(false)}
        isTablet={isTablet}
        title={t('quiz.exitTitle')}
        body={t('quiz.exitBody')}
        confirmLabel={t('quiz.yesExit')}
        destructive
        onConfirm={() => router.back()}
      />

      {/* Submit confirmation */}
      <ConfirmSheet
        visible={submitOpen}
        onClose={() => setSubmitOpen(false)}
        isTablet={isTablet}
        title={t('quiz.submitTitle')}
        body={`${t('quiz.answeredOf', { a: answeredCount, n: questions.length })}${answeredCount < questions.length ? ` ${t('quiz.unansweredNote')}` : ''}`}
        confirmLabel={t('quiz.yesSubmit')}
        onConfirm={submit}
      />

      {/* Report question sheet */}
      <Modal visible={reportOpen} transparent animationType={PERF_TIER === 'low' ? 'none' : 'slide'} onRequestClose={() => setReportOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <Pressable accessibilityRole="button" style={styles.backdrop} onPress={() => setReportOpen(false)}>
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={[
                isTablet
                  ? [styles.jumpModal, { backgroundColor: colors.card, borderColor: colors.border }]
                  : [styles.jumpSheet, { backgroundColor: colors.background, borderColor: colors.border, paddingBottom: Math.max(16, insets.bottom + 8) }],
              ]}
            >
              <View style={[styles.reportHead, { borderColor: colors.border }]}>
                <Text style={{ color: colors.foreground, fontSize: 17, fontFamily: fonts.sansBold, flex: 1 }} numberOfLines={1}>
                  {t('quiz.reportTitle')}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  onPress={() => setReportOpen(false)}
                  style={[styles.glassCircle, { backgroundColor: glassBg, borderColor: glassRing }]}
                >
                  <X size={16} color={colors.mutedForeground} />
                </Pressable>
              </View>
              <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
                <Text style={{ color: colors.mutedForeground, fontSize: 14, lineHeight: 20 }}>{t('quiz.reportHint')}</Text>
                <TextInput
                  value={reportNote}
                  onChangeText={setReportNote}
                  placeholder={t('quiz.reportPlaceholder')}
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  numberOfLines={3}
                  style={[styles.reportInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background, fontFamily: fonts.sans }]}
                />
              </View>
              <View style={[styles.reportFoot, { borderColor: colors.border, backgroundColor: colors.muted + '33' }]}>
                <Pressable accessibilityRole="button" onPress={() => setReportOpen(false)} style={styles.footBtn}>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: fonts.sansBold, letterSpacing: 1.2, textTransform: 'uppercase' }}>{t('quiz.cancel')}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => { Linking.openURL(`https://www.medonex.me/quiz/${quiz.source==='lecture'?'lecture/':''}${quiz.id}`); }}
                  style={[styles.footBtn, { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 20 }]}
                >
                  <Text style={{ color: colors.primaryForeground, fontSize: 12, fontFamily: fonts.sansBold, letterSpacing: 1.2, textTransform: 'uppercase' }}>
                    {t('quiz.openWebsiteToReport','Open website to report')}
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

/** Bottom sheet (phone) / centered card (tablet) confirmation, matching the
 *  site's exit & submit modals. */
function ConfirmSheet({
  visible, onClose, isTablet, title, body, confirmLabel, onConfirm, destructive,
}: {
  visible: boolean; onClose: () => void; isTablet: boolean;
  title: string; body: string; confirmLabel: string; onConfirm: () => void; destructive?: boolean;
}) {
  const { colors, fonts } = useTheme();
  const { t } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType={PERF_TIER === 'low' ? 'none' : 'fade'} onRequestClose={onClose}>
      <Pressable accessibilityRole="button" style={[styles.backdrop, isTablet && { justifyContent: 'center' }]} onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[
            isTablet
              ? [styles.confirmCard, { backgroundColor: colors.background, borderColor: colors.border }]
              : [styles.confirmSheet, { backgroundColor: colors.background, borderColor: colors.border }],
          ]}
        >
          {!isTablet && <View style={[styles.grabber, { backgroundColor: colors.mutedForeground + '40' }]} />}
          <View style={{ paddingHorizontal: 20, paddingTop: isTablet ? 16 : 8, paddingBottom: 8 }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 1.4, textTransform: 'uppercase' }}>{title}</Text>
          </View>
          <Text style={{ color: colors.mutedForeground, fontSize: 14, lineHeight: 20, paddingHorizontal: 20, paddingBottom: 16 }}>{body}</Text>
          <View style={[styles.confirmFoot, { borderColor: colors.border, backgroundColor: colors.muted + '33' }]}>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.footBtn}>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: fonts.sansBold, letterSpacing: 1.2, textTransform: 'uppercase' }}>{t('quiz.cancel')}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => { onClose(); onConfirm(); }}
              style={[styles.footBtn, { backgroundColor: destructive ? colors.destructive : colors.primary, borderRadius: 12, paddingHorizontal: 20, flexDirection: 'row', gap: 6 }]}
            >
              {!destructive && <CheckCheck size={16} color={colors.primaryForeground} />}
              <Text style={{ color: destructive ? colors.destructiveForeground : colors.primaryForeground, fontSize: 12, fontFamily: fonts.sansBold, letterSpacing: 1.2, textTransform: 'uppercase' }}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  topRow: {
    height: 56, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, gap: 8,
  },
  glassCircle: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  modeCapsule: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    borderRadius: 999, borderWidth: 1, padding: 2,
  },
  toggleBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  submitPill: {
    height: 36, borderRadius: 18, paddingHorizontal: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    minWidth: 36,
  },
  bottomNav: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    paddingTop: 8,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  jumpSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1,
    maxHeight: '85%', overflow: 'hidden',
  },
  jumpModal: {
    alignSelf: 'center', width: '100%', maxWidth: 512, maxHeight: '80%',
    borderRadius: 16, borderWidth: 1, padding: 24, overflow: 'hidden',
  },
  grabber: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  jumpHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 8,
  },
  jumpClose: { padding: 8, borderRadius: 8 },
  jumpGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20,
  },
  jumpBtn: {
    height: 44, minWidth: 44, borderRadius: 10, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  confirmSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, overflow: 'hidden',
  },
  confirmCard: {
    width: '100%', maxWidth: 384, borderRadius: 16, borderWidth: 1, overflow: 'hidden',
  },
  confirmFoot: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: 12,
    borderTopWidth: 1, paddingHorizontal: 20, paddingVertical: 12,
  },
  footBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  reportHead: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 20, paddingVertical: 12,
  },
  reportInput: {
    marginTop: 12, borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, minHeight: 84,
    textAlignVertical: 'top',
  },
  reportFoot: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: 8,
    borderTopWidth: 1, paddingHorizontal: 20, paddingVertical: 12,
  },
});
