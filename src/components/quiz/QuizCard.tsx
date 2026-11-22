import React from 'react';
import { View, Text, Pressable, Share, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart3, Clock, ListChecks, Share2 } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { getQuizStatus } from './status';
import type { QuizPaperCard } from '@/lib/quiz';

/** Site: quiz/QuizCard.tsx (mobile card). Status-colored icon ring, title,
 *  uppercase module name, gradient CTA pill, share button, meta chips and
 *  a status badge. */
export function QuizCard({ paper, onStart }: { paper: QuizPaperCard; onStart: (p: QuizPaperCard) => void }) {
  const { colors, fonts } = useTheme();
  const { statusColor, cta, status } = getQuizStatus(paper);

  const share = async () => {
    const href = paper.kind === 'lecture' ? `/quiz/lecture/${paper.id}` : `/quiz/${paper.id}`;
    try {
      await Share.share({ title: paper.title, message: `https://www.medonex.me${href}` });
    } catch { /* dismissed */ }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <View style={styles.titleRow}>
        <View style={[styles.statusIcon, { borderColor: statusColor + '40' }]}>
          <ListChecks size={16} color={statusColor} />
        </View>
        <View style={styles.titleBody}>
          <Text numberOfLines={1} style={[styles.title, { color: colors.foreground, fontFamily: fonts.sansBold }]}>{paper.title}</Text>
          <Text numberOfLines={1} style={[styles.module, { color: colors.mutedForeground }]}>{paper.moduleName.toUpperCase()}</Text>
        </View>
        <Pressable onPress={() => onStart(paper)} style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] }]}>
          <LinearGradient colors={[cta.color, cta.color + 'DD']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
            <Text style={styles.ctaText}>{cta.label.toUpperCase()}</Text>
          </LinearGradient>
        </Pressable>
        <Pressable onPress={share} accessibilityLabel="Share quiz" style={[styles.shareBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Share2 size={16} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <View style={styles.chipsRow}>
        <View style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ListChecks size={12} color={colors.mutedForeground} />
          <Text style={[styles.chipText, { color: colors.mutedForeground }]}>{paper.questionCount} Qs</Text>
        </View>
        {paper.timeLimitMin != null && (
          <View style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Clock size={12} color={colors.mutedForeground} />
            <Text style={[styles.chipText, { color: colors.mutedForeground }]}>{paper.timeLimitMin}m</Text>
          </View>
        )}
        <View style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <BarChart3 size={12} color={colors.mutedForeground} />
          <Text style={[styles.chipText, { color: colors.mutedForeground }]}>{paper.attemptCount} {paper.attemptCount === 1 ? 'try' : 'tries'}</Text>
        </View>
        {paper.isInteractive && (
          <View style={styles.aiChip}>
            <Text style={styles.aiText}>AI</Text>
          </View>
        )}
        <View style={[styles.statusChip, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label.toUpperCase()}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, paddingBottom: 8, overflow: 'hidden' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 16 },
  statusIcon: { width: 36, height: 36, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  titleBody: { flex: 1, minWidth: 0 },
  title: { fontSize: 14, fontWeight: '700' },
  module: { marginTop: 2, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  cta: { height: 32, borderRadius: 999, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  shareBtn: { width: 32, height: 32, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontSize: 10, fontWeight: '700' },
  aiChip: { borderRadius: 999, backgroundColor: 'rgba(139,92,246,0.15)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)', paddingHorizontal: 8, paddingVertical: 4 },
  aiText: { color: '#A78BFA', fontSize: 8, fontWeight: '700' },
  statusChip: { marginLeft: 'auto', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
});
