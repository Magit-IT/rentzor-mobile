/**
 * Notifications for the "Bildirishnomalar" screen and the home bell badge.
 * Mirrors rentzor-marketplace's useNotifications: own rows, newest first,
 * capped at 20, realtime INSERT subscription, mark-read/mark-all-read.
 *
 * Mobile is the renter-facing app (same as rz1), so owner-only notification
 * types are filtered out — same list as web's OWNER_ONLY_TYPES, kept in sync.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useProfile } from '../context/ProfileContext';
import { supabase } from '../integrations/supabase/client';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean | null;
  data: Record<string, unknown> | null;
  created_at: string | null;
}

const OWNER_ONLY_TYPES = new Set([
  'booking_request',
  'item_approved',
  'item_rejected',
  'verify_return',
  'handover_pending',
  'handover_pending_owner',
  'new_review',
  'earning_credited',
  'booking_auto_started',
  'booking_auto_completed',
  'rental_overdue',
  'item_returning',
  'item_returning_owner',
  'owner_payout',
  'deposit_released',
  'earning_pending',
  'dispute_opened_owner',
  'rental_started_owner',
  'booking_completed_owner',
  'booking_cancelled_owner',
  'dispute_resolved_owner',
  'booking_confirmed_owner',
  'return_reminder_owner',
]);

let instanceCounter = 0;

export function useNotifications() {
  const { userId } = useProfile();
  // Two consumers can be mounted at once (e.g. the home tab stays mounted
  // under a pushed notifications screen), so the channel name must be unique
  // per hook instance, not just per user.
  const instanceId = useRef(++instanceCounter).current;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const refresh = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const { data, error: dbError } = await supabase
          .from('notifications')
          .select('id, type, title, message, read, data, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20);
        if (dbError) throw dbError;
        if (!cancelled) {
          const rows = ((data ?? []) as Notification[]).filter((n) => !OWNER_ONLY_TYPES.has(n.type));
          setNotifications(rows);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, attempt]);

  // New rows (bot/backend-driven) show up without a manual refresh.
  useEffect(() => {
    if (!userId) return;
    // Channel names must be unique per subscription — a shared literal name
    // throws "cannot add postgres_changes callbacks ... after subscribe()"
    // if two channels of that name coexist even briefly (Fast Refresh,
    // StrictMode double-invoke, or two mounted consumers — e.g. the home tab
    // stays mounted under a pushed notifications screen).
    const channel = supabase
      .channel(`notifications-realtime-${userId}-${instanceId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refresh]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
  }, [userId]);

  return { notifications, unreadCount, loading, error, refresh, markAsRead, markAllAsRead };
}
