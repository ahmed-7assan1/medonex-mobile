import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';

/** Sign-in screen. Phase 1: Google native flow via expo-auth-session +
 *  Supabase (deep-link return), styled to match the site's /login. */
export default function LoginScreen() {
  const { t } = useTranslation();
  const { colors, radii, fonts } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text style={{ color: colors.gold0, fontFamily: fonts.display, fontSize: 34, marginBottom: 8 }}>MedOneX</Text>
      <Text style={{ color: colors.mutedForeground, fontFamily: fonts.sans, fontSize: 15, marginBottom: 40 }}>{t('auth.tagline')}</Text>
      <Pressable
        accessibilityRole="button"
        style={{ backgroundColor: colors.primary, borderRadius: radii.base, paddingVertical: 14, paddingHorizontal: 28, minWidth: 240, alignItems: 'center' }}
        onPress={() => { /* Phase 1: expo-auth-session Google flow */ }}
      >
        <Text style={{ color: colors.primaryForeground, fontFamily: fonts.sansBold, fontSize: 16 }}>{t('auth.signInGoogle')}</Text>
      </Pressable>
    </View>
  );
}
