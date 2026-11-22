import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';

interface Props {
  totalModules: number;
  totalLectures: number;
  totalQuestions: number;
  completionPercent: number;
}

/** Site: modules/StatsCard.tsx mobile variant — "Semester overview" card,
 *  4 columns split by hairlines, label 10px + value 17px tabular. */
export function StatsOverview({ totalModules, totalLectures, totalQuestions, completionPercent }: Props) {
  const { colors, fonts } = useTheme();
  const { t } = useTranslation();

  const cells = [
    { label: t('modules.modules'), value: String(totalModules) },
    { label: t('modules.lectures'), value: String(totalLectures) },
    { label: t('modules.questions'), value: String(totalQuestions) },
    { label: t('modules.mastery'), value: `${completionPercent}%` },
  ];

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} accessibilityLabel={t('modules.semesterOverview')}>
      <View style={styles.head}>
        <Text style={[styles.heading, { color: colors.foreground, fontFamily: fonts.sansSemiBold }]}>{t('modules.semesterOverview')}</Text>
        <TrendingUp size={16} color={colors.mutedForeground} />
      </View>
      <View style={styles.row}>
        {cells.map((c, i) => (
          <View
            key={c.label}
            style={[
              styles.cell,
              i < cells.length - 1 && { borderRightWidth: 1, borderColor: colors.border },
              i === 0 ? { paddingRight: 8 } : i === cells.length - 1 ? { paddingLeft: 8 } : { paddingHorizontal: 8 },
            ]}
          >
            <Text numberOfLines={1} style={[styles.label, { color: colors.mutedForeground }]}>{c.label}</Text>
            <Text style={[styles.value, { color: colors.foreground, fontFamily: fonts.sansSemiBold }]}>{c.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  heading: { fontSize: 13, fontWeight: '600', letterSpacing: -0.2 },
  row: { flexDirection: 'row' },
  cell: { flex: 1, minWidth: 0 },
  label: { fontSize: 10, lineHeight: 13 },
  value: { marginTop: 4, fontSize: 17, fontWeight: '600', fontVariant: ['tabular-nums'] },
});
