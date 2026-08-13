/**
 * Figma: Booking flow (payment) / Hisobni to‘ldirish — current balance card,
 * amount input with UZS suffix and quick-amount chips, saved-card picker
 * ("Dan to‘ldirish") with radio selection, "Karta qo‘shish" row, and the
 * "Hisobni to‘ldirish" action bar.
 *
 * Mirrors rentzor-marketplace's TopUp.tsx: charges the selected saved card
 * directly through the balance-topup edge function (Paylov receipt
 * create+pay, then profiles.balance credited server-side via
 * service_adjust_balance) — no local/fake balance state.
 */
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActionBar,
  BankLogo,
  Button,
  Input,
  PageHeader,
  PageScrollView,
  RadioButton,
  useToast,
} from '../../components';
import { PlusIcon } from '../../components/icons';
import { formatUZS } from '../../context/BalanceContext';
import { useLanguage, useT } from '../../context/LanguageContext';
import { useProfile } from '../../context/ProfileContext';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { useOwnerBalance } from '../../hooks/useOwnerBalance';
import { formatExpireDate, useUserCards } from '../../hooks/useUserCards';
import { getPaylovError, PaylovError, topUpBalance } from '../../lib/paylov';
import { fonts, press, radius, spacing, Theme } from '../../theme';

const QUICK_AMOUNTS = [100000, 200000, 500000, 1000000];
const MIN_AMOUNT = 1000;

/** 2000000 -> "2 000 000" */
const formatAmount = (digits: string) =>
  digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export default function TopUpScreen() {
  const t = useTheme();
  const tr = useT();
  const { language } = useLanguage();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, refresh: refreshProfile } = useProfile();
  const toast = useToast();
  const { cards, loading: cardsLoading, refresh: refreshCards } = useUserCards();
  // Renter-mode figure: the shared wallet minus the owner's funds — the same
  // number the renter profile card shows (display-only wallet split).
  const { net: ownerFunds } = useOwnerBalance();
  const renterBalance = Math.max(0, (profile?.balance ?? 0) - ownerFunds);
  const [amount, setAmount] = useState('');
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Cards load async, so the default selection is derived, not initial state.
  const activeCardId = selectedCard ?? cards[0]?.id ?? null;

  // A card added mid-flow (add-card pushes from here too) appears on return.
  useFocusEffect(useCallback(() => refreshCards(), [refreshCards]));

  const numericAmount = Number(amount) || 0;
  const isValidAmount = numericAmount >= MIN_AMOUNT;
  const activeCard = cards.find((c) => c.id === activeCardId) ?? null;
  const canSubmit = isValidAmount && activeCard !== null && !submitting;

  const submit = async () => {
    if (!canSubmit || !activeCard) return;
    setSubmitting(true);
    try {
      const result = await topUpBalance({ cardId: activeCard.paylov_card_id, amount: numericAmount });
      await refreshProfile();
      router.back();
      toast.success(`${tr.topUp.success} +${formatAmount(String(result.amount))} UZS`);
    } catch (e) {
      if (e instanceof PaylovError) {
        const code = e.responseBody.error_code as string | undefined;
        if (code === 'card_not_found') {
          toast.error(tr.topUp.cardNotFound);
        } else if (code === 'invalid_amount') {
          toast.error(tr.topUp.invalidAmount);
        } else if (code === 'balance_update_failed') {
          const receiptId = e.responseBody.receipt_id as string | undefined;
          toast.error(tr.topUp.balanceUpdateFailed + (receiptId ? ` (ID: ${receiptId})` : ''));
        } else {
          toast.error(getPaylovError(e, language));
        }
      } else {
        toast.error(tr.topUp.paymentFailed);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <PageHeader title={tr.topUp.title} onBack={() => router.back()} />

      <PageScrollView contentContainerStyle={styles.scroll}>
        {/* Current balance */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{tr.topUp.currentBalance}</Text>
          <Text style={styles.balanceValue}>{formatUZS(renterBalance)}</Text>
        </View>

        {/* Amount */}
        <View style={styles.amountBlock}>
          <Input
            label={tr.topUp.amountLabel}
            value={amount ? formatAmount(amount) : ''}
            onChangeText={(v) => setAmount(v.replace(/\D/g, ''))}
            placeholder={tr.topUp.amountPlaceholder}
            keyboardType="number-pad"
            inputMode="numeric"
            rightIcon={<Text style={styles.uzs}>UZS</Text>}
          />
          {amount !== '' && !isValidAmount && (
            <Text style={styles.errorText}>{tr.topUp.minimum}</Text>
          )}
          <View style={styles.chips}>
            {QUICK_AMOUNTS.map((value) => (
              <Pressable
                key={value}
                onPress={() => setAmount(String(value))}
                style={({ pressed }) => [
                  styles.chip,
                  numericAmount === value && styles.chipActive,
                  pressed && { backgroundColor: t.gray[20] },
                ]}
              >
                <Text style={styles.chipText}>{formatAmount(String(value))}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Card picker */}
        <View style={styles.cardsBlock}>
          <Text style={styles.sectionLabel}>{tr.topUp.fromCard}</Text>
          {cardsLoading ? (
            <ActivityIndicator color={t.colors.primary} />
          ) : cards.length === 0 ? (
            <Text style={styles.emptyText}>{tr.topUp.addCardFirst}</Text>
          ) : (
            cards.map((card) => {
              const selected = card.id === activeCardId;
              return (
                <Pressable
                  key={card.id}
                  onPress={() => setSelectedCard(card.id)}
                  style={[styles.card, selected && styles.cardSelected]}
                >
                  <BankLogo vendor={card.vendor} />
                  <View style={styles.cardText}>
                    <Text style={styles.cardNumber}>
                      •••• •••• •••• {card.masked_number.replace(/\s/g, '').slice(-4)}
                    </Text>
                    <Text style={styles.cardExpiry}>{formatExpireDate(card.expire_date)}</Text>
                  </View>
                  <RadioButton selected={selected} onPress={() => setSelectedCard(card.id)} />
                </Pressable>
              );
            })
          )}

          <Pressable
            onPress={() => router.push('/settings/add-card')}
            style={({ pressed }) => [styles.card, pressed && { backgroundColor: t.gray[20] }]}
          >
            <View style={styles.addIcon}>
              <PlusIcon size={20} color={t.colors.text} />
            </View>
            <Text style={styles.addLabel}>{tr.common.addCard}</Text>
          </Pressable>
        </View>
      </PageScrollView>

      <ActionBar style={{ paddingBottom: insets.bottom + spacing.lg }}>
        <Button
          title={tr.topUp.title}
          disabled={!canSubmit}
          loading={submitting}
          onPress={submit}
        />
      </ActionBar>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  scroll: {
    padding: spacing.screenX,
    gap: spacing.xl,
  },
  balanceCard: {
    borderRadius: radius.base,
    backgroundColor: t.colors.surface,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  balanceLabel: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: t.colors.text,
  },
  balanceValue: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 32,
    color: t.colors.text,
  },
  amountBlock: {
    gap: spacing.md,
  },
  uzs: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    lineHeight: 22,
    color: t.colors.primary,
  },
  errorText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: t.colors.critical,
  },
  chips: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: t.colors.strokeDark,
    backgroundColor: t.colors.background,
  },
  chipActive: {
    borderColor: t.colors.primary,
    backgroundColor: t.blue[0],
  },
  chipText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: t.colors.text,
  },
  cardsBlock: {
    gap: spacing.md,
  },
  sectionLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.text,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.textSecondary,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: t.colors.strokeLight,
    backgroundColor: t.colors.backgroundSecondary,
  },
  cardSelected: {
    borderColor: t.colors.primary,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  cardNumber: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
    color: t.colors.text,
  },
  cardExpiry: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: t.colors.textSecondary,
  },
  addIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.colors.surface,
  },
  addLabel: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
    color: t.colors.text,
  },
});
