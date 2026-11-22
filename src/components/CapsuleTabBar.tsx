import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, BackHandler, StyleSheet, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '@/theme/ThemeContext';
import { FadeEdges } from './FadeEdges';
import { EXPLORE_LINKS } from '@/lib/navigation';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react-native';
import { USE_LIVE_BLUR, GLASS_OPACITY } from '@/theme/perf';

/** Floating capsule tab bar, replicating the site's restyled MobileBottomNav
 *  (feat/mobile-nav-fab-style): 48px glass capsule (bg-white/70 | white/10,
 *  ring black/10 | white/25, blur 20), items 40px with a 20px icon
 *  (scale-110 when active) + 10px label, active = foreground semibold,
 *  no background pill. */
export function CapsuleTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(false);
  const { height } = useWindowDimensions();
  const router = useRouter();
  const { i18n } = useTranslation();
  const ar = i18n.language === 'ar';
  useEffect(() => { setExpanded(false); }, [state.index]);
  useEffect(() => {
    if (!expanded) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { setExpanded(false); return true; });
    return () => sub.remove();
  }, [expanded]);

  const glassBg = isDark
    ? `rgba(255,255,255,${GLASS_OPACITY.dark})`
    : `rgba(255,255,255,${GLASS_OPACITY.light})`;

  const capsuleBody = (
    <View style={{ backgroundColor: isDark ? 'rgba(11,11,11,0.85)' : 'rgba(255,255,255,0.80)', borderRadius: expanded ? 28 : 24 }}>
      {expanded && <View>
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:20,paddingBottom:8}}>
          <Text style={{color:colors.foreground,fontSize:14,fontWeight:'600'}}>{ar?'استكشف MedOneX':'Explore MedOneX'}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={ar?'إغلاق المزيد':'Close more pages'} onPress={()=>setExpanded(false)} style={{padding:7}}><X size={18} color={colors.mutedForeground}/></Pressable>
        </View>
        <ScrollView style={{maxHeight:Math.min(440,height*.55)}} contentContainerStyle={{paddingHorizontal:16,paddingBottom:12,flexDirection:ar?'row-reverse':'row',flexWrap:'wrap'}}>
          {EXPLORE_LINKS.map(l=><Pressable key={l.href} accessibilityRole="button" onPress={()=>{setExpanded(false);router.push(l.href as never)}} style={{width:'33.333%',minHeight:88,alignItems:'center',justifyContent:'center',gap:6}}>
            <View style={{width:44,height:44,borderRadius:16,backgroundColor:colors.muted,alignItems:'center',justifyContent:'center'}}><l.icon size={20} color={colors.mutedForeground}/></View>
            <Text style={{fontSize:11,color:colors.mutedForeground,textAlign:'center'}}>{ar?l.ar:l.en}</Text>
          </Pressable>)}
        </ScrollView>
      </View>}
        <View
          style={[
            styles.capsule,
            {
              backgroundColor: USE_LIVE_BLUR
                ? (isDark ? 'rgba(11,11,11,0.85)' : 'rgba(255,255,255,0.80)')
                : glassBg,
              borderColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.10)',
            },
          ]}
        >
          {state.routes.map((route, index) => {
            const focused = state.index === index || (route.name === 'more' && expanded);
            const { options } = descriptors[route.key];
            const label = typeof options.title === 'string' ? options.title : route.name;
            const onPress = () => {
              if (route.name === 'more') { setExpanded(v => !v); return; }
              setExpanded(false);
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            };
            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={{ selected: focused }}
                onPress={onPress}
                style={({ pressed }) => [styles.item, pressed && { transform: [{ scale: 0.95 }] }]}
              >
                <View style={focused ? { transform: [{ scale: 1.1 }] } : undefined}>
                  {options.tabBarIcon?.({ focused, color: focused ? colors.foreground : colors.mutedForeground, size: 20 })}
                </View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.label,
                    { color: focused ? colors.foreground : colors.mutedForeground },
                    focused ? { fontWeight: '600' } : { fontWeight: '500' },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
    </View>
  );

  return (
    <>
      {/* Edge fades: bottom separates content from the floating capsule,
          top softens the status-area edge — the mobile site's pattern. */}
      <FadeEdges />
      {expanded && <Pressable accessibilityLabel={ar?'إغلاق المزيد':'Close more pages'} onPress={()=>setExpanded(false)} style={[StyleSheet.absoluteFill,{zIndex:15,elevation:15,backgroundColor:'rgba(0,0,0,0.1)'}]} />}
      <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: insets.bottom + 12 }]}>
        {USE_LIVE_BLUR ? (
          <BlurView intensity={50} tint={isDark ? 'dark' : 'light'} style={[styles.blur,{borderRadius:expanded?28:24}]}>
            {capsuleBody}
          </BlurView>
        ) : (
          <View style={[styles.blur, styles.blurFallback,{borderRadius:expanded?28:24}]}>{capsuleBody}</View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    elevation: 20,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  blur: {
    borderRadius: 999,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 420,
  },
  blurFallback: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  capsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 48,
    borderRadius: 999,
    borderWidth: 1,
    padding: 4,
  },
  item: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: { fontSize: 10, lineHeight: 12 },
});
