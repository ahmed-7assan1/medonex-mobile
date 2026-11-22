import React, { useState } from 'react';
import {
  View, Text, Pressable, TextInput, FlatList, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Sparkles, Send, Plus, Mic } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { FIXTURE_DRQ_MESSAGES, FIXTURE_DRQ_SUGGESTIONS } from '@/lib/fixtures';

/** /ai-chat — Dr Q tutor chat, pixel match of the site's dark futuristic
 *  DrQChat: #0d0d12 surface, cyan accents, light user bubbles rounded-28
 *  with a tight bottom-right corner, dark glass composer with sparkle. */
export default function AIChatScreen() {
  const { t } = useTranslation();
  const { fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [draft, setDraft] = useState('');

  const bg = '#0A0A0F';
  const surface = '#0D0D12';
  const line = 'rgba(255,255,255,0.10)';
  const cyan = '#22D3EE';

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: line }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={[styles.iconBtn, { borderColor: line }]}>
          <ArrowLeft size={18} color="rgba(255,255,255,0.75)" />
        </Pressable>
        <View style={styles.dqAvatar}>
          <Sparkles size={16} color="#0A0A0F" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontSize: 16, fontFamily: fonts.sansBold }}>{t('drq.title')}</Text>
          <Text style={{ color: cyan, fontSize: 11.5, fontFamily: fonts.sans }}>{t('drq.online')}</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          data={FIXTURE_DRQ_MESSAGES}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 14 }}
          renderItem={({ item: m }) =>
            m.role === 'user' ? (
              <View style={{ alignItems: 'flex-end' }}>
                <View style={styles.userBubble}>
                  <Text style={{ color: '#111', fontSize: 15, lineHeight: 22, fontFamily: fonts.sans }}>{m.text}</Text>
                </View>
                <Text style={styles.time}>{m.time}</Text>
              </View>
            ) : (
              <View style={{ alignItems: 'flex-start', maxWidth: '92%' }}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={[styles.dqAvatar, { width: 28, height: 28, borderRadius: 14, marginTop: 2 }]}>
                    <Sparkles size={13} color="#0A0A0F" />
                  </View>
                  <View style={[styles.aiBubble, { backgroundColor: surface, borderColor: line }]}>
                    <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 15, lineHeight: 23, fontFamily: fonts.sans }}>{m.text}</Text>
                  </View>
                </View>
                <Text style={[styles.time, { marginLeft: 38 }]}>{m.time}</Text>
              </View>
            )
          }
        />

        {/* Suggested prompts (only above the composer, like the site) */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {FIXTURE_DRQ_SUGGESTIONS.map((s) => (
            <Pressable key={s} accessibilityRole="button" style={[styles.chip, { borderColor: line, backgroundColor: 'rgba(255,255,255,0.05)' }]}>
              <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, fontFamily: fonts.sans }}>{s}</Text>
            </Pressable>
          ))}
        </View>

        {/* Composer */}
        <View style={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 12 }}>
          <View style={[styles.composer, { backgroundColor: surface + 'CC', borderColor: line }]}>
            <Pressable accessibilityRole="button" accessibilityLabel="Attach" style={styles.compIcon}>
              <Plus size={20} color="rgba(255,255,255,0.5)" />
            </Pressable>
            <Sparkles size={17} color={cyan} style={{ marginLeft: 2 }} />
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={t('drq.placeholder')}
              placeholderTextColor="rgba(255,255,255,0.35)"
              multiline
              style={{ flex: 1, color: '#fff', fontSize: 15, fontFamily: fonts.sans, paddingHorizontal: 10, maxHeight: 110 }}
            />
            <Pressable accessibilityRole="button" accessibilityLabel="Voice" style={styles.compIcon}>
              <Mic size={18} color="rgba(255,255,255,0.5)" />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={t('drq.send')} style={[styles.sendBtn, { backgroundColor: draft.trim() ? cyan : 'rgba(255,255,255,0.08)' }]}>
              <Send size={16} color={draft.trim() ? '#0A0A0F' : 'rgba(255,255,255,0.4)'} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  iconBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dqAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#22D3EE',
    alignItems: 'center', justifyContent: 'center',
  },
  userBubble: {
    maxWidth: '82%', backgroundColor: '#F7F7F7',
    borderRadius: 28, borderBottomRightRadius: 6,
    paddingHorizontal: 18, paddingVertical: 12,
  },
  aiBubble: { flexShrink: 1, borderRadius: 24, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12 },
  time: { color: 'rgba(255,255,255,0.3)', fontSize: 10.5, marginTop: 4 },
  chip: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  composer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 6,
    borderRadius: 28, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8, minHeight: 56,
  },
  compIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  sendBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
