import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'The ZIVAAD brand story and philosophy.'
};

export default function AboutPage() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-20">
      <p className="text-xs uppercase tracking-luxury text-stone-500">About ZIVAAD</p>
      <h1 className="mt-3 font-serif text-4xl text-stone-950 sm:text-6xl">Brand Story</h1>

      <div className="mt-7 space-y-5 text-sm leading-7 text-stone-700 sm:mt-8 sm:text-base">
        <p>
          ZIVAAD was created to bring minimal luxury jewelry into everyday styling. Our pieces focus on clean form,
          skin-friendly finish, and timeless elegance.
        </p>
        <p>
          We believe jewelry should feel effortless, wearable from morning meetings to evening plans without losing
          its presence. Every collection is designed for layering, comfort, and confidence.
        </p>
        <p>
          Luxury is not defined by price, but by presence. ZIVAAD is built around that idea.
        </p>
      </div>
    </section>
  );
}
