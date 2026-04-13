'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { optimizeCloudinaryImage } from '@/lib/cloudinary';
import { formatPrice } from '@/lib/currency';
import type { Currency } from '@/lib/currency';

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

interface CompleteYourLookProps {
  excludeProductIds: string[];
  currency: Currency;
  limit?: number;
  compact?: boolean;
  onItemClick?: () => void;
}

const fallbackImage =
  'https://res.cloudinary.com/demo/image/upload/v1690000000/samples/ecommerce/accessories-bag.jpg';

export function CompleteYourLook({
  excludeProductIds,
  currency,
  limit = 2,
  compact = false,
  onItemClick
}: CompleteYourLookProps) {
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
        // Non-blocking upsell area; fail silently.
      }
    }

    loadCatalog();

    return () => {
      active = false;
    };
  }, []);

  const suggestions = useMemo(() => {
    const excluded = new Set(excludeProductIds.map((id) => id.trim()).filter(Boolean));
    return products
      .filter((product) => product.stock > 0 && !excluded.has(product.id))
      .slice(0, Math.max(1, limit));
  }, [excludeProductIds, limit, products]);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <section className={compact ? 'border border-stone-200 bg-[#fcfcfb] p-3' : 'border border-stone-200 bg-[#fcfcfb] p-4 sm:p-5'}>
      <p className="text-[10px] uppercase tracking-luxury text-stone-500">Complete Your Look</p>
      <p className="mt-1 text-xs text-stone-600">Pair your current selection with these complementary pieces.</p>

      <div className={`mt-3 grid gap-3 ${compact ? '' : 'sm:grid-cols-2'}`}>
        {suggestions.map((product) => (
          <Link
            key={`upsell-${product.id}`}
            href={`/product/${product.id}`}
            onClick={onItemClick}
            className="group grid grid-cols-[64px_minmax(0,1fr)] gap-2 border border-stone-200 bg-white p-2.5 transition-colors hover:border-stone-950"
          >
            <div className="relative h-16 w-16 overflow-hidden bg-stone-100">
              <Image
                src={optimizeCloudinaryImage(product.primary_image_url || product.images?.[0] || fallbackImage, 320)}
                alt={product.name}
                fill
                sizes="64px"
                className="object-cover transition-transform duration-500 ease-luxury group-hover:scale-[1.04]"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm text-stone-900">{product.name}</p>
              <p className="mt-1 text-[11px] uppercase tracking-luxury text-stone-500">{product.category}</p>
              <p className="mt-1.5 text-xs text-stone-700">{formatPrice(product.price, currency)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
