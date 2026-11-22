import React from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { TABLET_BREAKPOINT } from '@/theme/tokens';
import { useModulesCatalog } from '@/lib/modules';
import { StatsOverview } from '@/components/modules/StatsOverview';
import { QuickActionsCard } from '@/components/modules/QuickActionsCard';
import { ModuleRow } from '@/components/modules/ModuleRow';
import { TabletModules } from '@/components/modules/TabletModules';

/** /modules — pixel match of the site's phone modules page: search bar,
 *  Semester overview, quick actions, "Your modules" catalog rows.
 *  Tablet renders the desktop arrangement. */
export default function ModulesScreen() {
  const { colors, fonts } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;
  const router = useRouter();
  const catalog = useModulesCatalog();
  const view = catalog.data?.view;

  if (isTablet) {
    return <TabletModules data={catalog.data} />;
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 12 }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={catalog.isRefetching} onRefresh={() => catalog.refetch()} tintColor={colors.mutedForeground} />
        }
      >
        <Pressable
          onPress={() => router.push('/search' as never)}
          style={[styles.search, { borderColor: colors.border, backgroundColor: colors.secondary }]}
          accessibilityRole="button"
          accessibilityLabel={t('modules.searchPlaceholder')}
        >
          <Search size={17} color={colors.mutedForeground} />
          <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>{t('modules.searchPlaceholder')}</Text>
        </Pressable>

        <StatsOverview
          totalModules={view?.totalModules ?? 0}
          totalLectures={view?.totalLectures ?? 0}
          totalQuestions={view?.totalQuestions ?? 0}
          completionPercent={view?.overallPercent ?? 0}
        />

        <View style={{ marginTop: 16 }}>
          <QuickActionsCard continueHref={catalog.data?.continueHref ?? null} />
        </View>

        {(view?.sortedByLectures?.length ?? 0) > 0 && (
          <View style={{ marginTop: 24 }}>
            <View style={styles.listHead}>
              <Text style={[styles.listTitle, { color: colors.foreground, fontFamily: fonts.sansSemiBold }]}>
                {t('modules.yourModules')}
              </Text>
              <View style={[styles.countPill, { backgroundColor: colors.muted }]}>
                <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: '500', fontVariant: ['tabular-nums'] }}>
                  {view!.inProgressStats.length || view!.sortedByLectures.length}
                </Text>
              </View>
            </View>
            <View style={{ gap: 10 }}>
              {view!.sortedByLectures.map((m, i) => (
                <ModuleRow key={m.id} module={m} index={i} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  search: {
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  listHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  listTitle: { fontSize: 16, fontWeight: '600', letterSpacing: -0.3 },
  countPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
});
