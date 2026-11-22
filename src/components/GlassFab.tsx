import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/theme/ThemeContext';
import { USE_LIVE_BLUR, GLASS_OPACITY } from '@/theme/perf';

/** The site's new button style (feat/mobile-nav-fab-style): 48px glass
 *  circle — bg-white/70 | white/10, ring black/10 | white/25, blur 20 +
 *  saturate, soft shadow in light mode, scale-95 on press. Same look on
 *  low-tier devices via a more opaque static tint (see theme/perf). */
export function GlassFab({
  onPress,
  label,
  children,
  style,
}: {
  onPress?: () => void;
  label: string;
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const { isDark } = useTheme();
  const bg = isDark
    ? `rgba(255,255,255,${GLASS_OPACITY.dark})`
    : `rgba(255,255,255,${GLASS_OPACITY.light})`;
  const ring = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.10)';

  const circle = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        { backgroundColor: USE_LIVE_BLUR ? 'transparent' : bg, borderColor: ring },
        !isDark && styles.shadowLight,
        pressed && { transform: [{ scale: 0.95 }] },
        style,
      ]}
    >
      {children}
    </Pressable>
  );

  if (!USE_LIVE_BLUR) return circle;
  return (
    <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={styles.blur}>
      {circle}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  blur: { borderRadius: 999, overflow: 'hidden' },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadowLight: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
});
