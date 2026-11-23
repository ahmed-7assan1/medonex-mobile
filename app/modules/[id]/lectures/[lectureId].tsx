import{useStudentDimensions as useWindowDimensions}from'@/lib/student-viewport';
import {LectureOscePractice} from '@/components/lecture/WebsiteLectureOsce';
import {useAuth} from '@/lib/auth';
import {lectureSignInReturn} from '@/lib/lecture-sign-in';
import {LectureScrollContext,LectureSticky,LectureStickyRegion} from '@/components/lecture/LectureSticky';
import{recordRevealY}from'@/lib/record-reveal';
import React, { useMemo, useState,useEffect,useRef } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, Linking, Share, Alert, Platform, Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft, ArrowUpRight, ChevronRight, Sparkles, Share2, PlayCircle,
  FolderArchive, Mic2, Brain, CheckCircle2, AlignLeft, ListChecks,
  FileText, Heart, MessageCircle, File as FileIcon,Download,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { FadeEdges } from '@/components/FadeEdges';
import { TABLET_BREAKPOINT, SCROLL_BOTTOM_PAD } from '@/theme/tokens';
import { useLecture } from '@/lib/lecture';
import {ResourceState} from '@/components/ResourceState';
import {isFixtureMode} from '@/lib/fixtures';
import {lectureSurface} from '@/lib/lecture-surface';
import {StudentOverlay} from '@/components/StudentOverlay';
import {lectureTitleCase} from '@/lib/lecture-format';
import {WebsiteMarkdown} from '@/components/WebsiteMarkdown';
import {LectureSwipePane} from '@/components/lecture/LectureSwipePane';
import {WebsiteLectureAnnotator} from '@/components/lecture/WebsiteLectureAnnotator';
import {LectureHubRecords} from '@/components/lecture/LectureHubRecords';
import {LectureHubMaterials} from '@/components/lecture/LectureHubMaterials';
import {LectureVideoSection} from '@/components/lecture/LectureVideoSection';
import {LectureFlashcardPractice} from '@/components/lecture/LectureFlashcardSection';
import {LectureQuestionPractice} from '@/components/lecture/LectureQuestionSection';
const articleStatus=require('../../../../assets/lecture-hub-source.json').articleStatus as string;

type TabId = 'overview' | 'videos' | 'materials' | 'recordings' | 'flashcards' | 'questions' | 'notes' | 'checklist';

/** Section accent identity from the site's LectureExperienceClient. */
const SECTION_BASE: Record<string, { icon: any; label: string; subtitle: string; goal: string; tint: string; fg: string }> = {
  videos: { icon: PlayCircle, label: 'Videos', subtitle: 'Watch & review the lecture', goal: 'Watch', tint: 'rgba(99,102,241,0.12)', fg: '#6366F1' },
  materials: { icon: FolderArchive, label: 'Materials', subtitle: 'PDFs, slides & downloads', goal: 'Download', tint: 'rgba(245,158,11,0.12)', fg: '#D97706' },
  recordings: { icon: Mic2, label: 'Recordings', subtitle: 'Audio & video revisions', goal: 'Listen', tint: 'rgba(244,63,94,0.12)', fg: '#F43F5E' },
  flashcards: { icon: Brain, label: 'Flashcards', subtitle: 'Memorize with smart cards', goal: 'Practice', tint: 'rgba(139,92,246,0.12)', fg: '#8B5CF6' },
  questions: { icon: CheckCircle2, label: 'Quiz', subtitle: 'Test yourself with MCQs', goal: 'Test', tint: 'rgba(16,185,129,0.12)', fg: '#10B981' },
  notes: { icon: AlignLeft, label: 'Notes', subtitle: 'Annotate & save your notes', goal: 'Write', tint: 'rgba(6,182,212,0.12)', fg: '#06B6D4' },
  checklist: { icon: ListChecks, label: 'Checklist', subtitle: 'Verify practical procedure steps', goal: 'Verify', tint: 'rgba(249,115,22,0.12)', fg: '#F97316' },
};
const START_PRIORITY: TabId[] = ['videos', 'flashcards', 'questions', 'materials', 'recordings', 'checklist', 'notes'];

/** Responsive lecture hub. The mobile index and desktop article status are distinct source layouts. */
export default function LectureScreen() {
  const { id:moduleId, lectureId, tab:initialTab,record:highlightRecord } = useLocalSearchParams<{ id: string; lectureId: string;tab?:string;record?:string }>();
  const { st:themeSt, colors, fonts: bundledFonts, isDark } = useTheme();
  const fonts={...bundledFonts,sans:Platform.OS==='android'?'sans-serif':'Arial',sansBold:Platform.OS==='android'?'sans-serif':'Arial'};
  const { t } = useTranslation();
  const accents:Record<string,[string,string,string]>={videos:['99,102,241','#4f46e5','#818cf8'],materials:['245,158,11','#d97706','#fbbf24'],recordings:['244,63,94','#e11d48','#fb7185'],flashcards:['139,92,246','#7c3aed','#a78bfa'],questions:['16,185,129','#059669','#34d399'],notes:['6,182,212','#0891b2','#22d3ee'],checklist:['249,115,22','#ea580c','#fb923c']};
  const SECTION_META=Object.fromEntries(Object.entries(SECTION_BASE).map(([id,meta])=>[id,{...meta,tint:`rgba(${accents[id][0]},0.1)`,ring:`rgba(${accents[id][0]},0.3)`,fg:accents[id][isDark?2:1]}]));
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {isGuest}=useAuth();
  const {viewportWidth, width } = useWindowDimensions();
  const isTablet = viewportWidth >= TABLET_BREAKPOINT;
  const st=lectureSurface(themeSt,isDark,viewportWidth<=768);

  const resource=useLecture(lectureId??'');
  const lecture=resource.data;
  const [active, updateActive] = useState<TabId>(initialTab&&Object.prototype.hasOwnProperty.call(SECTION_META,initialTab)?initialTab as TabId:'overview');
  useEffect(()=>{updateActive(initialTab&&Object.prototype.hasOwnProperty.call(SECTION_META,initialTab)?initialTab as TabId:'overview')},[initialTab,lectureId]);
  const setActive=(tab:TabId)=>{updateActive(tab);router.setParams({tab})};
  const [notesMode, setNotesMode] = useState<'cards' | 'annotator'>('cards');
  const [editorViewport,setEditorViewport]=useState(600),[editorOffset,setEditorOffset]=useState(0);
  const annotating=active==='notes'&&notesMode==='annotator';

  const [recordTarget,setRecordTarget]=useState<{lectureId:string;recordId:string;y:number;height:number}|null>(null);
  const revealedRecord=useRef('');
  const scrollY=useRef(new Animated.Value(0)).current,scrollContent=useRef<View>(null);
  const page=useRef<ScrollView>(null),tabStrip=useRef<ScrollView>(null),tabPositions=useRef<Record<string,{x:number;width:number}>>({});
  const scrollTab=(id:string)=>{const pos=tabPositions.current[id];if(pos)tabStrip.current?.scrollTo({x:Math.max(0,pos.x-(width-pos.width)/2),animated:true})};
  useEffect(()=>{scrollTab(active)},[active,width]);
  useEffect(()=>{page.current?.scrollTo({y:0,animated:false})},[active,lectureId]);
  useEffect(()=>{
    if(active!=='recordings'){revealedRecord.current='';return;}
    if(typeof highlightRecord!=='string'||!lecture||!recordTarget||recordTarget.lectureId!==lecture.id||recordTarget.recordId!==highlightRecord||!lecture.records.some(record=>record.id===highlightRecord))return;
    const key=JSON.stringify([lecture.id,highlightRecord]);if(revealedRecord.current===key)return;
    if(editorViewport<=0)return;
    // The source phone scroller includes the fixed header; center in that same viewport.
    const sourceHeader=isTablet?0:100+insets.top;
    const y=recordRevealY(editorOffset+sourceHeader,recordTarget.y,recordTarget.height,editorViewport+sourceHeader,isTablet?8:12);if(y===undefined)return;
    const timer=setTimeout(()=>{revealedRecord.current=key;page.current?.scrollTo({y,animated:true})},400);return()=>clearTimeout(timer);
  },[active,lectureId,highlightRecord,lecture?.id,lecture?.records,recordTarget,editorOffset,editorViewport,isTablet,insets.top]);
  if(!lecture)return <ResourceState error={resource.error} onRetry={()=>resource.refetch()} title={t('lecture.lecture')}/>;
  if(!lecture.subject||lecture.subject.module.id!==moduleId)return <ResourceState title="Lecture" notFound onRetry={()=>resource.refetch()}/>;
  const title=lectureTitleCase(lecture.title),arabicTitle=/[\u0600-\u06ff\u0750-\u077f]/.test(title);
  const share=()=>{if(!isFixtureMode())void Share.share({message:`${lecture.title}\nhttps://www.medonex.me/modules/${moduleId}/lectures/${lecture.id}`}).catch(()=>Alert.alert('Share unavailable','The share sheet could not open.'));else Alert.alert('Guest preview','This sample cannot be shared.')};
  const openSignIn=()=>router.push({pathname:'/(auth)/login',params:{upgrade:'1',next:lectureSignInReturn(`/modules/${moduleId}/lectures/${lecture.id}`)}});
  const ai=()=>isGuest?Alert.alert('Sign in to use lecture AI','Continue with your account to use lecture AI.',[{text:'Cancel',style:'cancel'},{text:'Sign in',onPress:openSignIn}]):router.push({pathname:'/ai-chat',params:{lectureId:lecture.id}});
  const counts: Record<TabId, number | undefined> = {
    overview: undefined,
    videos: lecture.videos.length,
    materials: lecture.files.length,
    recordings: lecture.records.length,
    flashcards: lecture.flashcards.length,
    questions: lecture.questionCount,
    notes: undefined,
    checklist: lecture.checklist?.items.length,
  };
  const tabs:TabId[]=['videos','materials','recordings','flashcards','questions',...(lecture.checklist?['checklist' as TabId]:[]),'notes'];
  const totalItems = tabs.reduce((sum, id) => sum + (counts[id] ?? 0), 0);

  const startSection = START_PRIORITY
    .map((id) => tabs.includes(id) ? id : null)
    .find((id): id is TabId => !!id && (counts[id] ?? 0) > 0) ?? null;
  const gridSections = tabs.filter((id) => id !== startSection);
  const lastIsWide = gridSections.length % 2 === 1;

  const kindLabel = lecture.type === 'PRACTICAL' ? 'Practical lecture' : 'Lecture';

  const emptyPane = (icon: any, title: string, desc: string, fg: string) => {
    const Icon = icon;
    return (
      <View style={[styles.emptyCard, { backgroundColor: colors.card+'66', borderColor: colors.border }]}>
        <View style={[styles.emptyIcon, { backgroundColor: st.surfacePressed }]}>
          <Icon size={28} color={fg} />
        </View>
        <Text style={{ color: st.text, fontSize: 15, lineHeight:18.75, fontWeight: '600', fontFamily: fonts.sansBold }}>{title}</Text>
        <Text style={{ color: st.muted, fontSize: 14, lineHeight:20, marginTop: 8, maxWidth:320, textAlign: 'center' }}>{desc}</Text>
      </View>
    );
  };

  const ctaPill = (goal: string, fg: string) => (
    <View style={[styles.goalPill, { backgroundColor: fg }]}>
      <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '600' }}>{goal}</Text>
      <ArrowUpRight size={14} color="#FFF" strokeWidth={2.25} />
    </View>
  );

  const overviewPane = (
    <View testID="lecture-hub-overview" style={{maxWidth:768,width:'100%',alignSelf:'center'}}>
      {/* Title block */}
      <View style={{ paddingHorizontal: 4, paddingBottom: 20, paddingTop: 4 }}>
        <Text style={{ color: st.muted, fontSize: 11, lineHeight:11, fontWeight: '600', letterSpacing: 1.1, textTransform: 'uppercase' }}>{kindLabel}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginTop: 8 }}>
          <Text style={{ flex: 1, color: st.text, fontSize: 24, lineHeight: 31.2, fontWeight:'700',fontFamily:arabicTitle?bundledFonts.arabicBold:fonts.sansBold,writingDirection:arabicTitle?'rtl':'ltr',textAlign:arabicTitle?'right':'left',...(Platform.OS==='web'?{textWrap:'balance'} as any:{}) }}>{title}</Text>
          <Pressable accessibilityRole="button" style={[styles.shareBtn, { backgroundColor: st.surface, borderColor: st.border }]} onPress={share} accessibilityLabel={t('lecture.share')}>
            <Share2 size={16} color={st.text} />
          </Pressable>
        </View>
        <Text style={{ color: st.muted, fontSize: 13, lineHeight:13, marginTop: 8 }}>
          {tabs.length} sections{totalItems > 0 ? ` · ${totalItems} items` : ''}
        </Text>
      </View>

      {/* Start here */}
      {startSection && (
        <Pressable accessibilityRole="button"
          onPress={() => setActive(startSection)}
          style={({ pressed }) => [
            styles.startCard,
            { backgroundColor: st.surface, borderColor: st.border,boxShadow:`0 0 0 1px ${st.border}` },
            pressed && { backgroundColor: st.surfacePressed, transform: [{ scale: 0.985 }] },
          ]}
        >
          <View style={[styles.startChip, { backgroundColor: SECTION_META[startSection].tint, borderColor: SECTION_META[startSection].ring,boxShadow:`0 0 0 1px ${SECTION_META[startSection].ring}` }]}>
            {React.createElement(SECTION_META[startSection].icon, { size: 24, color: SECTION_META[startSection].fg, strokeWidth: 1.75 })}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: st.muted, fontSize: 11, lineHeight:11, fontWeight: '600', letterSpacing: 1.1, textTransform: 'uppercase' }}>Start here</Text>
            <Text numberOfLines={1} style={{ color: st.text, fontSize: 17, lineHeight:21.25, fontWeight: '600', marginTop: 6, fontFamily: fonts.sansBold }}>
              {SECTION_META[startSection].label}
            </Text>
            <Text numberOfLines={1} style={{ color: st.muted, fontSize: 13, lineHeight:16.25, marginTop: 4 }}>
              {counts[startSection]} {counts[startSection]===1?'item':'items'} · {SECTION_META[startSection].subtitle}
            </Text>
          </View>
          {ctaPill(SECTION_META[startSection].goal, '#2f80ed')}
        </Pressable>
      )}

      {/* Tile grid */}
      <View style={styles.tileGrid}>
        {gridSections.map((id, index) => {
          const meta = SECTION_META[id];
          const count = counts[id];
          const empty = count !== undefined && count === 0;
          const wide = lastIsWide && index === gridSections.length - 1;
          const Icon = meta.icon;
          return (
            <Pressable accessibilityRole="button"
              key={id}
              onPress={() => setActive(id)}
              style={({ pressed }) => [
                styles.tile,
                { backgroundColor: st.surface, borderColor: st.border,boxShadow:`0 0 0 1px ${st.border}` },
                wide && styles.tileWide,
                empty && { opacity: 0.55 },
                pressed && { backgroundColor: st.surfacePressed, transform: [{ scale: 0.97 }] },
              ]}
            >
              {wide ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                  <View style={[styles.tileChip, { backgroundColor: meta.tint, borderColor: meta.ring,boxShadow:`0 0 0 1px ${meta.ring}` }]}>
                    <Icon size={18} color={meta.fg} strokeWidth={1.85} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ color: st.text, fontSize: 15, lineHeight:18.75, fontWeight: '600', fontFamily: fonts.sansBold }}>{meta.label}</Text>
                    <Text numberOfLines={2} style={{ color: st.muted, fontSize: 12, marginTop: 4, lineHeight: 16.8 }}>{meta.subtitle}</Text>
                  </View>
                  {count !== undefined && (
                    <Text style={{ color: st.muted, fontSize: 13, fontWeight: '500', fontVariant: ['tabular-nums'] }}>
                      {empty ? 'Empty' : count}
                    </Text>
                  )}
                  <ChevronRight size={18} color={st.muted} />
                </View>
              ) : (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <View style={[styles.tileChip, { backgroundColor: meta.tint, borderColor: meta.ring,boxShadow:`0 0 0 1px ${meta.ring}` }]}>
                      <Icon size={18} color={meta.fg} strokeWidth={1.85} />
                    </View>
                    {count !== undefined && (
                      <Text style={{ color: st.muted, fontSize: 13, fontWeight: '500', fontVariant: ['tabular-nums'] }}>
                        {empty ? 'Empty' : count}
                      </Text>
                    )}
                  </View>
                  <View style={{ marginTop: 12 }}>
                    <Text numberOfLines={1} style={{ color: st.text, fontSize: 15, lineHeight:18.75, fontWeight: '600', fontFamily: fonts.sansBold }}>{meta.label}</Text>
                    <Text numberOfLines={2} style={{ color: st.muted, fontSize: 12, marginTop: 4, lineHeight: 16.8 }}>{meta.subtitle}</Text>
                  </View>
                </>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const desktopIcon={width:36,height:36,borderRadius:18,backgroundColor:colors.card+'99',borderWidth:1,borderColor:colors.border+'4D',alignItems:'center' as const,justifyContent:'center' as const};
  const tabAccents:Record<string,string>={videos:'#818cf8cc',materials:'#fbbf24cc',recordings:'#fb7185cc',flashcards:'#a78bfacc',questions:'#34d399cc',notes:'#22d3eecc',checklist:'#fb923ccc'};
  const notesSwitch=<View style={{flexDirection:'row',gap:4,padding:2,borderRadius:99,backgroundColor:st.surfacePressed}}>{(['cards','annotator'] as const).map(mode=><Pressable key={mode} accessibilityRole="button" accessibilityState={{selected:notesMode===mode}} onPress={()=>setNotesMode(mode)} style={{paddingHorizontal:12,paddingVertical:6,borderRadius:99,backgroundColor:notesMode===mode?st.surface:'transparent'}}><Text style={{fontFamily:fonts.sans,fontSize:12,fontWeight:'500',lineHeight:16,color:notesMode===mode?st.text:st.muted}}>{mode==='cards'?'Cards':'Annotator'}</Text></Pressable>)}</View>;

  const listPane = (id: TabId) => {
    const meta = SECTION_META[id];
    switch (id) {
      case 'videos':
        return <LectureVideoSection variant="youtube" embedded/>;
      case 'materials':
        return lecture.files.length?<LectureHubMaterials key={lecture.id} files={lecture.files} moduleId={moduleId} lectureId={lecture.id}/>:emptyPane(meta.icon,'No Materials Yet',"Downloadable files and PDFs for this lecture haven't been uploaded yet.",meta.fg);
      case 'recordings':
        return lecture.records.length?<LectureHubRecords records={lecture.records} moduleId={moduleId} lectureId={lecture.id} highlighted={highlightRecord} onHighlightedLayout={(recordId,layout)=>setRecordTarget(previous=>previous?.lectureId===lecture.id&&previous.recordId===recordId&&previous.y===layout.y&&previous.height===layout.height?previous:{lectureId:lecture.id,recordId,y:layout.y,height:layout.height})}/>:emptyPane(meta.icon,'No Recordings Yet',"Audio and video recordings for this lecture haven't been uploaded yet. Check back soon.",meta.fg);
      case 'flashcards':
        return lecture.flashcards.length?<LectureFlashcardPractice key={lecture.id} cards={lecture.flashcards} standalone={false} obsidian renderPage={(content,nav,header)=><View style={{gap:24,minHeight:400}}>{header}{content}{nav&&<StudentOverlay>{nav}</StudentOverlay>}</View>}/>:emptyPane(meta.icon,'No Flashcards Yet',"Flashcards for this lecture haven't been created yet.",meta.fg);
      case 'questions':
        return lecture.questionCount?(lecture.type==='PRACTICAL'?<LectureOscePractice key={lecture.id} lectureId={lecture.id}/>:<LectureQuestionPractice key={lecture.id} lectureId={lecture.id} hub renderPage={(content,nav,header)=><LectureStickyRegion style={{minHeight:400}}><LectureSticky testID="lecture-question-sticky" top={isTablet?8:0} fadeColor={viewportWidth<=768?st.bg:undefined}>{header}</LectureSticky>{content}{nav&&<StudentOverlay>{nav}</StudentOverlay>}</LectureStickyRegion>}/>):emptyPane(meta.icon,'No Quiz Items Yet','MCQ questions for this lecture will appear here once added.',meta.fg);
      case 'notes':
        return notesMode==='annotator'?<WebsiteLectureAnnotator lectureId={lecture.id} markdown={lecture.notesMarkdown} height={Math.max(300,editorViewport-editorOffset)}/>:<View style={{paddingTop:16,gap:12}}>{lecture.noteCardsMarkdown===undefined?<Text style={{color:st.muted,fontSize:14,lineHeight:22}}>Note cards are unavailable from the current mobile data connection.</Text>:<WebsiteMarkdown mode="cards" markdown={lecture.noteCardsMarkdown}/>}</View>;
      case 'checklist':
        return !lecture.checklist ? null : (
          <View style={{ gap: 16,maxWidth:768,width:'100%',alignSelf:'center' }}>
            {lecture.checklist.items.map((item, i) => (
              <View key={item.id} style={[styles.checkItem, { backgroundColor: colors.background, borderColor: colors.border+'99' }]}>
                <View style={[styles.checkNum, { borderColor: st.border }]}>
                  <Text style={{ color: st.muted, fontSize: 10, fontWeight: '800' }}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.cardForeground+'CC', fontSize: 14, lineHeight:viewportWidth<=768?21.7:20, fontWeight: '700', fontFamily: fonts.sans }}>{item.content}</Text>
                  {item.isCritical && (
                    <View style={styles.criticalPill}>
                      <Text style={{ color: '#EF4444', fontSize: 8,lineHeight:13.2, fontWeight: '900', letterSpacing: .8, textTransform: 'uppercase' }}>Critical Step</Text>
                    </View>
                  )}
                </View>
                <View style={[styles.ptsChip, { backgroundColor: colors.card+'99', borderColor: colors.border+'4D' }]}>
                  <Text style={{ color: colors.mutedForeground, fontSize: 10,lineHeight:16.5, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' }}>+{item.points} pts</Text>
                </View>
              </View>
            ))}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.root,{backgroundColor:viewportWidth<=768?st.bg:colors.background}]}>
      {!isTablet&&<View style={{paddingTop:insets.top,zIndex:6}}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" onPress={()=>active==='overview'?(router.canGoBack()?router.back():router.replace(`/modules/${moduleId}` as never)):setActive('overview')} style={styles.iconBtn} accessibilityLabel={active==='overview'?'Back to Lectures':'Back to Overview'}><ArrowLeft size={19} color={st.text} strokeWidth={1.75}/></Pressable>
          <Text numberOfLines={1} style={[styles.topTitle,{color:st.text,fontFamily:fonts.sans,lineHeight:18.75,letterSpacing:0}]}>{title}</Text>
          {isGuest?<View testID="lecture-guest-controls" style={{flexDirection:'row',alignItems:'center',gap:8}}><Pressable accessibilityRole="button" accessibilityLabel="Lecture AI, sign in to use" onPress={ai} style={({pressed})=>({width:28,height:28,borderRadius:14,backgroundColor:st.text,alignItems:'center',justifyContent:'center',opacity:pressed ? 0.75 : 1})}><Sparkles size={14} color={st.bg} strokeWidth={2}/></Pressable><Pressable accessibilityRole="link" accessibilityLabel="Sign in" onPress={openSignIn} style={({pressed})=>({height:30,borderRadius:15,paddingHorizontal:14,backgroundColor:pressed?'#1d4ed8':'#2f80ed',justifyContent:'center',alignItems:'center'})}><Text style={{fontFamily:fonts.sans,fontSize:13,lineHeight:13,fontWeight:'600',color:'#fff'}}>Sign in</Text></Pressable></View>:<Pressable accessibilityRole="button" onPress={ai} style={styles.iconBtn} accessibilityLabel="Lecture AI"><Sparkles size={19} color={st.text} strokeWidth={1.75}/></Pressable>}
        </View>
        <ScrollView ref={tabStrip} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:12,gap:4}} style={{flexGrow:0,height:44}} accessibilityLabel="Lecture sections">
          {(['overview',...tabs] as TabId[]).map(id=><Pressable accessibilityRole="tab" accessibilityState={{selected:active===id}} key={id} onLayout={event=>{tabPositions.current[id]=event.nativeEvent.layout;if(id===active)scrollTab(id)}} onPress={()=>setActive(id)} style={styles.tabBtn}><Text style={{color:active===id?st.text:st.muted,fontFamily:fonts.sans,fontSize:13,fontWeight:'500',lineHeight:21.45,letterSpacing:viewportWidth<=768?0:-.15}}>{id==='overview'?'Overview':SECTION_META[id].label}</Text>{active===id&&<View style={[styles.tabUnderline,{backgroundColor:st.text}]}/>}</Pressable>)}
        </ScrollView>
        {active==='notes'&&<View style={{height:44,paddingHorizontal:16,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8}}><View style={{flexDirection:'row',alignItems:'center',gap:6}}><AlignLeft size={16} color={st.text}/><Text style={{fontFamily:fonts.sans,color:st.text,fontSize:13,fontWeight:'500'}}>Notes</Text></View>{notesSwitch}</View>}
      </View>}
      <LectureScrollContext.Provider value={{scrollY,contentRef:scrollContent,revision:`${width}:${editorOffset}:${active}`}}><Animated.ScrollView ref={page} testID="lecture-hub-scroll" onScroll={Animated.event([{nativeEvent:{contentOffset:{y:scrollY}}}],{useNativeDriver:Platform.OS!=='web'})} scrollEventThrottle={16} onLayout={event=>setEditorViewport(event.nativeEvent.layout.height)} scrollEnabled={!annotating} showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom:annotating?0:insets.bottom+SCROLL_BOTTOM_PAD,width:'100%'}}><View ref={scrollContent} collapsable={false} style={{paddingTop:isTablet?8:0}}>
        {isTablet&&<View style={{maxWidth:1440,width:'100%',alignSelf:'center',paddingHorizontal:viewportWidth>=1024?24:16,paddingTop:12,paddingBottom:4}}><View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:16}}><View style={{flexDirection:'row',alignItems:'center',gap:12,flex:1,minWidth:0}}><Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={()=>router.canGoBack()?router.back():router.replace(`/modules/${moduleId}` as never)} style={desktopIcon}><ArrowLeft size={16} color={colors.foreground+'BF'}/></Pressable><Text numberOfLines={1} style={{flexShrink:1,fontFamily:fonts.sans,fontSize:viewportWidth===768?20:24,fontWeight:'900',lineHeight:viewportWidth===768?27:32,letterSpacing:viewportWidth===768?-.5:-.6,color:colors.foreground}}>{title}</Text>{active==='overview'&&<Pressable accessibilityRole="button" accessibilityLabel="Share lecture" onPress={share} style={desktopIcon}><Share2 size={16} color={colors.foreground+'BF'}/></Pressable>}</View><Pressable accessibilityRole="button" accessibilityLabel="Open lecture AI chat" onPress={ai} style={desktopIcon}><Sparkles size={16} color={colors.primary}/></Pressable></View></View>}
        {isTablet&&<View style={{maxWidth:1440,width:'100%',alignSelf:'center',paddingHorizontal:viewportWidth>=1024?24:16,marginVertical:12}}><ScrollView horizontal showsHorizontalScrollIndicator={false} style={{maxWidth:960,width:'100%',alignSelf:'center',borderBottomWidth:1,borderBottomColor:colors.border+'80'}} contentContainerStyle={{paddingHorizontal:4,justifyContent:viewportWidth>=1280?'center':'flex-start',flexGrow:1}} accessibilityLabel="Lecture sections">{(['overview',...tabs] as TabId[]).map(id=><Pressable accessibilityRole="tab" accessibilityState={{selected:active===id}} key={id} onPress={()=>setActive(id)} style={[styles.tabBtn,{paddingHorizontal:viewportWidth>=1024?16:12}]}><Text style={{color:active===id?colors.foreground:colors.mutedForeground,fontFamily:fonts.sans,fontSize:13,fontWeight:'500',lineHeight:21.45,letterSpacing:viewportWidth<=768?0:-.15}}>{id==='overview'?'Overview':SECTION_META[id].label}{id!=='overview'&&(counts[id]??0)>0?` (${counts[id]})`:''}</Text>{active===id&&<View style={[styles.tabUnderline,{left:viewportWidth>=1024?16:12,right:viewportWidth>=1024?16:12,bottom:-1,backgroundColor:id==='overview'?colors.primary:tabAccents[id]}]}/>}</Pressable>)}</ScrollView></View>}
        <View onLayout={event=>setEditorOffset(event.nativeEvent.layout.y)}><LectureSwipePane active={active} tabs={['overview',...tabs]} width={width} disabled={annotating} onChange={id=>setActive(id as TabId)}><View style={{width:'100%',maxWidth:annotating?undefined:1440,alignSelf:'center',paddingHorizontal:annotating?0:isTablet?(viewportWidth>=1024?24:16):12,paddingTop:annotating?0:isTablet?8:active==='notes'?24:12,paddingBottom:annotating?0:isTablet?16:40}}>
          {active==='overview'?(isTablet?<View accessibilityRole="summary" testID="lecture-article-status" style={{width:'100%',maxWidth:1024,alignSelf:'center',borderRadius:12,borderWidth:1,borderColor:colors.border+'99',backgroundColor:colors.card+'66',padding:20}}><Text style={{fontFamily:fonts.sans,fontSize:14,lineHeight:20,color:colors.mutedForeground,letterSpacing:-.15,textAlign:'left',writingDirection:'ltr'}}>{articleStatus}</Text></View>:overviewPane):<>{listPane(active)}</>}
        </View></LectureSwipePane></View>
      </View></Animated.ScrollView></LectureScrollContext.Provider>
      {!annotating&&<FadeEdges top={false} color={viewportWidth<=768?st.bg:colors.background}/>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 56, paddingHorizontal: 16 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  topTitle: { flex: 1, fontSize: 15, fontWeight: '600' },
  tabBtn: { height: 44, justifyContent: 'center', paddingHorizontal: 12, position: 'relative' },
  tabUnderline: { position: 'absolute', left: 12, right: 12, bottom: 0, height: 2, borderRadius: 1 },
  shareBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  startCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 20,
    borderWidth: 0, padding: 16, marginBottom: 12,
  },
  startChip: { width: 48, height: 48, borderRadius: 14, borderWidth: 0, alignItems: 'center', justifyContent: 'center' },
  goalPill: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 36, borderRadius: 18, paddingHorizontal: 14 },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    width: '47%', flexGrow: 1, minHeight: 116, justifyContent: 'space-between',
    borderRadius: 16, borderWidth: 0, padding: 14,
  },
  tileWide: { width: '100%', minHeight: 80, justifyContent: 'center' },
  tileChip: { width: 36, height: 36, borderRadius: 12, borderWidth: 0, alignItems: 'center', justifyContent: 'center' },
  emptyCard: {
    borderRadius: 24, borderWidth: 1,borderStyle:'dashed', alignItems: 'center',
    paddingVertical: 96, paddingHorizontal: 24,
  },
  emptyIcon: { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  mediaCard: { flexDirection: 'row', gap: 14, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 12, alignItems: 'center' },
  thumb: { width: 96, height: 64, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  insetCard: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  insetRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 12 },
  rowIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  notesSwitch: { flexDirection: 'row', borderRadius: 999, padding: 2, gap: 2 },
  notesSwitchBtn: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  notesCard: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 18 },
  checkItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, borderRadius: 16, borderWidth: 1, padding: 20 },
  checkNum: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  criticalPill: {
    alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999,
    backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(239,68,68,0.25)',
  },
  ptsChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth },
});
