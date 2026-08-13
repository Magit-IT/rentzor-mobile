/**
 * Figma: Owner — Profil (2142:9966) — user card with the owner-rating badge, the
 * gradient balance card (clone of the renter profile card, with a
 * "Yechib olish" button into the withdraw flow) and the menu list
 * (To'lovlar tarixi / Kartalarim / Nizolar / Sozlamalar), plus a
 * switch-back row to leave owner mode.
 */
import { StackActions } from '@react-navigation/native';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { AppIcon } from '../../../components/AppIcon';
import { BalancePattern } from '../../../components/BalancePattern';
import { Chevron } from '../../../components/icons';
import { ProductIcon } from '../../../components/ProductIcon';
import { useFlipTransition } from '../../../context/FlipTransitionContext';
import { useT } from '../../../context/LanguageContext';
import { useProfile } from '../../../context/ProfileContext';
import { useTheme, useThemedStyles } from '../../../context/ThemeContext';
import { useOwnerBalance } from '../../../hooks/useOwnerBalance';
import { formatPhoneNumber, formatSum } from '../../../lib/format';
import { fonts, palette, press, radius, spacing, Theme } from '../../../theme';

export default function OwnerProfileScreen() {
  const t = useTheme();
  const tr = useT();
  const styles = useThemedStyles(makeStyles);
  // The whole (owner) group is one pushed entry in the ROOT stack. router
  // APIs (back/dismissTo) resolve against the focused owner navigators and
  // either pop to the owner dashboard or get dropped, so dispatch popTo on
  // the root stack directly to leave owner mode.
  const rootNavigation = useNavigation('/');
  const router = useRouter();
  const flip = useFlipTransition();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  // Owner mode shows the owner's current funds (earnings minus withdrawals),
  // not the shared renter wallet — same number the withdraw screen shows.
  const { net: ownerFunds, refresh: refreshOwnerFunds } = useOwnerBalance();

  // Reflect a withdrawal immediately when returning from the withdraw flow.
  useFocusEffect(useCallback(() => refreshOwnerFunds(), [refreshOwnerFunds]));
  const [cardSize, setCardSize] = useState({ width: 0, height: 0 });

  const menuItems: {
    icon: React.ComponentProps<typeof AppIcon>['name'];
    label: string;
    route: string;
  }[] = [
    { icon: 'billList', label: tr.owner.menuTransactions, route: '/settings/transactions?scope=owner' },
    { icon: 'creditCard', label: tr.owner.menuCards, route: '/settings/my-cards' },
    { icon: 'ticket', label: tr.profile.promocodes, route: '/settings/promocodes' },
    { icon: 'settings', label: tr.owner.menuSettings, route: '/settings' },
    { icon: 'dangerTriangle', label: tr.owner.menuDisputes, route: '/settings/complaints' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{tr.owner.profileTitle}</Text>

        <View style={styles.userCard}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <AppIcon name="user" color={t.gray[60]} size={40} />
            </View>
          )}
          <View style={styles.userInfo}>
            <View>
              <Text style={styles.userName}>
                {profile?.full_name || tr.profile.anonymousUser}
              </Text>
              <Text style={styles.userPhone}>
                {profile?.phone ? formatPhoneNumber(profile.phone) : ''}
              </Text>
            </View>
            {/* Owner rating (e.g. ★ 4.5) instead of the MyID badge — owner
                mode is already MyID-gated, so the badge was redundant here. */}
            <View style={styles.ratingBadge}>
              <ProductIcon name="star" color={t.colors.warning} />
              <Text style={styles.ratingText}>{(profile?.rating ?? 0).toFixed(1)}</Text>
            </View>
          </View>
        </View>

        <View
          style={styles.balanceCard}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setCardSize({ width, height });
          }}
        >
          {cardSize.width > 0 && (
            <Svg
              width={cardSize.width}
              height={cardSize.height}
              style={styles.balanceGradient}
              pointerEvents="none"
            >
              <Defs>
                <LinearGradient id="ownerBalance" x1="0" y1="0.9" x2="1" y2="0.1">
                  <Stop offset="0.07" stopColor={palette.orange[70]} />
                  <Stop offset="1" stopColor={palette.orange[50]} />
                </LinearGradient>
              </Defs>
              <Rect
                x="0"
                y="0"
                width={cardSize.width}
                height={cardSize.height}
                fill="url(#ownerBalance)"
              />
            </Svg>
          )}
          <BalancePattern />
          {/* Figma 2188:10293 — "Hisobingizdagi mablag‘" (current funds). */}
          <Text style={styles.balanceLabel}>{tr.profile.balanceLabel}</Text>
          <Text style={styles.balanceAmount}>{formatSum(ownerFunds)}</Text>
          <View style={styles.balanceButtons}>
            <Pressable
              style={({ pressed }) => [styles.balanceButton, pressed && press.dim]}
              onPress={() => router.push('/(owner)/withdraw')}
            >
              {/* Red icon + label per Figma's withdraw button (293:10068). */}
              <AppIcon name="cardSend" color={t.colors.critical} size={20} />
              <Text style={styles.balanceButtonText}>{tr.profile.withdraw}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.menuCard}>
          {menuItems.map((item) => (
            <Pressable
              key={item.label}
              style={({ pressed }) => [styles.menuRow, pressed && styles.pressedSurface]}
              onPress={() => router.push(item.route)}
            >
              <AppIcon name={item.icon} color={t.colors.text} size={24} />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Chevron direction="right" size={24} color={t.colors.text} />
            </Pressable>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [styles.switchRow, pressed && styles.pressedSurface]}
          onPress={() =>
            // direction -1: unwinds the flip that entered owner mode.
            flip(
              () => rootNavigation.dispatch(StackActions.popTo('(tabs)', { screen: 'profile' })),
              -1,
            )
          }
        >
          <AppIcon name="logout" color={t.colors.primary} size={24} />
          <Text style={styles.switchLabel}>{tr.owner.switchToRenter}</Text>
        </Pressable>
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
    title: {
      fontFamily: fonts.bold,
      fontSize: 24,
      lineHeight: 32,
      color: t.colors.text,
    },
    userCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
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
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
    },
    avatarPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.gray[10],
    },
    userInfo: {
      flex: 1,
      gap: spacing.xs,
    },
    userName: {
      fontFamily: fonts.semiBold,
      fontSize: 16,
      lineHeight: 24,
      color: t.colors.text,
    },
    userPhone: {
      fontFamily: fonts.medium,
      fontSize: 14,
      lineHeight: 20,
      color: t.colors.textSecondary,
    },
    ratingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: t.orange[30],
      backgroundColor: t.orange[0],
    },
    ratingText: {
      fontFamily: fonts.semiBold,
      fontSize: 12,
      lineHeight: 16,
      color: t.colors.text,
    },
    balanceCard: {
      gap: 2,
      padding: spacing.lg,
      borderRadius: radius.lg,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.4)',
      backgroundColor: palette.orange[60],
      overflow: 'hidden',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 24,
      elevation: 2,
    },
    balanceGradient: {
      position: 'absolute',
      top: 0,
      left: 0,
    },
    balanceLabel: {
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: 20,
      color: palette.orange[10],
    },
    balanceAmount: {
      fontFamily: fonts.bold,
      fontSize: 26,
      lineHeight: 32,
      color: t.colors.textInverse,
    },
    balanceButtons: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.sm,
    },
    balanceButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.base,
      // Stays white on the brand-blue card in both schemes.
      backgroundColor: '#FFFFFF',
    },
    balanceButtonText: {
      fontFamily: fonts.semiBold,
      fontSize: 14,
      lineHeight: 20,
      color: t.colors.critical,
    },
    menuCard: {
      paddingVertical: spacing.xs,
      gap: 2,
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
    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: 10,
      borderRadius: radius.base,
    },
    menuLabel: {
      flex: 1,
      fontFamily: fonts.semiBold,
      fontSize: 16,
      lineHeight: 24,
      color: t.colors.text,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: t.blue[10],
      backgroundColor: t.colors.surfaceActive,
      marginTop : 10,
    },
    switchLabel: {
      fontFamily: fonts.semiBold,
      fontSize: 15,
      lineHeight: 22,
      color: t.colors.primary,
    },
    pressedSurface: { backgroundColor: t.colors.surface },
  });
