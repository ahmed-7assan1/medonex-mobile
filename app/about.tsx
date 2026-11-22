import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sparkles, ArrowLeft, Heart, Code } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { TABLET_BREAKPOINT, SCROLL_BOTTOM_PAD } from '@/theme/tokens';
import { FIXTURE_PLATFORM_TEAM } from '@/lib/fixtures';
import { FadeEdges } from '@/components/FadeEdges';

const ICONS: Record<string, any> = { code: Code, sparkles: Sparkles };

/** /about — pixel match of the site's AboutPage: "The Visionaries" badge,
 *  gradient "Meet the MedOneX Team" title, team cards with icon chips,
 *  heart footer. */
export default function AboutScreen() {
  const { t } = useTranslation();
  const { colors, fonts, st } = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: st.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + SCROLL_BOTTOM_PAD }}>
        <View style={{ width: '100%', maxWidth: 1024, alignSelf: 'center', paddingHorizontal: 16 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()}
            style={[styles.backBtn, { top: insets.top + 12, backgroundColor: st.surface, borderColor: st.border }]}>
            <ArrowLeft size={18} color={st.muted} />
          </Pressable>

          <View style={{ alignItems: 'center', paddingTop: insets.top + 72, paddingBottom: 40 }}>
            <View style={[styles.badge, { backgroundColor: colors.primary + '1A', borderColor: colors.primary + '33' }]}>
              <Sparkles size={14} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 11, fontFamily: fonts.sansBold, letterSpacing: 1.6, textTransform: 'uppercase' }}>{t('about.badge')}</Text>
            </View>
            <Text style={{ color: st.text, fontSize: isTablet ? 56 : 32, fontFamily: fonts.display, textAlign: 'center', marginTop: 20 }}>
              {t('about.titlePre')}{' '}
              <Text style={{ color: '#4F46E5' }}>MedOneX</Text>{' '}
              {t('about.titlePost')}
            </Text>
            <Text style={{ color: st.muted, fontSize: isTablet ? 18 : 15, fontFamily: fonts.sans, textAlign: 'center', maxWidth: 640, marginTop: 16, lineHeight: 24 }}>
              {t('about.subtitle')}
            </Text>
          </View>

          <View style={{ flexDirection: isTablet ? 'row' : 'column', gap: 20 }}>
            {FIXTURE_PLATFORM_TEAM.map((m) => {
              const Icon = ICONS[m.icon] ?? Sparkles;
              return (
                <View key={m.id} style={[styles.card, { backgroundColor: st.surface, borderColor: st.border, flex: 1 }]}>
                  <View style={{ alignItems: 'center', marginBottom: 20 }}>
                    <View>
                      <View style={[styles.avatar, { backgroundColor: st.bg, borderColor: st.border }]}>
                        <Text style={{ color: colors.primary, fontSize: 34, fontFamily: fonts.display }}>{m.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</Text>
                      </View>
                      <View style={[styles.iconChip, { backgroundColor: m.bg, borderColor: st.surface }]}>
                        <Icon size={18} color={m.color} />
                      </View>
                    </View>
                  </View>
                  <Text style={{ color: st.text, fontSize: 22, fontFamily: fonts.sansBold, textAlign: isTablet ? 'left' : 'center' }}>{m.name}</Text>
                  <Text style={{ color: colors.primary, fontSize: 11.5, fontFamily: fonts.sansBold, letterSpacing: 1.6, textTransform: 'uppercase', marginTop: 6, textAlign: isTablet ? 'left' : 'center' }}>{m.role}</Text>
                  <Text style={{ color: st.muted, fontSize: 13.5, lineHeight: 21, fontFamily: fonts.sans, marginTop: 12, textAlign: isTablet ? 'left' : 'center' }}>{m.description}</Text>
                </View>
              );
            })}
          </View>

          <View style={{ alignItems: 'center', marginTop: 72, gap: 12 }}>
            <Heart size={28} color="#EF4444" />
            <Text style={{ color: st.muted, fontSize: 11.5, fontFamily: fonts.sansBold, letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center' }}>{t('about.footer')}</Text>
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
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7,
  },
  card: { borderRadius: 28, borderWidth: 1, padding: 28, overflow: 'hidden' },
  avatar: { width: 112, height: 112, borderRadius: 28, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  iconChip: {
    position: 'absolute', bottom: -14, right: -14,
    width: 44, height: 44, borderRadius: 14, borderWidth: 3,
    alignItems: 'center', justifyContent: 'center',
  },
});
