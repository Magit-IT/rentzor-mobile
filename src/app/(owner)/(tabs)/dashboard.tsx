/**
 * Figma: Owner — Dashboard (2132:9561) — greeting header with bell, 2×2 KPI
 * grid (Jami daromad / Faol e'lonlar / Jami buyurtmalar / O'rtacha kunlik
 * narx), "Daromad ko'rinishi" line chart and "Tranzaksiya tarixi" card.
 * KPI math mirrors rentzor-owner's useOwnerStats; earnings are the owner's
 * 88% net take of completed bookings.
 */
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path, Polyline } from 'react-native-svg';
import { AppIcon } from '../../../components/AppIcon';
import { useT } from '../../../context/LanguageContext';
import { useProfile } from '../../../context/ProfileContext';
import { useTheme, useThemedStyles } from '../../../context/ThemeContext';
import { useBalanceTransactions } from '../../../hooks/useBalanceTransactions';
import { useOwnerBalance } from '../../../hooks/useOwnerBalance';
import { useOwnerBookings } from '../../../hooks/useOwnerBookings';
import { useOwnerItems } from '../../../hooks/useOwnerItems';
import { groupDigits } from '../../../lib/format';
import { fonts, press, radius, spacing, Theme } from '../../../theme';

const CHART_HEIGHT = 140;

/** 12450000 -> "12.4M", 8000 -> "8K" — chart axis labels. */
function shortSum(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${Number.isInteger(m) ? m : m.toFixed(1)}M`;
  }
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

export default function OwnerDashboardScreen() {
  const t = useTheme();
  const tr = useT();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const { items, loading: itemsLoading, refresh: refreshItems } = useOwnerItems();
  const { bookings, loading: bookingsLoading, refresh: refreshBookings } = useOwnerBookings();
  // Same sources as the owner To'lovlar tarixi screen, so the KPI and the
  // transaction card always agree with the full ledger view.
  const { total: ownerEarnings, refresh: refreshEarnings } = useOwnerBalance();
  const { transactions: ownerTx, refresh: refreshTx } = useBalanceTransactions({ ownerOnly: true });
  const [chartWidth, setChartWidth] = useState(0);
  const [pullRefreshing, setPullRefreshing] = useState(false);

  const loading = itemsLoading || bookingsLoading;
  React.useEffect(() => {
    if (!loading) setPullRefreshing(false);
  }, [loading]);

  // Re-fetch when the tab regains focus — completing/rejecting an order on
  // the detail screen changes bookings, earnings and the ledger.
  useFocusEffect(
    React.useCallback(() => {
      refreshItems();
      refreshBookings();
      refreshEarnings();
      refreshTx();
    }, [refreshItems, refreshBookings, refreshEarnings, refreshTx]),
  );

  const completed = useMemo(
    () => bookings.filter((b) => b.display_status === 'completed'),
    [bookings],
  );

  const stats = useMemo(() => {
    const activeListings = items.filter(
      (i) => i.display_status === 'active' && i.available !== false,
    ).length;
    const avgDailyRate = items.length
      ? Math.round(items.reduce((sum, i) => sum + i.price_per_day, 0) / items.length)
      : 0;
    return { activeListings, totalBookings: bookings.length, avgDailyRate };
  }, [items, bookings]);

  // Net earnings per month for the last 6 months (bucketed by end date).
  const chart = useMemo(() => {
    const now = new Date();
    const buckets: { label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = completed
        .filter((b) => {
          const end = new Date(b.end_date);
          return end.getFullYear() === d.getFullYear() && end.getMonth() === d.getMonth();
        })
        .reduce((sum, b) => sum + b.earnings, 0);
      buckets.push({ label: tr.product.months[d.getMonth()].slice(0, 3), value });
    }
    return buckets;
  }, [completed, tr]);

  const chartMax = Math.max(...chart.map((c) => c.value), 1);
  const plotWidth = Math.max(chartWidth - 36, 0); // 36pt gutter for y labels
  const points = chart.map((c, i) => ({
    x: 36 + (plotWidth * i) / (chart.length - 1),
    y: CHART_HEIGHT - (CHART_HEIGHT - 12) * (c.value / chartMax),
  }));
  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');
  const area =
    points.length > 1
      ? `M ${points[0].x} ${points[0].y} ` +
        points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ') +
        ` L ${points[points.length - 1].x} ${CHART_HEIGHT} L ${points[0].x} ${CHART_HEIGHT} Z`
      : '';

  const recentTx = ownerTx.slice(0, 5);

  const txDate = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
      ? ''
      : `${d.getDate()} ${tr.product.months[d.getMonth()].toLowerCase()} ${d.getFullYear()}`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={pullRefreshing}
            onRefresh={() => {
              setPullRefreshing(true);
              refreshItems();
              refreshBookings();
              refreshEarnings();
              refreshTx();
            }}
            colors={[t.colors.primary]}
            tintColor={t.colors.primary}
          />
        }
      >
        {/* Greeting + notifications */}
        <View style={styles.header}>
          <View style={styles.greeting}>
            <Text style={styles.greetingLabel}>{tr.owner.greeting}</Text>
            <Text style={styles.greetingName} numberOfLines={3}>
              {profile?.full_name ?? ''}
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.bellButton, pressed && press.dim]}
            onPress={() => router.push('/notifications')}
          >
            <AppIcon name="bell" color={t.colors.text} size={24} />
            <View style={styles.bellDot} />
          </Pressable>
        </View>

        {/* KPI grid */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{tr.owner.kpiTotalEarnings}</Text>
            <Text style={[styles.kpiValue, { color: t.colors.primary }]}>
              {groupDigits(ownerEarnings)}
            </Text>
            <Text style={styles.kpiSub}>{tr.owner.kpiSum}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{tr.owner.kpiActiveListings}</Text>
            <Text style={styles.kpiValue}>{stats.activeListings}</Text>
            <Text style={styles.kpiSub}>{tr.owner.kpiItemsSuffix}</Text>
          </View>
        </View>
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{tr.owner.kpiTotalBookings}</Text>
            <Text style={styles.kpiValue}>{stats.totalBookings}</Text>
            <Text style={styles.kpiSub}>{tr.owner.kpiAllTime}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{tr.owner.kpiAvgDailyRate}</Text>
            <Text style={styles.kpiValue}>{groupDigits(stats.avgDailyRate)}</Text>
            <Text style={styles.kpiSub}>{tr.owner.kpiSum}</Text>
          </View>
        </View>

        {/* Earnings chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{tr.owner.earningsTitle}</Text>
          <Text style={styles.cardSubtitle}>{tr.owner.earningsSubtitle}</Text>
          <View
            style={styles.chart}
            onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
          >
            {chartWidth > 0 && (
              <Svg width={chartWidth} height={CHART_HEIGHT + 4}>
                {[0, 0.25, 0.5, 0.75, 1].map((f) => (
                  <Line
                    key={f}
                    x1={36}
                    x2={chartWidth}
                    y1={CHART_HEIGHT - (CHART_HEIGHT - 12) * f}
                    y2={CHART_HEIGHT - (CHART_HEIGHT - 12) * f}
                    stroke={t.colors.strokeLight}
                    strokeDasharray="4 4"
                  />
                ))}
                {area !== '' && <Path d={area} fill={t.green[60]} opacity={0.08} />}
                <Polyline
                  points={polyline}
                  fill="none"
                  stroke={t.green[60]}
                  strokeWidth={2}
                />
                {points.map((p, i) => (
                  <Circle key={i} cx={p.x} cy={p.y} r={3.5} fill={t.green[60]} />
                ))}
              </Svg>
            )}
            {/* Y-axis labels over the gridlines */}
            {[0, 0.5, 1].map((f) => (
              <Text
                key={f}
                style={[
                  styles.axisLabel,
                  styles.yLabel,
                  { top: CHART_HEIGHT - (CHART_HEIGHT - 12) * f - 8 },
                ]}
              >
                {shortSum(Math.round(chartMax * f))}
              </Text>
            ))}
          </View>
          <View style={styles.xLabels}>
            {chart.map((c, i) => (
              <Text key={i} style={styles.axisLabel}>
                {c.label}
              </Text>
            ))}
          </View>
        </View>

        {/* Transaction history */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{tr.owner.txTitle}</Text>
          <Text style={styles.cardSubtitle}>{tr.owner.txSubtitle}</Text>
          {recentTx.map((tx, i) => (
            <View key={tx.id}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.txRow}>
                <View style={styles.txLeft}>
                  <View style={styles.txBadge}>
                    <Text style={styles.txBadgeText}>
                      {tr.transactions.types[tx.transaction_type] ?? tr.transactions.types.unknown}
                    </Text>
                  </View>
                  <Text style={styles.txDesc} numberOfLines={1}>
                    {tx.description ?? tr.owner.txRentalDesc}
                  </Text>
                  <Text style={styles.txDate}>{txDate(tx.created_at ?? '')}</Text>
                </View>
                <Text style={[styles.txAmount, tx.amount < 0 && { color: t.colors.critical }]}>
                  {tx.amount >= 0 ? '+' : '−'}
                  {groupDigits(Math.abs(tx.amount))}
                </Text>
              </View>
            </View>
          ))}
          <Pressable
            style={({ pressed }) => [styles.viewAll, pressed && press.dim]}
            onPress={() => router.push('/settings/transactions?scope=owner')}
          >
            <Text style={styles.viewAllText}>{tr.owner.viewAll}</Text>
          </Pressable>
        </View>
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
    content: {
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
      paddingHorizontal: spacing.screenX,
      gap: spacing.md,
    },
    header: {
      flexDirection: 'row',
      // Top-aligned so the bell stays up when a long name wraps to 2–3 lines.
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    greeting: {
      flex: 1,
    },
    greetingLabel: {
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: 20,
      color: t.colors.textSecondary,
    },
    greetingName: {
      fontFamily: fonts.bold,
      fontSize: 24,
      lineHeight: 32,
      color: t.colors.text,
    },
    bellButton: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: t.colors.strokeLight,
      backgroundColor: t.colors.backgroundSecondary,
    },
    bellDot: {
      position: 'absolute',
      top: 12,
      right: 13,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: t.colors.orange,
      borderWidth: 1.5,
      borderColor: t.colors.backgroundSecondary,
    },
    kpiRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    kpiCard: {
      flex: 1,
      gap: 2,
      padding: spacing.lg,
      borderRadius: radius.base,
      borderWidth: 1,
      borderColor: t.colors.strokeLight,
      backgroundColor: t.colors.backgroundSecondary,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 2,
    },
    kpiLabel: {
      fontFamily: fonts.medium,
      fontSize: 13,
      lineHeight: 18,
      color: t.colors.textSecondary,
    },
    kpiValue: {
      fontFamily: fonts.bold,
      fontSize: 22,
      lineHeight: 30,
      color: t.colors.text,
    },
    kpiSub: {
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 16,
      color: t.colors.textMuted,
    },
    card: {
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
    cardTitle: {
      fontFamily: fonts.semiBold,
      fontSize: 18,
      lineHeight: 28,
      color: t.colors.text,
    },
    cardSubtitle: {
      fontFamily: fonts.regular,
      fontSize: 13,
      lineHeight: 18,
      color: t.colors.textSecondary,
      marginBottom: spacing.md,
    },
    chart: {
      height: CHART_HEIGHT + 4,
    },
    axisLabel: {
      fontFamily: fonts.regular,
      fontSize: 10,
      lineHeight: 14,
      color: t.colors.textMuted,
    },
    yLabel: {
      position: 'absolute',
      left: 0,
      width: 32,
    },
    xLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingLeft: 36,
      marginTop: spacing.xs,
    },
    divider: {
      height: 1,
      backgroundColor: t.colors.strokeLight,
    },
    txRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
    },
    txLeft: {
      flex: 1,
      gap: 2,
      alignItems: 'flex-start',
    },
    txBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.pill,
      backgroundColor: t.green[0],
    },
    txBadgeText: {
      fontFamily: fonts.medium,
      fontSize: 11,
      lineHeight: 16,
      color: t.green[70],
    },
    txDesc: {
      fontFamily: fonts.medium,
      fontSize: 14,
      lineHeight: 20,
      color: t.colors.text,
    },
    txDate: {
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 16,
      color: t.colors.textMuted,
    },
    txAmount: {
      fontFamily: fonts.semiBold,
      fontSize: 14,
      lineHeight: 20,
      color: t.green[60],
    },
    viewAll: {
      alignItems: 'center',
      paddingTop: spacing.md,
    },
    viewAllText: {
      fontFamily: fonts.semiBold,
      fontSize: 14,
      lineHeight: 20,
      color: t.colors.primary,
    },
  });
