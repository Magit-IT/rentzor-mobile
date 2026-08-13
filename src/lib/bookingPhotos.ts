/**
 * Booking condition-photo upload. Mirrors rentzor-marketplace's
 * PhotoUploadSection: each file goes to the upload-image edge function
 * (multipart: file + type="booking" + bookingId + subtype), which verifies
 * the caller is a party to the booking and stores the file under
 * booking-photos/{bookingId}/{subtype}/ in S3, returning the public URL.
 * Persisting the URL list onto the booking row is the caller's job via the
 * renter_update_booking_photos RPC.
 */
import { supabase } from '../integrations/supabase/client';

export interface PickedPhoto {
  uri: string;
  mimeType?: string;
  fileName?: string | null;
}

export async function uploadBookingPhoto(
  bookingId: string,
  subtype: 'pickup' | 'return',
  photo: PickedPhoto,
): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not signed in');

  const name =
    photo.fileName ?? photo.uri.split('?')[0].split('/').pop() ?? `${subtype}.jpg`;

  const form = new FormData();
  // React Native's FormData takes {uri, name, type} file descriptors.
  form.append('file', {
    uri: photo.uri,
    name,
    type: photo.mimeType ?? 'image/jpeg',
  } as unknown as Blob);
  form.append('type', 'booking');
  form.append('bookingId', bookingId);
  form.append('subtype', subtype);

  const res = await fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/upload-image`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    },
  );
  if (!res.ok) {
    throw new Error(`upload-image ${res.status}: ${await res.text()}`);
  }
  const { url } = (await res.json()) as { url: string };
  return url;
}
