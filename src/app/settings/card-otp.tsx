/**
 * Figma: Settings / Karta qo'shish OTP (293:11378 flow) — "OTP" header,
 * centered title, SMS note with the masked card phone number, 5-digit code
 * boxes (hidden input + OS number pad, same pattern as auth/otp), and a
 * "Davom etish" button enabled once the code is complete.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { Button } from '../../components/Button';
import { Chevron } from '../../components/icons';
import { useLanguage, useT } from '../../context/LanguageContext';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { confirmCard, createCard, getPaylovError } from '../../lib/paylov';
import { fonts, press, radius, spacing, Theme } from '../../theme';

// Paylov sends a 6-digit code (the Figma mock showed 5).
const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function CardOtpScreen() {
  const t = useTheme();
  const styles = useThemedStyles(makeStyles);
  const tr = useT();
  const { language } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const params = useLocalSearchParams<{
    cid: string;
    phone: string;
    cardNumber: string;
    expireDate: string;
  }>();

  const [cid, setCid] = useState(params.cid);
  const [phone, setPhone] = useState(params.phone);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendLeft, setResendLeft] = useState(RESEND_SECONDS);

  const complete = code.length === CODE_LENGTH;

  // Android-only (no-op on iOS -- textContentType="oneTimeCode" below
  // handles iOS instead, same split as auth/otp.tsx). Shows the system
  // "Allow Rentzor to read this SMS?" one-tap prompt when Paylov's OTP text
  // arrives, no READ_SMS/RECEIVE_SMS permission needed.
  const autoDetectedCode = useSmsUserConsent(CODE_LENGTH);

  useEffect(() => {
    if (resendLeft <= 0) return;
    const timer = setTimeout(() => setResendLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendLeft]);

  const onChange = (text: string) => {
    const next = text.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(next);
    setError(null);
    if (next.length === CODE_LENGTH) Keyboard.dismiss();
  };

  useEffect(() => {
    if (autoDetectedCode) onChange(autoDetectedCode);
  }, [autoDetectedCode]);

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await confirmCard({ cardId: cid, otp: code });
      // my-cards refreshes on focus, so the new card is already in the list.
      router.dismissTo('/settings/my-cards');
    } catch (e) {
      setError(getPaylovError(e, language));
    } finally {
      setSubmitting(false);
    }
  };

  // Re-runs createCard with the same card — Paylov issues a fresh cid + OTP.
  const resend = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const result = await createCard({
        cardNumber: params.cardNumber,
        expireDate: params.expireDate,
      });
      setCid(result.cid);
      setPhone(result.otpSentPhone);
      setCode('');
      setResendLeft(RESEND_SECONDS);
    } catch (e) {
      setError(getPaylovError(e, language));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              style={({ pressed }) => pressed && press.dim}
            >
              <Chevron direction="left" size={24} color="#18181B" />
            </Pressable>
            <Text style={styles.headerTitle}>{tr.cardOtp.title}</Text>
          </View>
          <View style={styles.divider} />
        </View>

        <View style={styles.message}>
          <Text style={styles.title}>{tr.cardOtp.title}</Text>
          <Text style={styles.subtitle}>
            {tr.cardOtp.subtitleBefore}
            <Text style={styles.subtitleBold}>{phone}</Text>
            {tr.cardOtp.subtitleAfter}
          </Text>

          <Pressable style={styles.boxes} onPress={() => inputRef.current?.focus()}>
            {Array.from({ length: CODE_LENGTH }, (_, i) => {
              const active = i === code.length;
              return (
                <View key={i} style={[styles.box, active && styles.boxActive]}>
                  <Text style={styles.digit}>{code[i] ?? ''}</Text>
                </View>
              );
            })}
          </Pressable>
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            value={code}
            onChangeText={onChange}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            autoFocus
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Pressable onPress={resend} disabled={resendLeft > 0 || submitting} hitSlop={8}>
            <Text style={[styles.resend, resendLeft > 0 && { color: t.colors.textMuted }]}>
              {resendLeft > 0
                ? tr.cardOtp.resendIn.replace('{seconds}', String(resendLeft))
                : tr.cardOtp.resend}
            </Text>
          </Pressable>
        </View>

        <View style={[styles.actionBar, { paddingBottom: insets.bottom + spacing.lg }]}>
          <Button
            title={tr.common.continue}
            fullWidth
            disabled={!complete}
            loading={submitting}
            onPress={submit}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  header: {
    gap: spacing.lg,
    backgroundColor: t.colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.screenX,
  },
  headerTitle: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 20,
    lineHeight: 32,
    color: t.colors.text,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: t.colors.strokeDark,
    marginHorizontal: spacing.screenX,
  },
  message: {
    flex: 1,
    alignItems: 'center',
    marginTop: 64,
    gap: spacing.lg,
    paddingHorizontal: spacing.screenX,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 28,
    lineHeight: 40,
    textAlign: 'center',
    color: t.colors.text,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: t.colors.text,
  },
  subtitleBold: {
    fontFamily: fonts.semiBold,
  },
  boxes: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  box: {
    // 6 boxes since Paylov's OTP is 6 digits; 48pt keeps the row inside 393pt.
    width: 48,
    height: 64,
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: t.colors.strokeDark,
    backgroundColor: t.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: { borderColor: t.colors.primary },
  digit: {
    fontFamily: fonts.medium,
    fontSize: 24,
    color: t.colors.text,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 1,
    width: 1,
  },
  errorText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: t.colors.critical,
  },
  resend: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: t.colors.primary,
  },
  actionBar: {
    paddingHorizontal: spacing.screenX,
    paddingTop: spacing.lg,
    backgroundColor: t.colors.background,
  },
});
