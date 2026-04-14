'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { useCartStore } from '@/store/cart-store';
import type { SiteContent } from '@/lib/types';

const primaryLinks = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/collection', label: 'Collections' },
  { href: '/contact', label: 'Contact' }
];

const mobilePrimaryLinks = primaryLinks.filter((item) => item.href !== '/collection');

const collectionLinks = [
  { href: '/shop?category=rings', label: 'Rings' },
  { href: '/shop?category=earrings', label: 'Earrings' },
  { href: '/shop?category=necklaces', label: 'Necklaces' },
  { href: '/shop?category=jewellery%20set', label: 'Sets' },
  { href: '/shop?category=bracelets', label: 'Bracelets' }
];

const defaultPromoMessages = [
  '1000/- Advance Required on Orders Above 5000/-',
  'Free Delivery On Orders Above 2999/-'
];
const defaultTrustMarqueeItems = ['Pure Stainless Steel', '20k+ Satisfied Customers', 'Cash on Delivery', 'WhatsApp Support'];

const quickSearchLinks = [
  { href: '/shop?category=rings', label: 'Rings' },
  { href: '/shop?category=earrings', label: 'Earrings' },
  { href: '/shop?category=necklaces', label: 'Necklaces' },
  { href: '/shop?category=jewellery%20set', label: 'Sets' },
  { href: '/shop?category=bracelets', label: 'Bracelets' }
];

function MenuIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16L21 21" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M5 8.5h14l-1.2 12H6.2L5 8.5Z" />
      <path d="M8.5 8.5V7A3.5 3.5 0 0 1 12 3.5 3.5 3.5 0 0 1 15.5 7v1.5" />
    </svg>
  );
}

interface NavbarProps {
  settings: SiteContent['settings'];
}

function formatCountdownParts(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(safe / 86400);
  const hours = Math.floor((safe % 86400) / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  return {
    days: String(days).padStart(2, '0'),
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0')
  };
}

function getFixedCountdown(endAt: string, nowMs: number) {
  const endMs = Date.parse(endAt);
  if (!Number.isFinite(endMs)) {
    return { days: '00', hours: '00', minutes: '00', seconds: '00' };
  }

  return formatCountdownParts((endMs - nowMs) / 1000);
}

function getRepeatingCountdown(
  cycleSeconds: number,
  anchorHour: number,
  anchorMinute: number,
  nowMs: number
) {
  const safeCycle = Math.max(1, Math.floor(cycleSeconds));
  const now = new Date(nowMs);
  const anchor = new Date(now);
  anchor.setHours(anchorHour, anchorMinute, 0, 0);

  if (now.getTime() < anchor.getTime()) {
    anchor.setDate(anchor.getDate() - 1);
  }

  const elapsedSeconds = Math.floor((now.getTime() - anchor.getTime()) / 1000);
  const offset = ((elapsedSeconds % safeCycle) + safeCycle) % safeCycle;
  const remaining = safeCycle - offset;

  return formatCountdownParts(remaining === 0 ? safeCycle : remaining);
}

export function Navbar({ settings }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isSaleCounterDismissed, setIsSaleCounterDismissed] = useState(false);
  const [promoIndex, setPromoIndex] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const { getItemCount, openCart } = useCartStore((state) => ({
    getItemCount: state.getItemCount,
    openCart: state.openCart
  }));

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsSearchOpen(false);
        setIsMenuOpen(false);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!isSearchOpen && !isMenuOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isSearchOpen, isMenuOpen]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const promoMessages = settings.promo_messages.length > 0 ? settings.promo_messages : defaultPromoMessages;
  const trustMarqueeItems = settings.trust_marquee_items.length > 0 ? settings.trust_marquee_items : defaultTrustMarqueeItems;
  const trustUtilityItems = trustMarqueeItems.slice(0, 4);
  const showSaleCounter = settings.sale_counter_enabled && !isSaleCounterDismissed;
  const saleCountdown = settings.sale_counter_repeat_enabled
    ? getRepeatingCountdown(
        settings.sale_counter_cycle_seconds,
        settings.sale_counter_anchor_hour,
        settings.sale_counter_anchor_minute,
        nowMs
      )
    : getFixedCountdown(settings.sale_counter_end_at, nowMs);

  useEffect(() => {
    if (promoMessages.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setPromoIndex((prev) => (prev + 1) % Math.max(promoMessages.length, 1));
    }, 3600);

    return () => window.clearInterval(interval);
  }, [promoMessages.length]);

  useEffect(() => {
    if (!showSaleCounter) {
      return;
    }

    const interval = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [showSaleCounter]);

  const itemCount = getItemCount();

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = searchText.trim();
    setIsSearchOpen(false);

    if (!query) {
      router.push('/shop');
      return;
    }

    router.push(`/shop?q=${encodeURIComponent(query)}`);
  }

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[90] border-b transition-all duration-500 ease-luxury ${
          isScrolled ? 'border-stone-200 bg-white/96 backdrop-blur-xl' : 'border-transparent bg-white/35 backdrop-blur-md'
        } max-lg:border-stone-200 max-lg:bg-white/96 max-lg:backdrop-blur-xl`}
      >
        {showSaleCounter ? (
          <div className="relative overflow-hidden border-b border-[#d9c292] bg-[#f8f2e5]">
            <Link href="/shop?sale=1" className="relative flex min-h-10 flex-col items-center justify-center gap-1 px-8 py-2 sm:min-h-12 sm:flex-row sm:gap-3 sm:px-6 lg:px-10">
              <div className="flex items-center gap-2 sm:gap-3">
                <p className="font-serif text-[14px] text-[#b59456] sm:text-[17px]">{settings.sale_counter_title}</p>
                <span className="rounded-full bg-[#b89a61] px-2.5 py-0.5 text-[8px] uppercase tracking-[0.16em] text-white sm:px-3.5 sm:py-1 sm:text-[10px]">
                  {settings.sale_counter_badge}
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <p className="text-[9px] uppercase tracking-[0.14em] text-stone-500 sm:text-[10px]">
                  {settings.sale_counter_subtitle}
                </p>
                <div className="flex items-center gap-[3px] text-stone-900 [font-variant-numeric:tabular-nums]">
                  <span className="inline-flex min-w-[26px] items-center justify-center rounded bg-stone-900 px-1 py-0.5 text-[13px] font-semibold leading-none text-white sm:min-w-[32px] sm:px-1.5 sm:py-1 sm:text-[16px]">{saleCountdown.days}</span>
                  <span className="text-[10px] text-stone-400">:</span>
                  <span className="inline-flex min-w-[26px] items-center justify-center rounded bg-stone-900 px-1 py-0.5 text-[13px] font-semibold leading-none text-white sm:min-w-[32px] sm:px-1.5 sm:py-1 sm:text-[16px]">{saleCountdown.hours}</span>
                  <span className="text-[10px] text-stone-400">:</span>
                  <span className="inline-flex min-w-[26px] items-center justify-center rounded bg-stone-900 px-1 py-0.5 text-[13px] font-semibold leading-none text-white sm:min-w-[32px] sm:px-1.5 sm:py-1 sm:text-[16px]">{saleCountdown.minutes}</span>
                  <span className="text-[10px] text-stone-400">:</span>
                  <span className="inline-flex min-w-[26px] items-center justify-center rounded bg-stone-900 px-1 py-0.5 text-[13px] font-semibold leading-none text-white sm:min-w-[32px] sm:px-1.5 sm:py-1 sm:text-[16px]">{saleCountdown.seconds}</span>
                </div>
                <span className="hidden text-[9px] font-medium uppercase tracking-[0.14em] text-[#b59456] underline underline-offset-2 sm:inline">Shop Now →</span>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setIsSaleCounterDismissed(true)}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 text-lg leading-none text-stone-400 transition-colors hover:text-stone-900 sm:right-3 sm:text-xl"
              aria-label="Dismiss sale counter"
            >
              ×
            </button>
          </div>
        ) : null}

        <div className="overflow-hidden border-b border-[#b69761] bg-[#b89a61]">
          <AnimatePresence mode="wait">
            <motion.p
              key={`promo-message-${promoIndex}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="px-4 py-1.5 text-center text-[10px] uppercase leading-snug tracking-[0.16em] text-[#fffaf0] sm:px-6 sm:py-2 sm:text-[11px] sm:tracking-[0.19em] lg:px-10 lg:text-[12px]"
            >
              {promoMessages[promoIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="grid h-14 w-full grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:h-16 sm:gap-6 sm:px-6 lg:grid-cols-[auto_1fr_auto] lg:gap-8 lg:px-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(false);
                setIsMenuOpen(true);
              }}
              className="inline-flex h-9 w-9 items-center justify-center text-stone-700 transition-colors hover:text-stone-950 lg:hidden"
              aria-label="Open menu"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-sidebar"
            >
              <MenuIcon />
            </button>
            <Link
              href="/"
              className="hidden font-serif text-[2rem] leading-none tracking-[0.14em] text-stone-950 lg:inline"
              aria-label="ZIVAAD home"
            >
              ZIVAAD
            </Link>
          </div>

          <div className="flex items-center justify-center justify-self-center">
            <Link
              href="/"
              className="font-serif text-[1.85rem] leading-none tracking-[0.14em] text-stone-950 sm:text-[2rem] lg:hidden"
              aria-label="ZIVAAD home"
            >
              ZIVAAD
            </Link>
            <nav className="hidden items-center justify-center gap-10 lg:flex">
              {primaryLinks.map((item) => {
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-[11px] uppercase tracking-luxury transition-opacity duration-500 ${
                      active ? 'text-stone-950' : 'text-stone-600 hover:text-stone-950'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center justify-end justify-self-end gap-2 text-stone-700 sm:gap-4">
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                setIsSearchOpen(true);
              }}
              className="inline-flex h-9 w-9 items-center justify-center text-stone-600 transition-colors hover:text-stone-950 sm:h-8 sm:w-8"
              aria-label="Open search"
            >
              <SearchIcon />
            </button>

            <button
              type="button"
              onClick={openCart}
              className="inline-flex h-9 items-center gap-1.5 text-stone-700 transition-colors hover:text-stone-950 sm:h-8 sm:gap-2"
              aria-label="Open cart"
            >
              <BagIcon />
              <span className="text-[11px] uppercase tracking-luxury">({itemCount})</span>
            </button>
          </div>
        </div>

        <div className="hidden h-10 items-center justify-between border-t border-stone-200/80 px-10 lg:flex">
          <nav className="flex items-center gap-5">
            {collectionLinks.map((item) => (
              <Link
                key={`collection-link-${item.href}`}
                href={item.href}
                className="text-[10px] uppercase tracking-luxury text-stone-600 transition-colors hover:text-stone-950"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 text-[9px] uppercase tracking-luxury text-stone-500">
            {trustUtilityItems.map((item, index) => (
              <span key={item} className="inline-flex items-center gap-3">
                <span>{item}</span>
                {index < trustUtilityItems.length - 1 ? <span className="h-2.5 w-px bg-stone-300/80" /> : null}
              </span>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {isSearchOpen ? (
            <motion.div
              initial={{ y: -28, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -18, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-0 top-full z-[93] border-b border-stone-200 bg-white"
            >
              <div className="w-full px-4 py-2.5 sm:px-6 lg:px-10 lg:py-3">
                <form className="flex items-start gap-4" onSubmit={handleSearchSubmit}>
                  <div className="relative w-full">
                    <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 pb-1.5 text-stone-400">
                      <SearchIcon />
                    </span>
                    <input
                      value={searchText}
                      onChange={(event) => setSearchText(event.target.value)}
                      placeholder="SEARCH OUR COLLECTIONS..."
                      className="w-full border-b border-stone-300/90 bg-transparent pb-1.5 pl-6 font-serif text-[17px] font-normal tracking-[0.08em] text-stone-900 placeholder:font-serif placeholder:text-[10px] placeholder:font-normal placeholder:uppercase placeholder:tracking-[0.22em] placeholder:text-stone-300 focus:border-stone-950 focus:outline-none sm:text-[18px] sm:placeholder:text-[11px]"
                      autoFocus
                      aria-label="Search products"
                    />
                  </div>
                  <button type="submit" className="sr-only" aria-label="Search">
                    Search
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(false)}
                    className="mt-1 text-2xl leading-none text-stone-700 transition-colors hover:text-stone-950"
                    aria-label="Close search"
                  >
                    ×
                  </button>
                </form>

                <div className="mt-2.5">
                  <p className="text-[10px] uppercase tracking-luxury text-stone-500">Quick Links</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 sm:gap-5">
                    {quickSearchLinks.map((link) => (
                      <Link
                        key={link.label}
                        href={link.href}
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearchText('');
                        }}
                        className="text-[11px] uppercase tracking-luxury text-stone-700 hover:text-stone-950"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="mt-3 border-t border-stone-100 pt-2.5">
                  <p className="text-[10px] uppercase tracking-luxury text-stone-500">Popular Searches</p>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-2 sm:gap-x-4">
                    {['Gold Ring', 'Crystal Earrings', 'Necklace Set', 'Bracelet', 'Hair Pin'].map((term) => (
                      <Link
                        key={term}
                        href={`/shop?q=${encodeURIComponent(term)}`}
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearchText('');
                        }}
                        className="rounded-full border border-stone-200 px-3 py-1 text-[10px] uppercase tracking-luxury text-stone-600 transition-colors hover:border-stone-400 hover:bg-stone-50 hover:text-stone-950"
                      >
                        {term}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </header>

      {isMounted
        ? createPortal(
            <AnimatePresence>
              {isMenuOpen ? (
                <>
                  <motion.button
                    type="button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsMenuOpen(false)}
                    className="fixed inset-0 z-[205] bg-black/50 backdrop-blur-[2px] lg:hidden"
                    aria-label="Close menu"
                  />
                  <motion.aside
                    id="mobile-sidebar"
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="fixed left-0 top-0 z-[210] flex h-full w-[88vw] max-w-[360px] flex-col bg-white px-5 pb-6 pt-5 shadow-[0_30px_80px_rgba(17,17,17,0.28)] lg:hidden"
                  >
                    <div className="flex items-center justify-between pb-3">
                      <p className="font-serif text-[1.75rem] leading-none tracking-[0.14em] text-stone-950">ZIVAAD</p>
                      <button
                        type="button"
                        onClick={() => setIsMenuOpen(false)}
                        className="inline-flex h-9 w-9 items-center justify-center border border-stone-200 bg-stone-50 text-[1.65rem] leading-none text-stone-700 transition-colors hover:border-stone-300 hover:bg-stone-100 hover:text-stone-950"
                        aria-label="Close menu"
                      >
                        ×
                      </button>
                    </div>
                    <div className="h-px bg-stone-200" />
                    <div className="flex-1 overflow-y-auto pb-4 pt-4">
                      <section>
                        <p className="text-[10px] uppercase tracking-luxury text-stone-400">Menu</p>
                        <nav className="mt-3 space-y-2">
                          {mobilePrimaryLinks.map((item) => {
                            const active = pathname === item.href;

                            return (
                              <Link
                                key={`sidebar-${item.href}`}
                                href={item.href}
                                onClick={() => setIsMenuOpen(false)}
                                className={`flex items-center justify-between border px-3.5 py-3 text-[11px] uppercase tracking-[0.2em] transition-colors ${
                                  active
                                    ? 'border-stone-900 bg-stone-950 text-white'
                                    : 'border-stone-200 text-stone-700 hover:border-stone-400 hover:bg-stone-50 hover:text-stone-950'
                                }`}
                              >
                                <span>{item.label}</span>
                                <span className={`text-xs ${active ? 'text-white/80' : 'text-stone-400'}`}>→</span>
                              </Link>
                            );
                          })}
                        </nav>
                      </section>

                      <section className="mt-5">
                        <p className="text-[10px] uppercase tracking-luxury text-stone-400">Collections</p>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {collectionLinks.map((item) => (
                            <Link
                              key={`sidebar-collection-${item.href}`}
                              href={item.href}
                              onClick={() => setIsMenuOpen(false)}
                              className="border border-stone-200 px-3 py-2.5 text-center text-[10px] uppercase tracking-[0.16em] text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50 hover:text-stone-950"
                            >
                              {item.label}
                            </Link>
                          ))}
                        </div>
                        <Link
                          href="/shop"
                          onClick={() => setIsMenuOpen(false)}
                          className="mt-3 block bg-stone-950 px-4 py-3 text-center text-[10px] uppercase tracking-[0.2em] text-white"
                        >
                          Shop All Collections
                        </Link>
                      </section>

                      <section className="mt-5 border border-stone-200 bg-[#fcfcfb] px-3.5 py-3">
                        <p className="text-[9px] uppercase tracking-luxury text-stone-500">Client Care</p>
                        <p className="mt-1 text-[11px] text-stone-600">COD Available · 3-5 Day Delivery · WhatsApp Support</p>
                      </section>
                    </div>
                    <div className="mt-auto border-t border-stone-200 pt-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] uppercase tracking-luxury text-stone-400">Minimal Luxury Jewelry</p>
                        <Link
                          href="/contact"
                          onClick={() => setIsMenuOpen(false)}
                          className="text-[10px] uppercase tracking-[0.16em] text-stone-600 transition-colors hover:text-stone-950"
                        >
                          Support
                        </Link>
                      </div>
                    </div>
                  </motion.aside>
                </>
              ) : null}
            </AnimatePresence>,
            document.body
          )
        : null}
    </>
  );
}
