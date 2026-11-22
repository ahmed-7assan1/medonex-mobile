import type { LinearGradientProps } from 'expo-linear-gradient';

/** Accent rotation from FeaturedModuleCard.tsx (sky, amber, emerald, violet). */
export const ACCENTS: { text: string; bar: [string, string] }[] = [
  { text: '#0EA5E9', bar: ['#0EA5E9', '#22D3EE'] },
  { text: '#F59E0B', bar: ['#F59E0B', '#FB923C'] },
  { text: '#10B981', bar: ['#10B981', '#2DD4BF'] },
  { text: '#8B5CF6', bar: ['#8B5CF6', '#A78BFA'] },
];

export function getAbbreviation(name: string): string {
  const abbreviation = name
    .split(' ')
    .filter((w) => w.length > 2 && w[0] === w[0].toUpperCase())
    .map((w) => w[0])
    .join('')
    .slice(0, 4);
  return abbreviation || name.slice(0, 3).toUpperCase();
}
