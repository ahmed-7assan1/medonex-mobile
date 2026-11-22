import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Home, BookOpen, Users, HelpCircle, Grid } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useAuth } from '@/lib/auth';
import { TABLET_BREAKPOINT } from '@/theme/tokens';
import { CapsuleTabBar } from '@/components/CapsuleTabBar';
import { SideRail } from '@/components/SideRail';

/** Phone: floating capsule tab bar replicating the site's MobileBottomNav
 *  (Home / Modules / Social / QBank / More). Tablet (>=768dp): desktop-like
 *  left rail replicating the site's desktop Sidebar. */
export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { token, bootstrapped } = useAuth();
  const isTablet = width >= TABLET_BREAKPOINT;

  if (bootstrapped && !token) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      tabBar={(props) => (isTablet ? <SideRail {...props} /> : <CapsuleTabBar {...props} />)}
      screenOptions={{
        headerShown: false,
        sceneStyle: isTablet ? { marginLeft: 256, backgroundColor: colors.background } : { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => <Home size={size ?? 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="modules"
        options={{
          title: t('tabs.modules'),
          tabBarIcon: ({ color, size }) => <BookOpen size={size ?? 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: t('tabs.social'),
          tabBarIcon: ({ color, size }) => <Users size={size ?? 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="qbank"
        options={{
          title: t('tabs.qbank'),
          tabBarIcon: ({ color, size }) => <HelpCircle size={size ?? 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t('tabs.more'),
          tabBarIcon: ({ color, size }) => <Grid size={size ?? 22} color={color} />,
        }}
      />
    </Tabs>
  );
}
