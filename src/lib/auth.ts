/**
 * Phone-based auth on top of the shared unified-auth backend (same
 * edge functions rentzor-marketplace uses): auth.users now carries phone
 * directly (phone_confirm'd via OTP at signup), so sign-in is a direct
 * signInWithPassword({ phone, password }) -- no more resolving phone to an
 * account email through a lookup table.
 *
 * Flow: phone.tsx calls checkPhoneExists(), which returns one of three
 * states:
 *   - no account -> requestPhoneOtp() then signup-details (registerUser)
 *   - account, phone confirmed -> password screen (signInWithPhone)
 *   - account, phone NOT confirmed (backfilled web accounts -- see
 *     vps/migrations/backfill_auth_users_phone.sql) -> requestPhoneOtp()
 *     then the password screen, but submitting there calls
 *     confirmPhoneWithOtp() instead of signInWithPhone(), since GoTrue
 *     rejects signInWithPassword on an unconfirmed phone (error code
 *     "phone_not_confirmed") regardless of password correctness.
 */
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';

export class AuthFunctionError extends Error {
  code: string;

  constructor(code: string) {
    super(code);
    this.name = 'AuthFunctionError';
    this.code = code;
  }
}

async function extractErrorCode(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (typeof body?.error === 'string') return body.error;
    } catch {
      // fall through
    }
  }
  return 'network';
}

function toFullPhone(phoneDigits: string): string {
  return `+998${phoneDigits}`;
}

async function adoptSession(session: unknown): Promise<void> {
  const s = session as { access_token?: string; refresh_token?: string } | null;
  if (!s?.access_token || !s?.refresh_token) throw new AuthFunctionError('internal_error');

  const { error } = await supabase.auth.setSession({
    access_token: s.access_token,
    refresh_token: s.refresh_token,
  });
  if (error) throw new AuthFunctionError('internal_error');
}

export type PhoneAccountStatus =
  | { exists: false }
  | { exists: true; confirmed: boolean };

/** `phoneDigits` = the 9 digits after +998, as collected by the phone screen. */
export async function checkPhoneExists(phoneDigits: string): Promise<PhoneAccountStatus> {
  const { data, error } = await supabase.functions.invoke('check-phone-exists', {
    body: { phone: toFullPhone(phoneDigits) },
  });
  if (error) throw new AuthFunctionError(await extractErrorCode(error));
  if (!data?.exists) return { exists: false };
  return { exists: true, confirmed: !!data.confirmed };
}

/** Sends (or resends) the signup OTP, for a phone with no account yet.
 * No email collected here -- that comes later, on signup-details. `lang`
 * picks the SMS template server-side (see LanguageContext's useLanguage()). */
export async function requestPhoneOtp(
  phoneDigits: string,
  lang: string,
): Promise<{ expiresAt: string | null }> {
  const { data, error } = await supabase.functions.invoke('request-phone-otp', {
    body: { phone: toFullPhone(phoneDigits), lang },
  });
  if (error) throw new AuthFunctionError(await extractErrorCode(error));
  return { expiresAt: data?.expires_at ?? null };
}

/** Read-only check of whether `otp` is currently correct for `phone`, for
 * showing red/green feedback on the OTP screen as the user types. Does NOT
 * consume the code or count as an attempt -- the real, authoritative check
 * still happens again wherever the code is actually submitted
 * (registerUser / confirmPhoneWithOtp / web's reset-password-with-otp). */
export async function verifyOtp(phoneDigits: string, otp: string): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke('verify-otp', {
    body: { phone: toFullPhone(phoneDigits), otp },
  });
  if (error) throw new AuthFunctionError(await extractErrorCode(error));
  return !!data?.valid;
}

/** Sends (or resends) an OTP for a phone that ALREADY has an account --
 * request-phone-otp rejects those (it's signup-only), so the confirm flow
 * (backfilled web accounts whose phone was never OTP-verified) reuses
 * request-reset-otp instead, same as web's password-reset flow does. */
export async function requestExistingPhoneOtp(
  phoneDigits: string,
  lang: string,
): Promise<{ expiresAt: string | null }> {
  const { data, error } = await supabase.functions.invoke('request-reset-otp', {
    body: { phone: toFullPhone(phoneDigits), lang },
  });
  if (error) throw new AuthFunctionError(await extractErrorCode(error));
  return { expiresAt: data?.expires_at ?? null };
}

/** Verifies the OTP, creates the account, and signs the client into the
 * returned session -- the caller doesn't need a separate sign-in step. */
export async function registerUser(params: {
  phoneDigits: string;
  otp: string;
  email: string;
  password: string;
}): Promise<void> {
  const { data, error } = await supabase.functions.invoke('register-user', {
    body: {
      phone: toFullPhone(params.phoneDigits),
      otp: params.otp,
      email: params.email,
      password: params.password,
    },
  });
  if (error) throw new AuthFunctionError(await extractErrorCode(error));
  await adoptSession(data?.session);
}

/** For an existing account whose phone was never OTP-confirmed (see
 * PhoneAccountStatus above): verifies the OTP, flips phone_confirm, and
 * signs in with the password the user already has. Throws
 * invalid_credentials (not a generic error) if that password is wrong --
 * the phone stays confirmed either way, so a retry needs no new OTP. */
export async function confirmPhoneWithOtp(params: {
  phoneDigits: string;
  otp: string;
  password: string;
}): Promise<void> {
  const { data, error } = await supabase.functions.invoke('confirm-phone-with-otp', {
    body: {
      phone: toFullPhone(params.phoneDigits),
      otp: params.otp,
      password: params.password,
    },
  });
  if (error) throw new AuthFunctionError(await extractErrorCode(error));
  await adoptSession(data?.session);
}

/** Password recovery: verifies the OTP (sent by requestExistingPhoneOtp,
 * same call as the confirm flow uses) and sets a NEW password, signing in
 * with it. Unlike confirmPhoneWithOtp, this changes the password rather
 * than confirming the phone with an existing one -- same backend function
 * web's password-reset flow uses (reset-password-with-otp). */
export async function resetPassword(params: {
  phoneDigits: string;
  otp: string;
  password: string;
}): Promise<void> {
  const { data, error } = await supabase.functions.invoke('reset-password-with-otp', {
    body: {
      phone: toFullPhone(params.phoneDigits),
      otp: params.otp,
      password: params.password,
    },
  });
  if (error) throw new AuthFunctionError(await extractErrorCode(error));
  await adoptSession(data?.session);
}

export type PhoneSignInError = 'invalid_credentials' | 'network';

/** `phoneDigits` = the 9 digits after +998, as collected by the phone screen.
 * GoTrue stores/matches phone as bare E.164 digits with no leading '+'
 * (confirmed against live data), unlike every other call in this file which
 * goes through our own edge functions and uses the '+998...' form. */
export async function signInWithPhone(
  phoneDigits: string,
  password: string,
): Promise<{ error: PhoneSignInError | null }> {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      phone: `998${phoneDigits}`,
      password,
    });
    if (error) {
      // GoTrue answers 400 for bad credentials; anything else is transport/server.
      return { error: error.status === 400 ? 'invalid_credentials' : 'network' };
    }
    return { error: null };
  } catch {
    return { error: 'network' };
  }
}

export const signOut = () => supabase.auth.signOut();
