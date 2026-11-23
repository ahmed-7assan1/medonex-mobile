/** Center a loaded record inside the lecture scroller, without changing its layout. */
export function recordRevealY(sectionY:number,rowY:number,rowHeight:number,viewportHeight:number,paddingTop:number):number|undefined{
 if(![sectionY,rowY,rowHeight,viewportHeight,paddingTop].every(Number.isFinite)||sectionY<0||rowY<0||rowHeight<=0||viewportHeight<=0||paddingTop<0)return;
 return Math.max(0,sectionY+paddingTop+rowY+rowHeight/2-viewportHeight/2);
}
