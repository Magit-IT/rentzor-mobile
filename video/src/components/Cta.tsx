/** Closing card: logo reveal, tagline, rentzor.uz pill and "link in bio". */
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { pop, progress } from '../anim';
import { FONT, GRADIENT, ink, muted, palette } from '../brand';
import type { Copy } from '../copy/types';
import { LightBg } from './Backgrounds';
import { Icon } from './Icon';
import { LogoReveal } from './Logo';

export const Cta: React.FC<{
  copy: Copy;
  /** Speed of the logo reveal (1 = the app's splash timing). */
  speed?: number;
  /** Frames at which the tagline, URL pill and "link in bio" appear. */
  tagAt?: number;
  pillAt?: number;
  bioAt?: number;
}> = ({ copy, speed = 1.55, tagAt = 50, pillAt = 58, bioAt = 66 }) => {
  const f = useCurrentFrame();
  const tag = progress(f, tagAt, 12);
  const pill = pop(f, pillAt, 12, 170);
  const bio = progress(f, bioAt, 12);
  return (
    <AbsoluteFill>
      <LightBg />
      <div style={{ position: 'absolute', top: 470, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <LogoReveal frame={f - 2} color={ink} width={820} speed={speed} />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1010,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: 54,
          color: palette.gray[60],
          opacity: tag,
          transform: `translateY(${(1 - tag) * 24}px)`,
        }}
      >
        {copy.promo.ctaTagline}
      </div>
      <div style={{ position: 'absolute', top: 1140, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            padding: '30px 70px',
            borderRadius: 999,
            background: GRADIENT,
            color: '#FFFFFF',
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 66,
            letterSpacing: '-0.01em',
            boxShadow: '0 30px 60px -20px rgba(47,120,238,0.65)',
            transform: `scale(${pill})`,
          }}
        >
          {copy.promo.url}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1330,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 14,
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: 42,
          color: muted,
          opacity: bio,
        }}
      >
        <Icon name="arrowUp" size={42} color={muted} stroke={2.4} />
        {copy.promo.linkInBio}
      </div>
    </AbsoluteFill>
  );
};
