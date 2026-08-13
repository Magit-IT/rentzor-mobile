/**
 * Icon + tone per notification type. Mirrors web's getNotificationIcon
 * (green=success, red=danger, amber=warning), remapped onto the six glyphs
 * NotificationIcon actually has (box/alarm/cardSend/cardReceive/flag) —
 * mobile has no direct CheckCircle/XCircle/AlertCircle equivalents.
 */
import type { NotificationIconName } from '../components/NotificationIcon';

export type NotificationTone = 'success' | 'danger' | 'warning' | 'neutral';

export function notificationIcon(type: string): NotificationIconName {
  switch (type) {
    case 'balance_top_up':
      return 'cardReceive';
    case 'booking_completed':
    case 'overdue_fee_charged':
      return 'cardSend';
    case 'booking_overdue':
    case 'return_reminder':
      return 'alarm';
    case 'dispute_opened':
    case 'dispute_resolved':
      return 'flag';
    case 'booking_confirmed':
    case 'pickup_confirmed':
    case 'rental_started':
      return 'doubleCheck';
    default:
      return 'box';
  }
}

export function notificationTone(type: string): NotificationTone {
  switch (type) {
    case 'booking_confirmed':
    case 'pickup_confirmed':
    case 'booking_completed':
    case 'rental_started':
    case 'dispute_resolved':
    case 'balance_top_up':
      return 'success';
    case 'booking_rejected':
    case 'dispute_opened':
    case 'booking_overdue':
    case 'overdue_fee_charged':
      return 'danger';
    case 'booking_cancelled':
    case 'booking_auto_cancelled':
      return 'warning';
    default:
      return 'neutral';
  }
}
