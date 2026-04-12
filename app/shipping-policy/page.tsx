import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping Policy',
  description: 'ZIVAAD shipping times, charges, and city coverage.'
};

export default function ShippingPolicyPage() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
      <p className="text-xs uppercase tracking-luxury text-stone-500">Policy</p>
      <h1 className="mt-3 font-serif text-[2.1rem] text-stone-950 sm:text-[3.35rem]">Shipping Policy</h1>

      <div className="mt-8 space-y-6 text-sm leading-7 text-stone-700 sm:text-base">
        <div>
          <h2 className="font-serif text-2xl text-stone-950">Delivery Time</h2>
          <p className="mt-2">Orders are processed within 24 hours and delivered in 3–5 business days.</p>
        </div>
        <div>
          <h2 className="font-serif text-2xl text-stone-950">Shipping Charges</h2>
          <p className="mt-2">Shipping charges may vary by city and order value; final cost is confirmed on WhatsApp.</p>
        </div>
        <div>
          <h2 className="font-serif text-2xl text-stone-950">Coverage</h2>
          <p className="mt-2">We currently deliver to major cities across Pakistan.</p>
        </div>
      </div>
    </section>
  );
}
