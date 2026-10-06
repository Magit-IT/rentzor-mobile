/**
 * App screens rebuilt from real screenshots of the shipping app (Oct 2026),
 * in app points (393 × 852). Every screen takes the scene-local frame plus the
 * frames at which its interactions happen. Data is demo data only — no real
 * user names, phones or addresses.
 */
import React from 'react';
import { Img, interpolate, staticFile } from 'remotion';
import { countUp, easeOut, groupDigits, pop, progress } from '../anim';
import { icon3d, img, productImage } from '../assets';
import { colors, FONT, palette } from '../brand';
import type { Copy } from '../copy/types';
import { Icon } from './Icon';
import { Tap } from './Scene';

const g = palette.gray;
const BLUE = colors.primary;
const GREEN = palette.green[60];
const BORDER = '#ECECEE';
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export const som = (n: number) => `${groupDigits(n)} so‘m`;
export const uzs = (n: number) => `${groupDigits(n)} UZS`;
export const perKun = (n: number) => `${groupDigits(n)} so‘m/1kun`;

const txt = (size: number, weight = 400, color: string = g[100], lh = 1.3): React.CSSProperties => ({
  fontFamily: FONT,
  fontSize: size,
  fontWeight: weight,
  color,
  lineHeight: lh,
});

/** Press feedback for buttons: 0 → 1 → 0 over 8 frames after `at`. */
const pressAt = (f: number, at?: number) => (at === undefined ? 0 : Math.sin(Math.min(1, Math.max(0, (f - at) / 8)) * Math.PI));

// ---------------------------------------------------------------- shared pieces
export const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ background: '#FFFFFF', border: `1.2px solid ${BORDER}`, borderRadius: 18, padding: 16, ...style }}>{children}</div>
);

export const Header: React.FC<{ title: string; right?: React.ReactNode }> = ({ title, right }) => (
  <div style={{ position: 'absolute', top: 54, left: 0, right: 0, height: 50, display: 'flex', alignItems: 'center', padding: '0 18px', gap: 14, borderBottom: `1px solid ${BORDER}`, background: '#fff', zIndex: 5 }}>
    <Icon name="chevronLeft" size={24} color={g[100]} stroke={2} />
    <div style={{ ...txt(23, 600), flex: 1 }}>{title}</div>
    {right}
  </div>
);

export const BlueButton: React.FC<{ label: string; pressed?: number; disabled?: boolean; style?: React.CSSProperties }> = ({ label, pressed = 0, disabled, style }) => (
  <div
    style={{
      height: 44,
      borderRadius: 14,
      background: disabled ? g[10] : pressed > 0 ? palette.primary[70] : BLUE,
      color: disabled ? g[30] : '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...txt(17, 600, disabled ? g[30] : '#fff', 1),
      transform: `scale(${1 - pressed * 0.04})`,
      ...style,
    }}
  >
    {label}
  </div>
);

/** White bottom bar with a rounded top edge (payment, date picker, wizard). */
export const BottomBar: React.FC<{ children: React.ReactNode; height?: number }> = ({ children, height = 108 }) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height,
      background: '#fff',
      borderTop: `1px solid ${BORDER}`,
      borderRadius: '22px 22px 0 0',
      padding: '18px 18px 0',
      zIndex: 10,
    }}
  >
    {children}
  </div>
);

const MyIdPill: React.FC<{ label: string }> = ({ label }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: palette.primary[0], border: `1px solid ${palette.primary[10]}`, ...txt(13, 500, palette.primary[60], 1.2) }}>
    <svg width="14" height="14" viewBox="0 0 24 24">
      <path d="M12 2.5l8 3v6c0 5.2-3.4 8.6-8 10-4.6-1.4-8-4.8-8-10v-6z" fill={palette.primary[60]} />
      <path d="M8.3 12.2l2.5 2.5 4.9-5" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    {label}
  </div>
);

const Chip: React.FC<{ label: string; tone: 'green' | 'orange' | 'blue' | 'gray' }> = ({ label, tone }) => {
  const c = { green: [palette.green[0], palette.green[70]], orange: [palette.orange[0], palette.orange[70]], blue: [palette.primary[0], palette.primary[60]], gray: [g[10], g[60]] }[tone];
  return <div style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: 999, background: c[0], ...txt(13, 500, c[1], 1.3) }}>{label}</div>;
};

const Stars: React.FC<{ n: number; size?: number }> = ({ n, size = 16 }) => (
  <div style={{ display: 'flex', gap: 3 }}>
    {[0, 1, 2, 3, 4].map((i) => {
      const fill = Math.max(0, Math.min(1, n - i));
      return (
        <div key={i} style={{ position: 'relative', width: size, height: size }}>
          <Icon name="star" size={size} color={g[20]} fill={g[20]} stroke={1} style={{ position: 'absolute' }} />
          <div style={{ position: 'absolute', inset: 0, width: size * fill, overflow: 'hidden' }}>
            <Icon name="star" size={size} color={palette.yellow[60]} fill={palette.yellow[60]} stroke={1} />
          </div>
        </div>
      );
    })}
  </div>
);

const Initial: React.FC<{ letter?: string; size?: number }> = ({ letter, size = 56 }) => (
  <div style={{ width: size, height: size, borderRadius: size / 2, background: g[10], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    {letter ? <span style={txt(size * 0.42, 500, g[40], 1)}>{letter}</span> : <Icon name="user" size={size * 0.45} color={g[60]} stroke={1.4} />}
  </div>
);

export const TabBarR: React.FC<{ owner?: boolean; active: number; labels: string[] }> = ({ owner, active, labels }) => {
  const icons = owner ? (['home', 'bookmark', 'box', 'user'] as const) : (['home', 'bookmark', 'box', 'user'] as const);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 84, background: '#fff', borderTop: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-around', paddingTop: 8, zIndex: 8 }}>
      {labels.map((l, i) => (
        <div key={l} style={{ width: 90, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <Icon name={icons[i]} size={26} color={i === active ? BLUE : g[40]} fill={i === active ? BLUE : 'none'} stroke={1.6} />
          <div style={txt(12.5, 500, i === active ? BLUE : g[40], 1.2)}>{l}</div>
        </div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------- renter: home
type Item = { key: keyof typeof productImage; title: string; price: number; km: string; place: string };

export const ItemCard: React.FC<{ it: Item; width?: number; showDistance?: boolean; highlight?: number }> = ({ it, width = 172, showDistance = true, highlight = 0 }) => (
  <div style={{ width, flexShrink: 0 }}>
    <div style={{ position: 'relative', width, height: width, borderRadius: 22, overflow: 'hidden', background: g[10] }}>
      <Img src={productImage[it.key]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="bookmark" size={17} color={g[100]} stroke={1.7} />
      </div>
    </div>
    <div style={{ marginTop: 9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...txt(13, 400, g[40]) }}>
      {showDistance && (
        <span
          style={{
            color: BLUE,
            fontWeight: 500,
            padding: highlight ? '1px 5px' : 0,
            margin: highlight ? '0 -5px' : 0,
            borderRadius: 6,
            background: `rgba(60,131,246,${0.14 * highlight})`,
            boxShadow: highlight ? `0 0 0 ${1.5 * highlight}px rgba(60,131,246,${0.5 * highlight})` : undefined,
          }}
        >
          {it.km}
        </span>
      )}
      {showDistance ? ' • ' : ''}
      {it.place}
    </div>
    <div style={{ marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...txt(15.5, 500) }}>{it.title}</div>
    <div style={{ marginTop: 3, ...txt(15.5, 400, g[50]) }}>{perKun(it.price)}</div>
  </div>
);

export const HomeR: React.FC<{ copy: Copy; frame: number; scrollAt?: number; highlightAt?: number; tapSearchAt?: number }> = ({ copy, frame, scrollAt, highlightAt, tapSearchAt }) => {
  const items = copy.nearbyItems;
  const scroll = scrollAt === undefined ? 0 : interpolate(frame, [scrollAt, scrollAt + 50], [0, 184], { ...clamp, easing: easeOut });
  const hl = highlightAt === undefined ? 0 : progress(frame, highlightAt, 10);
  const cats = [
    ['dumbbells', copy.ui.cats[0]],
    ['camera', copy.ui.cats[1]],
    ['bike', copy.ui.cats[2]],
    ['laptop', copy.ui.cats[3]],
    ['backpack', copy.ui.cats[4]],
  ] as const;
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#fff' }}>
      <div style={{ position: 'absolute', top: 66, left: 19, right: 19, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="pin" size={24} color={g[100]} stroke={1.6} />
          <div style={txt(18, 500)}>Toshkent</div>
          <Icon name="chevronDown" size={18} color={g[100]} stroke={2} />
        </div>
        <div style={{ position: 'relative', width: 44, height: 44, borderRadius: 14, border: `1.2px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="bell" size={22} color={g[100]} stroke={1.6} />
          <div style={{ position: 'absolute', top: -5, right: -5, padding: '1px 5px', borderRadius: 999, background: colors.critical, border: '1.5px solid #fff', ...txt(10, 600, '#fff', 1.3) }}>9+</div>
        </div>
      </div>
      <div style={{ position: 'absolute', top: 127, left: 19, right: 19, height: 46, borderRadius: 999, border: `1.2px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px' }}>
        <Icon name="search" size={22} color={g[100]} stroke={1.7} />
        <div style={txt(16, 400, g[70])}>{copy.ui.searchPlaceholder}</div>
      </div>
      <div style={{ position: 'absolute', top: 190, left: 12, display: 'flex', gap: 2 }}>
        {cats.map(([ic, label]) => (
          <div key={label} style={{ width: 82, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 62, height: 62, borderRadius: 31, background: g[10], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Img src={icon3d(ic)} style={{ width: 44, height: 44, objectFit: 'contain' }} />
            </div>
            <div style={{ ...txt(12.5, 400, g[90], 1.2), textAlign: 'center', whiteSpace: 'pre-line' }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', top: 302, left: 19, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={txt(21, 600)}>{copy.ui.nearby}</div>
        <Icon name="chevronRight" size={20} color={g[100]} stroke={2} />
      </div>
      <div style={{ position: 'absolute', top: 344, left: 19 - scroll, display: 'flex', gap: 12 }}>
        {items.map((it) => (
          <ItemCard key={it.key} it={it} highlight={hl} />
        ))}
      </div>
      <div style={{ position: 'absolute', top: 600, left: 19, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={txt(21, 600)}>{copy.ui.recentlyViewed}</div>
        <Icon name="chevronRight" size={20} color={g[100]} stroke={2} />
      </div>
      <div style={{ position: 'absolute', top: 640, left: 19, display: 'flex', gap: 12 }}>
        {[copy.nearbyItems[4], copy.nearbyItems[2]].map((it) => (
          <div key={it.key} style={{ width: 172, height: 172, borderRadius: 22, overflow: 'hidden' }}>
            <Img src={productImage[it.key]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ))}
      </div>
      <TabBarR active={0} labels={copy.ui.tabs} />
      {tapSearchAt !== undefined && <Tap x={196} y={150} at={tapSearchAt} size={54} />}
    </div>
  );
};

/** Filter sheet: distance radius typed in — "Расстояние". */
export const FilterSheetR: React.FC<{ copy: Copy; frame: number; at: number; typeAt: number; applyAt: number }> = ({ copy, frame, at, typeAt, applyAt }) => {
  const p = progress(frame, at, 14, easeOut);
  if (p <= 0) return null;
  const km = frame >= typeAt ? '2' : '';
  const caret = Math.floor(frame / 8) % 2 === 0;
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: `rgba(9,9,11,${0.4 * p})`, zIndex: 20 }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 380 + (1 - p) * 472, background: '#fff', borderRadius: '24px 24px 0 0', zIndex: 21, padding: '12px 19px' }}>
        <div style={{ width: 40, height: 5, borderRadius: 3, background: g[20], margin: '0 auto 14px' }} />
        <div style={txt(21, 600)}>{copy.ui.filterTitle}</div>
        <div style={{ ...txt(15, 500), marginTop: 18 }}>{copy.ui.price}</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          {[copy.ui.from, copy.ui.to].map((l) => (
            <div key={l} style={{ flex: 1, height: 46, borderRadius: 14, border: `1.2px solid ${BORDER}`, display: 'flex', alignItems: 'center', padding: '0 14px', ...txt(15, 400, g[40]) }}>{l}</div>
          ))}
        </div>
        <div style={{ ...txt(15, 500), marginTop: 18 }}>{copy.ui.distance}</div>
        <div style={{ marginTop: 8, height: 46, borderRadius: 14, border: `1.5px solid ${frame >= typeAt - 6 ? BLUE : BORDER}`, display: 'flex', alignItems: 'center', padding: '0 14px', ...txt(16, 500) }}>
          {km}
          {frame >= typeAt - 6 && frame < applyAt && <span style={{ width: 2, height: 20, background: BLUE, opacity: caret ? 1 : 0, marginLeft: 1 }} />}
          <span style={{ marginLeft: 'auto', ...txt(15, 500, BLUE) }}>km</span>
        </div>
        <div style={{ display: 'flex', gap: 10, position: 'absolute', left: 19, right: 19, bottom: 36 }}>
          <div style={{ flex: 1, height: 44, borderRadius: 14, background: g[10], display: 'flex', alignItems: 'center', justifyContent: 'center', ...txt(16, 600) }}>{copy.ui.reset}</div>
          <BlueButton label={copy.ui.apply} pressed={pressAt(frame, applyAt)} style={{ flex: 1 }} />
        </div>
      </div>
      <Tap x={196} y={380 + 196} at={typeAt - 6} size={50} />
      <Tap x={290} y={852 - 58} at={applyAt} size={54} />
    </>
  );
};

// ---------------------------------------------------------------- renter: item page (approx → exact)
export const ItemPageR: React.FC<{ copy: Copy; frame: number; booked: boolean; switchAt?: number }> = ({ copy, frame, booked, switchAt }) => {
  // crossfade approx → exact when `switchAt` is reached
  const x = switchAt === undefined ? (booked ? 1 : 0) : progress(frame, switchAt, 14);
  const pin = switchAt === undefined ? 1 : pop(frame, switchAt + 8, 10, 190);
  const it = copy.nearbyItems[0];
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#fff' }}>
      <div style={{ position: 'absolute', top: 60, left: 19, right: 19 }}>
        <Card style={{ padding: 18 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <Initial letter="D" size={58} />
            <div>
              <div style={txt(13.5, 400, g[50])}>{copy.ui.owner}</div>
              <div style={txt(18, 600)}>{copy.ownerFull}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <Stars n={5} size={15} />
                <span style={txt(13, 400, g[50])}>5/5</span>
              </div>
            </div>
          </div>
          <div style={{ height: 1, background: BORDER, margin: '14px 0 12px' }} />
          <div style={{ height: 34 * x, overflow: 'hidden', opacity: x, display: 'flex', alignItems: 'center', gap: 10, ...txt(15, 400, g[60]) }}>
            <Icon name="phone" size={20} color={BLUE} stroke={1.7} />
            {copy.ownerPhone}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 34, ...txt(15, 400, g[60]) }}>
            <Icon name="shield" size={20} color={GREEN} stroke={1.7} />
            {copy.ui.verified}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 34, ...txt(15, 400, g[60]) }}>
            <Icon name="clock" size={20} color={BLUE} stroke={1.7} />
            {copy.ui.onPlatformSince}
          </div>
        </Card>
      </div>
      <div style={{ position: 'absolute', top: 342 - 34 * (1 - x), left: 19, right: 19 }}>
        <div style={txt(21, 600)}>{copy.ui.address}</div>
        <div style={{ position: 'relative', marginTop: 12, height: 255, borderRadius: 18, overflow: 'hidden' }}>
          <Img src={staticFile('maps/approx.jpg')} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: 1 - x }} />
          <Img src={staticFile('maps/exact.jpg')} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: x, transform: `scale(${1.06 - 0.06 * pin})` }} />
        </div>
        <div style={{ position: 'relative', marginTop: 10, height: 22 }}>
          <div style={{ position: 'absolute', ...txt(14.5, 400, g[50]), opacity: 1 - x }}>{copy.ui.approxRadius}</div>
          <div style={{ position: 'absolute', ...txt(14.5, 400, g[60]), opacity: x }}>{copy.ui.exactAddress}</div>
        </div>
        <div style={{ ...txt(21, 600), marginTop: 22 }}>{copy.ui.priceDetails}</div>
        <Card style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', ...txt(15, 400, g[50]) }}>
            <span>{copy.ui.forDays(1)}</span>
            <span style={txt(15, 600)}>{uzs(it.price)}</span>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- renter: date picker
export const DatePickerR: React.FC<{ copy: Copy; frame: number; startTap: number; endTap: number; bookTap: number }> = ({ copy, frame, startTap, endTap, bookTap }) => {
  const it = copy.nearbyItems[0];
  const offset = 3; // 1 Oct 2026 is a Thursday
  const start = 14;
  const end = 15;
  const cell = 46;
  const pos = (d: number) => {
    const i = d - 1 + offset;
    return { x: 19 + 18 + (i % 7) * cell + cell / 2, y: 94 + 96 + Math.floor(i / 7) * 46 + 18 };
  };
  const band = progress(frame, endTap, 8);
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#fff' }}>
      <div style={{ position: 'absolute', top: 58, left: 19, ...txt(23, 600) }}>{copy.ui.selectDates}</div>
      <div style={{ position: 'absolute', top: 94, left: 19, right: 19 }}>
        <Card style={{ padding: '14px 18px', borderRadius: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Icon name="chevronLeft" size={18} color={g[30]} stroke={2} />
            <div style={txt(16, 600)}>{copy.ui.calendarMonth} 2026</div>
            <Icon name="chevronRight" size={18} color={g[100]} stroke={2} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(7, ${cell}px)`, marginTop: 12, paddingBottom: 8, borderBottom: `1px solid ${BORDER}` }}>
            {copy.ui.weekdays.map((w) => (
              <div key={w} style={{ textAlign: 'center', ...txt(14, 400, g[50]) }}>{w}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(7, ${cell}px)`, rowGap: 6, marginTop: 8 }}>
            {Array.from({ length: offset }).map((_, i) => (
              <div key={`e${i}`} />
            ))}
            {Array.from({ length: 31 }).map((_, i) => {
              const d = i + 1;
              const past = d <= 6;
              const isS = d === start && frame >= startTap;
              const isE = d === end && frame >= endTap;
              const inBand = d >= start && d <= end && frame >= endTap;
              const col = (d - 1 + offset) % 7;
              return (
                <div key={d} style={{ position: 'relative', height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {inBand && (
                    <div style={{ position: 'absolute', top: 3, bottom: 3, left: d === start || col === 0 ? '50%' : 0, right: d === end || col === 6 ? '50%' : 0, background: '#EBEBEE', opacity: band }} />
                  )}
                  {(isS || isE) && (
                    <div style={{ position: 'absolute', width: 36, height: 36, borderRadius: 18, background: BLUE, transform: `scale(${pop(frame, isS ? startTap : endTap, 12, 220)})` }} />
                  )}
                  <span style={{ position: 'relative', ...txt(15, 600, isS || isE ? '#fff' : past ? g[30] : g[100]), textDecoration: past ? 'line-through' : 'none' }}>{d}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
      <div style={{ position: 'absolute', top: 448, left: 19, right: 19 }}>
        <Card style={{ borderRadius: 22, padding: '14px 16px' }}>
          {[
            [copy.ui.pickupTime, '17:00'],
            [copy.ui.returnTime, '17:00'],
          ].map(([l, v], i) => (
            <div key={l} style={{ marginTop: i ? 12 : 0 }}>
              <div style={txt(14.5, 500)}>{l}</div>
              <div style={{ marginTop: 6, height: 42, borderRadius: 14, border: `1.2px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', ...txt(15.5, 500) }}>
                {v}
                <Icon name="chevronDown" size={18} color={g[100]} stroke={2} />
              </div>
            </div>
          ))}
        </Card>
      </div>
      <div style={{ position: 'absolute', top: 664, left: 0, right: 0, textAlign: 'center', ...txt(15, 600), opacity: progress(frame, endTap, 8) }}>{copy.ui.daysTotal}</div>
      <div style={{ position: 'absolute', top: 700, left: 0, right: 0, textAlign: 'center', ...txt(15, 500, BLUE) }}>{copy.ui.clearDates}</div>
      <BottomBar height={96}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={txt(19, 600)}>{som(it.price)}</div>
            <div style={txt(13.5, 400, g[50])}>{copy.ui.perDayLabel}</div>
          </div>
          <BlueButton label={copy.ui.book} pressed={pressAt(frame, bookTap)} style={{ width: 160 }} />
        </div>
      </BottomBar>
      <Tap x={pos(start).x} y={pos(start).y} at={startTap} size={48} />
      <Tap x={pos(end).x} y={pos(end).y} at={endTap} size={48} />
      <Tap x={290} y={852 - 74} at={bookTap} size={54} />
    </div>
  );
};

// ---------------------------------------------------------------- renter: payment + confirmation sheet
export const PaymentR: React.FC<{ copy: Copy; frame: number; payTap: number; sheetAt: number; checkTap: number; confirmTap: number; doneAt: number }> = ({
  copy,
  frame,
  payTap,
  sheetAt,
  checkTap,
  confirmTap,
  doneAt,
}) => {
  const it = copy.nearbyItems[0];
  const fee = Math.round(it.price * 0.1);
  const sheet = progress(frame, sheetAt, 14, easeOut);
  const checked = frame >= checkTap;
  return (
    <div style={{ position: 'absolute', inset: 0, background: g[0] }}>
      <Header title={copy.ui.paymentTitle} />
      <div style={{ position: 'absolute', top: 116, left: 14, right: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Card style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 62, height: 62, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
            <Img src={productImage[it.key]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <div style={txt(16.5, 600)}>{it.title}</div>
            <div style={txt(13.5, 400, g[50])}>{copy.ui.bookingDates}</div>
            <div style={txt(13.5, 400, g[50])}>{copy.ui.pickupReturn}</div>
          </div>
        </Card>
        <Card>
          <div style={txt(17, 600)}>{copy.ui.priceDetails}</div>
          {[
            [copy.ui.forDays(1), uzs(it.price)],
            [copy.ui.serviceFee, uzs(fee)],
          ].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, ...txt(15, 400, g[50]) }}>
              <span>{l}</span>
              <span style={txt(15, 600)}>{v}</span>
            </div>
          ))}
          <div style={{ height: 1, background: BORDER, margin: '14px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', ...txt(16, 600) }}>
            <span>{copy.ui.total}</span>
            <span>{uzs(it.price + fee)}</span>
          </div>
        </Card>
        <Card style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="card" size={24} color="#fff" stroke={1.7} />
          </div>
          <div>
            <div style={txt(14, 400, g[50])}>{copy.ui.yourBalance}</div>
            <div style={txt(19, 600)}>{uzs(500000 - (frame >= doneAt ? it.price + fee : 0))}</div>
          </div>
        </Card>
      </div>
      <BottomBar height={96}>
        <BlueButton label={copy.ui.pay} pressed={pressAt(frame, payTap)} />
      </BottomBar>
      <Tap x={196} y={852 - 74} at={payTap} size={54} />
      {sheet > 0 && (
        <>
          <div style={{ position: 'absolute', inset: 0, background: `rgba(9,9,11,${0.4 * sheet})`, zIndex: 20 }} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 172 + (1 - sheet) * 680, background: '#fff', borderRadius: '24px 24px 0 0', zIndex: 21, padding: '20px 19px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={txt(21, 600)}>{copy.ui.confirmOrder}</div>
              <Icon name="plus" size={22} color={g[100]} stroke={1.8} style={{ transform: 'rotate(45deg)' }} />
            </div>
            <Card style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 10 }}>
              <div style={{ gridColumn: '1 / 3', ...txt(15.5, 600) }}>{copy.ui.bookingInfo}</div>
              {[
                [copy.ui.item, it.title],
                [copy.ui.period, copy.ui.bookingDatesShort],
                [copy.ui.duration, copy.ui.forDays(1)],
                [copy.ui.totalPrice, uzs(it.price + fee)],
              ].map(([l, v]) => (
                <div key={l}>
                  <div style={txt(13, 400, g[50])}>{l}</div>
                  <div style={txt(14.5, 600)}>{v}</div>
                </div>
              ))}
            </Card>
            <div style={{ ...txt(18, 600), marginTop: 16 }}>{copy.ui.mainTerms}</div>
            {copy.ui.terms.map((t, i) => (
              <div key={t} style={{ display: 'flex', gap: 12, marginTop: 10, ...txt(13.5, 400, g[80]) }}>
                <Icon name={(['clock', 'camera', 'shield'] as const)[i]} size={20} color={[palette.orange[60], g[60], GREEN][i]} stroke={1.7} />
                <span>{t}</span>
              </div>
            ))}
            <div style={{ marginTop: 14, height: 44, borderRadius: 14, border: `1.5px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, ...txt(15.5, 600) }}>
              <Icon name="doc" size={20} color={g[100]} stroke={1.7} />
              {copy.ui.downloadContract}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, border: `1.5px solid ${checked ? BLUE : g[30]}`, background: checked ? BLUE : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {checked && <Icon name="check" size={15} color="#fff" stroke={3} />}
              </div>
              <span style={txt(14, 400, g[90])}>{copy.ui.acceptContract}</span>
            </div>
            <div style={{ position: 'absolute', left: 19, right: 19, bottom: 30, display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, height: 44, borderRadius: 14, background: g[10], display: 'flex', alignItems: 'center', justifyContent: 'center', ...txt(16, 600) }}>{copy.ui.cancel}</div>
              <BlueButton label={copy.ui.confirm} disabled={!checked} pressed={pressAt(frame, confirmTap)} style={{ flex: 1 }} />
            </div>
          </div>
          <Tap x={30} y={172 + 520} at={checkTap} size={44} />
          <Tap x={290} y={852 - 52} at={confirmTap} size={54} />
        </>
      )}
      <Success frame={frame} at={doneAt} title={copy.ui.requestSent} />
    </div>
  );
};

export const Success: React.FC<{ frame: number; at: number; title: string; sub?: string }> = ({ frame, at, title, sub }) => {
  const p = progress(frame, at, 10);
  if (p <= 0) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, background: `rgba(255,255,255,${0.97 * p})`, zIndex: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '0 36px' }}>
      <div style={{ width: 104, height: 104, borderRadius: 52, background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${pop(frame, at + 2, 10, 180)})`, boxShadow: '0 0 0 14px rgba(12,175,96,0.14)' }}>
        <Icon name="check" size={58} color="#fff" stroke={3.2} />
      </div>
      <div style={{ ...txt(22, 600), textAlign: 'center', opacity: progress(frame, at + 6, 8) }}>{title}</div>
      {sub && <div style={{ ...txt(15, 400, g[50]), textAlign: 'center', opacity: progress(frame, at + 8, 8) }}>{sub}</div>}
    </div>
  );
};

// ---------------------------------------------------------------- renter: pickup photos
export const PickupR: React.FC<{ copy: Copy; frame: number; shots: number[]; acceptAt: number }> = ({ copy, frame, shots, acceptAt }) => {
  const taken = shots.filter((s) => frame >= s).length;
  const flash = Math.max(0, ...shots.map((s) => (frame >= s && frame < s + 6 ? 1 - (frame - s) / 6 : 0)));
  const crops = ['50% 50%', '30% 60%', '70% 40%'];
  const zooms = [1, 1.5, 1.8];
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#fff' }}>
      <Header title={copy.ui.photoTitle} />
      <div style={{ position: 'absolute', top: 118, left: 19, right: 19 }}>
        <div style={{ padding: '12px 14px', borderRadius: 16, background: palette.orange[0], display: 'flex', gap: 10, alignItems: 'center', ...txt(14, 500, palette.orange[70]) }}>
          <Icon name="shield" size={20} color={palette.orange[60]} stroke={1.8} />
          {copy.ui.compareWarning}
        </div>
        <div style={{ position: 'relative', marginTop: 14, height: 300, borderRadius: 22, overflow: 'hidden', background: '#111' }}>
          <Img src={productImage[copy.nearbyItems[0].key]} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: crops[Math.min(taken, 2)], transform: `scale(${zooms[Math.min(taken, 2)]})` }} />
          <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: flash }} />
          <div style={{ position: 'absolute', top: 12, left: 12, padding: '3px 10px', borderRadius: 999, background: 'rgba(0,0,0,0.55)', ...txt(13, 500, '#fff') }}>{Math.min(taken, 3)}/3</div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 14, alignItems: 'center' }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: 78, height: 78, borderRadius: 14, background: g[10], border: `1.5px dashed ${g[30]}`, overflow: 'hidden' }}>
              {frame >= shots[i] && (
                <Img src={productImage[copy.nearbyItems[0].key]} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: crops[i], transform: `scale(${zooms[i] * pop(frame, shots[i] + 2, 12, 190)})` }} />
              )}
            </div>
          ))}
          <div style={{ marginLeft: 'auto', width: 64, height: 64, borderRadius: 32, border: `4px solid ${g[20]}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 24, background: BLUE, transform: `scale(${1 - flash * 0.12})` }} />
          </div>
        </div>
      </div>
      <BottomBar height={96}>
        <BlueButton label={copy.ui.accept} disabled={taken < 3} pressed={pressAt(frame, acceptAt)} />
      </BottomBar>
      {shots.map((s) => (
        <Tap key={s} x={340} y={118 + 64 + 300 + 14 + 32} at={s} size={52} />
      ))}
      <Tap x={196} y={852 - 74} at={acceptAt} size={54} />
      <Success frame={frame} at={acceptAt + 8} title={copy.ui.pickupSuccess} />
    </div>
  );
};

// ---------------------------------------------------------------- MyID (third-party SDK screen)
export const MyIdR: React.FC<{ copy: Copy; frame: number; scanAt: number; doneAt: number; name: string }> = ({ copy, frame, scanAt, doneAt, name }) => {
  const prog = progress(frame, scanAt, doneAt - scanAt, (t) => t);
  const ok = frame >= doneAt;
  const r = 136;
  const scanY = Math.sin(((frame - scanAt) / 26) * Math.PI) * 100;
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#0B0F1A' }}>
      <div style={{ position: 'absolute', top: 72, left: 0, right: 0, textAlign: 'center', ...txt(19, 600, '#fff') }}>MyID</div>
      <div style={{ position: 'absolute', top: 102, left: 0, right: 0, textAlign: 'center', ...txt(14, 400, 'rgba(255,255,255,0.6)') }}>{copy.ui.faceHint}</div>
      <div style={{ position: 'absolute', top: 160, left: (393 - 300) / 2, width: 300, height: 300 }}>
        <div style={{ position: 'absolute', left: 22, top: 22, width: 256, height: 256, borderRadius: 128, overflow: 'hidden' }}>
          <Img src={name === 'renter' ? img.avatarMalika : img.avatarDoston} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {!ok && frame >= scanAt && (
            <div style={{ position: 'absolute', left: 0, right: 0, top: 128 + scanY - 2, height: 4, background: 'linear-gradient(90deg, rgba(53,204,255,0) 0%, #35CCFF 50%, rgba(53,204,255,0) 100%)', boxShadow: '0 0 18px 6px rgba(53,204,255,0.45)' }} />
          )}
        </div>
        <svg width={300} height={300} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
          <circle cx={150} cy={150} r={r} stroke="rgba(255,255,255,0.12)" strokeWidth={8} fill="none" />
          <circle cx={150} cy={150} r={r} stroke={ok ? GREEN : '#35CCFF'} strokeWidth={8} fill="none" strokeLinecap="round" strokeDasharray={2 * Math.PI * r} strokeDashoffset={2 * Math.PI * r * (1 - prog)} />
        </svg>
      </div>
      <div style={{ position: 'absolute', top: 490, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        {ok ? (
          <div style={{ transform: `scale(${pop(frame, doneAt, 10, 190)})` }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 999, background: 'rgba(12,175,96,0.16)', ...txt(17, 600, '#63CE9A') }}>
              <Icon name="check" size={20} color="#63CE9A" stroke={3} />
              {copy.ui.myIdVerified}
            </div>
          </div>
        ) : (
          <div style={txt(16, 500, 'rgba(255,255,255,0.8)')}>
            {copy.ui.myIdScanning} {Math.round(prog * 100)}%
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- owner: profile switch, products, wizard
export const RenterProfileR: React.FC<{ copy: Copy; frame: number; tapAt?: number }> = ({ copy, frame, tapAt }) => (
  <div style={{ position: 'absolute', inset: 0, background: '#fff' }}>
    <div style={{ position: 'absolute', top: 60, left: 19, ...txt(26, 600) }}>{copy.ui.profile}</div>
    <div style={{ position: 'absolute', top: 108, left: 19, right: 19 }}>
      <Card style={{ display: 'flex', gap: 14, alignItems: 'center', borderRadius: 22 }}>
        <div style={{ width: 60, height: 60, borderRadius: 30, overflow: 'hidden' }}>
          <Img src={img.avatarDoston} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div>
          <div style={txt(15.5, 600)}>{copy.ownerFull}</div>
          <div style={{ ...txt(14, 400, g[50]), margin: '2px 0 6px' }}>{copy.ownerPhone}</div>
          <MyIdPill label={copy.ui.myIdVerified} />
        </div>
      </Card>
      <div style={{ marginTop: 12, borderRadius: 22, padding: '16px 16px 14px', border: '2px solid rgba(255,255,255,0.4)', background: `linear-gradient(21deg, ${palette.primary[70]} 0%, ${palette.primary[40]} 100%)`, boxShadow: '0 10px 24px -8px rgba(29,78,216,0.45)' }}>
        <div style={txt(14, 400, 'rgba(255,255,255,0.85)')}>{copy.ui.balanceLabel}</div>
        <div style={txt(28, 600, '#fff')}>{som(500000)}</div>
        <div style={{ marginTop: 10, height: 36, borderRadius: 999, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, ...txt(15, 600, BLUE) }}>
          <Icon name="card" size={18} color={BLUE} stroke={1.7} />
          {copy.ui.topUp}
        </div>
      </div>
      <Card style={{ marginTop: 12, borderRadius: 22, padding: '6px 16px' }}>
        {copy.ui.profileMenu.map((m) => (
          <div key={m} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 40, ...txt(16, 500) }}>
            {m}
            <Icon name="chevronRight" size={18} color={g[100]} stroke={2} />
          </div>
        ))}
      </Card>
      <div
        style={{
          marginTop: 12,
          borderRadius: 22,
          padding: 14,
          background: palette.primary[0],
          border: `1px solid ${palette.primary[10]}`,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          transform: `scale(${1 - pressAt(frame, tapAt) * 0.03})`,
        }}
      >
        <div style={{ width: 44, height: 44, borderRadius: 12, background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="box" size={24} color="#fff" stroke={1.7} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={txt(16, 600)}>{copy.ui.ownerCtaTitle}</div>
          <div style={txt(13, 400, g[50])}>{copy.ui.ownerCtaSub}</div>
        </div>
        <Icon name="chevronRight" size={18} color={BLUE} stroke={2} />
      </div>
    </div>
    <TabBarR active={3} labels={copy.ui.tabs} />
    {tapAt !== undefined && <Tap x={196} y={108 + 98 + 12 + 128 + 12 + 172 + 12 + 36} at={tapAt} size={54} />}
  </div>
);

export const NewListingR: React.FC<{ copy: Copy; frame: number; nameAt: number; addrAt: number; nextAt: number }> = ({ copy, frame, nameAt, addrAt, nextAt }) => {
  const name = copy.listingName;
  const typed = frame < nameAt ? '' : name.slice(0, Math.min(name.length, Math.floor((frame - nameAt) / 1.5) + 1));
  const addr = copy.ui.pickupPlace;
  const typedAddr = frame < addrAt ? '' : addr.slice(0, Math.min(addr.length, Math.floor((frame - addrAt) / 1.5) + 1));
  const caret = Math.floor(frame / 8) % 2 === 0;
  const field = (label: string, value: string, ph: string, active: boolean, h = 46, icon?: React.ReactNode) => (
    <div style={{ marginTop: 14 }}>
      <div style={txt(14.5, 500)}>{label}</div>
      <div style={{ marginTop: 7, height: h, borderRadius: 16, border: `1.3px solid ${active ? BLUE : BORDER}`, display: 'flex', alignItems: h > 50 ? 'flex-start' : 'center', padding: h > 50 ? '12px 14px' : '0 14px', ...txt(15.5, 400, value ? g[100] : g[40]) }}>
        {value || ph}
        {active && <span style={{ width: 2, height: 20, marginLeft: 1, background: BLUE, opacity: caret ? 1 : 0 }} />}
        {icon && <span style={{ marginLeft: 'auto' }}>{icon}</span>}
      </div>
    </div>
  );
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#fff' }}>
      <Header title={copy.ui.newListing} />
      <div style={{ position: 'absolute', top: 112, left: 19, right: 19, display: 'flex', gap: 6 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i === 0 ? BLUE : g[20] }} />
        ))}
      </div>
      <div style={{ position: 'absolute', top: 132, left: 19, right: 19 }}>
        <div style={txt(20, 600)}>{copy.ui.basicInfo}</div>
        {field(copy.ui.nameLabel, typed, copy.ui.namePlaceholder, frame >= nameAt && frame < addrAt)}
        {field(copy.ui.descLabel, frame >= nameAt + 30 ? copy.listingDesc : '', copy.ui.descPlaceholder, false, 92)}
        {field(copy.ui.categoryLabel, frame >= nameAt + 30 ? copy.ui.cats[1].replace('\n', ' ') : '', copy.ui.categoryPlaceholder, false, 46, <Icon name="chevronDown" size={18} color={g[60]} stroke={2} />)}
        {field(copy.ui.pickupLabel, typedAddr, copy.ui.addressPlaceholder, frame >= addrAt && frame < nextAt, 46, <Icon name="pin" size={20} color={g[60]} stroke={1.7} />)}
      </div>
      <BottomBar height={96}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 70, textAlign: 'center', ...txt(16, 600) }}>{copy.ui.back}</div>
          <BlueButton label={copy.ui.next} pressed={pressAt(frame, nextAt)} style={{ flex: 1 }} />
        </div>
      </BottomBar>
      <Tap x={250} y={852 - 74} at={nextAt} size={54} />
    </div>
  );
};

// ---------------------------------------------------------------- owner: notifications + order
export const NotificationsR: React.FC<{ copy: Copy; frame: number; newAt: number; tapAt?: number }> = ({ copy, frame, newAt, tapAt }) => {
  const s = pop(frame, newAt, 14, 160);
  const it = copy.nearbyItems[0];
  const card = (icon: React.ReactNode, title: string, body: React.ReactNode, time: string, details?: boolean) => (
    <Card style={{ display: 'flex', gap: 12, borderRadius: 22, padding: '14px 12px' }}>
      <div style={{ width: 44, height: 44, borderRadius: 22, background: g[10], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={txt(15.5, 600)}>{title}</div>
        <div style={{ ...txt(14, 400, g[50]), marginTop: 2 }}>{body}</div>
        {details && (
          <div style={{ marginTop: 8, borderRadius: 14, background: g[10], padding: '8px 10px', display: 'grid', gridTemplateColumns: 'auto 1fr', rowGap: 4, columnGap: 10, ...txt(13, 400, g[50]) }}>
            <span>{copy.ui.renter}</span>
            <span style={{ ...txt(13, 500), textAlign: 'right' }}>{copy.renterFull}</span>
            <span>{copy.ui.dateLabel}</span>
            <span style={{ ...txt(13, 500), textAlign: 'right' }}>{copy.ui.bookingDatesShort}</span>
            <span>{copy.ui.cost}</span>
            <span style={{ ...txt(13, 500, GREEN), textAlign: 'right' }}>{uzs(it.price)}</span>
          </div>
        )}
        <div style={{ ...txt(12.5, 400, g[50]), marginTop: 6 }}>{time}</div>
      </div>
      <div style={{ width: 8, height: 8, borderRadius: 4, background: BLUE, alignSelf: 'center' }} />
    </Card>
  );
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#fff' }}>
      <Header title={copy.ui.notifications} />
      <div style={{ position: 'absolute', top: 118, left: 19, right: 19, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ transform: `translateY(${(1 - s) * -40}px) scale(${(0.94 + 0.06 * s) * (1 - pressAt(frame, tapAt) * 0.03)})`, opacity: Math.min(1, s * 1.5) }}>
          {card(<Icon name="box" size={22} color={g[100]} stroke={1.6} />, copy.ui.newRequestTitle, <>
            {copy.ui.newRequestPrefix} <span style={{ color: BLUE }}>«{it.title}»</span>
          </>, copy.ui.justNow, true)}
        </div>
        {card(<Icon name="check" size={22} color={g[100]} stroke={1.8} />, copy.ui.rentalDone, copy.ui.rentalDoneBody, copy.ui.yesterday)}
        {card(<Icon name="card" size={22} color={g[100]} stroke={1.6} />, copy.ui.balanceToppedUp, <>
          {copy.ui.balanceToppedUpPrefix} <span style={{ color: GREEN }}>{uzs(150000)}</span>
        </>, copy.ui.yesterday)}
      </div>
      {tapAt !== undefined && <Tap x={196} y={190} at={tapAt} size={54} />}
    </div>
  );
};

export const OrderR: React.FC<{ copy: Copy; frame: number; handTap?: number; doneAt?: number }> = ({ copy, frame, handTap, doneAt }) => {
  const it = copy.nearbyItems[0];
  const row = (l: string, v: React.ReactNode) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, ...txt(15, 400, g[50]) }}>
      <span>{l}</span>
      <span style={txt(15, 500)}>{v}</span>
    </div>
  );
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#fff' }}>
      <Header title={copy.ui.orderTitle} />
      <div style={{ position: 'absolute', top: 116, left: 19, right: 19 }}>
        <Chip label={copy.ui.statusActive} tone="green" />
        <Card style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center', borderRadius: 22 }}>
          <div style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden' }}>
            <Img src={productImage[it.key]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <div style={txt(16, 500)}>{it.title}</div>
            <div style={txt(14, 400, g[50])}>{perKun(it.price)}</div>
          </div>
        </Card>
        <div style={{ ...txt(17, 600), marginTop: 18 }}>{copy.ui.renter}</div>
        <Card style={{ marginTop: 10, display: 'flex', gap: 14, alignItems: 'center', borderRadius: 22, boxShadow: '0 6px 18px rgba(15,23,42,0.05)' }}>
          <Initial size={64} />
          <div>
            <div style={txt(15.5, 600)}>{copy.renterFull}</div>
            <div style={{ ...txt(14, 400, g[50]), margin: '2px 0 6px' }}>{copy.renterPhone}</div>
            <MyIdPill label={copy.ui.myIdVerified} />
          </div>
        </Card>
        <Card style={{ marginTop: 12, borderRadius: 22 }}>
          <div style={txt(17, 600)}>{copy.ui.rentalPeriod}</div>
          {row(copy.ui.pickup, copy.ui.pickupWhen)}
          {row(copy.ui.returnLabel, copy.ui.returnWhen)}
          {row(copy.ui.term, copy.ui.termValue)}
        </Card>
        <Card style={{ marginTop: 12, borderRadius: 22 }}>
          <div style={txt(17, 600)}>{copy.ui.calc}</div>
          {row(copy.ui.rentLine, som(it.price))}
          {row(copy.ui.commission, '- 0 so‘m')}
          <div style={{ height: 1, background: BORDER, margin: '12px 0 0' }} />
          {row(copy.ui.yourEarnings, <span style={{ color: GREEN, fontWeight: 600 }}>{som(it.price)}</span>)}
        </Card>
      </div>
      {handTap !== undefined && (
        <>
          <BottomBar height={96}>
            <BlueButton label={copy.ui.handedOver} pressed={pressAt(frame, handTap)} />
          </BottomBar>
          <Tap x={196} y={852 - 74} at={handTap} size={54} />
        </>
      )}
      {doneAt !== undefined && <Success frame={frame} at={doneAt} title={copy.ui.handedOverDone} />}
    </div>
  );
};

// ---------------------------------------------------------------- owner: dashboard + withdraw
export const DashboardR: React.FC<{ copy: Copy; frame: number; countAt: number }> = ({ copy, frame, countAt }) => {
  const total = countUp(frame, countAt, 40, 2146000, 1000);
  const orders = Math.round(interpolate(frame, [countAt, countAt + 40], [0, 59], clamp));
  const pts = [0.1, 0.04, 0.22, 0.4, 1, 0.24];
  const draw = progress(frame, countAt + 4, 36);
  const W = 300;
  const H = 120;
  const path = pts.map((v, i) => `${i ? 'L' : 'M'}${(i / (pts.length - 1)) * W},${H - v * H}`).join(' ');
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#fff' }}>
      <div style={{ position: 'absolute', top: 64, left: 19, right: 19 }}>
        <div style={txt(15, 400, g[50])}>{copy.ui.welcome}</div>
        <div style={txt(24, 700)}>{copy.ownerFull}</div>
      </div>
      <div style={{ position: 'absolute', top: 140, left: 19, right: 19, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          [copy.ui.totalEarnings, groupDigits(total), copy.currency, BLUE],
          [copy.ui.activeListings, '7', copy.ui.itemsSuffix, g[100]],
          [copy.ui.totalBookings, String(orders), copy.ui.allTime, g[100]],
          [copy.ui.avgDaily, groupDigits(75500), copy.currency, g[100]],
        ].map(([l, v, s, c]) => (
          <Card key={l} style={{ borderRadius: 20 }}>
            <div style={{ ...txt(13, 400, g[50]), whiteSpace: 'nowrap' }}>{l}</div>
            <div style={txt(25, 700, c)}>{v}</div>
            <div style={txt(13, 400, g[40])}>{s}</div>
          </Card>
        ))}
      </div>
      <div style={{ position: 'absolute', top: 392, left: 19, right: 19 }}>
        <Card style={{ borderRadius: 22 }}>
          <div style={txt(18, 600)}>{copy.ui.earningsOverview}</div>
          <div style={txt(13.5, 400, g[50])}>{copy.ui.earningsSub}</div>
          <svg width={W} height={H + 10} style={{ marginTop: 14, overflow: 'visible' }}>
            <defs>
              <clipPath id="draw">
                <rect x={0} y={-10} width={W * draw} height={H + 20} />
              </clipPath>
            </defs>
            <g clipPath="url(#draw)">
              <path d={`${path} L${W},${H} L0,${H} Z`} fill="rgba(12,175,96,0.10)" />
              <path d={path} stroke={GREEN} strokeWidth={2.5} fill="none" />
              {pts.map((v, i) => (
                <circle key={i} cx={(i / (pts.length - 1)) * W} cy={H - v * H} r={4} fill={GREEN} />
              ))}
            </g>
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', ...txt(12, 400, g[40]), marginTop: 6 }}>
            {copy.ui.months.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </Card>
      </div>
      <TabBarR owner active={0} labels={copy.ui.ownerTabs} />
    </div>
  );
};

export const OwnerProfileR: React.FC<{ copy: Copy; frame: number; withdrawTap: number; doneAt: number }> = ({ copy, frame, withdrawTap, doneAt }) => (
  <div style={{ position: 'absolute', inset: 0, background: '#fff' }}>
    <div style={{ position: 'absolute', top: 60, left: 19, ...txt(26, 600) }}>{copy.ui.profile}</div>
    <div style={{ position: 'absolute', top: 108, left: 19, right: 19 }}>
      <Card style={{ display: 'flex', gap: 14, alignItems: 'center', borderRadius: 22 }}>
        <div style={{ width: 60, height: 60, borderRadius: 30, overflow: 'hidden' }}>
          <Img src={img.avatarDoston} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div>
          <div style={txt(15.5, 600)}>{copy.ownerFull}</div>
          <div style={{ ...txt(14, 400, g[50]), margin: '2px 0 6px' }}>{copy.ownerPhone}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 999, background: palette.yellow[0], border: `1px solid ${palette.yellow[30]}`, ...txt(13.5, 600) }}>
            <Icon name="star" size={15} color={palette.yellow[60]} fill={palette.yellow[60]} stroke={1} />
            5.0
          </div>
        </div>
      </Card>
      <div style={{ marginTop: 12, borderRadius: 22, padding: '16px 16px 14px', border: '2px solid rgba(255,255,255,0.4)', background: `linear-gradient(21deg, ${palette.orange[70]} 0%, ${palette.orange[40]} 100%)`, boxShadow: '0 10px 24px -8px rgba(204,96,2,0.45)' }}>
        <div style={txt(14, 400, 'rgba(255,255,255,0.88)')}>{copy.ui.balanceLabel}</div>
        <div style={txt(28, 600, '#fff')}>{som(frame >= doneAt ? 0 : 230000)}</div>
        <div style={{ marginTop: 10, height: 36, borderRadius: 999, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, ...txt(15, 600, colors.critical), transform: `scale(${1 - pressAt(frame, withdrawTap) * 0.04})` }}>
          <Icon name="card" size={18} color={colors.critical} stroke={1.7} />
          {copy.ui.withdraw}
        </div>
      </div>
      <Card style={{ marginTop: 12, borderRadius: 22, padding: '6px 16px' }}>
        {copy.ui.ownerMenu.map((m) => (
          <div key={m} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 40, ...txt(16, 500) }}>
            {m}
            <Icon name="chevronRight" size={18} color={g[100]} stroke={2} />
          </div>
        ))}
      </Card>
    </div>
    <TabBarR owner active={3} labels={copy.ui.ownerTabs} />
    <Tap x={196} y={108 + 98 + 12 + 100} at={withdrawTap} size={54} />
    <Success frame={frame} at={doneAt} title={copy.ui.withdrawSuccess} sub={`${som(230000)} → Uzcard •••• 3708`} />
  </div>
);
