import React from 'react';
import { View, Text, Pressable, Image, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Bell, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { mTokens } from '@/theme/tokens';

interface Props {
  firstName: string;
  userImage?: string | null;
  unread: number;
  onOpenAI: () => void;
  onOpenNotifications: () => void;
}

/** Site: dashboard/mobile/ProfileHeader.tsx — avatar 40 + name 18 semibold,
 *  two 44px round blurred icon buttons, destructive dot on the bell. */
export function ProfileHeader({ firstName, userImage, unread, onOpenAI, onOpenNotifications }: Props) {
  const { st, colors, fonts } = useTheme();
  const router = useRouter();

  const iconBtn: StyleProp<ViewStyle> = [
    styles.iconBtn,
    { borderColor: st.border, backgroundColor: st.surface + 'C7' /* 78% */ },
  ];

  return (
    <View style={styles.header}>
      <View style={styles.left}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open profile settings"
          onPress={() => router.push('/settings')}
          style={({ pressed }) => [pressed && { transform: [{ scale: 0.95 }] }]}
        >
          {userImage ? (
            <Image source={{ uri: userImage }} style={[styles.avatar, { borderColor: st.border }]} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: st.surface, borderColor: st.border }]}>
              <Text style={{ color: st.text, fontSize: 14, fontWeight: '600', fontFamily: fonts.sansBold }}>
                {firstName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </Pressable>
        <Text numberOfLines={1} style={[styles.name, { color: st.text, fontFamily: fonts.sansBold }]}>
          {firstName}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel="AI Assistant" onPress={onOpenAI} style={iconBtn}>
          <Sparkles size={19} color={st.text} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
          onPress={onOpenNotifications}
          style={iconBtn}
        >
          <Bell size={19} color={st.text} />
          {unread > 0 && (
            <View style={[styles.dot, { backgroundColor: colors.destructive, borderColor: st.surface }]} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 },
  avatar: { width: mTokens.avatar, height: mTokens.avatar, borderRadius: 999, borderWidth: 1 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 18, fontWeight: '600', letterSpacing: -0.3, flexShrink: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: mTokens.iconBtn,
    height: mTokens.iconBtn,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  dot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 999,
    borderWidth: 2,
  },
});
