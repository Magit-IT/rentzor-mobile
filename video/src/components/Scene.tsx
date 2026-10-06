/**
 * Scene wrapper: handles the entrance/exit transition of a <Sequence> so
 * every cut lands on a bar line of the music.
 */
import React from 'react';
import { AbsoluteFill, Html5Audio, interpolate, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { easeIn, easeInOut, easeOut, progress } from '../anim';
import { HEIGHT, WIDTH } from '../brand';

export type Enter = 'none' | 'circle' | 'slideUp' | 'flipIn' | 'zoomIn' | 'fade' | 'wipeLeft' | 'pushLeft';
export type Exit = 'none' | 'flipOut' | 'zoomOut' | 'slideUp' | 'fade' | 'pushLeft';

export const Scene: React.FC<{
  duration: number;
  enter?: Enter;
  exit?: Exit;
  enterFrames?: number;
  exitFrames?: number;
  origin?: [number, number];
  children: React.ReactNode;
}> = ({ duration, enter = 'none', exit = 'none', enterFrames = 10, exitFrames = 8, origin = [WIDTH / 2, HEIGHT / 2], children }) => {
  const f = useCurrentFrame();
  // push transitions share one curve so the outgoing and incoming pages move as one strip
  const pin = progress(f, 0, enterFrames, enter === 'circle' || enter === 'pushLeft' ? easeInOut : easeOut);
  const pout = exit === 'none' ? 0 : progress(f, duration - exitFrames, exitFrames, exit === 'pushLeft' ? easeInOut : easeIn);

  let clipPath: string | undefined;
  let transform = '';
  let opacity = 1;

  switch (enter) {
    case 'circle': {
      // farthest corner from the origin, so the circle just covers the frame
      const reach = Math.max(
        ...[[0, 0], [WIDTH, 0], [0, HEIGHT], [WIDTH, HEIGHT]].map(([x, y]) => Math.hypot(x - origin[0], y - origin[1])),
      );
      const r = interpolate(pin, [0, 1], [0, reach + 4]);
      clipPath = pin < 1 ? `circle(${r}px at ${origin[0]}px ${origin[1]}px)` : undefined;
      break;
    }
    case 'slideUp':
      clipPath = pin < 1 ? `inset(${(1 - pin) * 100}% 0 0 0 round ${(1 - pin) * 120}px ${(1 - pin) * 120}px 0 0)` : undefined;
      transform += ` translateY(${(1 - pin) * 220}px)`;
      break;
    case 'wipeLeft':
      clipPath = pin < 1 ? `inset(0 0 0 ${(1 - pin) * 100}%)` : undefined;
      break;
    case 'flipIn':
      transform += ` perspective(2400px) rotateY(${(1 - pin) * -90}deg)`;
      break;
    case 'zoomIn':
      transform += ` scale(${1.25 - 0.25 * pin})`;
      opacity *= pin;
      break;
    case 'fade':
      opacity *= pin;
      break;
    case 'pushLeft':
      transform += ` translateX(${(1 - pin) * WIDTH}px)`;
      break;
  }

  switch (exit) {
    case 'flipOut':
      transform += ` perspective(2400px) rotateY(${pout * 90}deg)`;
      break;
    case 'zoomOut':
      transform += ` scale(${1 + pout * 0.35})`;
      opacity *= 1 - pout;
      break;
    case 'slideUp':
      transform += ` translateY(${-pout * 300}px)`;
      opacity *= 1 - pout;
      break;
    case 'fade':
      opacity *= 1 - pout;
      break;
    case 'pushLeft':
      transform += ` translateX(${-pout * WIDTH}px)`;
      break;
  }

  return (
    <AbsoluteFill style={{ clipPath, transform: transform || undefined, opacity, overflow: 'hidden' }}>{children}</AbsoluteFill>
  );
};

export type SfxName =
  | 'whoosh' | 'swipe' | 'pop' | 'tap' | 'type' | 'success' | 'notify' | 'coins' | 'shutter' | 'impact' | 'riser' | 'flip' | 'logo';

/** One-shot sound effect at an absolute frame of the parent sequence. */
export const Sfx: React.FC<{ name: SfxName; at: number; volume?: number }> = ({ name, at, volume = 0.6 }) => (
  <Sequence from={Math.round(at)} durationInFrames={60} layout="none">
    <Html5Audio src={staticFile(`audio/${name}.wav`)} volume={volume} />
  </Sequence>
);

/** Finger-tap indicator: a dot that presses, then a ring ripples out. */
export const Tap: React.FC<{ x: number; y: number; at: number; size?: number }> = ({ x, y, at, size = 86 }) => {
  const f = useCurrentFrame();
  const t = f - at;
  if (t < -8 || t > 22) return null;
  const appear = progress(f, at - 8, 8);
  const press = t >= 0 ? Math.sin(Math.min(t / 6, 1) * Math.PI) : 0;
  const ring = progress(f, at, 16);
  const fade = 1 - progress(f, at + 10, 12);
  return (
    <div style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, pointerEvents: 'none', zIndex: 100 }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '4px solid rgba(255,255,255,0.9)',
          transform: `scale(${0.6 + ring * 1.1})`,
          opacity: (1 - ring) * (t >= 0 ? 1 : 0),
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: size * 0.18,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.75)',
          boxShadow: '0 0 0 3px rgba(60,131,246,0.55), 0 10px 24px rgba(15,23,42,0.35)',
          transform: `scale(${(0.6 + appear * 0.4) * (1 - press * 0.18)})`,
          opacity: appear * fade,
        }}
      />
    </div>
  );
};

/** Background music for a whole composition, with a short fade-in. */
export const Music: React.FC<{ file: string; volume?: number }> = ({ file, volume = 0.75 }) => (
  <Html5Audio
    src={staticFile(`audio/${file}`)}
    volume={(f) => volume * interpolate(f, [0, 6], [0.4, 1], { extrapolateRight: 'clamp' })}
  />
);
