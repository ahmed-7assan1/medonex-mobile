import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, useWindowDimensions,Alert } from 'react-native';
import { Bell, CheckCheck, Inbox, Settings2, X, Megaphone, MessageSquare, Clock, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {useNotifications} from '@/lib/notifications';
import {isFixtureMode} from '@/lib/fixtures';
import {timeAgo} from '@/components/social/format';
import { useTheme } from '@/theme/ThemeContext';
import { Sheet } from './Sheet';

type Filter = 'all' | 'unread' | 'BROADCAST' | 'FORUM';
const SAMPLE = [
  { id: 'n1', channel: 'BROADCAST', title: 'Welcome to MedOneX', body: 'Explore your modules and build your study routine.', time: '2h', read: false, href: '/modules' },
  { id: 'n2', channel: 'FORUM', title: 'A new discussion in your community', body: 'Your classmates are sharing revision tips.', time: '4h', read: false, href: '/social' },
  { id: 'n3', channel: 'FORUM', title: 'Your weekly study recap', body: 'Keep going. Your next lecture is waiting.', time: '1d', read: false, href: '/' },
];
/** Local-only counterpart of the site's NotificationsSheet. No read receipts are sent. */
export function NotificationsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { colors, fonts, st } = useTheme();
  const { i18n } = useTranslation();
  const ar = i18n.language === 'ar';
  const text = (en: string, arabic: string) => ar ? arabic : en;
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [localItems, setItems] = useState(SAMPLE);
  const resource=useNotifications(open);
  const items=isFixtureMode()?localItems:(resource.data?.notifications??[]).map(n=>({...n,time:timeAgo(n.createdAt),href:n.postId?`/social?post=${encodeURIComponent(n.postId)}`:n.linkUrl||'/'}));
  const readOnly=()=>Alert.alert(text('Read-only preview','معاينة للقراءة فقط'),text('Read status has not changed on your account.','حالة القراءة في حسابك ما اتغيرتش.'));
  const safeRoute=(href:string)=>/^\/(modules|quiz|profile|teams|taskat|settings|social|qbank|downloads)(\/|\?|$)/.test(href)?href:'/social';
  const [filter, setFilter] = useState<Filter>('all');
  const unread = items.filter(n => !n.read).length;
  const count = (key: Filter) => items.filter(n => key === 'all' || (key === 'unread' ? !n.read : n.channel === key)).length;
  const filtered = items.filter(n => filter === 'all' || (filter === 'unread' ? !n.read : n.channel === filter));
  const close = () => { setFilter('all'); onClose(); };
  const filters: {key: Filter; label: string}[] = [
    {key:'all',label:text('All','الكل')}, {key:'unread',label:text('Unread','غير مقروءة')},
    {key:'BROADCAST',label:text('Broadcasts','الإعلانات')}, {key:'FORUM',label:text('Forum','المنتدى')},
  ];
  const label = { color: st.text, fontFamily: fonts.sansSemiBold };
  const openSettings = () => { close(); router.push('/settings'); };
  const desktop = width >= 768;
  return <Sheet visible={open} autoHeight center={desktop} onClose={close}>
      <View accessibilityViewIsModal style={[styles.sheet,{backgroundColor:colors.card,borderColor:st.border,maxHeight:height*0.86,paddingBottom:desktop?0:insets.bottom,borderRadius:desktop?24:undefined}]}>
        <Pressable accessibilityRole="button" accessibilityLabel={text('Close notifications','إغلاق الإشعارات')} onPress={close} style={styles.handleArea}><View style={[styles.handle,{backgroundColor:st.muted+'55'}]}/></Pressable>
        <View style={{paddingHorizontal:20,paddingBottom:12,gap:16}}>
          <View style={styles.row}>
            <View style={[styles.badge,{backgroundColor:colors.secondary}]}><Bell size={20} color={st.text}/></View>
            <View style={{flex:1,gap:4}}><Text style={[label,{fontSize:15}]}>{text('Notifications','الإشعارات')}</Text><Text style={{fontSize:11,color:st.muted}}>{unread ? text(`You have ${unread} unread updates`, `عندك ${unread} إشعارات غير مقروءة`) : text("You're all caught up",'كل الإشعارات مقروءة')}</Text></View>
            <Pressable accessibilityRole="button" accessibilityLabel={text('Notification settings','إعدادات الإشعارات')} onPress={openSettings} style={[styles.icon,{backgroundColor:colors.muted}]}><Settings2 size={16} color={st.muted}/></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={text('Close notifications','إغلاق الإشعارات')} onPress={close} style={[styles.icon,{backgroundColor:colors.muted}]}><X size={16} color={st.muted}/></Pressable>
          </View>
          <View style={[styles.row,{justifyContent:'space-between'}]}>
            <Text style={{color:st.muted,fontSize:11}}>{text(`${unread} new · ${items.length} total`,`${unread} جديد · ${items.length} إجمالي`)}</Text>
            {unread>0 && <Pressable accessibilityRole="button" onPress={()=>isFixtureMode()?setItems(xs=>xs.map(n=>({...n,read:true}))):readOnly()} style={[styles.row,{padding:6,borderRadius:20,backgroundColor:colors.secondary}]}><CheckCheck size={14} color={st.text}/><Text style={[label,{fontSize:11}]}>{text('Mark all read','قراءة الكل')}</Text></Pressable>}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:6}}>
            {filters.map(f=><Pressable key={f.key} accessibilityRole="button" accessibilityState={{selected:filter===f.key}} onPress={()=>setFilter(f.key)} style={[styles.filter,{borderColor:st.border,backgroundColor:filter===f.key?st.text:colors.card}]}><Text style={{fontSize:12,fontFamily:fonts.sansSemiBold,color:filter===f.key?st.bg:st.muted}}>{f.label}  {count(f.key)}</Text></Pressable>)}
          </ScrollView>
        </View>
        <ScrollView style={{borderTopWidth:1,borderColor:st.border,flexShrink:1}} contentContainerStyle={{padding:10,gap:8,paddingBottom:24}}>
          {!isFixtureMode()&&(resource.isLoading||resource.isError)?<View style={{padding:38,alignItems:'center',gap:14}}><Text style={{color:st.muted}}>{resource.isLoading?text('Loading...','جاري التحميل...'):text('Could not load notifications','تعذر تحميل الإشعارات')}</Text>{resource.isError&&<Pressable accessibilityRole="button" onPress={()=>resource.refetch()}><Text style={label}>{text('Try again','حاول تاني')}</Text></Pressable>}</View>:filtered.length===0 ? <View style={{padding:38,alignItems:'center',gap:14}}><Inbox size={36} color={st.muted}/><Text style={[label,{fontSize:14}]}>{text('No unread notifications','مفيش إشعارات غير مقروءة')}</Text><Text style={{color:st.muted,fontSize:12,textAlign:'center'}}>{text('New replies, likes and announcements will appear here.','الردود والإعجابات والإعلانات الجديدة هتظهر هنا.')}</Text><Pressable accessibilityRole="button" onPress={()=>setFilter('all')}><Text style={label}>{text('Show all notifications','عرض كل الإشعارات')}</Text></Pressable></View> : filtered.map(n=>{const Icon=n.channel==='FORUM'?MessageSquare:Megaphone;return <Pressable key={n.id} accessibilityRole="button" onPress={()=>{if(isFixtureMode())setItems(xs=>xs.map(x=>x.id===n.id?{...x,read:true}:x));close();router.push(safeRoute(n.href) as never)}} style={[styles.notification,{backgroundColor:colors.card,borderColor:st.border,opacity:n.read?0.65:1}]}><View style={[styles.badge,{backgroundColor:colors.secondary}]}><Icon size={18} color={st.text}/></View><View style={{flex:1,gap:5}}><Text style={[label,{fontSize:13.5}]}>{n.title}</Text><Text style={{fontSize:12.5,lineHeight:17,color:st.muted}}>{n.body}</Text><View style={styles.row}><Text style={{color:st.muted,fontSize:10}}>{n.channel==='FORUM'?text('Forum','المنتدى'):text('Broadcast','إعلان')}</Text><Clock size={11} color={st.muted}/><Text style={{color:st.muted,fontSize:11}}>{n.time}</Text></View></View>{!n.read&&<View style={{width:7,height:7,borderRadius:4,backgroundColor:st.text,marginTop:5}}/>}</Pressable>})}
        </ScrollView>
        <View style={[styles.row,{padding:14,borderTopWidth:1,borderColor:st.border,justifyContent:'space-between'}]}><Pressable accessibilityRole="button" onPress={openSettings}><Text style={{fontSize:11,color:st.muted}}>{text('Notification settings','إعدادات الإشعارات')}</Text></Pressable><Text style={{fontSize:11,color:st.muted}}>{filtered.length} / {items.length}</Text></View>
      </View>
  </Sheet>;
}
const styles=StyleSheet.create({
  backdrop:{flex:1,backgroundColor:'rgba(0,0,0,0.6)',alignItems:'center'},
  sheet:{width:'100%',maxWidth:480,borderTopLeftRadius:28,borderTopRightRadius:28,borderWidth:1,overflow:'hidden'},
  handleArea:{paddingTop:12,paddingBottom:6,alignItems:'center'}, handle:{width:40,height:6,borderRadius:3},
  row:{flexDirection:'row',alignItems:'center',gap:6}, badge:{width:40,height:40,borderRadius:14,alignItems:'center',justifyContent:'center'},
  icon:{width:32,height:32,borderRadius:16,alignItems:'center',justifyContent:'center'}, filter:{borderWidth:1,borderRadius:24,paddingVertical:8,paddingHorizontal:13},
  notification:{flexDirection:'row',gap:14,borderWidth:1,borderRadius:16,padding:14,alignItems:'flex-start'},
});
