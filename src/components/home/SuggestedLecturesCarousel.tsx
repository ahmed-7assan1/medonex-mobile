import React from 'react';
import { View, Text, Pressable, Image, ScrollView, StyleSheet } from 'react-native';
import { BookOpen } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { mTokens } from '@/theme/tokens';
import { toTitleCase } from '@/lib/home';

export interface SuggestedLecture {
  lectureId: string;
  moduleId: string;
  title: string;
  moduleName?: string | null;
  subjectName?: string | null;
  description?: string | null;
  imageUrl?: string | null;
}

/** Site: dashboard/mobile/SuggestedLecturesCarousel.tsx — heading + edge-
 *  bleeding snap carousel, cards 72% (max 280): title, meta, desc, 16:9 image. */
export function SuggestedLecturesCarousel({ lectures }: { lectures: SuggestedLecture[] }) {
  const { st, fonts } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  if (lectures.length === 0) return null;

  return (
    <View accessibilityLabel={t('home.suggestedLectures')}>
      <Text style={[styles.section, { color: st.text, fontFamily: fonts.sansBold }]}>{t('home.suggestedLectures')}</Text>
      <ScrollView
        horizontal
        snapToAlignment="start"
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        style={styles.bleed}
        contentContainerStyle={{ gap: 12, paddingHorizontal: 16, paddingBottom: 4 }}
      >
        {lectures.map((l) => (
          <Pressable
            key={l.lectureId}
            onPress={() => router.push(`/modules/${l.moduleId}/lectures/${l.lectureId}` as never)}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: st.surface, borderColor: st.border },
              pressed && { backgroundColor: st.surfacePressed, transform: [{ scale: 0.985 }] },
            ]}
          >
            <Text numberOfLines={2} style={[styles.cardTitle, { color: st.text, fontFamily: fonts.sansBold }]}>
              {toTitleCase(l.title)}
            </Text>
            <Text numberOfLines={1} style={[styles.meta, { color: st.muted }]}>
              {[l.moduleName, l.subjectName].filter(Boolean).join(' · ')}
            </Text>
            <Text numberOfLines={2} style={[styles.desc, { color: st.muted }]}>{l.description ?? ''}</Text>
            <View style={[styles.imageFrame, { borderColor: st.border }]}>
              {l.imageUrl ? (
                <Image source={{ uri: l.imageUrl }} style={styles.image} resizeMode="cover" />
              ) : (
                <View style={[styles.imageFallback, { backgroundColor: st.surfacePressed }]}>
                  <BookOpen size={24} color={st.muted} />
                </View>
              )}
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    fontSize: mTokens.sectionSize,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: mTokens.headingGap,
  },
  bleed: { marginHorizontal: -16 },
  card: {
    width: 260,
    maxWidth: 280,
    borderRadius: mTokens.cardRadius,
    borderWidth: 1,
    padding: 12,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardTitle: { fontSize: mTokens.cardTitleSize, fontWeight: '600', lineHeight: 20 },
  meta: { marginTop: 4, fontSize: mTokens.metaSize },
  desc: { marginTop: 8, marginBottom: 12, fontSize: mTokens.cardDescSize, lineHeight: 16 },
  imageFrame: { marginTop: 'auto', aspectRatio: 16 / 9, width: '100%', overflow: 'hidden', borderRadius: 8, borderWidth: 1 },
  image: { width: '100%', height: '100%' },
  imageFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
