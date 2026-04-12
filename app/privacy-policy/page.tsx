import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'ZIVAAD privacy policy for data collection and order handling.'
};

export default function PrivacyPolicyPage() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
      <p className="text-xs uppercase tracking-luxury text-stone-500">Legal</p>
      <h1 className="mt-3 font-serif text-[2.1rem] text-stone-950 sm:text-[3.35rem]">Privacy Policy</h1>

      <div className="mt-8 space-y-6 text-sm leading-7 text-stone-700 sm:text-base">
        <div>
          <h2 className="font-serif text-2xl text-stone-950">1. Data We Collect</h2>
          <p className="mt-2">
            We collect customer name, city, address, and order details submitted during checkout to process and
            confirm orders.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-2xl text-stone-950">2. Order Handling</h2>
          <p className="mt-2">
            Order information may be stored in internal records and integrated services (such as webhook logs or
            sheets) for fulfillment and customer support.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-2xl text-stone-950">3. Payment Information</h2>
          <p className="mt-2">
            We do not store card or online payment credentials. Orders are confirmed through WhatsApp communication.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-2xl text-stone-950">4. Contact</h2>
          <p className="mt-2">For privacy requests, contact us at zivaad.support@gmail.com.</p>
        </div>
      </div>
    </section>
  );
}
