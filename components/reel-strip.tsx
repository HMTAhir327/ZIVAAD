'use client';

import Image from 'next/image';
import Link from 'next/link';

import { optimizeCloudinaryImage } from '@/lib/cloudinary';
import type { Product } from '@/lib/types';

interface ReelStripProps {
  products: Product[];
}

export function ReelStrip({ products }: ReelStripProps) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-luxury text-stone-500">Editorial Moments</p>
          <h2 className="mt-2 font-serif text-4xl text-stone-950">The Collection Edit</h2>
        </div>
        <Link href="/shop" className="text-xs uppercase tracking-luxury text-stone-600 hover:text-stone-950">
          Explore All
        </Link>
      </div>

      <div className="flex snap-x gap-4 overflow-x-auto pb-4">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className="group relative min-w-[72vw] snap-start overflow-hidden rounded-3xl border border-stone-200 bg-black sm:min-w-[320px]"
          >
            <div className="relative aspect-[9/16]">
              <Image
                src={optimizeCloudinaryImage(product.images[0], 900)}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 80vw, 320px"
                className="object-cover opacity-85 transition-transform duration-700 ease-luxury group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
            </div>

            <div className="absolute inset-x-0 bottom-0 p-5 text-sand-50">
              <p className="text-[10px] uppercase tracking-luxury text-sand-100">{product.badge}</p>
              <p className="mt-1 font-serif text-2xl">{product.name}</p>
              <p className="mt-1 text-xs uppercase tracking-luxury text-sand-100/80">Tap to View</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
