/**
 * Figma: Settings / Transaction history (293:11378) — "To'lovlar tarixi"
 * header with back arrow, followed by bordered transaction cards (circular
 * icon, title, blue ID + gray timestamp, right-aligned colored amount).
 * Failed transactions use a red icon and an uncolored amount.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chevron } from '../../components/icons';
import {
  TransactionIcon,
  TransactionIconName,
} from '../../components/TransactionIcon';
import { formatUZS } from '../../context/BalanceContext';
import { useT } from '../../context/LanguageContext';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { BalanceTransaction, useBalanceTransactions } from '../../hooks/useBalanceTransactions';
import { fonts, press, radius, spacing, Theme } from '../../theme';

// The ledger's transaction_type values (see prod data / internal_adjust_balance).
const TYPE_ICONS: Record<string, TransactionIconName> = {
  user_topup: 'card',
  admin_top_up: 'card',
  booking_charge: 'card',
  late_fee_charge: 'penalty',
  platform_late_fee: 'penalty',
};

/** The functions write both "withdrawal_fee" and "withdrawal_commission". */
const normalizeType = (type: string) =>
  type === 'withdrawal_commission' ? 'withdrawal_fee' : type;

export default function TransactionsScreen() {
  const t = useTheme();
  const tr = useT();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Owner mode opens this screen with ?scope=owner to hide renter-side
  // entries (rental charges, refunds, top-ups) and show only owner income.
  const { scope } = useLocalSearchParams<{ scope?: string }>();
  const { transactions, loading, error, refresh } = useBalanceTransactions({
    ownerOnly: scope === 'owner',
  });

  /** "2026-05-06T10:12:00Z" -> "6 may, 10:12" (device-local time). */
  const formatDate = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    const month = tr.product.months[d.getMonth()].toLowerCase();
    return `${d.getDate()} ${month}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const renderRow = (tx: BalanceTransaction) => {
    const type = normalizeType(tx.transaction_type);
    const title = tr.transactions.types[type] ?? tx.description ?? tr.transactions.types.unknown;
    const isBookingRef = tx.reference_type === 'booking' && tx.reference_id;
    const amountColor = tx.amount >= 0 ? t.colors.success : t.colors.critical;

    return (
      <Pressable
        key={tx.id}
        disabled={!isBookingRef}
        onPress={() => isBookingRef && router.push(`/booking/${tx.reference_id}`)}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        <View style={styles.iconCircle}>
          <TransactionIcon name={TYPE_ICONS[type] ?? 'wallet'} color={t.colors.text} />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <View style={styles.metaRow}>
            {isBookingRef && (
              <Text style={styles.refId}>
                ID{tx.reference_id!.slice(0, 5).toUpperCase()}
              </Text>
            )}
            <Text style={styles.date}>{formatDate(tx.created_at)}</Text>
          </View>
        </View>
        <Text style={[styles.amount, { color: amountColor }]}>
          {tx.amount >= 0 ? '+' : '-'}
          {formatUZS(Math.abs(tx.amount))}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={({ pressed }) => pressed && press.dim}
          >
            <Chevron direction="left" size={24} color={t.colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{tr.transactions.title}</Text>
        </View>
        <View style={styles.divider} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {loading ? (
          <ActivityIndicator color={t.colors.primary} style={styles.loader} />
        ) : error ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>{tr.transactions.loadError}</Text>
            <Pressable
              onPress={refresh}
              style={({ pressed }) => [styles.retryButton, pressed && press.dim]}
            >
              <Text style={styles.retryText}>{tr.home.retry}</Text>
            </Pressable>
          </View>
        ) : transactions.length === 0 ? (
          <Text style={[styles.emptyText, styles.emptyBox]}>{tr.transactions.empty}</Text>
        ) : (
          transactions.map(renderRow)
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
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
  list: {
    paddingHorizontal: spacing.screenX,
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingLeft: spacing.md,
    paddingRight: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: t.colors.strokeLight,
    backgroundColor: t.colors.backgroundSecondary,
  },
  cardPressed: { backgroundColor: t.gray[0] },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: t.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    paddingVertical: spacing.xxl,
  },
  emptyBox: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: t.colors.textSecondary,
  },
  retryButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: t.colors.strokeLight,
    backgroundColor: t.colors.backgroundSecondary,
  },
  retryText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.text,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  refId: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.primary,
  },
  date: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.textSecondary,
  },
  amount: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
  },
});
