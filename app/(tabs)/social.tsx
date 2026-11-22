import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';

/** social screen — Phase 1 placeholder; the pixel-matched build follows
 *  the corresponding page of the site's phone UI. */
export default function socialScreen() {
  const { t } = useTranslation();
  const { colors, fonts } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.mutedForeground, fontFamily: fonts.sans, fontSize: 16 }}>{t('common.comingSoon')}</Text>
    </View>
  );
}
