import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RecentlyViewedState {
  productIds: string[];
  addProductId: (id: string) => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      productIds: [],
      addProductId: (id) =>
        set((state) => {
          const filtered = state.productIds.filter((pid) => pid !== id);
          return { productIds: [id, ...filtered].slice(0, 12) };
        })
    }),
    { name: 'zivaad-recently-viewed' }
  )
);
