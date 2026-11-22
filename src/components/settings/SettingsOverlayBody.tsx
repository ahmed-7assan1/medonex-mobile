import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Switch, StyleSheet } from 'react-native';
import { Send, Check, Sun, Moon, MonitorSmartphone } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';

/** Fixture bodies for the settings overlays (site: overlays/*.tsx).
 *  Forms are visual only until the wiring phase. */
export function SettingsOverlayBody({ id }: { id: string }) {
  const { t } = useTranslation();
  const { colors, fonts, st } = useTheme();
  const [switches, setSwitches] = useState<Record<string, boolean>>({ ghost: false, contact: true, private: false, forum: true, broadcast: true, system: false });
  const [themeChoice, setThemeChoice] = useState<'light' | 'dark' | 'system'>('system');
  const [brand, setBrand] = useState('#4F46E5');

  const label = { color: st.muted, fontSize: 12, fontFamily: fonts.sansBold, letterSpacing: 0.8, textTransform: 'uppercase' as const, marginBottom: 6, marginTop: 14 };
  const input = {
    backgroundColor: st.bg, borderColor: st.border, borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, height: 46, color: st.text, fontSize: 15, fontFamily: fonts.sans,
  };
  const saveBtn = (
    <Pressable accessibilityRole="button" style={[styles.save, { backgroundColor: st.text }]}>
      <Text style={{ color: st.bg, fontSize: 14.5, fontFamily: fonts.sansBold }}>{t('settingsOverlay.save')}</Text>
    </Pressable>
  );
  const switchRow = (key: string, title: string, desc: string) => (
    <View key={key} style={[styles.switchRow, { backgroundColor: st.surface, borderColor: st.border }]}>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ color: st.text, fontSize: 15, fontFamily: fonts.sansBold }}>{title}</Text>
        <Text style={{ color: st.muted, fontSize: 12.5, fontFamily: fonts.sans, lineHeight: 17 }}>{desc}</Text>
      </View>
      <Switch value={!!switches[key]} onValueChange={(v) => setSwitches((s) => ({ ...s, [key]: v }))} trackColor={{ true: colors.primary }} />
    </View>
  );

  switch (id) {
    case 'identity':
      return (
        <View>
          <Text style={label}>{t('settingsOverlay.name')}</Text>
          <TextInput defaultValue="Ahmed Hassan" style={input} />
          <Text style={label}>{t('settingsOverlay.handle')}</Text>
          <TextInput defaultValue="@ahmed.hassan" style={input} autoCapitalize="none" />
          <Text style={label}>{t('settingsOverlay.bio')}</Text>
          <TextInput multiline defaultValue="Med student building the study tools I always wanted." style={[input, { height: 96, paddingTop: 12, textAlignVertical: 'top' }]} />
          {saveBtn}
        </View>
      );
    case 'branding': {
      const SWATCHES = ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
      return (
        <View>
          <Text style={label}>{t('settingsOverlay.avatarPreview')}</Text>
          <View style={{ alignItems: 'center', marginVertical: 12 }}>
            <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: brand + '22', borderWidth: 3, borderColor: brand, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: brand, fontSize: 34, fontFamily: fonts.sansBold }}>A</Text>
            </View>
          </View>
          <Text style={label}>{t('settingsOverlay.brandColor')}</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
            {SWATCHES.map((c) => (
              <Pressable key={c} accessibilityRole="button" accessibilityState={{ selected: brand === c }} onPress={() => setBrand(c)}
                style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: c, alignItems: 'center', justifyContent: 'center', borderWidth: brand === c ? 3 : 0, borderColor: st.text }}>
                {brand === c && <Check size={16} color="#fff" />}
              </Pressable>
            ))}
          </View>
          {saveBtn}
        </View>
      );
    }
    case 'academic':
      return (
        <View>
          {[
            [t('settingsOverlay.university'), 'Cairo University'],
            [t('settingsOverlay.faculty'), 'Faculty of Medicine'],
            [t('settingsOverlay.semester'), 'Semester 5'],
          ].map(([l, v]) => (
            <View key={l}>
              <Text style={label}>{l}</Text>
              <View style={[input, { justifyContent: 'center' }]}>
                <Text style={{ color: st.text, fontSize: 15, fontFamily: fonts.sans }}>{v}</Text>
              </View>
            </View>
          ))}
          {saveBtn}
        </View>
      );
    case 'telegram':
      return (
        <View>
          <View style={[styles.switchRow, { backgroundColor: st.surface, borderColor: st.border, flexDirection: 'column', alignItems: 'flex-start', gap: 10 }]}>
            <Send size={26} color="#38BDF8" />
            <Text style={{ color: st.text, fontSize: 16, fontFamily: fonts.sansBold }}>@MedOneX_bot</Text>
            <Text style={{ color: st.muted, fontSize: 13, lineHeight: 19, fontFamily: fonts.sans }}>{t('settingsOverlay.telegramDesc')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B' }} />
              <Text style={{ color: '#F59E0B', fontSize: 12, fontFamily: fonts.sansBold }}>{t('settingsOverlay.notLinked')}</Text>
            </View>
          </View>
          <Pressable accessibilityRole="button" style={[styles.save, { backgroundColor: '#38BDF8' }]}>
            <Text style={{ color: '#fff', fontSize: 14.5, fontFamily: fonts.sansBold }}>{t('settingsOverlay.connectTelegram')}</Text>
          </Pressable>
        </View>
      );
    case 'privacy':
      return (
        <View style={{ gap: 10 }}>
          {switchRow('ghost', t('settingsOverlay.ghost'), t('settingsOverlay.ghostDesc'))}
          {switchRow('contact', t('settingsOverlay.contact'), t('settingsOverlay.contactDesc'))}
          {switchRow('private', t('settingsOverlay.private'), t('settingsOverlay.privateDesc'))}
        </View>
      );
    case 'notifications':
      return (
        <View style={{ gap: 10 }}>
          {switchRow('forum', t('settingsOverlay.forum'), t('settingsOverlay.forumDesc'))}
          {switchRow('broadcast', t('settingsOverlay.broadcast'), t('settingsOverlay.broadcastDesc'))}
          {switchRow('system', t('settingsOverlay.system'), t('settingsOverlay.systemDesc'))}
        </View>
      );
    case 'appearance': {
      const opts = [
        { id: 'light' as const, icon: Sun, label: t('settingsOverlay.light') },
        { id: 'dark' as const, icon: Moon, label: t('settingsOverlay.dark') },
        { id: 'system' as const, icon: MonitorSmartphone, label: t('settingsOverlay.systemTheme') },
      ];
      return (
        <View style={{ gap: 10 }}>
          {opts.map((o) => (
            <Pressable key={o.id} accessibilityRole="button" accessibilityState={{ selected: themeChoice === o.id }} onPress={() => setThemeChoice(o.id)}
              style={[styles.switchRow, { backgroundColor: st.surface, borderColor: themeChoice === o.id ? colors.primary : st.border }, themeChoice === o.id && { borderWidth: 1.5 }]}>
              <o.icon size={18} color={themeChoice === o.id ? colors.primary : st.muted} />
              <Text style={{ flex: 1, color: st.text, fontSize: 15, fontFamily: themeChoice === o.id ? fonts.sansBold : fonts.sans }}>{o.label}</Text>
              {themeChoice === o.id && <Check size={17} color={colors.primary} />}
            </Pressable>
          ))}
        </View>
      );
    }
    case 'ai-keys':
      return (
        <View>
          {['Gemini', 'OpenAI', 'Groq'].map((p) => (
            <View key={p}>
              <Text style={label}>{p} API Key</Text>
              <TextInput placeholder={`${p} ••••••••••••`} placeholderTextColor={st.muted} style={input} autoCapitalize="none" />
            </View>
          ))}
          <Text style={{ color: st.muted, fontSize: 12, lineHeight: 17, fontFamily: fonts.sans, marginTop: 12 }}>{t('settingsOverlay.keysNote')}</Text>
          {saveBtn}
        </View>
      );
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  save: { height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, borderWidth: 1, padding: 14,
  },
});
