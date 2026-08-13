/**
 * Figma: Settings / Shikoyatlar (293:11378 flow) — "Shikoyatlar" header and
 * dispute cards: ID row, product (box icon), rental dates (calendar, gray),
 * amount (banknote), and an orange "Shikoyat ochildi" status badge.
 * Box/banknote geometry from assets/shared date-icon.svg / price-icon.svg.
 */
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { EmptyState } from '../../../components';
import { Chevron } from '../../../components/icons';
import { formatUZS } from '../../../context/BalanceContext';
import { useT } from '../../../context/LanguageContext';
import { useTheme, useThemedStyles } from '../../../context/ThemeContext';
import { disputeCode, useDisputes } from '../../../hooks/useDisputes';
import { fonts, press, radius, spacing, Theme } from '../../../theme';

const ICONS = {
  box: (color: string) => `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.9818 2.81814L14.6484 3.69277C16.4415 4.63372 17.338 5.1042 17.8358 5.94962C18.3337 6.79504 18.3337 7.84706 18.3337 9.9511V10.0486C18.3337 12.1526 18.3337 13.2046 17.8358 14.0501C17.338 14.8955 16.4415 15.366 14.6484 16.3069L12.9818 17.1815C11.5187 17.9493 10.7872 18.3332 10.0003 18.3332C9.21343 18.3332 8.48192 17.9493 7.0189 17.1815L5.35224 16.3069C3.55918 15.366 2.66265 14.8955 2.16482 14.0501C1.66699 13.2046 1.66699 12.1526 1.66699 10.0486V9.9511C1.66699 7.84706 1.66699 6.79504 2.16482 5.94962C2.66265 5.1042 3.55918 4.63372 5.35224 3.69277L7.0189 2.81814C8.48192 2.05038 9.21343 1.6665 10.0003 1.6665C10.7872 1.6665 11.5187 2.05038 12.9818 2.81814Z" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/><path d="M17.5 6.25L14.1667 7.91667M10 10L2.5 6.25M10 10V17.9167M10 10C10 10 12.2855 8.85723 13.75 8.125C13.9127 8.04364 14.1667 7.91667 14.1667 7.91667M14.1667 7.91667V10.8333M14.1667 7.91667L6.25 3.75" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  calendar: (color: string) => `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2.5" y="4.16667" width="15" height="13.3333" rx="3" stroke="${color}" stroke-width="1.5"/><path d="M2.5 8.33333H17.5" stroke="${color}" stroke-width="1.5"/><path d="M6.66699 2.5V5" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/><path d="M13.333 2.5V5" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/><path d="M6.25 11.25H6.25833M9.99583 11.25H10.0042M13.7458 11.25H13.7542M6.25 14.1667H6.25833M9.99583 14.1667H10.0042M13.7458 14.1667H13.7542" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  banknote: (color: string) => `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.66699 9.1665C1.66699 6.80948 1.66699 5.63097 2.39923 4.89874C3.13146 4.1665 4.30997 4.1665 6.66699 4.1665H10.8337C13.1907 4.1665 14.3692 4.1665 15.1014 4.89874C15.8337 5.63097 15.8337 6.80948 15.8337 9.1665C15.8337 11.5235 15.8337 12.702 15.1014 13.4343C14.3692 14.1665 13.1907 14.1665 10.8337 14.1665H6.66699C4.30997 14.1665 3.13146 14.1665 2.39923 13.4343C1.66699 12.702 1.66699 11.5235 1.66699 9.1665Z" stroke="${color}" stroke-width="1.5"/><path d="M15.8337 6.72998C16.6463 6.80991 17.1932 6.99054 17.6015 7.39878C18.3337 8.13101 18.3337 9.30953 18.3337 11.6665C18.3337 14.0236 18.3337 15.2021 17.6015 15.9343C16.8692 16.6665 15.6907 16.6665 13.3337 16.6665H9.16704C6.81002 16.6665 5.63151 16.6665 4.89927 15.9343C4.49103 15.5261 4.31039 14.9791 4.23047 14.1665" stroke="${color}" stroke-width="1.5"/><path d="M10.8337 9.16683C10.8337 10.3174 9.90092 11.2502 8.75033 11.2502C7.59973 11.2502 6.66699 10.3174 6.66699 9.16683C6.66699 8.01624 7.59973 7.0835 8.75033 7.0835C9.90092 7.0835 10.8337 8.01624 10.8337 9.16683Z" stroke="${color}" stroke-width="1.5"/><path d="M13.333 10.8335L13.333 7.50016" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/><path d="M4.16699 10.8335L4.16699 7.50016" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/></svg>`,
};

function DisputeIcon({ name, color }: { name: keyof typeof ICONS; color: string }) {
  return <SvgXml xml={ICONS[name](color)} width={20} height={20} />;
}

export default function ComplaintsScreen() {
  const t = useTheme();
  const tr = useT();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { disputes, loading, error, refresh } = useDisputes();

  // An admin resolution while the app is open shows up on the way back in.
  useFocusEffect(useCallback(() => refresh(), [refresh]));

  /** "2026-05-08", "2026-05-13" -> "8 May - 13 May" */
  const formatRange = (start: string, end: string) => {
    const one = (iso: string) => {
      const d = new Date(iso);
      return Number.isNaN(d.getTime()) ? '' : `${d.getDate()} ${tr.product.months[d.getMonth()]}`;
    };
    return `${one(start)} - ${one(end)}`;
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
          <Text style={styles.headerTitle}>{tr.complaints.title}</Text>
        </View>
        <View style={styles.divider} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          !loading && !error && disputes.length === 0 && styles.listEmpty,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={t.colors.primary} style={styles.loader} />
        ) : error ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>{tr.complaints.loadError}</Text>
            <Pressable
              onPress={refresh}
              style={({ pressed }) => [styles.retryButton, pressed && press.dim]}
            >
              <Text style={styles.retryText}>{tr.home.retry}</Text>
            </Pressable>
          </View>
        ) : disputes.length === 0 ? (
          <EmptyState
            image={require('../../../assets/empty-states/no-complaints.png')}
            title={tr.complaints.emptyTitle}
            subtitle={tr.complaints.emptySubtitle}
          />
        ) : (
          disputes.map((dispute) => {
            const resolved = dispute.dispute_status !== 'open';
            return (
              <Pressable
                key={dispute.id}
                onPress={() => router.push(`/settings/complaints/${dispute.id}`)}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              >
                <View style={styles.row}>
                  <Text style={styles.idLabel}>ID</Text>
                  <Text style={styles.idValue}>{disputeCode(dispute.id)}</Text>
                </View>
                <View style={styles.row}>
                  <DisputeIcon name="box" color={t.colors.text} />
                  <Text style={styles.product}>{dispute.item_title ?? '—'}</Text>
                </View>
                <View style={styles.row}>
                  <DisputeIcon name="calendar" color={t.colors.textSecondary} />
                  <Text style={styles.dates}>
                    {formatRange(dispute.start_date, dispute.end_date)}
                  </Text>
                </View>
                <View style={styles.row}>
                  <DisputeIcon name="banknote" color={t.colors.text} />
                  <Text style={styles.amount}>{formatUZS(dispute.total_cost ?? 0)}</Text>
                </View>
                <View style={[styles.badge, resolved && styles.badgeResolved]}>
                  <Text style={[styles.badgeText, resolved && styles.badgeTextResolved]}>
                    {tr.complaints.statuses[dispute.dispute_status] ??
                      tr.complaints.statusOpen}
                  </Text>
                </View>
              </Pressable>
            );
          })
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
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: t.colors.strokeLight,
    backgroundColor: t.colors.backgroundSecondary,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardPressed: { backgroundColor: t.gray[0] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  idLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.textSecondary,
  },
  idValue: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
    color: t.colors.text,
  },
  product: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    lineHeight: 22,
    color: t.colors.text,
  },
  dates: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.textSecondary,
  },
  amount: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    lineHeight: 22,
    color: t.colors.text,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: t.orange[10],
  },
  badgeText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: t.orange[60],
  },
  badgeResolved: {
    backgroundColor: t.green[0],
  },
  badgeTextResolved: {
    color: t.colors.success,
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
});
