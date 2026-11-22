import React from 'react';
import { View, StyleSheet } from 'react-native';
import { FileText, CheckCircle2, Clock, TrendingUp } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { ProgressRing } from './ProgressRing';

/** Site: quiz/QuizStatsRow.tsx — 4 rings in a rounded card. */
export function QuizStatsRow({ totalQuizzes, completed, avgScore }: { totalQuizzes: number; completed: number; avgScore: number }) {
  const { colors } = useTheme();
  const completionPct = totalQuizzes > 0 ? Math.min(100, Math.round((completed / totalQuizzes) * 100)) : 0;
  const pending = Math.max(0, totalQuizzes - completed);

  const rings = [
    { pct: 100, icon: FileText, value: `${totalQuizzes}`, sublabel: 'Quizzes', color: '#1A6BCC', bgColor: 'rgba(26,107,204,0.15)' },
    { pct: completionPct, icon: CheckCircle2, value: `${completed}`, sublabel: 'Completed', color: '#0D9488', bgColor: 'rgba(13,148,136,0.15)' },
    { pct: 100 - completionPct, icon: Clock, value: `${pending}`, sublabel: 'Pending', color: '#EA580C', bgColor: 'rgba(234,88,12,0.15)' },
    { pct: avgScore, icon: TrendingUp, value: avgScore > 0 ? `${avgScore}%` : '—', sublabel: 'Avg Score', color: '#06B6D4', bgColor: 'rgba(6,182,212,0.15)' },
  ];

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {rings.map((r) => (
        <ProgressRing key={r.sublabel} {...r} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
