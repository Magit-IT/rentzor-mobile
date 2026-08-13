/**
 * Which days an item can be booked. Mirrors rentzor-marketplace's
 * useItemAvailability: confirmed/pending bookings become occupied wall-clock
 * intervals (inflated by the turnover buffer in bookingTime), owner rows in
 * unavailable_dates block full days, and a day is "fully blocked" when every
 * hourly pickup slot on it is unavailable. Booking edge days (pickup/return)
 * stay selectable.
 */
import { useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { bookingToInterval, isDayFullyBlocked, WallInterval } from '../lib/bookingTime';

export interface ItemAvailability {
  occupiedIntervals: WallInterval[];
  manualBlockYmds: string[];
  /** Days to disable outright in the calendar, as "yyyy-MM-dd". */
  fullyBlockedYmds: Set<string>;
}

const EMPTY: ItemAvailability = {
  occupiedIntervals: [],
  manualBlockYmds: [],
  fullyBlockedYmds: new Set(),
};

export const ymdOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const parseYmd = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export function useItemAvailability(itemId: string | undefined) {
  const [availability, setAvailability] = useState<ItemAvailability>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!itemId) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const [bookingsRes, blockedRes] = await Promise.all([
          supabase
            .from('bookings')
            .select('start_date, end_date, pickup_time, dropoff_time, status')
            .eq('item_id', itemId)
            .in('status', ['confirmed', 'pending']),
          supabase
            .from('unavailable_dates')
            .select('unavailable_date')
            .eq('item_id', itemId),
        ]);
        if (bookingsRes.error) throw bookingsRes.error;
        if (blockedRes.error) throw blockedRes.error;

        const bookings = bookingsRes.data ?? [];
        const occupiedIntervals = bookings.map(bookingToInterval);
        const manualBlockYmds = (blockedRes.data ?? []).map((b) => b.unavailable_date);

        // Scan each booking's days ±1 (buffers can spill past midnight)
        // against the interval union, so adjacent bookings that jointly
        // cover a day are caught too.
        const fullyBlockedYmds = new Set(manualBlockYmds);
        for (const booking of bookings) {
          const day = parseYmd(booking.start_date);
          day.setDate(day.getDate() - 1);
          const last = parseYmd(booking.end_date);
          last.setDate(last.getDate() + 1);
          for (; day <= last; day.setDate(day.getDate() + 1)) {
            const ymd = ymdOf(day);
            if (!fullyBlockedYmds.has(ymd) && isDayFullyBlocked(ymd, occupiedIntervals)) {
              fullyBlockedYmds.add(ymd);
            }
          }
        }

        if (!cancelled) {
          setAvailability({ occupiedIntervals, manualBlockYmds, fullyBlockedYmds });
        }
      } catch {
        if (!cancelled) setAvailability(EMPTY);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [itemId]);

  return { availability, loading };
}
