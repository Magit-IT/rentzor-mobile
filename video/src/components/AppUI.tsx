/**
 * Recreations of Rentzor app components, in app points (render inside
 * <Phone>, or wrap in a scaled div). Dimensions follow the RN sources:
 * ProductCard.tsx (169pt card, r24 image, 12/14pt text), Button.tsx (48pt
 * large, r12), theme.ts typography and colours.
 */
import React from 'react';
import { Img } from 'remotion';
import { colors, FONT, palette } from '../brand';
import { Icon } from './Icon';
import { AppIconTile } from './Logo';

const g = palette.gray;

export const T = {
  h1: { fontFamily: FONT, fontWeight: 600, fontSize: 28, lineHeight: '40px' },
  h2: { fontFamily: FONT, fontWeight: 600, fontSize: 24, lineHeight: '32px' },
  h3: { fontFamily: FONT, fontWeight: 600, fontSize: 20, lineHeight: '28px' },
  h4: { fontFamily: FONT, fontWeight: 600, fontSize: 18, lineHeight: '28px' },
  bodyLg: { fontFamily: FONT, fontWeight: 400, fontSize: 16, lineHeight: '24px' },
  bodyLgMedium: { fontFamily: FONT, fontWeight: 500, fontSize: 16, lineHeight: '24px' },
  bodyLgSemi: { fontFamily: FONT, fontWeight: 600, fontSize: 16, lineHeight: '24px' },
  body: { fontFamily: FONT, fontWeight: 400, fontSize: 14, lineHeight: '20px' },
  bodyMedium: { fontFamily: FONT, fontWeight: 500, fontSize: 14, lineHeight: '20px' },
  bodySemi: { fontFamily: FONT, fontWeight: 600, fontSize: 14, lineHeight: '20px' },
  caption: { fontFamily: FONT, fontWeight: 400, fontSize: 12, lineHeight: '16px' },
  captionMedium: { fontFamily: FONT, fontWeight: 500, fontSize: 12, lineHeight: '16px' },
} as const;

export const ProductCardUI: React.FC<{
  image: string;
  title: string;
  location: string;
  price: string;
  rating?: number;
  width?: number;
  saved?: boolean;
  imageFit?: 'cover' | 'contain';
  style?: React.CSSProperties;
}> = ({ image, title, location, price, rating, width = 169, saved, imageFit = 'cover', style }) => (
  <div style={{ width, display: 'flex', flexDirection: 'column', gap: 8, ...style }}>
    <div style={{ position: 'relative', width, height: width, borderRadius: 24, overflow: 'hidden', background: g[10] }}>
      <Img src={image} style={{ width: '100%', height: '100%', objectFit: imageFit }} />
      {rating != null && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            padding: '4px 6px',
            borderRadius: 16,
            background: '#FFFFFF',
            ...T.caption,
            color: g[90],
          }}
        >
          <Icon name="star" size={12} color={g[90]} fill={g[90]} stroke={1} />
          {rating.toFixed(1)}
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: 28,
          height: 28,
          borderRadius: 16,
          background: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="bookmark" size={16} color={saved ? colors.primary : g[90]} fill={saved ? colors.primary : 'none'} />
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ ...T.caption, color: g[40], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{location}</div>
      <div style={{ ...T.bodySemi, color: g[100], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
      <div style={{ ...T.bodySemi, color: g[50], whiteSpace: 'nowrap' }}>{price}</div>
    </div>
  </div>
);

export const HomeHeader: React.FC<{ city: string }> = ({ city }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 40, height: 40, borderRadius: 20, background: palette.primary[0], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="pin" size={20} color={colors.primary} />
      </div>
      <div style={{ ...T.bodyLgSemi, color: g[100] }}>{city}</div>
      <Icon name="chevronDown" size={18} color={g[60]} />
    </div>
    <div style={{ position: 'relative', width: 40, height: 40, borderRadius: 20, background: g[10], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon name="bell" size={20} color={g[90]} />
      <div style={{ position: 'absolute', top: 9, right: 10, width: 8, height: 8, borderRadius: 4, background: colors.critical, border: '1.5px solid #fff' }} />
    </div>
  </div>
);

export const SearchBarUI: React.FC<{
  placeholder: string;
  text?: string;
  focused?: boolean;
  caretOn?: boolean;
  style?: React.CSSProperties;
}> = ({ placeholder, text, focused, caretOn, style }) => (
  <div
    style={{
      height: 48,
      borderRadius: 12,
      background: focused ? '#FFFFFF' : g[10],
      border: `1.5px solid ${focused ? colors.primary : 'transparent'}`,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '0 14px',
      ...style,
    }}
  >
    <Icon name="search" size={20} color={g[50]} />
    <div style={{ ...T.bodyLg, color: text ? g[100] : g[40], flex: 1, display: 'flex', alignItems: 'center' }}>
      {text || (!focused ? placeholder : '')}
      {focused && <span style={{ width: 2, height: 22, marginLeft: 1, background: colors.primary, opacity: caretOn ? 1 : 0 }} />}
      {focused && !text && <span style={{ color: g[40] }}>{placeholder}</span>}
    </div>
    <div style={{ width: 1, height: 24, background: g[20] }} />
    <Icon name="filter" size={20} color={g[90]} />
  </div>
);

export const CategoryCircle: React.FC<{ icon: string; label: string; active?: boolean }> = ({ icon, label, active }) => (
  <div style={{ width: 72, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
    <div
      style={{
        width: 64,
        height: 64,
        borderRadius: 32,
        background: active ? palette.primary[0] : g[10],
        border: active ? `1.5px solid ${colors.primary}` : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <Img src={icon} style={{ width: 46, height: 46, objectFit: 'contain' }} />
    </div>
    <div style={{ ...T.captionMedium, color: g[90], whiteSpace: 'nowrap' }}>{label}</div>
  </div>
);

export const SectionTitle: React.FC<{ title: string; action?: string }> = ({ title, action }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
    <div style={{ ...T.h4, color: g[100] }}>{title}</div>
    {action && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, ...T.bodyMedium, color: colors.primary }}>
        {action}
        <Icon name="chevronRight" size={16} color={colors.primary} />
      </div>
    )}
  </div>
);

export const TabBarUI: React.FC<{ labels: string[]; active: number }> = ({ labels, active }) => {
  const icons = ['home', 'bookmark', 'calendar', 'user'] as const;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 88,
        background: '#FFFFFF',
        borderTop: `1px solid ${colors.strokeLight}`,
        display: 'flex',
        justifyContent: 'space-around',
        paddingTop: 10,
      }}
    >
      {labels.map((l, i) => (
        <div key={l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 80 }}>
          <Icon
            name={icons[i]}
            size={24}
            color={i === active ? colors.primary : g[40]}
            fill={i === active && i === 0 ? palette.primary[0] : 'none'}
          />
          <div style={{ ...T.captionMedium, color: i === active ? colors.primary : g[40] }}>{l}</div>
        </div>
      ))}
    </div>
  );
};

export const ButtonUI: React.FC<{
  label: string;
  variant?: 'primary' | 'black' | 'secondary' | 'critical';
  pressed?: number;
  height?: number;
  style?: React.CSSProperties;
  icon?: React.ReactNode;
}> = ({ label, variant = 'primary', pressed = 0, height = 48, style, icon }) => {
  const bg = {
    primary: colors.primary,
    black: g[100],
    secondary: g[10],
    critical: colors.criticalSurface,
  }[variant];
  const fg = { primary: '#FFFFFF', black: '#FFFFFF', secondary: g[100], critical: colors.critical }[variant];
  return (
    <div
      style={{
        height,
        borderRadius: 12,
        background: variant === 'primary' && pressed > 0 ? palette.primary[70] : bg,
        color: fg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        ...T.bodyLgSemi,
        transform: `scale(${1 - pressed * 0.04})`,
        ...style,
      }}
    >
      {icon}
      {label}
    </div>
  );
};

export const AvatarUI: React.FC<{ src: string; size: number; ring?: string }> = ({ src, size, ring }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      overflow: 'hidden',
      flexShrink: 0,
      boxShadow: ring ? `0 0 0 ${Math.max(2, size * 0.05)}px ${ring}` : undefined,
    }}
  >
    <Img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
  </div>
);

export const VerifiedBadge: React.FC<{ label: string; scale?: number }> = ({ label, scale = 1 }) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4 * scale,
      padding: `${3 * scale}px ${8 * scale}px ${3 * scale}px ${5 * scale}px`,
      borderRadius: 999,
      background: palette.green[0],
      color: palette.green[70],
      fontFamily: FONT,
      fontWeight: 600,
      fontSize: 12 * scale,
      lineHeight: `${16 * scale}px`,
    }}
  >
    <div style={{ width: 14 * scale, height: 14 * scale, borderRadius: 999, background: colors.success, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon name="check" size={10 * scale} color="#fff" stroke={3} />
    </div>
    {label}
  </div>
);

export const StatusChip: React.FC<{ label: string; tone: 'blue' | 'green' | 'orange' | 'violet' | 'gray' }> = ({ label, tone }) => {
  const map = {
    blue: [palette.primary[0], palette.primary[60]],
    green: [palette.green[0], palette.green[70]],
    orange: [palette.orange[0], palette.orange[60]],
    violet: [palette.violet[0], palette.violet[70]],
    gray: [g[10], g[60]],
  }[tone];
  return (
    <div style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: 999, background: map[0], color: map[1], ...T.captionMedium, fontWeight: 600 }}>
      {label}
    </div>
  );
};

/** Gradient balance card (profile tab): primary-70 → primary-40, white 40% rim, wave pattern. */
export const BalanceCardUI: React.FC<{
  label: string;
  amount: string;
  buttons?: [string, string];
  pressed?: number;
  width?: number;
}> = ({ label, amount, buttons, pressed = -1, width = 353 }) => (
  <div
    style={{
      position: 'relative',
      width,
      borderRadius: 24,
      border: '2px solid rgba(255,255,255,0.4)',
      background: `linear-gradient(21.3deg, ${palette.primary[70]} 0%, ${palette.primary[40]} 100%)`,
      overflow: 'hidden',
      padding: '16px 16px 14px',
      boxShadow: '0 10px 24px -8px rgba(29,78,216,0.45)',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}
  >
    <svg viewBox="0 0 403.978 253.333" width={480} height={300} style={{ position: 'absolute', top: -70, left: -50, transform: 'rotate(-45deg)' }}>
      <g opacity={0.08} fill="#fff">
        <ellipse cx="200" cy="40" rx="190" ry="60" />
        <ellipse cx="200" cy="190" rx="200" ry="55" />
      </g>
    </svg>
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ ...T.bodyMedium, color: 'rgba(255,255,255,0.85)' }}>{label}</div>
      <div style={{ ...T.h1, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.01em' }}>{amount}</div>
    </div>
    {buttons && (
      <div style={{ position: 'relative', display: 'flex', gap: 10 }}>
        {buttons.map((b, i) => (
          <div
            key={b}
            style={{
              flex: 1,
              height: 40,
              borderRadius: 12,
              background: '#FFFFFF',
              color: colors.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              ...T.bodySemi,
              transform: `scale(${pressed === i ? 0.95 : 1})`,
            }}
          >
            {b}
          </div>
        ))}
      </div>
    )}
  </div>
);

/** iOS-style push banner. Rendered at `scale` (1 = app points). */
export const NotificationUI: React.FC<{
  title: string;
  body: string;
  time: string;
  scale?: number;
  width?: number;
  style?: React.CSSProperties;
}> = ({ title, body, time, scale = 1, width = 361, style }) => (
  <div
    style={{
      width: width * scale,
      borderRadius: 24 * scale,
      background: 'rgba(255,255,255,0.94)',
      boxShadow: `0 ${18 * scale}px ${40 * scale}px -${10 * scale}px rgba(15,23,42,0.35), 0 0 0 ${1 * scale}px rgba(15,23,42,0.05)`,
      padding: `${12 * scale}px ${14 * scale}px`,
      display: 'flex',
      gap: 10 * scale,
      alignItems: 'center',
      ...style,
    }}
  >
    <AppIconTile size={38 * scale} radius={9 * scale} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 15 * scale, lineHeight: `${20 * scale}px`, color: g[100] }}>{title}</div>
        <div style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12 * scale, color: g[50] }}>{time}</div>
      </div>
      <div style={{ fontFamily: FONT, fontWeight: 400, fontSize: 14 * scale, lineHeight: `${19 * scale}px`, color: g[80] }}>{body}</div>
    </div>
  </div>
);

export const CheckboxUI: React.FC<{ checked: number; size?: number }> = ({ checked, size = 22 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: 6,
      flexShrink: 0,
      background: checked > 0.5 ? colors.primary : '#FFFFFF',
      border: `1.5px solid ${checked > 0.5 ? colors.primary : g[30]}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transform: `scale(${1 + Math.sin(Math.min(checked, 1) * Math.PI) * 0.15})`,
    }}
  >
    {checked > 0.5 && <Icon name="check" size={size * 0.7} color="#fff" stroke={3} />}
  </div>
);

export const RowUI: React.FC<{ label: string; value: string; strong?: boolean }> = ({ label, value, strong }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
    <div style={{ ...T.body, color: g[50] }}>{label}</div>
    <div style={{ ...(strong ? T.bodyLgSemi : T.bodySemi), color: g[100], textAlign: 'right' }}>{value}</div>
  </div>
);

export const ScreenHeader: React.FC<{ title: string }> = ({ title }) => (
  <div style={{ position: 'relative', height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 20px' }}>
    <div style={{ position: 'absolute', left: 0, width: 40, height: 40, borderRadius: 20, background: g[10], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon name="chevronLeft" size={20} color={g[90]} />
    </div>
    <div style={{ ...T.h4, color: g[100] }}>{title}</div>
  </div>
);

export const Stars: React.FC<{ value: number; size?: number; color?: string }> = ({ value, size = 16, color = palette.yellow[60] }) => (
  <div style={{ display: 'flex', gap: size * 0.15 }}>
    {[0, 1, 2, 3, 4].map((i) => {
      const fillAmt = Math.max(0, Math.min(1, value - i));
      return (
        <div key={i} style={{ position: 'relative', width: size, height: size }}>
          <Icon name="star" size={size} color={palette.gray[20]} fill={palette.gray[20]} stroke={1} style={{ position: 'absolute' }} />
          <div style={{ position: 'absolute', inset: 0, width: size * fillAmt, overflow: 'hidden' }}>
            <Icon name="star" size={size} color={color} fill={color} stroke={1} />
          </div>
        </div>
      );
    })}
  </div>
);
