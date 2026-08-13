/**
 * Figma: Design System / Button (293:30545)
 * Axes — State: Primary | Secondary | Black | Critical | Outlined | No bg |
 * Blue no bg | Critical no bg; Size: Large 48 | Medium 40 | Small 32; Style: Active | Disabled.
 */
import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { fonts, palette, radius, Theme } from '../theme';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'black'
  | 'critical'
  | 'outlined'
  | 'ghost'
  | 'ghostBlue'
  | 'ghostCritical';

export type ButtonSize = 'large' | 'medium' | 'small';

export interface ButtonProps {
  title?: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const makeVariantStyles = (
  t: Theme,
): Record<ButtonVariant, { container: ViewStyle; label: TextStyle; pressed: ViewStyle }> => ({
  primary: {
    container: { backgroundColor: t.colors.primary },
    label: { color: t.colors.textInverse },
    // Darker blue reads as "pressed" on both schemes; the mirrored dark
    // blue[70] is a pale tint that would wash out the white label.
    pressed: { backgroundColor: palette.primary[70] },
  },
  secondary: {
    container: { backgroundColor: t.gray[10] },
    label: { color: t.gray[100] },
    pressed: { backgroundColor: t.gray[20] },
  },
  black: {
    container: { backgroundColor: t.gray[100] },
    label: { color: t.colors.background },
    pressed: { backgroundColor: t.gray[80] },
  },
  critical: {
    container: { backgroundColor: t.colors.criticalSurface },
    label: { color: t.colors.critical },
    pressed: { backgroundColor: t.colors.criticalSurfacePressed },
  },
  outlined: {
    container: { borderWidth: 1.5, borderColor: t.colors.strokeDark },
    label: { color: t.gray[100] },
    pressed: { backgroundColor: t.gray[10] },
  },
  ghost: {
    container: {},
    label: { color: t.gray[100] },
    pressed: { backgroundColor: t.gray[10] },
  },
  ghostBlue: {
    container: {},
    label: { color: t.colors.primary },
    pressed: { backgroundColor: t.blue[0] },
  },
  ghostCritical: {
    container: {},
    label: { color: t.colors.critical },
    pressed: { backgroundColor: t.colors.criticalSurface },
  },
});

const sizeStyles: Record<ButtonSize, { container: ViewStyle; label: TextStyle }> = {
  large: {
    container: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: radius.base },
    label: { fontSize: 16, lineHeight: 24 },
  },
  medium: {
    container: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: radius.base },
    label: { fontSize: 14, lineHeight: 20 },
  },
  small: {
    container: { paddingHorizontal: 24, paddingVertical: 8, borderRadius: radius.md },
    label: { fontSize: 12, lineHeight: 16 },
  },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'large',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
}: ButtonProps) {
  const t = useTheme();
  const variantStyles = useMemo(() => makeVariantStyles(t), [t]);
  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const isInactive = disabled || loading;
  const disabledStyle = { backgroundColor: t.gray[10], borderWidth: 0 };
  const disabledLabelStyle = { color: t.gray[30] };

  return (
    <Pressable
      onPress={onPress}
      disabled={isInactive}
      style={({ pressed }) => [
        styles.base,
        s.container,
        v.container,
        fullWidth && styles.fullWidth,
        disabled && disabledStyle,
        pressed && !isInactive && v.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={disabled ? t.gray[30] : (v.label.color as string)} />
      ) : (
        <>
          {leftIcon && <View>{leftIcon}</View>}
          {title != null && (
            <Text
              // The type size is part of the design system and never shrinks:
              // labels that don't fit wrap to a second line and the button
              // grows vertically instead (constant padding, centered text).
              style={[styles.label, s.label, v.label, disabled && disabledLabelStyle]}
              allowFontScaling={false}
            >
              {title}
            </Text>
          )}
          {rightIcon && <View>{rightIcon}</View>}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fullWidth: { alignSelf: 'stretch' },
  // flexShrink lets the label wrap inside the row (next to icons) instead of
  // pushing them out of the button.
  label: { fontFamily: fonts.semiBold, flexShrink: 1, textAlign: 'center' },
});
