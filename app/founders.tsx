import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShieldCheck, ArrowLeft, Star, Award, Heart } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { TABLET_BREAKPOINT } from '@/theme/tokens';
import { FIXTURE_PLATFORM_TEAM } from '@/lib/fixtures';
import { FadeEdges } from '@/components/FadeEdges';

/** /founders — pixel match of the site's PublicFoundersPage: hero with
 *  ShieldCheck badge + "Founders of MedOneX.", rounded-40 member cards with
 *  role pills and badge rows, "Our Commitment" gradient card. */
export default function FoundersScreen() {
  const { t } = useTranslation();
  const { colors, fonts, st } = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: st.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}>
        {/* Hero */}
        <View style={{ height: isTablet ? 340 : 260, justifyContent: 'center' }}>
          <LinearGradient colors={[colors.primary + '33', st.bg]} style={StyleSheet.absoluteFill} />
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()}
            style={[styles.backBtn, { top: insets.top + 14, backgroundColor: st.surface + '99', borderColor: st.border }]}>
            <ArrowLeft size={18} color={st.muted} />
          </Pressable>
          <View style={{ alignItems: 'center', paddingHorizontal: 24, paddingTop: insets.top + (isTablet ? 0 : 44) }}>
            <View style={[styles.badge, { backgroundColor: colors.primary + '1A', borderColor: colors.primary + '33' }]}>
              <ShieldCheck size={13} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 9.5, fontFamily: fonts.sansBold, letterSpacing: 2, textTransform: 'uppercase' }}>{t('founders.badge')}</Text>
            </View>
            <Text style={{ color: st.text, fontSize: isTablet ? 60 : 38, fontFamily: fonts.sansBold, letterSpacing: -1.5, textAlign: 'center', marginTop: 18 }}>
              {t('founders.titlePre')} <Text style={{ color: colors.primary }}>MedOneX.</Text>
            </Text>
            <Text style={{ color: st.muted, fontSize: 12, fontFamily: fonts.sansBold, letterSpacing: 1.6, textTransform: 'uppercase', textAlign: 'center', maxWidth: 560, marginTop: 12, lineHeight: 19 }}>
              {t('founders.subtitle')}
            </Text>
          </View>
        </View>

        {/* Member cards */}
        <View style={{ width: '100%', maxWidth: 1080, alignSelf: 'center', paddingHorizontal: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 24, justifyContent: 'center', marginTop: 8 }}>
          {FIXTURE_PLATFORM_TEAM.map((m) => (
            <View key={m.id} style={[styles.memberCard, { backgroundColor: st.surface, borderColor: st.border, width: isTablet ? 320 : '100%' }]}>
              <View style={[styles.memberAvatar, { backgroundColor: st.bg, borderColor: st.border }]}>
                <Text style={{ color: colors.primary, fontSize: 36, fontFamily: fonts.display }}>{m.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</Text>
              </View>
              <Text style={{ color: st.text, fontSize: 22, fontFamily: fonts.sansBold }}>{m.name}</Text>
              <View style={[styles.rolePill, { backgroundColor: st.bg, borderColor: st.border }]}>
                <Star size={11} color={colors.primary} />
                <Text style={{ color: st.muted, fontSize: 9.5, fontFamily: fonts.sansBold, letterSpacing: 1.4, textTransform: 'uppercase' }}>{m.role}</Text>
              </View>
              <Text style={{ color: st.muted, fontSize: 13, lineHeight: 20, fontStyle: 'italic', fontFamily: fonts.sans, textAlign: 'center', marginTop: 16 }}>
                "{m.description}"
              </Text>
              <View style={[styles.badgeRow, { borderTopColor: st.border }]}>
                <View style={{ alignItems: 'center', gap: 4 }}>
                  <Award size={18} color={colors.primary + '66'} />
                  <Text style={badgeLabelStyle}>Expert</Text>
                </View>
                <View style={{ width: 1, height: 30, backgroundColor: st.border }} />
                <View style={{ alignItems: 'center', gap: 4 }}>
                  <Heart size={18} color={colors.primary + '66'} />
                  <Text style={badgeLabelStyle}>Leader</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Commitment */}
        <View style={{ width: '100%', maxWidth: 1080, alignSelf: 'center', paddingHorizontal: 20 }}>
          <LinearGradient colors={[colors.primary + '1A', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.commit, { borderColor: st.border }]}>
            <Text style={{ color: st.text, fontSize: 26, fontFamily: fonts.sansBold, textAlign: 'center' }}>{t('founders.commitTitle')}</Text>
            <Text style={{ color: st.muted, fontSize: 14, lineHeight: 23, fontFamily: fonts.sans, textAlign: 'center', maxWidth: 720, marginTop: 12 }}>
              {t('founders.commitBody')}
            </Text>
          </LinearGradient>
        </View>
      </ScrollView>
      {!isTablet && <FadeEdges bottom />}
    </View>
  );
}

const badgeLabelStyle = { color: '#888888', fontSize: 8.5, letterSpacing: 1.6, textTransform: 'uppercase' as const, opacity: 0.6 };

const styles = StyleSheet.create({
  backBtn: {
    position: 'absolute', left: 20, zIndex: 10,
    width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 5,
  },
  memberCard: { borderRadius: 36, borderWidth: 1, padding: 28, alignItems: 'center', overflow: 'hidden' },
  memberAvatar: { width: 112, height: 112, borderRadius: 28, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  rolePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 13, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 5, marginTop: 10,
  },
  badgeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28,
    borderTopWidth: 1, marginTop: 24, paddingTop: 20, alignSelf: 'stretch',
  },

  commit: { borderRadius: 40, borderWidth: 1, padding: 36, marginTop: 72, overflow: 'hidden' },
});
