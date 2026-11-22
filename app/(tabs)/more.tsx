import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Sparkles, Video, Mic2, Clock, User, Settings, Bookmark, Layers, LogOut } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useAuth } from '@/lib/auth';

/** "More" grid — the capsule's middle button on the site opens the same
 *  kind of sheet; here it is a tab page listing every other destination. */
const ITEMS = [
  { key: 'ai', label: 'Dr Q — AI Tutor', href: '/ai-chat', icon: Sparkles },
  { key: 'videos', label: 'OneX Videos', href: '/videos', icon: Video },
  { key: 'reels', label: 'Reels', href: '/videos/reels', icon: Layers },
  { key: 'podcasts', label: 'Podcasts', href: '/podcasts', icon: Mic2 },
  { key: 'taskat', label: 'Taskat', href: '/taskat', icon: Clock },
  { key: 'saved', label: 'Saved', href: '/saved', icon: Bookmark },
  { key: 'profile', label: 'Profile', href: '/profile', icon: User },
  { key: 'settings', label: 'Settings', href: '/settings', icon: Settings },
] as const;

export default function MoreScreen() {
  const { st, fonts } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut } = useAuth();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: st.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 120 }}
    >
      <Text style={[styles.heading, { color: st.text, fontFamily: fonts.sansBold }]}>{t('tabs.more')}</Text>
      <View style={styles.grid}>
        {ITEMS.map((it) => {
          const Icon = it.icon;
          return (
            <Pressable
              key={it.key}
              onPress={() => router.push(it.href as never)}
              style={({ pressed }) => [
                styles.tile,
                { backgroundColor: st.surface, borderColor: st.border },
                pressed && { backgroundColor: st.surfacePressed, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Icon size={22} color={st.text} />
              <Text style={[styles.tileLabel, { color: st.text }]}>{it.label}</Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={async () => { await signOut(); router.replace('/(auth)/login'); }}
          style={({ pressed }) => [
            styles.tile,
            { backgroundColor: st.surface, borderColor: st.border },
            pressed && { backgroundColor: st.surfacePressed, transform: [{ scale: 0.98 }] },
          ]}
        >
          <LogOut size={22} color="#DC2626" />
          <Text style={[styles.tileLabel, { color: '#DC2626' }]}>{t('auth.signOut')}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    width: '47%',
    flexGrow: 1,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  tileLabel: { fontSize: 13, fontWeight: '600' },
});
