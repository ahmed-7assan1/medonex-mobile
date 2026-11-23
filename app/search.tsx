import{useStudentDimensions as useWindowDimensions}from'@/lib/student-viewport';
import React,{useMemo,useState} from 'react';
import {View,Text,TextInput,Pressable,ScrollView,} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useRouter,useLocalSearchParams} from 'expo-router';
import {useTranslation} from 'react-i18next';
import {ArrowLeft,Search,X,BookOpen,GraduationCap,Users,Sparkles,ChevronRight} from 'lucide-react-native';
import {useTheme} from '@/theme/ThemeContext';
import {useSearch} from '@/lib/search';
import {isFixtureMode} from '@/lib/fixtures';
import {FadeEdges} from '@/components/FadeEdges';
import {FIXTURE_CATALOG,FIXTURE_MODULE_BUNDLE,FIXTURE_PAST_PAPERS,FIXTURE_PROFILE_USERS} from '@/lib/fixtures';

type Result={id:string;label:string;sub:string;href:string;type:string};
export default function SearchScreen(){
 const {st,fonts}=useTheme();const {i18n}=useTranslation();const ar=i18n.language==='ar';const router=useRouter();const params=useLocalSearchParams<{q?:string}>();const [query,setQuery]=useState(params.q||'');const insets=useSafeAreaInsets();const {viewportWidth,width}=useWindowDimensions();
 const results=useSearch(query);
 const sections=useMemo(()=>{
  if(!isFixtureMode())return results.data??[];
  const module=FIXTURE_MODULE_BUNDLE.module;
  const all:Result[]=[...module.subjects.flatMap(s=>s.lectures.map(l=>({id:l.id,label:l.title,sub:`${s.name} · ${module.name}`,href:`/modules/${module.id}/lectures/${l.id}`,type:'lectures'}))),...FIXTURE_PAST_PAPERS.cards.map(p=>({id:p.id,label:p.title,sub:p.moduleName,href:`/quiz/${p.id}`,type:'quizzes'})),...FIXTURE_CATALOG.view.sortedByLectures.map(m=>({id:m.id,label:m.name,sub:`${m.lecturesCount} ${ar?'محاضرة':'lectures'}`,href:`/modules/${m.id}`,type:'modules'})),...Object.values(FIXTURE_PROFILE_USERS).map(u=>({id:u.id,label:u.name,sub:`@${u.handle}`,href:`/profile/${u.id}`,type:'users'}))];
  const q=query.trim().toLowerCase();return q.length<2?[]:all.filter(x=>`${x.label} ${x.sub}`.toLowerCase().includes(q));
 },[query,ar,results.data]);
 const config=[{key:'lectures',title:ar?'المحاضرات الأكاديمية':'Academic Lectures',icon:BookOpen},{key:'quizzes',title:ar?'الاختبارات':'Assessment Quizzes',icon:Sparkles},{key:'modules',title:ar?'الموديولات':'Knowledge Modules',icon:GraduationCap},{key:'users',title:ar?'الزملاء':'Clinical Peers',icon:Users}];
 return <View style={{flex:1,backgroundColor:st.bg,paddingTop:insets.top}}>
  <View style={{paddingHorizontal:16,paddingTop:12,paddingBottom:8,borderBottomWidth:1,borderColor:st.border,flexDirection:ar?'row-reverse':'row',alignItems:'center',gap:8}}>
   <Pressable accessibilityRole="button" accessibilityLabel={ar?'إغلاق البحث':'Close search'} onPress={()=>router.canGoBack()?router.back():router.replace('/modules')} style={{width:36,height:36,borderRadius:18,borderWidth:1,borderColor:st.border,alignItems:'center',justifyContent:'center'}}><ArrowLeft size={16} color={st.muted}/></Pressable>
   <View style={{height:44,borderRadius:22,borderWidth:1,borderColor:st.border,backgroundColor:st.surface,paddingHorizontal:12,flex:1,flexDirection:ar?'row-reverse':'row',alignItems:'center',gap:8}}><Search size={16} color={st.muted}/><TextInput autoFocus accessibilityLabel={ar?'بحث':'Search'} value={query} onChangeText={setQuery} returnKeyType="search" placeholder={ar?'ابحث عن منشورات ومحاضرات وفيديوهات...':'Search posts, lectures, videos...'} placeholderTextColor={st.muted} style={{flex:1,minWidth:0,height:42,color:st.text,fontSize:14,textAlign:ar?'right':'left'}}/>{!!query&&<Pressable accessibilityRole="button" accessibilityLabel={ar?'مسح البحث':'Clear search'} onPress={()=>setQuery('')} style={{width:28,height:36,alignItems:'center',justifyContent:'center'}}><X size={16} color={st.muted}/></Pressable>}</View>
  </View>
  <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingHorizontal:16,paddingTop:16,paddingBottom:insets.bottom+170,width:'100%',maxWidth:672,alignSelf:'center'}}>
   {!isFixtureMode()&&query.trim().length>=2&&(results.isLoading||results.isError)?<View style={{paddingVertical:80,alignItems:'center',gap:12}}><Text style={{color:st.muted,fontSize:14}}>{results.isError?(ar?'تعذر تحميل نتائج البحث':'Could not load search results'):(ar?'جاري البحث...':'Searching...')}</Text>{results.isError&&<Pressable accessibilityRole="button" onPress={()=>results.refetch()}><Text style={{color:st.text}}>{ar?'حاول تاني':'Try again'}</Text></Pressable>}</View>:query.trim().length<2?<View style={{paddingVertical:80,alignItems:'center'}}><Search size={40} color={st.muted}/><Text style={{fontSize:14,color:st.muted,marginTop:16,textAlign:'center'}}>{ar?'اكتب للبحث عن المحاضرات والاختبارات والموديولات والزملاء':'Type to search lectures, quizzes, modules, and peers'}</Text></View>:sections.length===0?<View style={{paddingVertical:80,alignItems:'center'}}><X size={40} color={st.muted}/><Text style={{fontSize:14,color:st.text,marginTop:16}}>{ar?`مفيش نتائج لـ "${query}"`:`No results for "${query}"`}</Text><Text style={{fontSize:14,color:st.muted,marginTop:4}}>{ar?'جرّب كلمة تانية':'Try a different search term'}</Text></View>:<>
    <Text style={{color:st.muted,fontSize:12,marginBottom:16}}>{sections.length} {ar?'نتيجة':sections.length===1?'result':'results'}</Text>
    {config.map(c=>{const items=sections.filter(x=>x.type===c.key);if(!items.length)return null;return <View key={c.key} style={{marginBottom:20}}><View style={{flexDirection:ar?'row-reverse':'row',gap:8,alignItems:'center',marginBottom:8}}><c.icon size={16} color={st.muted}/><Text style={{fontSize:12,color:st.muted,fontFamily:fonts.sansSemiBold,flex:1}}>{c.title}</Text><Text style={{fontSize:12,color:st.muted}}>{items.length}</Text></View>
     {items.map(item=><Pressable accessibilityRole="button" key={item.id} onPress={()=>router.replace(item.href as never)} style={{flexDirection:ar?'row-reverse':'row',alignItems:'center',gap:12,borderRadius:12,borderWidth:1,borderColor:st.border,backgroundColor:st.surface,paddingHorizontal:14,paddingVertical:12,marginBottom:4}}><View style={{width:32,height:32,alignItems:'center',justifyContent:'center'}}><c.icon size={16} color={st.muted}/></View><View style={{flex:1,minWidth:0}}><Text numberOfLines={1} style={{fontSize:14,color:st.text,fontFamily:fonts.sansMedium}}>{item.label}</Text><Text numberOfLines={1} style={{fontSize:12,color:st.muted,marginTop:3}}>{item.sub}</Text></View><ChevronRight size={16} color={st.muted}/></Pressable>)}
    </View>})}
   </>}
  </ScrollView>
  {viewportWidth<768&&<FadeEdges top={false} bottom/>}
 </View>;
}
