import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { TABLET_BREAKPOINT, SCROLL_BOTTOM_PAD } from '@/theme/tokens';
import { useHome, firstNameOf } from '@/lib/home';
import { ProfileHeader } from '@/components/home/ProfileHeader';
import { AchievementsStrip } from '@/components/home/AchievementsStrip';
import { ContinueLearningCarousel, type LastLecture } from '@/components/home/ContinueLearningCarousel';
import { SuggestedLecturesCarousel, type SuggestedLecture } from '@/components/home/SuggestedLecturesCarousel';
import { MyMedSpaceSection } from '@/components/home/MyMedSpaceSection';
import { NotificationsSheet } from '@/components/NotificationsSheet';
import { TabletHome } from '@/components/home/TabletHome';

/** Home — pixel match of the site's phone dashboard (DashboardMobileView):
 *  header, achievements strip, continue-learning carousel, suggested
 *  lectures, My MedSpace. Tablet (>=768dp) renders the desktop-style home. */
export default function HomeScreen() {
  const { st } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;
  const router = useRouter();
  const home = useHome();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const data = home.data;
  const lastLecture: LastLecture | null = useMemo(() => {
    const a = data?.recentActivity?.find((x) => x.lecture);
    if (!a?.lecture) return null;
    return {
      lectureId: a.lecture.id,
      moduleId: a.lecture.subject?.module?.id ?? '',
      lectureTitle: a.lecture.title,
      subjectName: a.lecture.subject?.name ?? null,
      channelName: a.lecture.subject?.module?.name ?? null,
      coverImageUrl: a.lecture.coverImageUrl ?? null,
    };
  }, [data]);

  const suggested: SuggestedLecture[] = data?.suggestedLectures ?? [];

  const goal = useMemo(() => {
    const tasks = data?.todayTasks ?? [];
    const done = data?.todayItemCount ?? tasks.filter((x) => x.completed ?? x.isDone ?? x.done).length;
    const target = data?.dailyTarget ?? 50;
    return { done, target, pct: target > 0 ? (done / target) * 100 : 0 };
  }, [data]);

  if (isTablet) {
    return <TabletHome />;
  }

  return (
    <View style={[styles.root, { backgroundColor: st.bg, paddingTop: insets.top + 12 }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + SCROLL_BOTTOM_PAD }}
        refreshControl={
          <RefreshControl refreshing={home.isRefetching} onRefresh={() => home.refetch()} tintColor={st.muted} />
        }
      >
        <ProfileHeader
          firstName={firstNameOf(data?.user?.nickname ?? data?.user?.name, data?.user?.email)}
          userImage={data?.user?.image ?? null}
          unread={data?.unreadNotifs ?? 0}
          onOpenAI={() => router.push('/ai-chat' as never)}
          onOpenNotifications={() => setNotificationsOpen(true)}
        />
        <View style={styles.sections}>
          <AchievementsStrip
            goalDone={goal.done}
            goalTarget={goal.target}
            goalPct={goal.pct}
            streak={data?.stats?.streak ?? 0}
            rankLabel={data?.stats?.rank?.label ?? '—'}
            rankPct={data?.progressToNext ?? 0}
          />
          <ContinueLearningCarousel lastLecture={lastLecture} />
          <SuggestedLecturesCarousel lectures={suggested} />
          <MyMedSpaceSection />
        </View>
      </ScrollView>
      <NotificationsSheet open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  sections: { paddingHorizontal: 16, gap: 28 },
});
