/** Reusable visual bits shared by both Reels. */
import React from 'react';
import { Img } from 'remotion';
import { bob, pop } from '../anim';
import { colors, FONT, green, ink, palette } from '../brand';
import { Icon, GlyphName } from './Icon';

/** White rounded tile with a 3D icon (the icon cut-outs have a white matte). */
export const Tile3D: React.FC<{
  src: string;
  frame: number;
  at: number;
  x: number;
  y: number;
  size?: number;
  rotate?: number;
  phase?: number;
  label?: string;
}> = ({ src, frame, at, x, y, size = 180, rotate = 0, phase = 0, label }) => {
  const s = pop(frame, at, 12, 160);
  const dy = bob(frame, 9, 84, phase);
  return (
    <div
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2 + dy,
        width: size,
        height: size,
        transform: `scale(${s}) rotate(${rotate * s}deg)`,
        opacity: Math.min(1, s * 1.4),
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.26,
          background: '#FFFFFF',
          boxShadow: '0 24px 50px -14px rgba(30,64,175,0.28), 0 6px 14px rgba(15,23,42,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Img src={src} style={{ width: size * 0.74, height: size * 0.74, objectFit: 'contain' }} />
      </div>
      {label && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: size + 10,
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
            fontFamily: FONT,
            fontWeight: 600,
            fontSize: size * 0.17,
            color: ink,
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
};

/** Check row used for trust points. */
export const CheckRow: React.FC<{
  text: string;
  frame: number;
  at: number;
  icon?: GlyphName;
  width?: number;
  size?: number;
  dark?: boolean;
  tone?: string;
}> = ({ text, frame, at, icon = 'check', width = 880, size = 40, dark, tone = green }) => {
  const s = pop(frame, at, 14, 170);
  return (
    <div
      style={{
        width,
        display: 'flex',
        alignItems: 'center',
        gap: size * 0.6,
        padding: `${size * 0.55}px ${size * 0.7}px`,
        borderRadius: size * 0.75,
        background: dark ? 'rgba(255,255,255,0.10)' : '#FFFFFF',
        border: dark ? '2px solid rgba(255,255,255,0.16)' : 'none',
        boxShadow: dark ? 'none' : '0 20px 44px -18px rgba(30,64,175,0.30), 0 4px 10px rgba(15,23,42,0.05)',
        transform: `translateX(${(1 - s) * 120}px) scale(${0.9 + 0.1 * s})`,
        opacity: Math.min(1, s * 1.3),
      }}
    >
      <div
        style={{
          width: size * 1.55,
          height: size * 1.55,
          borderRadius: size,
          background: tone,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={size * 0.95} color="#FFFFFF" stroke={icon === 'check' ? 3 : 2.2} />
      </div>
      <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: size, lineHeight: 1.18, color: dark ? '#FFFFFF' : ink, letterSpacing: '-0.01em' }}>
        {text}
      </div>
    </div>
  );
};

/** Map pin with a product photo and a distance chip. */
export const PhotoPin: React.FC<{
  src: string;
  label: string;
  frame: number;
  at: number;
  x: number;
  y: number;
  size?: number;
}> = ({ src, label, frame, at, x, y, size = 132 }) => {
  const s = pop(frame, at, 10, 190);
  const drop = (1 - s) * -160;
  const shadow = Math.min(1, s);
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: x - size * 0.32,
          top: y - 10,
          width: size * 0.64,
          height: 20,
          borderRadius: '50%',
          background: 'rgba(15,23,42,0.25)',
          transform: `scale(${0.5 + 0.5 * shadow})`,
          opacity: shadow,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: x - size / 2,
          top: y - size * 1.22 + drop,
          width: size,
          opacity: Math.min(1, s * 2),
        }}
      >
        <div
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: '#FFFFFF',
            padding: 7,
            boxShadow: '0 16px 32px -10px rgba(15,23,42,0.45)',
          }}
        >
          <Img src={src} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
        </div>
        <div
          style={{
            width: 0,
            height: 0,
            margin: '-4px auto 0',
            borderLeft: '16px solid transparent',
            borderRight: '16px solid transparent',
            borderTop: '24px solid #FFFFFF',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: -50,
            transform: `translateX(-50%) scale(${pop(frame, at + 6, 12, 200)})`,
            padding: '8px 18px',
            borderRadius: 999,
            background: colors.primary,
            color: '#FFFFFF',
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 30,
            whiteSpace: 'nowrap',
            boxShadow: '0 10px 20px -8px rgba(29,78,216,0.6)',
          }}
        >
          {label}
        </div>
      </div>
    </>
  );
};

/** Pulsing "you are here" dot. */
export const UserDot: React.FC<{ frame: number; x: number; y: number; at?: number }> = ({ frame, x, y, at = 0 }) => {
  const s = pop(frame, at, 12, 180);
  const pulse = ((frame - at) % 40) / 40;
  return (
    <div style={{ position: 'absolute', left: x - 60, top: y - 60, width: 120, height: 120 }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'rgba(60,131,246,0.35)',
          transform: `scale(${0.3 + pulse * 1.2})`,
          opacity: (1 - pulse) * s,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 34,
          borderRadius: '50%',
          background: palette.primary[50],
          border: '9px solid #FFFFFF',
          boxShadow: '0 8px 20px rgba(29,78,216,0.5)',
          transform: `scale(${s})`,
        }}
      />
    </div>
  );
};

/** Wrap app-point UI so it renders at `scale` outside the phone (callouts). */
export const Scaled: React.FC<{ scale: number; width: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  scale,
  width,
  children,
  style,
}) => (
  <div style={{ position: 'absolute', width: width * scale, ...style }}>
    <div style={{ width, transform: `scale(${scale})`, transformOrigin: 'top left' }}>{children}</div>
  </div>
);
