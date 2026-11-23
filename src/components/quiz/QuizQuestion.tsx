import React from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import {
  Flag, Bookmark, BookmarkCheck, MessageSquareWarning, Share2,
  CheckCircle2, XCircle,
} from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { GLASS_OPACITY } from '@/theme/perf';
import type { FixtureQuizQuestion } from '@/lib/fixtures';

/** Site: quiz/QuestionCard.tsx — header row (number ring, difficulty pill,
 *  flag/bookmark/report/share 30px glass actions) + content (stem, choice
 *  rows with letter circles and selected/correct/wrong/dim states, and the
 *  explanation box after reveal). Used by the quiz player and the results
 *  review list. */

const DIFF = {
  EASY:   { bg: 'rgba(16,185,129,0.14)', fg: '#047857', fgDark: '#6EE7B7', accent: '#059669' },
  MEDIUM: { bg: 'rgba(245,158,11,0.16)', fg: '#B45309', fgDark: '#FCD34D', accent: '#D97706' },
  HARD:   { bg: 'rgba(239,68,68,0.14)',  fg: '#B91C1C', fgDark: '#FCA5A5', accent: '#DC2626' },
} as const;

export function QuizQuestionHeader({
  question,
  index,
  sessionLabel,
  showClock,
  flagged,
  bookmarked,
  onToggleFlag,
  onToggleBookmark,
  onReport,
}: {
  question: FixtureQuizQuestion;
  index: number;
  sessionLabel?: string;
  showClock?: boolean;
  flagged?: boolean;
  bookmarked?: boolean;
  onToggleFlag?: () => void;
  onToggleBookmark?: () => void;
  onReport?: () => void;
}) {
  const { colors, fonts, isDark } = useTheme();
  const d = DIFF[question.difficulty];
  const glassBg = isDark ? `rgba(255,255,255,${GLASS_OPACITY.dark})` : `rgba(255,255,255,${GLASS_OPACITY.light})`;
  const glassRing = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.10)';

  const act = (
    label: string,
    active: boolean | undefined,
    activeBg: string,
    onPress: (() => void) | undefined,
    icon: React.ReactNode,
  ) => (
    <Pressable
      key={label}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active }}
      onPress={onPress||(()=>Alert.alert('Read-only practice','This review does not change your saved questions, flags, reports or community posts. Open the quiz on the website for account actions.'))}
      style={[styles.act, { backgroundColor: active ? activeBg : glassBg, borderColor: glassRing }]}
    >
      {icon}
    </Pressable>
  );

  return (
    <View style={styles.head}>
      <View style={styles.headLeft}>
        <View style={[styles.num, { backgroundColor: colors.card, borderColor: d.accent + '66' }]}>
          <Text style={{ color: isDark ? d.fgDark : d.fg, fontSize: 12, fontFamily: fonts.sansBold }}>{index + 1}</Text>
        </View>
        <View style={[styles.diff, { backgroundColor: d.bg }]}>
          <Text style={{ color: isDark ? d.fgDark : d.fg, fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 0.6, textTransform: 'uppercase' }}>
            {question.difficulty.toLowerCase()}
          </Text>
        </View>
      </View>
      <View style={styles.headRight}>
        {showClock && !!sessionLabel && (
          <Text style={{ color: colors.mutedForeground, fontSize: 12, fontVariant: ['tabular-nums'], marginRight: 6 }}>{sessionLabel}</Text>
        )}
        {act('Flag question', flagged, 'rgba(245,158,11,0.18)', onToggleFlag,
          <Flag size={15} color={flagged ? '#D97706' : colors.mutedForeground} fill={flagged ? '#D97706' : 'transparent'} />)}
        {act('Bookmark question', bookmarked, colors.primary + '26', onToggleBookmark,
          bookmarked
            ? <BookmarkCheck size={15} color={colors.primary} />
            : <Bookmark size={15} color={colors.mutedForeground} />)}
        {act('Report question', false, '', onReport,
          <MessageSquareWarning size={15} color={colors.mutedForeground} />)}
        {act('Share question', false, '', undefined,
          <Share2 size={15} color={colors.mutedForeground} />)}
      </View>
    </View>
  );
}

export {QuizQuestionContent}from'./WebsiteQuestionContent';

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 4,
    paddingBottom: 12,
    flexWrap: 'wrap',
  },
  headLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  num: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  diff: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  headRight: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  act: {
    width: 30, height: 30, borderRadius: 15, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  content: { gap: 20, paddingHorizontal: 4, paddingBottom: 8 },
  choice: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16,
  },
  letter: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  choiceText: { flex: 1, fontSize: 14, lineHeight: 20 },
  explain: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
});
