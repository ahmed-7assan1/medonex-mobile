import { CrashGate, installCrashGuard } from '@/lib/crash-guard';
import {LectureSpotifyProvider} from '@/components/lecture/LectureSpotifyProvider';
import { purgeStaleCaches } from '@/lib/cache-janitor';
import { LectureAudioProvider } from '@/components/lecture/LectureAudioProvider';
import { StudentOverlayProvider } from '@/components/StudentOverlay';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack,useSegments,useRouter,useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';
import { Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import { ThemeProvider } from '@/theme/ThemeContext';
import { AuthProvider,useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import{WebAlertHost}from'@/components/WebAlertHost';
import '@/i18n';
import{DesktopStudentChrome}from'@/components/DesktopStudentChrome';
import{usePrefetchPrimaryTabs}from'@/lib/prefetch';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, gcTime: 1000 * 60 * 60 * 24, retry:(failures,error)=>!(error instanceof ApiError&&[401,403,404].includes(error.status))&&failures<1 },
  },
});

void SplashScreen.preventAutoHideAsync().catch(() => {});

// Install global crash capture before any other module-scope work runs.
installCrashGuard();

export default function RootLayout() {
  // The gate must sit above every hook and provider: a release-build throw in
  // useFonts, a provider or the first screen render would otherwise kill the
  // process with only the OS "keeps stopping" dialog and no stack.
  return (
    <CrashGate>
      <RootLayoutInner/>
    </CrashGate>
  );
}

function RootLayoutInner() {
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

  // Cold-start cache cleanup: stale share-sheet copies of offline files and
  // leaked PDF viewer sessions grow without bound otherwise.
  useEffect(() => {
    void purgeStaleCaches().catch(() => {});
  }, []);

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
            <StudentOverlayProvider><LectureAudioProvider><LectureSpotifyProvider><DesktopStudentChrome><ProtectedStack/></DesktopStudentChrome></LectureSpotifyProvider></LectureAudioProvider></StudentOverlayProvider>
            <WebAlertHost/>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

function ProtectedStack(){usePrefetchPrimaryTabs();const{bootstrapped,token,isGuest}=useAuth();const segments=useSegments();const router=useRouter();const navigation=useRootNavigationState();const section=String(segments[0]||'');const publicRoute=['(auth)','terms','about','founders'].includes(section);useEffect(()=>{if(bootstrapped&&navigation?.key&&!token&&!isGuest&&!publicRoute)router.replace('/(auth)/login')},[bootstrapped,token,isGuest,publicRoute,navigation?.key]);return <Stack screenOptions={{headerShown:false}}><Stack.Screen name="index"/><Stack.Screen name="(auth)/login"/><Stack.Screen name="(tabs)"/></Stack>}
