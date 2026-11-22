import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '@/theme/ThemeContext';

/** Floating capsule tab bar, replicating the site's MobileBottomNav:
 *  max-width 420, full-round, bg/85 + blur + ring, items 52px tall,
 *  icon 22 + label 10px, active = primary/15 background. */
export function CapsuleTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: insets.bottom + 12 }]}>
      <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.blur}>
        <View style={[styles.capsule, { backgroundColor: isDark ? 'rgba(11,11,11,0.85)' : 'rgba(245,245,245,0.85)', borderColor: colors.border }]}>
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
                style={({ pressed }) => [
                  styles.item,
                  focused && { backgroundColor: isDark ? 'rgba(245,245,245,0.15)' : 'rgba(18,18,18,0.15)' },
                  pressed && { transform: [{ scale: 0.95 }] },
                ]}
              >
                {options.tabBarIcon?.({ focused, color: focused ? colors.foreground : colors.mutedForeground, size: 22 })}
                <Text style={[styles.label, { color: focused ? colors.foreground : colors.mutedForeground }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  blur: { borderRadius: 999, overflow: 'hidden' },
  capsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '100%',
    maxWidth: 420,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 6,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  item: {
    height: 52,
    flex: 1,
    minWidth: 0,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: { fontSize: 10, fontWeight: '500', lineHeight: 12 },
});
