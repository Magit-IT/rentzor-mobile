/**
 * Profile picture upload. Mirrors rentzor-marketplace's EditProfileTab:
 * same `avatars` bucket, same `{userId}/avatar.{ext}` path, same upsert, and
 * the same cache-busted public URL written back to profiles.avatar_url — so a
 * photo set on mobile shows up on the web app and vice versa.
 */
import { File } from 'expo-file-system';
import { supabase } from '../integrations/supabase/client';

/** Matches web's MAX_AVATAR_BYTES. */
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export type AvatarUploadError = 'too_large' | 'unsupported_type' | 'upload_failed';

const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
};

const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  webp: 'image/webp',
  jpg: 'image/jpeg',
};

/** Web derives the extension from the MIME type; some Android providers omit it. */
function extensionFor(mimeType: string | undefined, uri: string): string | null {
  if (mimeType) {
    const known = EXT_BY_MIME[mimeType.toLowerCase()];
    if (known) return known;
  }
  const suffix = uri.split('?')[0].split('.').pop()?.toLowerCase();
  if (suffix === 'png' || suffix === 'webp') return suffix;
  if (suffix === 'jpg' || suffix === 'jpeg') return 'jpg';
  return null;
}

/**
 * Uploads the picked image and returns the public URL to store on the profile.
 * Writing profiles.avatar_url is left to the caller, which also refreshes the
 * profile context.
 */
export async function uploadAvatar(
  userId: string,
  asset: { uri: string; mimeType?: string; fileSize?: number },
): Promise<{ url: string; error: null } | { url: null; error: AvatarUploadError }> {
  const ext = extensionFor(asset.mimeType, asset.uri);
  if (!ext) return { url: null, error: 'unsupported_type' };

  try {
    const file = new File(asset.uri);

    // fileSize is absent on some Android providers, so prefer the stat.
    const size = file.size ?? asset.fileSize;
    if (size !== null && size !== undefined && size > MAX_AVATAR_BYTES) {
      return { url: null, error: 'too_large' };
    }

    const path = `${userId}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, await file.bytes(), {
        upsert: true,
        contentType: MIME_BY_EXT[ext],
      });
    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(path);

    // The path is stable across uploads (upsert), so without a cache-buster the
    // old image keeps showing. Same approach as web.
    return { url: `${publicUrl}?t=${Date.now()}`, error: null };
  } catch (e) {
    console.error('Avatar upload failed:', e);
    return { url: null, error: 'upload_failed' };
  }
}
