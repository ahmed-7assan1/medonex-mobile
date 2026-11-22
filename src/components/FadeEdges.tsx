import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';

/** The mobile site's edge fades: a bottom gradient (10rem + safe area,
 *  background → transparent upwards) separating scrolling content from the
 *  floating capsule, and a matching top gradient under the status area.
 *  Purely visual, never intercepts touches. z-order: always BELOW the
 *  floating buttons/capsules (bars use zIndex 10) so it never covers or
 *  dims them — Ahmed, 22 Nov. */
export function FadeEdges({ top = true, bottom = true }: { top?: boolean; bottom?: boolean }) {
  const { st } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <>
      {top && (
        <LinearGradient
          pointerEvents="none"
          colors={[st.bg, `${st.bg}00`]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.top, { height: 48 + insets.top }]}
        />
      )}
      {bottom && (
        <LinearGradient
          pointerEvents="none"
          colors={[`${st.bg}00`, st.bg]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.bottom, { height: 160 + insets.bottom }]}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  top: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5 },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 5 },
});
