import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';
import { Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import { ThemeProvider } from '@/theme/ThemeContext';
import { AuthProvider } from '@/lib/auth';
import '@/i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, gcTime: 1000 * 60 * 60 * 24 },
  },
});

void SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlusJakartaSans_700Bold,
    Cairo_400Regular,
    Cairo_700Bold,
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync().catch(() => {});
      setReady(true);
    }
  }, [fontsLoaded, fontError]);

  // Preview tooling only (web): scrolled-to-bottom screenshots for design
  // review. Set via localStorage.previewScrollBottom by dist/preview.html.
  useEffect(() => {
    try {
      if (typeof window === 'undefined' || !window.localStorage?.getItem('previewScrollBottom')) return;
      const scrollAll = () => {
        try { window.scrollTo(0, document.body?.scrollHeight ?? 0); } catch { /* noop */ }
        document.querySelectorAll('div').forEach((el) => {
          if (el.scrollHeight > el.clientHeight + 20) {
            el.scrollTop = el.scrollHeight;
          }
        });
      };
      const timers = [800, 2000, 4000, 7000, 10000, 13000].map((ms) => setTimeout(scrollAll, ms));
      return () => timers.forEach(clearTimeout);
    } catch { /* noop */ }
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0B0B0B', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#e8c777" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)/login" />
              <Stack.Screen name="(tabs)" />
            </Stack>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
