'use client';

import { create } from 'zustand';

interface UiState {
  toastMessage: string | null;
  showToast: (message: string) => void;
  clearToast: () => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useUiStore = create<UiState>((set) => ({
  toastMessage: null,
  showToast: (message) => {
    if (toastTimer) {
      clearTimeout(toastTimer);
    }

    set({ toastMessage: message });

    toastTimer = setTimeout(() => {
      set({ toastMessage: null });
      toastTimer = null;
    }, 2200);
  },
  clearToast: () => {
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
    set({ toastMessage: null });
  }
}));
