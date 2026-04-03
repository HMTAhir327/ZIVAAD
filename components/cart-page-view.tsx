'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { optimizeCloudinaryImage } from '@/lib/cloudinary';
import { formatPrice } from '@/lib/currency';
import { formatSelectedOptions } from '@/lib/product-variants';
import { buildWhatsAppOrderMessage, buildWhatsAppUrl } from '@/lib/whatsapp';
import { useCartStore } from '@/store/cart-store';
import { useCurrencyStore } from '@/store/currency-store';

const FREE_SHIPPING_TARGET = 5000;

export function CartPageView() {
  const { items, removeItem, updateQuantity, getSubtotal, customer, updateCustomer } = useCartStore((state) => ({
    items: state.items,
    removeItem: state.removeItem,
    updateQuantity: state.updateQuantity,
    getSubtotal: state.getSubtotal,
    customer: state.customer,
    updateCustomer: state.updateCustomer
  }));
  const currency = useCurrencyStore((state) => state.currency);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const subtotal = getSubtotal();
  const freeShippingProgress = Math.min((subtotal / FREE_SHIPPING_TARGET) * 100, 100);
  const remainingForFreeShipping = Math.max(FREE_SHIPPING_TARGET - subtotal, 0);

  const canCheckout = useMemo(() => {
    return Boolean(customer.name.trim() && customer.city.trim() && customer.address.trim() && items.length > 0);
  }, [customer, items.length]);

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
          source: 'cart-page'
        })
      });
    } catch {
      // Continue with WhatsApp redirect even if backup webhook fails.
    }

    window.location.href = buildWhatsAppUrl(message);
    setIsSubmitting(false);
  }

  return (
    <section className="w-full px-4 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-14">
      <div className="mb-8 sm:mb-10">
        <p className="text-xs uppercase tracking-luxury text-stone-500">Checkout</p>
        <h1 className="mt-2 font-serif text-4xl text-stone-950 sm:text-5xl">Your Cart</h1>
      </div>

      {items.length === 0 ? (
        <div className="border border-dashed border-stone-300 bg-white p-10 text-center">
          <p className="text-sm text-stone-600">Your cart is empty.</p>
          <Link
            href="/shop"
            className="mt-5 inline-flex bg-stone-950 px-6 py-3 text-xs uppercase tracking-luxury text-white"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-4">
            {items.map((item) => {
              const lineId = item.line_id || item.id;
              const variantLabel = item.variant_title || formatSelectedOptions(item.selected_options);

              return (
              <article key={lineId} className="flex gap-4 border border-stone-200 bg-white p-4">
                <div className="relative h-24 w-20 overflow-hidden bg-stone-100">
                  <Image
                    src={optimizeCloudinaryImage(item.image, 300)}
                    alt={item.name}
                    fill
                    sizes="140px"
                    className="object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-stone-900">{item.name}</p>
                  <p className="mt-1 text-xs text-stone-500">{formatPrice(item.price, currency)}</p>
                  {variantLabel ? <p className="mt-1 text-[11px] text-stone-500">{variantLabel}</p> : null}
                  {item.variant_sku ? <p className="text-[11px] text-stone-500">SKU: {item.variant_sku}</p> : null}

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQuantity(lineId, item.quantity - 1)}
                      className="h-8 w-8 border border-stone-300 text-sm"
                    >
                      -
                    </button>
                    <span className="w-7 text-center text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(lineId, item.quantity + 1)}
                      className="h-8 w-8 border border-stone-300 text-sm"
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
            )})}
          </div>

          <aside className="space-y-4 border border-stone-200 bg-white p-4 sm:p-5 lg:sticky lg:top-32 lg:h-fit">
            <p className="text-xs uppercase tracking-luxury text-stone-500">Order Summary</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-600">Subtotal</span>
              <span className="font-medium text-stone-950">{formatPrice(subtotal, currency)}</span>
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
                className="w-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-stone-950"
              />
              <input
                type="text"
                placeholder="City"
                value={customer.city}
                onChange={(event) => updateCustomer({ city: event.target.value })}
                className="w-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-stone-950"
              />
              <textarea
                placeholder="Address"
                value={customer.address}
                onChange={(event) => updateCustomer({ address: event.target.value })}
                rows={3}
                className="w-full resize-none border border-stone-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-stone-950"
              />
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={!canCheckout || isSubmitting}
              className="w-full bg-stone-950 px-5 py-3 text-xs uppercase tracking-luxury text-white transition-opacity duration-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? 'Processing...' : 'Checkout via WhatsApp'}
            </button>
            <p className="text-center text-[10px] uppercase tracking-luxury text-stone-500">
              No payment gateway. Order confirmation via WhatsApp.
            </p>
          </aside>
        </div>
      )}
    </section>
  );
}
