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
import { CompleteYourLook } from '@/components/complete-your-look';

const FREE_SHIPPING_TARGET = 2999;

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
        <h1 className="mt-2 font-serif text-[1.72rem] text-stone-950 sm:text-[2.45rem]">Your Cart</h1>
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
        <div className="grid gap-5 sm:gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-4">
            {items.map((item) => {
              const lineId = item.line_id || item.id;
              const variantLabel = item.variant_title || formatSelectedOptions(item.selected_options);

              return (
              <article key={lineId} className="flex gap-2.5 border border-stone-200 bg-white p-3 sm:gap-4 sm:p-4">
                <div className="relative h-[88px] w-[72px] overflow-hidden bg-stone-100 sm:h-24 sm:w-20">
                  <Image
                    src={optimizeCloudinaryImage(item.image, 300)}
                    alt={item.name}
                    fill
                    sizes="140px"
                    className="object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 font-medium leading-tight text-stone-900">{item.name}</p>
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
            )})}
          </div>

          <aside className="space-y-4 border border-stone-200 bg-white p-4 sm:p-5 lg:sticky lg:top-32 lg:h-fit">
            <p className="text-xs uppercase tracking-luxury text-stone-500">Order Summary</p>
            <div className="border border-stone-200 bg-[#fcfcfb] p-3">
              <p className="text-[10px] uppercase tracking-luxury text-stone-500">You&apos;re almost done</p>
              <ul className="mt-2 space-y-1 text-xs text-stone-600">
                <li>We&apos;ll confirm your order instantly on WhatsApp.</li>
                <li>No online payment required.</li>
              </ul>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-600">Subtotal</span>
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
              <div className="mt-2 h-1.5 w-full rounded-full bg-stone-100">
                <div
                  className={`h-full rounded-full transition-[width] duration-500 ease-luxury ${freeShippingProgress >= 100 ? 'bg-green-500' : 'bg-[#b89a61]'}`}
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
              className="flex w-full items-center justify-center gap-2 bg-[#25D366] px-5 py-3 text-xs uppercase tracking-luxury text-white transition-opacity duration-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              {isSubmitting ? 'Processing...' : 'Checkout via WhatsApp'}
            </button>
            <p className="text-center text-[10px] uppercase tracking-luxury text-stone-500">
              No online payment required. Order confirmation via WhatsApp.
            </p>

            <CompleteYourLook excludeProductIds={items.map((item) => item.id)} currency={currency} limit={2} />
          </aside>
        </div>
      )}
    </section>
  );
}
