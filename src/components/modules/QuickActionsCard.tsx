import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Play, Bookmark, CheckCircle2, Download } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';

/** Site: modules/QuickActions.tsx mobile variant — one rounded-20 card,
 *  2x2 grid split by hairlines, colored 36px icon circles. */
export function QuickActionsCard({ continueHref, onSaved, onContinueFallback }: { continueHref?: string | null; onSaved?:()=>void; onContinueFallback?:()=>void }) {
  const { colors, isDark, fonts } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const tone = (lightBg: string, lightFg: string, darkBg: string, darkFg: string) =>
    isDark ? { bg: darkBg, fg: darkFg } : { bg: lightBg, fg: lightFg };

  const actions = [
    { key: 'continue', icon: Play, title: t('modules.continue'), sub: t('modules.continueSub'), c: tone('#F3E8FF', '#9333EA', 'rgba(88,28,135,0.3)', '#C084FC'), onPress: () => continueHref ? router.push(continueHref as never) : onContinueFallback?.() },
    { key: 'bookmarks', icon: Bookmark, title: t('modules.bookmarks'), sub: t('modules.bookmarksSub'), c: tone('#DBEAFE', '#2563EB', 'rgba(30,58,138,0.3)', '#60A5FA'), onPress: () => onSaved ? onSaved() : router.push('/modules?view=saved' as never) },
    { key: 'completed', icon: CheckCircle2, title: t('modules.completed'), sub: t('modules.completedSub'), c: tone('#D1FAE5', '#059669', 'rgba(6,78,59,0.3)', '#34D399'), onPress: () => {} },
    { key: 'downloads', icon: Download, title: t('modules.downloads'), sub: t('modules.downloadsSub'), c: tone('#FEF3C7', '#D97706', 'rgba(120,53,15,0.3)', '#FBBF24'), onPress: () => router.push('/modules/downloads' as never) },
  ];

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} accessibilityLabel="Module shortcuts">
      <View style={styles.grid}>
        {actions.map((a, i) => {
          const Icon = a.icon;
          return (
            <Pressable accessibilityRole="button"
              key={a.key}
              onPress={a.onPress}
              style={({ pressed }) => [
                styles.cell,
                i % 2 === 0 && { borderRightWidth: 1, borderColor: colors.border },
                i < 2 && { borderBottomWidth: 1, borderColor: colors.border },
                pressed && { backgroundColor: colors.muted },
              ]}
            >
              <View style={[styles.iconCircle, { backgroundColor: a.c.bg }]}>
                <Icon size={17} color={a.c.fg} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={[styles.title, { color: colors.foreground, fontFamily: fonts.sansSemiBold }]}>{a.title}</Text>
                <Text numberOfLines={1} style={[styles.sub, { color: colors.mutedForeground }]}>{a.sub}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '50%', minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  iconCircle: { width: 36, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 13, fontWeight: '600' },
  sub: { marginTop: 2, fontSize: 11 },
});
