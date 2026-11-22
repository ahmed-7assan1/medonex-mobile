import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Home, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { useRooms, type RoomSummary } from '@/lib/community';

/** Gradient fallbacks from RoomsRow.tsx (blue/teal/emerald/rose/amber/cyan @20%). */
const GRADS: [string, string][] = [
  ['rgba(59,130,246,0.2)', 'rgba(37,99,235,0.2)'],
  ['rgba(20,184,166,0.2)', 'rgba(13,148,136,0.2)'],
  ['rgba(16,185,129,0.2)', 'rgba(5,150,105,0.2)'],
  ['rgba(244,63,94,0.2)', 'rgba(225,29,72,0.2)'],
  ['rgba(245,158,11,0.2)', 'rgba(217,119,6,0.2)'],
  ['rgba(6,182,212,0.2)', 'rgba(8,145,178,0.2)'],
];

function RoomCircle({ room, idx, highlight = false }: { room: RoomSummary; idx: number; highlight?: boolean }) {
  const { colors, fonts } = useTheme();
  const router = useRouter();
  const size = highlight ? 56 : 52;
  return (
    <Pressable onPress={() => router.push(`/rooms/${room.id}` as never)} style={styles.circleWrap}>
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderColor: highlight ? '#FBBF24' : colors.border,
            borderWidth: highlight ? 2 : 1,
            backgroundColor: highlight ? 'rgba(251,191,36,0.1)' : colors.card,
          },
        ]}
      >
        <LinearGradient colors={GRADS[idx % GRADS.length]} style={StyleSheet.absoluteFill}>
          <View style={styles.circleInner}>
            {highlight ? (
              <Home size={16} color="#D97706" />
            ) : (
              <Text style={{ fontWeight: '800', fontSize: 14, color: colors.foreground }}>
                {room.name.trim().charAt(0).toUpperCase() || '#'}
              </Text>
            )}
          </View>
        </LinearGradient>
      </View>
      <Text numberOfLines={1} style={[styles.roomName, { color: colors.mutedForeground, fontFamily: fonts.sansBold }]}>
        {room.name.toUpperCase()}
      </Text>
      <View
        style={[
          styles.membersPill,
          highlight
            ? { backgroundColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.2)' }
            : { backgroundColor: colors.muted, borderColor: colors.border },
        ]}
      >
        <Users size={8} color={highlight ? '#F59E0B' : colors.mutedForeground} />
        <Text style={{ fontSize: 7, fontWeight: '800', letterSpacing: 1, color: highlight ? '#D97706' : colors.mutedForeground }}>
          {highlight ? 'MY ROOM' : String(room._count?.members ?? 0)}
        </Text>
      </View>
    </Pressable>
  );
}

/** Site: community-mobile/RoomsRow.tsx — stories-style row: my room
 *  (amber highlight) or dashed create circle, then room circles. */
export function RoomsRow() {
  const { colors, fonts } = useTheme();
  const rooms = useRooms();
  const data = rooms.data;
  if (data === undefined) return null; // loading — keep the layout quiet
  if (data === null) return null; // guest
  const { myRoom, rooms: rest } = data;
  if (!myRoom && rest.length === 0) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {myRoom ? (
        <RoomCircle room={myRoom} idx={0} highlight />
      ) : (
        <Pressable style={styles.circleWrap} onPress={() => { /* create room sheet — later phase */ }}>
          <View style={[styles.circle, styles.createCircle, { borderColor: colors.primary + '4D', backgroundColor: colors.card }]}>
            <Plus size={20} color={colors.primary} />
          </View>
          <Text style={[styles.roomName, { color: colors.primary, fontFamily: fonts.sansBold }]}>CREATE</Text>
          <Text style={{ fontSize: 8, fontWeight: '700', color: colors.mutedForeground, marginTop: -2 }}>new room</Text>
        </Pressable>
      )}
      {rest.map((room, i) => (
        <RoomCircle key={room.id} room={room} idx={myRoom ? i + 1 : i} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 14, paddingLeft: 16, paddingTop: 8, paddingBottom: 8, alignItems: 'flex-start' },
  circleWrap: { alignItems: 'center', gap: 6, width: 72 },
  circle: { borderRadius: 999, overflow: 'hidden' },
  createCircle: { borderStyle: 'dashed', borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  circleInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  roomName: { fontSize: 9, fontWeight: '800', letterSpacing: 1, textAlign: 'center', maxWidth: 72 },
  membersPill: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 999, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, marginTop: -2 },
});
