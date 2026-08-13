import {
  Onest_400Regular,
  Onest_500Medium,
  Onest_600SemiBold,
  Onest_700Bold,
  Onest_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/onest';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { ToastProvider } from '../components/Toast';
import { BalanceProvider } from '../context/BalanceContext';
import { FavoritesProvider } from '../context/FavoritesContext';
import { FlipTransitionProvider } from '../context/FlipTransitionContext';
import { LanguageProvider } from '../context/LanguageContext';
import { LocationProvider } from '../context/LocationContext';
import { ProfileProvider, useProfile } from '../context/ProfileContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { initYamap } from '../lib/yamap';

// Yandex MapKit must be initialized before the first map renders
// (PickupZoneMap on the product screen). No-op in Expo Go, where the
// native module doesn't exist.
initYamap(process.env.EXPO_PUBLIC_YANDEX_MAPKIT_KEY);

// Hold the native splash while fonts load — RootLayout returns null in that
// window, which would otherwise flash a blank frame between the native
// splash and index.tsx's AnimatedLogo screen (both share the same
// background color, so the whole chain reads as one splash).
SplashScreen.preventAutoHideAsync().catch(() => {});

/** Status bar following the active theme; must render inside ThemeProvider. */
function ThemedStatusBar() {
  const t = useTheme();
  return <StatusBar style={t.scheme === 'dark' ? 'light' : 'dark'} />;
}

/**
 * Auth-gated navigation (per Expo Router's Stack.Protected pattern:
 * https://docs.expo.dev/router/advanced/protected/). The browsing surface
 * (tabs, category, product, search, location pickers) is public so guests
 * can explore the marketplace without an account -- App Store guideline
 * 5.1.1 forbids walling off non-account content behind registration. Only
 * screens that operate on the signed-in user's own data (settings, wallet,
 * bookings, owner mode, notifications) sit inside the signed-in guard, so
 * anything new under src/app that touches account data must be added to
 * that list. Guest taps on gated actions inside public screens go through
 * useSignInPrompt instead.
 *
 * signed out -> signed in: no special handling needed, the (auth) flow
 * itself navigates to /(tabs)/home on success.
 * signed in -> signed out (sign-out from settings): the guard flips to
 * false, which per Expo Router's docs removes every history entry for the
 * now-hidden screens -- this is what stops the back button/gesture from
 * revealing a protected screen (e.g. wallet settings) after sign-out, which
 * router.replace() alone does not prevent (it only swaps the top entry).
 */
function RootNavigator() {
  const { userId, loading } = useProfile();
  // While the initial session check is in flight, guard as "signed out" --
  // index.tsx (always accessible, listed outside any guard) owns showing
  // the splash screen during this window and only navigates into either
  // stack once the real session state is known, so this default is never
  // actually seen by the user.
  const signedIn = !loading && !!userId;

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(owner)" />
        <Stack.Screen name="settings/index" />
        <Stack.Screen name="settings/add-card" />
        <Stack.Screen name="settings/delete-account" />
        <Stack.Screen name="settings/card-otp" />
        <Stack.Screen name="settings/help" />
        <Stack.Screen name="settings/language" />
        <Stack.Screen name="settings/my-cards" />
        <Stack.Screen name="settings/transactions" />
        <Stack.Screen name="settings/complaints/index" />
        <Stack.Screen name="settings/complaints/[id]" />
        <Stack.Screen name="booking/[id]" />
        <Stack.Screen name="booking/payment" />
        <Stack.Screen name="booking/pickup-photos" />
        <Stack.Screen name="booking/top-up" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="profile-information" />
        <Stack.Screen name="telegram-connect" />
      </Stack.Protected>

      <Stack.Protected guard={!signedIn}>
        {/* (auth) has no _layout.tsx of its own, so expo-router doesn't
         * expose the group as a single addressable name here (confirmed by
         * a runtime "No route named (auth) exists" warning) -- each screen
         * inside it must be listed individually instead. */}
        <Stack.Screen name="(auth)/phone" />
        <Stack.Screen name="(auth)/otp" />
        <Stack.Screen name="(auth)/password" />
        <Stack.Screen name="(auth)/signup-details" />
        <Stack.Screen name="(auth)/reset-password" />
      </Stack.Protected>

      {/* Not gated: the splash screen owns routing once it knows the real
       * session state; onboarding is the pre-auth intro slideshow; the rest
       * is the public browsing surface. The bookings/profile tabs render
       * their own guest state, and item/[id] must stay public so universal
       * links (rentzor.uz/item/*) open for signed-out users. Location
       * screens are AsyncStorage-backed (LocationContext), no session
       * involved. */}
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="category/[slug]" />
      <Stack.Screen name="item/[id]" />
      <Stack.Screen name="product/[id]/index" />
      <Stack.Screen name="product/[id]/reviews" />
      <Stack.Screen name="search" />
      <Stack.Screen name="address-search" />
      <Stack.Screen name="edit-location" />
      <Stack.Screen name="location" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Onest_400Regular,
    Onest_500Medium,
    Onest_600SemiBold,
    Onest_700Bold,
    Onest_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <KeyboardProvider>
      <ThemeProvider>
        <LanguageProvider>
          <LocationProvider>
            <BalanceProvider>
              <ProfileProvider>
                <FavoritesProvider>
                  <ToastProvider>
                    <ThemedStatusBar />
                    <FlipTransitionProvider>
                      <RootNavigator />
                    </FlipTransitionProvider>
                  </ToastProvider>
                </FavoritesProvider>
              </ProfileProvider>
            </BalanceProvider>
          </LocationProvider>
        </LanguageProvider>
      </ThemeProvider>
    </KeyboardProvider>
  );
}
