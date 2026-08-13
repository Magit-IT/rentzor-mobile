/**
 * Figma: Login & registration / OTP (light 293:11181 countdown, 293:11202
 * typing, 293:11222 resend link; dark 539:13992/14013/14033) — box layout
 * and countdown/resend pattern from the design, extended to 6 digits (the
 * design shows 4, but this project's backend/web app standardize on 6 --
 * see memory: rentzor-unified-auth-design).
 *
 * Once all 6 digits are entered, verifyOtp() checks the code (read-only --
 * doesn't consume it or count as an attempt) purely to color the boxes
 * red/green here. The code is still collected and passed through to the
 * next screen (signup-details for a new account, or the password screen in
 * confirm mode for a backfilled one -- see the `mode` param below), where
 * register-user / confirm-phone-with-otp does the real, authoritative
 * verification (which DOES consume the code) alongside the password in one
 * call -- this screen's check is advisory UX feedback, not a security
 * boundary, so a wrong/expired code can still surface as an error on that
 * next screen if e.g. it expires in the gap between the two screens.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSmsUserConsent } from '@eabdullazyanov/react-native-sms-user-consent';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionBar, BackButton, Button, useToast } from '../../components';
import { useLanguage, useT } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { requestExistingPhoneOtp, requestPhoneOtp, verifyOtp } from '../../lib/auth';
import { fonts, press, radius, spacing } from '../../theme';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

export default function OtpScreen() {
  const router = useRouter();
  const t = useTheme();
  const tr = useT();
  const { language } = useLanguage();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { phone, expiresAt: expiresAtParam, mode } = useLocalSearchParams<{
    phone?: string;
    expiresAt?: string;
    /** 'signup': new account, continues to signup-details.
     *  'confirm': existing account whose phone was never OTP-confirmed
     *  (backfilled web accounts), continues to the password screen in
     *  confirm mode -- see lib/auth.ts's PhoneAccountStatus.
     *  'reset': password.tsx's "Forgot password?" link for an existing,
     *  already-confirmed account -- continues to reset-password.tsx. */
    mode?: 'signup' | 'confirm' | 'reset';
  }>();
  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(
    expiresAtParam ? new Date(expiresAtParam) : null,
  );
  const [resendCooldownUntil, setResendCooldownUntil] = useState<Date | null>(
    () => new Date(Date.now() + RESEND_COOLDOWN_SECONDS * 1000),
  );
  const [now, setNow] = useState(() => Date.now());
  const [resending, setResending] = useState(false);
  // 'idle' while typing, 'checking' during the verifyOtp() call, then
  // 'valid'/'invalid' color the boxes green/red. Purely advisory (see
  // header comment) -- Continue only submits, it doesn't re-verify.
  const [checkStatus, setCheckStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  // Android-only (no-op on iOS, see the library's README) -- shows the
  // system "Allow Rentzor to read this SMS?" one-tap prompt when the Eskiz
  // OTP text arrives, no READ_SMS/RECEIVE_SMS permission needed. Requires no
  // changes to the SMS template (matches the first 6-digit run in the
  // message body, same as CODE_LENGTH), unlike the SMS Retriever API.
  const autoDetectedCode = useSmsUserConsent(CODE_LENGTH);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (autoDetectedCode) setCode(autoDetectedCode);
  }, [autoDetectedCode]);

  const secondsUntil = (date: Date | null) =>
    date ? Math.max(0, Math.ceil((date.getTime() - now) / 1000)) : 0;
  const expiredSecondsLeft = secondsUntil(expiresAt);
  const resendSecondsLeft = secondsUntil(resendCooldownUntil);
  const expired = expiresAt !== null && expiredSecondsLeft === 0;
  const expiredTimeLeft = `${Math.floor(expiredSecondsLeft / 60)}:${String(expiredSecondsLeft % 60).padStart(2, '0')}`;

  const complete = code.length === CODE_LENGTH;

  useEffect(() => {
    if (code.length !== CODE_LENGTH) {
      setCheckStatus('idle');
      return;
    }
    let cancelled = false;
    setCheckStatus('checking');
    verifyOtp(phone ?? '', code)
      .then((valid) => {
        if (!cancelled) setCheckStatus(valid ? 'valid' : 'invalid');
      })
      .catch(() => {
        // Network hiccup on the advisory check -- fall back to idle rather
        // than showing a false "invalid"; Continue still works and the
        // real check happens on the next screen regardless.
        if (!cancelled) setCheckStatus('idle');
      });
    return () => {
      cancelled = true;
    };
  }, [code, phone]);

  const resend = async () => {
    if (resendSecondsLeft > 0 || resending) return;
    setResending(true);
    try {
      // Only signup has no account yet -- confirm and reset both need a
      // phone that already exists, same request function as each other.
      const { expiresAt: nextExpiresAt } =
        mode === 'signup'
          ? await requestPhoneOtp(phone ?? '', language)
          : await requestExistingPhoneOtp(phone ?? '', language);
      setCode('');
      setExpiresAt(nextExpiresAt ? new Date(nextExpiresAt) : null);
      setResendCooldownUntil(new Date(Date.now() + RESEND_COOLDOWN_SECONDS * 1000));
    } catch {
      toast.error(tr.auth.networkError);
    } finally {
      setResending(false);
    }
  };

  const phoneLabel = phone ? `+998${phone}` : '+998';

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

        <View style={styles.message}>
          <Text style={[styles.title, { color: t.colors.text }]}>{tr.otp.title}</Text>
          <Text style={[styles.subtitle, { color: t.colors.text }]}>
            {tr.otp.sentTo(phoneLabel)}
          </Text>

          <Pressable style={styles.boxes} onPress={() => inputRef.current?.focus()}>
            {Array.from({ length: CODE_LENGTH }, (_, i) => {
              const active = i === code.length;
              const borderColor =
                checkStatus === 'valid'
                  ? t.colors.success
                  : checkStatus === 'invalid'
                    ? t.colors.critical
                    : active
                      ? t.colors.primary
                      : t.colors.strokeDark;
              return (
                <View key={i} style={[styles.box, { borderColor }]}>
                  <Text style={[styles.digit, { color: t.colors.text }]}>{code[i] ?? ''}</Text>
                </View>
              );
            })}
          </Pressable>
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            value={code}
            onChangeText={(text) => {
              const next = text.replace(/\D/g, '').slice(0, CODE_LENGTH);
              setCode(next);
              if (next.length === CODE_LENGTH) Keyboard.dismiss();
            }}
            keyboardType="number-pad"
            keyboardAppearance={t.scheme}
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            autoFocus
          />

          {expired ? (
            <Text style={[styles.countdown, { color: t.colors.critical }]}>
              {tr.otp.expired}
            </Text>
          ) : (
            <Text style={[styles.countdown, { color: t.colors.textSecondary }]}>
              <Text style={[styles.countdownNumber, { color: t.colors.text }]}>
                {expiredTimeLeft}
              </Text>
              {tr.otp.countdownSuffix}
            </Text>
          )}

          <View style={styles.resendRow}>
            <Text style={[styles.resendQuestion, { color: t.colors.text }]}>
              {tr.otp.notReceived}
            </Text>
            <Pressable
              onPress={resend}
              disabled={resendSecondsLeft > 0 || resending}
              hitSlop={8}
              style={({ pressed }) => pressed && press.dim}
            >
              <Text
                style={[
                  styles.resendLink,
                  { color: resendSecondsLeft > 0 ? t.colors.textMuted : t.colors.primary },
                ]}
              >
                {resendSecondsLeft > 0
                  ? tr.otp.resendIn(resendSecondsLeft)
                  : tr.otp.resend}
              </Text>
            </Pressable>
          </View>
        </View>

        <ActionBar
          style={{ paddingBottom: insets.bottom + spacing.lg }}
        >
          <Button
            title={tr.common.continue}
            disabled={!complete || expired || checkStatus !== 'valid'}
            loading={checkStatus === 'checking'}
            onPress={() => {
              if (mode === 'confirm') {
                router.push({
                  pathname: '/(auth)/password',
                  params: { phone, otp: code, mode: 'confirm' },
                });
              } else if (mode === 'reset') {
                router.push({
                  pathname: '/(auth)/reset-password',
                  params: { phone, otp: code },
                });
              } else {
                router.push({
                  pathname: '/(auth)/signup-details',
                  params: { phone, otp: code },
                });
              }
            }}
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
  message: {
    flex: 1,
    alignItems: 'center',
    marginTop: 32,
    gap: spacing.lg,
    paddingHorizontal: spacing.screenX,
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
  boxes: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  box: {
    width: 48,
    height: 64,
    borderRadius: radius.base,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: {
    fontFamily: fonts.medium,
    fontSize: 24,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 1,
    width: 1,
  },
  countdown: {
    marginTop: spacing.xxl,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  countdownNumber: {
    fontFamily: fonts.semiBold,
  },
  resendRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendQuestion: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  resendLink: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    textDecorationLine: 'underline',
  },
});
