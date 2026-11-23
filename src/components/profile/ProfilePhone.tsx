import React,{useEffect,useRef,useState}from'react';
import{Animated,Image,Modal,Pressable,ScrollView,StyleSheet,Text,View,useWindowDimensions}from'react-native';
import{LinearGradient}from'expo-linear-gradient';
import{useSafeAreaInsets}from'react-native-safe-area-context';
import{useRouter}from'expo-router';
import{ArrowLeft,BadgeCheck,Bell,CalendarDays,Flame,GraduationCap,LogOut,Moon,Pencil,Share2,Star,Sun,User}from'lucide-react-native';
import{useTranslation}from'react-i18next';
import{useTheme}from'@/theme/ThemeContext';
import{useAuth}from'@/lib/auth';
import{isFixtureMode,type FixtureProfileUser}from'@/lib/fixtures';
import{SCROLL_BOTTOM_PAD}from'@/theme/tokens';
import{PERF_TIER}from'@/theme/perf';
import{NotificationsSheet}from'@/components/NotificationsSheet';
import{FadeEdges}from'@/components/FadeEdges';

type Panel={id:string;label:string;body:React.ReactNode};
const short:Record<string,string>={'Experience points':'Points','Completed quizzes':'Quizzes','Average accuracy':'Accuracy',Followers:'Followers'};
const order=['Followers','Experience points','Completed quizzes','Average accuracy'];
const initials=(name:string)=>name.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join('').toUpperCase();

/** Active website mobile profile: cover, overlapping avatar, inline stats and swipe tabs. */
export function ProfilePhone({user,avatarUrl,isOwn,privateForViewer,following,onFollow,onShare,onEdit,panels:rawPanels,activeId,onTabChange}:{user:FixtureProfileUser;avatarUrl?:string|null;isOwn:boolean;privateForViewer:boolean;following:boolean;onFollow:()=>void;onShare:()=>void;onEdit:()=>void;panels:Panel[];activeId:string;onTabChange:(id:string)=>void}){
 const{st,colors,fonts,isDark,setThemeChoice}=useTheme();const{t,i18n}=useTranslation();const{user:viewer,signOut}=useAuth();const router=useRouter();const insets=useSafeAreaInsets();const{width,height}=useWindowDimensions();const ar=i18n.dir()==='rtl';const textFont=ar?'Cairo_400Regular':fonts.sans;const boldFont=ar?'Cairo_700Bold':fonts.sansBold;const row=ar?'row-reverse':'row';const panels=ar?[...rawPanels].reverse():rawPanels;
 const[coverFailed,setCoverFailed]=useState(false);const[avatarFailed,setAvatarFailed]=useState(false);const[menu,setMenu]=useState(false);const[notifications,setNotifications]=useState(false);const[labelWidths,setLabelWidths]=useState<Record<string,number>>({});const[heights,setHeights]=useState<Record<string,number>>({});
 const scroll=useRef(new Animated.Value(0)).current;const pager=useRef<ScrollView>(null);const active=Math.max(0,panels.findIndex(panel=>panel.id===activeId));const activeRef=useRef(active);activeRef.current=active;const topHeight=insets.top+60;const minimumHeight=Math.max(200,height-topHeight-53);const indexPosition=useRef(new Animated.Value(active*width)).current;
 useEffect(()=>{setCoverFailed(false)},[user.coverImage]);useEffect(()=>{setAvatarFailed(false)},[avatarUrl]);useEffect(()=>{pager.current?.scrollTo({x:activeRef.current*width,animated:false});indexPosition.setValue(activeRef.current*width)},[width,ar]);
 const choose=(index:number)=>{onTabChange(panels[index].id);pager.current?.scrollTo({x:index*width,animated:PERF_TIER!=='low'})};
 const iconStyle={...styles.icon,backgroundColor:isDark?'rgba(255,255,255,0.10)':'rgba(255,255,255,0.70)',borderColor:isDark?'rgba(255,255,255,0.15)':'rgba(0,0,0,0.10)'};
 const meta=(Icon:typeof Star,value:string,key:string)=><View key={key} style={{flexDirection:row,alignItems:'center',gap:6,maxWidth:'100%'}}><Icon size={16} color={st.muted}/><Text style={{fontFamily:textFont,fontSize:14,color:st.muted,flexShrink:1}}>{value}</Text></View>;
 return <View style={{flex:1,backgroundColor:st.bg,paddingTop:topHeight,direction:'ltr'}}>
  <Animated.ScrollView showsVerticalScrollIndicator={false} scrollEventThrottle={16} stickyHeaderIndices={privateForViewer?[]:[2]} contentContainerStyle={{paddingBottom:SCROLL_BOTTOM_PAD+insets.bottom}} onScroll={Animated.event([{nativeEvent:{contentOffset:{y:scroll}}}],{useNativeDriver:true})}>
   <View>
    {isFixtureMode()&&<View style={{position:'absolute',top:12,left:16,right:16,zIndex:1,padding:8,borderRadius:8,backgroundColor:'#0009'}}><Text style={{fontSize:11,color:'white',fontFamily:fonts.sans}}>Guest preview. Sample profile, not a live account.</Text></View>}
    {user.coverImage&&!coverFailed?<Image accessibilityLabel="Profile cover" source={{uri:user.coverImage}} onError={()=>setCoverFailed(true)} style={{width:'100%',aspectRatio:3}} resizeMode="cover"/>:<LinearGradient colors={[user.rankColor,st.bg]} start={{x:0,y:0}} end={{x:1,y:1}} style={{width:'100%',aspectRatio:3}}><LinearGradient colors={[user.rankColor+'D0',user.rankColor+'00']} start={{x:0,y:0}} end={{x:.7,y:1}} style={StyleSheet.absoluteFill}/></LinearGradient>}
    <View style={{paddingHorizontal:16,flexDirection:row,justifyContent:'space-between',alignItems:'flex-start'}}>
     <Animated.View style={{width:88,height:88,marginTop:-44,borderRadius:44,borderWidth:4,borderColor:st.bg,backgroundColor:st.surface,overflow:'hidden',transformOrigin:ar?'right bottom':'left bottom',transform:[{scale:scroll.interpolate({inputRange:[0,110],outputRange:[1,.6],extrapolate:'clamp'})}]}}>
      {avatarUrl&&!avatarFailed?<Image accessibilityLabel={user.name} source={{uri:avatarUrl}} onError={()=>setAvatarFailed(true)} style={{width:'100%',height:'100%'}} resizeMode="cover"/>:<View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:user.rankColor+'30'}}><Text style={{color:st.text,fontSize:26,fontFamily:boldFont}}>{initials(user.name)}</Text></View>}
     </Animated.View>
     <View style={{marginTop:12,flexDirection:row,gap:8}}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('profile.share')} onPress={onShare} style={[styles.icon,{borderColor:st.border}]}><Share2 size={16} color={st.text}/></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={isOwn?t('profile.editProfile'):following?t('profile.following'):t('profile.follow')} onPress={isOwn?onEdit:onFollow} style={[styles.pill,{borderColor:isOwn||following?st.border:'transparent',backgroundColor:isOwn||following?'transparent':st.pillFill}]}><Text style={{fontSize:14,fontFamily:boldFont,color:isOwn||following?st.text:st.pillText}}>{isOwn?t('profile.editProfile'):following?t('profile.following'):t('profile.follow')}</Text></Pressable>
     </View>
    </View>
    <View style={{paddingHorizontal:16}}>
     <View style={{marginTop:4,flexDirection:row,alignItems:'center',gap:6}}><Text numberOfLines={1} style={{fontSize:20,lineHeight:25,fontFamily:boldFont,color:st.text,flexShrink:1}}>{user.name}</Text>{user.verified&&<BadgeCheck accessibilityLabel="Verified" size={19} color={user.role==='SUPER_ADMIN'?'#e8c777':'#1DA1F2'}/>}</View>
     <Text style={{fontSize:15,lineHeight:21,fontFamily:textFont,color:st.muted,textAlign:ar?'right':'left'}}>@{user.handle}</Text>
     {!privateForViewer&&!!user.bio&&<Text style={{marginTop:8,fontSize:15,lineHeight:22.5,color:st.text,fontFamily:textFont,textAlign:ar?'right':'left'}}>{user.bio}</Text>}
     <View style={{marginTop:10,flexDirection:row,flexWrap:'wrap',columnGap:12,rowGap:6}}>
      {!!(user.semester||user.university)&&meta(GraduationCap,[user.semester,user.university].filter(Boolean).join(' — '),'academic')}
      {!!user.rank&&!user.hideRank&&meta(Star,user.rank,'rank')}
      {!!user.joined&&meta(CalendarDays,t('profile.joined',{date:user.joined}),'joined')}
      {(user.streak??0)>0&&meta(Flame,t('profile.dayStreak',{count:user.streak}),'streak')}
     </View>
    </View>
   </View>
   <View style={{paddingHorizontal:16,paddingTop:12,paddingBottom:4}}>
    {!privateForViewer&&<View style={{flexDirection:row,flexWrap:'wrap',columnGap:20,rowGap:4}}>{[...user.stats].sort((a,b)=>order.indexOf(a.label)-order.indexOf(b.label)).map(stat=><Text key={stat.label} style={{fontSize:13.5,color:st.muted,fontFamily:textFont}}><Text style={{fontFamily:boldFont,color:st.text}}>{stat.value}</Text> {short[stat.label]||stat.label}</Text>)}</View>}
   </View>
   <View style={{backgroundColor:st.bg,borderBottomWidth:privateForViewer?0:1,borderColor:st.border}}>
    {!privateForViewer&&<View accessibilityRole="tablist" style={{height:53,flexDirection:'row'}}>{panels.map((panel,index)=>{const selected=panel.id===activeId;return <Pressable accessibilityRole="tab" accessibilityState={{selected}} accessibilityLabel={panel.label} key={panel.id} onPress={()=>choose(index)} style={{flex:1,alignItems:'center',justifyContent:'center'}}><View style={{height:53,justifyContent:'center'}}><Text onLayout={event=>{const size=event.nativeEvent.layout.width;setLabelWidths(previous=>previous[panel.id]===size?previous:{...previous,[panel.id]:size})}} style={{fontSize:14,fontFamily:selected?boldFont:textFont,color:selected?st.text:st.muted}}>{panel.label}</Text></View></Pressable>})}<Animated.View pointerEvents="none" style={{position:'absolute',bottom:0,left:0,height:4,width:1,borderRadius:4,backgroundColor:'#1D9BF0',transformOrigin:'left center',transform:[{translateX:indexPosition.interpolate({inputRange:panels.map((_,index)=>index*width),outputRange:panels.map((panel,index)=>(index+.5)*width/panels.length-(labelWidths[panel.id]||60)/2),extrapolate:'clamp'})},{scaleX:indexPosition.interpolate({inputRange:panels.map((_,index)=>index*width),outputRange:panels.map(panel=>labelWidths[panel.id]||60),extrapolate:'clamp'})}]}}/></View>}
   </View>
   {privateForViewer?<View style={{marginHorizontal:16,marginTop:24,borderWidth:1,borderColor:'#f9731633',borderRadius:16,padding:24,backgroundColor:'#f973160d'}}><Text style={{textAlign:'center',color:'#f97316',fontFamily:boldFont,fontSize:14}}>This profile is private</Text></View>:<ScrollView ref={pager} horizontal pagingEnabled nestedScrollEnabled showsHorizontalScrollIndicator={false} scrollEventThrottle={16} style={{height:Math.max(minimumHeight,heights[activeId]||0)}} contentContainerStyle={{alignItems:'flex-start'}} onScroll={event=>{const x=event.nativeEvent.contentOffset.x;indexPosition.setValue(x);const next=Math.max(0,Math.min(panels.length-1,Math.round(x/width)));if(next!==activeRef.current){activeRef.current=next;onTabChange(panels[next].id)}}} onMomentumScrollEnd={event=>{const next=Math.max(0,Math.min(panels.length-1,Math.round(event.nativeEvent.contentOffset.x/width)));onTabChange(panels[next].id)}}>{panels.map(panel=><View key={panel.id} accessibilityElementsHidden={panel.id!==activeId} importantForAccessibility={panel.id===activeId?'auto':'no-hide-descendants'} style={{width,minHeight:minimumHeight}} onLayout={event=>{const measured=Math.ceil(event.nativeEvent.layout.height);setHeights(previous=>previous[panel.id]===measured?previous:{...previous,[panel.id]:measured})}}>{panel.body}</View>)}</ScrollView>}
  </Animated.ScrollView>
  <View pointerEvents="box-none" style={{position:'absolute',top:0,left:0,right:0,zIndex:10,paddingTop:insets.top}}>
   <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill,{backgroundColor:st.bg,borderBottomWidth:1,borderColor:st.border,opacity:scroll.interpolate({inputRange:[40,80],outputRange:[0,1],extrapolate:'clamp'})}]}/>
   <View style={{height:60,paddingHorizontal:16,flexDirection:row,alignItems:'center',gap:12}}>
    <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={()=>router.back()} style={iconStyle}><ArrowLeft size={16} color={colors.foreground}/></Pressable>
    <Animated.View style={{flex:1,opacity:scroll.interpolate({inputRange:[60,100],outputRange:[0,1],extrapolate:'clamp'})}}><Text numberOfLines={1} style={{fontSize:15,color:st.text,fontFamily:boldFont}}>{user.name}</Text>{typeof user.postCount==='number'&&<Text style={{fontSize:12,color:st.muted,fontFamily:textFont}}>{user.postCount} posts</Text>}</Animated.View>
    <View style={{flexDirection:row,gap:8}}>
     <Pressable accessibilityRole="button" accessibilityLabel="Notifications" onPress={()=>setNotifications(true)} style={iconStyle}><Bell size={14} color={colors.foreground}/></Pressable>
     <Pressable accessibilityRole="button" accessibilityLabel={isDark?'Switch to light mode':'Switch to dark mode'} onPress={()=>setThemeChoice(isDark?'light':'dark')} style={iconStyle}>{isDark?<Sun size={14} color={colors.foreground}/>:<Moon size={14} color={colors.foreground}/>}</Pressable>
     <Pressable accessibilityRole="button" accessibilityLabel="Account menu" onPress={()=>setMenu(true)} style={[styles.icon,{overflow:'hidden',borderColor:st.border,backgroundColor:st.surface}]}>{viewer?.image?<Image source={{uri:viewer.image}} style={{width:36,height:36}}/>:<Text style={{fontSize:12,color:st.text,fontFamily:boldFont}}>{initials(viewer?.name||'Guest')}</Text>}</Pressable>
    </View>
   </View>
  </View>
  <FadeEdges top bottom/>
  <NotificationsSheet open={notifications} onClose={()=>setNotifications(false)}/>
  <Modal visible={menu} transparent animationType="fade" onRequestClose={()=>setMenu(false)}><Pressable accessibilityRole="button" accessibilityLabel="Close account menu" style={StyleSheet.absoluteFill} onPress={()=>setMenu(false)}/><View accessibilityViewIsModal style={{position:'absolute',top:insets.top+60,...(ar?{left:16}:{right:16}),width:192,borderRadius:12,borderWidth:1,borderColor:st.border,backgroundColor:st.surface,overflow:'hidden'}}>{[{label:'Profile',Icon:User,run:()=>router.push('/profile')},{label:'Settings',Icon:Pencil,run:()=>router.push('/settings')},{label:'Sign Out',Icon:LogOut,run:()=>{void signOut()},danger:true}].map(item=><Pressable key={item.label} accessibilityRole="button" onPress={()=>{setMenu(false);item.run()}} style={{paddingHorizontal:16,paddingVertical:12,flexDirection:row,alignItems:'center',gap:10}}><item.Icon size={14} color={item.danger?'#f87171':st.muted}/><Text style={{fontSize:12,color:item.danger?'#f87171':st.text,fontFamily:boldFont}}>{item.label}</Text></Pressable>)}</View></Modal>
 </View>;
}
const styles=StyleSheet.create({icon:{width:36,height:36,borderRadius:18,borderWidth:1,alignItems:'center',justifyContent:'center'},pill:{height:36,borderRadius:18,borderWidth:1,paddingHorizontal:16,alignItems:'center',justifyContent:'center'}});
