import Image from 'next/image';
import Link from 'next/link';

import { optimizeCloudinaryImage } from '@/lib/cloudinary';
import type { Product } from '@/lib/types';

interface CategoryCollectionsGridProps {
  products: Product[];
  categories?: string[];
  categoryImages?: Record<string, string>;
  title?: string;
}

const fallbackImage =
  'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_1400/v1690000000/samples/ecommerce/accessories-bag.jpg';

function formatCategoryLabel(category: string): string {
  return category
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

export function CategoryCollectionsGrid({
  products,
  categories = [],
  categoryImages = {},
  title = 'Shop Jewelry by Category'
}: CategoryCollectionsGridProps) {
  const normalizedProducts = products.map((product) => ({
    ...product,
    categoryKey: product.category.trim().toLowerCase()
  }));

  const categoriesWithProducts = Array.from(
    new Set(normalizedProducts.map((product) => product.categoryKey).filter(Boolean))
  );

  const orderedByConfig = categories
    .map((category) => category.trim().toLowerCase())
    .filter((category) => category && categoriesWithProducts.includes(category));
  const remainingCategories = categoriesWithProducts
    .filter((category) => !orderedByConfig.includes(category))
    .sort((a, b) => a.localeCompare(b));
  const categoryKeys = [...orderedByConfig, ...remainingCategories];

  const collectionItems = categoryKeys
    .map((categoryKey) => {
      const match = normalizedProducts.find((product) => product.categoryKey === categoryKey);
      if (!match) {
        return null;
      }

      const mappedImage = categoryImages[categoryKey]?.trim();
      const image = mappedImage || match.primary_image_url || match.images?.[0] || fallbackImage;

      return {
        key: categoryKey,
        label: formatCategoryLabel(categoryKey),
        href: `/shop?category=${encodeURIComponent(categoryKey)}`,
        image
      };
    })
    .filter((item): item is { key: string; label: string; href: string; image: string } => Boolean(item));

  if (collectionItems.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-[1320px] bg-[#fcfcfb] px-4 py-12 sm:px-6 sm:py-16 lg:px-6 lg:py-20">
      <div className="mb-6 text-center sm:mb-8 lg:mb-10">
        <h2 className="text-[10px] uppercase tracking-luxury text-stone-500">Collections</h2>
        <h2 className="mt-4 font-serif text-4xl leading-none text-stone-950 sm:text-5xl">{title}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-stone-600">
          Explore rings, earrings, necklaces, and bracelets to build your signature everyday collection.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-4">
        {collectionItems.map((item) => (
          <Link key={item.key} href={item.href} className="group block">
            <div className="relative aspect-[4/4.65] overflow-hidden bg-stone-100">
              <Image
                src={optimizeCloudinaryImage(item.image, 1200)}
                alt={`${item.label} collection`}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-700 ease-luxury group-hover:scale-[1.06]"
              />
            </div>
            <div className="mt-3 flex items-center gap-2 text-stone-900 sm:mt-4">
              <span className="font-body text-lg leading-none sm:text-[1.75rem]">{item.label}</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4 transition-transform duration-500 ease-luxury group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.45"
              >
                <path d="M4 12h16" />
                <path d="M14 6l6 6-6 6" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
