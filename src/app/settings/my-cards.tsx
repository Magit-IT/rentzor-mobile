/**
 * Figma: Settings / My cards (293:11430) — "Mening kartalarim" header with
 * back arrow, bordered rows per saved card (bank logo tile, masked number,
 * expiry, delete icon), followed by the "Karta qo'shish" row.
 *
 * Cards come from public.user_cards (written by the Paylov card flow);
 * deleting goes through the paylov-delete-card edge function so the card is
 * also detached on Paylov's side, mirroring rentzor-marketplace's CardItem.
 */
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BankLogo, ConfirmDialog, EmptyState, useToast } from '../../components';
import { Chevron, PlusIcon, TrashIcon } from '../../components/icons';
import { useT } from '../../context/LanguageContext';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { formatExpireDate, UserCard, useUserCards } from '../../hooks/useUserCards';
import { supabase } from '../../integrations/supabase/client';
import { fonts, press, radius, spacing, Theme } from '../../theme';

export default function MyCardsScreen() {
  const t = useTheme();
  const tr = useT();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { cards, loading, error, refresh } = useUserCards();
  const [pendingDelete, setPendingDelete] = useState<UserCard | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // A card confirmed in the add-card flow shows up on the way back.
  useFocusEffect(useCallback(() => refresh(), [refresh]));

  const confirmDelete = async () => {
    const card = pendingDelete;
    setPendingDelete(null);
    if (!card) return;

    setDeletingId(card.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('no session');
      const { error: fnError } = await supabase.functions.invoke('paylov-delete-card', {
        body: { paylovCardId: card.paylov_card_id },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (fnError) throw fnError;
      refresh();
    } catch {
      toast.error(tr.myCards.deleteFailed);
    } finally {
      setDeletingId(null);
    }
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
          <Text style={styles.headerTitle}>{tr.myCards.title}</Text>
        </View>
        <View style={styles.divider} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          !loading && !error && cards.length === 0 && styles.listEmpty,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={t.colors.primary} style={styles.loader} />
        ) : error ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>{tr.myCards.loadError}</Text>
            <Pressable
              onPress={refresh}
              style={({ pressed }) => [styles.retryButton, pressed && press.dim]}
            >
              <Text style={styles.retryText}>{tr.home.retry}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {cards.length === 0 && (
              <EmptyState
                image={require('../../assets/empty-states/no-cards.png')}
                title={tr.myCards.emptyTitle}
                subtitle={tr.myCards.emptySubtitle}
              />
            )}
            {cards.map((card) => (
              <View key={card.id} style={styles.card}>
                <BankLogo vendor={card.vendor} />
                <View style={styles.textBlock}>
                  <Text style={styles.number}>
                    •••• •••• •••• {card.masked_number.replace(/\s/g, '').slice(-4)}
                  </Text>
                  <Text style={styles.expiry}>{formatExpireDate(card.expire_date)}</Text>
                </View>
                {deletingId === card.id ? (
                  <ActivityIndicator color={t.colors.critical} size="small" />
                ) : (
                  <Pressable
                    hitSlop={8}
                    disabled={deletingId !== null}
                    onPress={() => setPendingDelete(card)}
                    style={({ pressed }) => pressed && press.dim}
                  >
                    <TrashIcon size={24} color={t.colors.critical} />
                  </Pressable>
                )}
              </View>
            ))}
          </>
        )}

        <Pressable
          onPress={() => router.push('/settings/add-card')}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        >
          <View style={styles.addIcon}>
            <PlusIcon size={20} color={t.colors.text} />
          </View>
          <Text style={styles.addLabel}>{tr.common.addCard}</Text>
        </Pressable>
      </ScrollView>

      <ConfirmDialog
        visible={pendingDelete !== null}
        title={tr.myCards.deleteTitle}
        message={tr.myCards.deleteMessage}
        cancelLabel={tr.common.cancel}
        confirmLabel={tr.myCards.deleteConfirm}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
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
  loader: {
    paddingVertical: spacing.xxl,
  },
  emptyBox: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.lg,
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
  cardPressed: { backgroundColor: t.gray[0] },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  number: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
    color: t.colors.text,
  },
  expiry: {
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
