import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';

/** Sign-in — styled after the site's /login: display logo, tagline and the
 *  rounded-20 bordered "Continue with Google" button (bg-card/80, shadow-sm).
 *  The Google flow itself (expo-auth-session -> site auth exchange) is wired
 *  in the auth phase; the button reports until then. */
export default function LoginScreen() {
  const { t } = useTranslation();
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: colors.background, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <View style={styles.center}>
        <Text style={[styles.logo, { color: colors.gold0, fontFamily: fonts.display }]}>MedOneX</Text>
        <Text style={[styles.tagline, { color: colors.mutedForeground, fontFamily: fonts.sans }]}>
          {t('auth.tagline')}
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            /* Auth phase: start the Google flow (expo-auth-session). */
          }}
          style={({ pressed }) => [
            styles.googleBtn,
            { backgroundColor: colors.card, borderColor: colors.border },
            pressed && { opacity: 0.85 },
          ]}
        >
          <View style={styles.gMark}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#4285F4' }}>G</Text>
          </View>
          <Text style={[styles.googleLabel, { color: colors.foreground, fontFamily: fonts.sansMedium }]}>
            {t('auth.signInGoogle')}
          </Text>
        </Pressable>
      </View>

      <Text style={[styles.footer, { color: colors.mutedForeground }]}>medonex.me</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: 40, letterSpacing: -0.5, marginBottom: 8 },
  tagline: { fontSize: 15, marginBottom: 40, textAlign: 'center' },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  gMark: { width: 22, alignItems: 'center' },
  googleLabel: { fontSize: 14, fontWeight: '500' },
  footer: { textAlign: 'center', fontSize: 12 },
});
