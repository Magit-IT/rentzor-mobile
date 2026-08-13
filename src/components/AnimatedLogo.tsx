/**
 * Rentzor logo reveal — the splash-screen animation.
 *
 * Beat sheet (mirrors rentzor_logo_reveal.mp4):
 *   1. the R mark fades up from nothing, oversized and optically centered;
 *   2. it shrinks toward its lockup size while the whole group drifts left,
 *      clearing the space the wordmark is about to occupy;
 *   3. "RentZor" wipes in left-to-right, as if emerging from behind the mark;
 *   4. the finished lockup holds.
 *
 * The mark and wordmark are separate <G> layers (see logoPaths.ts) so each
 * gets its own transform. Everything animates through Reanimated shared
 * values on the native thread -- no per-frame React renders, so the reveal
 * stays smooth even while the splash screen is resolving the auth session.
 *
 * The wipe is deliberately NOT a <Rect> animated inside <ClipPath>. Nodes in
 * the <Defs> tree are consumed when the referencing element builds its clip,
 * and a native-thread prop update on such a node doesn't invalidate that
 * cached clip -- the rect stays at its initial width (0), so the wordmark is
 * clipped away for the entire reveal and only the R ever appears. Instead the
 * clip window is a *static* rect covering the wordmark's full extent, and the
 * wordmark group slides inside it: it starts one full width to the left (the
 * window shows nothing) and translates to 0, painting the letters in
 * left-to-right. Only a <G> transform animates, which Reanimated drives
 * natively without touching <Defs>.
 */
import React, { useEffect, useId, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';
import { LOGO_MARK_PATHS, LOGO_WORD_PATHS } from '../assets/logoPaths';

const AnimatedG = Animated.createAnimatedComponent(G);

/* Geometry in the logo's coordinate space. These are measured ink extents of
 * the two groups (rasterized, so they're true bounds rather than path-control
 * bounds): mark x 149..329 / y 373..623, wordmark x 378..906 / y 446..555.
 *
 * The canvas is deliberately taller than the lockup's own 294-unit box: at
 * MARK_INTRO_SCALE the mark is 475 units tall and would be cropped top and
 * bottom by a tight viewBox. Padding to 500 units, centered on the lockup,
 * gives the opening frame room. The extra height is transparent, and
 * `width` below still refers to the lockup's visual width. */
const VIEW = { x: 126, y: 250, w: 801, h: 500 };
const MARK_CENTER_X = 239; // midpoint of the mark, the pivot for its scale-down
const MARK_CENTER_Y = 498;
const WORD_START_X = 350; // wipe origin, tucked just behind the mark's right edge
const WORD_END_X = 906;

/* Horizontal drift of the whole group. The mark alone has to sit in the
 * middle of the canvas at the start (+287.5 puts its center on the viewBox
 * center), and the finished lockup — mark plus wordmark, spanning x 149..906 —
 * is already centered on its own, so the drift lands at ~0. */
const GROUP_SHIFT_FROM = 287.5;
const GROUP_SHIFT_TO = -1;
/** The mark's opening scale, before it settles into the lockup. */
const MARK_INTRO_SCALE = 1.9;

/** Beat durations in ms. The mark starts shrinking before its fade completes. */
const T = {
  fadeIn: 620,
  shrink: 1180,
  wipeDelay: 120,
  wipe: 900,
  hold: 420,
};

/** When the shrink starts, overlapping the tail of the fade-in. */
const INTRO_START = T.fadeIn * 0.55;
/** When the wordmark wipe starts. */
const WIPE_START = INTRO_START + T.shrink + T.wipeDelay;

/** Total wall-clock length of the reveal, for callers timing around it. */
export const LOGO_REVEAL_DURATION_MS = WIPE_START + T.wipe + T.hold;

export type AnimatedLogoProps = {
  /** Rendered color for both layers. */
  color: string;
  /** Lockup width in px; height follows the logo's aspect ratio. */
  width?: number;
  /** Fires once the reveal (including the closing hold) has finished. */
  onFinish?: () => void;
};

export default function AnimatedLogo({
  color,
  width = 300,
  onFinish,
}: AnimatedLogoProps) {
  // 0 -> 1 across the mark's fade-in + shrink; drives scale and the group slide.
  const intro = useSharedValue(0);
  const markOpacity = useSharedValue(0);
  // 0 -> 1 as the wordmark's clip rect sweeps right.
  const wipe = useSharedValue(0);

  // Kept in a ref so the play-once effect never restarts when a caller passes
  // an inline arrow for onFinish.
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    markOpacity.value = withTiming(1, {
      duration: T.fadeIn,
      easing: Easing.out(Easing.quad),
    });

    intro.value = withDelay(
      INTRO_START,
      withTiming(1, {
        duration: T.shrink,
        // Slow, confident settle -- no overshoot, matching the reference clip.
        easing: Easing.bezier(0.22, 0.61, 0.36, 1),
      }),
    );

    wipe.value = withDelay(
      WIPE_START,
      withTiming(1, { duration: T.wipe, easing: Easing.out(Easing.cubic) }),
    );

    /* onFinish is fired from a plain timer rather than withTiming's completion
     * callback: the callback only runs if the animation reaches its end, so an
     * interrupted reveal (a re-render cancelling the timing, low-end device
     * dropping the UI-thread work) would never report completion and would
     * strand any caller gating navigation on it. The timer also covers the
     * closing hold, which no single animation spans. */
    const timer = setTimeout(() => onFinishRef.current?.(), LOGO_REVEAL_DURATION_MS);
    return () => clearTimeout(timer);
    // Shared values are stable refs; the reveal is intentionally play-once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* The mark scales about its own center, so the shrink reads as the letter
   * settling in place rather than sliding toward a corner. */
  const markProps = useAnimatedProps(() => {
    const scale = interpolate(intro.value, [0, 1], [MARK_INTRO_SCALE, 1]);
    const tx = MARK_CENTER_X - MARK_CENTER_X * scale;
    const ty = MARK_CENTER_Y - MARK_CENTER_Y * scale;
    return {
      opacity: markOpacity.value,
      transform: [{ translateX: tx }, { translateY: ty }, { scale }],
    } as never;
  });

  /* Whole-lockup drift: centered while the mark is alone, shifted left by the
   * time the wordmark needs the room. */
  const groupProps = useAnimatedProps(() => {
    const shift = interpolate(
      intro.value,
      [0, 1],
      [GROUP_SHIFT_FROM, GROUP_SHIFT_TO],
    );
    return { transform: [{ translateX: shift }] } as never;
  });

  /* The wordmark slides right inside a fixed clip window, so glyphs emerge
   * left-to-right from behind the mark and land at their lockup position. */
  const wordProps = useAnimatedProps(() => {
    const dx = interpolate(wipe.value, [0, 1], [-(WORD_END_X - WORD_START_X), 0]);
    return { transform: [{ translateX: dx }] } as never;
  });

  // Render the padded canvas at its true aspect, so `width` keeps meaning the
  // lockup's width while the taller box stays free for the oversized intro.
  const height = (width * VIEW.h) / VIEW.w;

  /* SVG ids share one document-wide namespace, so a fixed id would make two
   * mounted logos fight over the same clip path. React's useId() embeds ":",
   * which isn't valid inside url(#...), so strip it. */
  const clipId = `rz-word-wipe-${useId().replace(/:/g, '')}`;

  return (
    <View style={styles.container}>
      <Svg
        width={width}
        height={height}
        viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
      >
        <Defs>
          <ClipPath id={clipId}>
            <Rect
              x={WORD_START_X}
              y={VIEW.y}
              width={WORD_END_X - WORD_START_X}
              height={VIEW.h}
            />
          </ClipPath>
        </Defs>

        <AnimatedG animatedProps={groupProps}>
          <AnimatedG animatedProps={markProps} fill={color}>
            {LOGO_MARK_PATHS.map((p, i) => (
              <Path key={i} d={p.d} translateX={p.tx} translateY={p.ty} />
            ))}
          </AnimatedG>

          <G clipPath={`url(#${clipId})`}>
            <AnimatedG animatedProps={wordProps} fill={color}>
              {LOGO_WORD_PATHS.map((p, i) => (
                <Path key={i} d={p.d} translateX={p.tx} translateY={p.ty} />
              ))}
            </AnimatedG>
          </G>
        </AnimatedG>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
});
