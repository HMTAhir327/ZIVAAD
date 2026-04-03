'use client';

import Image from 'next/image';

import { optimizeCloudinaryImage } from '@/lib/cloudinary';
import type { Product } from '@/lib/types';

interface GallerySectionProps {
  products: Product[];
}

export function GallerySection({ products }: GallerySectionProps) {
  const images = products.flatMap((product) => product.images.slice(0, 1)).slice(0, 6);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6 lg:px-8 lg:pb-32">
      <div className="mb-6 sm:mb-8">
        <p className="text-xs uppercase tracking-luxury text-stone-500">Instagram-Style Gallery</p>
        <h2 className="mt-2 font-serif text-4xl text-stone-950">#ZIVAADMoments</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {images.map((image, index) => (
          <div
            key={`${image}-${index}`}
            className={`relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 ${
              index % 3 === 0 ? 'sm:row-span-2 sm:aspect-[3/4]' : 'aspect-square'
            }`}
          >
            <Image
              src={optimizeCloudinaryImage(image, 900)}
              alt={`ZIVAAD gallery ${index + 1}`}
              fill
              sizes="(max-width: 768px) 45vw, 30vw"
              className="object-cover transition-transform duration-700 ease-luxury hover:scale-105"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
