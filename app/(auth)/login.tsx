import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect, useRouter, useLocalSearchParams } from 'expo-router';
import {lectureSignInReturn} from '@/lib/lecture-sign-in';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { useAuth } from '@/lib/auth';
import { useGoogleSignIn, ExchangeError } from '@/lib/googleAuth';
import { api, ApiError } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { migrateOfflineScope } from '@/lib/offline-downloads';

/** Sign-in — styled after the site's /login. Google-only per the platform
 *  decision: id_token from Google gets exchanged for a mobile JWT at
 *  /api/mobile/auth/google (endpoint pending Ahmed's OK). */
export default function LoginScreen() {
  const { t, i18n } = useTranslation();
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params=useLocalSearchParams<{upgrade?:string;next?:string}>();
  const returnPath=lectureSignInReturn(params.next)??'/(tabs)';
  const { token, bootstrapped, isGuest, signIn, signInAsGuest } = useAuth();
  const queryClient = useQueryClient();
  // Adopt any files downloaded while in guest mode so they stay visible (and
  // don't sit orphaned on disk) under the signed-in account.
  const adoptGuestFiles = (userId: string) => {
    void migrateOfflineScope('guest', userId)
      .then((moved) => {
        if (moved > 0) void queryClient.invalidateQueries({ queryKey: ['offline-downloads'] });
      })
      .catch(() => {});
  };
  const google = useGoogleSignIn();
  const [error, setError] = useState<string | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);

  const upgradingGuest=isGuest&&params.upgrade==='1';
  if (bootstrapped && (token || (isGuest&&!upgradingGuest))) {
    return <Redirect href={(token?returnPath:'/(tabs)') as never} />;
  }

  const onGoogle = async () => {
    setError(null);
    try {
      const { token: tkn, user } = await google.signIn();
      await signIn(tkn, user);
      adoptGuestFiles(user.id);
      router.replace(returnPath as never);
    } catch (e) {
      if (e instanceof ExchangeError && e.code === 'config-missing') {
        setError(t('auth.configMissing'));
      } else if (e instanceof ExchangeError && e.code === 'endpoint-missing') {
        setError(t('auth.endpointMissing'));
      } else if(e instanceof ExchangeError && (e.code==='profile-required'||e.code==='account-link-required')) {
        setError(i18n.language==='ar'?'كمّل بيانات حسابك أو ربطه على medonex.me الأول، وبعدها جرّب تسجيل الدخول هنا.':'Complete your profile or account linking on medonex.me first, then sign in here.');
      } else if(e instanceof ExchangeError && e.code==='play-services') {
        setError(i18n.language==='ar'?'خدمات Google Play محتاجة تحديث أو مش متاحة على الجهاز.':'Google Play Services needs an update or is unavailable on this device.');
      } else if (!(e instanceof ExchangeError && e.message === 'cancelled')) {
        setError(t('auth.failed'));
      }
    }
  };

  const onPasswordSignIn = async () => {
    setError(null);
    const id = identifier.trim();
    if (!id || !password) {
      setError(t('auth.missingFields'));
      return;
    }
    setPasswordBusy(true);
    try {
      const body = id.includes('@') ? { email: id, password } : { studentId: id, password };
      const { token: tkn, user } = await api.post<{ token: string; user: Parameters<typeof signIn>[1] }>('/login', body);
      await signIn(tkn, user);
      adoptGuestFiles(user.id);
      router.replace(returnPath as never);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 400 || e.status === 401 || e.status === 404)) {
        setError(t('auth.invalidCredentials'));
      } else {
        setError(t('auth.failed'));
      }
    } finally {
      setPasswordBusy(false);
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

        <TextInput
          value={identifier}
          onChangeText={setIdentifier}
          placeholder={t('auth.email')}
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="username"
          style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border, fontFamily: fonts.sans }]}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder={t('auth.password')}
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          onSubmitEditing={onPasswordSignIn}
          style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border, fontFamily: fonts.sans, marginTop: 10 }]}
        />
        <Pressable
          accessibilityRole="button"
          disabled={passwordBusy || google.busy}
          onPress={onPasswordSignIn}
          style={({ pressed }) => [
            styles.googleBtn,
            { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 },
            pressed && { opacity: 0.85 },
            passwordBusy && { opacity: 0.6 },
          ]}
        >
          {passwordBusy ? (
            <ActivityIndicator color={colors.mutedForeground} size="small" />
          ) : (
            <Text style={[styles.googleLabel, { color: colors.foreground, fontFamily: fonts.sansMedium }]}>
              {t('auth.signIn')}
            </Text>
          )}
        </Pressable>

        <Text style={[styles.orText, { color: colors.mutedForeground, fontFamily: fonts.sans }]}>{t('auth.or')}</Text>

        <Pressable
          accessibilityRole="button"
          disabled={google.busy || !google.ready || passwordBusy}
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

        {/* Guest trial: fixtures only — no account, no API calls, no writes. */}
        <Pressable
          accessibilityRole="button"
          disabled={google.busy || passwordBusy}
          onPress={async () => {
            if(upgradingGuest){router.canGoBack()?router.back():router.replace(returnPath as never);return;}
            await signInAsGuest();
            router.replace('/(tabs)');
          }}
          style={({ pressed }) => [styles.guestBtn, pressed && { opacity: 0.7 }]}
        >
          <Text style={[styles.guestLabel, { color: colors.mutedForeground, fontFamily: fonts.sansMedium }]}>
            {t('auth.continueAsGuest')}
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
  error: { marginTop: 16, fontSize: 13, textAlign: 'center', maxWidth: 320 },
  input: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  orText: { marginVertical: 14, fontSize: 13 },
  guestBtn: { marginTop: 20, paddingVertical: 8, paddingHorizontal: 16 },
  guestLabel: { fontSize: 14, fontWeight: '500', textDecorationLine: 'underline' },
  footer: { textAlign: 'center', fontSize: 12 },
});
