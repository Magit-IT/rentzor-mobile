/** Small app-styled pieces used outside the phone screens (avatars, push banners). */
import React from 'react';
import { Img } from 'remotion';
import { FONT, palette } from '../brand';
import { AppIconTile } from './Logo';

const g = palette.gray;

export const AvatarUI: React.FC<{ src: string; size: number; ring?: string }> = ({ src, size, ring }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      overflow: 'hidden',
      flexShrink: 0,
      boxShadow: ring ? `0 0 0 ${Math.max(2, size * 0.05)}px ${ring}` : undefined,
    }}
  >
    <Img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
  </div>
);

/** iOS-style push banner. Rendered at `scale` (1 = app points). */
export const NotificationUI: React.FC<{
  title: string;
  body: string;
  time: string;
  scale?: number;
  width?: number;
  style?: React.CSSProperties;
}> = ({ title, body, time, scale = 1, width = 361, style }) => (
  <div
    style={{
      width: width * scale,
      borderRadius: 24 * scale,
      background: 'rgba(255,255,255,0.94)',
      boxShadow: `0 ${18 * scale}px ${40 * scale}px -${10 * scale}px rgba(15,23,42,0.35), 0 0 0 ${1 * scale}px rgba(15,23,42,0.05)`,
      padding: `${12 * scale}px ${14 * scale}px`,
      display: 'flex',
      gap: 10 * scale,
      alignItems: 'center',
      ...style,
    }}
  >
    <AppIconTile size={38 * scale} radius={9 * scale} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 15 * scale, lineHeight: `${20 * scale}px`, color: g[100] }}>{title}</div>
        <div style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12 * scale, color: g[50] }}>{time}</div>
      </div>
      <div style={{ fontFamily: FONT, fontWeight: 400, fontSize: 14 * scale, lineHeight: `${19 * scale}px`, color: g[80] }}>{body}</div>
    </div>
  </div>
);
