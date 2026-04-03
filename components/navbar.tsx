'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { useCartStore } from '@/store/cart-store';

const primaryLinks = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/collection', label: 'Collections' },
  { href: '/contact', label: 'Contact' }
];

const quickSearchLinks = [
  { href: '/shop?category=rings', label: 'Rings' },
  { href: '/shop', label: 'New Arrivals' },
  { href: '/shop', label: 'Best Sellers' }
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

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [searchText, setSearchText] = useState('');

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
        <div className="bg-black">
          <div className="flex h-7 w-full items-center justify-center px-4 text-[9px] uppercase tracking-luxury text-white/90 sm:h-8 sm:px-6 sm:text-[10px] lg:px-10">
            Super Sale Up To 40% Off · Shop Now
          </div>
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

        <AnimatePresence>
          {isSearchOpen ? (
            <motion.div
              initial={{ y: -28, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -18, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-0 top-7 z-[93] border-b border-stone-200 bg-white sm:top-8"
            >
              <div className="w-full px-4 py-2.5 sm:px-6 lg:px-10 lg:py-3">
                <form className="flex items-start gap-4" onSubmit={handleSearchSubmit}>
                  <input
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder="SEARCH OUR COLLECTIONS..."
                    className="w-full border-b border-stone-300/90 bg-transparent pb-1.5 font-serif text-[17px] font-normal tracking-[0.08em] text-stone-900 placeholder:font-serif placeholder:text-[10px] placeholder:font-normal placeholder:uppercase placeholder:tracking-[0.22em] placeholder:text-stone-300 focus:border-stone-950 focus:outline-none sm:text-[18px] sm:placeholder:text-[11px]"
                    autoFocus
                    aria-label="Search products"
                  />
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
                    className="fixed left-0 top-0 z-[210] flex h-full w-[86vw] max-w-[380px] flex-col bg-white px-6 pb-7 pt-6 shadow-[0_30px_80px_rgba(17,17,17,0.28)] lg:hidden"
                  >
                    <div className="flex items-center justify-between border-b border-stone-200 pb-4">
                      <p className="font-serif text-[1.9rem] leading-none tracking-[0.14em] text-stone-950">ZIVAAD</p>
                      <button
                        type="button"
                        onClick={() => setIsMenuOpen(false)}
                        className="inline-flex h-9 w-9 items-center justify-center border border-stone-300 text-2xl leading-none text-stone-700 transition-colors hover:border-stone-950 hover:text-stone-950"
                        aria-label="Close menu"
                      >
                        ×
                      </button>
                    </div>
                    <p className="mt-4 text-[10px] uppercase tracking-luxury text-stone-400">Menu</p>
                    <nav className="mt-3 space-y-4">
                      {primaryLinks.map((item) => {
                        const active = pathname === item.href;

                        return (
                          <Link
                            key={`sidebar-${item.href}`}
                            href={item.href}
                            onClick={() => setIsMenuOpen(false)}
                            className={`block border-b pb-3 text-[12px] uppercase tracking-[0.2em] transition-colors ${
                              active
                                ? 'border-stone-950 text-stone-950'
                                : 'border-stone-300 text-stone-500 hover:border-stone-950 hover:text-stone-950'
                            }`}
                          >
                            {item.label}
                          </Link>
                        );
                      })}
                    </nav>
                    <div className="mt-auto border-t border-stone-200 pt-4">
                      <p className="text-[10px] uppercase tracking-luxury text-stone-400">Minimal Luxury Jewelry</p>
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
