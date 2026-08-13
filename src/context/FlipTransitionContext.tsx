/**
 * Card-flip transition between renter and owner mode.
 *
 * The root stack navigates with animation:'none', so mode switches are an
 * instant swap. flip(navigate) dresses that swap up as a Y-axis card flip on
 * the whole navigator: first half rotates the current screen edge-on (90°,
 * invisible), the navigation fires at the midpoint, then the new screen
 * rotates in from the opposite edge (-90° → 0). Both halves stay within
 * ±90°, so no backface handling is needed.
 *
 * Done here in Reanimated rather than react-native-screens' stack
 * animation:'flip' because that one is iOS-only — this works identically on
 * Android.
 */
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useTheme } from './ThemeContext';

/** One half of the flip; the full transition is twice this. */
const HALF_MS = 220;

type Flip = (navigate: () => void, direction?: 1 | -1) => void;

const FlipTransitionContext = createContext<Flip>(() => {});

/**
 * flip(navigate, direction?) — runs `navigate` (a router push/dispatch that
 * swaps screens instantly) at the midpoint of a full-screen card flip.
 * direction 1 (default) spins one way, -1 the other — use opposite signs for
 * enter/leave so the return trip reads as flipping back.
 */
export const useFlipTransition = () => useContext(FlipTransitionContext);

export function FlipTransitionProvider({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  const angle = useSharedValue(0);
  const busy = useRef(false);
  // Swallows touches for the ~440ms of the flip, so a tap on the half-turned
  // screen can't push another route mid-transition.
  const [blocking, setBlocking] = useState(false);

  const flip = useCallback<Flip>(
    (navigate, direction = 1) => {
      if (busy.current) return;
      busy.current = true;
      setBlocking(true);

      const finish = () => {
        busy.current = false;
        setBlocking(false);
      };

      const midpoint = () => {
        navigate();
        // Two frames: one for the new navigation state to commit, one for the
        // new screen to paint — flipping in earlier would briefly show the
        // outgoing screen coming back.
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            angle.value = -90 * direction;
            angle.value = withTiming(
              0,
              { duration: HALF_MS, easing: Easing.out(Easing.cubic) },
              () => scheduleOnRN(finish),
            );
          }),
        );
      };

      angle.value = withTiming(
        90 * direction,
        { duration: HALF_MS, easing: Easing.in(Easing.cubic) },
        () => scheduleOnRN(midpoint),
      );
    },
    [angle],
  );

  const flipStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateY: `${angle.value}deg` },
      // Slight shrink toward the midpoint sells the depth of the turn.
      { scale: 1 - (Math.abs(angle.value) / 90) * 0.08 },
    ],
  }));

  return (
    <FlipTransitionContext.Provider value={flip}>
      {/* Themed backdrop, revealed behind the card while it's turning. */}
      <View style={[styles.backdrop, { backgroundColor: t.colors.background }]}>
        <Animated.View style={[styles.card, flipStyle]} pointerEvents={blocking ? 'none' : 'auto'}>
          {children}
        </Animated.View>
      </View>
    </FlipTransitionContext.Provider>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  card: { flex: 1 },
});
