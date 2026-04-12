'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type MouseEvent, type TouchEvent } from 'react';

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
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const currency = useCurrencyStore((state) => state.currency);
  const showToast = useUiStore((state) => state.showToast);
  const defaultVariant = useMemo(() => getDefaultVariant(product), [product]);
  const effectiveState = useMemo(() => getEffectiveProductState(product, defaultVariant), [product, defaultVariant]);

  const lowStock = effectiveState.stock > 0 && effectiveState.stock < 5;
  const primaryImage = product.primary_image_url || product.images?.[0] || fallbackImage;
  const secondaryImage = product.secondary_image_url || product.images?.[1] || primaryImage;
  const hasPeekImage = Boolean(secondaryImage && secondaryImage !== primaryImage);
  const mobileGalleryImages = useMemo(() => {
    const source = [
      primaryImage,
      secondaryImage,
      ...(product.gallery_images || []),
      ...(product.images || [])
    ]
      .map((url) => url.trim())
      .filter(Boolean);

    return Array.from(new Set(source)).slice(0, 6);
  }, [primaryImage, secondaryImage, product.gallery_images, product.images]);
  const hasMobileGallery = mobileGalleryImages.length > 1;

  const [isHovered, setIsHovered] = useState(false);
  const [isSecondaryLoaded, setIsSecondaryLoaded] = useState(!hasPeekImage);
  const [mobileMediaIndex, setMobileMediaIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const mobileDidSwipeRef = useRef(false);

  useEffect(() => {
    setIsSecondaryLoaded(!hasPeekImage);
  }, [hasPeekImage, secondaryImage]);

  useEffect(() => {
    setMobileMediaIndex(0);
  }, [product.id, mobileGalleryImages.length]);
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

  function goToMobileImage(index: number) {
    const total = mobileGalleryImages.length;
    if (total === 0) {
      return;
    }

    if (index < 0) {
      setMobileMediaIndex(total - 1);
      return;
    }

    if (index >= total) {
      setMobileMediaIndex(0);
      return;
    }

    setMobileMediaIndex(index);
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (!hasMobileGallery) {
      return;
    }
    mobileDidSwipeRef.current = false;
    setTouchStartX(event.touches[0]?.clientX ?? null);
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (!hasMobileGallery || touchStartX === null) {
      setTouchStartX(null);
      return;
    }

    const endX = event.changedTouches[0]?.clientX ?? touchStartX;
    const deltaX = endX - touchStartX;
    const threshold = 28;
    if (Math.abs(deltaX) > threshold) {
      mobileDidSwipeRef.current = true;
      goToMobileImage(mobileMediaIndex + (deltaX < 0 ? 1 : -1));
    }
    setTouchStartX(null);
  }

  function handleMobileMediaClick(event: MouseEvent<HTMLDivElement>) {
    if (mobileDidSwipeRef.current) {
      mobileDidSwipeRef.current = false;
      return;
    }

    event.preventDefault();
    router.push(`/product/${product.id}`);
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
          <Link
            href={`/product/${product.id}`}
            className="absolute inset-0 z-10 hidden md:block"
            aria-label={`View ${product.name}`}
          />

          <div className="absolute inset-0 md:hidden" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onClick={handleMobileMediaClick}>
            <div
              className="flex h-full w-full transition-transform duration-500 ease-luxury"
              style={{ transform: `translateX(-${mobileMediaIndex * 100}%)` }}
            >
              {mobileGalleryImages.map((imageUrl, index) => (
                <div key={`${imageUrl}-${index}`} className="relative h-full w-full shrink-0">
                  <Image
                    src={optimizeCloudinaryImage(imageUrl, 1000)}
                    alt={product.name}
                    fill
                    sizes="50vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>

            {hasMobileGallery ? (
              <>
                <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-black/10 to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-black/10 to-transparent" />
                <div className="absolute right-2 top-2 bg-black/30 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] text-white backdrop-blur-[1px]">
                  {mobileMediaIndex + 1}/{mobileGalleryImages.length}
                </div>
                <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
                  {mobileGalleryImages.map((_, index) => (
                    <button
                      key={`dot-${product.id}-${index}`}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        goToMobileImage(index);
                      }}
                      aria-label={`Show image ${index + 1}`}
                      className={`h-1.5 w-1.5 rounded-full transition-all ${
                        index === mobileMediaIndex ? 'bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]' : 'bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </div>

          <div className="absolute inset-0 hidden md:block">
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
            <div className="absolute inset-0 hidden md:block">
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
        <Link
          href={`/product/${product.id}`}
          className="block font-serif text-[0.98rem] leading-tight text-stone-950 sm:text-[1.22rem] lg:text-[1.45rem]"
        >
          {product.name}
        </Link>
        <div className="flex items-center justify-center gap-2 text-[10px] text-stone-600 sm:text-[12px]">
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
