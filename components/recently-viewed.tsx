'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { optimizeCloudinaryImage } from '@/lib/cloudinary';
import { formatPrice } from '@/lib/currency';
import type { Currency } from '@/lib/currency';
import { useRecentlyViewedStore } from '@/store/recently-viewed-store';

interface CatalogProductLite {
  id: string;
  name: string;
  price: number;
  compare_price: number;
  category: string;
  primary_image_url: string;
  images: string[];
  badge: string;
  stock: number;
}

interface RecentlyViewedProps {
  currentProductId: string;
  currency: Currency;
}

const fallbackImage =
  'https://res.cloudinary.com/demo/image/upload/v1690000000/samples/ecommerce/accessories-bag.jpg';

export function RecentlyViewed({ currentProductId, currency }: RecentlyViewedProps) {
  const productIds = useRecentlyViewedStore((state) => state.productIds);
  const [products, setProducts] = useState<CatalogProductLite[]>([]);

  useEffect(() => {
    let active = true;

    async function loadCatalog() {
      try {
        const response = await fetch('/api/catalog', { cache: 'no-store' });
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { ok?: boolean; products?: CatalogProductLite[] };
        if (!active || !Array.isArray(data.products)) {
          return;
        }

        setProducts(data.products);
      } catch {
        // Non-blocking; fail silently.
      }
    }

    loadCatalog();

    return () => {
      active = false;
    };
  }, []);

  const relevantIds = productIds.filter((id) => id !== currentProductId);
  if (relevantIds.length === 0) {
    return null;
  }

  const productMap = new Map(products.map((p) => [p.id, p]));
  const displayProducts = relevantIds
    .map((id) => productMap.get(id))
    .filter((p): p is CatalogProductLite => !!p)
    .slice(0, 6);

  if (displayProducts.length === 0) {
    return null;
  }

  return (
    <section className="mt-10">
      <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.15em] text-neutral-400">
        Recently Viewed
      </h2>

      <div className="flex gap-3 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {displayProducts.map((product) => {
          const imgSrc = product.primary_image_url?.trim() || fallbackImage;

          return (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className="group flex min-w-[140px] flex-col"
            >
              <div className="relative h-16 w-16 overflow-hidden bg-neutral-100">
                <Image
                  src={optimizeCloudinaryImage(imgSrc, 200)}
                  alt={product.name}
                  fill
                  sizes="64px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              <p className="mt-2 line-clamp-1 text-xs text-neutral-700">
                {product.name}
              </p>

              <p className="text-xs font-medium text-neutral-900">
                {formatPrice(product.price, currency)}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
