import React,{useState} from 'react';
import {View,Text,Pressable,ScrollView} from 'react-native';
import {useRouter} from 'expo-router';
import {useTranslation} from 'react-i18next';
import {Bookmark,Library,FolderOpen,FileText,Trash2,BookOpen} from 'lucide-react-native';
import {useTheme} from '@/theme/ThemeContext';
import {useStudyStore} from '@/lib/local-study-store';
import type {ModuleWithStats} from '@/lib/modules';

export function SavedItemsView({modules,onBack}:{modules:ModuleWithStats[];onBack:()=>void}) {
 const {colors,fonts}=useTheme();const {i18n}=useTranslation();const ar=i18n.language==='ar';const router=useRouter();
 const ids=useStudyStore(s=>s.savedModuleIds);const toggle=useStudyStore(s=>s.toggleModule);const [type,setType]=useState('ALL');
 const items=modules.filter(m=>ids.includes(m.id));const visible=type==='ALL'||type==='MODULE'?items:[];
 const tabs=[{key:'ALL',label:ar?'الكل':'All',icon:Bookmark,count:items.length},{key:'MODULE',label:ar?'الموديولات':'Modules',icon:Library,count:items.length},{key:'SUBJECT',label:ar?'المواد':'Subjects',icon:FolderOpen,count:0},{key:'LECTURE',label:ar?'المحاضرات':'Lectures',icon:FileText,count:0}];
 return <View style={{paddingTop:24}}>
  <View style={{borderRadius:16,paddingHorizontal:20,paddingVertical:24,backgroundColor:colors.card,borderWidth:1,borderColor:colors.border,marginBottom:16,flexDirection:ar?'row-reverse':'row',alignItems:'center',gap:10}}>
   <View style={{width:32,height:32,borderRadius:12,backgroundColor:colors.secondary,alignItems:'center',justifyContent:'center'}}><Bookmark size={16} color={colors.primary}/></View>
   <View><Text style={{fontSize:16,fontFamily:fonts.sansBold,color:colors.foreground}}>{ar?'العناصر المحفوظة':'Saved Items'}</Text><Text style={{fontSize:12,color:colors.mutedForeground,marginTop:2}}>{items.length} {ar?'عنصر محفوظ':items.length===1?'item saved':'items saved'}</Text></View>
  </View>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:6,padding:1,paddingBottom:12}}>
   {tabs.map(t=><Pressable key={t.key} accessibilityRole="button" accessibilityState={{selected:type===t.key}} onPress={()=>setType(t.key)} style={{paddingHorizontal:12,height:34,borderRadius:17,borderWidth:1,borderColor:colors.border,backgroundColor:type===t.key&&t.key==='ALL'?'#2563eb':colors.card,flexDirection:'row',alignItems:'center',gap:6}}><t.icon size={14} color={type===t.key&&t.key==='ALL'?'#fff':colors.mutedForeground}/><Text style={{color:type===t.key&&t.key==='ALL'?'#fff':colors.foreground,fontSize:12,fontFamily:fonts.sansSemiBold}}>{t.label} {t.count}</Text></Pressable>)}
  </ScrollView>
  {visible.length===0?<View style={{alignItems:'center',paddingHorizontal:20,paddingVertical:64,borderRadius:16,borderWidth:1,borderStyle:'dashed',borderColor:colors.border,marginTop:4}}>
   <Bookmark size={28} color={colors.mutedForeground}/><Text style={{fontSize:16,fontFamily:fonts.sansSemiBold,color:colors.foreground,marginTop:20}}>{ar?'مفيش عناصر محفوظة لسه':'No saved items yet'}</Text><Text style={{fontSize:14,color:colors.mutedForeground,marginTop:6,textAlign:'center',lineHeight:21}}>{ar?'احفظ الموديولات أو المواد أو المحاضرات عشان تلاقيها بسرعة هنا.':'Bookmark modules, subjects, or lectures to find them quickly here.'}</Text>
   <Pressable accessibilityRole="button" onPress={onBack} style={{marginTop:24,borderRadius:12,backgroundColor:colors.primary,paddingHorizontal:20,paddingVertical:12,flexDirection:'row',gap:8,alignItems:'center'}}><BookOpen size={14} color={colors.primaryForeground}/><Text style={{fontSize:12,fontFamily:fonts.sansSemiBold,color:colors.primaryForeground}}>{ar?'استكشف الموديولات':'Explore Modules'}</Text></Pressable>
  </View>:<View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{visible.map(m=><View key={m.id} style={{width:'48%',padding:12,borderRadius:16,backgroundColor:colors.card,borderWidth:1,borderColor:colors.border}}>
   <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><Library size={18} color="#0ea5e9"/><Pressable accessibilityRole="button" accessibilityLabel={`Remove ${m.name}`} onPress={()=>toggle(m.id)} style={{width:36,height:36,alignItems:'center',justifyContent:'center'}}><Trash2 size={14} color={colors.mutedForeground}/></Pressable></View>
   <Pressable accessibilityRole="button" onPress={()=>router.push(`/modules/${m.id}` as never)}><Text numberOfLines={2} style={{fontSize:12,fontFamily:fonts.sansBold,color:colors.foreground,marginTop:8}}>{m.name}</Text><Text style={{fontSize:10,color:colors.mutedForeground,marginTop:4}}>{m.lecturesCount} {ar?'محاضرة':'lectures'}</Text><Text style={{fontSize:9,color:'#0ea5e9',marginTop:8}}>{ar?'موديول':'MODULES'}</Text></Pressable>
  </View>)}</View>}
 </View>;
}
