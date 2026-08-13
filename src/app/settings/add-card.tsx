/**
 * Figma: Settings / Karta qo'shish (293:11378 flow) — "Karta qo'shish"
 * header, card number + expiry inputs (masked, driven by the OS numeric
 * keyboard), security note, sticky "Qo'shish" button.
 */
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../../components/AppIcon';
import { Button } from '../../components/Button';
import { Chevron } from '../../components/icons';
import { useLanguage, useT } from '../../context/LanguageContext';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { createCard, getPaylovError, PaylovError } from '../../lib/paylov';
import { fonts, press, radius, spacing, Theme } from '../../theme';

const CARD_NUMBER_LENGTH = 16;
const EXPIRY_LENGTH = 4;

/** 4242424242424242 -> "4242 4242 4242 4242" */
function formatCardNumber(digits: string): string {
  return digits.match(/.{1,4}/g)?.join(' ') ?? digits;
}

/** 0927 -> "09/27" */
function formatExpiry(digits: string): string {
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export default function AddCardScreen() {
  const t = useTheme();
  const tr = useT();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const expiryRef = useRef<TextInput>(null);

  const complete = cardNumber.length === CARD_NUMBER_LENGTH && expiry.length === EXPIRY_LENGTH;

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      // Screen collects MMYY; Paylov wants YYMM.
      const expireDate = expiry.slice(2) + expiry.slice(0, 2);
      const { cid, otpSentPhone } = await createCard({ cardNumber, expireDate });
      router.push({
        pathname: '/settings/card-otp',
        params: { cid, phone: otpSentPhone, cardNumber, expireDate },
      });
    } catch (e) {
      // A card that already exists on Paylov gets synced into user_cards by
      // the function — my-cards' focus refresh will pick it up on the way back.
      if (e instanceof PaylovError && e.responseBody.error_code === 'card_exists' && e.responseBody.synced) {
        router.back();
        return;
      }
      setError(getPaylovError(e, language));
    } finally {
      setSubmitting(false);
    }
  };

  const onChangeCardNumber = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, CARD_NUMBER_LENGTH);
    setCardNumber(digits);
    if (digits.length === CARD_NUMBER_LENGTH) expiryRef.current?.focus();
  };

  const onChangeExpiry = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, EXPIRY_LENGTH);
    setExpiry(digits);
    // Both fields are now full — reveal the enabled button under the keyboard.
    if (digits.length === EXPIRY_LENGTH && cardNumber.length === CARD_NUMBER_LENGTH) {
      Keyboard.dismiss();
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
            <Text style={styles.headerTitle}>{tr.addCard.title}</Text>
          </View>
          <View style={styles.divider} />
        </View>

        <View style={styles.content}>
          <View style={styles.field}>
            <Text style={styles.label}>{tr.addCard.cardNumber}</Text>
            <View style={styles.box}>
              <TextInput
                style={styles.input}
                value={formatCardNumber(cardNumber)}
                onChangeText={onChangeCardNumber}
                placeholder="XXXX XXXX XXXX XXXX"
                placeholderTextColor={t.colors.textMuted}
                keyboardType="number-pad"
                autoFocus
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{tr.addCard.expiry}</Text>
            <View style={[styles.box, styles.expiryBox]}>
              <TextInput
                ref={expiryRef}
                style={styles.input}
                value={formatExpiry(expiry)}
                onChangeText={onChangeExpiry}
                placeholder={tr.addCard.expiryPlaceholder}
                placeholderTextColor={t.colors.textMuted}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.secureNote}>
            <AppIcon name="shieldCheck" color={t.colors.text} size={20} />
            <Text style={styles.secureText}>{tr.addCard.secureNote}</Text>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>

        <View style={[styles.actionBar, { paddingBottom: insets.bottom + spacing.lg }]}>
          <Button
            title={tr.addCard.add}
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
  content: {
    flex: 1,
    paddingHorizontal: spacing.screenX,
    paddingTop: spacing.xxl,
    gap: spacing.xl,
  },
  field: {
    gap: spacing.sm,
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.text,
  },
  box: {
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: t.colors.strokeDark,
    backgroundColor: t.colors.background,
    minHeight: 48,
  },
  expiryBox: {
    alignSelf: 'flex-start',
    minWidth: 140,
    borderRadius: radius.base,
  },
  input: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: t.colors.text,
    padding: 0,
  },
  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  secureText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.text,
  },
  errorText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.critical,
  },
  actionBar: {
    paddingHorizontal: spacing.screenX,
    paddingTop: spacing.lg,
    backgroundColor: t.colors.backgroundSecondary,
    borderTopWidth: 1,
    borderColor: t.colors.strokeLight,
  },
});
