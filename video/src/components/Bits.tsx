/** Reusable visual bits shared by both Reels. */
import React from 'react';
import { Img } from 'remotion';
import { bob, pop } from '../anim';
import { FONT, green, ink } from '../brand';
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



