/**
 * Full app screens (393×852 pt) recreated for the Reels. Each takes the
 * scene-local frame plus the frames at which its interactions happen, so the
 * scenes can choreograph taps, typing and state changes on the beat.
 */
import React from 'react';
import { Img, interpolate } from 'remotion';
import { bob, countUp, easeOut, groupDigits, pop, progress } from '../anim';
import { icon3d, img, productImage } from '../assets';
import { colors, palette } from '../brand';
import type { Copy } from '../copy/types';
import {
  AvatarUI,
  BalanceCardUI,
  ButtonUI,
  CategoryCircle,
  CheckboxUI,
  HomeHeader,
  ProductCardUI,
  RowUI,
  ScreenHeader,
  SearchBarUI,
  SectionTitle,
  Stars,
  StatusChip,
  T,
  TabBarUI,
  VerifiedBadge,
} from './AppUI';
import { Icon } from './Icon';
import { Tap } from './Scene';

const g = palette.gray;
const sum = (copy: Copy, n: number) => `${groupDigits(n)} ${copy.currency}`;
const perDay = (copy: Copy, n: number) => `${groupDigits(n)} ${copy.perDay}`;
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export const SEARCH_IMAGES = [img.cameraHero, img.cameraNikon, img.cameraCanon, img.cameraNikonBag];

/** Bottom sheet that slides up from the bottom of the screen. */
export const Sheet: React.FC<{ frame: number; at: number; top: number; children: React.ReactNode; dim?: boolean }> = ({
  frame,
  at,
  top,
  children,
  dim = true,
}) => {
  const p = progress(frame, at, 14, easeOut);
  if (p <= 0) return null;
  return (
    <>
      {dim && <div style={{ position: 'absolute', inset: 0, background: `rgba(9,9,11,${0.4 * p})`, zIndex: 20 }} />}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: top + (1 - p) * (852 - top),
          bottom: 0,
          background: '#FFFFFF',
          borderRadius: '28px 28px 0 0',
          zIndex: 21,
          padding: '10px 20px 0',
          boxShadow: '0 -10px 30px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ width: 40, height: 5, borderRadius: 3, background: g[20], margin: '0 auto 14px' }} />
        {children}
      </div>
    </>
  );
};

/** Green success overlay (check + message) used after pay / publish / withdraw. */
export const SuccessOverlay: React.FC<{ frame: number; at: number; title: string; sub?: string; chip?: React.ReactNode }> = ({
  frame,
  at,
  title,
  sub,
  chip,
}) => {
  const p = progress(frame, at, 10);
  if (p <= 0) return null;
  const s = pop(frame, at + 2, 10, 180);
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `rgba(255,255,255,${0.97 * p})`,
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: '0 40px',
      }}
    >
      <div
        style={{
          width: 108,
          height: 108,
          borderRadius: 54,
          background: colors.success,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${s})`,
          boxShadow: '0 0 0 14px rgba(12,175,96,0.14), 0 0 0 30px rgba(12,175,96,0.07)',
        }}
      >
        <Icon name="check" size={60} color="#fff" stroke={3.2} />
      </div>
      <div style={{ ...T.h2, color: g[100], textAlign: 'center', opacity: progress(frame, at + 6, 8), marginTop: 18 }}>{title}</div>
      {sub && <div style={{ ...T.bodyLg, color: g[50], textAlign: 'center', opacity: progress(frame, at + 8, 8) }}>{sub}</div>}
      {chip && <div style={{ opacity: progress(frame, at + 10, 8) }}>{chip}</div>}
    </div>
  );
};

// ---------------------------------------------------------------- renter: home → search
export const HomeScreen: React.FC<{ copy: Copy; frame: number; scrollAt?: number; categories?: string[] }> = ({
  copy,
  frame,
  scrollAt = 44,
  categories,
}) => {
  const scroll = interpolate(frame, [scrollAt, scrollAt + 56], [0, 181], { ...clamp, easing: easeOut });
  const cats = ['camera', 'gamepad', 'dumbbells', 'scooter', 'laptop'] as const;
  const labels = categories ?? copy.promo.categories;
  const rail = copy.products.slice(0, 5);
  const grid = [copy.products[4], copy.products[5]];
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#FFFFFF' }}>
      <div style={{ position: 'absolute', top: 60, left: 0, right: 0 }}>
        <HomeHeader city={copy.ui.city} />
      </div>
      <div style={{ position: 'absolute', top: 116, left: 20, right: 20 }}>
        <SearchBarUI placeholder={copy.ui.searchPlaceholder} />
      </div>
      <div style={{ position: 'absolute', top: 184, left: 12, display: 'flex', gap: 2 }}>
        {cats.map((c, i) => (
          <CategoryCircle key={c} icon={icon3d(c)} label={labels[i]} active={i === 0} />
        ))}
      </div>
      <div style={{ position: 'absolute', top: 290, left: 0, right: 0 }}>
        <SectionTitle title={copy.ui.nearby} action={copy.ui.viewAll} />
      </div>
      <div style={{ position: 'absolute', top: 330, left: 20 - scroll, display: 'flex', gap: 12 }}>
        {rail.map((p) => (
          <ProductCardUI key={p.key} image={productImage[p.key]} title={p.title} location={`${p.distance} • ${p.place}`} price={perDay(copy, p.price)} rating={p.rating} />
        ))}
      </div>
      <div style={{ position: 'absolute', top: 600, left: 20, display: 'flex', gap: 12 }}>
        {grid.map((p) => (
          <ProductCardUI key={p.key} image={productImage[p.key]} title={p.title} location={`${p.distance} • ${p.place}`} price={perDay(copy, p.price)} rating={p.rating} />
        ))}
      </div>
      <TabBarUI labels={copy.ui.tabs} active={0} />
    </div>
  );
};

/** Search: focused bar, the query typed letter by letter, then a 2×2 result grid. */
export const SearchScreen: React.FC<{ copy: Copy; frame: number; typeAt: number; resultsAt: number; tapAt?: number }> = ({
  copy,
  frame,
  typeAt,
  resultsAt,
  tapAt,
}) => {
  const q = copy.ui.searchQuery;
  const typed = q.slice(0, Math.max(0, Math.min(q.length, Math.floor((frame - typeAt) / 4) + 1)));
  const caret = Math.floor(frame / 8) % 2 === 0;
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#FFFFFF' }}>
      <div style={{ position: 'absolute', top: 60, left: 20, right: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: 20, background: g[10], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevronLeft" size={20} color={g[90]} />
        </div>
        <SearchBarUI placeholder={copy.ui.searchPlaceholder} text={frame >= typeAt ? typed : ''} focused caretOn={caret} style={{ flex: 1 }} />
      </div>
      {frame >= resultsAt && (
        <>
          <div style={{ position: 'absolute', top: 122, left: 20, ...T.bodyMedium, color: g[50], opacity: progress(frame, resultsAt, 8) }}>
            {copy.ui.resultsCount}
          </div>
          <div style={{ position: 'absolute', top: 152, left: 20, display: 'grid', gridTemplateColumns: '169px 169px', columnGap: 15, rowGap: 18 }}>
            {copy.searchResults.map((r, i) => {
              const s = pop(frame, resultsAt + 3 + i * 4, 14, 170);
              const pressed = tapAt !== undefined && i === 0 ? Math.sin(Math.min(1, Math.max(0, (frame - tapAt) / 8)) * Math.PI) : 0;
              return (
                <div key={r.title} style={{ transform: `translateY(${(1 - s) * 40}px) scale(${1 - pressed * 0.04})`, opacity: Math.min(1, s * 1.5) }}>
                  <ProductCardUI image={SEARCH_IMAGES[i]} title={r.title} location={`${r.distance} • ${r.place}`} price={perDay(copy, r.price)} rating={r.rating} />
                </div>
              );
            })}
          </div>
        </>
      )}
      {frame < resultsAt && (
        <div style={{ position: 'absolute', top: 140, left: 20, right: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {['Sony A7', 'PlayStation 5', 'DJI Mini'].map((s) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, ...T.bodyLg, color: g[70] }}>
              <Icon name="clock" size={18} color={g[40]} />
              {s}
            </div>
          ))}
        </div>
      )}
      {tapAt !== undefined && <Tap x={104} y={240} at={tapAt} size={56} />}
    </div>
  );
};

/** Product page: hero photo, rating, verified owner, price + book button. */
export const ProductPage: React.FC<{ copy: Copy; frame: number; bookTapAt?: number }> = ({ copy, frame, bookTapAt }) => {
  const p = copy.products[0];
  const pressed = bookTapAt !== undefined ? Math.sin(Math.min(1, Math.max(0, (frame - bookTapAt) / 8)) * Math.PI) : 0;
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#FFFFFF' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 360, overflow: 'hidden', background: '#111' }}>
        <Img src={img.cameraHero} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.08 - 0.08 * progress(frame, 0, 60)})` }} />
        <div style={{ position: 'absolute', top: 58, left: 20, width: 40, height: 40, borderRadius: 20, background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevronLeft" size={20} color={g[90]} />
        </div>
        <div style={{ position: 'absolute', top: 58, right: 20, width: 40, height: 40, borderRadius: 20, background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="bookmark" size={18} color={g[90]} />
        </div>
        <div style={{ position: 'absolute', bottom: 14, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ width: i === 0 ? 18 : 6, height: 6, borderRadius: 3, background: i === 0 ? '#fff' : 'rgba(255,255,255,0.5)' }} />
          ))}
        </div>
      </div>
      <div style={{ position: 'absolute', top: 376, left: 20, right: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ ...T.h2, color: g[100] }}>{p.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...T.bodyMedium, color: g[60] }}>
          <Icon name="star" size={16} color={palette.yellow[60]} fill={palette.yellow[60]} stroke={1} />
          <span style={{ color: g[100], fontWeight: 600 }}>{p.rating.toFixed(1)}</span>
          <span>· {copy.ui.reviews}</span>
          <span style={{ marginLeft: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="pin" size={16} color={g[50]} />
            {p.distance} • {p.place}
          </span>
        </div>
        <div style={{ marginTop: 8, padding: 14, borderRadius: 16, background: g[10], display: 'flex', alignItems: 'center', gap: 12 }}>
          <AvatarUI src={img.avatarDoston} size={46} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ ...T.bodyLgSemi, color: g[100] }}>
              {copy.ownerName} <span style={{ ...T.caption, color: g[50] }}>· {copy.ui.owner}</span>
            </div>
            <VerifiedBadge label={copy.ui.verified} />
          </div>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 104,
          borderTop: `1px solid ${colors.strokeLight}`,
          background: '#fff',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '14px 20px 0',
        }}
      >
        <div>
          <div style={{ ...T.h3, fontWeight: 700, color: g[100] }}>{sum(copy, p.price)}</div>
          <div style={{ ...T.caption, color: g[50] }}>{copy.ui.perDayLabel}</div>
        </div>
        <ButtonUI label={copy.ui.book} pressed={pressed} style={{ width: 180 }} />
      </div>
      {bookTapAt !== undefined && <Tap x={300} y={772} at={bookTapAt} size={56} />}
    </div>
  );
};

/** Calendar sheet: tap the first and last day, the range fills in. */
export const CalendarSheet: React.FC<{ copy: Copy; frame: number; at: number; startTap: number; endTap: number; bookTap: number }> = ({
  copy,
  frame,
  at,
  startTap,
  endTap,
  bookTap,
}) => {
  const offset = 3; // 1 Oct 2026 is a Thursday
  const cell = 50.4;
  const start = 14;
  const end = 16;
  const past = 6;
  const booked = [9, 10, 22];
  const sA = pop(frame, startTap, 12, 200);
  const sB = pop(frame, endTap, 12, 200);
  const band = progress(frame, endTap, 10);
  const days = Math.round(interpolate(band, [0, 1], [1, 3]));
  const total = frame >= endTap ? countUp(frame, endTap, 18, 750000, 10000) : frame >= startTap ? 250000 : 0;
  const pressed = Math.sin(Math.min(1, Math.max(0, (frame - bookTap) / 8)) * Math.PI);
  const sheetTop = 300;
  // cell centre in screen points (for the tap indicators)
  const pos = (d: number) => {
    const i = d - 1 + offset;
    return { x: 20 + (i % 7) * cell + cell / 2, y: sheetTop + 128 + Math.floor(i / 7) * 46 + 21 };
  };
  return (
    <>
      <Sheet frame={frame} at={at} top={sheetTop}>
        <div style={{ ...T.h4, color: g[100], marginBottom: 10 }}>{copy.ui.selectDates}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Icon name="chevronLeft" size={20} color={g[40]} />
          <div style={{ ...T.bodyLgSemi, color: g[100] }}>{copy.ui.calendarMonth} 2026</div>
          <Icon name="chevronRight" size={20} color={g[90]} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(7, ${cell}px)` }}>
          {copy.ui.weekdays.map((w) => (
            <div key={w} style={{ ...T.captionMedium, color: g[40], textAlign: 'center', height: 24 }}>
              {w}
            </div>
          ))}
        </div>
        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: `repeat(7, ${cell}px)`, rowGap: 4 }}>
          {Array.from({ length: offset }).map((_, i) => (
            <div key={`e${i}`} />
          ))}
          {Array.from({ length: 31 }).map((_, i) => {
            const d = i + 1;
            const inRange = d >= start && d <= end;
            const isStart = d === start;
            const isEnd = d === end;
            const col = (d - 1 + offset) % 7;
            const disabled = d <= past || booked.includes(d);
            const sel = (isStart && frame >= startTap) || (isEnd && frame >= endTap);
            const s = isStart ? sA : isEnd ? sB : 1;
            // range band: grows from the start day to the end day
            const bandOn = inRange && frame >= endTap && (d - start) / (end - start) <= band + 0.01;
            return (
              <div key={d} style={{ position: 'relative', height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {bandOn && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 2,
                      bottom: 2,
                      left: isStart || col === 0 ? '50%' : 0,
                      right: isEnd || col === 6 ? '50%' : 0,
                      background: palette.primary[0],
                    }}
                  />
                )}
                {sel && (
                  <div style={{ position: 'absolute', width: 40, height: 40, borderRadius: 20, background: colors.primary, transform: `scale(${s})` }} />
                )}
                <div
                  style={{
                    position: 'relative',
                    ...T.bodyMedium,
                    color: sel ? '#fff' : disabled ? g[30] : inRange && bandOn ? palette.primary[70] : g[100],
                    textDecoration: booked.includes(d) ? 'line-through' : 'none',
                  }}
                >
                  {d}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ height: 1, background: colors.strokeLight, margin: '10px 0 12px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ ...T.caption, color: g[50] }}>{frame >= endTap ? copy.ui.rangeLabel : copy.days(days)}</div>
            <div style={{ ...T.h3, fontWeight: 700, color: g[100] }}>{total ? sum(copy, total) : '—'}</div>
          </div>
          <ButtonUI label={copy.ui.book} pressed={pressed} style={{ width: 170, opacity: frame >= endTap ? 1 : 0.45 }} />
        </div>
      </Sheet>
      <Tap x={pos(start).x} y={pos(start).y} at={startTap} size={52} />
      <Tap x={pos(end).x} y={pos(end).y} at={endTap} size={52} />
      <Tap x={288} y={sheetTop + 128 + 5 * 46 + 70} at={bookTap} size={56} />
    </>
  );
};

/** Payment: wallet balance, order summary, contract checkbox, pay. */
export const PaymentScreen: React.FC<{ copy: Copy; frame: number; checkAt: number; payAt: number; doneAt: number }> = ({
  copy,
  frame,
  checkAt,
  payAt,
  doneAt,
}) => {
  const p = copy.products[0];
  const checked = progress(frame, checkAt, 6);
  const pressed = Math.sin(Math.min(1, Math.max(0, (frame - payAt) / 8)) * Math.PI);
  // wallet goes 1 200 000 → 450 000 as the booking is paid
  const balance = 1200000 - Math.round((750000 * progress(frame, payAt + 4, 16)) / 5000) * 5000;
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#FFFFFF' }}>
      <div style={{ position: 'absolute', top: 58, left: 0, right: 0 }}>
        <ScreenHeader title={copy.ui.paymentTitle} />
      </div>
      <div style={{ position: 'absolute', top: 116, left: 20 }}>
        <BalanceCardUI label={copy.ui.yourBalance} amount={sum(copy, balance)} />
      </div>
      <div style={{ position: 'absolute', top: 240, left: 20, right: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 14, overflow: 'hidden' }}>
            <Img src={img.cameraHero} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <div style={{ ...T.bodyLgSemi, color: g[100] }}>{p.title}</div>
            <div style={{ ...T.body, color: g[50] }}>{perDay(copy, p.price)}</div>
          </div>
        </div>
        <div style={{ padding: 16, borderRadius: 16, background: g[10], display: 'flex', flexDirection: 'column', gap: 10 }}>
          <RowUI label={copy.ui.item} value={p.title} />
          <RowUI label={copy.ui.period} value={copy.ui.rentalDates} />
          <RowUI label={copy.ui.duration} value={copy.days(3)} />
          <div style={{ height: 1, background: g[20] }} />
          <RowUI label={copy.ui.totalPrice} value={sum(copy, 750000)} strong />
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginTop: 4 }}>
          <CheckboxUI checked={checked} />
          <div style={{ ...T.body, color: g[80] }}>
            {copy.ui.acceptContract.split('договора аренды')[0]}
            <span style={{ color: colors.primary, fontWeight: 600 }}>{copy.ui.acceptContract.includes('договора аренды') ? 'договора аренды' : ''}</span>
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 20, right: 20, bottom: 40 }}>
        <ButtonUI label={`${copy.ui.pay} ${sum(copy, 750000)}`} pressed={pressed} style={{ opacity: 0.45 + 0.55 * checked }} />
      </div>
      <Tap x={31} y={536} at={checkAt} size={50} />
      <Tap x={196} y={788} at={payAt} size={56} />
      <SuccessOverlay frame={frame} at={doneAt} title={copy.ui.requestSent} chip={<StatusChip label={copy.ui.pendingRenter} tone="orange" />} />
    </div>
  );
};

/** Handover photos: viewfinder, three shutter shots, checklist, accept. */
export const PhotoScreen: React.FC<{ copy: Copy; frame: number; shots: number[]; acceptAt: number }> = ({ copy, frame, shots, acceptAt }) => {
  const taken = shots.filter((s) => frame >= s).length;
  const flash = Math.max(...shots.map((s) => (frame >= s && frame < s + 6 ? 1 - (frame - s) / 6 : 0)));
  const crops = ['50% 50%', '25% 60%', '75% 35%'];
  const zooms = [1, 1.6, 1.9];
  const pressed = Math.sin(Math.min(1, Math.max(0, (frame - acceptAt) / 8)) * Math.PI);
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#FFFFFF' }}>
      <div style={{ position: 'absolute', top: 58, left: 0, right: 0 }}>
        <ScreenHeader title={copy.ui.photoTitle} />
      </div>
      <div style={{ position: 'absolute', top: 116, left: 20, right: 20, height: 330, borderRadius: 24, overflow: 'hidden', background: '#111' }}>
        <Img
          src={img.cameraHero}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: crops[Math.min(taken, 2)],
            transform: `scale(${zooms[Math.min(taken, 2)]})`,
          }}
        />
        {/* focus brackets */}
        {[
          { top: 60, left: 70, b: 'borderTop borderLeft' },
          { top: 60, right: 70, b: 'borderTop borderRight' },
          { bottom: 60, left: 70, b: 'borderBottom borderLeft' },
          { bottom: 60, right: 70, b: 'borderBottom borderRight' },
        ].map((c, i) => {
          const st: React.CSSProperties = { position: 'absolute', width: 34, height: 34, ...c } as React.CSSProperties;
          for (const side of c.b.split(' ')) (st as Record<string, string>)[side] = '3px solid rgba(255,255,255,0.9)';
          return <div key={i} style={st} />;
        })}
        <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: flash }} />
        <div style={{ position: 'absolute', top: 14, left: 14, padding: '4px 10px', borderRadius: 999, background: 'rgba(0,0,0,0.55)', color: '#fff', ...T.captionMedium }}>
          {Math.min(taken, 3)}/3
        </div>
      </div>
      <div style={{ position: 'absolute', top: 462, left: 20, right: 20, display: 'flex', gap: 10 }}>
        {[0, 1, 2].map((i) => {
          const s = pop(frame, shots[i] + 2, 12, 190);
          return (
            <div key={i} style={{ width: 80, height: 80, borderRadius: 14, background: g[10], border: `1.5px dashed ${g[30]}`, overflow: 'hidden', position: 'relative' }}>
              {frame >= shots[i] && (
                <Img
                  src={img.cameraHero}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: crops[i], transform: `scale(${zooms[i] * s})` }}
                />
              )}
            </div>
          );
        })}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 68, height: 68, borderRadius: 34, border: `4px solid ${g[20]}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: 26, background: colors.primary, transform: `scale(${1 - flash * 0.12})` }} />
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', top: 566, left: 20, right: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
        <CheckboxUI checked={taken >= 3 ? progress(frame, shots[2] + 8, 6) : 0} />
        <div style={{ ...T.bodyMedium, color: g[80] }}>{copy.ui.pickupNote}</div>
      </div>
      <div style={{ position: 'absolute', left: 20, right: 20, bottom: 40 }}>
        <ButtonUI label={copy.ui.accept} pressed={pressed} style={{ opacity: taken >= 3 ? 1 : 0.45 }} />
      </div>
      {shots.map((s) => (
        <Tap key={s} x={332} y={502} at={s} size={56} />
      ))}
      <Tap x={196} y={788} at={acceptAt} size={56} />
    </div>
  );
};

/** Booking status stepper that completes step by step, then a 5-star review. */
export const StatusScreen: React.FC<{ copy: Copy; frame: number; at: number; stepEvery: number; rateAt: number }> = ({
  copy,
  frame,
  at,
  stepEvery,
  rateAt,
}) => {
  const p = copy.products[0];
  const done = (i: number) => frame >= at + i * stepEvery;
  const tones = ['blue', 'violet', 'orange', 'green'] as const;
  const current = copy.ui.statuses.reduce((acc, _, i) => (done(i) ? i : acc), 0);
  const stars = interpolate(frame, [rateAt, rateAt + 20], [0, 5], clamp);
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#FFFFFF' }}>
      <div style={{ position: 'absolute', top: 58, left: 0, right: 0 }}>
        <ScreenHeader title={copy.ui.bookingStatus} />
      </div>
      <div style={{ position: 'absolute', top: 120, left: 20, right: 20, padding: 14, borderRadius: 18, background: g[10], display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ width: 60, height: 60, borderRadius: 14, overflow: 'hidden' }}>
          <Img src={img.cameraHero} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ ...T.bodyLgSemi, color: g[100] }}>{p.title}</div>
          <div style={{ ...T.caption, color: g[50] }}>{copy.ui.rentalDates}</div>
        </div>
        <StatusChip label={copy.ui.statuses[current]} tone={tones[current]} />
      </div>
      <div style={{ position: 'absolute', top: 222, left: 34, right: 20 }}>
        {copy.ui.statuses.map((s, i) => {
          const on = done(i);
          const fill = progress(frame, at + i * stepEvery, 10);
          const line = i < 3 ? progress(frame, at + (i + 1) * stepEvery - 10, 10) : 0;
          return (
            <div key={s} style={{ position: 'relative', height: 74, display: 'flex', gap: 16 }}>
              {i < 3 && (
                <div style={{ position: 'absolute', left: 15, top: 34, width: 3, height: 44, background: g[20], borderRadius: 2 }}>
                  <div style={{ width: '100%', height: `${line * 100}%`, background: colors.success, borderRadius: 2 }} />
                </div>
              )}
              <div
                style={{
                  width: 33,
                  height: 33,
                  borderRadius: 17,
                  background: on ? colors.success : '#fff',
                  border: on ? 'none' : `2.5px solid ${g[20]}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `scale(${on ? 0.7 + 0.3 * pop(frame, at + i * stepEvery, 10, 200) : 1})`,
                  flexShrink: 0,
                }}
              >
                {on && <Icon name="check" size={20} color="#fff" stroke={3} />}
              </div>
              <div style={{ paddingTop: 4 }}>
                <div style={{ ...T.bodyLgSemi, color: on ? g[100] : g[40], opacity: 0.5 + 0.5 * fill }}>{s}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 20,
          right: 20,
          top: 540,
          padding: 18,
          borderRadius: 20,
          border: `1.5px solid ${colors.strokeDark}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          opacity: progress(frame, rateAt - 10, 10),
          transform: `translateY(${(1 - progress(frame, rateAt - 10, 10)) * 30}px)`,
        }}
      >
        <div style={{ ...T.h4, color: g[100] }}>{copy.ui.rateTitle}</div>
        <Stars value={stars} size={34} />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- owner
/** MyID face check: ring progress around the face, then a green verified state. */
export const MyIdScreen: React.FC<{ copy: Copy; frame: number; scanAt: number; doneAt: number }> = ({ copy, frame, scanAt, doneAt }) => {
  const prog = progress(frame, scanAt, doneAt - scanAt, (t) => t);
  const ok = frame >= doneAt;
  const okPop = pop(frame, doneAt, 10, 190);
  const r = 128;
  const scanY = Math.sin(((frame - scanAt) / 26) * Math.PI) * 100;
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#0B0F1A' }}>
      <div style={{ position: 'absolute', top: 70, left: 0, right: 0, textAlign: 'center', ...T.h4, color: '#fff' }}>{copy.ui.myIdTitle}</div>
      <div style={{ position: 'absolute', top: 104, left: 0, right: 0, textAlign: 'center', ...T.body, color: 'rgba(255,255,255,0.6)' }}>{copy.ui.faceHint}</div>
      <div style={{ position: 'absolute', top: 160, left: (393 - 300) / 2, width: 300, height: 300 }}>
        <div style={{ position: 'absolute', left: 22, top: 22, width: 256, height: 256, borderRadius: 128, overflow: 'hidden' }}>
          <Img src={img.avatarDoston} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {!ok && frame >= scanAt && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 128 + scanY - 2,
                height: 4,
                background: 'linear-gradient(90deg, rgba(53,204,255,0) 0%, #35CCFF 50%, rgba(53,204,255,0) 100%)',
                boxShadow: '0 0 18px 6px rgba(53,204,255,0.45)',
              }}
            />
          )}
        </div>
        <svg width={300} height={300} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
          <circle cx={150} cy={150} r={r + 8} stroke="rgba(255,255,255,0.12)" strokeWidth={8} fill="none" />
          <circle
            cx={150}
            cy={150}
            r={r + 8}
            stroke={ok ? colors.success : '#35CCFF'}
            strokeWidth={8}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * (r + 8)}
            strokeDashoffset={2 * Math.PI * (r + 8) * (1 - prog)}
          />
        </svg>
        {ok && (
          <div
            style={{
              position: 'absolute',
              right: 18,
              bottom: 18,
              width: 64,
              height: 64,
              borderRadius: 32,
              background: colors.success,
              border: '5px solid #0B0F1A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `scale(${okPop})`,
            }}
          >
            <Icon name="check" size={34} color="#fff" stroke={3.4} />
          </div>
        )}
      </div>
      <div style={{ position: 'absolute', top: 490, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        {ok ? (
          <div style={{ transform: `scale(${okPop})` }}>
            <VerifiedBadge label={copy.ui.myIdVerified} scale={1.5} />
          </div>
        ) : (
          <div style={{ ...T.bodyLgMedium, color: 'rgba(255,255,255,0.8)' }}>
            {copy.ui.myIdScanning} {Math.round(prog * 100)}%
          </div>
        )}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 20,
          right: 20,
          top: 580,
          padding: 16,
          borderRadius: 18,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(60,131,246,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="id" size={24} color="#60A5FA" />
        </div>
        <div style={{ flex: 1, ...T.bodyLgMedium, color: '#fff' }}>{copy.ui.docLabel}</div>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            background: frame >= scanAt + 6 ? colors.success : 'rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {frame >= scanAt + 6 && <Icon name="check" size={16} color="#fff" stroke={3} />}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 40, display: 'flex', justifyContent: 'center', ...T.captionMedium, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em' }}>
        MyID
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; value: string; active?: boolean; caret?: boolean; children?: React.ReactNode }> = ({
  label,
  value,
  active,
  caret,
  children,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <div style={{ ...T.bodyMedium, color: g[70] }}>{label}</div>
    {children ?? (
      <div
        style={{
          height: 48,
          borderRadius: 12,
          border: `1.5px solid ${active ? colors.primary : colors.strokeDark}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 14px',
          ...T.bodyLg,
          color: g[100],
        }}
      >
        {value}
        {active && <span style={{ width: 2, height: 22, marginLeft: 1, background: colors.primary, opacity: caret ? 1 : 0 }} />}
      </div>
    )}
  </div>
);

/** New listing wizard: photos drop in, title and price type in, pickup pin, publish. */
export const ListingScreen: React.FC<{
  copy: Copy;
  frame: number;
  photosAt: number;
  nameAt: number;
  priceAt: number;
  placeAt: number;
  publishAt: number;
  sentAt: number;
}> = ({ copy, frame, photosAt, nameAt, priceAt, placeAt, publishAt, sentAt }) => {
  const name = copy.products[0].title;
  const priceText = groupDigits(250000);
  const typedName = frame < nameAt ? '' : name.slice(0, Math.min(name.length, Math.floor((frame - nameAt) / 1.6) + 1));
  const typedPrice = frame < priceAt ? '' : priceText.slice(0, Math.min(priceText.length, Math.floor((frame - priceAt) / 2) + 1));
  const caret = Math.floor(frame / 8) % 2 === 0;
  const crops = ['50% 50%', '25% 60%', '75% 35%'];
  const zooms = [1, 1.6, 1.9];
  const pin = pop(frame, placeAt + 4, 10, 200);
  const pressed = Math.sin(Math.min(1, Math.max(0, (frame - publishAt) / 8)) * Math.PI);
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#FFFFFF' }}>
      <div style={{ position: 'absolute', top: 58, left: 0, right: 0 }}>
        <ScreenHeader title={copy.ui.newListing} />
      </div>
      <div style={{ position: 'absolute', top: 110, left: 20, right: 20, display: 'flex', gap: 6 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < 2 ? colors.primary : g[20] }} />
        ))}
      </div>
      <div style={{ position: 'absolute', top: 130, left: 20, right: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ ...T.bodyMedium, color: g[70] }}>{copy.ui.showcasePhotos}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[0, 1, 2].map((i) => {
              const s = pop(frame, photosAt + i * 6, 12, 190);
              return (
                <div key={i} style={{ width: 80, height: 80, borderRadius: 14, background: g[10], border: `1.5px dashed ${g[30]}`, overflow: 'hidden' }}>
                  {frame >= photosAt + i * 6 && (
                    <Img src={img.cameraHero} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: crops[i], transform: `scale(${zooms[i] * s})` }} />
                  )}
                </div>
              );
            })}
            <div style={{ width: 80, height: 80, borderRadius: 14, background: palette.primary[0], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="plus" size={28} color={colors.primary} stroke={2.4} />
            </div>
          </div>
        </div>
        <Field label={copy.ui.nameLabel} value={typedName} active={frame >= nameAt && frame < priceAt} caret={caret} />
        <Field label={copy.ui.priceLabel} value={typedPrice} active={frame >= priceAt && frame < placeAt} caret={caret} />
        <Field label={copy.ui.pickupLabel} value="">
          <div style={{ position: 'relative', height: 120, borderRadius: 14, overflow: 'hidden', border: `1.5px solid ${frame >= placeAt ? colors.primary : colors.strokeDark}` }}>
            <Img src={img.mapTiles} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '45% 55%', transform: 'scale(1.6)' }} />
            {frame >= placeAt && (
              <div style={{ position: 'absolute', left: '50%', top: 18, transform: `translateX(-50%) translateY(${(1 - pin) * -30}px)`, opacity: Math.min(1, pin * 2) }}>
                <svg width={34} height={44} viewBox="0 0 24 31">
                  <path d="M12 30S1.5 18.5 1.5 11.5a10.5 10.5 0 0 1 21 0C22.5 18.5 12 30 12 30z" fill={colors.primary} stroke="#fff" strokeWidth="2" />
                  <circle cx="12" cy="11.5" r="4" fill="#fff" />
                </svg>
              </div>
            )}
            <div
              style={{
                position: 'absolute',
                left: 10,
                bottom: 10,
                padding: '6px 10px',
                borderRadius: 10,
                background: '#fff',
                ...T.captionMedium,
                color: g[90],
                opacity: progress(frame, placeAt + 8, 8),
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Icon name="pin" size={14} color={colors.primary} />
              {copy.ui.pickupPlace}
            </div>
          </div>
        </Field>
      </div>
      <div style={{ position: 'absolute', left: 20, right: 20, bottom: 40 }}>
        <ButtonUI label={copy.ui.publish} pressed={pressed} />
      </div>
      <Tap x={60} y={196} at={photosAt - 2} size={50} />
      <Tap x={196} y={788} at={publishAt} size={56} />
      <SuccessOverlay frame={frame} at={sentAt} title={copy.ui.listingSent} chip={<StatusChip label={copy.ui.onReview} tone="orange" />} />
    </div>
  );
};

/** Owner order details with renter, dates, earnings and accept/decline. */
export const OrderScreen: React.FC<{ copy: Copy; frame: number; confirmAt: number }> = ({ copy, frame, confirmAt }) => {
  const p = copy.products[0];
  const confirmed = frame >= confirmAt + 4;
  const pressed = Math.sin(Math.min(1, Math.max(0, (frame - confirmAt) / 8)) * Math.PI);
  const chipPop = confirmed ? pop(frame, confirmAt + 4, 10, 200) : 1;
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#FFFFFF' }}>
      <div style={{ position: 'absolute', top: 58, left: 0, right: 0 }}>
        <ScreenHeader title={copy.ui.orderTitle} />
      </div>
      <div style={{ position: 'absolute', top: 118, left: 20, right: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 14, overflow: 'hidden' }}>
            <Img src={img.cameraHero} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ ...T.bodyLgSemi, color: g[100] }}>{p.title}</div>
            <div style={{ ...T.body, color: g[50] }}>{perDay(copy, p.price)}</div>
          </div>
          <div style={{ transform: `scale(${chipPop})` }}>
            <StatusChip label={confirmed ? copy.ui.confirmed : copy.ui.pendingOwner} tone={confirmed ? 'green' : 'orange'} />
          </div>
        </div>
        <div style={{ padding: 14, borderRadius: 18, background: g[10], display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ ...T.captionMedium, color: g[50] }}>{copy.ui.renter}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AvatarUI src={img.avatarMalika} size={48} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ ...T.bodyLgSemi, color: g[100] }}>{copy.renterName}</div>
                <Stars value={5} size={13} />
              </div>
              <VerifiedBadge label={copy.ui.verified} />
            </div>
          </div>
        </div>
        <div style={{ padding: 14, borderRadius: 18, border: `1.5px solid ${colors.strokeDark}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...T.bodyMedium, color: g[60] }}>
            <Icon name="calendar" size={18} color={g[60]} />
            {copy.ui.rentalPeriod}
          </div>
          <div style={{ ...T.h4, color: g[100] }}>
            {copy.ui.rentalDates} <span style={{ ...T.bodyLg, color: g[50] }}>· {copy.days(3)}</span>
          </div>
        </div>
        <div style={{ padding: 16, borderRadius: 18, background: palette.primary[0], display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ ...T.bodyLgMedium, color: palette.primary[80] }}>{copy.ui.yourEarnings}</div>
          <div style={{ ...T.h2, fontWeight: 700, color: palette.primary[60] }}>{sum(copy, 675000)}</div>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 20, right: 20, bottom: 40, display: 'flex', gap: 12 }}>
        <ButtonUI label={copy.ui.reject} variant="critical" style={{ flex: 1 }} />
        <ButtonUI label={copy.ui.confirm} pressed={pressed} style={{ flex: 1.3 }} />
      </div>
      <Tap x={262} y={788} at={confirmAt} size={56} />
    </div>
  );
};

/** Owner profile: greeting, balance card counting up, earnings bars, withdraw sheet. */
export const OwnerHome: React.FC<{ copy: Copy; frame: number; countAt: number; withdrawTap: number; sheetAt: number; confirmTap: number; doneAt: number }> = ({
  copy,
  frame,
  countAt,
  withdrawTap,
  sheetAt,
  confirmTap,
  doneAt,
}) => {
  const amount = countUp(frame, countAt, 40, 2450000, 5000);
  const bars = [0.35, 0.5, 0.42, 0.66, 0.78, 1];
  const months = ['май', 'июн', 'июл', 'авг', 'сен', 'окт'];
  const pressed = Math.sin(Math.min(1, Math.max(0, (frame - confirmTap) / 8)) * Math.PI);
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#FFFFFF' }}>
      <div style={{ position: 'absolute', top: 60, left: 20, right: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <AvatarUI src={img.avatarDoston} size={48} />
        <div>
          <div style={{ ...T.body, color: g[50] }}>{copy.ui.welcome}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ ...T.h4, color: g[100] }}>{copy.ownerName}</div>
            <VerifiedBadge label="My ID" />
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', top: 128, left: 20 }}>
        <BalanceCardUI label={copy.ui.balanceLabel} amount={sum(copy, amount)} buttons={[copy.ui.withdraw, copy.ui.topUp]} pressed={frame >= withdrawTap && frame < withdrawTap + 8 ? 0 : -1} />
      </div>
      <div style={{ position: 'absolute', top: 290, left: 20, right: 20, display: 'flex', gap: 12 }}>
        {[
          [copy.ui.totalEarnings, groupDigits(amount), copy.currency],
          [copy.ui.totalBookings, String(Math.round(interpolate(frame, [countAt, countAt + 40], [0, 14], clamp))), copy.ui.allTime],
        ].map(([l, v, sub], i) => (
          <div key={i} style={{ flex: 1, padding: 14, borderRadius: 16, border: `1.5px solid ${colors.strokeDark}` }}>
            <div style={{ ...T.caption, color: g[50] }}>{l}</div>
            <div style={{ ...T.h3, fontWeight: 700, color: i === 0 ? colors.primary : g[100] }}>{v}</div>
            <div style={{ ...T.caption, color: g[40] }}>{sub}</div>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', top: 400, left: 20, right: 20, padding: 16, borderRadius: 18, background: g[10] }}>
        <div style={{ ...T.bodyLgSemi, color: g[100], marginBottom: 12 }}>{copy.ui.earningsOverview}</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 140 }}>
          {bars.map((b, i) => {
            const h = progress(frame, countAt + 6 + i * 4, 18) * b * 120;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ width: '100%', height: h, borderRadius: 8, background: i === bars.length - 1 ? colors.primary : palette.primary[20] }} />
                <div style={{ ...T.caption, color: g[50] }}>{months[i]}</div>
              </div>
            );
          })}
        </div>
      </div>
      <TabBarUI labels={copy.ui.tabs} active={3} />
      <Tap x={108} y={238} at={withdrawTap} size={52} />
      <Sheet frame={frame} at={sheetAt} top={430}>
        <div style={{ ...T.h4, color: g[100], marginBottom: 14 }}>{copy.ui.withdrawTitle}</div>
        <div style={{ ...T.bodyMedium, color: g[60], marginBottom: 6 }}>{copy.ui.withdrawAmount}</div>
        <div style={{ height: 56, borderRadius: 14, border: `1.5px solid ${colors.primary}`, display: 'flex', alignItems: 'center', padding: '0 16px', ...T.h3, fontWeight: 700, color: g[100], marginBottom: 14 }}>
          {sum(copy, 675000)}
        </div>
        <div style={{ ...T.bodyMedium, color: g[60], marginBottom: 6 }}>{copy.ui.toCard}</div>
        <div style={{ height: 56, borderRadius: 14, background: g[10], display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', marginBottom: 18 }}>
          <div style={{ width: 40, height: 28, borderRadius: 6, background: 'linear-gradient(135deg, #1E3A8A, #3C83F6)' }} />
          <div style={{ ...T.bodyLgSemi, color: g[100], flex: 1 }}>•••• 4021</div>
          <Icon name="check" size={20} color={colors.primary} stroke={2.6} />
        </div>
        <ButtonUI label={copy.ui.withdrawConfirm} pressed={pressed} />
      </Sheet>
      <Tap x={196} y={430 + 288} at={confirmTap} size={56} />
      <SuccessOverlay frame={frame} at={doneAt} title={copy.ui.withdrawSuccess} sub={`${sum(copy, 675000)} → •••• 4021`} />
    </div>
  );
};

/** A product thumbnail with a soft float, for scene decoration. */
export const FloatingProduct: React.FC<{ src: string; frame: number; at: number; x: number; y: number; size: number; rotate?: number }> = ({
  src,
  frame,
  at,
  x,
  y,
  size,
  rotate = 0,
}) => {
  const s = pop(frame, at, 12, 160);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y + bob(frame, 8, 90, at * 7),
        width: size,
        height: size,
        borderRadius: size * 0.22,
        overflow: 'hidden',
        border: '6px solid #fff',
        boxShadow: '0 24px 44px -16px rgba(15,23,42,0.4)',
        transform: `scale(${s}) rotate(${rotate}deg)`,
      }}
    >
      <Img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  );
};

