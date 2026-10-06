/**
 * Explainer Reel — 87 s, 1080×1920, cut on the bar lines of
 * music-explainer.wav (120 BPM, 60 frames per bar).
 *
 *     0  intro        logo reveal (the app's splash timing), "Как это работает?"
 *   180  two sides    rent what you need / rent out what you don't
 *   300  MyID         everyone verifies first (renters and owners)
 *   420  chapter 1    "Как арендовать"
 *   480  step 1       nearby items with distance, distance filter
 *   720  step 2       dates + pickup/return time
 *   900  step 3       pay from balance, terms + rental contract
 *  1140  step 4       approximate area → exact address after booking
 *  1320  step 5       photos at pickup
 *  1500  chapter 2    flip → "Как сдавать и зарабатывать"
 *  1560  step 1       owner mode → new listing
 *  1800  step 2       new request → order → "Передал товар"
 *  2040  step 3       dashboard → withdraw
 *  2280  trust        why it's safe
 *  2460  CTA          logo + sound logo, store badges
 */
import React from 'react';
import { AbsoluteFill, Img, Sequence, useCurrentFrame } from 'remotion';
import { bob, easeOut, pop, progress } from '../anim';
import { icon3d, img } from '../assets';
import { colors, FONT, GRADIENT, ink, muted, NAVY_GRADIENT, palette, yellow } from '../brand';
import { COPIES } from '../copy';
import type { Copy, Lines } from '../copy/types';
import { AvatarUI } from '../components/AppUI';
import { BlueBg, LightBg, NavyBg, WavePattern } from '../components/Backgrounds';
import { CheckRow, Tile3D } from '../components/Bits';
import { Cta } from '../components/Cta';
import { Icon } from '../components/Icon';
import { Kicker, KineticText } from '../components/KineticText';
import { LogoReveal } from '../components/Logo';
import { Phone } from '../components/Phone';
import { Music, Scene, Sfx } from '../components/Scene';
import {
  DashboardR,
  DatePickerR,
  FilterSheetR,
  HomeR,
  ItemPageR,
  MyIdR,
  NewListingR,
  NotificationsR,
  OrderR,
  OwnerProfileR,
  PaymentR,
  PickupR,
  RenterProfileR,
} from '../components/Real';
import { SideChip } from '../promo/Promo';

export const EXPLAINER_FRAMES = 2610;

const PHONE = { width: 600, left: 240, top: 640 };

// ------------------------------------------------------------------ shared layout
/**
 * Camera move: lift the phone by PAN px between [from, to) so taps on its
 * bottom buttons stay clear of Instagram's caption overlay.
 */
const PAN = 320;
const panFor = (frame: number, windows: [number, number][]) =>
  windows.reduce((acc, [a, b]) => acc + PAN * (progress(frame, a, 14, easeOut) - progress(frame, b, 14, easeOut)), 0);

const StepHead: React.FC<{ frame: number; step: string; title: Lines; sub: string; dark?: boolean; pan?: number }> = ({
  frame,
  step,
  title,
  sub,
  dark,
  pan = 0,
}) => (
  <div style={{ position: 'absolute', inset: 0, opacity: 1 - pan / PAN, transform: `translateY(${(-pan / PAN) * 70}px)` }}>
    <div style={{ position: 'absolute', top: 226, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
      <Kicker
        text={step}
        frame={frame}
        start={2}
        bg={dark ? 'rgba(255,255,255,0.14)' : colors.primary}
        color="#FFFFFF"
        size={32}
      />
    </div>
    <div style={{ position: 'absolute', top: 300, left: 0, right: 0 }}>
      <KineticText lines={title} frame={frame} start={6} size={86} color={dark ? '#FFFFFF' : ink} hl={dark ? yellow : colors.primary} />
    </div>
    <div
      style={{
        position: 'absolute',
        top: 508,
        left: 80,
        right: 80,
        textAlign: 'center',
        fontFamily: FONT,
        fontWeight: 500,
        fontSize: 38,
        lineHeight: 1.25,
        color: dark ? 'rgba(255,255,255,0.75)' : muted,
        opacity: progress(frame, 16, 12),
        transform: `translateY(${(1 - progress(frame, 16, 12)) * 20}px)`,
      }}
    >
      {sub}
    </div>
  </div>
);

/** Everything that moves with the phone during a camera pan. */
const PanGroup: React.FC<{ pan: number; children: React.ReactNode }> = ({ pan, children }) => (
  <div style={{ position: 'absolute', inset: 0, transform: `translateY(${-pan}px)` }}>{children}</div>
);

/** Phone that rises in, with a list of screens that slide in from the right. */
const StepPhone: React.FC<{
  frame: number;
  screens: { from: number; node: React.ReactNode }[];
  dark?: boolean;
  screenBg?: string;
  /** Rise in from below (first step of a chapter); later steps start in place. */
  rises?: boolean;
}> = ({ frame, screens, dark, screenBg, rises = false }) => {
  const rise = rises ? pop(frame, 4, 16, 110) : 1;
  return (
    <Phone width={PHONE.width} screenBg={screenBg} darkStatus={dark} style={{ left: PHONE.left, top: PHONE.top + (1 - rise) * 1000 }}>
      {screens.map((s, i) => {
        const next = screens[i + 1];
        if (frame < s.from - 1 || (next && frame > next.from + 12)) return null;
        const p = i === 0 ? 1 : progress(frame, s.from, 12, easeOut);
        const leave = next ? progress(frame, next.from, 12, easeOut) : 0;
        return (
          <div key={i} style={{ position: 'absolute', inset: 0, transform: `translateX(${(1 - p) * 393 - leave * 110}px)`, zIndex: i }}>
            {s.node}
          </div>
        );
      })}
    </Phone>
  );
};



// ------------------------------------------------------------------ E1 intro
const Intro: React.FC<{ copy: Copy }> = ({ copy }) => {
  const f = useCurrentFrame();
  const tag = progress(f, 62, 12);
  const tiles = [
    { name: 'camera', x: 190, y: 380, r: -8 },
    { name: 'gamepad', x: 890, y: 400, r: 8 },
    { name: 'drone_gopro', x: 180, y: 1500, r: 6 },
    { name: 'bike', x: 880, y: 1480, r: -6 },
  ] as const;
  return (
    <AbsoluteFill>
      <LightBg />
      {tiles.map((t, i) => (
        <Tile3D key={t.name} src={icon3d(t.name)} frame={f} at={66 + i * 4} x={t.x} y={t.y} rotate={t.r} size={170} phase={i * 19} />
      ))}
      <div style={{ position: 'absolute', top: 470, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <LogoReveal frame={f + 4} color={ink} width={820} speed={1.4} />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1000,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: 52,
          color: palette.gray[60],
          opacity: tag,
          transform: `translateY(${(1 - tag) * 24}px)`,
        }}
      >
        {copy.explainer.intro}
      </div>
      <div style={{ position: 'absolute', top: 1120, left: 0, right: 0 }}>
        <KineticText lines={[copy.explainer.question]} frame={f} start={84} size={96} mode="marker" hl={yellow} />
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ E2 two sides
const SideCard: React.FC<{
  frame: number;
  at: number;
  from: 'left' | 'right';
  bg: string;
  avatar: string;
  name: string;
  title: string;
  sub: string;
  icons: string[];
  top: number;
}> = ({ frame, at, from, bg, avatar, name, title, sub, icons, top }) => {
  const s = pop(frame, at, 15, 130);
  const dx = (1 - s) * (from === 'left' ? -1100 : 1100);
  return (
    <div
      style={{
        position: 'absolute',
        left: 70,
        right: 70,
        top,
        height: 560,
        borderRadius: 64,
        background: bg,
        overflow: 'hidden',
        transform: `translateX(${dx}px) rotate(${(1 - s) * (from === 'left' ? -4 : 4)}deg)`,
        boxShadow: '0 40px 80px -30px rgba(15,23,42,0.5)',
        padding: 56,
      }}
    >
      <WavePattern width={1300} opacity={0.08} style={{ position: 'absolute', left: -300, top: 120, transform: 'rotate(-28deg)' }} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 24 }}>
        <AvatarUI src={avatar} size={120} ring="rgba(255,255,255,0.9)" />
        <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 40, color: 'rgba(255,255,255,0.85)' }}>{name}</div>
      </div>
      <div style={{ position: 'relative', marginTop: 34, fontFamily: FONT, fontWeight: 800, fontSize: 104, letterSpacing: '-0.03em', color: '#FFFFFF', lineHeight: 1 }}>
        {title}
      </div>
      <div style={{ position: 'relative', marginTop: 20, width: 600, fontFamily: FONT, fontWeight: 500, fontSize: 40, lineHeight: 1.28, color: 'rgba(255,255,255,0.88)' }}>
        {sub}
      </div>
      {icons.map((src, i) => {
        const t = pop(frame, at + 14 + i * 5, 12, 170);
        return (
          <div
            key={src}
            style={{
              position: 'absolute',
              right: 44 + (i % 2) * 34,
              top: 46 + i * 150,
              width: 132,
              height: 132,
              borderRadius: 36,
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `scale(${t}) rotate(${(i % 2 ? 6 : -6) * t}deg)`,
              boxShadow: '0 20px 40px -16px rgba(0,0,0,0.4)',
            }}
          >
            <Img src={src} style={{ width: 98, height: 98, objectFit: 'contain' }} />
          </div>
        );
      })}
    </div>
  );
};

const TwoSides: React.FC<{ copy: Copy }> = ({ copy }) => {
  const f = useCurrentFrame();
  const ex = copy.explainer;
  return (
    <AbsoluteFill>
      <LightBg />
      <SideCard
        frame={f}
        at={1}
        from="left"
        bg={GRADIENT}
        avatar={img.avatarMalika}
        name={copy.renterName}
        title={ex.renterSide.title}
        sub={ex.renterSide.sub}
        icons={[icon3d('camera'), icon3d('drone_gopro'), icon3d('gamepad')]}
        top={290}
      />
      <SideCard
        frame={f}
        at={22}
        from="right"
        bg={NAVY_GRADIENT}
        avatar={img.avatarDoston}
        name={copy.ownerName}
        title={ex.ownerSide.title}
        sub={ex.ownerSide.sub}
        icons={[icon3d('speakers'), icon3d('bike'), icon3d('laptop')]}
        top={900}
      />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ chapter cards
const Chapter: React.FC<{ copy: Copy; owner?: boolean }> = ({ copy, owner }) => {
  const f = useCurrentFrame();
  const ch = owner ? copy.explainer.ownerChapter : copy.explainer.renterChapter;
  const av = pop(f, 2, 13, 150);
  return (
    <AbsoluteFill>
      {owner ? <NavyBg /> : <BlueBg />}
      <div style={{ position: 'absolute', top: 470, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${av})` }}>
        <AvatarUI src={owner ? img.avatarDoston : img.avatarMalika} size={210} ring="rgba(255,255,255,0.9)" />
      </div>
      <div style={{ position: 'absolute', top: 730, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <Kicker text={ch.kicker} frame={f} start={6} bg="#FFFFFF" color={owner ? palette.primary[80] : colors.primary} size={38} />
      </div>
      <div style={{ position: 'absolute', top: 830, left: 0, right: 0 }}>
        <KineticText lines={ch.title} frame={f} start={10} size={owner ? 104 : 120} color="#FFFFFF" hl={yellow} />
      </div>
      <div
        style={{
          position: 'absolute',
          top: owner ? 1100 : 1120,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: 44,
          color: 'rgba(255,255,255,0.8)',
          opacity: progress(f, 22, 10),
        }}
      >
        {ch.steps}
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ MyID for everyone
const MyIdStep: React.FC<{ copy: Copy }> = ({ copy }) => {
  const f = useCurrentFrame();
  const ex = copy.explainer;
  return (
    <AbsoluteFill>
      <LightBg />
      <StepHead frame={f} step="MyID" title={ex.myid.title} sub={ex.myid.sub} />
      <StepPhone frame={f} rises dark screenBg="#0B0F1A" screens={[{ from: 0, node: <MyIdR copy={copy} frame={f} scanAt={22} doneAt={86} name="renter" /> }]} />
      <SideChip frame={f} at={94} x={24} y={1180} tone={palette.primary[60]} icon={<Icon name="user" size={30} color="#fff" stroke={2} />} text={copy.ui.renter} />
      <SideChip frame={f} at={100} x={24} y={1320} tone={palette.violet[60]} icon={<Icon name="box" size={30} color="#fff" stroke={2} />} text={copy.ui.owner} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ renter steps
const R1Find: React.FC<{ copy: Copy }> = ({ copy }) => {
  const f = useCurrentFrame();
  const ex = copy.explainer;
  const pan = panFor(f, [[168, 236]]);
  return (
    <AbsoluteFill>
      <LightBg />
      <StepHead frame={f} step={ex.step(1)} title={ex.r1.title} sub={ex.r1.sub} pan={pan} />
      <PanGroup pan={pan}>
        <StepPhone
          frame={f}
          rises
          screens={[
            {
              from: 0,
              node: (
                <>
                  <HomeR copy={copy} frame={f} highlightAt={40} scrollAt={64} />
                  <FilterSheetR copy={copy} frame={f} at={124} typeAt={152} applyAt={196} />
                </>
              ),
            },
          ]}
        />
        <SideChip frame={f} at={46} until={116} x={24} y={1560} icon={<Icon name="pin" size={32} color="#fff" stroke={2.2} />} text={copy.promo.nearbyChip} />
      </PanGroup>
    </AbsoluteFill>
  );
};

const R2Dates: React.FC<{ copy: Copy }> = ({ copy }) => {
  const f = useCurrentFrame();
  const ex = copy.explainer;
  const pan = panFor(f, [[124, 9999]]);
  return (
    <AbsoluteFill>
      <LightBg />
      <StepHead frame={f} step={ex.step(2)} title={ex.r2.title} sub={ex.r2.sub} pan={pan} />
      <PanGroup pan={pan}>
        <StepPhone frame={f} screens={[{ from: 0, node: <DatePickerR copy={copy} frame={f} startTap={40} endTap={66} bookTap={150} /> }]} />
      </PanGroup>
    </AbsoluteFill>
  );
};

const R3Pay: React.FC<{ copy: Copy }> = ({ copy }) => {
  const f = useCurrentFrame();
  const ex = copy.explainer;
  const pan = panFor(f, [[40, 196]]);
  return (
    <AbsoluteFill>
      <LightBg />
      <StepHead frame={f} step={ex.step(3)} title={ex.r3.title} sub={ex.r3.sub} pan={pan} />
      <PanGroup pan={pan}>
        <StepPhone frame={f} screens={[{ from: 0, node: <PaymentR copy={copy} frame={f} payTap={58} sheetAt={66} checkTap={128} confirmTap={158} doneAt={168} /> }]} />
      </PanGroup>
    </AbsoluteFill>
  );
};

const R4Address: React.FC<{ copy: Copy }> = ({ copy }) => {
  const f = useCurrentFrame();
  const ex = copy.explainer;
  return (
    <AbsoluteFill>
      <LightBg />
      <StepHead frame={f} step={ex.step(4)} title={ex.r4.title} sub={ex.r4.sub} />
      <StepPhone frame={f} screens={[{ from: 0, node: <ItemPageR copy={copy} frame={f} booked={false} switchAt={92} /> }]} />
      <SideChip frame={f} at={24} until={88} x={24} y={1640} tone={palette.violet[60]} icon={<Icon name="map" size={30} color="#fff" stroke={2} />} text={copy.promo.before} />
      <SideChip frame={f} at={98} x={24} y={1680} tone={colors.critical} icon={<Icon name="pin" size={32} color="#fff" stroke={2.2} />} text={copy.promo.after} />
    </AbsoluteFill>
  );
};

const R5Photos: React.FC<{ copy: Copy }> = ({ copy }) => {
  const f = useCurrentFrame();
  const ex = copy.explainer;
  const pan = panFor(f, [[70, 138]]);
  return (
    <AbsoluteFill>
      <LightBg />
      <StepHead frame={f} step={ex.step(5)} title={ex.r5.title} sub={ex.r5.sub} pan={pan} />
      <PanGroup pan={pan}>
        <StepPhone frame={f} screens={[{ from: 0, node: <PickupR copy={copy} frame={f} shots={[28, 42, 56]} acceptAt={90} /> }]} />
      </PanGroup>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ owner steps
const O1Listing: React.FC<{ copy: Copy }> = ({ copy }) => {
  const f = useCurrentFrame();
  const ex = copy.explainer;
  const pan = panFor(f, [[184, 9999]]);
  return (
    <AbsoluteFill>
      <NavyBg />
      <StepHead frame={f} step={ex.step(1)} title={ex.o1.title} sub={ex.o1.sub} dark pan={pan} />
      <PanGroup pan={pan}>
        <StepPhone
          frame={f}
          rises
          screens={[
            { from: 0, node: <RenterProfileR copy={copy} frame={f} tapAt={42} /> },
            { from: 56, node: <NewListingR copy={copy} frame={f} nameAt={78} addrAt={132} nextAt={206} /> },
          ]}
        />
      </PanGroup>
    </AbsoluteFill>
  );
};

const O2Order: React.FC<{ copy: Copy }> = ({ copy }) => {
  const f = useCurrentFrame();
  const ex = copy.explainer;
  const pan = panFor(f, [[160, 9999]]);
  return (
    <AbsoluteFill>
      <NavyBg />
      <StepHead frame={f} step={ex.step(2)} title={ex.o2.title} sub={ex.o2.sub} dark pan={pan} />
      <PanGroup pan={pan}>
        <StepPhone
          frame={f}
          screens={[
            { from: 0, node: <NotificationsR copy={copy} frame={f} newAt={12} tapAt={52} /> },
            { from: 62, node: <OrderR copy={copy} frame={f} handTap={182} doneAt={192} /> },
          ]}
        />
      </PanGroup>
    </AbsoluteFill>
  );
};

const O3Earn: React.FC<{ copy: Copy }> = ({ copy }) => {
  const f = useCurrentFrame();
  const ex = copy.explainer;
  return (
    <AbsoluteFill>
      <NavyBg />
      <StepHead frame={f} step={ex.step(3)} title={ex.o3.title} sub={ex.o3.sub} dark />
      <StepPhone
        frame={f}
        screens={[
          { from: 0, node: <DashboardR copy={copy} frame={f} countAt={16} /> },
          { from: 118, node: <OwnerProfileR copy={copy} frame={f} withdrawTap={160} doneAt={172} /> },
        ]}
      />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ trust recap
const TrustRecap: React.FC<{ copy: Copy }> = ({ copy }) => {
  const f = useCurrentFrame();
  const icons = ['id', 'pin', 'camera', 'shield'] as const;
  const tones = [palette.primary[60], palette.violet[60], palette.orange[60], palette.green[60]];
  const hero = pop(f, 70, 14, 120);
  return (
    <AbsoluteFill>
      <BlueBg />
      <div style={{ position: 'absolute', top: 250, left: 0, right: 0 }}>
        <KineticText lines={copy.explainer.trust} frame={f} start={4} size={96} color="#FFFFFF" mode="marker" hl={yellow} hlText={ink} />
      </div>
      <div style={{ position: 'absolute', top: 530, left: 90, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {copy.explainer.trustItems.map((t, i) => (
          <CheckRow key={t} text={t} frame={f} at={26 + i * 15} icon={icons[i]} width={900} size={40} tone={tones[i]} />
        ))}
      </div>
      <Img
        src={img.heroWallet}
        style={{
          position: 'absolute',
          width: 640,
          left: 220,
          top: 1180 + (1 - hero) * 500 + bob(f, 10, 90),
          opacity: Math.min(1, hero * 1.5),
          filter: 'drop-shadow(0 40px 36px rgba(23,37,84,0.35))',
        }}
      />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ composition
const seq = (from: number, to: number) => ({ from, durationInFrames: to - from });

export const Explainer: React.FC<{ lang: string }> = ({ lang }) => {
  const copy = COPIES[lang];
  const at = (sceneStart: number, local: number) => sceneStart + local;
  return (
    <AbsoluteFill style={{ background: palette.primary[100] }}>
      <Music file="music-explainer.wav" volume={0.5} />

      <Sequence {...seq(0, 190)}>
        <Scene duration={190}>
          <Intro copy={copy} />
        </Scene>
      </Sequence>
      <Sequence {...seq(180, 310)}>
        <Scene duration={130} enter="slideUp" enterFrames={10}>
          <TwoSides copy={copy} />
        </Scene>
      </Sequence>
      <Sequence {...seq(300, 430)}>
        <Scene duration={130} enter="slideUp" enterFrames={10}>
          <MyIdStep copy={copy} />
        </Scene>
      </Sequence>
      <Sequence {...seq(420, 490)}>
        <Scene duration={70} enter="circle" enterFrames={10}>
          <Chapter copy={copy} />
        </Scene>
      </Sequence>
      <Sequence {...seq(480, 730)}>
        <Scene duration={250} enter="slideUp" enterFrames={10} exit="pushLeft" exitFrames={10}>
          <R1Find copy={copy} />
        </Scene>
      </Sequence>
      <Sequence {...seq(720, 910)}>
        <Scene duration={190} enter="pushLeft" enterFrames={10} exit="pushLeft" exitFrames={10}>
          <R2Dates copy={copy} />
        </Scene>
      </Sequence>
      <Sequence {...seq(900, 1150)}>
        <Scene duration={250} enter="pushLeft" enterFrames={10} exit="pushLeft" exitFrames={10}>
          <R3Pay copy={copy} />
        </Scene>
      </Sequence>
      <Sequence {...seq(1140, 1330)}>
        <Scene duration={190} enter="pushLeft" enterFrames={10} exit="pushLeft" exitFrames={10}>
          <R4Address copy={copy} />
        </Scene>
      </Sequence>
      <Sequence {...seq(1320, 1500)}>
        <Scene duration={180} enter="pushLeft" enterFrames={10} exit="flipOut" exitFrames={8}>
          <R5Photos copy={copy} />
        </Scene>
      </Sequence>
      <Sequence {...seq(1500, 1570)}>
        <Scene duration={70} enter="flipIn" enterFrames={10}>
          <Chapter copy={copy} owner />
        </Scene>
      </Sequence>
      <Sequence {...seq(1560, 1810)}>
        <Scene duration={250} enter="slideUp" enterFrames={10} exit="pushLeft" exitFrames={10}>
          <O1Listing copy={copy} />
        </Scene>
      </Sequence>
      <Sequence {...seq(1800, 2050)}>
        <Scene duration={250} enter="pushLeft" enterFrames={10} exit="pushLeft" exitFrames={10}>
          <O2Order copy={copy} />
        </Scene>
      </Sequence>
      <Sequence {...seq(2040, 2290)}>
        <Scene duration={250} enter="pushLeft" enterFrames={10}>
          <O3Earn copy={copy} />
        </Scene>
      </Sequence>
      <Sequence {...seq(2280, 2470)}>
        <Scene duration={190} enter="circle" enterFrames={10}>
          <TrustRecap copy={copy} />
        </Scene>
      </Sequence>
      <Sequence {...seq(2460, EXPLAINER_FRAMES)}>
        <Scene duration={EXPLAINER_FRAMES - 2460} enter="circle" enterFrames={10}>
          <Cta copy={copy} speed={1.15} tagAt={70} badgesAt={82} urlAt={96} />
        </Scene>
      </Sequence>

      {/* ---- sound design (absolute frames) ---- */}
      <Sfx name="whoosh" at={30} volume={0.25} />
      <Sfx name="pop" at={62} volume={0.22} />
      {[66, 70, 74, 78].map((t) => (
        <Sfx key={`i${t}`} name="pop" at={t} volume={0.16} />
      ))}
      <Sfx name="pop" at={86} volume={0.26} />
      <Sfx name="whoosh" at={178} volume={0.3} />
      <Sfx name="whoosh" at={200} volume={0.25} />
      {/* MyID */}
      <Sfx name="whoosh" at={298} volume={0.3} />
      <Sfx name="riser" at={at(300, 22)} volume={0.2} />
      <Sfx name="success" at={at(300, 86)} volume={0.4} />
      <Sfx name="pop" at={at(300, 94)} volume={0.28} />
      <Sfx name="pop" at={at(300, 100)} volume={0.28} />
      <Sfx name="whoosh" at={418} volume={0.3} />
      {/* R1 */}
      <Sfx name="whoosh" at={478} volume={0.25} />
      <Sfx name="pop" at={at(480, 40)} volume={0.3} />
      <Sfx name="swipe" at={at(480, 64)} volume={0.28} />
      <Sfx name="whoosh" at={at(480, 124)} volume={0.22} />
      <Sfx name="tap" at={at(480, 146)} volume={0.45} />
      <Sfx name="type" at={at(480, 152)} volume={0.35} />
      <Sfx name="tap" at={at(480, 196)} volume={0.45} />
      {/* R2 */}
      <Sfx name="swipe" at={718} volume={0.28} />
      <Sfx name="tap" at={at(720, 40)} volume={0.45} />
      <Sfx name="tap" at={at(720, 66)} volume={0.45} />
      <Sfx name="tap" at={at(720, 150)} volume={0.45} />
      {/* R3 */}
      <Sfx name="swipe" at={898} volume={0.28} />
      <Sfx name="tap" at={at(900, 58)} volume={0.45} />
      <Sfx name="whoosh" at={at(900, 66)} volume={0.22} />
      <Sfx name="tap" at={at(900, 128)} volume={0.45} />
      <Sfx name="tap" at={at(900, 158)} volume={0.45} />
      <Sfx name="success" at={at(900, 168)} volume={0.4} />
      {/* R4 */}
      <Sfx name="swipe" at={1138} volume={0.28} />
      <Sfx name="pop" at={at(1140, 24)} volume={0.3} />
      <Sfx name="whoosh" at={at(1140, 90)} volume={0.25} />
      <Sfx name="pop" at={at(1140, 100)} volume={0.35} />
      {/* R5 */}
      <Sfx name="swipe" at={1318} volume={0.28} />
      {[28, 42, 56].map((t) => (
        <Sfx key={`sh${t}`} name="shutter" at={at(1320, t)} volume={0.5} />
      ))}
      <Sfx name="tap" at={at(1320, 90)} volume={0.45} />
      <Sfx name="success" at={at(1320, 98)} volume={0.35} />
      {/* owner chapter */}
      <Sfx name="flip" at={1492} volume={0.45} />
      <Sfx name="pop" at={1506} volume={0.28} />
      <Sfx name="whoosh" at={1558} volume={0.28} />
      <Sfx name="tap" at={at(1560, 42)} volume={0.45} />
      <Sfx name="swipe" at={at(1560, 56)} volume={0.25} />
      {Array.from({ length: 9 }, (_, i) => at(1560, 78 + i * 3)).map((t) => (
        <Sfx key={`ty${t}`} name="type" at={t} volume={0.28} />
      ))}
      {Array.from({ length: 6 }, (_, i) => at(1560, 132 + i * 3)).map((t) => (
        <Sfx key={`ta${t}`} name="type" at={t} volume={0.28} />
      ))}
      <Sfx name="tap" at={at(1560, 206)} volume={0.45} />
      {/* O2 */}
      <Sfx name="swipe" at={1798} volume={0.28} />
      <Sfx name="notify" at={at(1800, 12)} volume={0.45} />
      <Sfx name="tap" at={at(1800, 52)} volume={0.45} />
      <Sfx name="swipe" at={at(1800, 62)} volume={0.25} />
      <Sfx name="tap" at={at(1800, 182)} volume={0.45} />
      <Sfx name="success" at={at(1800, 192)} volume={0.4} />
      {/* O3 */}
      <Sfx name="swipe" at={2038} volume={0.28} />
      <Sfx name="coins" at={at(2040, 16)} volume={0.35} />
      <Sfx name="swipe" at={at(2040, 118)} volume={0.25} />
      <Sfx name="tap" at={at(2040, 160)} volume={0.45} />
      <Sfx name="success" at={at(2040, 172)} volume={0.45} />
      {/* trust + CTA */}
      <Sfx name="whoosh" at={2278} volume={0.3} />
      {[2306, 2321, 2336, 2351].map((t) => (
        <Sfx key={`tr${t}`} name="pop" at={t} volume={0.3} />
      ))}
      <Sfx name="whoosh" at={2458} volume={0.3} />
      <Sfx name="logo" at={2505} volume={0.6} />
    </AbsoluteFill>
  );
};
