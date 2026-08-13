/**
 * Owner-mode bottom tabs — Figma owner Navigation bar (labels Asosiy /
 * Mahsulotlar / Buyurtmalar / Profil on the renter navbar icons, per the
 * as-built design). Same visual config as the renter (tabs) layout.
 */
import { Tabs } from 'expo-router';
import React from 'react';
import { NavIcon } from '../../../components/NavIcon';
import { useT } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import { fonts } from '../../../theme';

export default function OwnerTabsLayout() {
  const t = useTheme();
  const tr = useT();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.colors.primary,
        tabBarInactiveTintColor: t.colors.textMuted,
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 12 },
        tabBarStyle: {
          backgroundColor: t.colors.backgroundSecondary,
          borderTopColor: t.colors.strokeLight,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: tr.owner.tabs.home,
          tabBarIcon: ({ focused, color }) => (
            <NavIcon name="home" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: tr.owner.tabs.products,
          tabBarIcon: ({ focused, color }) => (
            <NavIcon name="saved" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: tr.owner.tabs.orders,
          tabBarIcon: ({ focused, color }) => (
            <NavIcon name="bookings" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: tr.owner.tabs.profile,
          tabBarIcon: ({ focused, color }) => (
            <NavIcon name="profile" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
