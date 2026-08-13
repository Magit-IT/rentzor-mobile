/**
 * MyID "New Flow" native SDK client. Two steps: myid-sdk-start-session
 * creates a session_id server-to-server (client_secret never reaches the
 * device), then the native MyIdModule launches the in-app capture screen
 * with that session_id. On success the SDK returns a one-time `code`,
 * which myid-sdk-verify exchanges for the user's profile and writes to
 * myid_verifications/profiles — mirroring the web redirect flow's
 * myid-start-session/myid-callback pair against the same tables.
 */
import { NativeEventEmitter, NativeModules } from 'react-native';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';

const { MyIdModule } = NativeModules;

export class MyIdError extends Error {
  responseBody: Record<string, unknown>;

  constructor(responseBody: Record<string, unknown>) {
    super(String(responseBody?.error || 'server_error'));
    this.name = 'MyIdError';
    this.responseBody = responseBody;
  }
}

async function invokeMyId<T>(name: string, body: object): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new MyIdError({ error: 'server_error' });

  const { data, error } = await supabase.functions.invoke(name, {
    body,
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error) {
    let errorBody: Record<string, unknown> = {};
    if (error instanceof FunctionsHttpError) {
      try {
        errorBody = await error.context.json();
      } catch {
        // Non-JSON error body; fall through to server_error.
      }
    }
    throw new MyIdError(errorBody);
  }
  return data as T;
}

const startSession = () => invokeMyId<{ session_id: string }>('myid-sdk-start-session', {});

const verifySession = (params: { code: string; sessionId: string }) =>
  invokeMyId<{ status: string; verified: boolean; first_name?: string; last_name?: string }>(
    'myid-sdk-verify',
    { code: params.code, session_id: params.sessionId },
  );

export interface MyIdSuccessEvent {
  code: string;
  image: string | null;
}

export interface MyIdErrorEvent {
  message: string;
  code: number;
}

/**
 * Runs the full capture flow: creates a session, launches the native SDK,
 * and — only if the user completes capture — exchanges the resulting code
 * with the backend. Resolves with the verify result; rejects with MyIdError
 * on backend failure, or an Error tagged `userExited`/`sdkError` if the user
 * leaves the flow or the native SDK reports an error before ever producing a
 * code (no backend call happens in those cases).
 */
export async function verifyIdentity(): Promise<{ status: string; verified: boolean; first_name?: string; last_name?: string }> {
  if (!MyIdModule) {
    throw new Error('MyIdModule is not available on this build');
  }

  const { session_id: sessionId } = await startSession();

  const clientHash = process.env.EXPO_PUBLIC_MYID_CLIENT_HASH || '';
  const clientHashId = process.env.EXPO_PUBLIC_MYID_CLIENT_HASH_ID || '';
  const environment = process.env.EXPO_PUBLIC_MYID_ENVIRONMENT === 'PRODUCTION' ? 'PRODUCTION' : 'DEBUG';

  const code = await new Promise<string>((resolve, reject) => {
    const emitter = new NativeEventEmitter(MyIdModule);
    const subs = [
      emitter.addListener('onSuccess', (event: MyIdSuccessEvent) => {
        cleanup();
        resolve(event.code);
      }),
      emitter.addListener('onError', (event: MyIdErrorEvent) => {
        cleanup();
        const err = new Error(event.message || 'MyID SDK error');
        (err as Error & { name: string }).name = 'sdkError';
        reject(err);
      }),
      emitter.addListener('onUserExited', () => {
        cleanup();
        const err = new Error('User exited MyID verification');
        (err as Error & { name: string }).name = 'userExited';
        reject(err);
      }),
    ];
    const cleanup = () => subs.forEach((s) => s.remove());

    MyIdModule.startMyId(sessionId, clientHash, clientHashId, environment);
  });

  return verifySession({ code, sessionId });
}

/** Same table as web's lib/myidErrors — keep the two in sync. */
const MYID_ERRORS: Record<string, { ru: string; uz: string; en: string }> = {
  duplicate_pinfl: {
    ru: 'Эта личность уже привязана к другому аккаунту.',
    uz: "Bu shaxs allaqachon boshqa akkauntga bog'langan.",
    en: 'This identity is already linked to another account.',
  },
  underage: {
    ru: 'Вам должно быть 18 лет или старше.',
    uz: "18 yoshdan katta bo'lishingiz kerak.",
    en: 'You must be 18 or older.',
  },
  document_expired: {
    ru: 'Срок действия документа истёк.',
    uz: 'Hujjat muddati tugagan.',
    en: 'Your document has expired.',
  },
  already_verified: {
    ru: 'Вы уже верифицированы.',
    uz: 'Siz allaqachon tasdiqlangansiz.',
    en: 'You are already verified.',
  },
  server_error: {
    ru: 'Не удалось связаться с MyID. Попробуйте позже.',
    uz: "MyID bilan bog'lanib bo'lmadi. Keyinroq urinib ko'ring.",
    en: 'Could not reach MyID. Please try later.',
  },
};

export function getMyIdError(err: unknown, lang: 'ru' | 'uz' | 'en'): string {
  if (err instanceof Error && (err.name === 'userExited' || err.name === 'sdkError')) {
    return err.message;
  }
  const body = err instanceof MyIdError ? err.responseBody : {};
  const code = (body?.error as string) || 'server_error';
  const entry = MYID_ERRORS[code] ?? MYID_ERRORS.server_error;
  return entry[lang] ?? entry.ru;
}
