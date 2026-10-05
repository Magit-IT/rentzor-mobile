/**
 * Rentzor lockup, drawn from the app's own vector paths (src/assets/logoPaths.ts).
 *
 * <LogoReveal> is a frame-accurate port of the splash animation in
 * src/components/AnimatedLogo.tsx — same beat sheet, same geometry, same
 * easing: the R fades up oversized, settles while the group drifts left, then
 * "RentZor" wipes in from behind the mark.
 */
import React, { useId } from 'react';
import { Easing, interpolate } from 'remotion';
import { LOGO_MARK_PATHS, LOGO_VIEW_BOX, LOGO_WORD_PATHS } from '../../../src/assets/logoPaths';
import { FPS } from '../brand';

const Paths: React.FC<{ paths: typeof LOGO_MARK_PATHS }> = ({ paths }) => (
  <>
    {paths.map((p, i) => (
      <path key={i} d={p.d} transform={`translate(${p.tx} ${p.ty})`} />
    ))}
  </>
);

/** Static lockup (mark + wordmark). */
export const Logo: React.FC<{ color: string; width: number; markOnly?: boolean; style?: React.CSSProperties }> = ({
  color,
  width,
  markOnly,
  style,
}) => {
  if (markOnly) {
    // mark ink extents: x 149..329, y 373..623
    return (
      <svg viewBox="140 365 200 266" width={width} height={(width * 266) / 200} style={style}>
        <g fill={color}>
          <Paths paths={LOGO_MARK_PATHS} />
        </g>
      </svg>
    );
  }
  const [, , w, h] = LOGO_VIEW_BOX.split(' ').map(Number);
  return (
    <svg viewBox={LOGO_VIEW_BOX} width={width} height={(width * h) / w} style={style}>
      <g fill={color}>
        <Paths paths={LOGO_MARK_PATHS} />
        <Paths paths={LOGO_WORD_PATHS} />
      </g>
    </svg>
  );
};

// ---- reveal (constants mirror AnimatedLogo.tsx) ----
const VIEW = { x: 126, y: 250, w: 801, h: 500 };
const MARK_CENTER_X = 239;
const MARK_CENTER_Y = 498;
const WORD_START_X = 350;
const WORD_END_X = 906;
const GROUP_SHIFT_FROM = 287.5;
const GROUP_SHIFT_TO = -1;
const MARK_INTRO_SCALE = 1.9;
const T = { fadeIn: 620, shrink: 1180, wipeDelay: 120, wipe: 900, hold: 420 };
const INTRO_START = T.fadeIn * 0.55;
const WIPE_START = INTRO_START + T.shrink + T.wipeDelay;
const ms = (m: number) => (m / 1000) * FPS;

/** Length of the reveal in frames at speed 1 (≈ 89 frames). */
export const LOGO_REVEAL_FRAMES = Math.round(ms(WIPE_START + T.wipe + T.hold));

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export const LogoReveal: React.FC<{
  frame: number;
  color: string;
  width: number;
  /** >1 plays faster. */
  speed?: number;
  style?: React.CSSProperties;
}> = ({ frame, color, width, speed = 1, style }) => {
  const f = frame * speed;
  const markOpacity = interpolate(f, [0, ms(T.fadeIn)], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const intro = interpolate(f, [ms(INTRO_START), ms(INTRO_START + T.shrink)], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.22, 0.61, 0.36, 1),
  });
  const wipe = interpolate(f, [ms(WIPE_START), ms(WIPE_START + T.wipe)], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const scale = interpolate(intro, [0, 1], [MARK_INTRO_SCALE, 1]);
  const tx = MARK_CENTER_X - MARK_CENTER_X * scale;
  const ty = MARK_CENTER_Y - MARK_CENTER_Y * scale;
  const shift = interpolate(intro, [0, 1], [GROUP_SHIFT_FROM, GROUP_SHIFT_TO]);
  const dx = interpolate(wipe, [0, 1], [-(WORD_END_X - WORD_START_X), 0]);
  const height = (width * VIEW.h) / VIEW.w;
  const clipId = `rz-reveal-${useId().replace(/:/g, '')}`;

  return (
    <svg viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`} width={width} height={height} style={style}>
      <defs>
        <clipPath id={clipId}>
          <rect x={WORD_START_X} y={VIEW.y} width={WORD_END_X - WORD_START_X} height={VIEW.h} />
        </clipPath>
      </defs>
      <g transform={`translate(${shift} 0)`}>
        <g transform={`translate(${tx} ${ty}) scale(${scale})`} fill={color} opacity={markOpacity}>
          <Paths paths={LOGO_MARK_PATHS} />
        </g>
        <g clipPath={`url(#${clipId})`}>
          <g transform={`translate(${dx} 0)`} fill={color}>
            <Paths paths={LOGO_WORD_PATHS} />
          </g>
        </g>
      </g>
    </svg>
  );
};

/** App-icon tile (white rounded square with the R), for notification banners. */
export const AppIconTile: React.FC<{ size: number; radius?: number }> = ({ size, radius }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: radius ?? size * 0.24,
      background: '#FFFFFF',
      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}
  >
    <Logo markOnly color="#18181B" width={size * 0.42} />
  </div>
);
