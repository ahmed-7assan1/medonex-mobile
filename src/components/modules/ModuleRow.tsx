import React, { useState } from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bookmark } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { ACCENTS, getAbbreviation } from './accents';
import type { ModuleWithStats } from '@/lib/modules';

/** Site: modules/FeaturedModuleCard.tsx phone row — 52px thumb (image or
 *  abbreviation), name 15 semibold, counts meta, gradient mastery bar,
 *  amber bookmark toggle. */
export function ModuleRow({ module, index = 0 }: { module: ModuleWithStats; index?: number }) {
  const { colors, fonts } = useTheme();
  const router = useRouter();
  const accent = ACCENTS[index % ACCENTS.length];
  const [saved, setSaved] = useState(false);

  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable
        onPress={() => router.push(`/modules/${module.id}` as never)}
        style={({ pressed }) => [styles.main, pressed && { opacity: 0.9 }]}
        accessibilityRole="button"
        accessibilityLabel={module.name}
      >
        <View style={[styles.thumb, { backgroundColor: colors.muted }]}>
          {module.imageUrl ? (
            <Image source={{ uri: module.imageUrl }} style={styles.thumbImg} resizeMode="cover" />
          ) : (
            <Text style={{ fontSize: 13, fontWeight: '600', color: accent.text }}>{getAbbreviation(module.name)}</Text>
          )}
        </View>
        <View style={styles.body}>
          <Text numberOfLines={1} style={[styles.name, { color: colors.foreground, fontFamily: fonts.sansSemiBold }]}>{module.name}</Text>
          <Text numberOfLines={1} style={[styles.meta, { color: colors.mutedForeground }]}>
            {module.subjectsCount} subjects · {module.lecturesCount} lectures · {module.questionsCount} questions
          </Text>
          <View style={styles.progressRow}>
            <View style={[styles.track, { backgroundColor: colors.muted }]}>
              <LinearGradient
                colors={accent.bar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.fill, { width: `${Math.max(0, Math.min(100, module.percentage))}%` }]}
              />
            </View>
            <Text style={[styles.pct, { color: accent.text }]}>{module.percentage}%</Text>
          </View>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={saved ? `Remove ${module.name} from saved modules` : `Save ${module.name}`}
        accessibilityState={{ selected: saved }}
        onPress={() => setSaved((s) => !s)}
        hitSlop={6}
        style={({ pressed }) => [styles.bookmark, pressed && { backgroundColor: colors.muted }]}
      >
        <Bookmark size={18} color={saved ? '#F59E0B' : colors.mutedForeground} fill={saved ? '#F59E0B' : 'transparent'} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  main: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 52, height: 52, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  thumbImg: { width: '100%', height: '100%' },
  body: { flex: 1, minWidth: 0 },
  name: { fontSize: 15, fontWeight: '600' },
  meta: { marginTop: 4, fontSize: 11 },
  progressRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  track: { height: 6, flex: 1, minWidth: 0, borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },
  pct: { fontSize: 11, fontWeight: '600', fontVariant: ['tabular-nums'] },
  bookmark: { width: 40, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
});
