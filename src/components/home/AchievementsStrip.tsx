import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Flame, Target, Trophy } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { mTokens } from '@/theme/tokens';

function Bar({ pct, label }: { pct: number; label: string }) {
  const { st } = useTheme();
  const w = Math.max(0, Math.min(100, pct));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: w }}
      style={[styles.barTrack, { backgroundColor: st.surfacePressed }]}
    >
      <View style={[styles.barFill, { backgroundColor: st.pillFill, width: `${w}%` }]} />
    </View>
  );
}

interface Props {
  goalDone: number;
  goalTarget: number;
  goalPct: number;
  streak: number;
  rankLabel: string;
  rankPct?: number | null;
}

/** Site: dashboard/mobile/AchievementsStrip.tsx — one grouped card, three
 *  tiles (Goal / Streak / Rank) split by hairlines, 6px progress bars. */
export function AchievementsStrip({ goalDone, goalTarget, goalPct, streak, rankLabel, rankPct }: Props) {
  const { st, fonts } = useTheme();
  const { t } = useTranslation();

  const labelStyle = [styles.label, { color: st.muted, fontFamily: fonts.sansMedium }] as const;
  const valueStyle = [styles.value, { color: st.text, fontFamily: fonts.sansBold }] as const;
  const subStyle = { color: st.muted, fontSize: 12, fontWeight: '500' as const };

  return (
    <View accessibilityLabel={t('home.yourProgress')}>
      <Text style={[styles.section, { color: st.text, fontFamily: fonts.sansBold }]}>{t('home.yourProgress')}</Text>
      <View style={[styles.card, { backgroundColor: st.surface, borderColor: st.border }]}>
        <View style={[styles.tile, styles.tileBorder, { borderColor: st.border, paddingRight: 10 }]}>
          <View style={labelStyle as object}>
            <Target size={14} color={st.muted} />
            <Text style={{ color: st.muted, fontSize: 11 }}>{t('home.goal')}</Text>
          </View>
          <Text style={[valueStyle as object, { marginTop: 8 }]}>
            {goalDone}
            <Text style={subStyle}>/{goalTarget}</Text>
          </Text>
          <Bar pct={goalPct} label="Daily goal progress" />
        </View>
        <View style={[styles.tile, styles.tileBorder, { borderColor: st.border, paddingHorizontal: 10 }]}>
          <View style={labelStyle as object}>
            <Flame size={14} color="#F97316" />
            <Text style={{ color: st.muted, fontSize: 11 }}>{t('home.streak')}</Text>
          </View>
          <Text style={[valueStyle as object, { marginTop: 8 }]}>
            {streak}
            <Text style={subStyle}> d</Text>
          </Text>
        </View>
        <View style={[styles.tile, { paddingLeft: 10 }]}>
          <View style={labelStyle as object}>
            <Trophy size={14} color={st.muted} />
            <Text style={{ color: st.muted, fontSize: 11 }}>{t('home.rank')}</Text>
          </View>
          <Text numberOfLines={1} style={[valueStyle as object, { marginTop: 8, fontSize: 15 }]}>
            {rankLabel}
          </Text>
          {rankPct != null && <Bar pct={rankPct} label="Progress to next rank" />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    fontSize: mTokens.sectionSize,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: mTokens.headingGap,
  },
  card: {
    borderRadius: mTokens.cardRadius,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  tile: { flex: 1, minWidth: 0 },
  tileBorder: { borderRightWidth: 1 },
  label: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  value: { fontSize: mTokens.valueSize, fontWeight: '600', fontVariant: ['tabular-nums'] },
  barTrack: { marginTop: 8, height: 6, width: '100%', borderRadius: 999, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999 },
});
