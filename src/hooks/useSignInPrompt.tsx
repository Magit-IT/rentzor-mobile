/**
 * Guest gate for account-only actions on public screens (see the guard
 * split in app/_layout.tsx). requireAuth(action) runs the action when a
 * session exists and opens a sign-in dialog for guests; render `prompt`
 * once in the screen tree so the dialog has a host. Confirming routes into
 * the (auth) flow, which lands on /(tabs)/home after login.
 */
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ConfirmDialog } from '../components';
import { useT } from '../context/LanguageContext';
import { useProfile } from '../context/ProfileContext';

export function useSignInPrompt() {
  const router = useRouter();
  const tr = useT();
  const { userId } = useProfile();
  const [visible, setVisible] = useState(false);
  const signedIn = !!userId;

  const requireAuth = useCallback(
    (action: () => void) => {
      if (signedIn) action();
      else setVisible(true);
    },
    [signedIn],
  );

  const prompt = (
    <ConfirmDialog
      visible={visible}
      title={tr.signInPrompt.title}
      message={tr.signInPrompt.message}
      cancelLabel={tr.signInPrompt.cancel}
      confirmLabel={tr.signInPrompt.signIn}
      confirmVariant="primary"
      onCancel={() => setVisible(false)}
      onConfirm={() => {
        setVisible(false);
        router.push('/(auth)/phone');
      }}
    />
  );

  return { signedIn, requireAuth, prompt };
}
