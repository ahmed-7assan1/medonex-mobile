/**
 * MedOneX design tokens — copied 1:1 from the website (MedQs0:
 * tailwind.config.ts + src/styles/globals.css) so the app matches the
 * site's phone UI exactly. Light/dark pairs mirror the site's :root/.dark.
 * Fonts: Inter (English UI), Cairo (Arabic), Plus Jakarta Sans (display),
 * IBM Plex Mono (code). Radii from the site's --radius-* tokens.
 */

export const radii = { lg: 22, md: 16, base: 12, sm: 10 } as const;
export const easing = [0.22, 1, 0.36, 1] as const; // site --ease

export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  communityPostBg: string;
  railIcon: string;
  // Dark Luxury brand tokens
  bg0: string;
  bg1: string;
  bg2: string;
  surface: string;
  surface2: string;
  line: string;
  txt0: string;
  txt1: string;
  txt2: string;
  txt3: string;
  gold0: string;
  gold1: string;
  blue0: string;
  blue1: string;
  success0: string;
  ruby0: string;
  azure0: string;
}

export const light: ThemeColors = {
  background: '#F5F5F5',
  foreground: '#121212',
  card: '#FFFFFF',
  cardForeground: '#121212',
  popover: '#FFFFFF',
  primary: '#121212',
  primaryForeground: '#FFFFFF',
  secondary: 'rgba(0,0,0,0.04)',
  secondaryForeground: '#595959',
  muted: '#F0F0F0',
  mutedForeground: '#808080',
  accent: 'rgba(0,0,0,0.04)',
  accentForeground: '#121212',
  destructive: '#FF6B6B',
  destructiveForeground: '#FFFFFF',
  border: '#E0E0E0',
  input: '#E0E0E0',
  ring: '#121212',
  success: '#34C48B',
  successForeground: '#FFFFFF',
  warning: '#FFB23F',
  warningForeground: '#FFFFFF',
  communityPostBg: '#FFFFFF',
  railIcon: '#808080',
  bg0: '#faf8f4',
  bg1: '#f3f0ea',
  bg2: '#ece7de',
  surface: '#ffffff',
  surface2: '#f7f4ee',
  line: 'rgba(10,10,10,0.08)',
  txt0: '#1a1d21',
  txt1: '#45505c',
  txt2: '#74808d',
  txt3: '#9aa3ad',
  gold0: '#b8863f',
  gold1: '#96702f',
  blue0: '#2563eb',
  blue1: '#1d4ed8',
  success0: '#16a34a',
  ruby0: '#dd3b52',
  azure0: '#2b78cf',
};

export const dark: ThemeColors = {
  background: '#0B0B0B',
  foreground: '#F5F5F5',
  card: '#1C1C1C',
  cardForeground: '#F5F5F5',
  popover: '#171717',
  primary: '#F5F5F5',
  primaryForeground: '#000000',
  secondary: 'rgba(255,255,255,0.03)',
  secondaryForeground: '#B3B3B3',
  muted: '#212121',
  mutedForeground: '#858585',
  accent: 'rgba(255,255,255,0.04)',
  accentForeground: '#FAFAFA',
  destructive: '#FF7B7B',
  destructiveForeground: '#FFFFFF',
  border: '#333333',
  input: '#333333',
  ring: '#F5F5F5',
  success: '#2FCF92',
  successForeground: '#FFFFFF',
  warning: '#FFB84D',
  warningForeground: '#FFFFFF',
  communityPostBg: '#121212',
  railIcon: '#BDBDBD',
  bg0: '#0B0B0B',
  bg1: '#121212',
  bg2: '#1C1C1C',
  surface: '#1C1C1C',
  surface2: '#212121',
  line: 'rgba(255,255,255,0.08)',
  txt0: '#F5F5F5',
  txt1: '#B3B3B3',
  txt2: '#858585',
  txt3: '#666666',
  gold0: '#e8c777',
  gold1: '#b8863f',
  blue0: '#3b82f6',
  blue1: '#2563eb',
  success0: '#2FCF92',
  ruby0: '#f43f5e',
  azure0: '#3b82f6',
};

export const fonts = {
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
  display: 'PlusJakartaSans_700Bold',
  arabic: 'Cairo_400Regular',
  arabicBold: 'Cairo_700Bold',
  mono: 'IBMPlexMono_400Regular',
} as const;

/** Tablet breakpoint: at/above this width the app switches to the
 *  desktop-like layout (side rail instead of the bottom capsule). */
export const TABLET_BREAKPOINT = 768;

/** Mobile-dashboard surface tokens (.settings-ui / --st-*), the phone UI
 *  the dashboard, settings and community share. */
export interface StColors {
  bg: string;
  surface: string;
  surfacePressed: string;
  border: string;
  text: string;
  muted: string;
  pillFill: string;
  pillText: string;
}

export const stLight: StColors = {
  bg: '#F4F4F5',
  surface: '#FFFFFF',
  surfacePressed: '#EDEDEF',
  border: '#E4E4E7',
  text: '#111111',
  muted: '#6B6B70',
  pillFill: '#111111',
  pillText: '#FFFFFF',
};

export const stDark: StColors = {
  bg: '#09090B',
  surface: '#202020',
  surfacePressed: '#292929',
  border: '#2C2C2C',
  text: '#F5F5F5',
  muted: '#9A9A9A',
  pillFill: '#FFFFFF',
  pillText: '#111111',
};

/** Phone dashboard metrics from src/components/dashboard/mobile/tokens.ts. */
export const mTokens = {
  cardRadius: 20,
  cardPad: 14,
  gutter: 16,
  sectionsGap: 28,
  headingGap: 10,
  sectionSize: 16,
  cardTitleSize: 15,
  cardDescSize: 12,
  metaSize: 11,
  valueSize: 20,
  iconBtn: 44,
  avatar: 40,
} as const;
