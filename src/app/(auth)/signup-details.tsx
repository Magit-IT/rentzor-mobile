/**
 * Figma: Login & registration / Password Creation (623:10422, 623:10492
 * filled) — title + subtitle message, two password fields (create +
 * confirm). Extended with an email field (not in the Figma design) since
 * mobile signup collects email alongside password, same as the web app --
 * see memory: rentzor-unified-auth-design. Last step of signup: submits
 * phone + otp (both carried from the previous two screens) + email +
 * password to register-user, which verifies the OTP for real and creates
 * the account in one call.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Keyboard, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionBar, BackButton, Button, Checkbox, Input, useToast } from '../../components';
import { AppIcon } from '../../components/AppIcon';
import { useT } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { AuthFunctionError, registerUser } from '../../lib/auth';
import { fonts, press, spacing } from '../../theme';

const PASSWORD_MIN = 6;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Same legal docs the web signup requires consent to. The web checkbox links
// to rentzor.uz/oferta, but that route doesn't exist in the marketplace app
// (404) — /rental-agreement is where the offer actually lives, and it's the
// URL settings/help.tsx already uses.
const OFFER_URL = 'https://rentzor.uz/rental-agreement';
const PRIVACY_URL = 'https://rentzor.uz/privacy';

/**
 * Checkbox + label where one span of the label is a tappable link. Tapping
 * the text toggles the box (bigger target than the 20px box alone); tapping
 * the underlined span opens the document instead.
 */
function ConsentRow({
  checked,
  onChange,
  prefix,
  link,
  suffix,
  url,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  prefix: string;
  link: string;
  suffix: string;
  url: string;
}) {
  const t = useTheme();
  return (
    <View style={styles.consentRow}>
      <Checkbox checked={checked} onChange={onChange} style={styles.consentBox} />
      <Text
        style={[styles.consentText, { color: t.colors.text }]}
        onPress={() => onChange(!checked)}
        suppressHighlighting
      >
        {prefix}
        <Text
          style={[styles.consentLink, { color: t.colors.primary }]}
          onPress={() => Linking.openURL(url).catch(() => {})}
        >
          {link}
        </Text>
        {suffix}
      </Text>
    </View>
  );
}

export default function SignupDetailsScreen() {
  const router = useRouter();
  const t = useTheme();
  const tr = useT();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { phone, otp } = useLocalSearchParams<{ phone?: string; otp?: string }>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Email is only judged after leaving the field — flagging a half-typed
  // address is noise. Password rules are judged live while typing: the
  // submit button is disabled while invalid, so a submit-time-only check
  // would never get a chance to explain WHY it's disabled.
  const [emailBlurred, setEmailBlurred] = useState(false);
  // Consent to the public offer + privacy policy, mirroring the web signup
  // (rentzor-marketplace Auth.tsx) where both checkboxes gate the submit.
  const [acceptedOffer, setAcceptedOffer] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const emailValid = EMAIL_RE.test(email);
  const passwordValid = password.length >= PASSWORD_MIN;
  const passwordsMatch = password === confirmPassword;
  const valid =
    emailValid && passwordValid && passwordsMatch && acceptedOffer && acceptedPrivacy;

  const emailError =
    emailBlurred && email.length > 0 && !emailValid ? tr.auth.emailInvalid : undefined;
  const passwordError =
    password.length > 0 && !passwordValid ? tr.auth.passwordMin : undefined;
  const confirmError =
    confirmPassword.length > 0 && !passwordsMatch ? tr.auth.passwordMismatch : undefined;

  const submit = async () => {
    if (!valid) return;

    Keyboard.dismiss();
    setSubmitting(true);
    try {
      await registerUser({ phoneDigits: phone ?? '', otp: otp ?? '', email, password });
      router.replace('/(tabs)/home');
    } catch (err) {
      const code = err instanceof AuthFunctionError ? err.code : 'network';
      if (code === 'invalid_or_expired_otp' || code === 'too_many_attempts') {
        toast.error(tr.otp.expired);
        router.back();
      } else if (code === 'email_already_registered') {
        toast.error(tr.auth.emailAlreadyRegistered);
      } else if (code === 'phone_already_registered') {
        toast.error(tr.auth.accountNotFound);
        router.replace('/(auth)/phone');
      } else {
        toast.error(tr.auth.networkError);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: t.colors.background, paddingTop: insets.top + spacing.lg },
      ]}
    >
      <StatusBar style={t.scheme === 'dark' ? 'light' : 'dark'} />
      <BackButton onPress={() => router.back()} style={styles.back} />

      <KeyboardAwareScrollView
        style={styles.form}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
        bottomOffset={spacing.xl}
      >
        <View style={styles.message}>
          <Text style={[styles.title, { color: t.colors.text }]}>{tr.auth.signupDetailsTitle}</Text>
          <Text style={[styles.subtitle, { color: t.colors.text }]}>
            {tr.auth.signupDetailsSubtitle}
          </Text>
        </View>

        <Input
          label={tr.auth.emailLabel}
          placeholder={tr.auth.emailPlaceholder}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          keyboardAppearance={t.scheme}
          error={emailError}
          onBlur={() => setEmailBlurred(true)}
        />

        <Input
          label={tr.auth.passwordCreateLabel}
          placeholder={tr.auth.passwordPlaceholder}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
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

        <View style={styles.consent}>
          <ConsentRow
            checked={acceptedOffer}
            onChange={setAcceptedOffer}
            prefix={tr.auth.acceptOfferPrefix}
            link={tr.auth.acceptOfferLink}
            suffix={tr.auth.acceptOfferSuffix}
            url={OFFER_URL}
          />
          <ConsentRow
            checked={acceptedPrivacy}
            onChange={setAcceptedPrivacy}
            prefix={tr.auth.acceptPrivacyPrefix}
            link={tr.auth.acceptPrivacyLink}
            suffix={tr.auth.acceptPrivacySuffix}
            url={PRIVACY_URL}
          />
        </View>
      </KeyboardAwareScrollView>

      <ActionBar style={{ paddingBottom: insets.bottom + spacing.lg }}>
        <Button
          title={tr.common.continue}
          disabled={!valid}
          loading={submitting}
          onPress={submit}
        />
      </ActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  back: { marginLeft: spacing.screenX },
  form: {
    flex: 1,
  },
  formContent: {
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
  consent: {
    gap: spacing.md,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  // Checkbox is 20px tall, the label line is 20px — nudge the box down so it
  // centers on the label's first line when the text wraps to two lines.
  consentBox: { marginTop: 1 },
  consentText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  consentLink: {
    textDecorationLine: 'underline',
  },
});
