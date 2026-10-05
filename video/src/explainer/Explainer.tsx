/**
 * Explainer Reel — 83 s, 1080×1920, cut on the bar lines of
 * music-explainer.wav (120 BPM, 60 frames per bar).
 *
 *     0  intro        logo reveal (the app's splash timing), "Как это работает?"
 *   180  two sides    rent what you need / rent out what you don't
 *   300  chapter 1    "Как арендовать"
 *   360  step 1       find it nearby (home → search → product)
 *   600  step 2       pick dates (calendar range, total)
 *   840  step 3       pay from the wallet (contract, pay, confirmed)
 *  1020  step 4       pickup photos → status → review
 *  1260  chapter 2    flip → "Как сдавать и зарабатывать"
 *  1320  step 1       MyID face check
 *  1500  step 2       new listing → sent for review → approved
 *  1740  step 3       new request → accept
 *  1920  step 4       earnings → withdraw to card
 *  2160  trust        why it's safe
 *  2340  CTA          logo, rentzor.uz
 */
import React from 'react';
import { AbsoluteFill, Img, Sequence, useCurrentFrame } from 'remotion';
import { bob, easeOut, pop, progress } from '../anim';
import { icon3d, img } from '../assets';
import { colors, FONT, GRADIENT, ink, muted, NAVY_GRADIENT, palette, yellow } from '../brand';
import { COPIES } from '../copy';
import type { Copy, Lines } from '../copy/types';
import { AvatarUI, NotificationUI } from '../components/AppUI';
import { BlueBg, LightBg, NavyBg, WavePattern } from '../components/Backgrounds';
import { CheckRow, Tile3D } from '../components/Bits';
import { Cta } from '../components/Cta';
import { Icon } from '../components/Icon';
import { Kicker, KineticText } from '../components/KineticText';
import { LogoReveal } from '../components/Logo';
import { Phone } from '../components/Phone';
import { Music, Scene, Sfx, Tap } from '../components/Scene';
import {
  CalendarSheet,
  HomeScreen,
  ListingScreen,
  MyIdScreen,
  OrderScreen,
  OwnerHome,
  PaymentScreen,
  PhotoScreen,
  ProductPage,
  SearchScreen,
  StatusScreen,
} from '../components/Screens';

export const EXPLAINER_FRAMES = 2490;

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

/** Card that pops out next to the phone (left side — clear of Instagram's buttons). */
const Callout: React.FC<{ frame: number; at: number; until?: number; x: number; y: number; children: React.ReactNode; dark?: boolean }> = ({
  frame,
  at,
  until,
  x,
  y,
  children,
  dark,
}) => {
  const s = pop(frame, at, 13, 170) * (until === undefined ? 1 : 1 - progress(frame, until, 8));
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y + bob(frame, 6, 90, at),
        padding: '26px 34px',
        borderRadius: 40,
        background: dark ? '#FFFFFF' : '#FFFFFF',
        boxShadow: '0 34px 70px -24px rgba(15,23,42,0.45), 0 6px 16px rgba(15,23,42,0.08)',
        transform: `scale(${s})`,
        transformOrigin: 'right center',
        opacity: Math.min(1, s * 1.5),
        zIndex: 30,
      }}
    >
      {children}
    </div>
  );
};

/** A push banner dropping over the top of the phone. */
const Banner: React.FC<{ frame: number; at: number; until?: number; title: string; body: string; time: string; pan?: number }> = ({
  frame,
  at,
  until,
  title,
  body,
  time,
  pan = 0,
}) => {
  const s = pop(frame, at, 14, 160);
  const out = until === undefined ? 0 : progress(frame, until, 10);
  if (frame < at) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: (1080 - 361 * 2.3) / 2,
        top: 600 - pan + (1 - s) * -260 - out * 260,
        opacity: Math.min(1, s * 1.5) * (1 - out),
        zIndex: 40,
      }}
    >
      <NotificationUI title={title} body={body} time={time} scale={2.3} />
    </div>
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

// ------------------------------------------------------------------ renter steps
const R1Find: React.FC<{ copy: Copy }> = ({ copy }) => {
  const f = useCurrentFrame();
  const ex = copy.explainer;
  return (
    <AbsoluteFill>
      <LightBg />
      <StepHead frame={f} step={ex.step(1)} title={ex.r1.title} sub={ex.r1.sub} />
      <StepPhone
        frame={f}
        rises
        screens={[
          {
            from: 0,
            node: (
              <>
                <HomeScreen copy={copy} frame={f} scrollAt={12} />
                <Tap x={196} y={140} at={36} size={56} />
              </>
            ),
          },
          { from: 44, node: <SearchScreen copy={copy} frame={f} typeAt={52} resultsAt={84} tapAt={142} /> },
          { from: 152, node: <ProductPage copy={copy} frame={f - 152} /> },
        ]}
      />
      <Callout frame={f} at={100} until={140} x={24} y={880}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 70, height: 70, borderRadius: 35, background: palette.primary[0], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="pin" size={40} color={colors.primary} stroke={2.2} />
          </div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 52, color: ink }}>{copy.searchResults[0].distance}</div>
        </div>
      </Callout>
    </AbsoluteFill>
  );
};

const R2Dates: React.FC<{ copy: Copy }> = ({ copy }) => {
  const f = useCurrentFrame();
  const ex = copy.explainer;
  const pan = panFor(f, [[170, 9999]]);
  return (
    <AbsoluteFill>
      <LightBg />
      <StepHead frame={f} step={ex.step(2)} title={ex.r2.title} sub={ex.r2.sub} pan={pan} />
      <PanGroup pan={pan}>
        <StepPhone
          frame={f}
          screens={[
            {
              from: 0,
              node: (
                <>
                  <ProductPage copy={copy} frame={f + 90} bookTapAt={22} />
                  <CalendarSheet copy={copy} frame={f} at={32} startTap={70} endTap={100} bookTap={196} />
                </>
              ),
            },
          ]}
        />
        <Callout frame={f} at={116} x={40} y={880}>
          <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 38, color: muted }}>
            {`${(copy.products[0].price / 1000).toFixed(0)} 000 × ${copy.days(3)}`}
          </div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 58, color: colors.primary, letterSpacing: '-0.02em' }}>= 750 000 {copy.currency}</div>
        </Callout>
      </PanGroup>
    </AbsoluteFill>
  );
};

const R3Pay: React.FC<{ copy: Copy }> = ({ copy }) => {
  const f = useCurrentFrame();
  const ex = copy.explainer;
  const pan = panFor(f, [[58, 114]]);
  return (
    <AbsoluteFill>
      <LightBg />
      <StepHead frame={f} step={ex.step(3)} title={ex.r3.title} sub={ex.r3.sub} pan={pan} />
      <PanGroup pan={pan}>
        <StepPhone frame={f} screens={[{ from: 0, node: <PaymentScreen copy={copy} frame={f} checkAt={46} payAt={76} doneAt={96} /> }]} />
      </PanGroup>
      <Banner frame={f} at={132} title={copy.ui.bookingConfirmedTitle} body={copy.ui.bookingConfirmedBody} time={copy.ui.now} pan={pan} />
    </AbsoluteFill>
  );
};

const R4Pickup: React.FC<{ copy: Copy }> = ({ copy }) => {
  const f = useCurrentFrame();
  const ex = copy.explainer;
  const pan = panFor(f, [[64, 112]]);
  return (
    <AbsoluteFill>
      <LightBg />
      <StepHead frame={f} step={ex.step(4)} title={ex.r4.title} sub={ex.r4.sub} pan={pan} />
      <PanGroup pan={pan}>
        <StepPhone
          frame={f}
          screens={[
            {
              from: 0,
              node: (
                <>
                  <PhotoScreen copy={copy} frame={f} shots={[28, 42, 56]} acceptAt={80} />
                  {f >= 88 && (
                    <div style={{ position: 'absolute', inset: 0, opacity: progress(f, 88, 8) }}>
                      <SuccessToast copy={copy} />
                    </div>
                  )}
                </>
              ),
            },
            { from: 122, node: <StatusScreen copy={copy} frame={f} at={130} stepEvery={16} rateAt={196} /> },
          ]}
        />
      </PanGroup>
    </AbsoluteFill>
  );
};

const SuccessToast: React.FC<{ copy: Copy }> = ({ copy }) => (
  <div style={{ position: 'absolute', left: 20, right: 20, top: 66, padding: '14px 16px', borderRadius: 16, background: palette.gray[100], display: 'flex', alignItems: 'center', gap: 10, zIndex: 50 }}>
    <div style={{ width: 26, height: 26, borderRadius: 13, background: colors.success, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon name="check" size={16} color="#fff" stroke={3} />
    </div>
    <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 15, color: '#fff' }}>{copy.ui.pickupSuccess}</div>
  </div>
);

// ------------------------------------------------------------------ owner steps
const O1MyId: React.FC<{ copy: Copy }> = ({ copy }) => {
  const f = useCurrentFrame();
  const ex = copy.explainer;
  return (
    <AbsoluteFill>
      <NavyBg />
      <StepHead frame={f} step={ex.step(1)} title={ex.o1.title} sub={ex.o1.sub} dark />
      <StepPhone frame={f} rises dark screenBg="#0B0F1A" screens={[{ from: 0, node: <MyIdScreen copy={copy} frame={f} scanAt={24} doneAt={100} /> }]} />
    </AbsoluteFill>
  );
};

const O2Listing: React.FC<{ copy: Copy }> = ({ copy }) => {
  const f = useCurrentFrame();
  const ex = copy.explainer;
  const pan = panFor(f, [[128, 186]]);
  return (
    <AbsoluteFill>
      <NavyBg />
      <StepHead frame={f} step={ex.step(2)} title={ex.o2.title} sub={ex.o2.sub} dark pan={pan} />
      <PanGroup pan={pan}>
        <StepPhone
          frame={f}
          screens={[
            {
              from: 0,
              node: <ListingScreen copy={copy} frame={f} photosAt={24} nameAt={48} priceAt={84} placeAt={106} publishAt={146} sentAt={156} />,
            },
          ]}
        />
      </PanGroup>
      <Banner frame={f} at={200} title={copy.ui.approvedTitle} body={copy.ui.approvedBody} time={copy.ui.now} pan={pan} />
    </AbsoluteFill>
  );
};

const O3Accept: React.FC<{ copy: Copy }> = ({ copy }) => {
  const f = useCurrentFrame();
  const ex = copy.explainer;
  const pan = panFor(f, [[92, 148]]);
  return (
    <AbsoluteFill>
      <NavyBg />
      <StepHead frame={f} step={ex.step(3)} title={ex.o3.title} sub={ex.o3.sub} dark pan={pan} />
      <PanGroup pan={pan}>
        <StepPhone frame={f} screens={[{ from: 0, node: <OrderScreen copy={copy} frame={f} confirmAt={112} /> }]} />
      </PanGroup>
      <Banner frame={f} at={10} until={56} title={copy.ui.newRequestTitle} body={copy.ui.newRequestBody} time={copy.ui.now} />
      <Tap x={540} y={740} at={42} size={110} />
    </AbsoluteFill>
  );
};

const O4Earn: React.FC<{ copy: Copy }> = ({ copy }) => {
  const f = useCurrentFrame();
  const ex = copy.explainer;
  const pan = panFor(f, [[156, 226]]);
  return (
    <AbsoluteFill>
      <NavyBg />
      <StepHead frame={f} step={ex.step(4)} title={ex.o4.title} sub={ex.o4.sub} dark pan={pan} />
      <PanGroup pan={pan}>
        <StepPhone
          frame={f}
          screens={[{ from: 0, node: <OwnerHome copy={copy} frame={f} countAt={18} withdrawTap={112} sheetAt={120} confirmTap={176} doneAt={186} /> }]}
        />
        <Callout frame={f} at={64} until={104} x={40} y={1250}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 70, height: 70, borderRadius: 35, background: palette.green[0], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="wallet" size={38} color={palette.green[60]} stroke={2.2} />
            </div>
            <div>
              <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 30, color: muted }}>{copy.ui.rentalIncome}</div>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 48, color: palette.green[60] }}>+675 000</div>
            </div>
          </div>
        </Callout>
      </PanGroup>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ trust recap
const TrustRecap: React.FC<{ copy: Copy }> = ({ copy }) => {
  const f = useCurrentFrame();
  const icons = ['wallet', 'id', 'camera', 'shield'] as const;
  const tones = [palette.green[60], palette.violet[60], palette.orange[60], palette.primary[70]];
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
  const typing = Array.from({ length: copy.ui.searchQuery.length }, (_, i) => 360 + 52 + i * 4);
  const nameTyping = Array.from({ length: 10 }, (_, i) => 1500 + 48 + i * 3);
  return (
    <AbsoluteFill style={{ background: palette.primary[100] }}>
      <Music file="music-explainer.wav" volume={0.64} />

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
      <Sequence {...seq(300, 370)}>
        <Scene duration={70} enter="circle" enterFrames={10}>
          <Chapter copy={copy} />
        </Scene>
      </Sequence>
      <Sequence {...seq(360, 610)}>
        <Scene duration={250} enter="slideUp" enterFrames={10} exit="pushLeft" exitFrames={10}>
          <R1Find copy={copy} />
        </Scene>
      </Sequence>
      <Sequence {...seq(600, 850)}>
        <Scene duration={250} enter="pushLeft" enterFrames={10} exit="pushLeft" exitFrames={10}>
          <R2Dates copy={copy} />
        </Scene>
      </Sequence>
      <Sequence {...seq(840, 1030)}>
        <Scene duration={190} enter="pushLeft" enterFrames={10} exit="pushLeft" exitFrames={10}>
          <R3Pay copy={copy} />
        </Scene>
      </Sequence>
      <Sequence {...seq(1020, 1260)}>
        <Scene duration={240} enter="pushLeft" enterFrames={10} exit="flipOut" exitFrames={8}>
          <R4Pickup copy={copy} />
        </Scene>
      </Sequence>
      <Sequence {...seq(1260, 1330)}>
        <Scene duration={70} enter="flipIn" enterFrames={10}>
          <Chapter copy={copy} owner />
        </Scene>
      </Sequence>
      <Sequence {...seq(1320, 1510)}>
        <Scene duration={190} enter="slideUp" enterFrames={10} exit="pushLeft" exitFrames={10}>
          <O1MyId copy={copy} />
        </Scene>
      </Sequence>
      <Sequence {...seq(1500, 1750)}>
        <Scene duration={250} enter="pushLeft" enterFrames={10} exit="pushLeft" exitFrames={10}>
          <O2Listing copy={copy} />
        </Scene>
      </Sequence>
      <Sequence {...seq(1740, 1930)}>
        <Scene duration={190} enter="pushLeft" enterFrames={10} exit="pushLeft" exitFrames={10}>
          <O3Accept copy={copy} />
        </Scene>
      </Sequence>
      <Sequence {...seq(1920, 2170)}>
        <Scene duration={250} enter="pushLeft" enterFrames={10}>
          <O4Earn copy={copy} />
        </Scene>
      </Sequence>
      <Sequence {...seq(2160, 2350)}>
        <Scene duration={190} enter="circle" enterFrames={10}>
          <TrustRecap copy={copy} />
        </Scene>
      </Sequence>
      <Sequence {...seq(2340, EXPLAINER_FRAMES)}>
        <Scene duration={EXPLAINER_FRAMES - 2340} enter="circle" enterFrames={10}>
          <Cta copy={copy} speed={1.15} tagAt={84} pillAt={118} bioAt={128} />
        </Scene>
      </Sequence>

      {/* ---- sound design (absolute frames) ---- */}
      <Sfx name="whoosh" at={44} volume={0.3} />
      <Sfx name="pop" at={92} volume={0.25} />
      {[96, 100, 104, 108].map((at) => (
        <Sfx key={`i${at}`} name="pop" at={at} volume={0.18} />
      ))}
      <Sfx name="pop" at={120} volume={0.3} />
      <Sfx name="whoosh" at={178} volume={0.35} />
      <Sfx name="whoosh" at={200} volume={0.3} />
      <Sfx name="whoosh" at={298} volume={0.35} />
      <Sfx name="whoosh" at={358} volume={0.3} />
      {/* renter step 1 */}
      <Sfx name="tap" at={396} volume={0.5} />
      {typing.map((at) => (
        <Sfx key={`ty${at}`} name="type" at={at} volume={0.35} />
      ))}
      <Sfx name="pop" at={448} volume={0.3} />
      <Sfx name="pop" at={460} volume={0.3} />
      <Sfx name="tap" at={502} volume={0.5} />
      <Sfx name="swipe" at={512} volume={0.35} />
      {/* renter step 2 */}
      <Sfx name="swipe" at={598} volume={0.3} />
      <Sfx name="tap" at={622} volume={0.5} />
      <Sfx name="whoosh" at={632} volume={0.25} />
      <Sfx name="tap" at={670} volume={0.5} />
      <Sfx name="tap" at={700} volume={0.5} />
      <Sfx name="pop" at={716} volume={0.3} />
      <Sfx name="tap" at={796} volume={0.5} />
      {/* renter step 3 */}
      <Sfx name="swipe" at={838} volume={0.3} />
      <Sfx name="tap" at={886} volume={0.5} />
      <Sfx name="tap" at={916} volume={0.5} />
      <Sfx name="success" at={936} volume={0.4} />
      <Sfx name="notify" at={968} volume={0.45} />
      {/* renter step 4 */}
      <Sfx name="swipe" at={1018} volume={0.3} />
      {[1048, 1062, 1076].map((at) => (
        <Sfx key={`sh${at}`} name="shutter" at={at} volume={0.5} />
      ))}
      <Sfx name="tap" at={1100} volume={0.5} />
      <Sfx name="success" at={1108} volume={0.35} />
      <Sfx name="swipe" at={1142} volume={0.3} />
      {[1150, 1166, 1182, 1198].map((at) => (
        <Sfx key={`st${at}`} name="pop" at={at} volume={0.3} />
      ))}
      <Sfx name="coins" at={1218} volume={0.3} />
      {/* owner chapter */}
      <Sfx name="flip" at={1252} volume={0.5} />
      <Sfx name="pop" at={1264} volume={0.3} />
      <Sfx name="whoosh" at={1318} volume={0.3} />
      <Sfx name="riser" at={1344} volume={0.25} />
      <Sfx name="success" at={1420} volume={0.45} />
      {/* owner step 2 */}
      <Sfx name="swipe" at={1498} volume={0.3} />
      {[1524, 1530, 1536].map((at) => (
        <Sfx key={`ph${at}`} name="pop" at={at} volume={0.3} />
      ))}
      {nameTyping.map((at) => (
        <Sfx key={`nt${at}`} name="type" at={at} volume={0.3} />
      ))}
      {[1584, 1588, 1592, 1596].map((at) => (
        <Sfx key={`pt${at}`} name="type" at={at} volume={0.3} />
      ))}
      <Sfx name="pop" at={1610} volume={0.35} />
      <Sfx name="tap" at={1646} volume={0.5} />
      <Sfx name="success" at={1656} volume={0.4} />
      <Sfx name="notify" at={1696} volume={0.45} />
      {/* owner step 3 */}
      <Sfx name="swipe" at={1738} volume={0.3} />
      <Sfx name="notify" at={1750} volume={0.45} />
      <Sfx name="tap" at={1782} volume={0.5} />
      <Sfx name="tap" at={1852} volume={0.5} />
      <Sfx name="success" at={1858} volume={0.4} />
      {/* owner step 4 */}
      <Sfx name="swipe" at={1918} volume={0.3} />
      <Sfx name="coins" at={1938} volume={0.4} />
      <Sfx name="pop" at={1984} volume={0.3} />
      <Sfx name="tap" at={2032} volume={0.5} />
      <Sfx name="whoosh" at={2040} volume={0.25} />
      <Sfx name="tap" at={2096} volume={0.5} />
      <Sfx name="success" at={2106} volume={0.45} />
      {/* trust + CTA */}
      <Sfx name="whoosh" at={2158} volume={0.35} />
      {[2186, 2201, 2216, 2231].map((at) => (
        <Sfx key={`tr${at}`} name="pop" at={at} volume={0.32} />
      ))}
      <Sfx name="whoosh" at={2338} volume={0.35} />
      <Sfx name="impact" at={2342} volume={0.35} />
      <Sfx name="success" at={2458} volume={0.4} />
    </AbsoluteFill>
  );
};

