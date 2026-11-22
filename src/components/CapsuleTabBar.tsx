import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '@/theme/ThemeContext';
import { FadeEdges } from './FadeEdges';
import { USE_LIVE_BLUR, GLASS_OPACITY } from '@/theme/perf';

/** Floating capsule tab bar, replicating the site's restyled MobileBottomNav
 *  (feat/mobile-nav-fab-style): 48px glass capsule (bg-white/70 | white/10,
 *  ring black/10 | white/25, blur 20), items 40px with a 20px icon
 *  (scale-110 when active) + 10px label, active = foreground semibold,
 *  no background pill. */
export function CapsuleTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const glassBg = isDark
    ? `rgba(255,255,255,${GLASS_OPACITY.dark})`
    : `rgba(255,255,255,${GLASS_OPACITY.light})`;

  const capsuleBody = (
        <View
          style={[
            styles.capsule,
            {
              backgroundColor: USE_LIVE_BLUR
                ? (isDark ? 'rgba(11,11,11,0.85)' : 'rgba(255,255,255,0.80)')
                : glassBg,
              borderColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.10)',
            },
          ]}
        >
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const { options } = descriptors[route.key];
            const label = typeof options.title === 'string' ? options.title : route.name;
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
                style={({ pressed }) => [styles.item, pressed && { transform: [{ scale: 0.95 }] }]}
              >
                <View style={focused ? { transform: [{ scale: 1.1 }] } : undefined}>
                  {options.tabBarIcon?.({ focused, color: focused ? colors.foreground : colors.mutedForeground, size: 20 })}
                </View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.label,
                    { color: focused ? colors.foreground : colors.mutedForeground },
                    focused ? { fontWeight: '600' } : { fontWeight: '500' },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
  );

  return (
    <>
      {/* Edge fades: bottom separates content from the floating capsule,
          top softens the status-area edge — the mobile site's pattern. */}
      <FadeEdges />
      <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: insets.bottom + 12 }]}>
        {USE_LIVE_BLUR ? (
          <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={styles.blur}>
            {capsuleBody}
          </BlurView>
        ) : (
          <View style={[styles.blur, styles.blurFallback]}>{capsuleBody}</View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    elevation: 20,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  blur: {
    borderRadius: 999,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 420,
  },
  blurFallback: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  capsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 48,
    borderRadius: 999,
    borderWidth: 1,
    padding: 4,
  },
  item: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: { fontSize: 10, lineHeight: 12 },
});
