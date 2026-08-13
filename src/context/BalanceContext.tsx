/**
 * Wallet balance shared by the booking payment flow — "To‘lov qilish"
 * reads it to pick the sufficient/insufficient state, "Hisobni to‘ldirish"
 * adds to it. Figma: Booking flow (payment).
 */
import React, { createContext, useContext, useMemo, useState } from 'react';

/** 1145340 -> "1 145 340 UZS" */
export const formatUZS = (amount: number) =>
  `${String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} UZS`;

interface BalanceContextValue {
  balance: number;
  topUp: (amount: number) => void;
}

const BalanceContext = createContext<BalanceContextValue>({
  balance: 0,
  topUp: () => {},
});

export function BalanceProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState(0);

  const value = useMemo(
    () => ({
      balance,
      topUp: (amount: number) => setBalance((prev) => prev + amount),
    }),
    [balance],
  );

  return <BalanceContext.Provider value={value}>{children}</BalanceContext.Provider>;
}

export const useBalance = () => useContext(BalanceContext);
