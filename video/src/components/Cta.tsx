/** Closing card: logo reveal, tagline, App Store / Google Play badges, rentzor.uz. */
import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { pop, progress } from '../anim';
import { FONT, ink, palette } from '../brand';
import type { Copy } from '../copy/types';
import { LightBg } from './Backgrounds';
import { LogoReveal } from './Logo';

export const Cta: React.FC<{
  copy: Copy;
  /** Speed of the logo reveal (1 = the app's splash timing). */
  speed?: number;
  /** Frames at which the tagline, store badges and URL appear. */
  tagAt?: number;
  badgesAt?: number;
  urlAt?: number;
}> = ({ copy, speed = 1.55, tagAt = 44, badgesAt = 52, urlAt = 62 }) => {
  const f = useCurrentFrame();
  const tag = progress(f, tagAt, 12);
  const url = progress(f, urlAt, 12);
  const badge = (i: number) => pop(f, badgesAt + i * 5, 12, 170);
  return (
    <AbsoluteFill>
      <LightBg />
      <div style={{ position: 'absolute', top: 420, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <LogoReveal frame={f - 2} color={ink} width={820} speed={speed} />
      </div>
      <div style={{ position: 'absolute', top: 960, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontWeight: 600, fontSize: 54, color: palette.gray[60], opacity: tag, transform: `translateY(${(1 - tag) * 24}px)` }}>
        {copy.promo.ctaTagline}
      </div>
      <div style={{ position: 'absolute', top: 1110, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 28 }}>
        <Img src={staticFile('badges/appstore.svg')} style={{ height: 112, transform: `scale(${badge(0)})` }} />
        <Img src={staticFile('badges/googleplay.png')} style={{ height: 112, transform: `scale(${badge(1)})` }} />
      </div>
      <div style={{ position: 'absolute', top: 1290, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 60, color: palette.primary[60], opacity: url }}>
        {copy.promo.url}
      </div>
    </AbsoluteFill>
  );
};
