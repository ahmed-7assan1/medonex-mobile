import React from 'react';
import { View, Text, ScrollView, Image, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { ACCENTS, getAbbreviation } from './accents';
import { StatsOverview } from './StatsOverview';
import { QuickActionsCard } from './QuickActionsCard';
import type { ModulesCatalogResponse } from '@/lib/modules';

/** Tablet /modules — desktop arrangement from ModulesCatalogClient:
 *  stats + quick actions, then the featured module grid (desktop cards). */
export function TabletModules({ data }: { data: ModulesCatalogResponse | undefined }) {
  const { colors, fonts } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const view = data?.view;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <StatsOverview
        totalModules={view?.totalModules ?? 0}
        totalLectures={view?.totalLectures ?? 0}
        totalQuestions={view?.totalQuestions ?? 0}
        completionPercent={view?.overallPercent ?? 0}
      />
      <View style={{ marginTop: 24 }}>
        <QuickActionsCard continueHref={data?.continueHref ?? null} />
      </View>

      <View style={styles.grid}>
        {(view?.sortedByLectures ?? []).map((m, i) => {
          const accent = ACCENTS[i % ACCENTS.length];
          return (
            <Pressable
              key={m.id}
              onPress={() => router.push(`/modules/${m.id}` as never)}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
                pressed && { opacity: 0.9 },
              ]}
            >
              <Text style={[styles.watermark, { color: accent.text }]}>{getAbbreviation(m.name)}</Text>
              <View style={[styles.dot, { backgroundColor: accent.bar[0] }]} />
              <Text style={[styles.name, { color: colors.foreground, fontFamily: fonts.sansBold }]}>{m.name}</Text>
              <View style={styles.counts}>
                <Text style={[styles.countText, { color: colors.mutedForeground }]}>{m.subjectsCount} Subjects</Text>
                <View style={[styles.sep, { backgroundColor: colors.border }]} />
                <Text style={[styles.countText, { color: colors.mutedForeground }]}>{m.lecturesCount} Lectures</Text>
                <View style={[styles.sep, { backgroundColor: colors.border }]} />
                <Text style={[styles.countText, { color: colors.mutedForeground }]}>{m.questionsCount} Questions</Text>
              </View>
              <View style={{ marginTop: 16 }}>
                <View style={styles.masteryRow}>
                  <Text style={[styles.masteryLabel, { color: colors.mutedForeground }]}>Mastery Progress</Text>
                  <Text style={[styles.masteryPct, { color: accent.text }]}>{m.percentage}%</Text>
                </View>
                <View style={[styles.track, { backgroundColor: colors.muted }]}>
                  <LinearGradient
                    colors={accent.bar}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.fill, { width: `${Math.max(0, Math.min(100, m.percentage))}%` }]}
                  />
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { maxWidth: 1504, width: '100%', alignSelf: 'center', paddingHorizontal: 32, paddingTop: 28, paddingBottom: 48 },
  grid: { marginTop: 24, flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: { width: '31%', flexGrow: 1, minWidth: 220, minHeight: 190, borderRadius: 16, borderWidth: 1, padding: 20, overflow: 'hidden' },
  watermark: { position: 'absolute', right: -12, top: -22, fontSize: 110, fontWeight: '900', opacity: 0.04 },
  dot: { width: 8, height: 8, borderRadius: 999, marginBottom: 12 },
  name: { fontSize: 17, fontWeight: '700' },
  counts: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  countText: { fontSize: 11, fontWeight: '500' },
  sep: { width: 4, height: 4, borderRadius: 999 },
  masteryRow: { marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between' },
  masteryLabel: { fontSize: 11, fontWeight: '500' },
  masteryPct: { fontSize: 11, fontWeight: '700' },
  track: { height: 6, width: '100%', borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },
});
