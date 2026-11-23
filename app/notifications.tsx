import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { NotificationsSheet } from '@/components/NotificationsSheet';
import { useTheme } from '@/theme/ThemeContext';
export default function NotificationsScreen(){
 const router=useRouter(); const {st}=useTheme();
 return <View style={{flex:1,backgroundColor:st.bg}}><NotificationsSheet open onClose={()=>router.canGoBack()?router.back():router.replace('/')} /></View>;
}
