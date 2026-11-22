import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Undo2, Trash2, Download, PenLine, Eraser } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { TABLET_BREAKPOINT } from '@/theme/tokens';

const PALETTE = ['#111827', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];
const BRUSHES = [2, 4, 8];

/** /drawmed — DrawMed drawing tool shell (site: DrawMedClient): canvas board,
 *  tool row (pen/eraser), color palette, brush sizes, undo/clear/save.
 *  Interactive stroke engine lands in the wiring phase; fixtures only. */
export default function DrawMedScreen() {
  const { t } = useTranslation();
  const { fonts, st } = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [color, setColor] = useState(PALETTE[0]);
  const [brush, setBrush] = useState(BRUSHES[1]);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');

  return (
    <View style={{ flex: 1, backgroundColor: st.bg }}>
      {/* Toolbar header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: st.border }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()}
          style={[styles.iconBtn, { backgroundColor: st.surface, borderColor: st.border }]}>
          <ArrowLeft size={17} color={st.muted} />
        </Pressable>
        <Text style={{ color: st.text, fontSize: 17, fontFamily: fonts.sansBold, flex: 1 }}>DrawMed</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Undo" style={[styles.iconBtn, { backgroundColor: st.surface, borderColor: st.border }]}>
          <Undo2 size={16} color={st.muted} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Clear" style={[styles.iconBtn, { backgroundColor: st.surface, borderColor: st.border }]}>
          <Trash2 size={16} color={st.muted} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Save" style={[styles.saveBtn, { backgroundColor: st.text }]}>
          <Download size={14} color={st.bg} />
          <Text style={{ color: st.bg, fontSize: 12, fontFamily: fonts.sansBold }}>{t('drawmed.save')}</Text>
        </Pressable>
      </View>

      {/* Canvas */}
      <View style={{ flex: 1, margin: 14, borderRadius: 24, borderWidth: 1, borderColor: st.border, backgroundColor: st.surface, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        <View style={[StyleSheet.absoluteFill, { opacity: 0.5 }]}>
          {Array.from({ length: 24 }).map((_, r) => (
            <View key={r} style={{ flexDirection: 'row', flex: 1 }}>
              {Array.from({ length: 14 }).map((_, c) => (
                <View key={c} style={{ flex: 1, borderWidth: 0.5, borderColor: st.border + '55' }} />
              ))}
            </View>
          ))}
        </View>
        <PenLine size={30} color={st.muted} style={{ opacity: 0.5 }} />
        <Text style={{ color: st.muted, fontSize: 13, fontFamily: fonts.sans, marginTop: 10 }}>{t('drawmed.hint')}</Text>
      </View>

      {/* Bottom tool bar */}
      <View style={{ paddingHorizontal: 14, paddingBottom: insets.bottom + 14, gap: 12 }}>
        <View style={[styles.toolRow, { backgroundColor: st.surface, borderColor: st.border }]}>
          <Pressable accessibilityRole="button" accessibilityState={{ selected: tool === 'pen' }} onPress={() => setTool('pen')}
            style={[styles.toolBtn, tool === 'pen' && { backgroundColor: st.text }]}>
            <PenLine size={16} color={tool === 'pen' ? st.bg : st.muted} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityState={{ selected: tool === 'eraser' }} onPress={() => setTool('eraser')}
            style={[styles.toolBtn, tool === 'eraser' && { backgroundColor: st.text }]}>
            <Eraser size={16} color={tool === 'eraser' ? st.bg : st.muted} />
          </Pressable>
          <View style={{ width: 1, alignSelf: 'stretch', marginVertical: 8, backgroundColor: st.border }} />
          {PALETTE.map((c) => (
            <Pressable key={c} accessibilityRole="button" accessibilityState={{ selected: color === c }} onPress={() => setColor(c)}
              style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotActive]}>
              {color === c && <View style={styles.colorRing} />}
            </Pressable>
          ))}
        </View>
        <View style={[styles.toolRow, { backgroundColor: st.surface, borderColor: st.border, justifyContent: 'center', gap: 18 }]}>
          {BRUSHES.map((b) => (
            <Pressable key={b} accessibilityRole="button" accessibilityState={{ selected: brush === b }} onPress={() => setBrush(b)}
              style={{ alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 20, backgroundColor: brush === b ? st.text + '14' : 'transparent' }}>
              <View style={{ width: b + 4, height: b + 4, borderRadius: (b + 4) / 2, backgroundColor: brush === b ? st.text : st.muted }} />
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 12, borderBottomWidth: 1 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 18, height: 36, paddingHorizontal: 14 },
  toolRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 22, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8,
  },
  toolBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  colorDot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  colorDotActive: { transform: [{ scale: 1.15 }] },
  colorRing: { position: 'absolute', width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: '#888' },
});
