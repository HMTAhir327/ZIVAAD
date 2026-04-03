import Link from 'next/link';

interface HomeCtaSectionProps {
  title?: string;
}

export function HomeCtaSection({ title = 'Build your everyday collection' }: HomeCtaSectionProps) {
  return (
    <section className="mx-auto w-full max-w-[1320px] px-4 py-14 text-center sm:px-6 sm:py-20 lg:px-6 lg:py-28">
      <h2 className="font-serif text-3xl text-stone-950 sm:text-5xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-2xl text-[13px] text-stone-600 sm:mt-4 sm:text-base">
        Discover minimal rings, earrings, and necklaces designed to be worn daily and loved for years.
      </p>
      <Link
        href="/shop"
        className="mt-7 inline-flex bg-stone-950 px-7 py-3 text-[10px] uppercase tracking-luxury text-white sm:mt-8 sm:text-[11px]"
      >
        Shop Collection
      </Link>
    </section>
  );
}
