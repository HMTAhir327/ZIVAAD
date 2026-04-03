'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { buildCartLineId, formatSelectedOptions, getEffectiveProductState } from '@/lib/product-variants';
import type { CartItem, CheckoutCustomer, Product, ProductVariant } from '@/lib/types';

function normalizeSelectedOptions(input: Record<string, string> | undefined): Record<string, string> | undefined {
  if (!input || typeof input !== 'object') {
    return undefined;
  }

  const normalized = Object.fromEntries(
    Object.entries(input)
      .map(([key, value]) => [key.trim(), String(value).trim()] as const)
      .filter(([key, value]) => key.length > 0 && value.length > 0)
  );

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

interface CartState {
  items: CartItem[];
  isCartOpen: boolean;
  customer: CheckoutCustomer;
  openCart: () => void;
  closeCart: () => void;
  updateCustomer: (patch: Partial<CheckoutCustomer>) => void;
  addItem: (
    product: Product,
    variant?: ProductVariant,
    selectedOptions?: Record<string, string>,
    quantity?: number
  ) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isCartOpen: false,
      customer: {
        name: '',
        city: '',
        address: ''
      },
      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
      updateCustomer: (patch) =>
        set((state) => ({
          customer: {
            ...state.customer,
            ...patch
          }
        })),
      addItem: (product, variant, selectedOptions, quantity = 1) =>
        set((state) => {
          const effective = getEffectiveProductState(product, variant);
          if (effective.stock <= 0) {
            return state;
          }

          const qtyToAdd = Math.max(1, Math.floor(quantity));

          const normalizedOptions = normalizeSelectedOptions(selectedOptions ?? variant?.option_values);
          const lineId = buildCartLineId(product.id, variant, normalizedOptions);
          const existing = state.items.find((item) => (item.line_id || item.id) === lineId);

          if (existing) {
            const nextQuantity = Math.min(existing.quantity + qtyToAdd, existing.stock);
            return {
              items: state.items.map((item) =>
                (item.line_id || item.id) === lineId ? { ...item, quantity: nextQuantity } : item
              )
            };
          }

          const nextItem: CartItem = {
            line_id: lineId,
            id: product.id,
            name: product.name,
            price: effective.price,
            image: effective.image,
            quantity: Math.min(qtyToAdd, effective.stock),
            stock: effective.stock,
            variant_id: variant?.id,
            variant_sku: variant?.sku,
            variant_title: variant?.title || formatSelectedOptions(normalizedOptions) || undefined,
            selected_options: normalizedOptions
          };

          return { items: [...state.items, nextItem] };
        }),
      removeItem: (lineId) =>
        set((state) => ({
          items: state.items.filter((item) => (item.line_id || item.id) !== lineId)
        })),
      updateQuantity: (lineId, quantity) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              (item.line_id || item.id) === lineId ? { ...item, quantity: Math.min(Math.max(quantity, 1), item.stock) } : item
            )
            .filter((item) => item.quantity > 0)
        })),
      clearCart: () => set({ items: [] }),
      getSubtotal: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      getItemCount: () => get().items.reduce((count, item) => count + item.quantity, 0)
    }),
    {
      name: 'zivaad-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items, customer: state.customer }),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState as Partial<CartState>) || {};
        const persistedItems = Array.isArray(persisted.items) ? persisted.items : [];
        const persistedCustomer = persisted.customer || currentState.customer;

        return {
          ...currentState,
          ...persisted,
          customer: {
            ...currentState.customer,
            ...persistedCustomer
          },
          items: persistedItems.map((item) => ({
            ...item,
            line_id: item.line_id || item.id
          }))
        };
      }
    }
  )
);
