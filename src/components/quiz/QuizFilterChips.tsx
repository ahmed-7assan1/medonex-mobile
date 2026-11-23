import React from 'react';
import { View, ScrollView, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import type { QuizFilter } from '@/lib/quiz';

const FILTERS: { key: QuizFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'not_started', label: 'Not Started' },
];

/** Site: quiz/QuizFilterChips.tsx — pill row, active = primary fill. */
export function QuizFilterChips({ active, counts, onChange }: { active: QuizFilter; counts: Record<QuizFilter, number>; onChange: (f: QuizFilter) => void }) {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -12 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 12, paddingVertical: 4 }}>
      {FILTERS.map((f) => {
        const isActive = active === f.key;
        return (
          <Pressable accessibilityRole="button"
            key={f.key}
            onPress={() => onChange(f.key)}
            style={[
              styles.chip,
              isActive
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.label, { color: isActive ? colors.primaryForeground : colors.mutedForeground }]}>{f.label}</Text>
            <View style={[styles.count, { backgroundColor: isActive ? 'rgba(0,0,0,0.15)' : colors.muted }]}>
              <Text style={[styles.countText, { color: isActive ? colors.primaryForeground : colors.mutedForeground }]}>{counts[f.key]}</Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  label: { fontSize: 11, fontWeight: '700' },
  count: { borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 },
  countText: { fontSize: 9, fontWeight: '800', fontVariant: ['tabular-nums'] },
});
