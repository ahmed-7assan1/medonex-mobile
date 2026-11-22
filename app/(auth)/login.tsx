import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { useAuth } from '@/lib/auth';
import { useGoogleSignIn, ExchangeError } from '@/lib/googleAuth';

/** Sign-in — styled after the site's /login. Google-only per the platform
 *  decision: id_token from Google gets exchanged for a mobile JWT at
 *  /api/mobile/auth/google (endpoint pending Ahmed's OK). */
export default function LoginScreen() {
  const { t } = useTranslation();
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token, bootstrapped, signIn } = useAuth();
  const google = useGoogleSignIn();
  const [error, setError] = useState<string | null>(null);

  if (bootstrapped && token) {
    return <Redirect href="/(tabs)" />;
  }

  const onGoogle = async () => {
    setError(null);
    try {
      const { token: tkn, user } = await google.signIn();
      await signIn(tkn, user);
      router.replace('/(tabs)');
    } catch (e) {
      if (e instanceof ExchangeError && e.code === 'config-missing') {
        setError(t('auth.configMissing'));
      } else if (e instanceof ExchangeError && e.code === 'endpoint-missing') {
        setError(t('auth.endpointMissing'));
      } else if (!(e instanceof ExchangeError && e.message === 'cancelled')) {
        setError(t('auth.failed'));
      }
    }
  };

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
          disabled={google.busy}
          onPress={onGoogle}
          style={({ pressed }) => [
            styles.googleBtn,
            { backgroundColor: colors.card, borderColor: colors.border },
            pressed && { opacity: 0.85 },
            google.busy && { opacity: 0.6 },
          ]}
        >
          {google.busy ? (
            <ActivityIndicator color={colors.mutedForeground} size="small" />
          ) : (
            <View style={styles.gMark}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#4285F4' }}>G</Text>
            </View>
          )}
          <Text style={[styles.googleLabel, { color: colors.foreground, fontFamily: fonts.sansMedium }]}>
            {t('auth.signInGoogle')}
          </Text>
        </Pressable>

        {error && (
          <Text style={[styles.error, { color: colors.destructive, fontFamily: fonts.sans }]}>{error}</Text>
        )}
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
  error: { marginTop: 16, fontSize: 13, textAlign: 'center', maxWidth: 320 },
  footer: { textAlign: 'center', fontSize: 12 },
});
