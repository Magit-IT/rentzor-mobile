/**
 * Promo Reel — 25 s, 1080×1920. Seven beats cut on the bar lines of
 * music-promo.wav (120 BPM, 60 frames per bar):
 *
 *   0  hook        "Нужна вещь на пару дней?"
 *   60 drop        "Не покупайте — арендуйте!"
 *  180 home        everything you need, from people nearby (phone)
 *  300 map         find it close to you
 *  420 trust       no deposit / secure payment / MyID
 *  540 owner       flip → rent your things out and earn
 *  660 CTA         logo reveal, rentzor.uz
 */
import React from 'react';
import { AbsoluteFill, Img, interpolate, Sequence, useCurrentFrame } from 'remotion';
import { bob, countUp, easeOut, groupDigits, pop, progress } from '../anim';
import { icon3d, img, productImage } from '../assets';
import { colors, FONT, ink, muted, palette, yellow } from '../brand';
import { COPIES } from '../copy';
import type { Copy } from '../copy/types';
import { BalanceCardUI, NotificationUI } from '../components/AppUI';
import { Cta } from '../components/Cta';
import { HomeScreen } from '../components/Screens';
import { BlueBg, LightBg, NavyBg } from '../components/Backgrounds';
import { CheckRow, PhotoPin, Scaled, Tile3D, UserDot } from '../components/Bits';
import { Icon } from '../components/Icon';
import { KineticText } from '../components/KineticText';
import { Phone, phoneSize } from '../components/Phone';
import { Music, Scene, Sfx } from '../components/Scene';

export const PROMO_FRAMES = 750;

// ------------------------------------------------------------------ 1. hook
const Hook: React.FC<{ copy: Copy }> = ({ copy }) => {
  const f = useCurrentFrame();
  const push = interpolate(f, [0, 60], [1, 1.07]);
  const tiles = [
    { name: 'camera', x: 230, y: 560, r: -8 },
    { name: 'gamepad', x: 850, y: 600, r: 9 },
    { name: 'drone_gopro', x: 545, y: 420, r: -4 },
    { name: 'scooter', x: 215, y: 1370, r: 7 },
    { name: 'speakers', x: 865, y: 1340, r: -7 },
    { name: 'bike', x: 545, y: 1500, r: 3 },
  ] as const;
  return (
    <AbsoluteFill>
      <LightBg />
      <AbsoluteFill style={{ transform: `scale(${push})` }}>
        {tiles.map((t, i) => (
          <Tile3D key={t.name} src={icon3d(t.name)} frame={f} at={-6 + i * 3} x={t.x} y={t.y} rotate={t.r} phase={i * 13} size={i === 2 || i === 5 ? 160 : 190} />
        ))}
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <KineticText lines={copy.promo.hook} frame={f} start={-6} size={118} hl={colors.primary} stagger={3} />
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 2. rent, don't buy
const RentNotBuy: React.FC<{ copy: Copy }> = ({ copy }) => {
  const f = useCurrentFrame(); // local 8 == global 60 (the drop)
  const slam = progress(f, 8, 10, easeOut);
  const hero = pop(f, 16, 14, 120);
  return (
    <AbsoluteFill>
      <BlueBg />
      <div
        style={{
          position: 'absolute',
          top: 300,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 104,
          letterSpacing: '-0.03em',
          color: '#FFFFFF',
          transform: `scale(${1.4 - 0.4 * slam})`,
          opacity: slam,
        }}
      >
        {copy.promo.rentA}
      </div>
      <div style={{ position: 'absolute', top: 440, left: 0, right: 0 }}>
        <KineticText lines={[`*${copy.promo.rentB}*`]} frame={f} start={34} size={136} mode="pill" hl="#FFFFFF" hlText={colors.primary} />
      </div>
      <Img
        src={img.heroGear}
        style={{
          position: 'absolute',
          width: 960,
          left: 60,
          top: 760 + (1 - hero) * 700 + bob(f, 12, 100),
          transform: `rotate(${(1 - hero) * -8}deg)`,
          filter: 'drop-shadow(0 50px 40px rgba(23,37,84,0.35))',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 1390,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: 54,
          color: 'rgba(255,255,255,0.92)',
          opacity: progress(f, 62, 12),
          transform: `translateY(${(1 - progress(f, 62, 12)) * 30}px)`,
        }}
      >
        {copy.promo.rentSub}
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 3. everything nearby (home screen)
const Nearby: React.FC<{ copy: Copy }> = ({ copy }) => {
  const f = useCurrentFrame();
  const rise = pop(f, 4, 16, 110);
  const pw = 640;
  const { height } = phoneSize(pw);
  const side = [
    { name: 'camera2', x: 128, y: 820, r: -10 },
    { name: 'headphones', x: 952, y: 760, r: 8 },
    { name: 'dumbbells', x: 110, y: 1130, r: 6 },
    { name: 'gopro', x: 968, y: 1080, r: -6 },
    { name: 'backpack', x: 140, y: 1440, r: -5 },
    { name: 'kayak', x: 950, y: 1400, r: 7 },
  ] as const;
  return (
    <AbsoluteFill>
      <LightBg />
      <div style={{ position: 'absolute', top: 240, left: 0, right: 0 }}>
        <KineticText lines={copy.promo.nearby} frame={f} start={6} size={92} hl={colors.primary} />
      </div>
      {side.slice(0, 3).map((t, i) => (
        <Tile3D key={t.name} src={icon3d(t.name)} frame={f} at={22 + i * 7} x={t.x} y={t.y} rotate={t.r} size={150} phase={i * 17} />
      ))}
      <Phone width={pw} style={{ left: (1080 - pw) / 2, top: 560 + (1 - rise) * 900 }}>
        <HomeScreen copy={copy} frame={f} />
      </Phone>
      {side.slice(3).map((t, i) => (
        <Tile3D key={t.name} src={icon3d(t.name)} frame={f} at={25 + i * 7} x={t.x} y={t.y} rotate={t.r} size={150} phase={i * 23} />
      ))}
      {/* keep the phone's lower edge from reading as cut-off */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 560 + height - 120, height: 200, background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, #FFFFFF 70%)' }} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 4. map
const MapNearby: React.FC<{ copy: Copy }> = ({ copy }) => {
  const f = useCurrentFrame();
  const zoom = interpolate(f, [0, 130], [1.08, 1.0]);
  const radius = progress(f, 8, 30) * 400;
  const pins = [
    { p: copy.products[0], x: 300, y: 1000, at: 24 },
    { p: copy.products[1], x: 800, y: 1060, at: 39 },
    { p: copy.products[2], x: 330, y: 1480, at: 54 },
    { p: copy.products[3], x: 790, y: 1470, at: 69 },
  ];
  return (
    <AbsoluteFill style={{ background: '#F4F1EC' }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <Img src={img.mapTiles} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.9) 22%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 82%, rgba(255,255,255,0.55) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 540 - radius,
          top: 1230 - radius,
          width: radius * 2,
          height: radius * 2,
          borderRadius: '50%',
          background: 'rgba(60,131,246,0.12)',
          border: '3px solid rgba(60,131,246,0.45)',
        }}
      />
      <UserDot frame={f} x={540} y={1230} at={4} />
      {pins.map(({ p, x, y, at }) => (
        <PhotoPin key={p.key} src={productImage[p.key]} label={p.distance} frame={f} at={at} x={x} y={y} />
      ))}
      <div style={{ position: 'absolute', top: 240, left: 0, right: 0 }}>
        <KineticText lines={copy.promo.map} frame={f} start={4} size={92} hl={colors.primary} />
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 5. trust
const Trust: React.FC<{ copy: Copy }> = ({ copy }) => {
  const f = useCurrentFrame();
  const s = pop(f, 6, 14, 120);
  return (
    <AbsoluteFill>
      <LightBg />
      <div style={{ position: 'absolute', top: 240, left: 0, right: 0 }}>
        <KineticText lines={copy.promo.trust} frame={f} start={4} size={92} mode="marker" hl={yellow} />
      </div>
      <Img
        src={img.heroWallet}
        style={{
          position: 'absolute',
          width: 820,
          left: 130,
          top: 560 + bob(f, 10, 90),
          transform: `scale(${0.75 + 0.25 * s})`,
          opacity: Math.min(1, s * 1.5),
          filter: 'drop-shadow(0 40px 36px rgba(30,64,175,0.22))',
        }}
      />
      <div style={{ position: 'absolute', top: 1090, left: 100, display: 'flex', flexDirection: 'column', gap: 26 }}>
        {copy.promo.trustChips.map((c, i) => (
          <CheckRow key={c} text={c} frame={f} at={30 + i * 15} width={880} size={40} icon={(['wallet', 'lock', 'id'] as const)[i]} tone={[palette.green[60], colors.primary, palette.violet[60]][i]} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 6. owner
const Owner: React.FC<{ copy: Copy }> = ({ copy }) => {
  const f = useCurrentFrame();
  const card = pop(f, 24, 14, 140);
  const amount = countUp(f, 34, 46, 2450000, 5000);
  const n1 = pop(f, 50, 14, 150);
  const n2 = pop(f, 68, 14, 150);
  const sc = 2.35;
  return (
    <AbsoluteFill>
      <NavyBg />
      <div
        style={{
          position: 'absolute',
          top: 236,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 64,
          color: 'rgba(255,255,255,0.75)',
          opacity: progress(f, 4, 10),
          transform: `translateY(${(1 - progress(f, 4, 10)) * 24}px)`,
        }}
      >
        {copy.promo.ownerQ}
      </div>
      <div style={{ position: 'absolute', top: 330, left: 0, right: 0 }}>
        <KineticText lines={copy.promo.owner} frame={f} start={14} size={100} color="#FFFFFF" mode="marker" hl={yellow} hlText={ink} />
      </div>
      <Scaled scale={sc} width={353} style={{ left: (1080 - 353 * sc) / 2, top: 640, transform: `translateY(${(1 - card) * 300}px) scale(${0.85 + 0.15 * card})`, opacity: Math.min(1, card * 1.5) }}>
        <BalanceCardUI label={copy.promo.ownerIncomeLabel} amount={`${groupDigits(amount)} ${copy.currency}`} buttons={[copy.ui.withdraw, copy.ui.topUp]} />
      </Scaled>
      <div style={{ position: 'absolute', left: (1080 - 361 * sc) / 2, top: 1060, transform: `translateY(${(1 - n1) * -80}px)`, opacity: Math.min(1, n1 * 1.6) }}>
        <NotificationUI title={copy.ui.newRequestTitle} body={copy.ui.newRequestBody} time={copy.ui.now} scale={sc} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: (1080 - 361 * sc) / 2,
          top: 1290,
          width: 361 * sc,
          padding: '30px 34px',
          borderRadius: 56,
          background: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          gap: 26,
          boxShadow: '0 30px 60px -20px rgba(0,0,0,0.45)',
          transform: `translateY(${(1 - n2) * 120}px)`,
          opacity: Math.min(1, n2 * 1.6),
        }}
      >
        <div style={{ width: 92, height: 92, borderRadius: 46, background: palette.green[0], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="wallet" size={50} color={palette.green[60]} stroke={2.2} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 38, color: ink }}>{copy.ui.rentalIncome}</div>
          <div style={{ fontFamily: FONT, fontWeight: 400, fontSize: 32, color: muted }}>{copy.products[0].title}</div>
        </div>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 42, color: palette.green[60], whiteSpace: 'nowrap' }}>+{groupDigits(675000)}</div>
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ composition
export const Promo: React.FC<{ lang: string }> = ({ lang }) => {
  const copy = COPIES[lang];
  return (
  <AbsoluteFill style={{ background: palette.primary[100] }}>
    <Music file="music-promo.wav" volume={0.62} />

    <Sequence from={0} durationInFrames={62}>
      <Scene duration={62}>
        <Hook copy={copy} />
      </Scene>
    </Sequence>
    <Sequence from={52} durationInFrames={138}>
      <Scene duration={138} enter="circle" enterFrames={8}>
        <RentNotBuy copy={copy} />
      </Scene>
    </Sequence>
    <Sequence from={180} durationInFrames={130}>
      <Scene duration={130} enter="slideUp" enterFrames={10}>
        <Nearby copy={copy} />
      </Scene>
    </Sequence>
    <Sequence from={300} durationInFrames={130}>
      <Scene duration={130} enter="zoomIn" enterFrames={10}>
        <MapNearby copy={copy} />
      </Scene>
    </Sequence>
    <Sequence from={420} durationInFrames={120}>
      <Scene duration={120} enter="circle" enterFrames={10} origin={[540, 1230]} exit="flipOut" exitFrames={8}>
        <Trust copy={copy} />
      </Scene>
    </Sequence>
    <Sequence from={540} durationInFrames={130}>
      <Scene duration={130} enter="flipIn" enterFrames={10}>
        <Owner copy={copy} />
      </Scene>
    </Sequence>
    <Sequence from={660} durationInFrames={90}>
      <Scene duration={90} enter="circle" enterFrames={10}>
        <Cta copy={copy} />
      </Scene>
    </Sequence>

    {/* sound design (absolute frames) */}
    {[4, 8, 12, 16, 20, 24].map((at) => (
      <Sfx key={`p${at}`} name="pop" at={at} volume={0.22} />
    ))}
    <Sfx name="whoosh" at={46} volume={0.45} />
    <Sfx name="impact" at={60} volume={0.55} />
    <Sfx name="whoosh" at={84} volume={0.35} />
    <Sfx name="pop" at={115} volume={0.3} />
    <Sfx name="whoosh" at={178} volume={0.4} />
    <Sfx name="swipe" at={224} volume={0.35} />
    <Sfx name="whoosh" at={298} volume={0.35} />
    {[324, 339, 354, 369].map((at) => (
      <Sfx key={`m${at}`} name="pop" at={at} volume={0.35} />
    ))}
    <Sfx name="whoosh" at={418} volume={0.35} />
    {[450, 465, 480].map((at) => (
      <Sfx key={`t${at}`} name="pop" at={at} volume={0.32} />
    ))}
    <Sfx name="success" at={482} volume={0.35} />
    <Sfx name="flip" at={532} volume={0.5} />
    <Sfx name="coins" at={574} volume={0.4} />
    <Sfx name="notify" at={590} volume={0.45} />
    <Sfx name="pop" at={608} volume={0.3} />
    <Sfx name="whoosh" at={656} volume={0.35} />
    <Sfx name="impact" at={662} volume={0.35} />
    <Sfx name="success" at={718} volume={0.4} />
  </AbsoluteFill>
  );
};
