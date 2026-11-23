/** CSS-style bounded sticky translation in a native lecture scroller. */
export function lectureStickyRange(y:number,height:number,sectionY:number,sectionHeight:number,top:number){
 if(![y,height,sectionY,sectionHeight,top].every(Number.isFinite)||height<=0||sectionHeight<=0||top<0)return;
 const travel=Math.max(0,sectionY+sectionHeight-y-height);
 return {start:y-top,end:y-top+travel,travel};
}
