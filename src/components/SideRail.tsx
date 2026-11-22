import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { LayoutDashboard, BookOpen, Users, HelpCircle, Grid, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '@/theme/ThemeContext';

const ICONS: Record<string, typeof LayoutDashboard> = {
  index: LayoutDashboard,
  modules: BookOpen,
  social: Users,
  qbank: HelpCircle,
  more: Grid,
};

/** Tablet navigation — follows the site's desktop Sidebar: 256px column,
 *  logo header, vertical nav, settings + user at the bottom. */
export function SideRail({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.rail, { backgroundColor: colors.background, borderRightColor: colors.border, paddingBottom: insets.bottom + 12 }]}>
      <View style={[styles.logoRow, { borderBottomColor: colors.border }]}>
        <Text style={{ color: colors.gold0, fontFamily: fonts.display, fontSize: 20 }}>MedOneX</Text>
      </View>
      <View style={styles.nav}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const label = typeof options.title === 'string' ? options.title : route.name;
          const Icon = ICONS[route.name] ?? Grid;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              onPress={onPress}
              style={({ pressed }) => [
                styles.navItem,
                focused && { backgroundColor: colors.secondary },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Icon size={20} color={focused ? colors.foreground : colors.mutedForeground} />
              <Text
                style={{
                  color: focused ? colors.foreground : colors.mutedForeground,
                  fontSize: 13,
                  fontWeight: focused ? '700' : '500',
                  fontFamily: focused ? fonts.sansBold : fonts.sansMedium,
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={[styles.bottom, { borderTopColor: colors.border }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Settings"
          onPress={() => navigation.navigate('more' as never)}
          style={[styles.settingsBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Settings size={16} color={colors.mutedForeground} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 256,
    borderRightWidth: 1,
  },
  logoRow: { height: 64, justifyContent: 'center', paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  nav: { flex: 1, paddingVertical: 16, paddingHorizontal: 12, gap: 4 },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 },
  bottom: { borderTopWidth: StyleSheet.hairlineWidth, padding: 12, flexDirection: 'row' },
  settingsBtn: { width: 36, height: 36, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
