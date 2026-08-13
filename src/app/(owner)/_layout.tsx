/**
 * Owner mode — Figma "Owner App" section (2130:9561). Lives inside the same
 * app as the renter experience: the renter profile's "Buyumingizni ijaraga
 * bering" CTA pushes this group, and the owner profile's switch-back row
 * pops it. Stack wrapper so detail screens can sit above the owner tabs.
 */
import { Stack } from 'expo-router';
import React from 'react';

export default function OwnerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="new-listing" />
      <Stack.Screen name="withdraw" />
      <Stack.Screen name="pick-location" />
      <Stack.Screen name="product/[id]" />
      {/* "order", not "booking" — the renter app already owns /booking/[id]
          and expo-router strips group segments, so a (owner)/booking/[id]
          file would collide with it on the same URL. */}
      <Stack.Screen name="order/[id]" />
    </Stack>
  );
}
