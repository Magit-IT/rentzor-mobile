/**
 * Figma: Design System / Input (293:31673) + Text Box (293:31309)
 * States: Default | With title | With description. Focus border is primary blue.
 */
import React, { forwardRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { fonts, radius, Theme } from '../theme';

export interface InputProps extends TextInputProps {
  label?: string;
  description?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    description,
    error,
    leftIcon,
    rightIcon,
    containerStyle,
    onFocus,
    onBlur,
    style,
    ...inputProps
  },
  ref,
) {
  const t = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label != null && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.box,
          focused && styles.boxFocused,
          error != null && styles.boxError,
        ]}
      >
        {leftIcon}
        <TextInput
          ref={ref}
          // Caller style merges on top of (not instead of) the base input
          // style, so height overrides keep the font family/size.
          style={[styles.input, style]}
          placeholderTextColor={t.colors.textMuted}
          // Android wraps and clips long placeholder text instead of
          // ellipsizing; single-line keeps the hint on one line.
          multiline={false}
          numberOfLines={1}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...inputProps}
        />
        {rightIcon}
      </View>
      {(error ?? description) != null && (
        <Text style={[styles.description, error != null && styles.errorText]}>
          {error ?? description}
        </Text>
      )}
    </View>
  );
});

const makeStyles = (t: Theme) =>
  StyleSheet.create({
  container: { gap: 4, alignSelf: 'stretch' },
  label: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.text,
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: t.colors.strokeDark,
    backgroundColor: t.colors.background,
    minHeight: 48,
  },
  boxFocused: { borderColor: t.colors.primary },
  boxError: { borderColor: t.colors.critical },
  input: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: t.colors.text,
    padding: 0,
  },
  description: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.textMuted,
  },
  errorText: { color: t.colors.critical },
});
