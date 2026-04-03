'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { Product } from '@/lib/types';
import { ProductCard } from './product-card';

interface CollectionCarouselProps {
  items: Product[];
}

export function CollectionCarousel({ items }: CollectionCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [scrollState, setScrollState] = useState({
    hasOverflow: false,
    canScrollLeft: false,
    canScrollRight: false,
    step: 0
  });

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    const overflowAmount = track.scrollWidth - track.clientWidth;
    const hasOverflow = overflowAmount > 2;
    const canScrollLeft = track.scrollLeft > 2;
    const canScrollRight = track.scrollLeft < overflowAmount - 2;
    const cards = Array.from(track.children) as HTMLElement[];

    const step =
      cards.length > 1
        ? Math.max(cards[1].offsetLeft - cards[0].offsetLeft, 1)
        : cards[0]?.getBoundingClientRect().width || track.clientWidth;

    setScrollState({ hasOverflow, canScrollLeft, canScrollRight, step });
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    updateScrollState();

    track.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);

    return () => {
      track.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [items.length, updateScrollState]);

  function scrollByDirection(direction: 'left' | 'right') {
    const track = trackRef.current;
    if (!track || scrollState.step <= 0) {
      return;
    }

    const offset = direction === 'left' ? -scrollState.step : scrollState.step;
    track.scrollBy({ left: offset, behavior: 'smooth' });
  }

  const showLeftArrowMobile = scrollState.hasOverflow && scrollState.canScrollLeft;
  const showRightArrowMobile = scrollState.hasOverflow && scrollState.canScrollRight;
  const showLeftArrowDesktop = isHovered && scrollState.hasOverflow && scrollState.canScrollLeft;
  const showRightArrowDesktop = isHovered && scrollState.hasOverflow && scrollState.canScrollRight;

  return (
    <div className="relative" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <div
        ref={trackRef}
        className="flex items-start snap-x snap-mandatory gap-4 overflow-x-auto pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-6 sm:pb-3 [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <div key={item.id} className="min-w-[72vw] shrink-0 snap-start sm:min-w-[46vw] lg:min-w-[23.5%]">
            <ProductCard product={item} disableRevealAnimation />
          </div>
        ))}
      </div>

      {showLeftArrowMobile ? (
        <button
          type="button"
          onClick={() => scrollByDirection('left')}
          className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 shadow-[0_10px_24px_rgba(17,17,17,0.14)] md:hidden"
          aria-label="Scroll collection left"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.35">
            <path d="M14.5 5.5L8 12l6.5 6.5" />
          </svg>
        </button>
      ) : null}

      {showLeftArrowDesktop ? (
        <button
          type="button"
          onClick={() => scrollByDirection('left')}
          className="absolute left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 shadow-[0_10px_24px_rgba(17,17,17,0.14)] md:flex"
          aria-label="Scroll collection left"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.35">
            <path d="M14.5 5.5L8 12l6.5 6.5" />
          </svg>
        </button>
      ) : null}

      {showRightArrowMobile ? (
        <button
          type="button"
          onClick={() => scrollByDirection('right')}
          className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 shadow-[0_10px_24px_rgba(17,17,17,0.14)] md:hidden"
          aria-label="Scroll collection right"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.35">
            <path d="M9.5 5.5L16 12l-6.5 6.5" />
          </svg>
        </button>
      ) : null}

      {showRightArrowDesktop ? (
        <button
          type="button"
          onClick={() => scrollByDirection('right')}
          className="absolute right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 shadow-[0_10px_24px_rgba(17,17,17,0.14)] md:flex"
          aria-label="Scroll collection right"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.35">
            <path d="M9.5 5.5L16 12l-6.5 6.5" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
