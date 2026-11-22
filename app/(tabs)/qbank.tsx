import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, RefreshControl, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, X, FileText } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { TABLET_BREAKPOINT, SCROLL_BOTTOM_PAD } from '@/theme/tokens';
import { usePastPapers, type QuizFilter, type QuizPaperCard } from '@/lib/quiz';
import { QuizStatsRow } from '@/components/quiz/QuizStatsRow';
import { QuizFilterChips } from '@/components/quiz/QuizFilterChips';
import { QuizCard } from '@/components/quiz/QuizCard';

/** QBank (/past-papers) — pixel match of the site's phone list: search,
 *  stats rings, filter chips, quiz cards. Guests see the sign-in empty
 *  state (the site redirects guests to /login). */
export default function QBankScreen() {
  const { st, colors, fonts } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;
  const router = useRouter();
  const papers = usePastPapers();

  const [filter, setFilter] = useState<QuizFilter>('all');
  const [query, setQuery] = useState('');

  const data = papers.data;
  const cards = useMemo(() => data?.cards ?? [], [data]);

  const counts = useMemo(
    () => ({
      all: cards.length,
      in_progress: cards.filter((p) => p.inProgress).length,
      completed: cards.filter((p) => p.attemptCount > 0).length,
      not_started: cards.filter((p) => p.attemptCount === 0 && !p.inProgress).length,
    }),
    [cards],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = q ? cards.filter((p) => p.title.toLowerCase().includes(q) || p.moduleName.toLowerCase().includes(q)) : cards;
    switch (filter) {
      case 'in_progress': return matches.filter((p) => p.inProgress);
      case 'completed': return matches.filter((p) => p.attemptCount > 0);
      case 'not_started': return matches.filter((p) => p.attemptCount === 0 && !p.inProgress);
      default: return matches;
    }
  }, [filter, query, cards]);

  const paperItems = filtered.filter((p) => p.kind !== 'lecture');
  const lectureItems = filtered.filter((p) => p.kind === 'lecture');

  const onStart = (p: QuizPaperCard) => {
    const href = p.kind === 'lecture' ? `/quiz/lecture/${p.id}` : `/quiz/${p.id}`;
    router.push(href as never);
  };

  const sectionHeading = (title: string, count: number) => (
    <View style={styles.sectionHead}>
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title.toUpperCase()}</Text>
      <View style={[styles.sectionCount, { backgroundColor: colors.muted }]}>
        <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: '700' }}>{count}</Text>
      </View>
    </View>
  );

  const content = (
    <>
      <View style={[styles.searchRow, { backgroundColor: st.surface, borderColor: st.border }]}>
        <Search size={16} color={st.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('qbank.searchPlaceholder')}
          placeholderTextColor={st.muted}
          autoComplete="off"
          style={[styles.searchInput, { color: st.text, fontFamily: fonts.sans }]}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} accessibilityLabel="Clear search">
            <X size={16} color={st.muted} />
          </Pressable>
        )}
      </View>

      <QuizStatsRow
        totalQuizzes={data?.paperCount ?? 0}
        completed={data?.completedPapers ?? 0}
        avgScore={data?.avgScore ?? 0}
      />

      <QuizFilterChips active={filter} counts={counts} onChange={setFilter} />

      {data === null ? (
        <View style={[styles.emptyCard, { backgroundColor: st.surface, borderColor: st.border }]}>
          <View style={[styles.emptyIcon, { backgroundColor: st.surfacePressed, borderColor: st.border }]}>
            <FileText size={28} color={colors.primary} />
          </View>
          <Text style={{ color: st.text, fontSize: 15, fontWeight: '700', fontFamily: fonts.sansBold }}>{t('qbank.signInTitle')}</Text>
          <Text style={{ color: st.muted, fontSize: 12, marginTop: 4, textAlign: 'center' }}>{t('qbank.signInDesc')}</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={[styles.noMatch, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
            {query ? t('qbank.noMatch') : t('qbank.emptyView')}
          </Text>
        </View>
      ) : (
        <View style={{ gap: 24 }}>
          {paperItems.length > 0 && (
            <View style={{ gap: 12 }}>
              {lectureItems.length > 0 && sectionHeading('Past papers', paperItems.length)}
              {paperItems.map((p) => (
                <QuizCard key={p.id} paper={p} onStart={onStart} />
              ))}
            </View>
          )}
          {lectureItems.length > 0 && (
            <View style={{ gap: 12 }}>
              {sectionHeading('Lecture quizzes', lectureItems.length)}
              {lectureItems.map((p) => (
                <QuizCard key={p.id} paper={p} onStart={onStart} />
              ))}
            </View>
          )}
        </View>
      )}
    </>
  );

  return (
    <View style={[styles.root, { backgroundColor: st.bg, paddingTop: insets.top + 4 }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          { paddingHorizontal: 12, paddingBottom: insets.bottom + SCROLL_BOTTOM_PAD, gap: 16 },
          isTablet && { maxWidth: 1504, width: '100%', alignSelf: 'center', paddingHorizontal: 32 },
        ]}
        refreshControl={
          <RefreshControl refreshing={papers.isRefetching} onRefresh={() => papers.refetch()} tintColor={st.muted} />
        }
      >
        {content}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  searchRow: {
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  searchInput: { flex: 1, minWidth: 0, height: '100%', fontSize: 15, padding: 0 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  sectionCount: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  emptyCard: { borderRadius: 16, borderWidth: 1, alignItems: 'center', paddingHorizontal: 16, paddingVertical: 56 },
  emptyIcon: { width: 64, height: 64, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  noMatch: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 40, alignItems: 'center' },
});
