/**
 * Login step for an existing account: same layout as the phone screen —
 * back button, centered title, single field, action bar. Two modes:
 *
 *  - normal (default): phone.tsx already confirmed via check-phone-exists
 *    that this phone is registered AND confirmed, so this screen only
 *    needs a password. Signs in directly with
 *    signInWithPassword({ phone, password }). Also shows "Forgot
 *    password?", which sends a reset OTP for the already-known phone and
 *    continues to otp.tsx in mode=reset -> reset-password.tsx.
 *
 *  - confirm (arrived via otp.tsx after mode=confirm): this account's
 *    phone was never OTP-verified (backfilled web accounts -- see
 *    vps/migrations/backfill_auth_users_phone.sql). Calls
 *    confirmPhoneWithOtp() instead, which verifies the OTP carried from
 *    the previous screen, flips phone_confirm, and signs in with this
 *    same password in one call. Also shows "Forgot password?", for a user
 *    who can't remember their password to get past this screen at all --
 *    unlike the normal-mode link, this does NOT request a new OTP (the one
 *    already in hand from the previous screen hasn't been consumed yet,
 *    since confirmPhoneWithOtp() was never called), so it goes straight to
 *    reset-password.tsx with the same phone+otp params.
 *
 * See memory: rentzor-unified-auth-design.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionBar, BackButton, Button, Input, useToast } from '../../components';
import { AppIcon } from '../../components/AppIcon';
import { useLanguage, useT } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import {
  AuthFunctionError,
  confirmPhoneWithOtp,
  PhoneSignInError,
  requestExistingPhoneOtp,
  signInWithPhone,
} from '../../lib/auth';
import { fonts, press, spacing } from '../../theme';

const PASSWORD_MIN = 6;

export default function PasswordScreen() {
  const router = useRouter();
  const t = useTheme();
  const tr = useT();
  const { language } = useLanguage();
  const insets = useSafeAreaInsets();
  const { phone, otp, mode } = useLocalSearchParams<{
    phone?: string;
    otp?: string;
    mode?: 'confirm';
  }>();
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signInError, setSignInError] = useState<PhoneSignInError | null>(null);
  const [sendingReset, setSendingReset] = useState(false);

  const tooShort = password.length > 0 && password.length < PASSWORD_MIN;
  const valid = password.length >= PASSWORD_MIN;

  const errorMessages: Record<PhoneSignInError, string> = {
    invalid_credentials: tr.auth.wrongPassword,
    network: tr.auth.networkError,
  };

  const submit = async () => {
    Keyboard.dismiss();
    setSubmitting(true);
    setSignInError(null);

    if (mode === 'confirm') {
      try {
        await confirmPhoneWithOtp({ phoneDigits: phone ?? '', otp: otp ?? '', password });
        router.replace('/(tabs)/home');
      } catch (err) {
        const code = err instanceof AuthFunctionError ? err.code : 'network';
        setSignInError(code === 'invalid_credentials' ? 'invalid_credentials' : 'network');
        if (code === 'invalid_or_expired_otp' || code === 'too_many_attempts') {
          // The OTP itself expired/was wrong while typing the password --
          // send back to the OTP screen rather than a dead-end error here.
          router.back();
        }
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const { error } = await signInWithPhone(phone ?? '', password);
    setSubmitting(false);
    if (error) {
      setSignInError(error);
      return;
    }
    router.replace('/(tabs)/home');
  };

  const forgotPassword = async () => {
    if (sendingReset) return;
    setSendingReset(true);
    try {
      const { expiresAt } = await requestExistingPhoneOtp(phone ?? '', language);
      router.push({
        pathname: '/(auth)/otp',
        params: { phone, expiresAt: expiresAt ?? '', mode: 'reset' },
      });
    } catch {
      toast.error(tr.auth.networkError);
    } finally {
      setSendingReset(false);
    }
  };

  const forgotPasswordConfirmed = () => {
    // The OTP carried from otp.tsx hasn't been consumed yet -- confirming
    // was never submitted -- so it's still valid for reset-password.tsx to
    // verify for real. No need to send a new one.
    router.push({
      pathname: '/(auth)/reset-password',
      params: { phone, otp },
    });
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
          <Text style={[styles.title, { color: t.colors.text }]}>{tr.auth.passwordTitle}</Text>
          <Input
            label={tr.auth.passwordLabel}
            placeholder={tr.auth.passwordPlaceholder}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setSignInError(null);
            }}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoFocus
            keyboardAppearance={t.scheme}
            error={
              tooShort
                ? tr.auth.passwordMin
                : signInError
                  ? errorMessages[signInError]
                  : undefined
            }
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
          <Pressable
            onPress={mode === 'confirm' ? forgotPasswordConfirmed : forgotPassword}
            disabled={sendingReset}
            hitSlop={8}
            style={({ pressed }) => [styles.forgotLink, pressed && press.dim]}
          >
            <Text style={[styles.forgotLinkText, { color: t.colors.primary }]}>
              {tr.auth.forgotPassword}
            </Text>
          </Pressable>
        </View>

        <ActionBar style={{ paddingBottom: insets.bottom + spacing.lg }}>
          <Button
            title={tr.common.continue}
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
    marginTop: 140,
    gap: spacing.xxl,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 28,
    lineHeight: 40,
    textAlign: 'center',
  },
  forgotLink: {
    alignSelf: 'flex-start',
  },
  forgotLinkText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
});
