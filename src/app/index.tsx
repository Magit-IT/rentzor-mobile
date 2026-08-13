import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import AnimatedLogo from '../components/AnimatedLogo';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../integrations/supabase/client';
import { hasSeenOnboarding } from '../lib/onboarding';

const SESSION_TIMEOUT_MS = 6000;

export default function SplashScreen() {
  const router = useRouter();
  const t = useTheme();

  const [animationDone, setAnimationDone] = useState(false);
  const [route, setRoute] = useState<'/(tabs)/home' | '/onboarding' | null>(null);
  const navigated = useRef(false);

  const handleFinish = useCallback(() => setAnimationDone(true), []);

  useEffect(() => {
    let cancelled = false;
    // Signed-in users (persisted session in SecureStore) and returning
    // guests skip straight to the app; only first launches see the intro
    // carousel — browsing no longer requires an account (guest mode).
    (async () => {
      let session = null;
      try {
        const { data } = (await Promise.race([
          supabase.auth.getSession(),
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: { session: null } }), SESSION_TIMEOUT_MS),
          ),
        ])) as Awaited<ReturnType<typeof supabase.auth.getSession>>;
        session = data.session;
      } catch {
        session = null;
      }
      if (cancelled) return;
      if (session) {
        setRoute('/(tabs)/home');
        return;
      }
      const seenOnboarding = await hasSeenOnboarding();
      if (cancelled) return;
      setRoute(seenOnboarding ? '/(tabs)/home' : '/onboarding');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!animationDone || !route || navigated.current) return;
    navigated.current = true;
    router.replace(route);
  }, [animationDone, route, router]);

  return (
    <View style={[styles.container, { backgroundColor: t.colors.background }]}>
      <StatusBar style={t.scheme === 'dark' ? 'light' : 'dark'} />
      <AnimatedLogo
        color={t.scheme === 'dark' ? '#FFFFFF' : '#161616'}
        width={280}
        onFinish={handleFinish}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
