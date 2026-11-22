import { Platform, PixelRatio } from 'react-native';

/** Per-device performance tier (Ahmed, 22 Nov): maximum smoothness on weak
 *  and strong devices without changing the look. Low tier swaps GPU-heavy
 *  live blur for a slightly more opaque identical-tint surface, caps shadow
 *  rendering to native elevation, and tightens list windowing. The visual
 *  output is the same; only the rendering cost changes. */
export type PerfTier = 'high' | 'low';

function detectTier(): PerfTier {
  if (Platform.OS === 'web') return 'high';
  if (Platform.OS === 'android') {
    const api = typeof Platform.Version === 'number' ? Platform.Version : 999;
    if (api < 26 || PixelRatio.get() < 2) return 'low';
  }
  return 'high';
}

export const PERF_TIER: PerfTier = detectTier();

/** Live blur (BlurView) is the most expensive effect we ship; on low tier
 *  we replace it with a static surface at a matched opacity. */
export const USE_LIVE_BLUR = PERF_TIER === 'high';

/** Glass tint opacity when live blur is off: slightly higher so the visual
 *  separation from content underneath reads the same. */
export const GLASS_OPACITY = {
  light: USE_LIVE_BLUR ? 0.7 : 0.88,
  dark: USE_LIVE_BLUR ? 0.1 : 0.22,
} as const;

/** Long-list windowing presets (used by FlatList screens). */
export const LIST_PERF = {
  high: { windowSize: 10, maxToRenderPerBatch: 12, initialNumToRender: 12 },
  low: { windowSize: 5, maxToRenderPerBatch: 6, initialNumToRender: 6 },
}[PERF_TIER];
