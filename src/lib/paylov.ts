/**
 * Paylov card flow client. Mirrors rentzor-marketplace's usePaylov +
 * lib/paylovErrors: createCard sends the PAN + YYMM expiry to the
 * paylov-create-card edge function (which relays to Paylov and gets an OTP
 * sent to the card's phone), confirmCard completes it and the function
 * inserts the row into user_cards. Error codes come back as
 * { error_code, ... } and map to the same localized messages as the web app.
 */
import { FunctionsHttpError } from '@supabase/supabase-js';
import type { LanguageCode } from '../i18n';
import { supabase } from '../integrations/supabase/client';

export class PaylovError extends Error {
  responseBody: Record<string, unknown>;

  constructor(responseBody: Record<string, unknown>) {
    super(String(responseBody?.error_code || 'server_error'));
    this.name = 'PaylovError';
    this.responseBody = responseBody;
  }
}

async function invokePaylov<T>(name: string, body: object): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new PaylovError({ error_code: 'server_error' });

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
    throw new PaylovError(errorBody);
  }
  return data as T;
}

export interface CreateCardResult {
  cid: string;
  otpSentPhone: string;
}

/** `expireDate` is YYMM (Paylov's convention — "2709" for 09/27). */
export const createCard = (params: { cardNumber: string; expireDate: string }) =>
  invokePaylov<CreateCardResult>('paylov-create-card', params);

export const confirmCard = (params: { cardId: string; otp: string; cardName?: string }) =>
  invokePaylov<{ card: unknown }>('paylov-confirm-card', params);

export interface TopUpResult {
  success: boolean;
  amount: number;
  new_balance: number;
  receipt_id: string;
}

/** `cardId` is the card's paylov_card_id, not the local user_cards.id. */
export const topUpBalance = (params: { cardId: string; amount: number }) =>
  invokePaylov<TopUpResult>('balance-topup', { card_id: params.cardId, amount: params.amount });

export interface WithdrawPreview {
  amount: number;
  commission: number;
  commission_percent: number;
  owner_receives: number;
  card: string;
  current_balance: number;
  balance_after: number;
}

export interface WithdrawResult {
  success: boolean;
  amount: number;
  commission: number;
  owner_receives: number;
  new_balance: number;
  paylov_ref: string;
}

/**
 * balance-withdraw edge function (same one the rentzor-owner web app uses):
 * preview computes the 12% commission split, confirm performs the Paylov A2C
 * transfer and debits profiles.balance server-side. Available balance is
 * profiles.balance minus held_balance; minimum withdrawal is 5 000 UZS.
 * `cardId` is the card's paylov_card_id, not the local user_cards.id.
 */
export const previewWithdrawal = (params: { cardId: string; amount: number }) =>
  invokePaylov<WithdrawPreview>('balance-withdraw', {
    action: 'preview',
    card_id: params.cardId,
    amount: params.amount,
  });

export const confirmWithdrawal = (params: { cardId: string; amount: number }) =>
  invokePaylov<WithdrawResult>('balance-withdraw', {
    action: 'confirm',
    card_id: params.cardId,
    amount: params.amount,
  });

/** Same table as web's lib/paylovErrors.ts — keep the two in sync. */
const PAYLOV_ERRORS: Record<string, { ru: string; uz: string; en: string }> = {
  card_exists: {
    ru: 'Эта карта уже добавлена. Обновите страницу.',
    uz: "Bu karta allaqachon qo'shilgan. Sahifani yangilang.",
    en: 'This card is already added. Refresh the page.',
  },
  card_not_found: {
    ru: 'Карта не найдена. Проверьте номер и срок действия.',
    uz: 'Karta topilmadi. Raqam va amal muddatini tekshiring.',
    en: 'Card not found. Check the number and expiry date.',
  },
  card_is_blocked: {
    ru: 'Карта временно заблокирована. Попробуйте через {hours} ч. {minutes} мин.',
    uz: "Karta vaqtincha bloklangan. {hours} soat {minutes} daqiqadan keyin urinib ko'ring.",
    en: 'Card is temporarily blocked. Try again in {hours}h {minutes}m.',
  },
  invalid_card: {
    ru: 'Карта не поддерживается.',
    uz: "Karta qo'llab-quvvatlanmaydi.",
    en: 'Card is not supported.',
  },
  card_expired: {
    ru: 'Срок действия карты истёк.',
    uz: 'Karta muddati tugagan.',
    en: 'Card has expired.',
  },
  invalid_card_length: {
    ru: 'Номер карты должен содержать 16 цифр.',
    uz: "Karta raqami 16 ta raqamdan iborat bo'lishi kerak.",
    en: 'Card number must be 16 digits.',
  },
  missing_fields: {
    ru: 'Введите номер карты и срок действия.',
    uz: 'Karta raqami va amal muddatini kiriting.',
    en: 'Enter card number and expiry date.',
  },
  missing_otp: {
    ru: 'Введите код из SMS.',
    uz: 'SMS kodini kiriting.',
    en: 'Enter the SMS code.',
  },
  validation_error: {
    ru: 'Неверные данные карты.',
    uz: "Karta ma'lumotlari noto'g'ri.",
    en: 'Invalid card data.',
  },
  otp_expired: {
    ru: 'Код подтверждения истёк. Попробуйте добавить карту заново.',
    uz: 'Tasdiqlash kodi muddati tugadi. Kartani qaytadan qo‘shing.',
    en: 'Verification code expired. Try adding the card again.',
  },
  invalid_otp: {
    ru: 'Неверный код подтверждения.',
    uz: "Tasdiqlash kodi noto'g'ri.",
    en: 'Invalid verification code.',
  },
  max_attempts: {
    ru: 'Превышено количество попыток. Попробуйте добавить карту заново.',
    uz: 'Urinishlar soni oshib ketdi. Kartani qaytadan qo‘shing.',
    en: 'Too many attempts. Try adding the card again.',
  },
  card_is_already_activated: {
    ru: 'Эта карта уже активирована.',
    uz: 'Bu karta allaqachon faollashtirilgan.',
    en: 'This card is already activated.',
  },
  db_save_failed: {
    ru: 'Не удалось сохранить карту. Попробуйте ещё раз.',
    uz: "Kartani saqlashda xatolik. Qaytadan urinib ko'ring.",
    en: 'Failed to save card. Please try again.',
  },
  insufficient_funds: {
    ru: 'Недостаточно средств на карте. Пополните карту или используйте другую.',
    uz: "Kartada mablag' yetarli emas. Kartani to'ldirib qaytadan urinib ko'ring yoki boshqa karta ishlating.",
    en: 'Insufficient funds on card. Top up your card or use a different one.',
  },
  card_blocked: {
    ru: 'Карта заблокирована. Свяжитесь с банком.',
    uz: "Karta bloklangan. Bank bilan bog'laning.",
    en: 'Card is blocked. Contact your bank.',
  },
  limit_exceeded: {
    ru: 'Превышен лимит карты. Используйте другую карту или повторите позже.',
    uz: "Karta limiti oshib ketdi. Boshqa karta ishlating yoki keyinroq urinib ko'ring.",
    en: 'Card limit exceeded. Use another card or try again later.',
  },
  card_declined: {
    ru: 'Банк отклонил операцию. Свяжитесь с банком или используйте другую карту.',
    uz: "Bank operatsiyani rad etdi. Bank bilan bog'laning yoki boshqa karta ishlating.",
    en: 'Bank declined the transaction. Contact your bank or use another card.',
  },
  otp_required: {
    ru: 'Для этой операции банк требует подтверждение SMS. Эта функция пока не поддерживается — используйте другую карту.',
    uz: "Bu operatsiya uchun bank SMS tasdiqlashni talab qiladi. Bu funksiya hozircha qo'llab-quvvatlanmaydi — boshqa karta ishlating.",
    en: 'Bank requires SMS confirmation for this transaction. Not yet supported — use another card.',
  },
  server_error: {
    ru: 'Не удалось связаться с платёжной системой. Попробуйте позже.',
    uz: "To'lov tizimi bilan bog'lanib bo'lmadi. Keyinroq urinib ko'ring.",
    en: 'Could not reach payment system. Please try later.',
  },
};

export function getPaylovError(err: unknown, lang: LanguageCode): string {
  const body = err instanceof PaylovError ? err.responseBody : {};
  const code = (body?.error_code as string) || 'server_error';
  const entry = PAYLOV_ERRORS[code] ?? PAYLOV_ERRORS.server_error;
  const template = entry[lang] ?? entry.ru;

  if (code === 'card_is_blocked' && body?.blocked_hours != null) {
    return template
      .replace('{hours}', String(body.blocked_hours))
      .replace('{minutes}', String(body.blocked_minutes ?? 0));
  }
  return template;
}
