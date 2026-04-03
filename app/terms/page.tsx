import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'ZIVAAD terms and conditions for orders, returns, COD, and shipping.'
};

export default function TermsPage() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
      <p className="text-xs uppercase tracking-luxury text-stone-500">Legal</p>
      <h1 className="mt-3 font-serif text-5xl text-stone-950 sm:text-6xl">Terms & Conditions</h1>

      <div className="mt-8 space-y-6 text-sm leading-7 text-stone-700 sm:text-base">
        <div>
          <h2 className="font-serif text-2xl text-stone-950">1. Orders</h2>
          <p className="mt-2">All orders are placed through our website and confirmed on WhatsApp.</p>
        </div>

        <div>
          <h2 className="font-serif text-2xl text-stone-950">2. Returns</h2>
          <p className="mt-2">
            By default, sale items are final. For damaged or incorrect products, contact us within 24 hours of
            delivery.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-2xl text-stone-950">3. Cash on Delivery (COD)</h2>
          <p className="mt-2">
            COD is available in selected cities. Customers must provide accurate address and reachable contact details.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-2xl text-stone-950">4. Delivery Timeline</h2>
          <p className="mt-2">Standard delivery timeline is 3–5 business days.</p>
        </div>

        <div>
          <h2 className="font-serif text-2xl text-stone-950">5. Shipping Policy</h2>
          <p className="mt-2">
            Detailed shipping terms are available on the <Link href="/shipping-policy" className="underline">Shipping Policy</Link> page.
          </p>
        </div>
      </div>
    </section>
  );
}

