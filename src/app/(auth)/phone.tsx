/**
 * Figma: Login & registration / Phone number (light 293:11150 default,
 * 293:11161 typing, 293:11171 filled; dark 539:13961) — back button,
 * centered title, +998 prefix + masked phone input, continue button
 * enabled at 9 digits with a valid operator code.
 *
 * This is the single entry point for both sign-in and sign-up (per the
 * unified-auth mobile design, see memory: rentzor-unified-auth-design):
 * on Continue, checkPhoneExists() decides the next screen -- an existing
 * account goes to the password screen, a new number gets sent an OTP and
 * goes to the OTP screen (then signup-details for email+password).
 */
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionBar, BackButton, Button, useToast } from '../../components';
import { useLanguage, useT } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { checkPhoneExists, requestExistingPhoneOtp, requestPhoneOtp } from '../../lib/auth';
import { fonts, radius, spacing } from '../../theme';

const PHONE_DIGITS = 9;

/** Valid Uzbek mobile operator codes (first two digits after +998). */
const UZ_OPERATOR_CODES = [
  '20', '33', '50', '55', '77', '88', '90', '91', '93', '94', '95', '97', '98', '99',
];

/** 991234567 -> "99 123 45 67" */
function formatPhone(digits: string): string {
  const parts = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)];
  return parts.filter(Boolean).join(' ');
}

export default function PhoneScreen() {
  const router = useRouter();
  const t = useTheme();
  const tr = useT();
  const { language } = useLanguage();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const [digits, setDigits] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const operatorValid =
    digits.length < 2 || UZ_OPERATOR_CODES.includes(digits.slice(0, 2));
  const complete = digits.length === PHONE_DIGITS && operatorValid;

  // Onboarding replaces into this screen, so the stack can be empty —
  // back() would throw an unhandled GO_BACK; fall back to guest home,
  // which is always reachable now that browsing doesn't require a session.
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/home');
  };

  const onChange = (text: string) => {
    const next = text.replace(/\D/g, '').slice(0, PHONE_DIGITS);
    setDigits(next);
    if (next.length === PHONE_DIGITS && UZ_OPERATOR_CODES.includes(next.slice(0, 2))) {
      Keyboard.dismiss();
    }
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const status = await checkPhoneExists(digits);

      if (status.exists && status.confirmed) {
        router.push({ pathname: '/(auth)/password', params: { phone: digits } });
        return;
      }

      // Either a brand-new phone (signup) or an existing-but-unconfirmed
      // one (backfilled web account) -- both need an OTP first, but from
      // different functions: request-phone-otp rejects phones that already
      // have an account (it's signup-only), so an existing-unconfirmed
      // phone needs requestExistingPhoneOtp instead. "mode" tells otp.tsx
      // which screen to continue to afterward.
      const { expiresAt } = status.exists
        ? await requestExistingPhoneOtp(digits, language)
        : await requestPhoneOtp(digits, language);
      router.push({
        pathname: '/(auth)/otp',
        params: {
          phone: digits,
          expiresAt: expiresAt ?? '',
          mode: status.exists ? 'confirm' : 'signup',
        },
      });
    } catch {
      toast.error(tr.auth.networkError);
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
        <BackButton onPress={goBack} style={styles.back} />

        <View style={styles.form}>
          <Text style={[styles.title, { color: t.colors.text }]}>{tr.phone.title}</Text>
          <View style={styles.field}>
            <Text style={[styles.label, { color: t.colors.text }]}>{tr.phone.label}</Text>
            <View style={styles.inputRow}>
              <View style={[styles.countryBox, { borderColor: t.colors.strokeDark }]}>
                <Text style={[styles.countryText, { color: t.colors.text }]}>+998</Text>
              </View>
              <View
                style={[
                  styles.phoneBox,
                  { borderColor: operatorValid ? t.colors.strokeDark : t.colors.critical },
                ]}
              >
                <TextInput
                  style={[styles.phoneInput, { color: t.colors.text }]}
                  value={formatPhone(digits)}
                  onChangeText={onChange}
                  placeholder="-- --- -- --"
                  placeholderTextColor={t.colors.textMuted}
                  keyboardType="number-pad"
                  keyboardAppearance={t.scheme}
                  autoFocus
                />
              </View>
            </View>
            {!operatorValid && (
              <Text style={[styles.error, { color: t.colors.critical }]}>
                {tr.phone.invalid}
              </Text>
            )}
          </View>
        </View>

        <ActionBar
          style={{ paddingBottom: insets.bottom + spacing.lg }}
        >
          <Button
            title={tr.common.continue}
            disabled={!complete}
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
  field: { gap: 4 },
  error: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  countryBox: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.base,
    borderWidth: 1,
    justifyContent: 'center',
  },
  countryText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  phoneBox: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    borderRadius: radius.base,
    borderWidth: 1,
    minHeight: 48,
  },
  phoneInput: {
    fontFamily: fonts.medium,
    fontSize: 16,
    padding: 0,
  },
});
