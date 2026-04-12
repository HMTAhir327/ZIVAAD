'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useMemo, useState, type TouchEvent } from 'react';

import { optimizeCloudinaryImage, optimizeCloudinaryVideo } from '@/lib/cloudinary';
import { formatPrice } from '@/lib/currency';
import {
  buildInitialVariantSelection,
  findMatchingVariant,
  formatSelectedOptions,
  getDefaultVariant,
  getEffectiveProductState,
  getOptionValueAvailability,
  getProductVariantData
} from '@/lib/product-variants';
import { renderRichTextHtml } from '@/lib/rich-text';
import type { Product } from '@/lib/types';
import { useCartStore } from '@/store/cart-store';
import { useCurrencyStore } from '@/store/currency-store';
import { useUiStore } from '@/store/ui-store';

type Media =
  | { kind: 'image'; url: string }
  | { kind: 'video'; url: string };

interface ProductDetailViewProps {
  product: Product;
}

const fallbackImage =
  'https://res.cloudinary.com/demo/image/upload/v1690000000/samples/ecommerce/accessories-bag.jpg';

const COLOR_MAP: Record<string, string> = {
  black: '#111111',
  white: '#f5f5f4',
  gold: '#c9a24a',
  silver: '#bfc3c9',
  rose: '#b76e79',
  'rose gold': '#b9897d',
  red: '#b91c1c',
  green: '#166534',
  blue: '#1d4ed8',
  pink: '#e879a6'
};

function isColorOption(optionName: string): boolean {
  const key = optionName.trim().toLowerCase();
  return key === 'color' || key === 'colour' || key.includes('color') || key.includes('colour');
}

function isSizeOption(optionName: string): boolean {
  const key = optionName.trim().toLowerCase();
  return key.includes('size') || key.includes('ring size');
}

function getColorSwatch(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (/^#([a-f0-9]{3}|[a-f0-9]{6})$/i.test(normalized)) {
    return normalized;
  }

  if (COLOR_MAP[normalized]) {
    return COLOR_MAP[normalized];
  }

  if (normalized.includes('rose') && normalized.includes('gold')) {
    return COLOR_MAP['rose gold'];
  }

  if (normalized.includes('gold')) {
    return COLOR_MAP.gold;
  }

  if (normalized.includes('silver')) {
    return COLOR_MAP.silver;
  }

  return '#d6d3d1';
}

function getConfiguredColorSwatch(
  product: Product,
  optionName: string,
  optionValue: string
): string | undefined {
  const swatches = product.option_swatches;
  if (!swatches) {
    return undefined;
  }

  const directOption = swatches[optionName];
  if (directOption?.[optionValue]) {
    return directOption[optionValue];
  }

  const optionKey = Object.keys(swatches).find((key) => key.toLowerCase() === optionName.toLowerCase());
  if (!optionKey) {
    return undefined;
  }

  const valueKey = Object.keys(swatches[optionKey]).find((key) => key.toLowerCase() === optionValue.toLowerCase());
  return valueKey ? swatches[optionKey][valueKey] : undefined;
}

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);
  const currency = useCurrencyStore((state) => state.currency);
  const showToast = useUiStore((state) => state.showToast);
  const variantData = useMemo(() => getProductVariantData(product), [product]);
  const hasVariants = variantData.options.length > 0 && variantData.variants.length > 0;
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => buildInitialVariantSelection(product));

  useEffect(() => {
    setSelectedOptions(buildInitialVariantSelection(product));
  }, [product]);

  const selectedVariant = useMemo(() => {
    if (!hasVariants) {
      return undefined;
    }

    return findMatchingVariant(product, selectedOptions) || getDefaultVariant(product);
  }, [hasVariants, product, selectedOptions]);

  const effectiveState = useMemo(
    () => getEffectiveProductState(product, selectedVariant),
    [product, selectedVariant]
  );
  const selectedOptionsSummary = useMemo(() => formatSelectedOptions(selectedOptions), [selectedOptions]);
  const descriptionHtml = useMemo(() => renderRichTextHtml(product.description), [product.description]);

  const mediaItems: Media[] = useMemo(() => {
    const variantImage = selectedVariant?.image_url?.trim();
    const gallery =
      product.gallery_images && product.gallery_images.length > 0
        ? product.gallery_images
        : product.images && product.images.length > 0
          ? product.images
          : [product.primary_image_url || fallbackImage];
    const mergedGallery = variantImage ? [variantImage, ...gallery.filter((url) => url !== variantImage)] : gallery;

    const imageItems = mergedGallery.map((url) => ({ kind: 'image' as const, url }));
    const videoItem = product.video_url?.trim() ? [{ kind: 'video' as const, url: product.video_url }] : [];

    return [...imageItems, ...videoItem];
  }, [product.gallery_images, product.images, product.primary_image_url, product.video_url, selectedVariant?.image_url]);
  const [activeMedia, setActiveMedia] = useState<Media>(mediaItems[0]);

  useEffect(() => {
    if (mediaItems.length === 0) {
      return;
    }

    setActiveMedia((current) => {
      const matching = mediaItems.find((media) => media.url === current.url && media.kind === current.kind);
      return matching || mediaItems[0];
    });
  }, [mediaItems]);

  useEffect(() => {
    const variantImage = selectedVariant?.image_url?.trim();
    if (!variantImage) {
      return;
    }

    const match = mediaItems.find((media) => media.kind === 'image' && media.url === variantImage);
    if (match) {
      setActiveMedia(match);
    }
  }, [selectedVariant?.id, selectedVariant?.image_url, mediaItems]);

  const imageMediaItems = useMemo(() => mediaItems.filter((media) => media.kind === 'image'), [mediaItems]);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [mobileTouchStartX, setMobileTouchStartX] = useState<number | null>(null);
  const [fullscreenTouchStartX, setFullscreenTouchStartX] = useState<number | null>(null);
  const activeMediaIndex = useMemo(() => {
    return mediaItems.findIndex((media) => media.kind === activeMedia.kind && media.url === activeMedia.url);
  }, [mediaItems, activeMedia.kind, activeMedia.url]);
  const activeImageIndex = useMemo(() => {
    return imageMediaItems.findIndex((media) => media.url === activeMedia.url);
  }, [imageMediaItems, activeMedia.url]);

  useEffect(() => {
    if (!isFullscreenOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFullscreenOpen]);

  useEffect(() => {
    if (isFullscreenOpen && activeMedia.kind !== 'image') {
      setIsFullscreenOpen(false);
    }
  }, [activeMedia.kind, isFullscreenOpen]);

  function setActiveMediaByIndex(index: number) {
    if (mediaItems.length === 0) {
      return;
    }

    const normalized = (index + mediaItems.length) % mediaItems.length;
    setActiveMedia(mediaItems[normalized]);
  }

  function setActiveImageByIndex(index: number) {
    if (imageMediaItems.length === 0) {
      return;
    }

    const normalized = (index + imageMediaItems.length) % imageMediaItems.length;
    setActiveMedia(imageMediaItems[normalized]);
  }

  function handleMainTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (mediaItems.length <= 1) {
      return;
    }
    setMobileTouchStartX(event.touches[0]?.clientX ?? null);
  }

  function handleMainTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (mediaItems.length <= 1 || mobileTouchStartX === null) {
      setMobileTouchStartX(null);
      return;
    }

    const endX = event.changedTouches[0]?.clientX ?? mobileTouchStartX;
    const deltaX = endX - mobileTouchStartX;
    if (Math.abs(deltaX) > 28) {
      setActiveMediaByIndex(activeMediaIndex + (deltaX < 0 ? 1 : -1));
    }
    setMobileTouchStartX(null);
  }

  function handleFullscreenTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (imageMediaItems.length <= 1) {
      return;
    }
    setFullscreenTouchStartX(event.touches[0]?.clientX ?? null);
  }

  function handleFullscreenTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (imageMediaItems.length <= 1 || fullscreenTouchStartX === null) {
      setFullscreenTouchStartX(null);
      return;
    }

    const endX = event.changedTouches[0]?.clientX ?? fullscreenTouchStartX;
    const deltaX = endX - fullscreenTouchStartX;
    if (Math.abs(deltaX) > 28) {
      setActiveImageByIndex(activeImageIndex + (deltaX < 0 ? 1 : -1));
    }
    setFullscreenTouchStartX(null);
  }

  const lowStock = effectiveState.stock > 0 && effectiveState.stock < 5;
  const canAddToBag = effectiveState.stock > 0;
  const [quantity, setQuantity] = useState(1);
  const maxQuantity = Math.max(1, Math.min(10, effectiveState.stock));
  const optionAvailabilityByName = useMemo(() => {
    const map: Record<string, Record<string, boolean>> = {};

    variantData.options.forEach((option) => {
      map[option.name] = getOptionValueAvailability(product, selectedOptions, option.name);
    });

    return map;
  }, [product, selectedOptions, variantData.options]);

  useEffect(() => {
    setQuantity(1);
  }, [product.id, selectedVariant?.id]);

  useEffect(() => {
    setQuantity((prev) => Math.min(Math.max(prev, 1), maxQuantity));
  }, [maxQuantity]);

  function handleAddToBag() {
    if (!canAddToBag) {
      return;
    }

    addItem(product, selectedVariant, selectedOptions, quantity);
    showToast(`Added ${quantity} to Box`);
    openCart();
  }

  return (
    <>
      <section className="grid w-full gap-8 px-4 pb-16 pt-4 sm:px-8 sm:pb-20 sm:pt-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-14 lg:px-10">
        <div className="flex flex-col gap-2.5 sm:gap-4 lg:grid lg:max-w-[760px] lg:grid-cols-[4.5rem_minmax(0,1fr)] lg:items-start">
          <div className="order-2 hidden gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-3 md:flex lg:order-1 lg:max-h-[min(62vh,720px)] lg:block lg:space-y-3 lg:overflow-y-auto lg:pr-1 [&::-webkit-scrollbar]:hidden">
            {mediaItems.map((media, index) => {
              const isActive = activeMedia.url === media.url;
              return (
                <button
                  key={`${media.url}-${index}`}
                  type="button"
                  onClick={() => setActiveMedia(media)}
                  className={`relative block h-16 w-16 shrink-0 overflow-hidden bg-stone-100 transition-opacity sm:h-20 sm:w-20 lg:aspect-square lg:h-auto lg:w-full ${
                    isActive ? 'ring-1 ring-stone-400 opacity-100' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {media.kind === 'video' ? (
                    <div className="flex h-full items-center justify-center bg-stone-900 text-xs uppercase tracking-luxury text-white">
                      Video
                    </div>
                  ) : (
                    <Image
                      src={optimizeCloudinaryImage(media.url, 300)}
                      alt={`${product.name} preview ${index + 1}`}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div
            className="order-1 relative aspect-[4/5] overflow-hidden bg-stone-100 lg:order-2"
            onTouchStart={handleMainTouchStart}
            onTouchEnd={handleMainTouchEnd}
          >
            {activeMedia.kind === 'video' ? (
              <video
                className="h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
              >
                <source src={optimizeCloudinaryVideo(activeMedia.url, 1200)} type="video/mp4" />
              </video>
            ) : (
              <>
                <Image
                  src={optimizeCloudinaryImage(activeMedia.url, 1200)}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) calc(100vw - 7rem), 48vw"
                  className="object-cover transition-transform duration-700 ease-luxury hover:scale-[1.03]"
                />
                <button
                  type="button"
                  onClick={() => setIsFullscreenOpen(true)}
                  className="absolute left-2 top-2 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/60 bg-black/30 text-white backdrop-blur-[1px] md:hidden"
                  aria-label="Open image in fullscreen"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M8 3H3v5" />
                    <path d="M16 3h5v5" />
                    <path d="M3 16v5h5" />
                    <path d="M21 16v5h-5" />
                  </svg>
                </button>
              </>
            )}

            {mediaItems.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => setActiveMediaByIndex(activeMediaIndex - 1)}
                  className="absolute left-2 top-1/2 z-20 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-black/25 text-white md:hidden"
                  aria-label="Previous media"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M15 5l-7 7 7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMediaByIndex(activeMediaIndex + 1)}
                  className="absolute right-2 top-1/2 z-20 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-black/25 text-white md:hidden"
                  aria-label="Next media"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <span className="absolute right-2 top-2 z-20 border border-white/50 bg-black/30 px-2 py-1 text-[9px] uppercase tracking-luxury text-white md:hidden">
                  {Math.max(activeMediaIndex + 1, 1)}/{mediaItems.length}
                </span>
                <div className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 md:hidden">
                  {mediaItems.map((media, index) => {
                    const active = index === activeMediaIndex;
                    return (
                      <button
                        key={`${media.kind}-${media.url}-dot`}
                        type="button"
                        onClick={() => setActiveMediaByIndex(index)}
                        aria-label={`Show media ${index + 1}`}
                        className={`h-1.5 rounded-full transition-all ${
                          active ? 'w-4 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]' : 'w-1.5 bg-white/65'
                        }`}
                      />
                    );
                  })}
                </div>
              </>
            ) : null}
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:h-fit">
          <div className="bg-white p-1 sm:p-2">
            <p className="text-[10px] uppercase tracking-luxury text-stone-500">ZIVAAD</p>

            <h1 className="mt-3 font-serif text-[2.1rem] leading-tight text-stone-950 sm:text-[2.45rem]">
              {product.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {effectiveState.comparePrice > effectiveState.price ? (
                <p className="text-sm text-stone-400 line-through">{formatPrice(effectiveState.comparePrice, currency)}</p>
              ) : null}
              <p className="text-[2rem] font-medium tracking-tight text-stone-950 sm:text-[2.2rem]">
                {formatPrice(effectiveState.price, currency)}
              </p>
              {product.sale_tag_enabled && effectiveState.comparePrice > effectiveState.price ? (
                <span className="rounded-full border border-stone-300 bg-stone-100 px-3 py-1 text-[10px] uppercase tracking-luxury text-stone-700">
                  Sale
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-sm text-stone-600">Shipping calculated at checkout.</p>

            <div className="mt-6 border-t border-stone-200 pt-5">
              {hasVariants ? (
                <div className="space-y-4">
                  {variantData.options.map((option) => {
                    const colorOption = isColorOption(option.name);
                    const sizeOption = isSizeOption(option.name);
                    const selectedValue = selectedOptions[option.name] || '';

                    return (
                      <div key={option.name}>
                        <p className="text-[10px] uppercase tracking-luxury text-stone-500">
                          {option.name}
                          {selectedValue ? (
                            <span className="ml-2 text-stone-700 normal-case tracking-normal">{selectedValue}</span>
                          ) : null}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {option.values.map((value) => {
                            const isSelected = selectedValue.toLowerCase() === value.toLowerCase();
                            const isAvailable = optionAvailabilityByName[option.name]?.[value] ?? true;

                            if (colorOption) {
                              const configured = getConfiguredColorSwatch(product, option.name, value);
                              const swatchColor = configured || getColorSwatch(value);

                              return (
                                <button
                                  key={`${option.name}-${value}`}
                                  type="button"
                                  onClick={() => setSelectedOptions((prev) => ({ ...prev, [option.name]: value }))}
                                  disabled={!isAvailable}
                                  className={`relative h-9 w-9 rounded-full border transition-all ${
                                    isSelected ? 'border-stone-950 ring-1 ring-stone-950 ring-offset-1' : 'border-stone-300'
                                  } ${isAvailable ? 'hover:scale-[1.04]' : 'cursor-not-allowed opacity-40'}`}
                                  style={{ backgroundColor: swatchColor }}
                                  aria-label={`${option.name}: ${value}`}
                                  title={value}
                                >
                                  {!isAvailable ? (
                                    <span className="absolute inset-x-1/2 top-1 h-7 w-px -translate-x-1/2 rotate-45 bg-stone-500/70" />
                                  ) : null}
                                </button>
                              );
                            }

                            if (sizeOption) {
                              return (
                                <button
                                  key={`${option.name}-${value}`}
                                  type="button"
                                  onClick={() => setSelectedOptions((prev) => ({ ...prev, [option.name]: value }))}
                                  disabled={!isAvailable}
                                  className={`h-10 min-w-10 rounded-full border px-3 text-xs uppercase tracking-luxury transition-colors ${
                                    isSelected
                                      ? 'border-stone-950 bg-stone-950 text-white'
                                      : isAvailable
                                        ? 'border-stone-300 text-stone-700 hover:border-stone-900 hover:text-stone-900'
                                        : 'cursor-not-allowed border-stone-200 text-stone-400'
                                  }`}
                                >
                                  {value}
                                </button>
                              );
                            }

                            return (
                              <button
                                key={`${option.name}-${value}`}
                                type="button"
                                onClick={() => setSelectedOptions((prev) => ({ ...prev, [option.name]: value }))}
                                disabled={!isAvailable}
                                className={`border px-3 py-2 text-[11px] uppercase tracking-luxury transition-colors ${
                                  isSelected
                                    ? 'border-stone-950 bg-stone-950 text-white'
                                    : isAvailable
                                      ? 'border-stone-300 text-stone-700 hover:border-stone-900 hover:text-stone-900'
                                      : 'cursor-not-allowed border-stone-200 text-stone-400'
                                }`}
                              >
                                {value}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {selectedOptionsSummary ? <p className="text-xs text-stone-600">Selected: {selectedOptionsSummary}</p> : null}
                  {selectedVariant?.sku ? <p className="text-xs text-stone-500">SKU: {selectedVariant.sku}</p> : null}
                </div>
              ) : null}

              <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <p className="text-[10px] uppercase tracking-luxury text-stone-500">Quantity</p>
                  <div className="mt-2 inline-flex items-center border border-stone-300">
                    <button
                      type="button"
                      onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                      className="h-10 w-10 text-lg text-stone-700"
                    >
                      -
                    </button>
                    <span className="inline-flex min-w-10 items-center justify-center px-2 text-sm text-stone-900">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((prev) => Math.min(maxQuantity, prev + 1))}
                      className="h-10 w-10 text-lg text-stone-700"
                    >
                      +
                    </button>
                  </div>
                </div>

                {lowStock ? (
                  <p className="text-[10px] uppercase tracking-luxury text-red-700">Only {effectiveState.stock} left</p>
                ) : effectiveState.stock > 0 ? (
                  <p className="text-[10px] uppercase tracking-luxury text-stone-500">In stock</p>
                ) : (
                  <p className="text-[10px] uppercase tracking-luxury text-red-700">Sold out</p>
                )}
              </div>

              <button
                type="button"
                onClick={handleAddToBag}
                disabled={!canAddToBag}
                className="mt-6 w-full bg-stone-950 px-6 py-3.5 text-xs uppercase tracking-luxury text-white transition-opacity duration-500 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {canAddToBag
                  ? `Add ${quantity} to Bag · ${formatPrice(effectiveState.price * quantity, currency)}`
                  : 'Sold Out'}
              </button>
            </div>
          </div>

          {descriptionHtml ? (
            <div className="mt-7 border-t border-stone-200 pt-6">
              <h2 className="text-[10px] uppercase tracking-luxury text-stone-500">Description</h2>
              <div
                className="mt-3 space-y-3 text-sm leading-relaxed text-stone-700 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-stone-300 [&_blockquote]:pl-4 [&_h3]:font-serif [&_h3]:text-2xl [&_h4]:font-serif [&_h4]:text-xl [&_li]:ml-5 [&_ol]:list-decimal [&_p]:mb-3 [&_ul]:list-disc"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            </div>
          ) : null}
        </div>
      </section>

      <div className="fixed inset-x-4 bottom-4 z-30 md:hidden">
        <button
          type="button"
          onClick={handleAddToBag}
          disabled={!canAddToBag}
          className="w-full bg-stone-950 px-6 py-3.5 text-xs uppercase tracking-luxury text-white shadow-2xl disabled:cursor-not-allowed disabled:opacity-40"
        >
          {canAddToBag ? `Add ${quantity} · ${formatPrice(effectiveState.price * quantity, currency)}` : 'Sold Out'}
        </button>
      </div>

      <AnimatePresence>
        {isFullscreenOpen && activeMedia.kind === 'image' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[130] bg-black/95 md:hidden"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
                <p className="text-[10px] uppercase tracking-luxury text-white/70">
                  Image {Math.max(activeImageIndex + 1, 1)} / {imageMediaItems.length}
                </p>
                <button
                  type="button"
                  onClick={() => setIsFullscreenOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/40 text-white"
                  aria-label="Close fullscreen image"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M6 6l12 12" />
                    <path d="M18 6L6 18" />
                  </svg>
                </button>
              </div>

              <div
                className="relative mx-4 flex-1 overflow-hidden rounded-sm bg-black"
                onTouchStart={handleFullscreenTouchStart}
                onTouchEnd={handleFullscreenTouchEnd}
              >
                <Image
                  src={optimizeCloudinaryImage(activeMedia.url, 1800)}
                  alt={product.name}
                  fill
                  sizes="100vw"
                  className="object-contain"
                  priority
                />
                {imageMediaItems.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveImageByIndex(activeImageIndex - 1)}
                      className="absolute left-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/35 text-white"
                      aria-label="Previous image"
                    >
                      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M15 5l-7 7 7 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveImageByIndex(activeImageIndex + 1)}
                      className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/35 text-white"
                      aria-label="Next image"
                    >
                      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                ) : null}
              </div>

              {imageMediaItems.length > 1 ? (
                <div className="mt-3 flex gap-2 overflow-x-auto px-4 pb-[max(0.9rem,env(safe-area-inset-bottom))] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {imageMediaItems.map((media, index) => {
                    const isActive = media.url === activeMedia.url;
                    return (
                      <button
                        key={`${media.url}-${index}`}
                        type="button"
                        onClick={() => setActiveMedia(media)}
                        className={`relative h-14 w-14 shrink-0 overflow-hidden border ${
                          isActive ? 'border-white' : 'border-white/35'
                        }`}
                      >
                        <Image
                          src={optimizeCloudinaryImage(media.url, 220)}
                          alt={`${product.name} image ${index + 1}`}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="pb-[max(0.9rem,env(safe-area-inset-bottom))]" />
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
