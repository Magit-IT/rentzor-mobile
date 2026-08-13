/**
 * Figma: Design System / Toggle (293:31775) — 44x24 track r=12, 2px padding,
 * 20px white thumb; active track primary, inactive #E4E4E7.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { press } from '../theme';

export interface ToggleProps {
  value: boolean;
  onChange?: (value: boolean) => void;
  disabled?: boolean;
  style?: ViewStyle;
}

const TRACK_WIDTH = 44;
const TRACK_HEIGHT = 24;
const THUMB_SIZE = 20;
const PADDING = 2;

export function Toggle({ value, onChange, disabled = false, style }: ToggleProps) {
  const t = useTheme();
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [value, anim]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TRACK_WIDTH - THUMB_SIZE - PADDING * 2],
  });

  return (
    <Pressable
      onPress={() => onChange?.(!value)}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => [
        styles.track,
        { backgroundColor: value ? t.colors.primary : t.gray[20] },
        pressed && press.dim,
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.thumb,
          disabled && { backgroundColor: t.gray[10] },
          { transform: [{ translateX }] },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    padding: PADDING,
    justifyContent: 'center',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
});
