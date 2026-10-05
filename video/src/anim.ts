/** Small, frame-based animation helpers shared by every scene. */
import { Easing, interpolate, spring } from 'remotion';
import { FPS } from './brand';

/** The logo reveal's settle curve (AnimatedLogo.tsx) — slow, no overshoot. */
export const easeOut = Easing.bezier(0.22, 0.61, 0.36, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const easeIn = Easing.bezier(0.55, 0, 0.75, 0.2);

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** 0 → 1 between frames [from, from + duration] with an easing curve. */
export const progress = (
  frame: number,
  from: number,
  duration: number,
  easing: (t: number) => number = easeOut,
) => interpolate(frame, [from, from + duration], [0, 1], { ...clamp, easing });

/** Map a 0..1 value to a range. */
export const mix = (t: number, a: number, b: number) => a + (b - a) * t;

/** Springy 0 → 1 (slight overshoot) starting at `delay`. */
export const pop = (frame: number, delay = 0, damping = 13, stiffness = 170) =>
  spring({ frame: frame - delay, fps: FPS, config: { damping, stiffness, mass: 0.8 } });

/** Calm spring without overshoot. */
export const settle = (frame: number, delay = 0) =>
  spring({ frame: frame - delay, fps: FPS, config: { damping: 200, stiffness: 120 } });

/** 1 → 0 fade over the last `duration` frames before `end`. */
export const fadeOut = (frame: number, end: number, duration = 8) =>
  interpolate(frame, [end - duration, end], [1, 0], clamp);

/** Gentle idle float, in px. */
export const bob = (frame: number, amp = 10, period = 90, phase = 0) =>
  Math.sin(((frame + phase) / period) * Math.PI * 2) * amp;

/** Interpolate a number and format it with space-grouped digits ("1 250 000"). */
export const countUp = (frame: number, from: number, duration: number, target: number, step = 5000) => {
  const t = progress(frame, from, duration, Easing.bezier(0.16, 1, 0.3, 1));
  return Math.round((target * t) / step) * step;
};

export const groupDigits = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
