'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { optimizeCloudinaryImage } from '@/lib/cloudinary';
import { formatPrice } from '@/lib/currency';
import { getDefaultVariant, getEffectiveProductState } from '@/lib/product-variants';
import type { Product } from '@/lib/types';
import { useCartStore } from '@/store/cart-store';
import { useCurrencyStore } from '@/store/currency-store';
import { useUiStore } from '@/store/ui-store';

interface ProductCardProps {
  product: Product;
  disableRevealAnimation?: boolean;
}

const fallbackImage = 'https://res.cloudinary.com/demo/image/upload/v1690000000/samples/ecommerce/accessories-bag.jpg';

export function ProductCard({ product, disableRevealAnimation = false }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const currency = useCurrencyStore((state) => state.currency);
  const showToast = useUiStore((state) => state.showToast);
  const defaultVariant = useMemo(() => getDefaultVariant(product), [product]);
  const effectiveState = useMemo(() => getEffectiveProductState(product, defaultVariant), [product, defaultVariant]);

  const lowStock = effectiveState.stock > 0 && effectiveState.stock < 5;
  const primaryImage = product.primary_image_url || product.images?.[0] || fallbackImage;
  const secondaryImage = product.secondary_image_url || product.images?.[1] || primaryImage;
  const hasPeekImage = Boolean(secondaryImage && secondaryImage !== primaryImage);

  const [isHovered, setIsHovered] = useState(false);
  const [isSecondaryLoaded, setIsSecondaryLoaded] = useState(!hasPeekImage);

  useEffect(() => {
    setIsSecondaryLoaded(!hasPeekImage);
  }, [hasPeekImage, secondaryImage]);
  const trimmedBadge = product.badge.trim();
  const badgeLabel = trimmedBadge
    ? trimmedBadge === 'NEW'
      ? 'NEW IN'
      : trimmedBadge === 'BESTSELLER'
        ? 'BEST SELLER'
        : trimmedBadge.toUpperCase()
    : '';

  function handleQuickAdd() {
    addItem(product, defaultVariant, defaultVariant?.option_values);
    showToast('Added to Box');
  }

  return (
    <motion.article
      initial={disableRevealAnimation ? false : { opacity: 0, y: 24 }}
      whileInView={disableRevealAnimation ? undefined : { opacity: 1, y: 0 }}
      viewport={disableRevealAnimation ? undefined : { once: true, amount: 0.2 }}
      transition={disableRevealAnimation ? undefined : { duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="group/card flex flex-col"
    >
      <div
        className="relative overflow-hidden bg-[#f7f7f7] touch-pan-y"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative aspect-[4/5] overflow-hidden">
          <Link href={`/product/${product.id}`} className="absolute inset-0 z-10" aria-label={`View ${product.name}`} />

          <div className="absolute inset-0">
            <Image
              src={optimizeCloudinaryImage(primaryImage, 1000)}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 46vw, 25vw"
              className={`object-cover transition-opacity duration-300 ease-in-out ${
                isHovered && hasPeekImage && isSecondaryLoaded ? 'opacity-0' : 'opacity-100'
              }`}
            />
          </div>

          {hasPeekImage ? (
            <div className="absolute inset-0">
              <Image
                src={optimizeCloudinaryImage(secondaryImage, 1000)}
                alt={`${product.name} alternate`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 46vw, 25vw"
                className={`object-cover transition-opacity duration-300 ease-in-out ${
                  isHovered && isSecondaryLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoadingComplete={() => setIsSecondaryLoaded(true)}
              />
            </div>
          ) : null}

          {badgeLabel ? (
            <span className="absolute left-2 top-2 z-20 border border-stone-200/70 bg-white/55 px-2 py-1 text-[9px] uppercase tracking-[0.18em] text-stone-700 backdrop-blur-[1px] sm:left-3 sm:top-3 sm:text-[10px]">
              {badgeLabel}
            </span>
          ) : null}
        </div>

        <div className="pointer-events-none absolute bottom-1.5 right-1.5 z-20 sm:bottom-2 sm:right-2">
          <button
            type="button"
            onClick={handleQuickAdd}
            className={`group/quick flex h-8 w-8 items-center justify-center border border-stone-200 bg-white text-[#1a1a1a] transition-all duration-300 ease-luxury sm:h-9 sm:w-9 ${
              isHovered
                ? 'pointer-events-auto translate-y-0 opacity-100'
                : 'pointer-events-auto translate-y-0 opacity-100 md:pointer-events-none md:translate-y-1 md:opacity-0'
            }`}
            aria-label={`Quick add ${product.name}`}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5 transition-transform duration-300 ease-out group-hover/quick:rotate-45 sm:h-4 sm:w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
            >
              <path d="M12 5V19" />
              <path d="M5 12H19" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-1.5 text-center sm:mt-4 sm:space-y-2">
        <Link href={`/product/${product.id}`} className="block font-serif text-[1.24rem] leading-none text-stone-950 sm:text-[1.45rem] lg:text-[1.65rem]">
          {product.name}
        </Link>
        <div className="flex items-center justify-center gap-2 text-[11px] text-stone-600 sm:text-[12px]">
          <span>{formatPrice(effectiveState.price, currency)}</span>
          {effectiveState.comparePrice > effectiveState.price ? (
            <span className="text-stone-400 line-through">{formatPrice(effectiveState.comparePrice, currency)}</span>
          ) : null}
        </div>
        <p className="text-[9px] uppercase tracking-luxury text-stone-500 sm:text-[10px]">{product.category}</p>
        {lowStock ? <p className="text-[9px] uppercase tracking-luxury text-red-700 sm:text-[10px]">Only {effectiveState.stock} left</p> : null}
      </div>
    </motion.article>
  );
}
