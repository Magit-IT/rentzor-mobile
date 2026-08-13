/**
 * Listing photo upload for the owner "Yangi e'lon" wizard. Mirrors
 * rentzor-owner's useUploadItemImage: the file goes to the upload-image edge
 * function (multipart: file + type="items" + itemId), which verifies item
 * ownership and stores it in S3, returning the public URL. Writing the
 * item_images row is the caller's job.
 */
import { supabase } from '../integrations/supabase/client';
import { PickedPhoto } from './bookingPhotos';

export async function uploadItemPhoto(itemId: string, photo: PickedPhoto): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not signed in');

  const name = photo.fileName ?? photo.uri.split('?')[0].split('/').pop() ?? 'photo.jpg';

  const form = new FormData();
  // React Native's FormData takes {uri, name, type} file descriptors.
  form.append('file', {
    uri: photo.uri,
    name,
    type: photo.mimeType ?? 'image/jpeg',
  } as unknown as Blob);
  form.append('type', 'items');
  form.append('itemId', itemId);

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
