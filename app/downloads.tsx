import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, FileText, FileImage, FileVideo, Trash2, Download } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { TABLET_BREAKPOINT, SCROLL_BOTTOM_PAD } from '@/theme/tokens';
import { FIXTURE_DOWNLOADS } from '@/lib/fixtures';
import { FadeEdges } from '@/components/FadeEdges';

const GROUP_ICONS: Record<string, any> = { PDF: FileText, IMAGE: FileImage, LECTURE: FileVideo, OTHER: FileText };

/** /downloads — pixel match of the site's DownloadsClient: iOS-style grouped
 *  file rows (rounded-16 groups) with type icons, size + date, delete. */
export default function DownloadsScreen() {
  const { t } = useTranslation();
  const { fonts, st } = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const groups: { key: string; label: string }[] = [
    { key: 'PDF', label: t('downloads.pdf') },
    { key: 'IMAGE', label: t('downloads.image') },
    { key: 'LECTURE', label: t('downloads.lecture') },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: st.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + SCROLL_BOTTOM_PAD }}>
        <View style={{ width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: isTablet ? 24 : 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: isTablet ? 0 : 16, paddingTop: insets.top + 14, paddingBottom: 18 }}>
            <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()}
              style={[styles.backBtn, { backgroundColor: st.surface, borderColor: st.border }]}>
              <ArrowLeft size={18} color={st.muted} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ color: st.text, fontSize: 24, fontFamily: fonts.sansBold, letterSpacing: -0.5 }}>{t('downloads.title')}</Text>
              <Text style={{ color: st.muted, fontSize: 12.5, fontFamily: fonts.sans, marginTop: 2 }}>{t('downloads.subtitle')}</Text>
            </View>
            <View style={[styles.countChip, { backgroundColor: st.surface, borderColor: st.border }]}>
              <Download size={12} color={st.muted} />
              <Text style={{ color: st.muted, fontSize: 11, fontFamily: fonts.sansBold }}>{FIXTURE_DOWNLOADS.length}</Text>
            </View>
          </View>

          {groups.map((g) => {
            const items = FIXTURE_DOWNLOADS.filter((d) => d.group === g.key);
            if (!items.length) return null;
            return (
              <View key={g.key} style={{ marginBottom: 22, paddingHorizontal: isTablet ? 0 : 12 }}>
                <Text style={{ color: st.muted, fontSize: 11, fontFamily: fonts.sansBold, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 8, marginLeft: 8 }}>{g.label}</Text>
                <View>
                  {items.map((d, i) => {
                    const Icon = GROUP_ICONS[d.group] ?? FileText;
                    const n = items.length;
                    const rad = {
                      borderTopLeftRadius: i === 0 ? 16 : 4, borderTopRightRadius: i === 0 ? 16 : 4,
                      borderBottomLeftRadius: i === n - 1 ? 16 : 4, borderBottomRightRadius: i === n - 1 ? 16 : 4,
                    };
                    return (
                      <Pressable key={d.id} accessibilityRole="button"
                        style={[styles.row, rad, { backgroundColor: st.surface, marginBottom: 2 }, isTablet && { borderRadius: 16, borderWidth: 1, borderColor: st.border, marginBottom: 10 }]}>
                        <View style={[styles.fileIcon, { backgroundColor: st.bg }]}>
                          <Icon size={19} color={st.muted} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text numberOfLines={1} style={{ color: st.text, fontSize: 14.5, fontFamily: fonts.sansBold }}>{d.name}</Text>
                          <Text style={{ color: st.muted, fontSize: 11.5, fontFamily: fonts.sans, marginTop: 2 }}>{d.size} · {d.date}</Text>
                        </View>
                        <Pressable accessibilityRole="button" accessibilityLabel="Delete" hitSlop={8} style={{ padding: 8 }}>
                          <Trash2 size={17} color={st.muted} />
                        </Pressable>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
      {!isTablet && <FadeEdges bottom />}
    </View>
  );
}

const styles = StyleSheet.create({
  backBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  countChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 13, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 12 },
  fileIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
