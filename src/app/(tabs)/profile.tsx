/**
 * Figma: Profile (with refound money) (293:11338) — user card with the
 * "My ID tasdiqlangan" badge, gradient balance card with the top-up action
 * (withdraw removed per design), and the settings menu list.
 *
 * Unverified state — Figma: Profile (293:11562) — gray anonymous avatar,
 * "Anonim foydalanuvchi", orange "My ID tasdiqlanmagan" badge and no
 * balance card. Shown until the MyID verification flow is implemented.
 */
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { ActionBar, BalancePattern, BottomSheet, Button, MyIdLogo } from '../../components';
import { AppIcon } from '../../components/AppIcon';
import { Chevron } from '../../components/icons';
import { useToast } from '../../components/Toast';
import { useFlipTransition } from '../../context/FlipTransitionContext';
import { useLanguage } from '../../context/LanguageContext';
import { useProfile } from '../../context/ProfileContext';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { useOwnerBalance } from '../../hooks/useOwnerBalance';
import { useUserCards } from '../../hooks/useUserCards';
import { formatPhoneNumber, formatSum } from '../../lib/format';
import { getMyIdError, verifyIdentity } from '../../lib/myid';
import { fonts, palette, press, radius, spacing, Theme } from '../../theme';

const MENU_ITEMS: {
  icon: React.ComponentProps<typeof AppIcon>['name'];
  labelKey: 'personalInfo' | 'paymentHistory' | 'myCards' | 'promocodes' | 'settings' | 'helpCenter' | 'complaints';
  route?: string;
}[] = [
  { icon: 'userCircle', labelKey: 'personalInfo', route: '/profile-information' },
  { icon: 'billList', labelKey: 'paymentHistory', route: '/settings/transactions' },
  { icon: 'creditCard', labelKey: 'myCards', route: '/settings/my-cards' },
  { icon: 'ticket', labelKey: 'promocodes', route: '/settings/promocodes' },
  { icon: 'settings', labelKey: 'settings', route: '/settings' },
  { icon: 'help', labelKey: 'helpCenter', route: '/settings/help' },
  { icon: 'dangerTriangle', labelKey: 'complaints', route: '/settings/complaints' },
];

export default function ProfileScreen() {
  const t = useTheme();
  const { t: tr, language } = useLanguage();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const flip = useFlipTransition();
  const insets = useSafeAreaInsets();
  const { userId, profile, myIdVerified, loading, refresh } = useProfile();
  // profiles.balance is the single shared wallet; owner mode displays the
  // owner-side ledger total separately (useOwnerBalance), so the renter card
  // shows the remainder — the renter's own money (top-ups minus rental
  // spending), not owner earnings sitting in the same wallet.
  // Net (earnings minus withdrawals): an owner withdrawal debits the shared
  // wallet and the owner side equally, leaving the renter figure unchanged.
  const { net: ownerFunds, refresh: refreshOwnerEarnings } = useOwnerBalance();
  const renterBalance = Math.max(0, (profile?.balance ?? 0) - ownerFunds);
  const { cards, loading: cardsLoading } = useUserCards();
  const toast = useToast();
  // Measured balance-card size; the gradient Svg needs explicit dimensions —
  // absoluteFill/percentage sizing renders at the wrong size on Android.
  const [cardSize, setCardSize] = useState({ width: 0, height: 0 });
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const [myIdSheetVisible, setMyIdSheetVisible] = useState(false);
  const [verifyingId, setVerifyingId] = useState(false);

  // Same MyID SDK flow as the product page's booking gate.
  const startIdVerification = async () => {
    setVerifyingId(true);
    try {
      const result = await verifyIdentity();
      if (result.status === 'success') {
        await refresh();
        setMyIdSheetVisible(false);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'userExited') {
        // User closed the SDK flow on their own; nothing to report.
        return;
      }
      toast.error(getMyIdError(err, language));
    } finally {
      setVerifyingId(false);
    }
  };

  // Pull-to-refresh: drop the spinner once the re-fetch lands.
  useEffect(() => {
    if (!loading) setPullRefreshing(false);
  }, [loading]);

  // Guest state (see the guard split in app/_layout.tsx): everything on
  // this tab is account data, so signed-out browsers get a sign-in CTA
  // in place of the profile card, balance and menu.
  if (!userId) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.content}>
          <Text style={styles.title}>{tr.profile.title}</Text>
        </View>
        <View style={styles.guestContainer}>
          <View style={[styles.guestAvatar, styles.avatarPlaceholder]}>
            <AppIcon name="user" color={t.gray[60]} size={48} />
          </View>
          <Text style={styles.guestTitle}>{tr.signInPrompt.profileTitle}</Text>
          <Text style={styles.guestSubtitle}>{tr.signInPrompt.profileSubtitle}</Text>
        </View>
        <View style={[styles.guestCta, { bottom: insets.bottom + spacing.lg }]}>
          <Button
            title={tr.signInPrompt.signIn}
            onPress={() => router.push('/(auth)/phone')}
            fullWidth
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Sized to fit without scrolling on typical screens — the ScrollView
          shell stays only for pull-to-refresh and as a clip guard on very
          short displays. */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={pullRefreshing}
            onRefresh={() => {
              setPullRefreshing(true);
              refreshOwnerEarnings();
              refresh();
            }}
            colors={[t.colors.primary]}
            tintColor={t.colors.primary}
          />
        }
      >
        {/* Same page title as the owner profile (tr.owner.profileTitle). */}
        <Text style={styles.title}>{tr.profile.title}</Text>

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
            {myIdVerified ? (
              <View style={styles.idBadge}>
                <AppIcon name="shieldCheck" color={t.blue[70]} size={16} />
                <Text style={styles.idBadgeText}>{tr.profile.myIdVerified}</Text>
              </View>
            ) : (
              <View style={[styles.idBadge, styles.idBadgeWarning]}>
                <AppIcon name="shieldWarning" color={t.orange[50]} size={16} />
                <Text style={[styles.idBadgeText, styles.idBadgeWarningText]}>
                  {tr.profile.myIdNotVerified}
                </Text>
              </View>
            )}
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
                {/* 68.7° gradient, primary-70 → primary-40 (stop extrapolated to 100%). */}
                <LinearGradient id="balance" x1="0" y1="0.9" x2="1" y2="0.1">
                  <Stop offset="0.07" stopColor={palette.primary[70]} />
                  <Stop offset="1" stopColor="#5090F2" />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width={cardSize.width} height={cardSize.height} fill="url(#balance)" />
            </Svg>
          )}
          <BalancePattern />
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>{tr.profile.balanceLabel}</Text>
            <Text style={styles.balanceAmount}>{formatSum(renterBalance)}</Text>
          </View>
          <View style={styles.balanceButtons}>
            <Pressable
              style={({ pressed }) => [styles.balanceButton, pressed && press.dim]}
              onPress={() => {
                // Top-up charges a linked Paylov card — without one the
                // top-up screen is a dead end, so explain instead.
                if (!cardsLoading && cards.length === 0) {
                  toast.error(tr.profile.linkCardFirst);
                  return;
                }
                router.push('/booking/top-up');
              }}
            >
              <AppIcon name="cardReceive" color={t.colors.primary} size={20} />
              <Text style={[styles.balanceButtonText, { color: t.colors.primary }]}>
                {tr.profile.topUp}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item) => (
            <Pressable
              key={item.labelKey}
              style={({ pressed }) => [styles.menuRow, pressed && styles.pressedSurface]}
              onPress={() => item.route && router.push(item.route)}
            >
              <AppIcon name={item.icon} color={t.colors.text} size={24} />
              <Text style={styles.menuLabel}>{tr.profile[item.labelKey]}</Text>
              <Chevron direction="right" size={24} color={t.colors.text} />
            </Pressable>
          ))}
        </View>

        {/* Figma: Become Owner CTA (2267:10425) — opens the owner web app. */}
        <Pressable
          style={({ pressed }) => [styles.ownerCta, pressed && press.dim]}
          onPress={() => {
            if (!myIdVerified) {
              setMyIdSheetVisible(true);
              return;
            }
            // Card-flip into owner mode (the push itself is instant —
            // the root stack navigates with animation:'none').
            flip(() => router.push('/(owner)/dashboard'));
          }}
        >
          <View style={styles.ownerCtaBadge}>
            <Svg width={44} height={44} style={StyleSheet.absoluteFill} pointerEvents="none">
              <Defs>
                {/* 45° badge gradient, primary-70 → primary-40. */}
                <LinearGradient id="ownerBadge" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor={palette.primary[70]} />
                  <Stop offset="1" stopColor={palette.primary[40]} />
                </LinearGradient>
              </Defs>
              <Rect width="44" height="44" rx="16" fill="url(#ownerBadge)" />
            </Svg>
            <AppIcon name="box" color="#FFFFFF" size={24} />
          </View>
          <View style={styles.ownerCtaText}>
            <Text style={styles.ownerCtaTitle}>{tr.profile.ownerCtaTitle}</Text>
            <Text style={styles.ownerCtaSubtitle}>{tr.profile.ownerCtaSubtitle}</Text>
          </View>
          <Chevron direction="right" size={20} color={t.blue[70]} />
        </Pressable>
      </ScrollView>

      {/* Figma: My ID drawer (293:11841) — renting out requires MyID verification. */}
      <BottomSheet
        visible={myIdSheetVisible}
        onClose={() => setMyIdSheetVisible(false)}
        title={tr.product.myIdSheetTitle}
        footer={
          <ActionBar>
            <Button
              title={tr.product.myIdVerify}
              loading={verifyingId}
              onPress={startIdVerification}
            />
          </ActionBar>
        }
      >
        <View style={styles.myIdSheetBody}>
          <View style={styles.myIdLogoTile}>
            <MyIdLogo width={63} />
          </View>
          <Text style={styles.myIdSheetText}>{tr.product.myIdSheetBody}</Text>
        </View>
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
  content: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.screenX,
    gap: spacing.sm,
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
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screenX,
    gap: spacing.xs,
  },
  guestAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: spacing.md,
  },
  guestTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
    lineHeight: 28,
    color: t.colors.text,
    textAlign: 'center',
  },
  guestSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: t.colors.textMuted,
    textAlign: 'center',
  },
  guestCta: {
    position: 'absolute',
    left: spacing.screenX,
    right: spacing.screenX,
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
  idBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: t.blue[30],
    backgroundColor: t.blue[0],
  },
  idBadgeText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: t.blue[70],
  },
  idBadgeWarning: {
    borderColor: t.orange[30],
    backgroundColor: t.orange[0],
  },
  idBadgeWarningText: {
    color: t.orange[50],
  },
  balanceCard: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    // Solid fallback so Android's elevation shadow never shows a gray box
    // behind the gradient (elevation needs an opaque background).
    backgroundColor: palette.primary[60],
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
  balanceInfo: {
    gap: 2,
  },
  balanceLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: palette.primary[10],
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
  },
  menuCard: {
    paddingVertical: spacing.xs,
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
    paddingVertical: 7,
    borderRadius: radius.base,
  },
  menuLabel: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
    color: t.colors.text,
  },
  pressedSurface: { backgroundColor: t.colors.surface },
  ownerCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 10,
    paddingLeft: 14,
    paddingRight: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: t.blue[10],
    backgroundColor: t.colors.surfaceActive,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 2,
    marginTop : 10
  },
  ownerCtaBadge: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerCtaText: {
    flex: 1,
    gap: 2,
  },
  ownerCtaTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 22,
    color: t.colors.text,
  },
  ownerCtaSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: t.colors.textSecondary,
  },
  myIdSheetBody: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  myIdLogoTile: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: t.violet[0],
  },
  myIdSheetText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: t.colors.text,
  },
});
