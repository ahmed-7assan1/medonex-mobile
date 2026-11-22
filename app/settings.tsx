import React, { useState } from 'react';
import {
  View, Text, Pressable, ScrollView, TextInput, StyleSheet, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft, ChevronDown, UserCircle2, GraduationCap, Send, ShieldCheck,
  Palette, Sparkles, Bell, Lock, Eye, EyeOff, CheckCircle2, AlertTriangle,
  Trash2, Key,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { useAuth } from '@/lib/auth';

type RowItem = { id: string; title: string; icon: any };

const GROUPS: RowItem[][] = [
  [
    { id: 'identity', title: 'Profile & Identity', icon: UserCircle2 },
    { id: 'branding', title: 'Avatar & Brand', icon: Sparkles },
  ],
  [
    { id: 'academic', title: 'University Context', icon: GraduationCap },
    { id: 'telegram', title: 'Telegram Hub', icon: Send },
  ],
  [
    { id: 'privacy', title: 'Privacy & Visibility', icon: ShieldCheck },
    { id: 'notifications', title: 'Notifications', icon: Bell },
    { id: 'appearance', title: 'Appearance', icon: Palette },
  ],
];

function tileRadius(i: number, n: number) {
  if (n === 1) return { borderRadius: 16 };
  if (i === 0) return { borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 };
  if (i === n - 1) return { borderTopLeftRadius: 4, borderTopRightRadius: 4, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 };
  return { borderRadius: 4 };
}

/** /settings — pixel match of the site's phone settings page: account card
 *  (avatar, name, email, Premium pill, Manage subscription), connected
 *  tile groups, expandable Password & Security, AI keys + Clear App Cache.
 *  Overlays open in a later phase; rows are in place. */
export default function SettingsScreen() {
  const { st, fonts } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [pwOpen, setPwOpen] = useState(false);
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwShow, setPwShow] = useState({ current: false, new: false, confirm: false });
  const [pwMsg, setPwMsg] = useState<'google' | 'mismatch' | 'short' | 'empty' | null>(null);

  const name = user?.name || t('settings.guestName');
  const email = user?.email || '';
  const initial = (name || 'S').charAt(0).toUpperCase();

  const submitPassword = () => {
    if (!pwCurrent || !pwNew || !pwConfirm) return setPwMsg('empty');
    if (pwNew.length < 6) return setPwMsg('short');
    if (pwNew !== pwConfirm) return setPwMsg('mismatch');
    // Google-only accounts have no password to change; the site's flow is
    // Supabase email/password. Wire to a mobile endpoint in a later phase.
    return setPwMsg('google');
  };

  const pwField = (
    value: string, setValue: (v: string) => void, placeholder: string,
    show: boolean, toggle: () => void, key: string,
  ) => (
    <View key={key} style={[styles.pwFieldWrap, { backgroundColor: st.bg, borderColor: st.border }]}>
      <TextInput
        value={value}
        onChangeText={(v) => { setValue(v); setPwMsg(null); }}
        placeholder={placeholder}
        placeholderTextColor={st.muted}
        secureTextEntry={!show}
        autoCapitalize="none"
        style={[styles.pwInput, { color: st.text, fontFamily: fonts.sans }]}
      />
      <Pressable onPress={toggle} hitSlop={8}>
        {show ? <EyeOff size={16} color={st.muted} /> : <Eye size={16} color={st.muted} />}
      </Pressable>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: st.bg, paddingTop: insets.top + 8 }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Route title */}
        <View style={styles.titleRow}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/more' as never))}
            hitSlop={12}
            style={[styles.backBtn, { backgroundColor: st.surface, borderColor: st.border }]}
            accessibilityLabel={t('moduleDetail.back')}
          >
            <ChevronLeft size={20} color={st.text} />
          </Pressable>
          <Text style={[styles.title, { color: st.text, fontFamily: fonts.sansBold }]}>{t('settings.title')}</Text>
        </View>

        <View style={styles.column}>
          {/* Account card */}
          <View style={[styles.accountCard, { backgroundColor: st.surface, borderColor: st.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {user?.image ? (
                <Image source={{ uri: user.image }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: st.pillFill }]}>
                  <Text style={{ color: st.pillText, fontSize: 17, fontWeight: '600' }}>{initial}</Text>
                </View>
              )}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ color: st.text, fontSize: 17, fontWeight: '600', fontFamily: fonts.sansBold }}>{name}</Text>
                {!!email && (
                  <Text numberOfLines={1} style={{ color: st.muted, fontSize: 15, marginTop: 2 }}>{email}</Text>
                )}
              </View>
              <View style={styles.premiumPill}>
                <Text style={{ color: '#F59E0B', fontSize: 13, fontWeight: '500' }}>Premium</Text>
              </View>
            </View>
            <Pressable style={[styles.manageBtn, { backgroundColor: st.pillFill }]}>
              <Text style={{ color: st.pillText, fontSize: 16, fontWeight: '500' }}>{t('settings.manageSubscription')}</Text>
            </Pressable>
          </View>

          {/* Tile groups */}
          {GROUPS.map((items, gi) => (
            <View key={gi} style={{ gap: 2 }}>
              {items.map((item, i) => {
                const Icon = item.icon;
                return (
                  <Pressable
                    key={item.id}
                    style={({ pressed }) => [
                      styles.tile,
                      tileRadius(i, items.length),
                      { backgroundColor: st.surface },
                      pressed && { backgroundColor: st.surfacePressed },
                    ]}
                  >
                    <Icon size={22} color={st.text} strokeWidth={1.75} />
                    <Text style={{ flex: 1, color: st.text, fontSize: 17, fontFamily: fonts.sans }}>{item.title}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}

          {/* Password & Security */}
          <View style={[styles.pwCard, { backgroundColor: st.surface }]}>
            <Pressable onPress={() => setPwOpen((o) => !o)} style={styles.tile} accessibilityRole="button">
              <Lock size={22} color={st.text} strokeWidth={1.75} />
              <Text style={{ flex: 1, color: st.text, fontSize: 17, fontFamily: fonts.sans }}>{t('settings.passwordSecurity')}</Text>
              <View style={{ transform: [{ rotate: pwOpen ? '180deg' : '0deg' }] }}>
                <ChevronDown size={18} color={st.muted} />
              </View>
            </Pressable>
            {pwOpen && (
              <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}>
                {pwField(pwCurrent, setPwCurrent, t('settings.currentPassword'), pwShow.current, () => setPwShow((p) => ({ ...p, current: !p.current })), 'cur')}
                {pwField(pwNew, setPwNew, t('settings.newPassword'), pwShow.new, () => setPwShow((p) => ({ ...p, new: !p.new })), 'new')}
                {pwField(pwConfirm, setPwConfirm, t('settings.confirmPassword'), pwShow.confirm, () => setPwShow((p) => ({ ...p, confirm: !p.confirm })), 'conf')}

                {pwMsg && (
                  <View style={[styles.msgBox, pwMsg === 'google'
                    ? { backgroundColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.25)' }
                    : { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)' }]}>
                    {pwMsg === 'google'
                      ? <CheckCircle2 size={16} color="#F59E0B" />
                      : <AlertTriangle size={16} color="#EF4444" />}
                    <Text style={{ color: pwMsg === 'google' ? '#F59E0B' : '#EF4444', fontSize: 13, flex: 1 }}>
                      {t(`settings.pwMsg.${pwMsg}`)}
                    </Text>
                  </View>
                )}

                <Pressable onPress={submitPassword} style={[styles.updateBtn, { backgroundColor: st.pillFill }]}>
                  <Text style={{ color: st.pillText, fontSize: 16, fontWeight: '500' }}>{t('settings.updatePassword')}</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* AI keys + Clear cache */}
          <View style={{ gap: 2 }}>
            <Pressable
              style={({ pressed }) => [
                styles.tile,
                { borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, backgroundColor: st.surface },
                pressed && { backgroundColor: st.surfacePressed },
              ]}
            >
              <Key size={22} color={st.text} strokeWidth={1.75} />
              <Text style={{ flex: 1, color: st.text, fontSize: 17, fontFamily: fonts.sans }}>{t('settings.aiKeys')}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.tile,
                { borderTopLeftRadius: 4, borderTopRightRadius: 4, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, backgroundColor: st.surface },
                pressed && { backgroundColor: st.surfacePressed },
              ]}
            >
              <Trash2 size={22} color="#EF4444" strokeWidth={1.75} />
              <Text style={{ flex: 1, color: '#EF4444', fontSize: 17, fontFamily: fonts.sans }}>{t('settings.clearCache')}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 60 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { flex: 1, fontSize: 20 },
  column: { gap: 12, maxWidth: 448, width: '100%', alignSelf: 'center' },
  accountCard: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 16 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  premiumPill: {
    height: 28, borderRadius: 14, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(245,158,11,0.35)',
  },
  manageBtn: { marginTop: 16, height: 44, borderRadius: 22, alignSelf: 'flex-start', paddingHorizontal: 20, justifyContent: 'center' },
  tile: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16 },
  pwCard: { borderRadius: 16, overflow: 'hidden' },
  pwFieldWrap: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingRight: 12, height: 46,
  },
  pwInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  msgBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 8 },
  updateBtn: { height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
