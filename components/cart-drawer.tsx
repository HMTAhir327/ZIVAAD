'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { optimizeCloudinaryImage } from '@/lib/cloudinary';
import { formatPrice } from '@/lib/currency';
import { formatSelectedOptions } from '@/lib/product-variants';
import { buildWhatsAppOrderMessage, buildWhatsAppUrl } from '@/lib/whatsapp';
import { useCartStore } from '@/store/cart-store';
import { useCurrencyStore } from '@/store/currency-store';
import { CompleteYourLook } from '@/components/complete-your-look';

const FREE_SHIPPING_TARGET = 5000;

export function CartDrawer() {
  const { items, isCartOpen, closeCart, removeItem, updateQuantity, getSubtotal, customer, updateCustomer } = useCartStore((state) => ({
    items: state.items,
    isCartOpen: state.isCartOpen,
    closeCart: state.closeCart,
    removeItem: state.removeItem,
    updateQuantity: state.updateQuantity,
    getSubtotal: state.getSubtotal,
    customer: state.customer,
    updateCustomer: state.updateCustomer
  }));

  const currency = useCurrencyStore((state) => state.currency);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const subtotal = getSubtotal();

  useEffect(() => {
    if (!isCartOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isCartOpen]);

  const canCheckout = useMemo(() => {
    return Boolean(customer.name.trim() && customer.city.trim() && customer.address.trim() && items.length > 0);
  }, [customer, items.length]);

  const freeShippingProgress = Math.min((subtotal / FREE_SHIPPING_TARGET) * 100, 100);
  const remainingForFreeShipping = Math.max(FREE_SHIPPING_TARGET - subtotal, 0);

  async function handleCheckout() {
    if (!canCheckout || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    const message = buildWhatsAppOrderMessage(items, subtotal, customer);

    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          total: subtotal,
          customer,
          currency,
          source: 'cart-drawer'
        })
      });
    } catch {
      // Continue to WhatsApp even if backup webhook fails.
    }

    window.location.href = buildWhatsAppUrl(message);
    setIsSubmitting(false);
  }

  return (
    <AnimatePresence>
      {isCartOpen ? (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-[108] bg-black/35"
            aria-label="Close cart"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-0 top-0 z-[109] h-full w-full max-w-none border-l border-stone-200 bg-white sm:max-w-md"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3 sm:px-5 sm:py-4">
                <h3 className="font-serif text-[1.8rem] text-stone-950 sm:text-3xl">Your Bag</h3>
                <button
                  type="button"
                  onClick={closeCart}
                  className="border border-stone-300 px-3 py-1 text-[10px] uppercase tracking-luxury text-stone-600 transition-colors hover:border-stone-900 hover:text-stone-900"
                >
                  Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="space-y-4 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-5 sm:py-5">
                  {items.length === 0 ? (
                    <div className="border border-dashed border-stone-300 p-8 text-center text-sm text-stone-600">
                      Your bag is currently empty.
                    </div>
                  ) : (
                    items.map((item) => {
                      const lineId = item.line_id || item.id;
                      const variantLabel = item.variant_title || formatSelectedOptions(item.selected_options);

                      return (
                        <article key={lineId} className="flex gap-2.5 border border-stone-200 bg-white p-3 sm:gap-3">
                          <div className="relative h-[88px] w-[72px] overflow-hidden bg-stone-100 sm:h-24 sm:w-20">
                            <Image
                              src={optimizeCloudinaryImage(item.image, 300)}
                              alt={item.name}
                              fill
                              sizes="120px"
                              className="object-cover"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-sm leading-tight text-stone-900">{item.name}</p>
                            <p className="mt-1 text-xs text-stone-500">{formatPrice(item.price, currency)}</p>
                            {variantLabel ? <p className="mt-1 break-words text-[11px] text-stone-500">{variantLabel}</p> : null}
                            {item.variant_sku ? <p className="text-[11px] text-stone-500">SKU: {item.variant_sku}</p> : null}

                            <div className="mt-3 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateQuantity(lineId, item.quantity - 1)}
                                className="h-7 w-7 border border-stone-300 text-sm sm:h-8 sm:w-8"
                              >
                                -
                              </button>
                              <span className="w-6 text-center text-sm sm:w-7">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(lineId, item.quantity + 1)}
                                className="h-7 w-7 border border-stone-300 text-sm sm:h-8 sm:w-8"
                              >
                                +
                              </button>

                              <button
                                type="button"
                                onClick={() => removeItem(lineId)}
                                className="ml-auto text-[10px] uppercase tracking-luxury text-stone-500 hover:text-stone-900"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })
                  )}

                  <div className="space-y-4 border-t border-stone-200 pt-4">
                    <p className="text-xs uppercase tracking-luxury text-stone-500">Order Summary</p>

                    <div className="border border-stone-200 bg-[#fcfcfb] p-3">
                      <p className="text-[10px] uppercase tracking-luxury text-stone-500">You&apos;re almost done</p>
                      <ul className="mt-2 space-y-1 text-xs text-stone-600">
                        <li>We&apos;ll confirm your order instantly on WhatsApp.</li>
                        <li>No online payment required.</li>
                      </ul>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="uppercase tracking-luxury text-stone-500">Subtotal</span>
                      <span className="font-medium text-stone-950">{formatPrice(subtotal, currency)}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      <p className="border border-stone-200 px-2 py-1.5 text-center text-[9px] uppercase tracking-luxury text-stone-600">
                        COD
                      </p>
                      <p className="border border-stone-200 px-2 py-1.5 text-center text-[9px] uppercase tracking-luxury text-stone-600">
                        Fast Dispatch
                      </p>
                      <p className="border border-stone-200 px-2 py-1.5 text-center text-[9px] uppercase tracking-luxury text-stone-600">
                        Support
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] text-stone-600">
                        {remainingForFreeShipping > 0
                          ? `${formatPrice(remainingForFreeShipping, currency)} away from free shipping`
                          : 'Free shipping unlocked'}
                      </p>
                      <div className="mt-2 h-1 w-full bg-stone-100">
                        <div
                          className="h-full bg-stone-900 transition-[width] duration-500 ease-luxury"
                          style={{ width: `${freeShippingProgress}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-3 border-t border-stone-200 pt-4">
                      <input
                        type="text"
                        placeholder="Name"
                        value={customer.name}
                        onChange={(event) => updateCustomer({ name: event.target.value })}
                        className="w-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-stone-900"
                      />
                      <input
                        type="text"
                        placeholder="City"
                        value={customer.city}
                        onChange={(event) => updateCustomer({ city: event.target.value })}
                        className="w-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-stone-900"
                      />
                      <textarea
                        placeholder="Address"
                        value={customer.address}
                        onChange={(event) => updateCustomer({ address: event.target.value })}
                        rows={3}
                        className="w-full resize-none border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-stone-900"
                      />
                    </div>

                    <CompleteYourLook
                      excludeProductIds={items.map((item) => item.id)}
                      currency={currency}
                      limit={2}
                      compact
                      onItemClick={closeCart}
                    />

                    <Link
                      href="/cart"
                      onClick={closeCart}
                      className="block w-full border border-stone-300 px-5 py-3 text-center text-[11px] uppercase tracking-luxury text-stone-700 transition-colors hover:border-stone-900 hover:text-stone-950"
                    >
                      View Full Cart
                    </Link>

                    <button
                      type="button"
                      onClick={handleCheckout}
                      disabled={!canCheckout || isSubmitting}
                      className="w-full bg-stone-950 px-5 py-3 text-[11px] uppercase tracking-luxury text-white transition-opacity duration-300 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isSubmitting ? 'Processing...' : 'Checkout via WhatsApp'}
                    </button>
                    <p className="text-center text-[10px] uppercase tracking-luxury text-stone-500">
                      Order is backed up before WhatsApp opens.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
