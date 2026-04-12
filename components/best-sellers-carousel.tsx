import Link from 'next/link';

import type { Product } from '@/lib/types';

import { ProductCard } from './product-card';

interface BestSellersCarouselProps {
  products: Product[];
  title?: string;
}

export function BestSellersCarousel({ products, title = 'Best Selling Jewelry in Pakistan' }: BestSellersCarouselProps) {
  const visibleProducts = products.slice(0, 10);

  if (visibleProducts.length === 0) {
    return null;
  }

  return (
    <section className="relative mx-auto w-full max-w-[1320px] bg-[#fcfcfb]">
      <div className="w-full px-4 py-14 sm:px-6 sm:py-20 lg:px-6 lg:py-24">
        <div className="mb-8 text-center sm:mb-10">
          <p className="text-[10px] uppercase tracking-luxury text-stone-500">Most Loved Pieces</p>
          <h2 className="mt-4 inline-block border-b border-stone-950 pb-1 font-serif text-[1.72rem] text-stone-950 sm:mt-5 sm:text-[2.15rem]">
            {title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-stone-600">
            Discover ZIVAAD&apos;s most-loved rings, earrings, necklaces, and bracelets crafted for everyday luxury.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} disableRevealAnimation />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/shop"
            className="inline-flex border border-stone-950 px-7 py-3 text-[11px] uppercase tracking-luxury text-stone-950 transition-colors hover:bg-stone-950 hover:text-white"
          >
            View All
          </Link>
        </div>
      </div>
    </section>
  );
}
