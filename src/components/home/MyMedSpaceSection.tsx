import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Layers } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { mTokens } from '@/theme/tokens';

/** Site: dashboard/mobile/MyMedSpaceSection.tsx — visual shell only,
 *  deliberately not interactive (data arrives in a later site task). */
export function MyMedSpaceSection() {
  const { st, fonts } = useTheme();
  const { t } = useTranslation();
  return (
    <View accessibilityLabel={t('home.myMedSpace')}>
      <Text style={[styles.section, { color: st.text, fontFamily: fonts.sansBold }]}>{t('home.myMedSpace')}</Text>
      <View style={[styles.card, { backgroundColor: st.surface, borderColor: st.border }]}>
        <View style={[styles.iconBox, { borderColor: st.border }]}>
          <Layers size={20} color={st.text} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.title, { color: st.text, fontFamily: fonts.sansBold }]}>{t('home.medSpaceTitle')}</Text>
          <Text style={[styles.desc, { color: st.muted }]}>{t('home.medSpaceDesc')}</Text>
        </View>
      </View>
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
  card: {
    borderRadius: mTokens.cardRadius,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: mTokens.cardTitleSize, fontWeight: '600' },
  desc: { marginTop: 2, fontSize: mTokens.cardDescSize, lineHeight: 16 },
});
