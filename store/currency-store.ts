'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Currency } from '@/lib/currency';

interface CurrencyState {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      currency: 'PKR',
      setCurrency: (currency) => set({ currency })
    }),
    {
      name: 'zivaad-currency',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
