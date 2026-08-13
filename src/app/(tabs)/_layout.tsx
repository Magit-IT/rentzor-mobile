import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { NavIcon } from '../../components/NavIcon';
import { useT } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { fonts } from '../../theme';

// Bottom tabs matching the design's Navigation bar (Figma 293:31923, dark
// 539:13886): 4 tabs — Asosiy, Saqlangan, Buyurtmalar, Profil. Search is
// not a tab; it opens from the Home search field.
export default function TabsLayout() {
  const t = useTheme();
  const tr = useT();
  return (
    <>
      <StatusBar style={t.scheme === 'dark' ? 'light' : 'dark'} />
      <Tabs
        screenOptions={{
          headerShown: false,
          animation: 'none',
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
          name="home"
          options={{
            title: tr.tabs.home,
            tabBarIcon: ({ focused, color }) => (
              <NavIcon name="home" focused={focused} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="saved"
          options={{
            title: tr.tabs.saved,
            tabBarIcon: ({ focused, color }) => (
              <NavIcon name="saved" focused={focused} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="bookings"
          options={{
            title: tr.tabs.bookings,
            tabBarIcon: ({ focused, color }) => (
              <NavIcon name="bookings" focused={focused} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: tr.tabs.profile,
            tabBarIcon: ({ focused, color }) => (
              <NavIcon name="profile" focused={focused} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
