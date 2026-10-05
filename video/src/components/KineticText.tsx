/**
 * Headline that reveals word by word from behind a mask. Lines come from the
 * copy files; *asterisks* mark the highlighted phrase (kept as one unit so a
 * multi-word highlight reads as a single marker stroke).
 */
import React from 'react';
import { interpolate } from 'remotion';
import { easeIn, easeOut, progress } from '../anim';
import { FONT, ink, yellow } from '../brand';

type Seg = { text: string; hl: boolean };
type Unit = Seg[];

export const parseLine = (line: string): Unit[] => {
  const units: Unit[] = [];
  let cur: Seg[] = [];
  let buf = '';
  let hl = false;
  const pushBuf = () => {
    if (buf) cur.push({ text: buf, hl });
    buf = '';
  };
  for (const ch of line) {
    if (ch === '*') {
      pushBuf();
      hl = !hl;
      continue;
    }
    if (ch === ' ' && !hl) {
      pushBuf();
      if (cur.length) units.push(cur);
      cur = [];
      continue;
    }
    buf += ch;
  }
  pushBuf();
  if (cur.length) units.push(cur);
  return units;
};

/** Plain text of a line without highlight markers. */
export const plain = (line: string) => line.replace(/\*/g, '');

export type HighlightMode = 'color' | 'marker' | 'pill';

export const KineticText: React.FC<{
  lines: string[];
  frame: number;
  start?: number;
  size: number;
  color?: string;
  hl?: string;
  hlText?: string;
  mode?: HighlightMode;
  align?: 'left' | 'center';
  stagger?: number;
  exitAt?: number;
  weight?: number;
  lineHeight?: number;
  letterSpacing?: string;
  style?: React.CSSProperties;
}> = ({
  lines,
  frame,
  start = 0,
  size,
  color = ink,
  hl = yellow,
  hlText,
  mode = 'color',
  align = 'center',
  stagger = 3,
  exitAt,
  weight = 800,
  lineHeight = 1.08,
  letterSpacing = '-0.03em',
  style,
}) => {
  let index = 0;
  return (
    <div
      style={{
        fontFamily: FONT,
        fontWeight: weight,
        fontSize: size,
        lineHeight,
        letterSpacing,
        color,
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'center' ? 'center' : 'flex-start',
        ...style,
      }}
    >
      {lines.map((line, li) => (
        <div key={li} style={{ display: 'flex', gap: '0.24em', justifyContent: align === 'center' ? 'center' : 'flex-start' }}>
          {parseLine(line).map((unit, ui) => {
            const i = index++;
            const p = progress(frame, start + i * stagger, 14, easeOut);
            const out = exitAt === undefined ? 0 : progress(frame, exitAt + i * 1.2, 10, easeIn);
            const y = (1 - p) * 108 - out * 108;
            const hasHl = unit.some((s) => s.hl);
            const marker = hasHl && mode !== 'color' ? progress(frame, start + i * stagger + 7, 10, easeOut) : 0;
            return (
              <span
                key={ui}
                style={{
                  display: 'inline-block',
                  overflow: 'hidden',
                  padding: '0.06em 0.08em 0.14em',
                  margin: '-0.06em -0.08em -0.14em',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    whiteSpace: 'pre',
                    transform: `translateY(${y}%)`,
                    opacity: interpolate(p, [0, 0.3], [0, 1]) * (1 - out),
                    position: 'relative',
                  }}
                >
                  {unit.map((seg, si) => {
                    if (!seg.hl) return <span key={si}>{seg.text}</span>;
                    if (mode === 'color') return <span key={si} style={{ color: hl }}>{seg.text}</span>;
                    return (
                      <span key={si} style={{ position: 'relative', display: 'inline-block', color: hlText ?? color, zIndex: 0 }}>
                        <span
                          style={{
                            position: 'absolute',
                            left: mode === 'pill' ? '-0.18em' : '-0.06em',
                            right: mode === 'pill' ? '-0.18em' : '-0.06em',
                            top: mode === 'pill' ? '0.04em' : '0.52em',
                            bottom: mode === 'pill' ? '-0.04em' : '0.02em',
                            background: hl,
                            borderRadius: mode === 'pill' ? '0.24em' : '0.08em',
                            transform: `scaleX(${marker})`,
                            transformOrigin: 'left center',
                            zIndex: -1,
                          }}
                        />
                        {seg.text}
                      </span>
                    );
                  })}
                </span>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

/** Small rounded label above headlines ("Шаг 1", "Арендатору"). */
export const Kicker: React.FC<{
  text: string;
  frame: number;
  start?: number;
  bg: string;
  color: string;
  size?: number;
  icon?: React.ReactNode;
}> = ({ text, frame, start = 0, bg, color, size = 34, icon }) => {
  const p = progress(frame, start, 12);
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        padding: `${size * 0.32}px ${size * 0.72}px`,
        borderRadius: 999,
        background: bg,
        color,
        fontFamily: FONT,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: '-0.01em',
        transform: `translateY(${(1 - p) * 30}px) scale(${0.9 + 0.1 * p})`,
        opacity: p,
      }}
    >
      {icon}
      {text}
    </div>
  );
};
