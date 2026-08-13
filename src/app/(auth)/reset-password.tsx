/**
 * Password recovery, final step: two password fields (new + confirm), same
 * pattern as signup-details.tsx minus the email field -- this is an
 * existing account, not a new one. Reached from password.tsx's "Forgot
 * password?" link -> otp.tsx in mode=reset -> here. Submits phone + otp
 * (both carried from the previous two screens) + the new password to
 * reset-password-with-otp, which verifies the OTP for real, sets the new
 * password, and signs in in one call. See memory:
 * rentzor-unified-auth-design.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionBar, BackButton, Button, Input, useToast } from '../../components';
import { AppIcon } from '../../components/AppIcon';
import { useT } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { AuthFunctionError, resetPassword } from '../../lib/auth';
import { fonts, press, spacing } from '../../theme';

const PASSWORD_MIN = 6;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const t = useTheme();
  const tr = useT();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { phone, otp } = useLocalSearchParams<{ phone?: string; otp?: string }>();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const passwordValid = password.length >= PASSWORD_MIN;
  const passwordsMatch = password === confirmPassword;
  const valid = passwordValid && passwordsMatch;

  // Judged live while typing — the submit button is disabled while invalid,
  // so a submit-time-only check would never get to explain why.
  const passwordError =
    password.length > 0 && !passwordValid ? tr.auth.passwordMin : undefined;
  const confirmError =
    confirmPassword.length > 0 && !passwordsMatch ? tr.auth.passwordMismatch : undefined;

  const submit = async () => {
    if (!valid) return;

    Keyboard.dismiss();
    setSubmitting(true);
    try {
      await resetPassword({ phoneDigits: phone ?? '', otp: otp ?? '', password });
      router.replace('/(tabs)/home');
    } catch (err) {
      const code = err instanceof AuthFunctionError ? err.code : 'network';
      if (code === 'invalid_or_expired_otp' || code === 'too_many_attempts') {
        toast.error(tr.otp.expired);
        router.back();
      } else {
        toast.error(tr.auth.networkError);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={[
          styles.container,
          { backgroundColor: t.colors.background, paddingTop: insets.top + spacing.lg },
        ]}
      >
        <StatusBar style={t.scheme === 'dark' ? 'light' : 'dark'} />
        <BackButton onPress={() => router.back()} style={styles.back} />

        <View style={styles.form}>
          <View style={styles.message}>
            <Text style={[styles.title, { color: t.colors.text }]}>{tr.auth.resetPasswordTitle}</Text>
            <Text style={[styles.subtitle, { color: t.colors.text }]}>
              {tr.auth.resetPasswordSubtitle}
            </Text>
          </View>

          <Input
            label={tr.auth.passwordCreateLabel}
            placeholder={tr.auth.passwordPlaceholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoFocus
            keyboardAppearance={t.scheme}
            error={passwordError}
            rightIcon={
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={8}
                style={({ pressed }) => pressed && press.dim}
              >
                <AppIcon name={showPassword ? 'eyeOff' : 'eye'} color={t.colors.textMuted} />
              </Pressable>
            }
          />

          <Input
            label={tr.auth.passwordConfirmLabel}
            placeholder={tr.auth.passwordConfirmPlaceholder}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            keyboardAppearance={t.scheme}
            error={confirmError}
            rightIcon={
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={8}
                style={({ pressed }) => pressed && press.dim}
              >
                <AppIcon name={showPassword ? 'eyeOff' : 'eye'} color={t.colors.textMuted} />
              </Pressable>
            }
          />
        </View>

        <ActionBar style={{ paddingBottom: insets.bottom + spacing.lg }}>
          <Button
            title={tr.auth.resetPassword}
            disabled={!valid}
            loading={submitting}
            onPress={submit}
          />
        </ActionBar>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
  },
  back: { marginLeft: spacing.screenX },
  form: {
    flex: 1,
    paddingHorizontal: spacing.screenX,
    marginTop: 100,
    gap: spacing.xl,
  },
  message: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 28,
    lineHeight: 40,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
});
