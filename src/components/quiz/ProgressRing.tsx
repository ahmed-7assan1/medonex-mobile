import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import type { LucideIcon } from 'lucide-react-native';

interface Props {
  pct: number;
  size?: number;
  stroke?: number;
  color: string;
  bgColor: string;
  icon: LucideIcon;
  value: string;
  sublabel: string;
}

/** Site: ui/ProgressRing.tsx — 52px SVG ring, 4px stroke, icon in the
 *  center, value 12px black + 8px uppercase sublabel. */
export function ProgressRing({ pct, size = 52, stroke = 4, color, bgColor, icon: Icon, value, sublabel }: Props) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.max(0, Math.min(100, pct)) / 100) * circ;

  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bgColor} strokeWidth={stroke} strokeLinecap="round" />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
          />
        </Svg>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} />
        </View>
      </View>
      <Text style={{ fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'], lineHeight: 14 }}>{value}</Text>
      <Text style={{ fontSize: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, lineHeight: 10, opacity: 0.6 }}>{sublabel}</Text>
    </View>
  );
}
