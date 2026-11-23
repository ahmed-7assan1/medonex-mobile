import {useNativeAIChat} from '@/lib/use-native-ai-chat';
import {useLocalSearchParams} from 'expo-router';
import {useLecture} from '@/lib/lecture';
import {AIProviderKeys} from '@/components/settings/AIProviderKeys';
import{useStudentDimensions as useWindowDimensions}from'@/lib/student-viewport';
import React, { useState } from 'react';
import {
  View, Text, Pressable, TextInput, FlatList, StyleSheet, KeyboardAvoidingView, ScrollView,
  Platform, Alert, Linking, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Menu, Plus, Globe, Mic, ArrowUp, Sparkles, BookOpen, MessageSquareQuote, StickyNote, Brain, Zap,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { TABLET_BREAKPOINT } from '@/theme/tokens';
import {isFixtureMode} from '@/lib/fixtures';

/** /ai-chat — literal copy of the site's real AI chat page (MedOneXChat):
 *  light #FCFCFC surface, soft top/bottom fade gradients, floating round
 *  sidebar button, centered MedOneX mark on an empty chat, "What are we
 *  studying today?" motive with a blue sparkle, capsule composer
 *  (rounded-28, attach / web-search globe with emerald dot / mic / model
 *  pill / black send circle), suggested-prompt pills, user bubbles
 *  #EAF0FC rounded-3xl, AI replies flat. */

const BG = '#FCFCFC';
const CARD = '#FFFFFF';
const LINE = 'rgba(0,0,0,0.06)';
const BLUE = '#2563EB';

function renderRich(text: string, base: object, fonts: any) {
  // minimal bold renderer for fixture markdown (**…**)
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text style={base}>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**') ? (
          <Text key={i} style={{ fontFamily: fonts.sansBold }}>{p.slice(2, -2)}</Text>
        ) : (
          <Text key={i}>{p}</Text>
        ),
      )}
    </Text>
  );
}

export default function AIChatScreen() {
  const { t, i18n } = useTranslation();
  const { fonts } = useTheme();
  const {viewportWidth, width } = useWindowDimensions();
  const isTablet = viewportWidth >= TABLET_BREAKPOINT;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {lectureId}=useLocalSearchParams<{lectureId?:string}>();
  const lecture=useLecture(lectureId||'');
  const context=lectureId&&lecture.data?'Lecture: '+lecture.data.title+'\nNotes:\n'+(lecture.data.notesMarkdown||'No lecture notes available.') : '';
  const chat=useNativeAIChat(context,lectureId||'main');
  const {draft,setDraft,messages}=chat;
  const [settings,setSettings]=useState(false);
  const [webSearch, setWebSearch] = useState(true);

  const [sidebar,setSidebar]=useState(false);
  const ar=i18n.language==='ar';
  const openWebsite=()=>Linking.openURL('https://www.medonex.me/ai-chat');
  const unavailable=()=>Alert.alert(ar?'غير متاح':'Not supported',ar?'المرفقات والبحث والصوت مش متاحين في النسخة دي.':'Attachments, web search and voice are not supported in this native version.');
  const isEmpty=messages.length===0;

  const MOBILE_PROMPTS = [
    { icon: BookOpen, text: 'Help me summarize the lecture notes I provide' },
    { icon: MessageSquareQuote, text: 'Generate 3 MCQs on cardiology' },
    { icon: StickyNote, text: 'Explain diabetes pathophysiology simply' },
  ];
  const DESKTOP_PROMPTS = [
    { icon: BookOpen, label: 'Help me summarize my notes' },
    { icon: Brain, label: 'Quiz me' },
    { icon: MessageSquareQuote, label: 'Explain a concept' },
    { icon: Zap, label: 'Build a study plan' },
  ];

  const capsule = (
    <View style={[styles.capsule, { backgroundColor: CARD, borderColor: LINE }, isTablet && { maxWidth: 704, alignSelf: 'center', width: '100%' }]}>
      {/* Row 1: the text area on top (site: px-4 pt-[17px] pb-1.5, minHeight 54) */}
      <TextInput
        value={draft}
        onChangeText={setDraft}
        placeholder={t('drq.placeholder')}
        placeholderTextColor="rgba(0,0,0,0.35)"
        multiline
        style={{
          color: '#111', fontSize: 16, lineHeight: 22, fontFamily: fonts.sans,
          paddingHorizontal: 16, paddingTop: 17, paddingBottom: 6, minHeight: 54, maxHeight: 132,
        }}
      />
      {/* Row 2: [+] [model pill] … [mic/send] (site: flex gap-2 px-2 pb-2) */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, paddingBottom: 8 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Add to chat" onPress={unavailable} style={styles.roundIcon}>
          <Plus size={16} color="#111" />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={()=>setSettings(true)} style={styles.modelPill}>
          <Text numberOfLines={1} style={{ color: '#111', fontSize: 14, fontFamily: fonts.sans }}>AI settings</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          accessibilityRole="button" accessibilityLabel={chat.busy?'Stop AI request':t('drq.send')}
          style={styles.sendBtn} onPress={chat.busy?chat.cancel:()=>{if(!lectureId||lecture.data)void chat.send();else Alert.alert('Lecture AI','Wait for lecture notes to load.')}}
        >
          {chat.busy?<Text style={{color:'#fff'}}>■</Text>:<ArrowUp size={16} color="#fff" />}
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <Modal visible={sidebar} transparent animationType="fade" onRequestClose={()=>setSidebar(false)}><View style={{flex:1,backgroundColor:'rgba(0,0,0,.25)',flexDirection:'row'}}><Pressable accessibilityRole="button" accessibilityLabel="Close sidebar" style={StyleSheet.absoluteFill} onPress={()=>setSidebar(false)}/><View style={{width:290,backgroundColor:BG,padding:20,paddingTop:insets.top+20,gap:20}}><Text style={{fontSize:20,fontFamily:fonts.sansBold}}>MedOneX</Text><Pressable accessibilityRole="button" onPress={()=>{chat.clear();setSidebar(false)}}><Text style={{fontSize:16}}>{ar?'محادثة جديدة':'New chat'}</Text></Pressable><Text style={{fontSize:13,color:'#777'}}>{ar?'مفيش محادثات محفوظة على الجهاز ده. محادثات الموقع مش بتتزامن مع التطبيق في النسخة دي.':'No chats saved on this device. Website chats are not synced in this version.'}</Text><View style={{flex:1}}/><Pressable accessibilityRole="button" onPress={()=>{setSidebar(false);openWebsite()}}><Text style={{fontSize:15}}>{ar?'فتح المحادثات على الموقع':'Open chats on website'}</Text></Pressable><Pressable accessibilityRole="button" onPress={()=>{setSidebar(false);router.back()}}><Text style={{fontSize:15}}>{ar?'رجوع':'Back'}</Text></Pressable></View></View></Modal>
      <Modal visible={settings} animationType="slide" onRequestClose={()=>setSettings(false)}><View style={{flex:1,paddingTop:insets.top+12,backgroundColor:BG}}><Pressable accessibilityRole="button" onPress={()=>setSettings(false)} style={{padding:16}}><Text>Close AI settings</Text></Pressable><ScrollView contentContainerStyle={{padding:20,paddingBottom:insets.bottom+30}}><AIProviderKeys/></ScrollView></View></Modal>
      {/* Top fade (site: chat-top-fade-light) */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(252,252,252,0.92)', 'rgba(252,252,252,0.72)', 'rgba(252,252,252,0.32)', 'rgba(252,252,252,0)']}
        style={[styles.topFade, { height: 136 + insets.top }]}
      />
      {/* Floating sidebar button */}
      <Pressable
        accessibilityRole="button" accessibilityLabel="Open sidebar" onPress={() => setSidebar(true)}
        style={[styles.sidebarBtn, { top: insets.top + 16, backgroundColor: CARD, borderColor: LINE }]}
      >
        <Menu size={20} color="#111" />
      </Pressable>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {isEmpty ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 120 }}>
            <View style={styles.logoMark}>
              <Sparkles size={30} color={BLUE} />
            </View>
            {isTablet && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 24 }}>
                <Sparkles size={26} color={BLUE} />
                <Text style={{ color: '#111', fontSize: 28, fontFamily: fonts.sans, letterSpacing: -0.5 }}>{t('drq.motive')}</Text>
              </View>
            )}
          </View>
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{
              paddingHorizontal: isTablet ? 24 : 14,
              paddingTop: insets.top + 76,
              paddingBottom: 190,
              gap: 18,
              maxWidth: 768, width: '100%', alignSelf: 'center',
            }}
            renderItem={({ item: m }) =>
              m.role === 'user' ? (
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={styles.userBubble}>
                    <Text style={{ color: '#111827', fontSize: 15, lineHeight: 23, fontFamily: fonts.sans }}>{m.text}</Text>
                  </View>
                </View>
              ) : (
                <View style={{ alignItems: 'flex-start', paddingRight: 12 }}>
                  {renderRich(m.text, { color: '#1F2937', fontSize: 15, lineHeight: 25, fontFamily: fonts.sans }, fonts)}
                </View>
              )
            }
          />
        )}

        {/* Bottom fade (site: chat-bottom-fade-light, solid from bottom) */}
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(252,252,252,0)', 'rgba(252,252,252,0.54)', 'rgba(252,252,252,0.92)', 'rgba(252,252,252,1)']}
          style={styles.bottomFade}
        />

        {/* Composer block */}
        <View style={{ paddingHorizontal: isTablet ? 24 : 10, paddingBottom: insets.bottom + 14, gap: 10 }}>
          <Text style={{fontSize:11,color:'#666',fontFamily:fonts.sans,textAlign:'center'}}>{lectureId?(lecture.data?'Lecture AI: title + notes only. No PDF/video contents.':'Loading lecture notes...'):'Direct BYOK. This chat cannot read your lectures or website history.'} Your provider may charge. Chat is not saved after leaving.</Text>
          {!!chat.error&&<Text style={{color:'#b91c1c',fontSize:13}}>{chat.error}</Text>}
          {chat.busy&&<Text style={{color:'#666',fontSize:12}}>Waiting for your provider... Tap ■ to stop.</Text>}
          {!!chat.source&&<Text style={{color:'#666',fontSize:10}}>{chat.source}</Text>}
          {isEmpty && !isTablet && (
            <View style={{ gap: 6, alignSelf: 'center', width: '100%', maxWidth: 320 }}>
              {MOBILE_PROMPTS.map((p) => (
                <Pressable key={p.text} accessibilityRole="button" onPress={()=>setDraft(p.text)} style={styles.promptPill}>
                  <p.icon size={14} color="#111" />
                  <Text numberOfLines={1} style={{ flex: 1, color: '#374151', fontSize: 12, fontFamily: fonts.sans }}>{p.text}</Text>
                </Pressable>
              ))}
            </View>
          )}
          {capsule}
          {isEmpty && isTablet && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
              {DESKTOP_PROMPTS.map((p) => (
                <Pressable key={p.label} accessibilityRole="button" onPress={()=>setDraft(p.label)} style={styles.desktopPill}>
                  <p.icon size={14} color="#6B7280" />
                  <Text style={{ color: '#4B5563', fontSize: 13, fontFamily: fonts.sans }}>{p.label}</Text>
                </Pressable>
              ))}
            </View>
          )}
          <Text style={{ textAlign: 'center', color: 'rgba(0,0,0,0.35)', fontSize: 10, fontFamily: fonts.sans }}>{t('drq.disclaimer')}</Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5 },
  bottomFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 190 },
  sidebarBtn: {
    position: 'absolute', left: 16, zIndex: 10,
    width: 40, height: 40, borderRadius: 20, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  logoMark: {
    width: 76, height: 76, borderRadius: 22, backgroundColor: '#EAF0FC',
    alignItems: 'center', justifyContent: 'center',
  },
  userBubble: {
    maxWidth: '82%', backgroundColor: '#EAF0FC', borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  capsule: {
    borderRadius: 28, borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  modelPill: {
    height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', maxWidth: 190,
  },
  roundIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  emeraldDot: {
    position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#10B981', borderWidth: 1.5, borderColor: CARD,
  },
  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  promptPill: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F3F4F6', borderRadius: 20, minHeight: 40, paddingHorizontal: 14, paddingVertical: 10,
  },
  desktopPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 18, borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 14, paddingVertical: 8,
  },
});
