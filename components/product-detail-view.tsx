'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
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
import { getSocialProofSeed } from '@/lib/social-proof';
import type { Product } from '@/lib/types';
import { useCartStore } from '@/store/cart-store';
import { useCurrencyStore } from '@/store/currency-store';
import { useRecentlyViewedStore } from '@/store/recently-viewed-store';
import { useUiStore } from '@/store/ui-store';
import { ZIVAAD_WHATSAPP_NUMBER } from '@/lib/whatsapp';
import { RecentlyViewed } from '@/components/recently-viewed';

type Media =
  | { kind: 'image'; url: string }
  | { kind: 'video'; url: string };

interface ProductDetailViewProps {
  product: Product;
  pairsWellWith?: Product[];
  pdpNotice?: string;
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

export function ProductDetailView({ product, pairsWellWith = [], pdpNotice = '' }: ProductDetailViewProps) {
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);
  const currency = useCurrencyStore((state) => state.currency);
  const showToast = useUiStore((state) => state.showToast);
  const addProductId = useRecentlyViewedStore((state) => state.addProductId);

  useEffect(() => {
    addProductId(product.id);
  }, [product.id, addProductId]);

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
  const socialProof = useMemo(() => getSocialProofSeed(product.id), [product.id]);
  const ratingValue = useMemo(() => {
    const parsed = Number(product.rating);
    if (!Number.isFinite(parsed)) return 4.8;
    return Number(Math.min(5, Math.max(0, parsed)).toFixed(1));
  }, [product.rating]);
  const ratingCount = useMemo(() => {
    const parsed = Number(product.rating_count);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, Math.floor(parsed));
  }, [product.rating_count]);

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
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isZooming, setIsZooming] = useState(false);
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
  const [socialPillIndex, setSocialPillIndex] = useState(0);
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

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSocialPillIndex((prev) => (prev + 1) % 2);
    }, 3500);
    return () => window.clearInterval(interval);
  }, []);

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
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setZoomPos({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
              setIsZooming(true);
            }}
            onMouseLeave={() => setIsZooming(false)}
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
                  className={`object-cover transition-transform duration-300 ease-out ${isZooming ? 'scale-[2] cursor-zoom-in' : 'scale-100'}`}
                  style={isZooming ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined}
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

          {/* Mobile thumbnail strip */}
          {mediaItems.length > 1 ? (
            <div className="order-3 flex gap-1.5 overflow-x-auto py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:hidden">
              {mediaItems.map((media, index) => {
                const isActive = activeMedia.url === media.url && activeMedia.kind === media.kind;
                return (
                  <button
                    key={`mobile-thumb-${media.url}-${index}`}
                    type="button"
                    onClick={() => setActiveMediaByIndex(index)}
                    className={`relative h-14 w-14 shrink-0 overflow-hidden bg-stone-100 transition-opacity ${
                      isActive ? 'ring-1 ring-stone-400 opacity-100' : 'opacity-60'
                    }`}
                  >
                    {media.kind === 'video' ? (
                      <div className="flex h-full items-center justify-center bg-stone-900 text-[8px] uppercase tracking-luxury text-white">
                        Video
                      </div>
                    ) : (
                      <Image
                        src={optimizeCloudinaryImage(media.url, 200)}
                        alt={`${product.name} thumbnail ${index + 1}`}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="lg:sticky lg:top-24 lg:h-fit">
          <div className="bg-white p-1 sm:p-2">
            <p className="text-[10px] uppercase tracking-luxury text-stone-500">ZIVAAD</p>

            <h1 className="mt-3 font-serif text-[1.72rem] leading-[1.06] text-stone-950 sm:text-[2.3rem]">
              {product.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-stone-700">
              <span className="text-[#c9a24a]">★ ★ ★ ★ ★</span>
              <span>{ratingValue.toFixed(1)}</span>
              {ratingCount > 0 ? <span>({ratingCount})</span> : null}
              <span className="text-stone-500">Loved by customers across Pakistan</span>
            </div>

            {/* Social proof pills moved below Add to Bag */}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {effectiveState.comparePrice > effectiveState.price ? (
                <p className="text-sm text-stone-400 line-through">{formatPrice(effectiveState.comparePrice, currency)}</p>
              ) : null}
              <p className="text-[1.72rem] font-medium tracking-tight text-stone-950 sm:text-[2rem]">
                {formatPrice(effectiveState.price, currency)}
              </p>
              {product.sale_tag_enabled && effectiveState.comparePrice > effectiveState.price ? (
                <span className="rounded-full border border-stone-300 bg-stone-100 px-3 py-1 text-[10px] uppercase tracking-luxury text-stone-700">
                  Sale
                </span>
              ) : null}
              {effectiveState.comparePrice > effectiveState.price ? (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] uppercase tracking-wider font-medium text-white">
                  -{Math.round((1 - effectiveState.price / effectiveState.comparePrice) * 100)}% OFF
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-sm text-stone-600">Shipping calculated at checkout.</p>
            <p className="mt-3 max-w-[48ch] text-sm leading-relaxed text-stone-600">
              Designed for everyday elegance with a premium finish, skin-friendly wear, and timeless styling.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="flex items-start gap-2.5 border border-stone-200 bg-stone-50 px-3 py-2.5">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-[#b89a61]" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12h2l3 7h12l3-7h2" /><circle cx="9" cy="21" r="1" /><circle cx="18" cy="21" r="1" /><path d="M5 12V7a1 1 0 011-1h12a1 1 0 011 1v5" /></svg>
                <div>
                  <p className="text-[10px] uppercase tracking-luxury text-stone-900">Free Shipping</p>
                  <p className="mt-0.5 text-[9px] text-stone-500">Orders above Rs. 2,999</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 border border-stone-200 bg-stone-50 px-3 py-2.5">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-[#b89a61]" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 10h20" /><path d="M6 16h4" /></svg>
                <div>
                  <p className="text-[10px] uppercase tracking-luxury text-stone-900">Cash on Delivery</p>
                  <p className="mt-0.5 text-[9px] text-stone-500">Pay at your doorstep</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 border border-stone-200 bg-stone-50 px-3 py-2.5">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-[#b89a61]" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 014-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 01-4 4H3" /></svg>
                <div>
                  <p className="text-[10px] uppercase tracking-luxury text-stone-900">7-Day Exchange</p>
                  <p className="mt-0.5 text-[9px] text-stone-500">Easy returns</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 border border-stone-200 bg-stone-50 px-3 py-2.5">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-[#b89a61]" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                <div>
                  <p className="text-[10px] uppercase tracking-luxury text-stone-900">Secure Order</p>
                  <p className="mt-0.5 text-[9px] text-stone-500">Via WhatsApp</p>
                </div>
              </div>
            </div>

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
                  <p className="text-[10px] uppercase tracking-luxury text-red-700"><span className="relative mr-1.5 inline-flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span></span>Only {effectiveState.stock} left</p>
                ) : effectiveState.stock > 0 ? (
                  <p className="text-[10px] uppercase tracking-luxury text-stone-500">In stock</p>
                ) : (
                  <p className="text-[10px] uppercase tracking-luxury text-red-700">Sold out</p>
                )}
              </div>

              <div className="mt-5 border border-stone-200 bg-[#fcfcfb] px-3 py-3">
                <p className="text-[10px] uppercase tracking-luxury text-stone-500">Why this piece works</p>
                <ul className="mt-2 space-y-1.5 text-sm text-stone-700">
                  <li>• Premium anti-tarnish finish for everyday wear</li>
                  <li>• Lightweight comfort with refined, clean detailing</li>
                  <li>• Easy to style solo or stacked with other pieces</li>
                </ul>
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

              {lowStock ? (
                <p className="mt-2 text-[10px] uppercase tracking-luxury text-red-700">
                  <span className="relative mr-1.5 inline-flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span></span>Low stock: only {effectiveState.stock} left for immediate dispatch.
                </p>
              ) : null}

              <a
                href={`https://wa.me/${ZIVAAD_WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex w-full items-center justify-center border border-stone-300 px-6 py-3 text-[11px] uppercase tracking-luxury text-stone-700 transition-colors hover:border-stone-950 hover:text-stone-950"
              >
                Ask on WhatsApp Before Ordering
              </a>
              <p className="mt-2 text-center text-[10px] uppercase tracking-luxury text-stone-500">
                Need help with size, finish, or delivery timing? We respond quickly.
              </p>

              {/* PDP Notice */}
              {pdpNotice ? (
                <div className="mt-5 rounded border border-red-200 bg-red-50 px-4 py-3 text-center">
                  <p className="text-sm leading-relaxed text-stone-700">{pdpNotice}</p>
                </div>
              ) : null}

              {/* Fast Delivery + Social Proof */}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {/* Static Fast Delivery */}
                <div className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3.5 py-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-[13px] text-stone-700">
                    <span className="font-medium">Fast Delivery</span>, get by{' '}
                    <span className="font-medium">
                      {new Date(Date.now() + 3 * 86400000).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })}
                      {' – '}
                      {new Date(Date.now() + 5 * 86400000).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })}
                    </span>
                  </span>
                </div>

                {/* Rotating Social Proof */}
                <AnimatePresence mode="wait">
                  {socialPillIndex === 0 ? (
                    <motion.div
                      key="pill-cart"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3.5 py-2">
                        <span className="inline-block h-2 w-2 rounded-full bg-stone-500" />
                        <span className="text-[13px] font-medium text-stone-700">{socialProof.viewing * 10}+ customers added this to cart</span>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="pill-rating"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3.5 py-2">
                        <span className="text-[13px] text-stone-700">
                          <span className="text-[#c9a24a]">&#9733;</span> {ratingValue.toFixed(1)} rating &middot; {ratingCount > 0 ? `${ratingCount.toLocaleString()}+ reviews` : 'Loved by customers'}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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

          <div className="mt-6 divide-y divide-stone-200 border-y border-stone-200">
            <details className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-[11px] uppercase tracking-luxury text-stone-700">
                Size Guide
                <span className="text-stone-400 transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="mt-2 text-sm leading-relaxed text-stone-600">
                <p>Not sure about your size? Check our <a href="/size-guide" className="underline text-stone-900 hover:text-[#b89a61]">complete size guide</a> for rings, bracelets, and necklaces.</p>
              </div>
            </details>

            <details className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-[11px] uppercase tracking-luxury text-stone-700">
                Shipping & Delivery
                <span className="text-stone-400 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 max-w-[50ch] text-sm leading-relaxed text-stone-600">
                Orders are confirmed via WhatsApp and dispatched quickly. Typical delivery window is 3-5 business days
                across major cities in Pakistan.
              </p>
            </details>

            <details className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-[11px] uppercase tracking-luxury text-stone-700">
                Returns & Support
                <span className="text-stone-400 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 max-w-[50ch] text-sm leading-relaxed text-stone-600">
                For incorrect or damaged items, contact support within 24 hours of delivery. Our team guides the
                resolution directly on WhatsApp.
              </p>
            </details>

            <details className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-[11px] uppercase tracking-luxury text-stone-700">
                Care Guide
                <span className="text-stone-400 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 max-w-[50ch] text-sm leading-relaxed text-stone-600">
                Keep jewelry dry, avoid direct perfume contact, and store in a clean pouch after use to maintain finish
                and shine.
              </p>
            </details>
          </div>

          <div className="mt-6 border border-stone-200 bg-[#fcfcfb] p-4 sm:p-5">
            <p className="text-[10px] uppercase tracking-luxury text-stone-500">Why people love this</p>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-stone-700">
              <li>• Premium look that works from daywear to events</li>
              <li>• Comfortable fit with clean craftsmanship and polish</li>
              <li>• Fast delivery and direct support on WhatsApp</li>
            </ul>
          </div>

          {pairsWellWith.length > 0 ? (
            <div className="mt-6 border border-stone-200 bg-[#fcfcfb] p-4 sm:p-5">
              <div className="mb-3">
                <p className="text-[10px] uppercase tracking-luxury text-stone-500">Pairs Well With</p>
                <p className="mt-1 text-sm text-stone-600">Complete your look with these complementary pieces.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {pairsWellWith.slice(0, 2).map((item) => (
                  <Link
                    key={`pairs-${item.id}`}
                    href={`/product/${item.id}`}
                    className="group grid grid-cols-[72px_minmax(0,1fr)] gap-2 border border-stone-200 bg-white p-2.5 transition-colors hover:border-stone-950"
                  >
                    <div className="relative h-[88px] w-[72px] overflow-hidden bg-stone-100">
                      <Image
                        src={optimizeCloudinaryImage(item.primary_image_url || item.images?.[0] || fallbackImage, 420)}
                        alt={item.name}
                        fill
                        sizes="72px"
                        className="object-cover transition-transform duration-500 ease-luxury group-hover:scale-[1.04]"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-stone-900">{item.name}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-luxury text-stone-500">{item.category}</p>
                      <p className="mt-1.5 text-xs text-stone-700">{formatPrice(item.price, currency)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {/* Customer Reviews Section */}
          <div className="mt-6 border border-stone-200 bg-[#fcfcfb] p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="text-[10px] uppercase tracking-luxury text-stone-500">Customer Reviews</p>
                <Link
                  href="/write-review"
                  className="border border-stone-300 px-3 py-1.5 text-[10px] uppercase tracking-luxury text-stone-600 transition-colors hover:border-stone-950 hover:text-stone-950"
                >
                  Write a Review
                </Link>
              </div>
              {product.reviews && product.reviews.length > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-[#c9a24a] text-sm">
                    {Array.from({ length: 5 }, (_, i) => {
                      const avg = product.reviews!.reduce((sum, r) => sum + r.rating, 0) / product.reviews!.length;
                      return i < Math.round(avg) ? '\u2605' : '\u2606';
                    }).join('')}
                  </span>
                  <span className="text-xs text-stone-600">
                    ({product.reviews.length} {product.reviews.length === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              ) : null}
            </div>

            {!product.reviews || product.reviews.length === 0 ? (
              <p className="mt-3 text-sm text-stone-500">No reviews yet. Be the first to share your experience.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {product.reviews.map((review) => (
                  <div key={review.id} className="border border-stone-200 bg-white p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[#c9a24a] text-sm">
                        {Array.from({ length: 5 }, (_, i) => (i < review.rating ? '\u2605' : '\u2606')).join('')}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {new Date(review.date).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-xs font-medium text-stone-900">{review.name}</span>
                      {review.verified ? (
                        <span className="rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-[9px] uppercase tracking-wider font-medium text-green-700">
                          Verified Purchase
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-stone-600">{review.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
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
      <div className="px-4 pb-16 sm:px-8 lg:px-10">
        <RecentlyViewed currentProductId={product.id} currency={currency} />
      </div>
    </>
  );
}
