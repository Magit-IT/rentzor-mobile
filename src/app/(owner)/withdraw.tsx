/**
 * Owner mode — Mablag‘ni yechish. Mirrors rentzor-owner's WithdrawPage:
 * amount + saved-card picker, then a preview/confirm round-trip through the
 * balance-withdraw edge function (Paylov A2C transfer, profiles.balance
 * debited server-side; commission is server-driven and currently 0). "Joriy balans" is the owner's funds
 * (useOwnerBalance().net — the same number the owner profile card shows);
 * the withdrawable cap additionally respects the real shared wallet
 * (profiles.balance − held_balance), which is all the server enforces.
 */
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActionBar,
  BankLogo,
  BottomSheet,
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
import {
  confirmWithdrawal,
  getPaylovError,
  PaylovError,
  previewWithdrawal,
  WithdrawPreview,
} from '../../lib/paylov';
import { fonts, radius, spacing, Theme } from '../../theme';

const MIN_AMOUNT = 5000;

/** 2000000 -> "2 000 000" */
const formatAmount = (digits: string) =>
  digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export default function WithdrawScreen() {
  const t = useTheme();
  const tr = useT();
  const { language } = useLanguage();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, refresh: refreshProfile } = useProfile();
  const toast = useToast();
  const { cards, loading: cardsLoading, refresh: refreshCards } = useUserCards();
  const { net: ownerFunds } = useOwnerBalance();
  const [amount, setAmount] = useState('');
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [preview, setPreview] = useState<WithdrawPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  // Cards load async, so the default selection is derived, not initial state.
  const activeCardId = selectedCard ?? cards[0]?.id ?? null;

  // A card added mid-flow (add-card pushes from here too) appears on return.
  useFocusEffect(useCallback(() => refreshCards(), [refreshCards]));

  const held = profile?.held_balance ?? 0;
  // The server only checks the shared wallet (balance − held); the owner
  // display split caps the withdrawal at the owner's own funds on top.
  const walletAvailable = Math.max(0, (profile?.balance ?? 0) - held);
  const available = Math.max(0, Math.min(ownerFunds, walletAvailable));
  const numericAmount = Number(amount) || 0;
  const isValidAmount = numericAmount >= MIN_AMOUNT && numericAmount <= available;
  const activeCard = cards.find((c) => c.id === activeCardId) ?? null;
  const canSubmit = isValidAmount && activeCard !== null && !loading;

  const showError = (e: unknown) => {
    if (e instanceof PaylovError) {
      const code = e.responseBody.error_code as string | undefined;
      if (code === 'card_not_found') {
        toast.error(tr.withdraw.cardNotFound);
      } else if (code === 'invalid_amount') {
        toast.error(tr.withdraw.invalidAmount);
      } else if (code === 'insufficient_balance') {
        toast.error(tr.withdraw.insufficientBalance);
      } else if (code === 'balance_debit_failed') {
        const ref = e.responseBody.paylov_ref as string | undefined;
        toast.error(tr.withdraw.balanceDebitFailed + (ref ? ` (ID: ${ref})` : ''));
      } else {
        toast.error(getPaylovError(e, language));
      }
    } else {
      toast.error(tr.withdraw.transferFailed);
    }
  };

  const requestPreview = async () => {
    if (!canSubmit || !activeCard) return;
    setLoading(true);
    try {
      const data = await previewWithdrawal({
        cardId: activeCard.paylov_card_id,
        amount: numericAmount,
      });
      setPreview(data);
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    if (!activeCard || !preview) return;
    setConfirming(true);
    try {
      const result = await confirmWithdrawal({
        cardId: activeCard.paylov_card_id,
        amount: preview.amount,
      });
      await refreshProfile();
      setPreview(null);
      router.back();
      toast.success(`${tr.withdraw.success} ${formatAmount(String(result.owner_receives))} UZS`);
    } catch (e) {
      setPreview(null);
      showError(e);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <PageHeader title={tr.withdraw.title} onBack={() => router.back()} />

      <PageScrollView contentContainerStyle={styles.scroll}>
        {/* Owner funds — same number as the profile balance card. */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{tr.withdraw.currentBalance}</Text>
          <Text style={styles.balanceValue}>{formatUZS(ownerFunds)}</Text>
          {held > 0 && (
            <Text style={styles.heldNote}>{tr.withdraw.heldNote(formatUZS(held))}</Text>
          )}
        </View>

        {/* Amount */}
        <View style={styles.amountBlock}>
          <Input
            label={tr.withdraw.amountLabel}
            value={amount ? formatAmount(amount) : ''}
            onChangeText={(v) => setAmount(v.replace(/\D/g, ''))}
            placeholder={tr.withdraw.amountPlaceholder}
            keyboardType="number-pad"
            inputMode="numeric"
            rightIcon={<Text style={styles.uzs}>UZS</Text>}
          />
          {amount !== '' && numericAmount < MIN_AMOUNT && (
            <Text style={styles.errorText}>{tr.withdraw.minimum}</Text>
          )}
          {amount !== '' && numericAmount >= MIN_AMOUNT && numericAmount > available && (
            <Text style={styles.errorText}>{tr.withdraw.insufficientBalance}</Text>
          )}
          <Pressable
            onPress={() => setAmount(String(available))}
            disabled={available < MIN_AMOUNT}
            style={({ pressed }) => [
              styles.allChip,
              available < MIN_AMOUNT && styles.allChipDisabled,
              pressed && { backgroundColor: t.gray[20] },
            ]}
          >
            <Text style={styles.allChipText}>{tr.withdraw.withdrawAll}</Text>
          </Pressable>
        </View>

        {/* Card picker */}
        <View style={styles.cardsBlock}>
          <Text style={styles.sectionLabel}>{tr.withdraw.toCard}</Text>
          {cardsLoading ? (
            <ActivityIndicator color={t.colors.primary} />
          ) : cards.length === 0 ? (
            <Text style={styles.emptyText}>{tr.withdraw.addCardFirst}</Text>
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
          title={tr.withdraw.calculate}
          disabled={!canSubmit}
          loading={loading}
          onPress={requestPreview}
        />
      </ActionBar>

      {/* Preview → confirm sheet */}
      <BottomSheet
        visible={preview !== null}
        onClose={() => !confirming && setPreview(null)}
        title={tr.withdraw.confirmTitle}
        footer={
          /* No inset padding here: the sheet itself already pads its bottom
           * by max(insets.bottom, lg) — doubling it left a large blank strip
           * under the button. */
          <ActionBar>
            <Button
              title={tr.withdraw.confirm}
              loading={confirming}
              onPress={confirm}
            />
          </ActionBar>
        }
      >
        {preview && (
          <View style={styles.previewBlock}>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>{tr.withdraw.youWithdraw}</Text>
              <Text style={styles.previewValue}>{formatUZS(preview.amount)}</Text>
            </View>
            {/* Server-driven: hidden while the commission rate is 0. */}
            {preview.commission > 0 && (
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>
                  {tr.withdraw.commission(preview.commission_percent)}
                </Text>
                <Text style={[styles.previewValue, { color: t.colors.critical }]}>
                  -{formatUZS(preview.commission)}
                </Text>
              </View>
            )}
            <View style={[styles.previewRow, styles.previewTotalRow]}>
              <Text style={styles.previewTotalLabel}>{tr.withdraw.youReceive}</Text>
              <Text style={[styles.previewTotalValue, { color: t.colors.primary }]}>
                {formatUZS(preview.owner_receives)}
              </Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>{tr.withdraw.balanceAfter}</Text>
              {/* Owner funds after, not the server's shared-wallet figure —
                  keeps the sheet consistent with the profile card. */}
              <Text style={styles.previewValue}>
                {formatUZS(Math.max(0, ownerFunds - preview.amount))}
              </Text>
            </View>
            {activeCard && (
              <View style={styles.previewCardRow}>
                <BankLogo vendor={activeCard.vendor} />
                <Text style={styles.previewCardText}>
                  •••• {activeCard.masked_number.replace(/\s/g, '').slice(-4)}
                </Text>
              </View>
            )}
          </View>
        )}
      </BottomSheet>
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
    heldNote: {
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 16,
      color: t.orange[50],
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
    allChip: {
      alignSelf: 'flex-start',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: t.colors.strokeDark,
      backgroundColor: t.colors.background,
    },
    allChipDisabled: {
      opacity: 0.5,
    },
    allChipText: {
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
    previewBlock: {
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radius.base,
      backgroundColor: t.colors.surface,
    },
    previewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    previewLabel: {
      flexShrink: 1,
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: 20,
      color: t.colors.textSecondary,
    },
    previewValue: {
      fontFamily: fonts.medium,
      fontSize: 14,
      lineHeight: 20,
      color: t.colors.text,
    },
    previewTotalRow: {
      borderTopWidth: 1,
      borderTopColor: t.colors.strokeLight,
      paddingTop: spacing.md,
    },
    previewTotalLabel: {
      fontFamily: fonts.semiBold,
      fontSize: 16,
      lineHeight: 24,
      color: t.colors.text,
    },
    previewTotalValue: {
      fontFamily: fonts.semiBold,
      fontSize: 16,
      lineHeight: 24,
    },
    previewCardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    previewCardText: {
      fontFamily: fonts.medium,
      fontSize: 14,
      lineHeight: 20,
      color: t.colors.textSecondary,
    },
  });
