import React, { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, TextInput, StyleSheet, Image, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu, X, Search, Bell, Settings } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useAuth } from '@/lib/auth';
import { DRAWER_LINKS } from '@/lib/navigation';
import { NotificationsSheet } from './NotificationsSheet';

/** Website SettingsTopBar: 56px row, centered title, 44px menu/profile targets. */
export function MobilePageHeader({ title }: { title: string }) {
  const { width } = useWindowDimensions();
  const { st, fonts } = useTheme();
  const { i18n } = useTranslation();
  const ar = i18n.language === 'ar';
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notif, setNotif] = useState(false);
  const [query, setQuery] = useState('');
  if (width >= 768) return null;
  const name=user?.name||'Guest';
  const links=DRAWER_LINKS.filter(l=>(ar?l.ar:l.en).toLowerCase().includes(query.toLowerCase()));
  const go=(href:string)=>{setOpen(false);setQuery('');router.push(href as never)};
  return <>
    <View style={[styles.header,{backgroundColor:st.bg}]}>
      <Pressable accessibilityRole="button" accessibilityLabel={ar?'القائمة':'Menu'} onPress={()=>setOpen(true)} style={styles.control}><Menu size={24} strokeWidth={1.5} color={st.text}/></Pressable>
      <Text numberOfLines={1} style={{color:st.text,fontSize:17,fontFamily:fonts.sansSemiBold,flex:1,textAlign:'center'}}>{title}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={ar?'الملف الشخصي':'Open profile'} onPress={()=>go('/profile')} style={styles.control}>
        {user?.image?<Image source={{uri:user.image}} style={{width:36,height:36,borderRadius:18}}/>:<Text style={{color:st.text,fontSize:13,fontFamily:fonts.sansSemiBold}}>{name.split(/\s+/).map(x=>x[0]).slice(0,2).join('')}</Text>}
      </Pressable>
    </View>
    <Modal visible={open} transparent animationType="fade" onRequestClose={()=>setOpen(false)} statusBarTranslucent>
      <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.55)',flexDirection:ar?'row-reverse':'row'}}>
        <Pressable accessibilityRole="button" style={StyleSheet.absoluteFill} accessibilityLabel={ar?'إغلاق القائمة':'Close menu'} onPress={()=>setOpen(false)}/>
        <View accessibilityViewIsModal style={{width:Math.min(340,width*.88),height:'100%',backgroundColor:st.bg,paddingTop:insets.top,paddingBottom:insets.bottom}}>
          <View style={[styles.header,{paddingHorizontal:16}]}><Text style={{flex:1,fontSize:17,color:st.text,fontFamily:fonts.sansSemiBold}}>MedOneX</Text><Pressable accessibilityRole="button" style={styles.control} accessibilityLabel={ar?'إغلاق القائمة':'Close menu'} onPress={()=>setOpen(false)}><X size={18} color={st.text}/></Pressable></View>
          <View style={{margin:12,paddingHorizontal:12,backgroundColor:st.surface,borderRadius:13,flexDirection:'row',alignItems:'center',gap:10}}><Search size={17} color={st.muted}/><TextInput accessibilityLabel={ar?'البحث في الصفحات':'Search pages'} value={query} onChangeText={setQuery} placeholder={ar?'بحث':'Search pages'} placeholderTextColor={st.muted} style={{height:44,flex:1,color:st.text,fontSize:15}}/></View>
          <ScrollView contentContainerStyle={{padding:12,paddingBottom:32}}>
            {links.length===0&&<Text style={{color:st.muted,padding:20}}>{ar?'مفيش صفحات مطابقة':'No matching pages'}</Text>}
            {links.map(l=><Pressable key={l.href} accessibilityRole="button" onPress={()=>go(l.href)} style={{minHeight:46,paddingHorizontal:16,flexDirection:ar?'row-reverse':'row',alignItems:'center',gap:14}}><l.icon size={19} strokeWidth={1.8} color={st.text}/><Text style={{color:st.text,fontSize:15,fontFamily:fonts.sans}}>{ar?l.ar:l.en}</Text></Pressable>)}
          </ScrollView>
          <View style={[styles.header,{justifyContent:'space-between',paddingHorizontal:16}]}><Pressable accessibilityRole="button" accessibilityLabel={ar?'الملف الشخصي':'Open profile'} onPress={()=>go('/profile')} style={[styles.control,{backgroundColor:st.surface,borderRadius:22}]}><Text style={{color:st.text}}>{name[0]}</Text></Pressable><View style={{flexDirection:'row'}}><Pressable accessibilityRole="button" style={styles.control} accessibilityLabel={ar?'الإعدادات':'Settings'} onPress={()=>go('/settings')}><Settings size={18} color={st.muted}/></Pressable><Pressable accessibilityRole="button" style={styles.control} accessibilityLabel={ar?'الإشعارات':'Notifications'} onPress={()=>{setOpen(false);setNotif(true)}}><Bell size={18} color={st.muted}/></Pressable></View></View>
        </View>
      </View>
    </Modal>
    <NotificationsSheet open={notif} onClose={()=>setNotif(false)}/>
  </>;
}
const styles=StyleSheet.create({header:{height:56,paddingHorizontal:16,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},control:{width:44,height:44,alignItems:'center',justifyContent:'center'}});
