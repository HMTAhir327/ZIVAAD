import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about ZIVAAD orders, shipping, and care.'
};

const faqs = [
  {
    question: 'How do I place an order?',
    answer: 'Add products to your bag and checkout through WhatsApp. Our team confirms your order details directly.'
  },
  {
    question: 'Do you offer Cash on Delivery?',
    answer: 'Yes. COD is available across major cities in Pakistan.'
  },
  {
    question: 'How long does delivery take?',
    answer: 'Most orders are delivered in 3-5 business days after confirmation.'
  },
  {
    question: 'How should I care for my jewelry?',
    answer: 'Store pieces dry, avoid perfumes/water contact, and wipe gently after use to preserve finish.'
  },
  {
    question: 'Can I exchange a product?',
    answer: 'For wrong or damaged items, contact support within 24 hours of delivery for assistance.'
  }
];

export default function FaqPage() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
      <p className="text-xs uppercase tracking-luxury text-stone-500">Support</p>
      <h1 className="mt-3 font-serif text-[2.1rem] text-stone-950 sm:text-[3.35rem]">Frequently Asked Questions</h1>

      <div className="mt-8 divide-y divide-stone-200 border-y border-stone-200">
        {faqs.map((faq) => (
          <article key={faq.question} className="py-5 sm:py-6">
            <h2 className="font-serif text-[1.35rem] text-stone-950 sm:text-[1.65rem]">{faq.question}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-stone-600 sm:text-base">{faq.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
