/** 1700000 -> "1 700 000" */
export const groupDigits = (amount: number) =>
  String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/** 1700000 -> "1 700 000 so‘m" */
export const formatSum = (amount: number) => `${groupDigits(amount)} so‘m`;

/** 780000 -> "780 000 so‘m/1kun" */
export const formatDailyPrice = (amount: number) => `${formatSum(amount)}/1kun`;

/** "+998908577273" -> "+998 90 857 72 73"; unknown shapes pass through. */
export const formatPhoneNumber = (phone: string) => {
  const m = phone.match(/^\+998(\d{2})(\d{3})(\d{2})(\d{2})$/);
  return m ? `+998 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : phone;
};
