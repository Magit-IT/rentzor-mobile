/** Scene backdrops: light (app surfaces), brand blue and deep navy. */
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { CARD_GRADIENT, GRADIENT, NAVY_GRADIENT, palette } from '../brand';

/** The balance-card wave pattern from src/components/BalancePattern.tsx. */
export const WAVE_PATHS = [
  'M367.348 0C374.725 9.43076 384.349 27.7204 388.726 38.761C386.683 42.7106 380.704 50.0288 377.814 53.4571C367.646 65.0517 355.877 75.1378 342.863 83.4109C285.392 120.44 204.382 128.479 138.389 114.187C91.4045 104.012 41.9607 80.4903 15.1821 38.933C19.081 28.5471 25.5136 17.0685 31.3515 7.64797C32.5309 5.74486 35.1043 1.7822 36.61 0.276553C36.8997 0.618396 36.8055 0.45467 36.9733 0.846418C48.7455 28.3169 77.0283 48.1077 103.83 59.4404C162.001 84.0368 237.329 84.4662 295.977 61.1483C324.735 49.7152 354.877 29.3298 367.348 0Z',
  'M2.74487 148.84C4.27859 149.386 13.4423 156.304 15.6319 157.791C21.2977 161.636 27.1173 165.251 33.076 168.626C67.0611 187.506 104.149 200.154 142.588 205.975C213.345 217.39 291.592 208.213 356.248 176.361C373.695 167.766 385.866 159.663 401.437 148.425C400.445 152.114 399.837 157.095 398.902 161.121C397.127 168.762 395.125 175.434 392.634 182.835C390.791 188.03 388.756 193.153 386.527 198.197C385.031 201.609 384.365 204.274 380.964 206.247C377.63 208.182 374.301 210.147 370.916 211.999C276.452 263.705 148.404 267.084 51.0377 221.102C43.551 217.648 36.2187 213.871 29.0613 209.778C25.52 207.778 20.8294 205.848 19.1342 202.089C11.6402 185.476 5.17257 166.977 2.74487 148.84Z',
  'M397.93 66.4252C398.443 69.1659 399.169 71.8087 399.743 74.5348C400.68 79.0787 401.469 83.6523 402.108 88.2481C402.54 91.523 402.891 94.8081 403.162 98.1004C403.31 99.9024 403.513 103.919 403.978 105.539V115.023C394.526 123.564 386.939 130.115 376.207 137.431C320.859 175.168 249.287 190.173 182.98 186.622C126.691 183.608 67.0225 166.585 21.3392 132.89C14.555 127.886 6.07317 120.982 0 115.034V104.2C0.705023 102.126 1.13238 93.7068 1.52457 90.7499C2.54443 82.6153 4.05122 74.5492 6.03683 66.5949L6.22091 66.7738C9.17774 69.6849 12.2406 73.4856 15.2614 76.5858C21.2296 82.6153 27.5887 88.245 34.2975 93.4377C80.6511 129.235 144.806 144.625 202.662 144.457C268.247 144.268 340.509 124.828 387.943 77.2756C391.348 73.8625 394.697 70.0249 397.93 66.4252Z',
];

export const WavePattern: React.FC<{ width: number; opacity?: number; style?: React.CSSProperties }> = ({
  width,
  opacity = 0.07,
  style,
}) => (
  <svg viewBox="0 0 403.978 253.333" width={width} height={(width * 253.333) / 403.978} style={style}>
    <g opacity={opacity} fill="#FFFFFF">
      {WAVE_PATHS.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </g>
  </svg>
);

/** Soft light backdrop with slowly drifting blue glows. */
export const LightBg: React.FC<{ tint?: string }> = ({ tint = palette.primary[0] }) => {
  const f = useCurrentFrame();
  const a = Math.sin(f / 70) * 60;
  const b = Math.cos(f / 85) * 70;
  return (
    <AbsoluteFill style={{ background: '#FFFFFF' }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 900px at ${180 + a}px ${260 + b}px, ${tint} 0%, rgba(239,246,255,0) 70%),
            radial-gradient(1000px 1000px at ${920 - b}px ${1500 + a}px, ${palette.primary[10]}99 0%, rgba(219,234,254,0) 70%)`,
        }}
      />
      <Dots color="rgba(60,131,246,0.10)" />
    </AbsoluteFill>
  );
};

/** Brand blue gradient with the balance-card waves. */
export const BlueBg: React.FC<{ drift?: boolean }> = ({ drift = true }) => {
  const f = useCurrentFrame();
  const r = drift ? f * 0.04 : 0;
  return (
    <AbsoluteFill style={{ background: GRADIENT, overflow: 'hidden' }}>
      <AbsoluteFill style={{ background: 'radial-gradient(1100px 800px at 70% 18%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 70%)' }} />
      <WavePattern
        width={2300}
        opacity={0.09}
        style={{ position: 'absolute', left: -620, top: 380, transform: `rotate(${-38 + r}deg)` }}
      />
    </AbsoluteFill>
  );
};

/** Deep navy for the owner chapter (balance-card blues, darker). */
export const NavyBg: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: NAVY_GRADIENT, overflow: 'hidden' }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 900px at ${780 + Math.sin(f / 60) * 60}px 260px, rgba(53,204,255,0.28) 0%, rgba(53,204,255,0) 70%)`,
        }}
      />
      <Dots color="rgba(255,255,255,0.07)" />
      <WavePattern width={2200} opacity={0.06} style={{ position: 'absolute', left: -560, top: 980, transform: 'rotate(-30deg)' }} />
    </AbsoluteFill>
  );
};

export const CardGradientBg: React.FC = () => <AbsoluteFill style={{ background: CARD_GRADIENT }} />;

/** Subtle dotted grid. */
export const Dots: React.FC<{ color: string; gap?: number }> = ({ color, gap = 44 }) => (
  <AbsoluteFill
    style={{
      backgroundImage: `radial-gradient(${color} 2.2px, transparent 2.6px)`,
      backgroundSize: `${gap}px ${gap}px`,
      maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.9) 100%)',
    }}
  />
);
