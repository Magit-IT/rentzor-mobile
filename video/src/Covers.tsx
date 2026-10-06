/**
 * Reel covers (1080×1920). The profile grid crops covers to the centre 3:4
 * (1080×1440, y 240–1680), so everything that matters sits inside that band.
 */
import React from 'react';
import { AbsoluteFill, Img } from 'remotion';
import { icon3d, img } from './assets';
import { colors, FONT, palette, yellow } from './brand';
import { COPIES } from './copy';
import { BlueBg, NavyBg } from './components/Backgrounds';
import { KineticText } from './components/KineticText';
import { Logo } from './components/Logo';
import { Phone } from './components/Phone';
import { HomeR } from './components/Real';

const StaticTile: React.FC<{ name: Parameters<typeof icon3d>[0]; x: number; y: number; size: number; rotate: number }> = ({ name, x, y, size, rotate }) => (
  <div
    style={{
      position: 'absolute',
      left: x - size / 2,
      top: y - size / 2,
      width: size,
      height: size,
      borderRadius: size * 0.26,
      background: '#FFFFFF',
      boxShadow: '0 30px 60px -20px rgba(15,23,42,0.45)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transform: `rotate(${rotate}deg)`,
    }}
  >
    <Img src={icon3d(name)} style={{ width: size * 0.74, height: size * 0.74, objectFit: 'contain' }} />
  </div>
);

export const PromoCover: React.FC<{ lang: string }> = ({ lang }) => {
  const copy = COPIES[lang];
  return (
    <AbsoluteFill>
      <BlueBg drift={false} />
      <div style={{ position: 'absolute', top: 300, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <Logo color="#FFFFFF" width={360} />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 500,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 112,
          letterSpacing: '-0.03em',
          color: '#FFFFFF',
        }}
      >
        {copy.promo.rentA}
      </div>
      <div style={{ position: 'absolute', top: 640, left: 0, right: 0 }}>
        <KineticText lines={[`*${copy.promo.rentB}*`]} frame={100} size={144} mode="pill" hl="#FFFFFF" hlText={colors.primary} />
      </div>
      <Img
        src={img.heroGear}
        style={{ position: 'absolute', width: 980, left: 50, top: 900, filter: 'drop-shadow(0 50px 40px rgba(23,37,84,0.35))' }}
      />
      <div
        style={{
          position: 'absolute',
          top: 1500,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: 56,
          color: 'rgba(255,255,255,0.92)',
        }}
      >
        {copy.promo.rentSub}
      </div>
    </AbsoluteFill>
  );
};

export const ExplainerCover: React.FC<{ lang: string }> = ({ lang }) => {
  const copy = COPIES[lang];
  return (
    <AbsoluteFill>
      <NavyBg />
      <div style={{ position: 'absolute', top: 290, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <Logo color="#FFFFFF" width={340} />
      </div>
      <div style={{ position: 'absolute', top: 460, left: 0, right: 0 }}>
        <KineticText lines={copy.explainer.coverTitle} frame={100} size={104} color="#FFFFFF" hl={yellow} />
      </div>
      <StaticTile name="camera" x={150} y={1010} size={190} rotate={-9} />
      <StaticTile name="gamepad" x={930} y={1060} size={180} rotate={8} />
      <StaticTile name="bike" x={160} y={1420} size={170} rotate={6} />
      <StaticTile name="speakers" x={925} y={1440} size={170} rotate={-7} />
      <Phone width={560} style={{ left: 260, top: 830, transform: 'rotate(-3deg)' }}>
        <HomeR copy={copy} frame={0} />
      </Phone>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1550, height: 370, background: `linear-gradient(180deg, rgba(30,64,175,0) 0%, ${palette.primary[70]} 70%)` }} />
    </AbsoluteFill>
  );
};
