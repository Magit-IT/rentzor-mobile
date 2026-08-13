/**
 * Figma: Owner — Mahsulotlarim (2136:9649) — title with the "Yangi e'lon"
 * pill button, status filter pills and item rows (56pt photo, title,
 * price/day, status chip). Status grouping mirrors rentzor-owner's
 * MyItemsPage.getStatus().
 */
import { useFocusEffect, useRouter } from 'expo-router';
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
import { BottomSheet, Button, ConfirmDialog, EmptyState, Tabs } from '../../../components';
import { AppIcon } from '../../../components/AppIcon';
import { useToast } from '../../../components/Toast';
import { useT } from '../../../context/LanguageContext';
import { useTheme, useThemedStyles } from '../../../context/ThemeContext';
import { OwnerItem, OwnerItemStatus, useOwnerItems } from '../../../hooks/useOwnerItems';
import { supabase } from '../../../integrations/supabase/client';
import { formatDailyPrice } from '../../../lib/format';
import { fonts, press, radius, spacing, Theme } from '../../../theme';

const FILTER_STATUSES: (OwnerItemStatus | null)[] = [null, 'active', 'pending', 'draft', 'rejected'];

export default function OwnerProductsScreen() {
  const t = useTheme();
  const tr = useT();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { items, loading, refresh } = useOwnerItems();
  const [tab, setTab] = useState(0);
  const [pullRefreshing, setPullRefreshing] = useState(false);
  // Rejected-listing actions sheet (reason + edit/resubmit + delete).
  const [rejectedItem, setRejectedItem] = useState<OwnerItem | null>(null);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const deleteRejected = async () => {
    if (!rejectedItem || deleting) return;
    setDeleting(true);
    try {
      await supabase.from('item_images').delete().eq('item_id', rejectedItem.id);
      // .select() verifies a row was actually removed — RLS-blocked deletes
      // return success with zero rows otherwise.
      const { data: deleted, error } = await supabase
        .from('items')
        .delete()
        .eq('id', rejectedItem.id)
        .select('id');
      if (error || !deleted?.length) throw error ?? new Error('delete blocked');
      toast.success(tr.owner.deletedToast);
      setDeleteVisible(false);
      setRejectedItem(null);
      refresh();
    } catch {
      toast.error(tr.owner.wizard.submitError);
    } finally {
      setDeleting(false);
    }
  };

  React.useEffect(() => {
    if (!loading) setPullRefreshing(false);
  }, [loading]);

  // Re-fetch when the tab regains focus (e.g. after the listing wizard).
  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const visible = useMemo(() => {
    const status = FILTER_STATUSES[tab];
    return status ? items.filter((i) => i.display_status === status) : items;
  }, [items, tab]);

  const chipStyle = (status: OwnerItemStatus) => {
    switch (status) {
      case 'active':
        return { bg: t.green[0], text: t.green[70] };
      case 'pending':
        return { bg: t.orange[0], text: t.orange[60] };
      case 'rejected':
        return { bg: t.red[0], text: t.red[60] };
      default:
        return { bg: t.gray[10], text: t.colors.textSecondary };
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{tr.owner.myProducts}</Text>
        <Pressable
          style={({ pressed }) => [styles.newButton, pressed && press.dim]}
          onPress={() => router.push('/(owner)/new-listing')}
        >
          <AppIcon name="plus" color="#FFFFFF" size={16} />
          <Text style={styles.newButtonText}>{tr.owner.newListing}</Text>
        </Pressable>
      </View>

      <Tabs
        tabs={[...tr.owner.productFilters]}
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
            title={tr.owner.emptyProductsTitle}
            subtitle={tr.owner.emptyProductsSubtitle}
          />
        ) : (
          visible.map((item) => {
            const chip = chipStyle(item.display_status);
            return (
              <Pressable
                key={item.id}
                style={({ pressed }) => [styles.itemCard, pressed && press.dim]}
                // Drafts re-open the wizard; rejected items open the
                // edit-or-delete sheet; the rest open the detail screen.
                onPress={() => {
                  if (item.display_status === 'rejected') setRejectedItem(item);
                  else if (item.display_status === 'draft')
                    router.push(`/(owner)/new-listing?draftId=${item.id}`);
                  else router.push(`/(owner)/product/${item.id}`);
                }}
              >
                {item.primary_image ? (
                  <Image source={{ uri: item.primary_image }} style={styles.itemImage} />
                ) : (
                  <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                    <AppIcon name="imagePlaceholder" color={t.gray[40]} size={28} />
                  </View>
                )}
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.itemPrice}>{formatDailyPrice(item.price_per_day)}</Text>
                  <View style={[styles.statusChip, { backgroundColor: chip.bg }]}>
                    <Text style={[styles.statusChipText, { color: chip.text }]}>
                      {tr.owner.productStatus[item.display_status]}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* Rejected listing: show the reason, let the owner fix & resubmit or delete. */}
      <BottomSheet
        visible={rejectedItem !== null && !deleteVisible}
        onClose={() => setRejectedItem(null)}
        title={tr.owner.rejectedSheetTitle}
      >
        <View style={styles.rejectedBody}>
          <Text style={styles.rejectedItemTitle}>{rejectedItem?.title}</Text>
          {!!rejectedItem?.rejection_reason && (
            <View style={styles.reasonCard}>
              <Text style={styles.reasonLabel}>{tr.owner.rejectionReasonLabel}</Text>
              <Text style={styles.reasonText}>{rejectedItem.rejection_reason}</Text>
            </View>
          )}
          <Button
            title={tr.owner.editResubmit}
            fullWidth
            onPress={() => {
              const id = rejectedItem?.id;
              setRejectedItem(null);
              if (id) router.push(`/(owner)/new-listing?draftId=${id}`);
            }}
          />
          <Button
            title={tr.owner.deleteListing}
            variant="critical"
            fullWidth
            onPress={() => setDeleteVisible(true)}
          />
        </View>
      </BottomSheet>

      <ConfirmDialog
        visible={deleteVisible}
        title={tr.owner.deleteListing}
        message={tr.owner.deleteConfirmMessage}
        cancelLabel={tr.common.cancel}
        confirmLabel={tr.owner.deleteShort}
        onCancel={() => setDeleteVisible(false)}
        onConfirm={deleteRejected}
      />
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingHorizontal: spacing.screenX,
      paddingTop: spacing.md,
    },
    title: {
      fontFamily: fonts.bold,
      fontSize: 24,
      lineHeight: 32,
      color: t.colors.text,
    },
    newButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm + 2,
      borderRadius: radius.pill,
      backgroundColor: t.colors.primary,
    },
    newButtonText: {
      fontFamily: fonts.semiBold,
      fontSize: 14,
      lineHeight: 20,
      color: '#FFFFFF',
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
    itemCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
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
    itemImage: {
      width: 56,
      height: 56,
      borderRadius: radius.md,
      backgroundColor: t.gray[10],
    },
    itemImagePlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemInfo: {
      flex: 1,
      gap: spacing.xs,
      alignItems: 'flex-start',
    },
    itemTitle: {
      fontFamily: fonts.semiBold,
      fontSize: 16,
      lineHeight: 22,
      color: t.colors.text,
    },
    itemPrice: {
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
    rejectedBody: {
      gap: spacing.md,
      paddingBottom: spacing.lg,
    },
    rejectedItemTitle: {
      fontFamily: fonts.semiBold,
      fontSize: 16,
      lineHeight: 24,
      color: t.colors.text,
    },
    reasonCard: {
      gap: spacing.xs,
      padding: spacing.lg,
      borderRadius: radius.md,
      backgroundColor: t.red[0],
    },
    reasonLabel: {
      fontFamily: fonts.semiBold,
      fontSize: 13,
      lineHeight: 18,
      color: t.red[60],
    },
    reasonText: {
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: 20,
      color: t.colors.text,
    },
  });
