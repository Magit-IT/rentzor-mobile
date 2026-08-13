/**
 * Figma: Owner — Buyurtmalar (2139:9749) — filter pills (Hammasi /
 * Kutilmoqda / Faol / Yakunlangan) and booking cards: item photo + title +
 * "Ijarachi: …" with a status chip, then a divider and the Sanalar /
 * Daromadingiz footer row.
 */
import React, { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, Tabs } from '../../../components';
import { AppIcon } from '../../../components/AppIcon';
import { useT } from '../../../context/LanguageContext';
import { useTheme, useThemedStyles } from '../../../context/ThemeContext';
import { useFocusEffect, useRouter } from 'expo-router';
import { OwnerOrderStatus, useOwnerBookings } from '../../../hooks/useOwnerBookings';
import { formatSum } from '../../../lib/format';
import { fonts, press, radius, spacing, Theme } from '../../../theme';

const FILTER_STATUSES: (OwnerOrderStatus | null)[] = [null, 'pending', 'active', 'completed'];

export default function OwnerOrdersScreen() {
  const t = useTheme();
  const tr = useT();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bookings, loading, refresh } = useOwnerBookings();
  const [tab, setTab] = useState(0);
  const [pullRefreshing, setPullRefreshing] = useState(false);

  React.useEffect(() => {
    if (!loading) setPullRefreshing(false);
  }, [loading]);

  // Re-fetch when the tab regains focus — statuses changed on the order
  // detail screen (confirm/reject/complete) must show up on return.
  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const visible = useMemo(() => {
    const status = FILTER_STATUSES[tab];
    return status ? bookings.filter((b) => b.display_status === status) : bookings;
  }, [bookings, tab]);

  const chipStyle = (status: OwnerOrderStatus) => {
    switch (status) {
      case 'active':
        return { bg: t.green[0], text: t.green[70] };
      case 'pending':
        return { bg: t.orange[0], text: t.orange[60] };
      case 'cancelled':
        return { bg: t.red[0], text: t.red[60] };
      default:
        return { bg: t.gray[10], text: t.colors.textSecondary };
    }
  };

  const day = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
      ? ''
      : `${d.getDate()} ${tr.product.months[d.getMonth()].toLowerCase()}`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>{tr.owner.orders}</Text>

      <Tabs
        tabs={[...tr.owner.orderFilters]}
        activeIndex={tab}
        onChange={setTab}
        style={styles.tabs}
        contentStyle={styles.tabsContent}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={pullRefreshing}
            onRefresh={() => {
              setPullRefreshing(true);
              refresh();
            }}
            colors={[t.colors.primary]}
            tintColor={t.colors.primary}
          />
        }
      >
        {!loading && visible.length === 0 ? (
          <EmptyState
            image={require('../../../assets/empty-states/no-bookings.png')}
            title={tr.owner.emptyOrdersTitle}
            subtitle={tr.owner.emptyOrdersSubtitle}
          />
        ) : (
          visible.map((booking) => {
            const chip = chipStyle(booking.display_status);
            return (
              <Pressable
                key={booking.id}
                style={({ pressed }) => [styles.card, pressed && press.dim]}
                onPress={() => router.push(`/(owner)/order/${booking.id}`)}
              >
                <View style={styles.cardTop}>
                  {booking.primary_image ? (
                    <Image source={{ uri: booking.primary_image }} style={styles.image} />
                  ) : (
                    <View style={[styles.image, styles.imagePlaceholder]}>
                      <AppIcon name="imagePlaceholder" color={t.gray[40]} size={24} />
                    </View>
                  )}
                  <View style={styles.cardInfo}>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {booking.item_title ?? ''}
                    </Text>
                    <Text style={styles.renter} numberOfLines={1}>
                      {tr.owner.renterPrefix}
                      {booking.renter_name ?? ''}
                    </Text>
                  </View>
                  <View style={[styles.statusChip, { backgroundColor: chip.bg }]}>
                    <Text style={[styles.statusChipText, { color: chip.text }]}>
                      {tr.owner.orderStatus[booking.display_status]}
                    </Text>
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.cardFooter}>
                  <View style={styles.footerCol}>
                    <Text style={styles.footerLabel}>{tr.owner.dates}</Text>
                    <Text style={styles.footerValue}>
                      {day(booking.start_date)} – {day(booking.end_date)}
                    </Text>
                  </View>
                  <View style={[styles.footerCol, styles.footerColRight]}>
                    <Text style={styles.footerLabel}>{tr.owner.yourEarnings}</Text>
                    <Text style={[styles.footerValue, styles.earnings]}>
                      {formatSum(booking.earnings)}
                    </Text>
                  </View>
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
    title: {
      fontFamily: fonts.bold,
      fontSize: 24,
      lineHeight: 32,
      color: t.colors.text,
      paddingHorizontal: spacing.screenX,
      paddingTop: spacing.md,
    },
    tabs: {
      marginTop: spacing.md,
    },
    tabsContent: {
      paddingHorizontal: spacing.screenX,
    },
    content: {
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
      paddingHorizontal: spacing.screenX,
      gap: spacing.md,
    },
    card: {
      padding: spacing.md,
      gap: spacing.md,
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
    cardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    image: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      backgroundColor: t.gray[10],
    },
    imagePlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardInfo: {
      flex: 1,
      gap: 2,
    },
    itemTitle: {
      fontFamily: fonts.semiBold,
      fontSize: 15,
      lineHeight: 22,
      color: t.colors.text,
    },
    renter: {
      fontFamily: fonts.regular,
      fontSize: 13,
      lineHeight: 18,
      color: t.colors.textSecondary,
    },
    statusChip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.pill,
    },
    statusChipText: {
      fontFamily: fonts.medium,
      fontSize: 12,
      lineHeight: 16,
    },
    divider: {
      height: 1,
      backgroundColor: t.colors.strokeLight,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    footerCol: {
      gap: 2,
    },
    footerColRight: {
      alignItems: 'flex-end',
    },
    footerLabel: {
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 16,
      color: t.colors.textMuted,
    },
    footerValue: {
      fontFamily: fonts.semiBold,
      fontSize: 14,
      lineHeight: 20,
      color: t.colors.text,
    },
    earnings: {
      color: t.green[60],
    },
  });
