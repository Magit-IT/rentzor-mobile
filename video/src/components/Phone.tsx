/**
 * Phone mockup. Children are laid out in app points (393 × 852, the frame the
 * Figma design uses) and scaled to the requested width, so the recreated
 * screens can use the app's real dimensions (cards 169pt, 14pt text, …).
 */
import React from 'react';
import { FONT, palette } from '../brand';

export const SCREEN_W = 393;
export const SCREEN_H = 852;

export const phoneSize = (width: number) => {
  const bezel = width * 0.026;
  const inner = width - bezel * 2;
  const scale = inner / SCREEN_W;
  const height = inner * (SCREEN_H / SCREEN_W) + bezel * 2;
  return { bezel, inner, scale, height };
};

export const StatusBar: React.FC<{ dark?: boolean }> = ({ dark }) => {
  const c = dark ? '#FFFFFF' : '#09090B';
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 54,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 30px 0 44px',
        fontFamily: FONT,
        fontWeight: 600,
        fontSize: 16,
        color: c,
        zIndex: 50,
      }}
    >
      <span>9:41</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* signal */}
        <svg width="18" height="12" viewBox="0 0 18 12">
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={i * 4.6} y={9 - i * 3} width="3.2" height={3 + i * 3} rx="1" fill={c} />
          ))}
        </svg>
        {/* wifi */}
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round">
          <path d="M1.5 4.2a9.5 9.5 0 0 1 13 0M4 6.8a6 6 0 0 1 8 0" />
          <circle cx="8" cy="9.6" r="1.3" fill={c} stroke="none" />
        </svg>
        {/* battery */}
        <svg width="26" height="12" viewBox="0 0 26 12">
          <rect x="0.6" y="0.6" width="22" height="10.8" rx="3.2" fill="none" stroke={c} strokeOpacity="0.4" strokeWidth="1.2" />
          <rect x="2.4" y="2.4" width="17" height="7.2" rx="1.8" fill={c} />
          <rect x="23.8" y="4" width="1.6" height="4" rx="0.8" fill={c} fillOpacity="0.4" />
        </svg>
      </div>
    </div>
  );
};

export const Phone: React.FC<{
  width: number;
  children: React.ReactNode;
  screenBg?: string;
  darkStatus?: boolean;
  style?: React.CSSProperties;
  /** Hide the status bar (e.g. full-bleed camera screens). */
  noStatus?: boolean;
}> = ({ width, children, screenBg = '#FFFFFF', darkStatus, style, noStatus }) => {
  const { bezel, inner, scale, height } = phoneSize(width);
  const screenRadius = 55 * scale;
  return (
    <div
      style={{
        position: 'absolute',
        width,
        height,
        borderRadius: screenRadius + bezel,
        background: 'linear-gradient(145deg, #3A3D44 0%, #15161A 45%, #2A2C31 100%)',
        boxShadow:
          '0 70px 140px -30px rgba(15, 23, 42, 0.45), 0 30px 60px -20px rgba(30, 64, 175, 0.25), inset 0 0 0 2px rgba(255,255,255,0.12)',
        ...style,
      }}
    >
      {/* side buttons */}
      <div style={{ position: 'absolute', left: -4, top: height * 0.2, width: 5, height: height * 0.06, borderRadius: 3, background: '#2A2C31' }} />
      <div style={{ position: 'absolute', left: -4, top: height * 0.28, width: 5, height: height * 0.1, borderRadius: 3, background: '#2A2C31' }} />
      <div style={{ position: 'absolute', right: -4, top: height * 0.25, width: 5, height: height * 0.13, borderRadius: 3, background: '#2A2C31' }} />
      <div
        style={{
          position: 'absolute',
          left: bezel,
          top: bezel,
          width: inner,
          height: height - bezel * 2,
          borderRadius: screenRadius,
          overflow: 'hidden',
          background: screenBg,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: SCREEN_W,
            height: SCREEN_H,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            overflow: 'hidden',
          }}
        >
          {children}
          {!noStatus && <StatusBar dark={darkStatus} />}
          {/* dynamic island */}
          <div
            style={{
              position: 'absolute',
              top: 11,
              left: (SCREEN_W - 124) / 2,
              width: 124,
              height: 36,
              borderRadius: 20,
              background: '#000',
              zIndex: 60,
            }}
          />
          {/* home indicator */}
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              left: (SCREEN_W - 136) / 2,
              width: 136,
              height: 5,
              borderRadius: 3,
              background: darkStatus ? 'rgba(255,255,255,0.85)' : palette.gray[100],
              zIndex: 60,
            }}
          />
        </div>
      </div>
    </div>
  );
};
