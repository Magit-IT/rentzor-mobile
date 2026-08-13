/**
 * Mirrors rentzor-marketplace/src/lib/recordAcceptance.ts: logs the user's
 * contract acceptance by calling the generate-acceptance-pdf edge function,
 * which stores a terms_acceptances row and renders the signed PDF.
 * Fire-and-forget — a logging failure must never block the booking flow.
 */
import { Platform } from 'react-native';

export const recordAcceptance = (
  userId: string,
  documentType: string,
  bookingId?: string,
) =>
  fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/generate-acceptance-pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({
      user_id: userId,
      document_type: documentType,
      booking_id: bookingId ?? null,
      ip_address: '',
      user_agent: `rentzor-mobile/${Platform.OS}`,
    }),
  });
