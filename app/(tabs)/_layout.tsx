import React from 'react';
import { Tabs } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { TABLET_BREAKPOINT } from '@/theme/tokens';

/** Phone: bottom capsule tab bar matching the site's mobile capsule.
 *  Tablet (>=768dp): desktop-like side rail, matching the site's desktop UI.
 *  Phase 1 wires the exact capsule/rail styling from the site components. */
export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const isTablet = width >= TABLET_BREAKPOINT;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.foreground,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          position: isTablet ? 'left' : 'bottom',
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
      <Tabs.Screen name="modules" options={{ title: t('tabs.modules') }} />
      <Tabs.Screen name="qbank" options={{ title: t('tabs.qbank') }} />
      <Tabs.Screen name="social" options={{ title: t('tabs.social') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
    </Tabs>
  );
}
