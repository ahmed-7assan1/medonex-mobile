import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, X } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { TABLET_BREAKPOINT, SCROLL_BOTTOM_PAD } from '@/theme/tokens';

/** Shared settings overlay shell (site: SettingsOverlay):
 *  phone = full-screen sheet that slides up like a new page (back arrow +
 *  title header); tablet = centered dialog with a dimmed backdrop + X. */
export function SettingsOverlay({
  open, onClose, title, children,
}: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  const { st, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;
  if (!open) return null;

  if (isTablet) {
    return (
      <View style={styles.backdrop} pointerEvents="auto">
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.dialog, { backgroundColor: st.surface, borderColor: st.border, maxHeight: '82%' }]}>
          <View style={styles.dialogHead}>
            <Text style={{ flex: 1, color: st.text, fontSize: 17, fontFamily: fonts.sansBold }}>{title}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} hitSlop={10}>
              <X size={18} color={st.muted} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingTop: 4 }}>
            {children}
          </ScrollView>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.sheet, { backgroundColor: st.bg, paddingTop: insets.top + 8 }]}>
      <View style={styles.sheetHead}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onClose}
          style={[styles.headBtn, { backgroundColor: st.surface, borderColor: st.border }]}>
          <ArrowLeft size={19} color={st.text} />
        </Pressable>
        <Text style={{ flex: 1, color: st.text, fontSize: 18, fontFamily: fonts.sansBold }}>{title}</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + SCROLL_BOTTOM_PAD }}>
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 100,
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  dialog: { width: '100%', maxWidth: 520, borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  dialogHead: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 10 },
  sheet: { ...StyleSheet.absoluteFillObject, zIndex: 100 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 10 },
  headBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
