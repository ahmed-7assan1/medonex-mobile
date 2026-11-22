import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
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
      onPress={onPress}
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

export function QuizQuestionContent({
  question,
  showResult,
  selectedAnswer,
  onAnswer,
}: {
  question: FixtureQuizQuestion;
  showResult: boolean;
  selectedAnswer?: string;
  onAnswer?: (key: string) => void;
}) {
  const { colors, fonts } = useTheme();

  return (
    <View style={styles.content}>
      <Text style={{ color: colors.foreground, fontSize: 15, lineHeight: 23, fontFamily: fonts.sansMedium }}>
        {question.body}
      </Text>

      <View style={{ gap: 10 }}>
        {question.choices.map((choice) => {
          const isSelected = selectedAnswer === choice.key;
          const isCorrect = showResult && choice.key === question.answer;
          const isWrong = showResult && isSelected && choice.key !== question.answer;
          const dim = showResult && !isCorrect && !isWrong;

          let borderColor = colors.border;
          let backgroundColor = 'transparent';
          if (!showResult && isSelected) { borderColor = colors.primary; backgroundColor = colors.primary + '1A'; }
          if (isCorrect) { borderColor = '#10B981'; backgroundColor = 'rgba(16,185,129,0.10)'; }
          if (isWrong) { borderColor = '#F87171'; backgroundColor = 'rgba(239,68,68,0.10)'; }

          let letterBorder = colors.mutedForeground + '40';
          let letterBg = 'transparent';
          let letterFg = colors.mutedForeground;
          if (!showResult && isSelected) { letterBorder = colors.primary; letterBg = colors.primary; letterFg = colors.primaryForeground; }
          if (isCorrect) { letterBorder = '#10B981'; letterBg = '#10B981'; letterFg = '#FFFFFF'; }
          if (isWrong) { letterBorder = '#EF4444'; letterBg = '#EF4444'; letterFg = '#FFFFFF'; }

          return (
            <Pressable
              key={choice.key}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled: showResult }}
              disabled={showResult}
              onPress={() => onAnswer?.(choice.key)}
              style={[
                styles.choice,
                { borderColor, backgroundColor },
                !showResult && isSelected && { borderWidth: 1.5 },
                dim && { opacity: 0.55 },
              ]}
            >
              <View style={[styles.letter, { borderColor: letterBorder, backgroundColor: letterBg }]}>
                <Text style={{ color: letterFg, fontSize: 12, fontFamily: fonts.sansBold }}>{choice.key}</Text>
              </View>
              <Text style={[
                styles.choiceText,
                { color: colors.foreground, fontFamily: (isSelected || isCorrect) ? fonts.sansSemiBold : fonts.sans },
              ]}>
                {choice.text}
              </Text>
              {isCorrect && <CheckCircle2 size={20} color="#10B981" />}
              {isWrong && <XCircle size={20} color="#EF4444" />}
            </Pressable>
          );
        })}
      </View>

      {showResult && !!question.explanation?.trim() && (
        <View style={[styles.explain, { borderColor: colors.border, backgroundColor: colors.muted + '40' }]}>
          <Text style={{ color: colors.mutedForeground, fontSize: 11, fontFamily: fonts.sansBold, letterSpacing: 0.8, textTransform: 'uppercase' }}>
            Explanation
          </Text>
          <Text style={{ color: colors.foreground, fontSize: 14, lineHeight: 21, fontFamily: fonts.sans, marginTop: 8 }}>
            {question.explanation}
          </Text>
        </View>
      )}
    </View>
  );
}

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
