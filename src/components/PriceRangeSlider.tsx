/**
 * Figma: Filter / "Price Range Container" (293:12190;747:10570) — a two-thumb
 * range slider on a flat track, min/max labels above each thumb. No slider
 * library is in the app yet, so this is a small dependency-free
 * PanResponder-based implementation matching the Figma track/thumb sizing.
 */
import React, { useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { fonts } from '../theme';

export interface PriceRangeSliderProps {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
  step?: number;
  formatLabel?: (value: number) => string;
}

const THUMB_SIZE = 20;

export function PriceRangeSlider({
  min,
  max,
  valueMin,
  valueMax,
  onChange,
  step = 1000,
  formatLabel = (v) => String(v),
}: PriceRangeSliderProps) {
  const t = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);

  const toX = (value: number, width: number) =>
    width === 0 ? 0 : ((value - min) / (max - min)) * width;
  const toValue = (x: number, width: number) => {
    const ratio = Math.min(1, Math.max(0, x / width));
    const raw = min + ratio * (max - min);
    return Math.round(raw / step) * step;
  };

  // The PanResponders below are created once (useRef) so gestures aren't
  // dropped mid-drag by a re-render; they read current props/state through
  // this ref instead of closing over the values from creation time.
  const liveRef = useRef({ trackWidth, valueMin, valueMax, onChange, step });
  liveRef.current = { trackWidth, valueMin, valueMax, onChange, step };

  // gesture.dx from PanResponder is cumulative from gesture START, not since
  // the last move event. Rebasing it onto the current (already-updated)
  // value on every move — as an earlier version of this did — compounds the
  // displacement each event and sends the thumb flying to one end. The fix:
  // snapshot the thumb's value once at gesture start (grantRef) and always
  // compute position as startValue + dx against that fixed snapshot.
  const grantRef = useRef(0);

  const moveThumb = (thumb: 'min' | 'max', dx: number) => {
    const { trackWidth: width, valueMin: vMin, valueMax: vMax, onChange: change, step: s } =
      liveRef.current;
    if (width === 0) return;
    const next = toValue(toX(grantRef.current, width) + dx, width);
    if (thumb === 'min') {
      change(Math.min(next, vMax - s), vMax);
    } else {
      change(vMin, Math.max(next, vMin + s));
    }
  };

  const minResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        grantRef.current = liveRef.current.valueMin;
      },
      onPanResponderMove: (_evt, gesture) => moveThumb('min', gesture.dx),
    }),
  ).current;
  const maxResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        grantRef.current = liveRef.current.valueMax;
      },
      onPanResponderMove: (_evt, gesture) => moveThumb('max', gesture.dx),
    }),
  ).current;

  return (
    <View style={styles.container}>
      <View style={styles.labels}>
        <Text style={[styles.label, { color: t.gray[70] }]}>{formatLabel(valueMin)}</Text>
        <Text style={[styles.label, { color: t.gray[70] }]}>{formatLabel(valueMax)}</Text>
      </View>
      <View
        style={styles.track}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width - THUMB_SIZE)}
      >
        <View style={[styles.trackBg, { backgroundColor: t.gray[20] }]} />
        {trackWidth > 0 && (
          <>
            <View
              style={[
                styles.trackFill,
                {
                  backgroundColor: t.colors.primary,
                  left: toX(valueMin, trackWidth) + THUMB_SIZE / 2,
                  width: Math.max(0, toX(valueMax, trackWidth) - toX(valueMin, trackWidth)),
                },
              ]}
            />
            <View
              {...minResponder.panHandlers}
              style={[
                styles.thumb,
                { backgroundColor: t.colors.primary, left: toX(valueMin, trackWidth) },
              ]}
            />
            <View
              {...maxResponder.panHandlers}
              style={[
                styles.thumb,
                { backgroundColor: t.colors.primary, left: toX(valueMax, trackWidth) },
              ]}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', gap: 8 },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  label: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  track: {
    height: THUMB_SIZE,
    justifyContent: 'center',
  },
  trackBg: {
    position: 'absolute',
    left: THUMB_SIZE / 2,
    right: THUMB_SIZE / 2,
    height: 4,
    borderRadius: 2,
  },
  trackFill: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
