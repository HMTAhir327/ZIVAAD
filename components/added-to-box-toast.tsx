'use client';

import { AnimatePresence, motion } from 'framer-motion';

import { useUiStore } from '@/store/ui-store';

export function AddedToBoxToast() {
  const { toastMessage } = useUiStore((state) => ({ toastMessage: state.toastMessage }));

  return (
    <AnimatePresence>
      {toastMessage ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 border border-stone-900 bg-white px-5 py-3 text-[11px] uppercase tracking-luxury text-stone-900"
          role="status"
          aria-live="polite"
        >
          {toastMessage}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
