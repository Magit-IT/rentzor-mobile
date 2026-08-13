/**
 * Resolves a notifications row + its `data` JSON into a localized
 * {title, message}, an optional in-app link, and structured detail rows.
 * Started as a mirror of rentzor-marketplace's NotificationsDropdown
 * (same per-type field extraction, same link targets adapted to mobile's
 * routes), but diverges in presentation: the web dropdown packs dates,
 * times, price and phone into one "·"-joined string, while mobile pulls
 * them out into label/value rows (notificationDetails) so the message
 * stays a short readable sentence. Falls back to the raw DB title/message
 * for any type without a template (e.g. one added on the backend before
 * mobile catches up).
 */
import type { Translations } from '../i18n';
import { formatUZS } from '../context/BalanceContext';
import type { Notification } from '../hooks/useNotifications';
import { formatPhoneNumber } from './format';

export function notificationLink(n: Notification): string | null {
  const data = n.data ?? {};
  const bookingId = data.booking_id as string | undefined;
  const itemId = (data.item_id as string | undefined) ?? (data.item_slug as string | undefined);

  switch (n.type) {
    case 'booking_confirmed':
    case 'booking_rejected':
    case 'booking_cancelled':
    case 'booking_auto_cancelled':
    case 'booking_completed':
    case 'rental_started':
    case 'pickup_confirmed':
    case 'return_reminder':
    case 'booking_overdue':
    case 'overdue_fee_charged':
    case 'dispute_opened':
    case 'dispute_resolved':
    case 'review_prompt':
      return bookingId ? `/booking/${bookingId}` : null;
    case 'balance_top_up':
      return '/settings/transactions';
    default:
      return itemId ? `/product/${itemId}` : null;
  }
}

export function translateNotification(
  n: Notification,
  tr: Translations,
): { title: string; message: string } {
  const data = (n.data ?? {}) as Record<string, unknown>;
  const str = (key: string) => (data[key] as string | undefined) ?? '';
  const num = (key: string) => (data[key] as number | undefined) ?? 0;

  const types = tr.notifications.types;
  const t = types[n.type as keyof typeof types] as
    | { title: string; message: (...args: string[]) => string }
    | undefined;

  if (!t) return { title: n.title, message: n.message };

  switch (n.type) {
    case 'booking_request':
    case 'item_approved':
    case 'item_rejected':
    case 'verify_return':
    case 'item_returning':
    case 'pickup_confirmed':
    case 'handover_pending':
    case 'booking_auto_cancelled':
    case 'booking_confirmed':
    case 'booking_rejected':
    case 'booking_cancelled':
    case 'booking_completed':
    case 'rental_started':
    case 'booking_overdue':
      return { title: t.title, message: t.message(str('item_title')) };

    case 'dispute_resolved': {
      const resolution = str('resolution'); // 'renter' | 'owner' | 'partial'
      const key = resolution === 'renter' ? 'resolved_renter'
        : resolution === 'owner' ? 'resolved_owner'
        : resolution === 'partial' ? 'resolved_partial'
        : null;
      const dr = tr.notifications.disputeResolvedMessage;
      return { title: t.title, message: key ? dr[key](str('item_title')) : dr.default };
    }

    case 'dispute_opened':
    case 'review_prompt':
      return { title: t.title, message: t.message() };

    case 'return_reminder':
      return { title: t.title, message: t.message(str('item_title'), str('dropoff_time')) };

    case 'new_review':
      return { title: t.title, message: t.message(str('reviewer_name'), String(num('rating'))) };

    case 'overdue_fee_charged':
      return { title: t.title, message: t.message(num('amount').toLocaleString(), String(num('days'))) };

    case 'balance_top_up':
      return { title: t.title, message: t.message(formatUZS(num('amount')).replace(' UZS', '')) };

    default:
      return { title: n.title, message: n.message };
  }
}

export type NotificationDetail = {
  label: string;
  value: string;
  /** Tints the value (price green, overdue/penalty red); default text color. */
  tone?: 'success' | 'critical';
};

/** '2026-08-02' -> '2 avgust' (month names from the active locale). */
function shortDate(iso: string, months: string[]): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const month = months[Number(m[2]) - 1];
  return month ? `${Number(m[3])} ${month.toLowerCase()}` : iso;
}

/**
 * The structured rows shown under the message: booking dates, pickup/return
 * times, price, owner phone — everything the old "·"-joined message strings
 * crammed into one paragraph.
 */
export function notificationDetails(n: Notification, tr: Translations): NotificationDetail[] {
  const data = (n.data ?? {}) as Record<string, unknown>;
  const str = (key: string) => (data[key] as string | undefined) ?? '';
  const num = (key: string) => (data[key] as number | undefined) ?? 0;

  const labels = tr.notifications.detailLabels;
  const months = tr.product.months;
  const date = (iso: string) => shortDate(iso, months);
  // Single-day bookings show one date, not "2 avgust – 2 avgust".
  const dateRange = (start: string, end: string) =>
    !start ? '' : !end || end === start ? date(start) : `${date(start)} – ${date(end)}`;
  const price = (amount: number): NotificationDetail => ({
    label: labels.price,
    value: `${amount.toLocaleString()} UZS`,
    tone: 'success',
  });

  const rows: (NotificationDetail | null)[] = [];
  const push = (label: string, value: string, tone?: NotificationDetail['tone']) =>
    rows.push(value ? { label, value, tone } : null);

  switch (n.type) {
    case 'booking_confirmed':
      push(labels.date, dateRange(str('start_date'), str('end_date')));
      push(labels.pickup, str('pickup_time'));
      push(labels.return, str('dropoff_time'));
      if (num('total_cost') > 0) rows.push(price(num('total_cost')));
      push(labels.owner, formatPhoneNumber(str('owner_phone')));
      break;

    case 'booking_rejected':
      push(labels.date, dateRange(str('start_date'), str('end_date')));
      break;

    case 'booking_cancelled':
      push(labels.date, dateRange(str('start_date'), str('end_date')));
      if (num('rental_cost') > 0) rows.push(price(num('rental_cost')));
      break;

    case 'booking_completed':
      if (num('rental_cost') > 0) rows.push(price(num('rental_cost')));
      break;

    case 'rental_started': {
      const end = str('end_date');
      const time = str('dropoff_time');
      push(labels.return, end ? `${date(end)}${time ? `, ${time}` : ''}` : time);
      push(labels.owner, formatPhoneNumber(str('owner_phone')));
      break;
    }

    case 'booking_overdue':
      push(labels.return, date(str('end_date')), 'critical');
      break;

    case 'dispute_resolved': {
      const compensation = num('admin_compensation');
      if (compensation > 0) {
        const reason = str('compensation_reason');
        push(
          labels.compensation,
          `${compensation.toLocaleString()} UZS${reason ? ` (${reason})` : ''}`,
          'critical',
        );
      }
      break;
    }
  }

  return rows.filter((row): row is NotificationDetail => row !== null);
}
