import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';

/** Placeholder for /ai-chat — built in a later phase. */
export default function Screen() {
  const { t } = useTranslation();
  const { st, fonts } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: st.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: st.muted, fontFamily: fonts.sans, fontSize: 15 }}>{t('common.comingSoon')}</Text>
    </View>
  );
}
