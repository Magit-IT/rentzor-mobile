// Time-aware booking math. All values are Tashkent wall-clock "wall ms":
// Date.UTC(y, m-1, d, h) numbers used ONLY for same-frame differences and
// comparisons — they are NOT real UTC instants. Never mix them with
// Date.now(); lead-time checks against the real clock live in BookingForm
// (tashkentWallToUtcMs) and must stay there.

export const HOUR_MS = 3_600_000;
export const DAY_MS = 24 * HOUR_MS;

// Handover buffer around every existing booking: "return at 17:00 → next
// pickup from 20:00". Applied by inflating EXISTING intervals only, so the
// buffer counts exactly once between adjacent bookings.
export const TURNOVER_BUFFER_HOURS = 3;

// Minimum rental span for a new booking (pickup → return).
export const MIN_SPAN_HOURS = 3;

export interface WallInterval {
  start: number;
  end: number;
}

// "2026-07-03" + "09:00" -> wall ms.
export function wallMs(ymd: string, hhmm: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  const [h, min] = hhmm.split(":").map(Number);
  return Date.UTC(y, m - 1, d, h || 0, min || 0);
}

// Billable days are 24h periods, rounded up, never less than one full day.
export function billableDays(startMs: number, endMs: number): number {
  return Math.max(1, Math.ceil((endMs - startMs) / DAY_MS));
}

export function spanHours(startMs: number, endMs: number): number {
  return (endMs - startMs) / HOUR_MS;
}

export function inflate(iv: WallInterval, bufferHours: number): WallInterval {
  return {
    start: iv.start - bufferHours * HOUR_MS,
    end: iv.end + bufferHours * HOUR_MS,
  };
}

// Strict overlap: exact endpoint touching does NOT conflict, so a new pickup
// at exactly dropoff+buffer (or return at exactly pickup-buffer) is allowed.
export function intervalsOverlap(a: WallInterval, b: WallInterval): boolean {
  return a.start < b.end && b.start < a.end;
}

// Booking row -> raw occupied interval. Legacy rows with null/empty times
// occupy their full inclusive calendar days (start 00:00 → end date + 24h).
export function bookingToInterval(b: {
  start_date: string;
  end_date: string;
  pickup_time?: string | null;
  dropoff_time?: string | null;
}): WallInterval {
  const pickup = b.pickup_time || null;
  const dropoff = b.dropoff_time || null;
  return {
    start: wallMs(b.start_date, pickup || "00:00"),
    end: dropoff ? wallMs(b.end_date, dropoff) : wallMs(b.end_date, "00:00") + DAY_MS,
  };
}

// Point tests for the time dropdowns. rangeConflicts() below stays the
// authoritative check; these only pre-filter slots that can never work.
// Pickup: blocked on [inflated.start, inflated.end) — half-open right, so a
// pickup at exactly dropoff+buffer is allowed; a pickup at inflated.start is
// blocked because any positive span would then overlap.
export function isPickupInstantBlocked(ms: number, occupied: WallInterval[]): boolean {
  return occupied.some((iv) => {
    const infl = inflate(iv, TURNOVER_BUFFER_HOURS);
    return ms >= infl.start && ms < infl.end;
  });
}

// Return: blocked on (inflated.start, inflated.end] — half-open left, so a
// return at exactly pickup-buffer is allowed.
export function isDropoffInstantBlocked(ms: number, occupied: WallInterval[]): boolean {
  return occupied.some((iv) => {
    const infl = inflate(iv, TURNOVER_BUFFER_HOURS);
    return ms > infl.start && ms <= infl.end;
  });
}

// A calendar day is fully blocked when every hourly pickup slot is inside a
// buffer — it can't start a booking, and as a middle/end day of a range it
// would fail rangeConflicts anyway (the 00:00-exact-dropoff edge case is
// deliberately sacrificed for a simpler calendar).
export function isDayFullyBlocked(ymd: string, occupied: WallInterval[]): boolean {
  for (let h = 0; h < 24; h++) {
    if (!isPickupInstantBlocked(wallMs(ymd, `${String(h).padStart(2, "0")}:00`), occupied)) {
      return false;
    }
  }
  return true;
}

// Authoritative conflict check for a new [startMs, endMs] booking: existing
// bookings are inflated by the turnover buffer; manual owner blocks are full
// days with NO buffer (nothing to hand over).
export function rangeConflicts(
  startMs: number,
  endMs: number,
  occupied: WallInterval[],
  manualBlockYmds: string[]
): boolean {
  const next = { start: startMs, end: endMs };
  if (occupied.some((iv) => intervalsOverlap(next, inflate(iv, TURNOVER_BUFFER_HOURS)))) {
    return true;
  }
  return manualBlockYmds.some((ymd) => {
    const dayStart = wallMs(ymd, "00:00");
    return intervalsOverlap(next, { start: dayStart, end: dayStart + DAY_MS });
  });
}

// Earliest "HH:00" pickup slot on a day, or null if the day is fully blocked.
export function firstAvailablePickupSlot(ymd: string, occupied: WallInterval[]): string | null {
  for (let h = 0; h < 24; h++) {
    const slot = `${String(h).padStart(2, "0")}:00`;
    if (!isPickupInstantBlocked(wallMs(ymd, slot), occupied)) return slot;
  }
  return null;
}
