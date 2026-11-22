import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import type { Forum } from '@/lib/community';

function forumTypeLabel(type: Forum['type']): string {
  switch (type) {
    case 'GLOBAL': return 'Global';
    case 'UNIVERSITY': return 'University';
    case 'FACULTY': return 'Faculty';
    case 'SEMESTER': return 'Semester';
    case 'PRIVATE': return 'Private';
    default: return type;
  }
}

/** Site: community-mobile/TopBar.tsx — sticky forum tabs, active = bg-muted. */
export function ForumTabs({ forums, activeId, onChange }: { forums: Forum[]; activeId: string | null; onChange: (id: string) => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      {forums.map((forum) => {
        const isActive = forum.id === activeId;
        return (
          <Pressable
            key={forum.id}
            onPress={() => onChange(forum.id)}
            style={[styles.tab, isActive && { backgroundColor: colors.muted }]}
          >
            <Text style={[styles.label, { color: isActive ? colors.foreground : colors.mutedForeground }]}>
              {forumTypeLabel(forum.type)}
            </Text>
            {Boolean(forum.unreadCount) && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingBottom: 4, paddingTop: 8 },
  tab: { position: 'relative', flex: 1, borderRadius: 12, paddingVertical: 8, alignItems: 'center' },
  label: { fontSize: 12, fontWeight: '500' },
  dot: { position: 'absolute', right: 8, top: 6, width: 6, height: 6, borderRadius: 999 },
});
