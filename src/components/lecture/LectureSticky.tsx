import React,{createContext,useContext,useEffect,useMemo,useRef,useState}from'react';
import{Animated,View,type StyleProp,type ViewStyle}from'react-native';
import{LinearGradient}from'expo-linear-gradient';
import{lectureStickyRange}from'@/lib/lecture-sticky';
type Scroll={scrollY:Animated.Value;contentRef:React.RefObject<View|null>;revision:string};
export const LectureScrollContext=createContext<Scroll|null>(null);
const Region=createContext<{ref:React.RefObject<View|null>;height:number}|null>(null);
/** A sticky item cannot travel beyond its own content section. */
export function LectureStickyRegion({children,style}:{children:React.ReactNode;style?:StyleProp<ViewStyle>}){
 const ref=useRef<View>(null),[height,setHeight]=useState(0);
 return <View ref={ref} collapsable={false} onLayout={event=>setHeight(event.nativeEvent.layout.height)} style={style}><Region.Provider value={{ref,height}}>{children}</Region.Provider></View>;
}
export function LectureSticky({children,top=0,fadeColor,testID,enabled=true}:{children:React.ReactNode;top?:number;fadeColor?:string;testID?:string;enabled?:boolean}){
 const scroll=useContext(LectureScrollContext),region=useContext(Region),ref=useRef<View>(null),alive=useRef(true);
 const[range,setRange]=useState<ReturnType<typeof lectureStickyRange>>();
 useEffect(()=>{alive.current=true;return()=>{alive.current=false}},[]);
 const measure=()=>{
  const root=scroll?.contentRef.current,section=region?.ref.current,node=ref.current;
  if(!root||!section||!node)return;
  node.measureLayout(root,(_x,y,_width,height)=>section.measureLayout(root,(_sx,sectionY)=>{
   if(!alive.current)return;const next=lectureStickyRange(y,height,sectionY,region?.height??0,top);
   setRange(previous=>previous?.start===next?.start&&previous?.travel===next?.travel?previous:next);
  },()=>{}),()=>{});
 };
 useEffect(()=>{const frame=requestAnimationFrame(measure);const late=setTimeout(measure,600);return()=>{cancelAnimationFrame(frame);clearTimeout(late)}},[scroll?.revision,region?.height,top]);
 const translateY=useMemo(()=>enabled&&scroll&&range&&range.travel>0?scroll.scrollY.interpolate({inputRange:[range.start,range.end],outputRange:[0,range.travel],extrapolate:'clamp'}):0,[scroll?.scrollY,range,enabled]);
 return <View ref={ref} collapsable={false} testID={testID} onLayout={measure} style={{zIndex:enabled?5:0}}><Animated.View style={{transform:[{translateY}],overflow:'visible'}}>{children}{fadeColor&&<LinearGradient pointerEvents="none" colors={[fadeColor,'transparent']} style={{position:'absolute',top:'100%',height:14,left:0,right:0}}/>}</Animated.View></View>;
}
