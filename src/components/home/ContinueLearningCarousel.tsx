import{useStudentDimensions as useWindowDimensions}from'@/lib/student-viewport';
import React, { useRef, useState } from 'react';
import { View, Text, Pressable, Image, ScrollView, StyleSheet, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { BookOpen, ClipboardList, Play, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeContext';
import { mTokens } from '@/theme/tokens';
import { toTitleCase } from '@/lib/home';

export interface LastLecture {
  lectureId: string;
  moduleId: string;
  lectureTitle: string;
  subjectName?: string | null;
  channelName?: string | null;
  coverImageUrl?: string | null;
}

interface Slide {
  key: string;
  eyebrow: string;
  title: string;
  sub?: string;
  cta: string;
  href: string;
  grad: [string, string];
  icon: 'play' | 'book' | 'quiz' | 'ai';
  imageUrl?: string | null;
}

const ICONS = { play: Play, book: BookOpen, quiz: ClipboardList, ai: Sparkles } as const;

/** Site: dashboard/mobile/ContinueLearningCarousel.tsx — full-width snap
 *  cards (continue / qbank / AI), gradient or cover + scrim, white round
 *  44px CTA bottom-end, pagination dots underneath. */
export function ContinueLearningCarousel({ lastLecture }: { lastLecture: LastLecture | null }) {
  const { st, fonts } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const {viewportWidth, width } = useWindowDimensions();
  const [idx, setIdx] = useState(0);
  const cardWidth = useRef(width - 32);
  cardWidth.current = width - 32;

  const slides: Slide[] = [
    lastLecture
      ? {
          key: 'continue',
          eyebrow: t('home.continueLearning'),
          title: toTitleCase(lastLecture.lectureTitle),
          sub: [lastLecture.subjectName, lastLecture.channelName].filter(Boolean).join(' · ') || undefined,
          cta: t('home.resumeLecture'),
          href: `/modules/${lastLecture.moduleId}/lectures/${lastLecture.lectureId}`,
          grad: ['#2563EB', '#4338CA'],
          icon: 'play',
          imageUrl: lastLecture.coverImageUrl ?? null,
        }
      : {
          key: 'continue',
          eyebrow: t('home.yourLearningSpace'),
          title: t('home.whatToLearn'),
          cta: t('home.exploreModules'),
          href: '/modules',
          grad: ['#2563EB', '#4338CA'],
          icon: 'book',
        },
    {
      key: 'qbank',
      eyebrow: t('home.questionBank'),
      title: t('home.testYourself'),
      cta: t('home.startQuiz'),
      href: '/qbank',
      grad: ['#7C3AED', '#A21CAF'],
      icon: 'quiz',
    },
    {
      key: 'ai',
      eyebrow: t('home.aiAssistant'),
      title: t('home.askDrQ'),
      cta: t('home.openAIChat'),
      href: '/ai-chat',
      grad: ['#059669', '#0F766E'],
      icon: 'ai',
    },
  ];

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(Math.abs(x) / (cardWidth.current + 12));
    if (i !== idx) setIdx(Math.max(0, Math.min(slides.length - 1, i)));
  };

  return (
    <View accessibilityLabel={t('home.continueLearning')}>
      <ScrollView
        horizontal
        snapToInterval={cardWidth.current + 12}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ gap: 12, paddingBottom: 4 }}
      >
        {slides.map((sl) => {
          const Icon = ICONS[sl.icon];
          const hasImage = Boolean(sl.imageUrl);
          return (
            <View key={sl.key} style={[styles.card, { width: cardWidth.current }]}>
              <LinearGradient
                colors={sl.grad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: mTokens.cardRadius }]}
              />
              {hasImage ? (
                <>
                  <Image source={{ uri: sl.imageUrl! }} style={[StyleSheet.absoluteFill, { borderRadius: mTokens.cardRadius }]} resizeMode="cover" />
                  <View style={[StyleSheet.absoluteFill, styles.scrim, { borderRadius: mTokens.cardRadius }]} />
                </>
              ) : (
                <Icon size={96} color="rgba(255,255,255,0.15)" style={styles.watermark} />
              )}
              <View style={styles.cardInner}>
                <View style={styles.cardText}>
                  <Text numberOfLines={1} style={[styles.eyebrow, { fontFamily: fonts.sansMedium }]}>{sl.eyebrow.toUpperCase()}</Text>
                  <Text numberOfLines={2} style={[styles.title, { fontFamily: fonts.sansBold }]}>{sl.title}</Text>
                  {sl.sub && <Text numberOfLines={1} style={styles.sub}>{sl.sub}</Text>}
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={sl.cta}
                  onPress={() => router.push(sl.href as never)}
                  style={({ pressed }) => [styles.cta, pressed && { transform: [{ scale: 0.95 }] }]}
                >
                  <Icon size={20} color="#0F172A" />
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>
      <View style={styles.dots}>
        {slides.map((s, i) => (
          <View key={s.key} style={[styles.dot, i === idx ? { width: 16, backgroundColor: st.text } : { width: 6, backgroundColor: st.border }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: mTokens.cardRadius,
    overflow: 'hidden',
  },
  scrim: { backgroundColor: 'rgba(0,0,0,0.5)' },
  watermark: { position: 'absolute', top: -20, right: -16, transform: [{ scaleX: -1 }] },
  cardInner: { minHeight: 112, flexDirection: 'row', gap: 12, padding: 16 },
  cardText: { flex: 1, minWidth: 0, alignSelf: 'center' },
  eyebrow: { fontSize: 11, fontWeight: '500', letterSpacing: 0.6, color: 'rgba(255,255,255,0.75)' },
  title: { marginTop: 4, fontSize: 15, fontWeight: '600', lineHeight: 20, color: '#FFFFFF' },
  sub: { marginTop: 2, fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  cta: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  dots: { marginTop: 8, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { height: 6, borderRadius: 999 },
});
