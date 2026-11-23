import type {StColors} from '@/theme/tokens';
/** Exact lecture-mobile palette. Other student surfaces use their own tokens. */
export function lectureSurface(base:StColors,isDark:boolean,mobile:boolean):StColors {
  return mobile&&isDark?{...base,bg:'#070708',surface:'#111113',surfacePressed:'#1a1a1f',border:'#232328',text:'#ededed',muted:'#9e9ea4'}:base;
}
