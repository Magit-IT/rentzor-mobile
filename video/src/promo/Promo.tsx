/**
 * Promo Reel — 25 s, 1080×1920, cut on the bar lines of music-promo.wav
 * (120 BPM, 60 frames per bar):
 *
 *    0  hook       "Нужна вещь на пару дней?"
 *   60  drop       "Не покупайте — арендуйте!"
 *  180  nearby     home screen — distance on every card
 *  300  address    approximate area before booking → exact place after
 *  420  trust      everyone verified via MyID, photos, compensation
 *  540  owner      flip → rent things out, owner dashboard
 *  660  CTA        logo + sound logo, App Store / Google Play, rentzor.uz
 */
import React from 'react';
import { AbsoluteFill, Img, interpolate, Sequence, useCurrentFrame } from 'remotion';
import { bob, easeOut, pop, progress } from '../anim';
import { icon3d, img } from '../assets';
import { colors, FONT, ink, palette, yellow } from '../brand';
import { COPIES } from '../copy';
import type { Copy } from '../copy/types';
import { NotificationUI } from '../components/AppUI';
import { BlueBg, LightBg, NavyBg } from '../components/Backgrounds';
import { CheckRow, Tile3D } from '../components/Bits';
import { Cta } from '../components/Cta';
import { Icon } from '../components/Icon';
import { KineticText } from '../components/KineticText';
import { Phone } from '../components/Phone';
import { DashboardR, HomeR, ItemPageR } from '../components/Real';
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

// ------------------------------------------------------------------ shared
/** Label chip that sits next to the phone. */
export const SideChip: React.FC<{ frame: number; at: number; until?: number; x: number; y: number; icon: React.ReactNode; text: string; tone?: string }> = ({
  frame,
  at,
  until,
  x,
  y,
  icon,
  text,
  tone = colors.primary,
}) => {
  const s = pop(frame, at, 13, 170) * (until === undefined ? 1 : 1 - progress(frame, until, 8));
  if (s <= 0.001) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y + bob(frame, 6, 90, at),
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '20px 28px 20px 20px',
        borderRadius: 999,
        background: '#FFFFFF',
        boxShadow: '0 30px 60px -22px rgba(15,23,42,0.45), 0 6px 14px rgba(15,23,42,0.08)',
        transform: `scale(${s})`,
        transformOrigin: 'left center',
        zIndex: 30,
      }}
    >
      <div style={{ width: 58, height: 58, borderRadius: 29, background: tone, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 38, color: ink, whiteSpace: 'nowrap' }}>{text}</div>
    </div>
  );
};

const PW = 640;

// ------------------------------------------------------------------ 3. nearby (distance on cards)
const Nearby: React.FC<{ copy: Copy }> = ({ copy }) => {
  const f = useCurrentFrame();
  const rise = pop(f, 4, 16, 110);
  return (
    <AbsoluteFill>
      <LightBg />
      <div style={{ position: 'absolute', top: 240, left: 0, right: 0 }}>
        <KineticText lines={copy.promo.nearby} frame={f} start={6} size={96} hl={colors.primary} />
      </div>
      <Tile3D src={icon3d('camera2')} frame={f} at={24} x={120} y={760} rotate={-9} size={150} />
      <Tile3D src={icon3d('headphones')} frame={f} at={30} x={960} y={720} rotate={8} size={150} />
      <Phone width={PW} style={{ left: (1080 - PW) / 2, top: 540 + (1 - rise) * 900 }}>
        <HomeR copy={copy} frame={f} highlightAt={36} scrollAt={78} />
      </Phone>
      <SideChip frame={f} at={40} x={30} y={1520} icon={<Icon name="pin" size={32} color="#fff" stroke={2.2} />} text={copy.promo.nearbyChip} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 4. approximate → exact address
const Address: React.FC<{ copy: Copy }> = ({ copy }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <LightBg />
      <div style={{ position: 'absolute', top: 240, left: 0, right: 0 }}>
        <KineticText lines={copy.promo.address} frame={f} start={4} size={92} hl={colors.primary} />
      </div>
      <Phone width={PW} style={{ left: (1080 - PW) / 2, top: 540 }}>
        <ItemPageR copy={copy} frame={f} booked={false} switchAt={58} />
      </Phone>
      <SideChip frame={f} at={14} until={56} x={30} y={1590} tone={palette.violet[60]} icon={<Icon name="map" size={30} color="#fff" stroke={2} />} text={copy.promo.before} />
      <SideChip frame={f} at={62} x={30} y={1630} tone={colors.critical} icon={<Icon name="pin" size={32} color="#fff" stroke={2.2} />} text={copy.promo.after} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 5. trust: MyID for everyone
const Person: React.FC<{ frame: number; at: number; src: string; name: string; role: string; badge: string }> = ({ frame, at, src, name, role, badge }) => {
  const s = pop(frame, at, 13, 150);
  return (
    <div
      style={{
        width: 420,
        padding: '34px 20px 30px',
        borderRadius: 48,
        background: '#fff',
        boxShadow: '0 30px 60px -24px rgba(30,64,175,0.35)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        transform: `translateY(${(1 - s) * 120}px) scale(${0.85 + 0.15 * s})`,
        opacity: Math.min(1, s * 1.5),
      }}
    >
      <div style={{ position: 'relative' }}>
        <Img src={src} style={{ width: 170, height: 170, borderRadius: 85, objectFit: 'cover' }} />
        <div style={{ position: 'absolute', right: -4, bottom: -4, width: 58, height: 58, borderRadius: 29, background: palette.primary[60], border: '6px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${pop(frame, at + 12, 10, 200)})` }}>
          <Icon name="check" size={30} color="#fff" stroke={3.2} />
        </div>
      </div>
      <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 42, color: ink }}>{name}</div>
      <div style={{ fontFamily: FONT, fontWeight: 500, fontSize: 30, color: palette.gray[50] }}>{role}</div>
      <div style={{ padding: '8px 18px', borderRadius: 999, background: palette.primary[0], border: `2px solid ${palette.primary[10]}`, fontFamily: FONT, fontWeight: 600, fontSize: 28, color: palette.primary[60] }}>{badge}</div>
    </div>
  );
};

const Trust: React.FC<{ copy: Copy }> = ({ copy }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <LightBg />
      <div style={{ position: 'absolute', top: 240, left: 0, right: 0 }}>
        <KineticText lines={copy.promo.trust} frame={f} start={4} size={92} mode="marker" hl={yellow} />
      </div>
      <div style={{ position: 'absolute', top: 500, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 40 }}>
        <Person frame={f} at={10} src={img.avatarMalika} name={copy.renterName} role={copy.ui.renter} badge={copy.ui.myIdVerified} />
        <Person frame={f} at={18} src={img.avatarDoston} name={copy.ownerName} role={copy.ui.owner} badge={copy.ui.myIdVerified} />
      </div>
      <div style={{ position: 'absolute', top: 1010, left: 90, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {copy.promo.trustRows.map((t, i) => (
          <CheckRow key={t} text={t} frame={f} at={40 + i * 15} icon={(['id', 'camera', 'shield'] as const)[i]} width={900} size={38} tone={[palette.primary[60], palette.orange[60], palette.green[60]][i]} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 6. owner
const Owner: React.FC<{ copy: Copy }> = ({ copy }) => {
  const f = useCurrentFrame();
  const rise = pop(f, 10, 16, 110);
  const n = pop(f, 66, 14, 160);
  const it = copy.nearbyItems[0];
  return (
    <AbsoluteFill>
      <NavyBg />
      <div style={{ position: 'absolute', top: 236, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 64, color: 'rgba(255,255,255,0.75)', opacity: progress(f, 4, 10) }}>
        {copy.promo.ownerQ}
      </div>
      <div style={{ position: 'absolute', top: 330, left: 0, right: 0 }}>
        <KineticText lines={copy.promo.owner} frame={f} start={14} size={100} color="#FFFFFF" mode="marker" hl={yellow} hlText={ink} />
      </div>
      <Phone width={600} style={{ left: 240, top: 640 + (1 - rise) * 1000 }}>
        <DashboardR copy={copy} frame={f} countAt={26} />
      </Phone>
      <div style={{ position: 'absolute', left: (1080 - 361 * 2.3) / 2, top: 600 + (1 - n) * -200, opacity: Math.min(1, n * 1.5), zIndex: 40 }}>
        <NotificationUI title={copy.ui.newRequestTitle} body={`${copy.ui.newRequestPrefix} «${it.title}»`} time={copy.ui.justNow} scale={2.3} />
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ composition
export const Promo: React.FC<{ lang: string }> = ({ lang }) => {
  const copy = COPIES[lang];
  return (
    <AbsoluteFill style={{ background: palette.primary[100] }}>
      <Music file="music-promo.wav" volume={0.55} />

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
        <Scene duration={130} enter="slideUp" enterFrames={10} exit="pushLeft" exitFrames={10}>
          <Nearby copy={copy} />
        </Scene>
      </Sequence>
      <Sequence from={300} durationInFrames={130}>
        <Scene duration={130} enter="pushLeft" enterFrames={10}>
          <Address copy={copy} />
        </Scene>
      </Sequence>
      <Sequence from={420} durationInFrames={120}>
        <Scene duration={120} enter="circle" enterFrames={10} exit="flipOut" exitFrames={8}>
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
      {[0, 3, 6, 9, 12].map((at) => (
        <Sfx key={`p${at}`} name="pop" at={at} volume={0.2} />
      ))}
      <Sfx name="whoosh" at={46} volume={0.4} />
      <Sfx name="impact" at={60} volume={0.45} />
      <Sfx name="whoosh" at={84} volume={0.3} />
      <Sfx name="pop" at={115} volume={0.28} />
      <Sfx name="whoosh" at={178} volume={0.35} />
      <Sfx name="pop" at={216} volume={0.3} />
      <Sfx name="pop" at={220} volume={0.3} />
      <Sfx name="swipe" at={258} volume={0.3} />
      <Sfx name="swipe" at={298} volume={0.3} />
      <Sfx name="pop" at={314} volume={0.3} />
      <Sfx name="whoosh" at={356} volume={0.3} />
      <Sfx name="pop" at={364} volume={0.35} />
      <Sfx name="whoosh" at={418} volume={0.3} />
      <Sfx name="pop" at={430} volume={0.28} />
      <Sfx name="pop" at={438} volume={0.28} />
      <Sfx name="success" at={442} volume={0.3} />
      {[460, 475, 490].map((at) => (
        <Sfx key={`t${at}`} name="pop" at={at} volume={0.3} />
      ))}
      <Sfx name="flip" at={532} volume={0.45} />
      <Sfx name="coins" at={566} volume={0.35} />
      <Sfx name="notify" at={606} volume={0.45} />
      <Sfx name="whoosh" at={656} volume={0.3} />
      <Sfx name="logo" at={690} volume={0.6} />
    </AbsoluteFill>
  );
};
