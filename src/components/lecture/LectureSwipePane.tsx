import React, { useEffect, useMemo, useRef } from "react";
import { Animated, PanResponder, Platform, type GestureResponderEvent } from "react-native";

/** Lecture-pane swipes use the website's axis lock and 22%/64px threshold.
 * Nested players, editors and card gestures keep ownership of their touches. */
export function LectureSwipePane({ active, tabs, width, disabled, onChange, children }: {
  active: string; tabs: string[]; width: number; disabled?: boolean;
  onChange: (tab: string) => void; children: React.ReactNode;
}) {
  const x = useRef(new Animated.Value(0)).current;
  const state = useRef({ active, tabs, width, disabled, onChange });
  state.current = { active, tabs, width, disabled, onChange };
  const webTouch = useRef<{x:number;y:number;axis:string|null}|null>(null);
  const touchAllowed = useRef(true), mounted = useRef(true), busy = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; x.stopAnimation(); }; }, [x]);
  useEffect(() => { busy.current = false; x.stopAnimation(); x.setValue(0); }, [active, width, x]);
  const adjacent = (dx: number) => {
    const s = state.current, i = s.tabs.indexOf(s.active) + (dx < 0 ? 1 : -1);
    return i >= 0 && i < s.tabs.length ? s.tabs[i] : null;
  };
  const reset = () => Animated.timing(x, { toValue: 0, duration: 180, useNativeDriver: true }).start();
  const finish = (dx:number) => {
    const next=adjacent(dx),s=state.current;
    if(!next||Math.abs(dx)<Math.max(64,s.width*.22)){reset();return;}
    busy.current=true;
    Animated.timing(x,{toValue:dx<0?-s.width:s.width,duration:140,useNativeDriver:true}).start(({finished})=>{
      if(!mounted.current)return;
      if(finished)s.onChange(next);else busy.current=false;
    });
  };
  const responder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => !state.current.disabled && touchAllowed.current && !busy.current && Math.abs(g.dx) >= 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.25,
    onPanResponderMove: (_, g) => x.setValue(adjacent(g.dx) ? g.dx : g.dx * .25),
    onPanResponderRelease: (_, g) => finish(g.dx),
    onPanResponderTerminate: reset,
    onPanResponderTerminationRequest: () => true,
  }), [x]);
  const start = (event: GestureResponderEvent) => {
    webTouch.current = null;
    touchAllowed.current = true;
    if (Platform.OS !== "web") return;
    const target = event.target as unknown as HTMLElement;
    const owner = event.currentTarget as unknown as HTMLElement;
    if(!owner?.contains?.(target)){touchAllowed.current=false;return;}
    touchAllowed.current = !target?.closest?.("a,input,textarea,select,video,iframe,[role='button'],[data-no-tab-swipe]");
    const t=event.nativeEvent.touches[0];
    if(touchAllowed.current&&!state.current.disabled&&!busy.current&&t)webTouch.current={x:t.pageX,y:t.pageY,axis:null};
  };
  const move=(event:GestureResponderEvent)=>{
    if(Platform.OS!=='web')return;
    const start=webTouch.current,t=event.nativeEvent.touches[0];
    if(!start||!t||start.axis==='y')return;
    const dx=t.pageX-start.x,dy=t.pageY-start.y;
    if(!start.axis){if(Math.abs(dx)<10&&Math.abs(dy)<10)return;start.axis=Math.abs(dx)>Math.abs(dy)*1.25?'x':'y';}
    if(start.axis==='x')x.setValue(adjacent(dx)?dx:dx*.25);
  };
  const end=(event:GestureResponderEvent)=>{
    if(Platform.OS!=='web')return;
    const start=webTouch.current,t=event.nativeEvent.changedTouches[0];webTouch.current=null;
    if(start?.axis==='x'&&t)finish(t.pageX-start.x);
  };
  return <Animated.View {...(Platform.OS==='web'?{}:responder.panHandlers)} onTouchStart={start} onTouchMove={move} onTouchEnd={end} onTouchCancel={()=>{webTouch.current=null;reset()}} style={{ width: "100%", ...(Platform.OS === "web" ? { touchAction: "pan-y" } as any : {}), transform: [{ translateX: x }], opacity: x.interpolate({ inputRange: [-width, 0, width], outputRange: [.65, 1, .65], extrapolate: "clamp" }) }}>{children}</Animated.View>;
}
