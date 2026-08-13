/**
 * Booking status → tone/tab mapping. Mirrors rentzor-marketplace's
 * lib/statusStyles.ts (bookingStatusClasses) and Profile.tsx's
 * getDisplayStatus/getStatusPriority, so mobile groups and colors bookings
 * the same way the web app does.
 */
export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

/** A resolved dispute displays in place of the underlying booking status. */
export function displayStatus(status: string | null, disputeStatus: string | null): string {
  if (disputeStatus?.startsWith('resolved')) return 'dispute_resolved';
  return status ?? 'unknown';
}

export function statusTone(status: string): StatusTone {
  switch (status) {
    case 'overdue':
    case 'cancelled':
    case 'rejected':
      return 'danger';
    case 'confirmed':
    case 'in_progress':
    case 'returning':
    case 'dispute_resolved':
      return 'success';
    case 'pending':
    case 'pending_owner_confirmation':
    case 'disputed':
      return 'warning';
    case 'completed':
      return 'info';
    default:
      return 'neutral';
  }
}

/** Tab index (0 = All) a status belongs to, per the Figma pill set. */
export function tabForStatus(status: string): number {
  switch (status) {
    case 'pending':
    case 'pending_owner_confirmation':
      return 1;
    case 'confirmed':
      return 2;
    case 'in_progress':
    case 'returning':
    case 'overdue':
      return 3;
    default:
      return 0;
  }
}

/**
 * Statuses the renter_cancel_booking RPC accepts. Cancelling a confirmed
 * booking withholds 50% of the rental cost (handle_booking_cancellation
 * trigger pays it to the owner); cancelling a pending one is free.
 */
export const CANCELLABLE_STATUSES = new Set(['pending', 'confirmed']);

/** Statuses the renter_open_dispute RPC accepts (mirrors rentzor-marketplace). */
export const DISPUTABLE_STATUSES = new Set(['confirmed', 'in_progress', 'returning', 'overdue']);
