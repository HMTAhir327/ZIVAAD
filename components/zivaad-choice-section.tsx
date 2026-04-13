import Link from 'next/link';

import type { Product } from '@/lib/types';

import { ProductCard } from './product-card';

interface ZivaadChoiceSectionProps {
  products: Product[];
}

export function ZivaadChoiceSection({ products }: ZivaadChoiceSectionProps) {
  if (products.length === 0) {
    return null;
  }

  const visibleProducts = products.slice(0, 8);

  return (
    <section className="mx-auto w-full max-w-[1320px] px-4 py-12 sm:px-6 sm:py-16 lg:px-6 lg:py-20">
      <div className="mb-8 text-center sm:mb-10">
        <p className="text-[10px] uppercase tracking-luxury text-stone-500">Curated Edit</p>
        <h2 className="mt-4 font-serif text-[1.72rem] text-stone-950 sm:text-[2.15rem]">ZIVAAD Choice</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
        {visibleProducts.map((product) => (
          <ProductCard key={product.id} product={product} disableRevealAnimation />
        ))}
      </div>

      <div className="mt-9 text-center">
        <Link
          href="/shop"
          className="inline-flex border border-stone-950 px-7 py-3 text-[11px] uppercase tracking-luxury text-stone-950 transition-colors hover:bg-stone-950 hover:text-white"
        >
          View Catalog
        </Link>
      </div>
    </section>
  );
}
